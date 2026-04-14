
"use client";

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import type { SaleRecord } from '@/types';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, DollarSign, TrendingUp, Calendar, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import NextImage from 'next/image';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

function formatDateForGroupingKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

    if (role === 'admin') {
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
    return Object.values(groupedByDay).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [sales]);

  const chartData = useMemo(() => {
    return dailySummaries
      .slice(0, 7)
      .reverse()
      .map(s => ({
        date: s.dateKey.split('-').slice(1).join('/'),
        total: s.totalAmount
      }));
  }, [dailySummaries]);

  if (authLoading || loadingSales) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tighter uppercase text-primary">Monitor de Ventas</h1>
        <p className="text-muted-foreground">Análisis de rendimiento y flujo de caja en tiempo real.</p>
      </div>

      {/* Analytics Chart */}
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Tendencia de Ventas (Últimos 7 días)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={{ total: { label: "Ventas", color: "hsl(var(--primary))" } }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000)}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="total" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Sales List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Historial Cronológico</h2>
        </div>
        
        <Accordion type="multiple" className="space-y-4">
          {dailySummaries.map((summary) => (
            <AccordionItem value={summary.dateKey} key={summary.dateKey} className="glass-card rounded-2xl border-white/5 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-white/5 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4 text-left">
                  <div className="space-y-1">
                    <span className="text-lg font-bold">{formatDisplayDate(summary.dateKey)}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/20 text-primary">
                        {summary.transactions.length} Transacciones
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xl font-black text-white">
                      {summary.totalAmount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Monto Total Día</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2">
                <div className="space-y-3">
                  {summary.transactions.map(transaction => (
                    <div key={transaction.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ref: {transaction.id.slice(0, 8)}</p>
                          <p className="text-xs font-medium text-white/70">
                            Hora: {transaction.saleDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <Badge className="bg-primary/20 text-primary border-none text-[10px] font-bold">
                           {transaction.totalItems} Items
                        </Badge>
                      </div>
                      
                      <div className="grid gap-3">
                        {transaction.itemsSold.map(item => (
                          <div key={item.productId} className="flex items-center gap-3">
                            <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-white/10 bg-muted">
                              {item.imageUrl && (
                                <NextImage src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">Cant: {item.quantitySold} × {item.priceAtSale.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black">${(item.quantitySold * item.priceAtSale).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
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
