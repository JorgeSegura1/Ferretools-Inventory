
import type { Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductListProps {
  products: Product[];
  role?: 'admin' | 'user' | null;
  onSelectForSale?: (product: Product) => void;
  onRemoveFromSale?: (productId: string) => void;
  isProductInSale?: (productId: string) => boolean;
}

export default function ProductList({ 
  products, 
  role, 
  onSelectForSale,
  onRemoveFromSale,
  isProductInSale 
}: ProductListProps) {
  if (products.length === 0) {
    return <p className="text-center text-muted-foreground">No hay productos que coincidan con tu búsqueda.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          role={role}
          onSelectForSale={onSelectForSale}
          onRemoveFromSale={onRemoveFromSale}
          isProductInSale={isProductInSale}
        />
      ))}
    </div>
  );
}

