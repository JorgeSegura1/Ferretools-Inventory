
"use client";

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import type { SaleRecord } from '@/types';
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, ShoppingBag, Calendar, Package, MapPin, AlertCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';

function formatDateForGroupingKey(date: Date | null | undefined): string {
  if (!date) return 'unknown';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateKey: string): string {
  if (dateKey === 'unknown') return 'Fecha No Definida';
  const [year, month, day] = dateKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface DailyPurchaseSummary {
  dateKey: string;
  totalAmount: number;
  totalItems: number;
  purchases: SaleRecord[];
}

export default function PurchasesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [purchases, setPurchases] = useState<SaleRecord[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?message=Debes iniciar sesión para ver tus compras');
      return;
    }

    // CRITICAL: Esta consulta requiere un índice compuesto en Firestore
    const purchasesQuery = query(
      collection(db, 'sales'),
      where('userId', '==', user.uid),
      orderBy('saleDate', 'desc')
    );

    const unsubscribe = onSnapshot(purchasesQuery, (querySnapshot) => {
      const purchasesData: SaleRecord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let saleDate: Date;
        
        if (data.saleDate instanceof Timestamp) {
          saleDate = data.saleDate.toDate();
        } else if (data.saleDate && typeof data.saleDate.toDate === 'function') {
           saleDate = data.saleDate.toDate();
        } else {
          saleDate = new Date();
        }

        purchasesData.push({
          id: doc.id,
          ...data,
          saleDate,
        } as SaleRecord);
      });
      setPurchases(purchasesData);
      setLoadingPurchases(false);
      setError(null);
    }, (err) => {
      console.error("Firestore error in purchases:", err);
      if (err.code === 'failed-precondition') {
        setError("Falta configurar un índice en la base de datos. Por favor, contacta al administrador o revisa la consola para el enlace de creación.");
      } else {
        setError("No pudimos cargar tus compras en este momento.");
      }
      setLoadingPurchases(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, router]);

  const dailySummaries = useMemo(() => {
    const groupedByDay: Record<string, DailyPurchaseSummary> = {};
    purchases.forEach(purchase => {
      const dateKey = formatDateForGroupingKey(purchase.saleDate);
      if (!groupedByDay[dateKey]) {
        groupedByDay[dateKey] = {
          dateKey,
          totalAmount: 0,
          totalItems: 0,
          purchases: [],
        };
      }
      groupedByDay[dateKey].totalAmount += purchase.totalAmount || 0;
      groupedByDay[dateKey].totalItems += purchase.totalItems || 0;
      groupedByDay[dateKey].purchases.push(purchase);
    });
    return Object.values(groupedByDay).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [purchases]);

  if (authLoading || loadingPurchases) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando tus pedidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Ops! Algo salió mal</h2>
        <p className="text-muted-foreground text-sm max-w-md mb-6">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Reintentar</Button>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 p-6 text-center">
        <div className="bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <h1 className="text-2xl font-black uppercase tracking-tighter">Sin compras aún</h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
            Aún no has realizado pedidos. ¡Explora nuestro catálogo industrial!
          </p>
        </div>
        <Button onClick={() => router.push('/')} className="premium-gradient h-14 px-8 rounded-2xl font-black uppercase tracking-tighter">
          Ver Catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col gap-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] w-fit">
          <ShoppingBag className="h-3.5 w-3.5" /> Mi Actividad
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none text-white">
          Mis <span className="text-primary">Pedidos.</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
          Historial detallado de suministros adquiridos y facturación.
        </p>
      </header>

      <div className="space-y-6">
        <Accordion type="multiple" className="space-y-4">
          {dailySummaries.map((summary) => (
            <AccordionItem value={summary.dateKey} key={summary.dateKey} className="glass-card rounded-[2rem] border-white/5 overflow-hidden border">
              <AccordionTrigger className="px-8 py-6 hover:no-underline hover:bg-white/[0.02] transition-colors group">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-6 text-left">
                  <div className="space-y-1">
                    <span className="text-xl font-black uppercase tracking-tighter">{formatDisplayDate(summary.dateKey)}</span>
                    <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest border-primary/20 text-primary px-3 py-1">
                      {summary.purchases.length} Pedido(s)
                    </Badge>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-2xl font-black text-white">
                      {summary.totalAmount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black">Total del día</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-8 pb-8 pt-4">
                <div className="space-y-4">
                  {summary.purchases.map(purchase => (
                    <div key={purchase.id} className="p-6 rounded-[1.5rem] bg-white/[0.02] border border-white/5 space-y-6">
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">ID de Transacción</p>
                          <p className="text-xs font-bold text-white/50">#{purchase.id.toUpperCase()}</p>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                           <MapPin className="h-3 w-3" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Entrega Finalizada</span>
                        </div>
                      </div>
                      
                      <div className="grid gap-4">
                        {purchase.itemsSold?.map((item, idx) => (
                          <div key={`${purchase.id}-item-${idx}`} className="flex items-center gap-4 group">
                            <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                              {item.imageUrl ? (
                                <NextImage src={item.imageUrl} alt={item.productName} fill className="object-cover transition-transform group-hover:scale-110" />
                              ) : (
                                <Package className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/30" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black uppercase tracking-tighter truncate">{item.productName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-muted-foreground">CANT: {item.quantitySold}</span>
                                <div className="h-1 w-1 rounded-full bg-white/10" />
                                <span className="text-[10px] font-bold text-muted-foreground">PRECIO: ${item.priceAtSale?.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-white">${((item.quantitySold || 0) * (item.priceAtSale || 0)).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                         <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Verificado</span>
                         </div>
                         <p className="text-xs font-black">Monto Total: <span className="text-primary ml-2">{purchase.totalAmount?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
