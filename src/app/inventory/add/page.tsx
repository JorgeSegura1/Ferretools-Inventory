
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
    if (authLoading) return; 

    if (!user) {
      router.push('/login?message=Debes iniciar sesión para agregar artículos');
    } else if (role && role !== 'admin') {
      router.push('/?message=No tienes permisos para acceder a esta página');
    }
  }, [user, role, authLoading, router]);

  if (authLoading || (user && !role && !authLoading)) { 
    return (
      <div className="container mx-auto py-8 text-center flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verificando acceso...</p>
      </div>
    );
  }

  if (!user) {
    return <div className="container mx-auto py-8 text-center">Redirigiendo a inicio de sesión...</div>;
  }

  if (role !== 'admin') {
    return <div className="container mx-auto py-8 text-center">No tienes permisos para agregar artículos. Redirigiendo...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-2 sm:px-4">
      <AddItemForm />
    </div>
  );
}
