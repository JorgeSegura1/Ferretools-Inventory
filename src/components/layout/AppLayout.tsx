
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, PlusCircle, Warehouse, Wrench, LogIn, UserPlus, LogOut, History, DollarSign, ListChecks } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const baseNavItems = [
  { href: '/', label: 'Explorar Catálogo', icon: LayoutGrid, requiresAuth: false },
  { href: '/inventory', label: 'Centro de Inventario', icon: Warehouse, requiresAuth: true, requiredRole: 'admin' },
  { href: '/inventory/add', label: 'Nuevo Suministro', icon: PlusCircle, requiresAuth: true, requiredRole: 'admin' },
  { href: '/inventory/history', label: 'Registro de Entradas', icon: History, requiresAuth: true, requiredRole: 'admin' },
  { href: '/sales', label: 'Monitor de Ventas', icon: DollarSign, requiresAuth: true, requiredRole: 'admin' },
];

const authNavItems = [
  { href: '/login', label: 'Acceso Partner', icon: LogIn, requiresAuth: false, showIfLoggedOut: true },
  { href: '/signup', label: 'Unirse a la Red', icon: UserPlus, requiresAuth: false, showIfLoggedOut: true },
];

function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-lg md:hidden">
      <div className="container flex h-16 items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 text-primary"
          onClick={toggleSidebar}
        >
          <ListChecks className="h-6 w-6" />
        </Button>
        <Link href="/" className="flex items-center space-x-2">
          <div className="bg-primary/20 p-1.5 rounded-lg">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight uppercase">Ferretools</span>
        </Link>
        <div className="ml-auto flex items-center">
          {user ? (
            <Avatar className="h-9 w-9 border border-primary/20">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="bg-muted text-primary">{user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          ) : (
            <Button variant="ghost" size="sm" asChild className="text-primary font-semibold">
              <Link href="/login">Acceder</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, role, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const visibleNavItems = baseNavItems.filter(item => {
    if (!item.requiresAuth) return true;
    if (loading) return false;
    if (!user) return false;
    if (item.requiredRole === 'admin') return role === 'admin';
    return true;
  });

  const currentAuthNavItems = authNavItems.filter(item => {
    if (loading) return false;
    if (item.showIfLoggedOut && user) return false;
    return true;
  });

  const allNavItems = [...visibleNavItems, ...currentAuthNavItems];

  return (
    <SidebarProvider defaultOpen className="flex-col md:flex-row bg-background">
      <SiteHeader />
      <div className="flex flex-1 w-full relative min-h-screen">
        <Sidebar collapsible="icon" className="border-r border-white/5 bg-background/50 backdrop-blur-xl">
          <SidebarHeader className="p-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tighter group-data-[collapsible=icon]:hidden uppercase">
                Ferretools
              </h1>
            </Link>
          </SidebarHeader>
          <SidebarContent className="px-3">
            <SidebarMenu>
              {allNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      className="py-6 px-4 rounded-xl transition-all duration-300 hover:bg-white/5"
                      tooltip={item.label}
                    >
                      <item.icon className={pathname === item.href ? "text-primary h-5 w-5" : "text-muted-foreground h-5 w-5"} />
                      <span className="font-medium text-sm ml-2">{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 mt-auto border-t border-white/5">
            {user && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl group-data-[collapsible=icon]:justify-center border border-white/5">
                  <Avatar className="h-8 w-8 border border-primary/20">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-muted text-xs">{user.email?.[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                    <span className="text-[11px] font-bold truncate max-w-[120px] text-white">{user.displayName || user.email}</span>
                    <span className="text-[9px] text-primary font-black uppercase tracking-widest">{role === 'admin' ? 'Administrador' : 'Socio / Usuario'}</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="w-full justify-start text-muted-foreground hover:text-destructive group-data-[collapsible=icon]:justify-center rounded-xl"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="group-data-[collapsible=icon]:hidden font-bold text-xs uppercase tracking-tighter">Cerrar Sesión</span>
                </Button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 bg-background min-w-0">
          <main className="w-full">
            <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
