
"use client";

import type { Product } from '@/types';
import { db, storage } from '@/lib/firebase'; // Import Firestore instance AND storage
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc,
  query,
  // where, // No longer used for simple product list
  // getDocs, // No longer used for seeding logic here
  // writeBatch, // No longer used for seeding logic here
  // serverTimestamp // Optional: for timestamps
} from 'firebase/firestore';
import { 
  ref as storageFirebaseRef, // Alias ref from storage to avoid conflict with React.ref
  uploadBytesResumable, 
  getDownloadURL,
  type FirebaseStorageError 
} from 'firebase/storage';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
// import { useAuth } from './AuthContext'; // Not directly used in current product logic
import { useToast } from '@/hooks/use-toast';
// import { mockProducts } from '@/data/mock-products'; // Keep for potential one-time seeding


interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'userId'>) => Promise<void>; 
  updateProductQuantity: (productId: string, newQuantity: number) => Promise<void>; 
  getProductById: (productId: string) => Product | undefined;
  loadingProducts: boolean;
  // seedInitialData?: () => Promise<void>; // Optional: for seeding mock data
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const PRODUCTS_COLLECTION = 'products';

// Helper function to convert data URI to Blob
function dataURItoBlob(dataURI: string): Blob {
  // console.log("Attempting to convert data URI (first 100 chars):", dataURI.substring(0,100) + "...");
  if (!dataURI.includes(',')) {
    console.error("Invalid data URI string for blob conversion (missing comma):", dataURI.substring(0,100) + "...");
    throw new Error('Invalid data URI for blob conversion: missing comma separator.');
  }
  const [metadata, base64Data] = dataURI.split(',');
  if (!metadata || !base64Data) {
    console.error("Malformed data URI string for blob conversion (split error):", dataURI.substring(0,100) + "...");
    throw new Error('Malformed data URI for blob conversion: could not split metadata and base64 data.');
  }
  const mimeString = metadata.split(':')[1]?.split(';')[0];
  if (!mimeString) {
    console.error("Could not extract mimeType from data URI metadata:", metadata);
    throw new Error('Could not extract mimeType from data URI metadata.');
  }
  
  // console.log("Extracted mimeType:", mimeString);

  try {
    const byteString = atob(base64Data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    // console.log("Blob conversion successful.");
    return new Blob([ab], { type: mimeString });
  } catch (e) {
    console.error("Error during atob or Blob creation:", e, "Base64 data (first 50 chars):", base64Data.substring(0,50) + "...");
    throw new Error(`Error converting base64 to Blob: ${(e as Error).message}`);
  }
}

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  // const { user } = useAuth(); 
  const { toast } = useToast();

  useEffect(() => {
    setLoadingProducts(true);
    // console.log("ProductProvider: Setting up Firestore listener...");
    const q = query(collection(db, PRODUCTS_COLLECTION));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      // console.log("ProductProvider: Firestore snapshot received.");
      const productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(productsData);
      setLoadingProducts(false);
      // console.log("ProductProvider: Products loaded and state updated.", productsData.length, "items");
    }, (error) => {
      console.error("ProductProvider: Error fetching products from Firestore: ", error);
      toast({
        title: "Error al cargar productos",
        description: `No se pudieron obtener los datos. Código: ${(error as FirebaseStorageError).code || 'Desconocido'}`,
        variant: "destructive",
      });
      setLoadingProducts(false);
    });

    return () => {
      // console.log("ProductProvider: Unsubscribing from Firestore listener.");
      unsubscribe();
    }
  }, [toast]);

  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'userId'>) => {
    // console.log("addProduct: Called with productData:", productData.name);
    let imageUrlToSave = productData.imageUrl;

    if (productData.imageUrl && productData.imageUrl.startsWith('data:image')) {
      // console.log("addProduct: Image is a data URI. Attempting to upload to Firebase Storage.");
      toast({ title: "Procesando imagen generada...", description: "Subiendo a Firebase Storage. Esto puede tomar unos momentos." });
      try {
        // console.log("addProduct: Converting data URI to Blob...");
        const blob = dataURItoBlob(productData.imageUrl);
        // console.log("addProduct: Blob created, MimeType:", blob.type, "Size:", blob.size);
        const imageName = `product_${Date.now()}_${productData.name.replace(/\s+/g, '_').toLowerCase()}.png`;
        const storageRefPath = `product-images/${imageName}`;
        // console.log("addProduct: Storage path:", storageRefPath);
        const imageRef = storageFirebaseRef(storage, storageRefPath);
        
        // console.log("addProduct: Starting uploadBytesResumable...");
        const uploadTask = uploadBytesResumable(imageRef, blob);
        
        // console.log("addProduct: Awaiting uploadTask completion...");
        await uploadTask; 
        // console.log("addProduct: Upload task completed.");
        
        // console.log("addProduct: Getting download URL...");
        imageUrlToSave = await getDownloadURL(imageRef);
        // console.log("addProduct: Download URL obtained:", imageUrlToSave);
        toast({ title: "Imagen Subida", description: "La imagen generada por IA se ha guardado correctamente en Storage.", variant: "default" });
      } catch (error) {
        console.error("addProduct: Error uploading image to Firebase Storage: ", error);
        let storageErrorMessage = "No se pudo guardar la imagen. Se usará un marcador.";
        if (typeof error === 'object' && error !== null && 'code' in error && typeof (error as {code: string}).code === 'string') {
          storageErrorMessage += ` Código: ${(error as {code: string}).code}`;
        } else if (error instanceof Error) {
          storageErrorMessage += ` Detalle: ${error.message}`;
        }
        toast({ 
          title: "Error al subir imagen de IA", 
          description: storageErrorMessage, 
          variant: "destructive" 
        });
        imageUrlToSave = 'https://placehold.co/300x200.png'; // Fallback
      }
    } else {
      // console.log("addProduct: Image is not a data URI or no image URL provided. Using:", imageUrlToSave || "No image URL");
    }

    try {
      // console.log("addProduct: Attempting to add document to Firestore with imageUrl:", imageUrlToSave);
      await addDoc(collection(db, PRODUCTS_COLLECTION), {
        ...productData,
        imageUrl: imageUrlToSave,
        // userId: user?.uid, // Optional: associate product with user
        // createdAt: serverTimestamp() // Optional: add a server timestamp
      });
      // console.log("addProduct: Document added to Firestore successfully for product:", productData.name);
      toast({ title: "Producto Agregado", description: `"${productData.name}" se agregó exitosamente.`});
    } catch (error) {
      console.error("addProduct: Error adding product to Firestore: ", error);
      let firestoreErrorMessage = "No se pudo guardar el producto en la base de datos.";
      if (typeof error === 'object' && error !== null && 'code' in error && typeof (error as {code: string}).code === 'string') {
        firestoreErrorMessage += ` Código: ${(error as {code: string}).code}`;
      } else if (error instanceof Error) {
        firestoreErrorMessage += ` Detalle: ${error.message}`;
      }
      toast({
        title: "Error al agregar producto",
        description: firestoreErrorMessage,
        variant: "destructive",
      });
      throw error; // Re-throw to be caught by AddItemForm or other callers
    }
  }, [toast]);

  const updateProductQuantity = useCallback(async (productId: string, newQuantity: number) => {
    // console.log(`updateProductQuantity: Updating product ${productId} to quantity ${newQuantity}`);
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    try {
      await updateDoc(productRef, {
        quantity: Math.max(0, newQuantity) // Ensure quantity is not negative
      });
      // console.log(`updateProductQuantity: Product ${productId} quantity updated successfully.`);
      // Toast for quantity update is handled in EditQuantityDialog for better UX
    } catch (error) {
      console.error("updateProductQuantity: Error updating product quantity in Firestore: ", error);
      let updateErrorMessage = "No se pudo actualizar el producto.";
      if (typeof error === 'object' && error !== null && 'code' in error && typeof (error as {code: string}).code === 'string') {
        updateErrorMessage += ` Código: ${(error as {code: string}).code}`;
      } else if (error instanceof Error) {
        updateErrorMessage += ` Detalle: ${error.message}`;
      }
      toast({
        title: "Error al actualizar cantidad",
        description: updateErrorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  const getProductById = useCallback((productId: string) => {
    // console.log(`getProductById: Searching for product with ID: ${productId}`);
    return products.find(p => p.id === productId);
  }, [products]);

  // console.log("ProductProvider: Initializing with loadingProducts:", loadingProducts, "Products count:", products.length);

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProductQuantity, getProductById, loadingProducts }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
