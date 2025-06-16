
"use client";

import { useProducts } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Loader2, PackageSearch, CalendarDays } from 'lucide-react';
import type { Product } from '@/types';
import NextImage from 'next/image'; // Renamed to avoid conflict with Lucide icon
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
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return; 

    if (!user) {
      router.push('/login?message=Debes iniciar sesión para ver el historial');
    } else if (role && role !== 'admin') {
      router.push('/?message=No tienes permisos para acceder a esta página');
    }
  }, [user, role, authLoading, router]);

  const groupedAndSortedProducts = useMemo(() => {
    if (loadingProducts || !products) return {};
    
    const sortedProducts = [...products].sort((a, b) => {
      const dateA = a.arrivalDate?.getTime() || 0;
      const dateB = b.arrivalDate?.getTime() || 0;
      return dateB - dateA; // Sort by date descending
    });

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
    return Object.keys(groupedAndSortedProducts).sort((a,b) => b.localeCompare(a)); // Ensure dates are sorted, most recent first
  }, [groupedAndSortedProducts]);


  if (authLoading || (user && !role && !authLoading) || loadingProducts) {
    return (
      <div className="container mx-auto py-8 text-center flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando historial...</p>
      </div>
    );
  }
  
  if (!user || role !== 'admin') {
    return <div className="container mx-auto py-8 text-center">No tienes permisos para ver esta página. Redirigiendo...</div>;
  }

  if (sortedDateKeys.length === 0) {
    return (
      <div className="container mx-auto py-12 text-center">
        <PackageSearch className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-xl sm:text-2xl font-semibold mb-2">Historial de Productos Vacío</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Aún no se han registrado ingresos de productos.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold font-headline text-primary flex items-center">
            <CalendarDays className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8" /> Historial de Productos
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Revisa los productos que han llegado a la ferretería, agrupados por fecha de ingreso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {sortedDateKeys.map((dateKey) => (
              <AccordionItem value={dateKey} key={dateKey}>
                <AccordionTrigger className="text-md sm:text-lg hover:no-underline py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full pr-2 gap-1 sm:gap-2">
                    <span className="font-semibold text-left">{formatDisplayDate(dateKey)}</span>
                    <Badge variant="outline" className="text-xs sm:text-sm">{groupedAndSortedProducts[dateKey].length} artículos</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-[400px] pr-2 sm:pr-4">
                    <ul className="space-y-3 sm:space-y-4 pt-2">
                      {groupedAndSortedProducts[dateKey].map((product) => (
                        <li key={product.id} className="flex flex-col xs:flex-row items-start xs:items-center p-2 sm:p-3 border rounded-lg shadow-sm hover:bg-muted/50 transition-colors gap-2 xs:gap-3">
                          <NextImage
                            src={product.imageUrl}
                            alt={product.name}
                            width={50}
                            height={50}
                            className="rounded-md object-cover min-w-[50px] xs:mr-2 xs:mt-1"
                            data-ai-hint={getProductHint(product.category)}
                          />
                          <div className="flex-grow">
                            <h4 className="font-semibold text-sm sm:text-base">{product.name}</h4>
                            <div className="text-xs sm:text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1 items-center mt-0.5">
                              {product.category && <Badge variant="secondary" className="text-xs">{product.category}</Badge>}
                              <span>Cantidad: {product.quantity}</span>
                              <span>Precio: {product.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
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
