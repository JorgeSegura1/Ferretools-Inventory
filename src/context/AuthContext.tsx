
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

// Acceso robusto al email del admin desde variables de entorno
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();

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
      if (currentUser && currentUser.email) {
        const userEmail = currentUser.email.toLowerCase().trim();
        // Verificación de rol mejorada
        const isAdmin = userEmail === ADMIN_EMAIL || userEmail === 'admin@ferretools.com';
        setRole(isAdmin ? 'admin' : 'user');
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<UserCredential | AuthError> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userEmail = userCredential.user.email?.toLowerCase().trim();
      const isAdmin = userEmail === ADMIN_EMAIL || userEmail === 'admin@ferretools.com';
      setUser(userCredential.user);
      setRole(isAdmin ? 'admin' : 'user');
      toast({ title: "Inicio de sesión exitoso", description: "Acceso verificado." });
      return userCredential;
    } catch (error) {
      const authError = error as AuthError;
      toast({ title: "Error de acceso", description: "Credenciales incorrectas.", variant: "destructive" });
      return authError;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string): Promise<UserCredential | AuthError> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userEmail = userCredential.user.email?.toLowerCase().trim();
      const isAdmin = userEmail === ADMIN_EMAIL || userEmail === 'admin@ferretools.com';
      setUser(userCredential.user);
      setRole(isAdmin ? 'admin' : 'user');
      toast({ title: "Registro exitoso", description: "Cuenta creada correctamente." });
      return userCredential;
    } catch (error) {
      const authError = error as AuthError;
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
      toast({ title: "Sesión cerrada" });
    } catch (error) {
      console.error(error);
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
