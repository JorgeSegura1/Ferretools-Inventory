
import type { Product } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlusCircle, MinusCircle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  role?: 'admin' | 'user' | null;
  onSelectForSale?: (product: Product) => void;
  onRemoveFromSale?: (productId: string) => void;
  isProductInSale?: (productId: string) => boolean;
}

function getProductHint(category?: string): string {
  if (category) {
    const words = category.split(' ').filter(Boolean);
    if (words.length === 0) return 'hardware tool';
    if (words.length === 1) return words[0];
    return words.slice(0, 2).join(' ');
  }
  return 'hardware tool';
}

export default function ProductCard({ 
  product, 
  role, 
  onSelectForSale, 
  onRemoveFromSale,
  isProductInSale 
}: ProductCardProps) {
  const isOutOfStock = product.quantity === 0;
  const productIsSelectedForSale = isProductInSale ? isProductInSale(product.id) : false;

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (onSelectForSale && product.quantity > 0 && !productIsSelectedForSale) {
      onSelectForSale(product);
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveFromSale && productIsSelectedForSale) {
      onRemoveFromSale(product.id);
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0 relative">
        <div className="aspect-video relative w-full">
          <Image
            src={product.imageUrl}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={getProductHint(product.category)}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="destructive" className="text-md sm:text-lg px-3 sm:px-4 py-1 sm:py-2 transform rotate-[-15deg] font-bold">
                AGOTADO
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 flex-grow">
        <CardTitle className="text-base sm:text-lg font-headline mb-1">
          {product.name}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-3 min-h-[calc(3*1.25rem*1.4)] sm:min-h-[calc(3*1.4rem*1.4)]">
          {product.description}
        </CardDescription>
        <p className="text-md sm:text-lg font-semibold text-primary mb-1">
          {product.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-0 flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-center gap-2">
        <Badge variant={isOutOfStock ? 'secondary' : 'default'} className={cn("text-xs text-center sm:text-left", isOutOfStock ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
          {isOutOfStock ? 'No disponible' : `Disponible: ${product.quantity}`}
        </Badge>
        {role === 'admin' && !isOutOfStock && onSelectForSale && onRemoveFromSale && isProductInSale && (
          <div className="w-full sm:w-auto">
            {productIsSelectedForSale ? (
              <Button variant="outline" size="sm" onClick={handleRemoveClick} className="text-xs w-full">
                <MinusCircle className="mr-1 h-3.5 w-3.5" /> Quitar
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={handleSelectClick} className="text-xs w-full">
                <PlusCircle className="mr-1 h-3.5 w-3.5" /> Vender
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
