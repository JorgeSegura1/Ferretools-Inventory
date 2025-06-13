
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
import EditQuantityDialog from './EditQuantityDialog';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface InventoryTableProps {
  products: Product[];
}

function getProductHint(category?: string): string {
  if (category) {
    const words = category.split(' ');
    if (words.length === 1) return words[0];
    return words.slice(0, 2).join(' ');
  }
  return 'hardware tool'; // Default hint
}

export default function InventoryTable({ products }: InventoryTableProps) {
  if (products.length === 0) {
    return <p className="text-center text-muted-foreground">El inventario está vacío.</p>;
  }

  const inventoryContent = (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Gestión de Inventario</CardTitle>
        <CardDescription>Visualiza y actualiza las cantidades de tus productos.</CardDescription>
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
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={product.quantity === 0 ? 'destructive' : 'outline'}>
                      {product.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <EditQuantityDialog product={product} />
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
