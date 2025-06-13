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

interface InventoryTableProps {
  products: Product[];
}

export default function InventoryTable({ products }: InventoryTableProps) {
  if (products.length === 0) {
    return <p className="text-center text-muted-foreground">El inventario está vacío.</p>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Gestión de Inventario</CardTitle>
        <CardDescription>Visualiza y actualiza las cantidades de tus productos.</CardDescription>
      </CardHeader>
      <CardContent>
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
                    data-ai-hint={`${product.category || "hardware"} item`}
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
      </CardContent>
    </Card>
  );
}

// Need to ensure Card components are imported if not already available.
// Let's assume they are. Adding imports just in case.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
