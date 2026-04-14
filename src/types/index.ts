
export type Product = {
  id: string; 
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category?: string; 
  arrivalDate?: Date;
  energyRating?: 'A+++' | 'A++' | 'A' | 'B' | 'C'; 
  isIotEnabled?: boolean; 
  iotSensorStatus?: 'online' | 'offline' | 'warning'; 
};

export type UserProfile = {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  createdAt?: Date;
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
  shippingStatus?: 'in_transit' | 'delivered' | 'processing'; 
  iotTrackingUrl?: string; 
}
