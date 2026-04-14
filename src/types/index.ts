
export type Product = {
  id: string; // Firestore document ID
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category?: string; // Optional: e.g., "tools", "paint", "fasteners"
  arrivalDate?: Date; // Optional: to store the arrival date of the product
};

export type SaleItem = {
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  category?: string; 
  quantityToSell: number;
  maxQuantity: number; // Original stock quantity when added to sale list
};

// For storing in Firestore sale records
export interface SoldItemDetails {
  productId: string;
  productName: string; // Name at the time of sale
  quantitySold: number;
  priceAtSale: number; // Price per unit at the time of sale
  category?: string;
  imageUrl?: string; // Optional: if you want to display image in sales history details
}

export interface SaleRecord {
  id: string; // Firestore document ID
  saleDate: Date; // Converted from Firestore Timestamp in the app
  totalAmount: number; // Total for this specific sale transaction
  totalItems: number; // Total items in this specific sale transaction
  itemsSold: SoldItemDetails[];
  userId?: string; // ID of the user who made the purchase
}
