
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
import EditProductDialog from './EditProductDialog';
import DeleteProductDialog from './DeleteProductDialog';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProducts } from '@/context/ProductContext'; 
import { Loader2, AlertTriangle, CheckCircle2, PackageX } from 'lucide-react'; 

interface InventoryTableProps {
  products: Product[];
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
    return (
      <Card className="glass-card border-dashed border-white/10">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <PackageX className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold">Inventario Vacío</h3>
          <p className="text-muted-foreground text-sm">Empieza agregando suministros para verlos aquí.</p>
        </CardContent>
      </Card>
    );
  }

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Sin Stock", variant: "destructive", icon: PackageX };
    if (quantity <= 5) return { label: "Stock Crítico", variant: "destructive", icon: AlertTriangle };
    if (quantity <= 15) return { label: "Stock Bajo", variant: "secondary", icon: AlertTriangle };
    return { label: "Saludable", variant: "outline", icon: CheckCircle2 };
  };

  return (
    <Card className="glass-card border-white/5 shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black uppercase tracking-tighter">Maestro de Inventario</CardTitle>
            <CardDescription className="text-xs">Base de datos de suministros industriales activos.</CardDescription>
          </div>
          <Badge variant="outline" className="border-primary/20 text-primary uppercase font-bold text-[10px]">
            {products.length} SKU Registrados
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="w-[80px] py-4 text-[10px] font-black uppercase tracking-widest">Item</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Referencia</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Valuación</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Disponibilidad</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Estado</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-6">Gestión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const status = getStockStatus(product.quantity);
                const StatusIcon = status.icon;
                
                return (
                  <TableRow key={product.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell className="py-4">
                      <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-white/10 shadow-inner">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white">{product.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{product.category || 'General'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-white/80">
                        {product.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-black text-white">{product.quantity}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">UNID</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant as any} className="flex w-fit items-center gap-1.5 py-1 px-2.5 rounded-lg border-none text-[9px] font-black uppercase tracking-tighter">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1 pr-6">
                      <EditProductDialog product={product} />
                      <DeleteProductDialog product={product} onConfirmDelete={() => deleteProduct(product.id)} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
