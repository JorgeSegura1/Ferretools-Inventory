
import type { Product } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle, ShieldCheck, Zap, Radio } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ProductCardProps {
  product: Product;
  role?: 'admin' | 'user' | null;
  onSelectForSale?: (product: Product) => void;
  onRemoveFromSale?: (productId: string) => void;
  isProductInSale?: (productId: string) => boolean;
}

export default function ProductCard({ 
  product, 
  role, 
  onSelectForSale, 
  onRemoveFromSale,
  isProductInSale 
}: ProductCardProps) {
  const { user } = useAuth();
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
    <Card className="glass-card flex flex-col h-full overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:border-primary/50 group">
      <CardHeader className="p-0 relative">
        <div className="aspect-[4/3] relative w-full overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            data-ai-hint="industrial product"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-60" />
          
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.energyRating && (
              <Badge className="bg-green-500/80 backdrop-blur-md border-none text-[9px] font-black">
                <Zap className="h-2.5 w-2.5 mr-1" /> {product.energyRating}
              </Badge>
            )}
            {product.isIotEnabled && (
              <Badge className="bg-blue-500/80 backdrop-blur-md border-none text-[9px] font-black">
                <Radio className="h-2.5 w-2.5 mr-1" /> IoT READY
              </Badge>
            )}
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center">
              <Badge variant="destructive" className="uppercase tracking-tighter font-bold text-xs py-1">
                Agotado
              </Badge>
            </div>
          )}
          <Badge variant="secondary" className="absolute top-3 right-3 bg-background/50 backdrop-blur-md text-[10px] border-none uppercase tracking-widest">
            {product.category || 'General'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 flex-grow">
        <div className="flex items-center gap-1 mb-2 text-primary">
           <ShieldCheck className="h-3 w-3" />
           <span className="text-[10px] font-bold uppercase tracking-wider">Garantía Premium</span>
        </div>
        <CardTitle className="text-lg font-bold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/80 mb-4 line-clamp-3 leading-relaxed min-h-[3rem] sm:min-h-[3.75rem]">
          {product.description}
        </CardDescription>
        <div className="flex items-baseline gap-1">
           <span className="text-2xl font-black text-white">
            {product.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-muted-foreground font-semibold">COP</span>
        </div>
      </CardContent>
      <CardFooter className="p-5 pt-0 flex flex-col gap-3">
        <div className="flex items-center justify-between w-full">
           <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
            {isOutOfStock ? '0 Unidades' : `${product.quantity} Disponibles`}
          </Badge>
        </div>
        {user && !isOutOfStock && onSelectForSale && (
          <Button 
            variant={productIsSelectedForSale ? "secondary" : "default"} 
            size="sm" 
            onClick={productIsSelectedForSale ? handleRemoveClick : handleSelectClick}
            className="w-full font-bold uppercase tracking-tighter h-10 rounded-xl"
          >
            {productIsSelectedForSale ? (
              <><MinusCircle className="mr-2 h-4 w-4" /> Quitar</>
            ) : (
              <><PlusCircle className="mr-2 h-4 w-4" /> {role === 'admin' ? 'Gestionar Venta' : 'Comprar Ahora'}</>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
