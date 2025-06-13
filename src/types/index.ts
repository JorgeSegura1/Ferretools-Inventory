
export type Product = {
  id: string; // Firestore document ID
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category?: string; // Optional: e.g., "tools", "paint", "fasteners"
  // userId?: string; // Optional: to associate product with a user
  // createdAt?: any; // Optional: for Firestore serverTimestamp
};

