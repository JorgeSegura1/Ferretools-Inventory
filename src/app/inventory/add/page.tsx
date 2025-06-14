
"use client";

import AddItemForm from '@/components/inventory/AddItemForm';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AddItemPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load

    if (!user) {
      router.push('/login?message=Debes iniciar sesión para agregar artículos');
    } else if (role && role !== 'admin') {
      router.push('/?message=No tienes permisos para acceder a esta página');
    }
    // If role is null here but user exists, it means role determination might be pending
    // The loading check below will handle this.
  }, [user, role, authLoading, router]);

  if (authLoading || (user && !role && !authLoading)) { // Show loader if auth is loading OR user is loaded but role isn't determined yet
    return (
      <div className="container mx-auto py-8 text-center flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verificando acceso...</p>
      </div>
    );
  }

  if (!user) {
    // This will likely be handled by the redirect, but as a fallback or for non-JS scenarios
    return <div className="container mx-auto py-8 text-center">Redirigiendo a inicio de sesión...</div>;
  }

  if (role !== 'admin') {
    // User is loaded, role is determined, but not admin
    return <div className="container mx-auto py-8 text-center">No tienes permisos para agregar artículos. Redirigiendo...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <AddItemForm />
    </div>
  );
}
