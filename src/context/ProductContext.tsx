
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
  getDownloadURL 
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
  if (!dataURI.includes(',')) {
    console.error("Invalid data URI string for blob conversion:", dataURI.substring(0,100) + "...");
    throw new Error('Invalid data URI for blob conversion');
  }
  const [metadata, base64Data] = dataURI.split(',');
  if (!metadata || !base64Data) {
    console.error("Malformed data URI string for blob conversion:", dataURI.substring(0,100) + "...");
    throw new Error('Malformed data URI for blob conversion');
  }
  const mimeString = metadata.split(':')[1]?.split(';')[0];
  if (!mimeString) {
    console.error("Could not extract mimeType from data URI:", metadata);
    throw new Error('Could not extract mimeType from data URI');
  }
  
  const byteString = atob(base64Data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  // const { user } = useAuth(); 
  const { toast } = useToast();

  useEffect(() => {
    setLoadingProducts(true);
    const q = query(collection(db, PRODUCTS_COLLECTION));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(productsData);
      setLoadingProducts(false);
    }, (error) => {
      console.error("Error fetching products from Firestore: ", error);
      toast({
        title: "Error al cargar productos",
        description: "No se pudieron obtener los datos de la base de datos.",
        variant: "destructive",
      });
      setLoadingProducts(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'userId'>) => {
    let imageUrlToSave = productData.imageUrl;
    console.log("[ProductContext] addProduct called. Initial imageUrl:", productData.imageUrl ? productData.imageUrl.substring(0, 30) + "..." : "empty");

    if (productData.imageUrl && productData.imageUrl.startsWith('data:image')) {
      toast({ title: "Procesando imagen generada...", description: "Subiendo a Firebase Storage. Esto puede tomar unos momentos." });
      console.log("[ProductContext] Attempting to upload Base64 image to Firebase Storage...");
      try {
        const blob = dataURItoBlob(productData.imageUrl);
        const imageName = `product_${Date.now()}_${productData.name.replace(/\s+/g, '_').toLowerCase()}.png`;
        const storageRefPath = `product-images/${imageName}`;
        const imageRef = storageFirebaseRef(storage, storageRefPath);
        console.log("[ProductContext] Storage ref created:", storageRefPath);

        const uploadTask = uploadBytesResumable(imageRef, blob);
        console.log("[ProductContext] Upload task started. Waiting for upload to complete...");
        
        await uploadTask; 
        console.log("[ProductContext] Image upload to Firebase Storage completed.");
        
        imageUrlToSave = await getDownloadURL(imageRef);
        console.log("[ProductContext] Download URL obtained:", imageUrlToSave);
        toast({ title: "Imagen Subida", description: "La imagen generada por IA se ha guardado correctamente en Storage.", variant: "default" });
      } catch (error) {
        const err = error as Error;
        console.error("[ProductContext] Error uploading image to Firebase Storage: ", err);
        toast({ title: "Error al subir imagen de IA", description: `No se pudo guardar la imagen. Se usará un marcador. Detalle: ${err.message}`, variant: "destructive" });
        imageUrlToSave = 'https://placehold.co/300x200.png'; // Fallback
      }
    } else {
      console.log("[ProductContext] Using provided imageUrl or placeholder, not uploading to Storage:", imageUrlToSave);
    }

    console.log("[ProductContext] Attempting to add document to Firestore with imageUrl:", imageUrlToSave ? imageUrlToSave.substring(0, 50) + "..." : "empty");
    try {
      await addDoc(collection(db, PRODUCTS_COLLECTION), {
        ...productData,
        imageUrl: imageUrlToSave,
        // userId: user?.uid, // Optional: associate product with user
        // createdAt: serverTimestamp() // Optional: add a server timestamp
      });
      console.log("[ProductContext] Document added to Firestore successfully.");
      toast({ title: "Producto Agregado", description: `"${productData.name}" se agregó exitosamente.`});
    } catch (error) {
      const err = error as Error;
      console.error("[ProductContext] Error adding product to Firestore: ", err);
      toast({
        title: "Error al agregar producto",
        description: `No se pudo guardar el producto en la base de datos. Detalle: ${err.message}`,
        variant: "destructive",
      });
      throw error; 
    }
  }, [toast]);

  const updateProductQuantity = useCallback(async (productId: string, newQuantity: number) => {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    try {
      await updateDoc(productRef, {
        quantity: Math.max(0, newQuantity)
      });
    } catch (error) {
      const err = error as Error;
      console.error("[ProductContext] Error updating product quantity in Firestore: ", err);
      toast({
        title: "Error al actualizar cantidad",
        description: `No se pudo actualizar el producto. Detalle: ${err.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const getProductById = useCallback((productId: string) => {
    return products.find(p => p.id === productId);
  }, [products]);

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

