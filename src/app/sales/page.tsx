
"use client";

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import type { SaleRecord, SoldItemDetails } from '@/types';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, DollarSign, ShoppingBag, Info, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

// Helper to format date for grouping (YYYY-MM-DD for sortability and uniqueness)
function formatDateForGroupingKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to format date for display
function formatDisplayDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface DailySaleSummary {
  dateKey: string;
  totalAmount: number;
  totalItems: number;
  transactions: SaleRecord[];
}

function getProductHint(category?: string): string {
  if (category) {
    const words = category.split(' ').filter(Boolean);
    if (words.length === 0) return 'item';
    if (words.length === 1) return words[0];
    return words.slice(0, 2).join(' ');
  }
  return 'item';
}


export default function SalesPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?message=Debes iniciar sesión para ver el historial de ventas');
      return;
    }
    if (role && role !== 'admin') {
      router.push('/?message=No tienes permisos para acceder a esta página');
      return;
    }
    // If role is still null but user is loaded, means role determination is pending, wait for authLoading to be false.
    if (user && !role && !authLoading) {
        // This state might occur briefly if role determination is async after user is set
        // console.log("User loaded, role not yet determined, waiting for auth to complete role assignment.");
        return; 
    }


    if (role === 'admin') {
      setLoadingSales(true);
      const salesQuery = query(collection(db, 'sales'), orderBy('saleDate', 'desc'));
      const unsubscribe = onSnapshot(salesQuery, (querySnapshot) => {
        const salesData: SaleRecord[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          salesData.push({
            id: doc.id,
            ...data,
            saleDate: (data.saleDate as Timestamp).toDate(),
          } as SaleRecord);
        });
        setSales(salesData);
        setLoadingSales(false);
      }, (error) => {
        console.error("Error fetching sales:", error);
        setLoadingSales(false);
        // Consider adding a toast message for error
      });
      return () => unsubscribe();
    }
  }, [user, role, authLoading, router]);

  const dailySummaries = useMemo(() => {
    const groupedByDay: Record<string, DailySaleSummary> = {};
    sales.forEach(sale => {
      const dateKey = formatDateForGroupingKey(sale.saleDate);
      if (!groupedByDay[dateKey]) {
        groupedByDay[dateKey] = {
          dateKey,
          totalAmount: 0,
          totalItems: 0,
          transactions: [],
        };
      }
      groupedByDay[dateKey].totalAmount += sale.totalAmount;
      groupedByDay[dateKey].totalItems += sale.totalItems;
      groupedByDay[dateKey].transactions.push(sale);
    });
    return Object.values(groupedByDay).sort((a, b) => b.dateKey.localeCompare(a.dateKey)); // Sort by date descending
  }, [sales]);

  if (authLoading || (user && !role && !authLoading) || loadingSales) {
    return (
      <div className="container mx-auto py-8 text-center flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando historial de ventas...</p>
      </div>
    );
  }

  if (!user || role !== 'admin') {
    return <div className="container mx-auto py-8 text-center">Redirigiendo...</div>;
  }
  
  if (dailySummaries.length === 0) {
    return (
      <div className="container mx-auto py-12 text-center">
        <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Historial de Ventas Vacío</h1>
        <p className="text-muted-foreground">Aún no se han registrado ventas.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline text-primary flex items-center">
            <DollarSign className="mr-3 h-8 w-8" /> Historial de Ventas
          </CardTitle>
          <CardDescription>
            Revisa las ventas realizadas, agrupadas por día.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {dailySummaries.map((summary) => (
              <AccordionItem value={summary.dateKey} key={summary.dateKey}>
                <AccordionTrigger className="text-lg hover:no-underline">
                  <div className="flex justify-between items-center w-full pr-2">
                    <span className="font-semibold">{formatDisplayDate(summary.dateKey)}</span>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-sm">
                        Total Día: {summary.totalAmount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                      </Badge>
                      <Badge variant="outline" className="text-sm">{summary.totalItems} artículos</Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-auto max-h-[600px] pr-4">
                    <div className="space-y-3 pt-2">
                      {summary.transactions.map(transaction => (
                        <Card key={transaction.id} className="bg-muted/30">
                          <CardHeader className="pb-2 pt-3 px-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-md font-medium">
                                    Venta ID: <span className="font-mono text-xs">{transaction.id.substring(0,8)}...</span>
                                </CardTitle>
                                <Badge variant="default">
                                    {transaction.totalAmount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })} ({transaction.totalItems} art.)
                                </Badge>
                            </div>
                            <CardDescription className="text-xs">
                                Realizada el: {transaction.saleDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="px-4 pb-3">
                            <p className="text-sm font-medium mb-1">Artículos en esta venta:</p>
                            <ul className="space-y-1.5 text-xs list-disc list-inside pl-1">
                              {transaction.itemsSold.map(item => (
                                <li key={item.productId} className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    {item.imageUrl && !item.imageUrl.startsWith('data:image') ? (
                                        <Image src={item.imageUrl} alt={item.productName} width={24} height={24} className="rounded-sm object-cover mr-2" data-ai-hint={getProductHint(item.category)} />
                                    ) : (
                                        <ImageIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                    )}
                                    <span>{item.productName} (x{item.quantitySold})</span>
                                  </div>
                                  <span>
                                    {item.priceAtSale.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })} c/u
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
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

