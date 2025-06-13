
import type { Product } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

function getProductHint(category?: string): string {
  if (category) {
    const words = category.split(' ');
    if (words.length === 1) return words[0];
    return words.slice(0, 2).join(' ');
  }
  return 'hardware tool'; // Default hint
}

export default function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.quantity === 0;

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
              <Badge variant="destructive" className="text-lg px-4 py-2 transform rotate-[-15deg] font-bold">
                AGOTADO
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-headline mb-1">{product.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-2 h-10 overflow-hidden">
          {product.description}
        </CardDescription>
        <p className="text-lg font-semibold text-primary mb-1">
          ${product.price.toFixed(2)}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Badge variant={isOutOfStock ? 'secondary' : 'default'} className={cn(isOutOfStock ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
          {isOutOfStock ? 'No disponible' : `Disponible: ${product.quantity}`}
        </Badge>
      </CardFooter>
    </Card>
  );
}
