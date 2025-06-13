
"use client";

import type { Product } from '@/types';
import { db } from '@/lib/firebase'; // Import Firestore instance
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp // Optional: for timestamps
} from 'firebase/firestore';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext'; // To associate products with users (optional future step)
import { useToast } from '@/hooks/use-toast';
import { mockProducts } from '@/data/mock-products'; // Keep for potential one-time seeding


interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'userId'>) => Promise<void>; // Modified to be async
  updateProductQuantity: (productId: string, newQuantity: number) => Promise<void>; // Modified to be async
  getProductById: (productId: string) => Product | undefined;
  loadingProducts: boolean;
  seedInitialData?: () => Promise<void>; // Optional: for seeding mock data
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const PRODUCTS_COLLECTION = 'products';

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const { user } = useAuth(); // Get current user
  const { toast } = useToast();

  // Fetch products from Firestore
  useEffect(() => {
    setLoadingProducts(true);
    // For now, we load all products. 
    // Later, you might want to filter by userId if products are user-specific.
    // const q = query(collection(db, PRODUCTS_COLLECTION), where("userId", "==", user.uid));
    // For a public catalog, you might not filter by user ID.
    // Let's start by loading all products in the 'products' collection.
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

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [toast]); // Removed user from dependency array for now to load all products

  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'userId'>) => {
    // if (!user) {
    //   toast({ title: "No autenticado", description: "Debes iniciar sesión para agregar productos.", variant: "destructive" });
    //   return;
    // }
    try {
      const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
        ...productData,
        // userId: user.uid, // Optional: associate product with user
        // createdAt: serverTimestamp() // Optional: add a server timestamp
      });
      // No need to setProducts here, onSnapshot will handle it
      toast({ title: "Producto Agregado", description: `"${productData.name}" se agregó exitosamente.`});
    } catch (error) {
      console.error("Error adding product to Firestore: ", error);
      toast({
        title: "Error al agregar producto",
        description: "No se pudo guardar el producto en la base de datos.",
        variant: "destructive",
      });
    }
  }, [toast]); // Removed user from dependency array

  const updateProductQuantity = useCallback(async (productId: string, newQuantity: number) => {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    try {
      await updateDoc(productRef, {
        quantity: Math.max(0, newQuantity)
      });
      // No need to setProducts here, onSnapshot will handle it
      // toast({ title: "Inventario Actualizado", description: `Cantidad actualizada.`}); // Toast can be redundant if UI updates quickly
    } catch (error) {
      console.error("Error updating product quantity in Firestore: ", error);
      toast({
        title: "Error al actualizar cantidad",
        description: "No se pudo actualizar el producto en la base de datos.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const getProductById = useCallback((productId: string) => {
    return products.find(p => p.id === productId);
  }, [products]);

  // Optional: Function to seed mockProducts to Firestore if the collection is empty
  // This is a basic example; you might want more robust checks in a real app.
  const seedInitialData = useCallback(async () => {
    if (!user) {
        toast({ title: "No autenticado", description: "Debes iniciar sesión para cargar datos iniciales.", variant: "destructive"});
        return;
    }
    setLoadingProducts(true);
    try {
        const q = query(collection(db, PRODUCTS_COLLECTION));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            const batch = writeBatch(db);
            mockProducts.forEach(product => {
                const { id, ...productData } = product; // Firestore will generate ID
                const docRef = doc(collection(db, PRODUCTS_COLLECTION)); // Create new doc ref
                batch.set(docRef, {
                    ...productData,
                    // userId: user.uid // Assign to current user
                });
            });
            await batch.commit();
            toast({ title: "Datos Iniciales Cargados", description: "Los productos de ejemplo se han cargado."});
        } else {
            toast({ title: "Base de Datos no Vacía", description: "Los datos iniciales ya existen o la colección no está vacía."});
        }
    } catch (error) {
        console.error("Error seeding initial data: ", error);
        toast({ title: "Error al Cargar Datos Iniciales", description: String(error), variant: "destructive"});
    } finally {
        setLoadingProducts(false);
    }
  }, [toast, user]);


  return (
    <ProductContext.Provider value={{ products, addProduct, updateProductQuantity, getProductById, loadingProducts /*, seedInitialData */ }}>
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

