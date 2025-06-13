"use client";
import InventoryTable from '@/components/inventory/InventoryTable';
import { useProducts } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function InventoryPage() {
  const { products } = useProducts();

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">Inventario General</h1>
        <Button asChild>
          <Link href="/inventory/add">
            <PlusCircle className="mr-2 h-4 w-4" /> Agregar Nuevo Artículo
          </Link>
        </Button>
      </div>
      <InventoryTable products={products} />
    </div>
  );
}
