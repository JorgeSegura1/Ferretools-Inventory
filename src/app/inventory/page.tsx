
"use client";
import InventoryTable from '@/components/inventory/InventoryTable';
import { useProducts } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Loader2 } from 'lucide-react'; // Added Loader2
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function InventoryPage() {
  const { products, loadingProducts } = useProducts(); // Added loadingProducts
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?message=Debes iniciar sesión para ver el inventario');
    }
  }, [user, authLoading, router]);

  if (authLoading || (!user && !authLoading)) { // Show loading if auth is loading or redirecting
    return (
      <div className="container mx-auto py-8 text-center flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // No need to explicitly check for !user here anymore as the useEffect handles redirection.
  // If we reach this point, user should be authenticated.

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
      {loadingProducts && !products.length ? ( // Show loader if loading and no products yet
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Cargando inventario...</p>
        </div>
      ) : (
        <InventoryTable products={products} />
      )}
    </div>
  );
}

