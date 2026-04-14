
"use client";

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  type UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim() || 'admin@ferretools.com';

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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // Listener en tiempo real para el rol del usuario
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setRole(docSnap.data().role);
          } else {
            // Si no existe el doc (primer login o error), asignar rol por defecto
            const defaultRole = currentUser.email?.toLowerCase().trim() === ADMIN_EMAIL ? 'admin' : 'user';
            setRole(defaultRole);
            // Crear el doc si no existe
            setDoc(userDocRef, {
              email: currentUser.email,
              role: defaultRole,
              createdAt: serverTimestamp()
            }, { merge: true });
          }
        });

        setLoading(false);
        return () => unsubDoc();
      } else {
        setRole(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<UserCredential | AuthError> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
      const userEmail = email.toLowerCase().trim();
      const isAdmin = userEmail === ADMIN_EMAIL;
      
      // Crear perfil en Firestore inmediatamente
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userEmail,
        role: isAdmin ? 'admin' : 'user',
        createdAt: serverTimestamp()
      });

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
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setRole(null);
      toast({ title: "Sesión cerrada" });
    } catch (error) {
      console.error(error);
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
