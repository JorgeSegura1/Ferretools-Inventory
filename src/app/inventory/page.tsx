
"use client";
import InventoryTable from '@/components/inventory/InventoryTable';
import TodaysArrivalsCard from '@/components/inventory/TodaysArrivalsCard';
import { useProducts } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

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
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load

    if (!user) {
      router.push('/login?message=Debes iniciar sesión para ver el inventario');
    } else if (role && role !== 'admin') {
      router.push('/?message=No tienes permisos para acceder a esta página');
    }
  }, [user, role, authLoading, router]);

  const todaysArrivals = useMemo(() => {
    if (loadingProducts || !products) return [];
    return products.filter(product => isToday(product.arrivalDate)).sort((a,b) => (b.arrivalDate?.getTime() || 0) - (a.arrivalDate?.getTime() || 0));
  }, [products, loadingProducts]);

  if (authLoading || (user && !role && !authLoading) || (loadingProducts && !products.length)) {
    return (
      <div className="container mx-auto py-8 text-center flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando inventario...</p>
      </div>
    );
  }
  
  if (!user || role !== 'admin') {
     return <div className="container mx-auto py-8 text-center">No tienes permisos para ver esta página. Redirigiendo...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold font-headline text-primary">Gestión de Inventario</h1>
        {role === 'admin' && (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/inventory/add">
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar Nuevo Artículo
            </Link>
          </Button>
        )}
      </div>
      
      <TodaysArrivalsCard products={todaysArrivals} />
      <h2 className="text-xl sm:text-2xl font-bold font-headline text-primary mb-4 mt-8">Inventario General</h2>
      <InventoryTable products={products} />
    </div>
  );
}
