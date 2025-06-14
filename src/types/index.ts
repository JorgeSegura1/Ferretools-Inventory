
export type Product = {
  id: string; // Firestore document ID
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category?: string; // Optional: e.g., "tools", "paint", "fasteners"
  arrivalDate?: Date; // Optional: to store the arrival date of the product
  // userId?: string; // Optional: to associate product with a user
};
