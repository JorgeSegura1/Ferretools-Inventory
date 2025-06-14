
"use client";
import InventoryTable from '@/components/inventory/InventoryTable';
import TodaysArrivalsCard from '@/components/inventory/TodaysArrivalsCard'; // Import new component
import { useProducts } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react'; // Added useMemo

// Helper function to check if a date is today
function isToday(date: Date | undefined | null): boolean {
  if (!date) return false;
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export default function InventoryPage() {
  const { products, loadingProducts } = useProducts();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?message=Debes iniciar sesión para ver el inventario');
    }
  }, [user, authLoading, router]);

  const todaysArrivals = useMemo(() => {
    if (loadingProducts || !products) return [];
    return products.filter(product => isToday(product.arrivalDate)).sort((a,b) => (b.arrivalDate?.getTime() || 0) - (a.arrivalDate?.getTime() || 0));
  }, [products, loadingProducts]);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="container mx-auto py-8 text-center flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">Gestión de Inventario</h1>
        <Button asChild>
          <Link href="/inventory/add">
            <PlusCircle className="mr-2 h-4 w-4" /> Agregar Nuevo Artículo
          </Link>
        </Button>
      </div>

      {loadingProducts && !products.length ? (
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Cargando inventario...</p>
        </div>
      ) : (
        <>
          <TodaysArrivalsCard products={todaysArrivals} />
          <h2 className="text-2xl font-bold font-headline text-primary mb-4 mt-8">Inventario General</h2>
          <InventoryTable products={products} />
        </>
      )}
    </div>
  );
}
