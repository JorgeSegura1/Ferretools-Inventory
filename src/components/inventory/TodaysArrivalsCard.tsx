
"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TodaysArrivalsCardProps {
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

export default function TodaysArrivalsCard({ products }: TodaysArrivalsCardProps) {
  if (products.length === 0) {
    return (
      <Card className="shadow-md mb-8">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">Ingresos de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No se han registrado ingresos de productos hoy.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md mb-8">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">Ingresos de Hoy ({products.length})</CardTitle>
        <CardDescription>Productos que llegaron o se agregaron al inventario hoy.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-right">Precio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="rounded-md object-cover"
                      data-ai-hint={getProductHint(product.category)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-center">{product.quantity}</TableCell>
                  <TableCell className="text-right">
                    {product.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
