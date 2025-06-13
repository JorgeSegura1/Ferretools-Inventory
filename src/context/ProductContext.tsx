"use client";

import type { Product } from '@/types';
import { mockProducts } from '@/data/mock-products';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProductQuantity: (productId: string, newQuantity: number) => void;
  getProductById: (productId: string) => Product | undefined;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(mockProducts);

  const addProduct = useCallback((productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(), // Simple ID generation
    };
    console.log("Adding new product:", newProduct); // Added console log
    setProducts((prevProducts) => [...prevProducts, newProduct]);
  }, []);

  const updateProductQuantity = useCallback((productId: string, newQuantity: number) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.id === productId ? { ...p, quantity: Math.max(0, newQuantity) } : p
      )
    );
  }, []);

  const getProductById = useCallback((productId: string) => {
    return products.find(p => p.id === productId);
  }, [products]);

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProductQuantity, getProductById }}>
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
