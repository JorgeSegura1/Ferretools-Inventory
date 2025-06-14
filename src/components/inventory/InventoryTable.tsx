
"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import EditProductDialog from './EditProductDialog'; // Changed from EditQuantityDialog
import DeleteProductDialog from './DeleteProductDialog';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProducts } from '@/context/ProductContext'; 
import { Loader2 } from 'lucide-react'; 

interface InventoryTableProps {
  products: Product[];
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

export default function InventoryTable({ products }: InventoryTableProps) {
  const { loadingProducts, deleteProduct } = useProducts(); 

  if (loadingProducts && products.length === 0) { 
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  if (!loadingProducts && products.length === 0) {
    return <p className="text-center text-muted-foreground py-10">El inventario está vacío. ¡Agrega tu primer artículo!</p>;
  }

  const inventoryContent = (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Gestión de Inventario</CardTitle>
        <CardDescription>Visualiza y actualiza las cantidades y detalles de tus productos.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className={cn(product.quantity === 0 ? "bg-destructive/10" : "")}>
                  <TableCell>
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={50}
                      height={50}
                      className="rounded-md object-cover"
                      data-ai-hint={getProductHint(product.category)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={product.quantity === 0 ? 'destructive' : 'outline'}>
                      {product.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <EditProductDialog product={product} /> {/* Changed from EditQuantityDialog */}
                    <DeleteProductDialog product={product} onConfirmDelete={() => deleteProduct(product.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  return inventoryContent;
}
