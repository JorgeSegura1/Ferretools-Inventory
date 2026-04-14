
"use client";

import type { Product, SaleItem, SaleRecord, SoldItemDetails } from '@/types';
import { db, storage, auth } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  serverTimestamp,
  Timestamp,
  where,
  getDocs,
  limit,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import {
  ref as storageFirebaseRef,
  uploadBytesResumable,
  getDownloadURL,
  type FirebaseStorageError
} from 'firebase/storage';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateProductImage } from '@/ai/flows/generate-product-image-flow';

interface ProductDetailsUpdateData {
  quantity: number;
  newImageUrl?: string;      
  generateNewImage?: boolean; 
}

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'arrivalDate'>) => Promise<void>;
  updateProductQuantity: (productId: string, newQuantity: number) => Promise<void>;
  updateProductDetails: (productId: string, data: ProductDetailsUpdateData) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  processSaleAndUpdateStock: (itemsToSell: Array<Omit<SaleItem, 'maxQuantity'> & {productId: string, quantitySold: number, priceAtSale: number, productName: string, category?: string, imageUrl?: string }>) => Promise<boolean>;
  getProductById: (productId: string) => Product | undefined;
  loadingProducts: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const PRODUCTS_COLLECTION = 'products';
const SALES_COLLECTION = 'sales';

function dataURItoBlob(dataURI: string): Blob {
  if (!dataURI.includes(',')) {
    throw new Error('Invalid data URI');
  }
  const [metadata, base64Data] = dataURI.split(',');
  const mimeString = metadata.split(':')[1]?.split(';')[0];
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
  const { toast } = useToast();

  useEffect(() => {
    setLoadingProducts(true);
    const q = query(collection(db, PRODUCTS_COLLECTION));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData: Product[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        let arrivalDate: Date | undefined = undefined;
        if (data.arrivalDate && data.arrivalDate instanceof Timestamp) {
          arrivalDate = data.arrivalDate.toDate();
        }

        productsData.push({
          id: docSnapshot.id,
          ...data,
          quantity: data.quantity || 0,
          price: data.price || 0,
          arrivalDate
        } as Product);
      });
      setProducts(productsData);
      setLoadingProducts(false);
    }, (error) => {
      console.error(error);
      setLoadingProducts(false);
    });

    return () => unsubscribe();
  }, []);

  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'arrivalDate'>) => {
    setLoadingProducts(true);
    let imageUrlToSave = productData.imageUrl;

    if (productData.imageUrl?.startsWith('data:image')) {
      try {
        const blob = dataURItoBlob(productData.imageUrl);
        const imageName = `product_${Date.now()}.png`;
        const imageRef = storageFirebaseRef(storage, `product-images/${imageName}`);
        await uploadBytesResumable(imageRef, blob);
        imageUrlToSave = await getDownloadURL(imageRef);
      } catch (error) {
        console.error(error);
        imageUrlToSave = 'https://placehold.co/300x200.png';
      }
    }

    try {
      await addDoc(collection(db, PRODUCTS_COLLECTION), {
        ...productData,
        imageUrl: imageUrlToSave,
        arrivalDate: serverTimestamp()
      });
      toast({ title: "Producto Agregado" });
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProducts(false);
    }
  }, [toast]);

  const updateProductQuantity = useCallback(async (productId: string, newQuantity: number) => {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    try {
      await updateDoc(productRef, { quantity: newQuantity });
    } catch (error) {
      console.error(error);
    }
  }, []);

  const updateProductDetails = useCallback(async (productId: string, data: ProductDetailsUpdateData) => {
    setLoadingProducts(true);
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    try {
      let imageUrl = data.newImageUrl;
      if (data.generateNewImage) {
        const productSnap = await getDoc(productRef);
        const product = productSnap.data();
        const genOutput = await generateProductImage({
          productName: product?.name || '',
          productDescription: product?.description || ''
        });
        if (genOutput?.imageDataUri) {
          const blob = dataURItoBlob(genOutput.imageDataUri);
          const imageName = `product_${Date.now()}.png`;
          const imageFileRef = storageFirebaseRef(storage, `product-images/${imageName}`);
          await uploadBytesResumable(imageFileRef, blob);
          imageUrl = await getDownloadURL(imageFileRef);
        }
      }

      const updateData: any = { quantity: data.quantity };
      if (imageUrl) updateData.imageUrl = imageUrl;

      await updateDoc(productRef, updateData);
      toast({ title: "Producto Actualizado" });
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProducts(false);
    }
  }, [toast]);

  const deleteProduct = useCallback(async (productId: string) => {
    try {
      await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
      toast({ title: "Producto Eliminado" });
    } catch (error) {
      console.error(error);
    }
  }, [toast]);

  const processSaleAndUpdateStock = useCallback(async (itemsToSell: any[]): Promise<boolean> => {
    setLoadingProducts(true);
    const batch = writeBatch(db);
    const saleRecordItems: SoldItemDetails[] = [];
    let saleTotalAmount = 0;
    let saleTotalItems = 0;
    const currentUserId = auth.currentUser?.uid || null;

    try {
      for (const item of itemsToSell) {
        const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) continue;

        const currentStock = productSnap.data().quantity || 0;
        batch.update(productRef, { quantity: currentStock - item.quantitySold });

        saleRecordItems.push({
          productId: item.productId,
          productName: item.productName,
          quantitySold: item.quantitySold,
          priceAtSale: item.priceAtSale,
          imageUrl: item.imageUrl?.startsWith('data:') ? null : item.imageUrl
        });

        saleTotalAmount += item.priceAtSale * item.quantitySold;
        saleTotalItems += item.quantitySold;
      }

      await batch.commit();
      await addDoc(collection(db, SALES_COLLECTION), {
        saleDate: serverTimestamp(),
        totalAmount: saleTotalAmount,
        totalItems: saleTotalItems,
        itemsSold: saleRecordItems,
        userId: currentUserId,
      });

      toast({ title: "Compra Realizada" });
      setLoadingProducts(false);
      return true;
    } catch (error) {
      console.error(error);
      setLoadingProducts(false);
      return false;
    }
  }, [toast]);

  const getProductById = useCallback((productId: string) => {
    return products.find(p => p.id === productId);
  }, [products]);

  return (
    <ProductContext.Provider value={{
      products,
      addProduct,
      updateProductQuantity,
      updateProductDetails,
      deleteProduct,
      processSaleAndUpdateStock,
      getProductById,
      loadingProducts
    }}>
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
