
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import type { AuthError } from 'firebase/auth';

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading: authLoading } = useAuth();
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setFirebaseError(null);
    const result = await signIn(data.email, data.password);
    if ('user' in result) { 
      router.push('/'); 
    } else { 
      const error = result as AuthError;
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setFirebaseError("Correo electrónico o contraseña incorrectos.");
      } else {
        setFirebaseError(error.message || "Ocurrió un error desconocido.");
      }
    }
  };

  const isLoading = isSubmitting || authLoading;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-headline text-center text-primary">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">
            Ingresa tus credenciales para acceder a tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {firebaseError && (
              <p className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md">{firebaseError}</p>
            )}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" {...register('email')} placeholder="tu@correo.com" />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" {...register('password')} placeholder="••••••••" />
              {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Ingresar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-xs sm:text-sm">
          <p className="text-muted-foreground">
            ¿No tienes una cuenta?{' '}
            <Button variant="link" asChild className="p-0 h-auto font-semibold text-primary">
              <Link href="/signup">Regístrate aquí</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
