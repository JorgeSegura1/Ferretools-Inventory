
"use client";

import { useProducts } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Loader2, PackageSearch, CalendarDays } from 'lucide-react';
import type { Product } from '@/types';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Helper function to format date for grouping keys (YYYY-MM-DD for sortability)
function formatDateForHistoryKey(date: Date | undefined | null): string {
  if (!date) return 'unknown';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to format date for display
function formatDisplayDate(dateKey: string): string {
  if (dateKey === 'unknown') return 'Fecha Desconocida';
  const [year, month, day] = dateKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getProductHint(category?: string): string {
  if (category) {
    const words = category.split(' ').filter(Boolean);
    if (words.length === 0) return 'hardware item';
    if (words.length === 1) return words[0];
    return words.slice(0, 2).join(' ');
  }
  return 'hardware item';
}

export default function InventoryHistoryPage() {
  const { products, loadingProducts } = useProducts();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?message=Debes iniciar sesión para ver el historial');
    }
  }, [user, authLoading, router]);

  const groupedAndSortedProducts = useMemo(() => {
    if (loadingProducts || !products) return {};
    
    // Sort all products by arrivalDate descending first
    const sortedProducts = [...products].sort((a, b) => {
      const dateA = a.arrivalDate?.getTime() || 0;
      const dateB = b.arrivalDate?.getTime() || 0;
      return dateB - dateA;
    });

    // Group sorted products
    return sortedProducts.reduce((acc, product) => {
      const dateKey = formatDateForHistoryKey(product.arrivalDate);
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [products, loadingProducts]);

  const sortedDateKeys = useMemo(() => {
    // Keys are already effectively sorted due to sorting products before grouping by YYYY-MM-DD keys
    return Object.keys(groupedAndSortedProducts);
  }, [groupedAndSortedProducts]);


  if (authLoading || loadingProducts || (!user && !authLoading)) {
    return (
      <div className="container mx-auto py-8 text-center flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando historial...</p>
      </div>
    );
  }
  
  if (sortedDateKeys.length === 0) {
    return (
      <div className="container mx-auto py-12 text-center">
        <PackageSearch className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Historial de Ingresos Vacío</h1>
        <p className="text-muted-foreground">Aún no se han registrado ingresos de productos.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline text-primary flex items-center">
            <CalendarDays className="mr-3 h-8 w-8" /> Historial de Ingresos de Productos
          </CardTitle>
          <CardDescription>
            Revisa los productos que han llegado a la ferretería, agrupados por fecha de ingreso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {sortedDateKeys.map((dateKey, index) => (
              <AccordionItem value={dateKey} key={dateKey}>
                <AccordionTrigger className="text-lg hover:no-underline">
                  <div className="flex justify-between items-center w-full pr-2">
                    <span>{formatDisplayDate(dateKey)}</span>
                    <Badge variant="outline">{groupedAndSortedProducts[dateKey].length} artículos</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-[400px] pr-4"> {/* Added ScrollArea */}
                    <ul className="space-y-4 pt-2">
                      {groupedAndSortedProducts[dateKey].map((product) => (
                        <li key={product.id} className="flex items-start p-3 border rounded-lg shadow-sm hover:bg-muted/50 transition-colors">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width={60}
                            height={60}
                            className="rounded-md object-cover mr-4 mt-1"
                            data-ai-hint={getProductHint(product.category)}
                          />
                          <div className="flex-grow">
                            <h4 className="font-semibold text-md">{product.name}</h4>
                            <div className="text-sm text-muted-foreground">
                              {product.category && <Badge variant="secondary" className="mr-2">{product.category}</Badge>}
                              Cantidad: {product.quantity} | Precio: {product.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

