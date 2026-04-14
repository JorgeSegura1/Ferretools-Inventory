
"use client";

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, Users, Shield, User, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types';

export default function UserManagementPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || role !== 'admin') {
      router.push('/?message=No tienes permisos para acceder a esta página');
      return;
    }

    const q = query(collection(db, 'users'), orderBy('email', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserProfile[] = [];
      snapshot.forEach((doc) => {
        usersData.push({
          uid: doc.id,
          ...doc.data()
        } as UserProfile);
      });
      setUsers(usersData);
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, [user, role, authLoading, router]);

  const toggleRole = async (targetUser: UserProfile) => {
    if (targetUser.uid === user?.uid) {
      toast({
        title: "Operación no permitida",
        description: "No puedes cambiar tu propio rol por seguridad.",
        variant: "destructive"
      });
      return;
    }

    setProcessingId(targetUser.uid);
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    
    try {
      await updateDoc(doc(db, 'users', targetUser.uid), {
        role: newRole
      });
      toast({
        title: "Rol actualizado",
        description: `El usuario ${targetUser.email} ahora es ${newRole === 'admin' ? 'Administrador' : 'Socio'}.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading || loadingUsers) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sincronizando Usuarios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col gap-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] w-fit">
          <ShieldAlert className="h-3.5 w-3.5" /> Control de Acceso Maestro
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none text-white">
          Gestión de <span className="text-primary">Roles.</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
          Administra los privilegios de los socios de la red y el personal técnico.
        </p>
      </header>

      <Card className="glass-card border-white/5 overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center gap-3">
             <Users className="h-5 w-5 text-primary" />
             <CardTitle className="text-lg font-black uppercase tracking-tighter">Directorio de Personal</CardTitle>
          </div>
          <CardDescription className="text-xs">Lista completa de usuarios registrados en el ecosistema Ferretools.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest pl-6">Usuario / Email</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Estado del Rol</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-6">Acción de Mando</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.uid} className="border-white/5 hover:bg-white/[0.01]">
                    <TableCell className="pl-6 py-5">
                      <div className="flex items-center gap-3">
                         <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${u.role === 'admin' ? 'bg-primary/20 border-primary/30' : 'bg-muted border-white/10'}`}>
                            {u.role === 'admin' ? <Shield className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-muted-foreground" />}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-white">{u.email}</p>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">ID: {u.uid.slice(0, 12)}...</p>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className={`text-[9px] font-black uppercase tracking-tighter border-none ${u.role === 'admin' ? 'bg-primary/20 text-primary' : ''}`}>
                        {u.role === 'admin' ? 'Administrador' : 'Socio / Usuario'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={processingId === u.uid || u.uid === user?.uid}
                        onClick={() => toggleRole(u)}
                        className={`text-[9px] font-black uppercase tracking-widest h-9 rounded-xl border-white/10 ${u.role === 'admin' ? 'hover:bg-destructive/10 hover:text-destructive' : 'hover:bg-primary/10 hover:text-primary'}`}
                      >
                        {processingId === u.uid ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : u.role === 'admin' ? (
                          "Degradar a Socio"
                        ) : (
                          "Promover a Admin"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="p-6 rounded-[2rem] glass-card border-white/5 bg-white/[0.01] flex items-start gap-4">
            <div className="h-10 w-10 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
               <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
               <h4 className="text-sm font-black uppercase tracking-tighter text-white">Seguridad de Roles</h4>
               <p className="text-xs text-muted-foreground leading-relaxed mt-1">Los cambios de rol son instantáneos y se sincronizan con la telemetría del usuario en tiempo real.</p>
            </div>
         </div>
         <div className="p-6 rounded-[2rem] glass-card border-white/5 bg-white/[0.01] flex items-start gap-4">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
               <Shield className="h-5 w-5 text-blue-500" />
            </div>
            <div>
               <h4 className="text-sm font-black uppercase tracking-tighter text-white">Privilegios Admin</h4>
               <p className="text-xs text-muted-foreground leading-relaxed mt-1">Los administradores pueden gestionar stock, ver ventas totales y editar roles de otros socios.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
