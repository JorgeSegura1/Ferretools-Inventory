export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category?: string; // Optional: e.g., "tools", "paint", "fasteners"
};
