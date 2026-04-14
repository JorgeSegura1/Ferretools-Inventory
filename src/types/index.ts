
export type Product = {
  id: string; // Firestore document ID
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category?: string; 
  arrivalDate?: Date;
  energyRating?: 'A+++' | 'A++' | 'A' | 'B' | 'C'; // Nuevo: Clasificación energética
  isIotEnabled?: boolean; // Nuevo: Si tiene sensores de monitoreo
  iotSensorStatus?: 'online' | 'offline' | 'warning'; // Nuevo: Estado del sensor físico
};

export type SaleItem = {
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  category?: string; 
  quantityToSell: number;
  maxQuantity: number; 
};

export interface SoldItemDetails {
  productId: string;
  productName: string; 
  quantitySold: number;
  priceAtSale: number; 
  category?: string;
  imageUrl?: string; 
}

export interface SaleRecord {
  id: string; 
  saleDate: Date; 
  totalAmount: number; 
  totalItems: number; 
  itemsSold: SoldItemDetails[];
  userId?: string; 
  shippingStatus?: 'in_transit' | 'delivered' | 'processing'; // Nuevo: Seguimiento logístico
  iotTrackingUrl?: string; // Nuevo: Enlace simulado a telemetría
}
