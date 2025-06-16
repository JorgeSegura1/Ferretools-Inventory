
"use client";

import type { Product, SaleItem, SaleRecord, SoldItemDetails } from '@/types';
import { db, storage } from '@/lib/firebase';
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
  newImageUrl?: string;      // URL from form input or empty
  generateNewImage?: boolean; // From checkbox
}

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'userId' | 'arrivalDate'>) => Promise<void>; 
  updateProductQuantity: (productId: string, newQuantity: number) => Promise<void>; 
  updateProductDetails: (productId: string, data: ProductDetailsUpdateData) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  processSaleAndUpdateStock: (itemsToSell: Array<Omit<SaleItem, 'maxQuantity' | 'name' | 'imageUrl' | 'price' | 'category'> & {productId: string, quantitySold: number, priceAtSale: number, productName: string, category?: string, imageUrl?: string }>) => Promise<boolean>;
  getProductById: (productId: string) => Product | undefined;
  loadingProducts: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const PRODUCTS_COLLECTION = 'products';
const SALES_COLLECTION = 'sales';

function dataURItoBlob(dataURI: string): Blob {
  if (!dataURI.includes(',')) {
    throw new Error('Invalid data URI for blob conversion: missing comma separator.');
  }
  const [metadata, base64Data] = dataURI.split(',');
  if (!metadata || !base64Data) {
    throw new Error('Malformed data URI for blob conversion: could not split metadata and base64 data.');
  }
  const mimeString = metadata.split(':')[1]?.split(';')[0];
  if (!mimeString) {
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
      querySnapshot.forEach((docSnapshot) => { 
        const data = docSnapshot.data();
        let arrivalDate: Date | undefined = undefined;
        if (data.arrivalDate && data.arrivalDate instanceof Timestamp) {
          arrivalDate = data.arrivalDate.toDate();
        }
        
        const quantity = (typeof data.quantity === 'number' && !isNaN(data.quantity)) ? data.quantity : 0;
        const price = (typeof data.price === 'number' && !isNaN(data.price)) ? data.price : 0;

        productsData.push({ 
          id: docSnapshot.id, 
          ...data,
          quantity, 
          price,    
          arrivalDate 
        } as Product);
      });
      setProducts(productsData);
      setLoadingProducts(false);
    }, (error) => {
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
    setLoadingProducts(true);
    let imageUrlToSave = productData.imageUrl;

    if (productData.imageUrl && productData.imageUrl.startsWith('data:image')) {
      toast({ title: "Procesando imagen generada...", description: "Subiendo a Firebase Storage..." });
      try {
        const blob = dataURItoBlob(productData.imageUrl);
        const imageName = `product_${Date.now()}_${productData.name.replace(/\s+/g, '_').toLowerCase()}.png`;
        const storageRefPath = `product-images/${imageName}`;
        const imageRef = storageFirebaseRef(storage, storageRefPath);
        
        await uploadBytesResumable(imageRef, blob); 
        imageUrlToSave = await getDownloadURL(imageRef);
        toast({ title: "Imagen Subida", description: "La imagen generada se guardó en Storage.", variant: "default" });
      } catch (error) {
        let storageErrorMessage = "No se pudo guardar la imagen generada. Se usará un marcador.";
        if (error && typeof error === 'object' && 'code' in error) {
            storageErrorMessage += ` Código: ${(error as FirebaseStorageError).code}.`;
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

    const q = query(collection(db, PRODUCTS_COLLECTION), where("name", "==", productData.name), limit(1));
    
    try {
      const querySnapshot = await getDocs(q);
      const productDocRef = !querySnapshot.empty ? querySnapshot.docs[0].ref : null;
      
      if (productDocRef) {
        const existingProductData = querySnapshot.docs[0].data();
        const currentQuantity = (typeof existingProductData.quantity === 'number' && !isNaN(existingProductData.quantity)) 
                                ? existingProductData.quantity 
                                : 0;
        const newPrice = (typeof productData.price === 'number' && !isNaN(productData.price)) ? productData.price : (typeof existingProductData.price === 'number' && !isNaN(existingProductData.price) ? existingProductData.price : 0);
        const newQuantityToAdd = (typeof productData.quantity === 'number' && !isNaN(productData.quantity)) ? productData.quantity : 0;

        const updatedProductFields = {
          name: productData.name,
          description: productData.description,
          price: newPrice,
          quantity: currentQuantity + newQuantityToAdd, 
          category: productData.category,
          imageUrl: imageUrlToSave, 
          arrivalDate: serverTimestamp() 
        };
        await updateDoc(productDocRef, updatedProductFields);
        toast({ title: "Producto Actualizado", description: `"${productData.name}" actualizado: cantidad sumada y detalles actualizados.`});
      } else {
        const priceToAdd = (typeof productData.price === 'number' && !isNaN(productData.price)) ? productData.price : 0;
        const quantityToAdd = (typeof productData.quantity === 'number' && !isNaN(productData.quantity)) ? productData.quantity : 0;
        await addDoc(collection(db, PRODUCTS_COLLECTION), {
          ...productData,
          price: priceToAdd,
          quantity: quantityToAdd,
          imageUrl: imageUrlToSave,
          arrivalDate: serverTimestamp()
        });
        toast({ title: "Producto Agregado", description: `"${productData.name}" se agregó exitosamente.`});
      }
    } catch (error) {
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
      throw new Error(`Firestore error handled by context: ${firestoreErrorMessage}`);
    } finally {
      setLoadingProducts(false);
    }
  }, [toast]);

  const updateProductQuantity = useCallback(async (productId: string, newQuantity: number) => {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    try {
      const quantityToUpdate = (typeof newQuantity === 'number' && !isNaN(newQuantity)) ? Math.max(0, newQuantity) : 0;
      await updateDoc(productRef, {
        quantity: quantityToUpdate
      });
    } catch (error) {
      let updateErrorMessage = "No se pudo actualizar la cantidad del producto.";
       if (error && typeof error === 'object' && 'code' in error) {
        updateErrorMessage += ` Código: ${(error as {code: string}).code}`;
      }
      toast({
        title: "Error al actualizar cantidad",
        description: updateErrorMessage,
        variant: "destructive",
      });
      throw new Error(`Firestore error handled by context: ${updateErrorMessage}`);
    }
  }, [toast]);

  const updateProductDetails = useCallback(async (productId: string, data: ProductDetailsUpdateData) => {
    setLoadingProducts(true);
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    
    const sanitizedQuantity = (typeof data.quantity === 'number' && !isNaN(data.quantity)) ? Math.max(0, data.quantity) : 0;
    const fieldsToUpdate: { quantity: number; imageUrl?: string } = { 
        quantity: sanitizedQuantity
    };
    let finalImageUrl: string | undefined = undefined; 

    try {
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) {
        toast({ title: "Error", description: "El producto no existe.", variant: "destructive" });
        throw new Error("Product not found");
      }
      const existingProduct = productSnap.data() as Product;
      finalImageUrl = existingProduct.imageUrl; 

      if (data.generateNewImage && (!data.newImageUrl || data.newImageUrl.trim() === '')) {
        toast({ title: "Generando nueva imagen con IA...", description: "Esto puede tomar unos segundos." });
        const genOutput = await generateProductImage({ 
          productName: existingProduct.name, 
          productDescription: existingProduct.description 
        });

        if (genOutput?.imageDataUri) {
          const blob = dataURItoBlob(genOutput.imageDataUri);
          const imageName = `product_${Date.now()}_${existingProduct.name.replace(/\s+/g, '_').toLowerCase()}.png`;
          const imageFileRef = storageFirebaseRef(storage, `product-images/${imageName}`);
          await uploadBytesResumable(imageFileRef, blob);
          finalImageUrl = await getDownloadURL(imageFileRef);
          toast({ title: "Nueva imagen IA generada y subida.", variant: "default" });
        } else {
          toast({ title: "Error al generar imagen IA", description: "No se pudo generar la imagen. La imagen actual no se cambiará.", variant: "destructive" });
        }
      } else if (data.newImageUrl && data.newImageUrl.trim() !== '' && data.newImageUrl !== existingProduct.imageUrl) {
        if (data.newImageUrl.startsWith('data:image')) {
          toast({ title: "Procesando imagen data URI..." });
          const blob = dataURItoBlob(data.newImageUrl);
          const imageName = `product_${Date.now()}_${existingProduct.name.replace(/\s+/g, '_').toLowerCase()}.png`;
          const imageFileRef = storageFirebaseRef(storage, `product-images/${imageName}`);
          await uploadBytesResumable(imageFileRef, blob);
          finalImageUrl = await getDownloadURL(imageFileRef);
          toast({ title: "Imagen Data URI subida.", variant: "default" });
        } else {
          finalImageUrl = data.newImageUrl; 
        }
      }
      
      if (finalImageUrl && finalImageUrl !== existingProduct.imageUrl) {
        fieldsToUpdate.imageUrl = finalImageUrl;
      }

      if (Object.keys(fieldsToUpdate).length > 1 || fieldsToUpdate.quantity !== existingProduct.quantity || (fieldsToUpdate.imageUrl && fieldsToUpdate.imageUrl !== existingProduct.imageUrl) ) {
        await updateDoc(productRef, fieldsToUpdate);
        toast({ title: "Producto Actualizado", description: `Los detalles de "${existingProduct.name}" han sido actualizados.` });
      } else {
         toast({ title: "Sin Cambios", description: "No se especificaron cambios para el producto." });
      }

    } catch (error) {
      let updateErrorMessage = "No se pudo actualizar el producto.";
      if (error instanceof Error && error.message.startsWith("Product not found")) {
        // Already handled by toast above
      } else if (error && typeof error === 'object' && 'code' in error) {
        updateErrorMessage += ` Código: ${(error as FirebaseStorageError).code}.`;
      } else if (error instanceof Error) {
        updateErrorMessage += ` Detalle: ${error.message}`;
      }
      toast({
        title: "Error al actualizar producto",
        description: updateErrorMessage,
        variant: "destructive",
      });
      throw new Error(`Update error handled by context: ${updateErrorMessage}`);
    } finally {
      setLoadingProducts(false);
    }
  }, [toast]);

  const deleteProduct = useCallback(async (productId: string) => {
    setLoadingProducts(true);
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    try {
      await deleteDoc(productRef);
      toast({
        title: "Producto Eliminado",
        description: "El producto ha sido eliminado exitosamente del inventario.",
      });
    } catch (error) {
      let deleteErrorMessage = "No se pudo eliminar el producto.";
      if (error && typeof error === 'object' && 'code' in error) {
        deleteErrorMessage += ` Código: ${(error as {code: string}).code}`;
      }
      toast({
        title: "Error al eliminar producto",
        description: deleteErrorMessage,
        variant: "destructive",
      });
      throw new Error(`Firestore error handled by context: ${deleteErrorMessage}`);
    } finally {
      setLoadingProducts(false);
    }
  }, [toast]);

 const processSaleAndUpdateStock = useCallback(async (
    itemsToSell: Array<Omit<SaleItem, 'maxQuantity'> & { priceAtSale: number, productName: string, quantitySold: number, category?: string, imageUrl?: string }>
  ): Promise<boolean> => {
    setLoadingProducts(true);
    const batch = writeBatch(db);
    let successfulProcessing = true;
    let errorMessage = "No se pudo completar la venta debido a un error desconocido.";

    const saleRecordItems: SoldItemDetails[] = [];
    let saleTotalAmount = 0;
    let saleTotalItems = 0;

    try {
      for (const item of itemsToSell) {
        const quantityForSale = (typeof item.quantitySold === 'number' && !isNaN(item.quantitySold)) ? item.quantitySold : 0;
        
        if (quantityForSale <= 0) {
           // This item will be skipped, not an error for the whole sale unless all items are like this
          continue; 
        }

        const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          errorMessage = `Producto "${item.productName}" (ID: ${item.productId}) no encontrado en el inventario.`;
          successfulProcessing = false;
          break;
        }

        const currentProductData = productSnap.data();
        const currentQuantity = (typeof currentProductData.quantity === 'number' && !isNaN(currentProductData.quantity)) 
                                ? currentProductData.quantity 
                                : 0;

        if (currentQuantity < quantityForSale) {
          errorMessage = `Stock insuficiente para "${item.productName}". Disponible: ${currentQuantity}, Solicitado: ${quantityForSale}.`;
          successfulProcessing = false;
          break;
        }
        const newQuantity = currentQuantity - quantityForSale;
        batch.update(productRef, { quantity: newQuantity });
        
        const priceForSale = (typeof item.priceAtSale === 'number' && !isNaN(item.priceAtSale)) ? item.priceAtSale : 0;

        const soldItem: SoldItemDetails = {
          productId: item.productId,
          productName: item.productName || 'Nombre Desconocido', 
          quantitySold: quantityForSale,
          priceAtSale: priceForSale,
        };
        if (item.category) {
          soldItem.category = item.category;
        }
        if (item.imageUrl) { 
          soldItem.imageUrl = item.imageUrl;
        }
        saleRecordItems.push(soldItem);
        
        saleTotalAmount += priceForSale * quantityForSale;
        saleTotalItems += quantityForSale;
      }

      if (successfulProcessing) {
        if (saleRecordItems.length > 0) {
            await batch.commit(); // Commit product quantity updates
            
            await addDoc(collection(db, SALES_COLLECTION), {
              saleDate: serverTimestamp(),
              totalAmount: saleTotalAmount,
              totalItems: saleTotalItems,
              itemsSold: saleRecordItems,
            });
            
            toast({
              title: "🎉 Compra Exitosa 🎉",
              description: "El stock de los productos ha sido actualizado y la venta registrada.",
            });
            return true;
        } else {
            // This means all items were skipped (e.g., quantityForSale was 0 for all)
            toast({
                title: "Venta No Procesada",
                description: "No se seleccionaron artículos válidos o cantidades para la venta.",
                variant: "default",
            });
            return false;
        }
      } else {
        // successfulProcessing is false, an error occurred in the loop (e.g., stock issue, product not found)
        toast({
          title: "Error en la Venta",
          description: errorMessage, // This should now hold the specific error message
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      // This catch block handles errors from batch.commit() or addDoc()
      let firestoreErrorMessage = "Error crítico al procesar la venta.";
      if (error && typeof error === 'object' && 'code' in error) {
        firestoreErrorMessage += ` Código: ${(error as {code: string}).code}.`;
      } else if (error instanceof Error) {
        firestoreErrorMessage += ` Detalle: ${error.message}`;
      }
      toast({
        title: "Error Crítico en Venta",
        description: firestoreErrorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoadingProducts(false);
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

    