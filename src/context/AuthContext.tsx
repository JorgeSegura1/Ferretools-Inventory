
"use client";

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  type UserCredential
} from 'firebase/auth';
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

// Ensure NEXT_PUBLIC_ADMIN_EMAIL is read from environment variables
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

if (!ADMIN_EMAIL && process.env.NODE_ENV === 'development') {
  console.warn(
    "\n**************************************************************************************\n" +
    "ADVERTENCIA: La variable de entorno NEXT_PUBLIC_ADMIN_EMAIL no está configurada.\n" +
    "Ningún usuario será tratado como administrador por defecto.\n" +
    "Por favor, configura NEXT_PUBLIC_ADMIN_EMAIL en tu archivo .env.local.\n" +
    "Ejemplo: NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com\n" +
    "**************************************************************************************\n"
  );
}

interface AuthContextType {
  user: FirebaseUser | null;
  role: 'admin' | 'user' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential | AuthError>;
  signUp: (email: string, password: string) => Promise<UserCredential | AuthError>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setRole(currentUser.email === ADMIN_EMAIL ? 'admin' : 'user');
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<UserCredential | AuthError> => {
    setLoading(true);
    setRole(null); // Reset role during sign-in attempt
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setRole(userCredential.user.email === ADMIN_EMAIL ? 'admin' : 'user');
      toast({ title: "Inicio de sesión exitoso", description: "Bienvenido de nuevo." });
      return userCredential;
    } catch (error) {
      const authError = error as AuthError;
      setRole(null);
      toast({ title: "Error al iniciar sesión", description: authError.message, variant: "destructive" });
      return authError;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string): Promise<UserCredential | AuthError> => {
    setLoading(true);
    setRole(null); // Reset role
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setRole('user'); // New users are 'user' by default
      toast({ title: "Registro exitoso", description: "Tu cuenta ha sido creada." });
      return userCredential;
    } catch (error) {
      const authError = error as AuthError;
      setRole(null);
      toast({ title: "Error al registrarse", description: authError.message, variant: "destructive" });
      return authError;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setRole(null);
      toast({ title: "Cierre de sesión exitoso" });
    } catch (error) {
      const authError = error as AuthError;
      toast({ title: "Error al cerrar sesión", description: authError.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
