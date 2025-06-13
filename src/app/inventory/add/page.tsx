
"use client";

import AddItemForm from '@/components/inventory/AddItemForm';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AddItemPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?message=Debes iniciar sesión para agregar artículos');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="container mx-auto py-8 text-center">Cargando...</div>;
  }

  if (!user) {
    // This will likely be handled by the redirect, but as a fallback
    return <div className="container mx-auto py-8 text-center">Por favor, inicia sesión para agregar artículos.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <AddItemForm />
    </div>
  );
}

