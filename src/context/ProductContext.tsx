
"use client";

import type { Product } from '@/types';
import { db, storage } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc,
  query,
  serverTimestamp, 
  Timestamp,
  where, // Added: for querying by name
  getDocs, // Added: for executing the query
  limit // Added: to limit to one result
} from 'firebase/firestore';
import { 
  ref as storageFirebaseRef,
  uploadBytesResumable, 
  getDownloadURL,
  type FirebaseStorageError 
} from 'firebase/storage';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'userId' | 'arrivalDate'>) => Promise<void>; 
  updateProductQuantity: (productId: string, newQuantity: number) => Promise<void>; 
  getProductById: (productId: string) => Product | undefined;
  loadingProducts: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const PRODUCTS_COLLECTION = 'products';

function dataURItoBlob(dataURI: string): Blob {
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
  
  try {
    const byteString = atob(base64Data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  } catch (e) {
    console.error("Error during atob or Blob creation:", e, "Base64 data (first 50 chars):", base64Data.substring(0,50) + "...");
    throw new Error(`Error converting base64 to Blob: ${(e as Error).message}`);
  }
}

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoadingProducts(true);
    const q = query(collection(db, PRODUCTS_COLLECTION));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let arrivalDate: Date | undefined = undefined;
        if (data.arrivalDate && data.arrivalDate instanceof Timestamp) {
          arrivalDate = data.arrivalDate.toDate();
        }
        productsData.push({ 
          id: doc.id, 
          ...data,
          arrivalDate 
        } as Product);
      });
      setProducts(productsData);
      setLoadingProducts(false);
    }, (error) => {
      console.error("ProductProvider: Error fetching products from Firestore: ", error);
      let firestoreErrorMessage = "No se pudieron obtener los datos del inventario.";
      if (error && typeof error === 'object' && 'code' in error) {
        firestoreErrorMessage += ` Código: ${(error as {code: string}).code}`;
      }
      toast({
        title: "Error al cargar productos",
        description: firestoreErrorMessage,
        variant: "destructive",
      });
      setLoadingProducts(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'userId' | 'arrivalDate'>) => {
    let imageUrlToSave = productData.imageUrl;

    // Image processing logic (common for add and update)
    if (productData.imageUrl && productData.imageUrl.startsWith('data:image')) {
      toast({ title: "Procesando imagen generada...", description: "Subiendo a Firebase Storage..." });
      try {
        const blob = dataURItoBlob(productData.imageUrl);
        const imageName = `product_${Date.now()}_${productData.name.replace(/\s+/g, '_').toLowerCase()}.png`;
        const storageRefPath = `product-images/${imageName}`;
        const imageRef = storageFirebaseRef(storage, storageRefPath);
        
        const uploadTask = uploadBytesResumable(imageRef, blob);
        await uploadTask; 
        imageUrlToSave = await getDownloadURL(imageRef);
        toast({ title: "Imagen Subida", description: "La imagen generada se guardó en Storage.", variant: "default" });
      } catch (error) {
        console.error("addProduct: Error uploading image to Firebase Storage: ", error);
        let storageErrorMessage = "No se pudo guardar la imagen generada. Se usará un marcador.";
        if (error && typeof error === 'object' && 'code' in error) {
          storageErrorMessage += ` Código: ${(error as {code: string}).code}`;
        } else if (error instanceof Error) {
          storageErrorMessage += ` Detalle: ${error.message}`;
        }
        toast({ 
          title: "Error al subir imagen de IA", 
          description: storageErrorMessage, 
          variant: "destructive" 
        });
        imageUrlToSave = 'https://placehold.co/300x200.png';
      }
    } else if (!productData.imageUrl) {
      imageUrlToSave = 'https://placehold.co/300x200.png';
    }

    // Check if product already exists
    const q = query(collection(db, PRODUCTS_COLLECTION), where("name", "==", productData.name), limit(1));
    
    try {
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Product exists, update it
        const existingDoc = querySnapshot.docs[0];
        const existingProductData = existingDoc.data() as Product;
        
        const updatedProductFields = {
          name: productData.name, // In case casing or minor details changed, though query is exact
          description: productData.description,
          price: productData.price, // Update price to the new one
          quantity: (existingProductData.quantity || 0) + productData.quantity, // Sum quantities
          category: productData.category,
          imageUrl: imageUrlToSave, // Use the newly processed/determined image URL
          arrivalDate: serverTimestamp() // Update arrivalDate to mark restock/update
        };

        await updateDoc(existingDoc.ref, updatedProductFields);
        toast({ title: "Producto Actualizado", description: `"${productData.name}" actualizado: cantidad sumada y precio/detalles actualizados.`});

      } else {
        // Product does not exist, add new
        await addDoc(collection(db, PRODUCTS_COLLECTION), {
          ...productData,
          imageUrl: imageUrlToSave,
          arrivalDate: serverTimestamp()
        });
        toast({ title: "Producto Agregado", description: `"${productData.name}" se agregó exitosamente.`});
      }
    } catch (error) {
      console.error("addProduct/updateProduct: Error interacting with Firestore: ", error);
      let firestoreErrorMessage = "No se pudo guardar o actualizar el producto.";
      if (error && typeof error === 'object' && 'code' in error) {
        firestoreErrorMessage += ` Código: ${(error as {code: string}).code}`;
      } else if (error instanceof Error) {
        firestoreErrorMessage += ` Detalle: ${error.message}`;
      }
      toast({
        title: "Error en base de datos",
        description: firestoreErrorMessage,
        variant: "destructive",
      });
      throw error; // Re-throw error so AddItemForm can catch it if needed
    }
  }, [toast]);

  const updateProductQuantity = useCallback(async (productId: string, newQuantity: number) => {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    try {
      await updateDoc(productRef, {
        quantity: Math.max(0, newQuantity) // Ensure quantity doesn't go below 0
      });
      // Toast for this is handled in EditQuantityDialog
    } catch (error) {
      console.error("updateProductQuantity: Error updating product quantity in Firestore: ", error);
      let updateErrorMessage = "No se pudo actualizar la cantidad del producto.";
       if (error && typeof error === 'object' && 'code' in error) {
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

