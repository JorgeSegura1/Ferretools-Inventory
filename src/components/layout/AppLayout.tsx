
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LayoutGrid, ListChecks, PlusCircle, Warehouse, Wrench, LogIn, UserPlus, LogOut, UserCircle } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter, // Added SidebarFooter
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext'; // Added useAuth
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Added Avatar

const baseNavItems = [
  { href: '/', label: 'Catálogo', icon: LayoutGrid, requiresAuth: false },
  { href: '/inventory', label: 'Inventario', icon: Warehouse, requiresAuth: true },
  { href: '/inventory/add', label: 'Agregar Artículo', icon: PlusCircle, requiresAuth: true },
];

const authNavItems = [
  { href: '/login', label: 'Iniciar Sesión', icon: LogIn, requiresAuth: false, showIfLoggedOut: true },
  { href: '/signup', label: 'Registrarse', icon: UserPlus, requiresAuth: false, showIfLoggedOut: true },
];

function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="container flex h-14 items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <ListChecks className="h-6 w-6" />
        </Button>
        <Link href="/" className="flex items-center space-x-2">
          <Wrench className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline">Ferretools</span>
        </Link>
        <div className="ml-auto">
          {user ? (
             <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                <AvatarFallback>{user.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Ingresar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}


export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const visibleNavItems = baseNavItems.filter(item => {
    if (item.requiresAuth && !user && !loading) return false; // Hide protected routes if not logged in and not loading
    return true;
  });

  const currentAuthNavItems = authNavItems.filter(item => {
    if (item.showIfLoggedOut && user) return false; // Hide login/signup if logged in
    return true;
  });
  
  const allNavItems = [...visibleNavItems, ...currentAuthNavItems];


  return (
    <SidebarProvider defaultOpen>
      <SiteHeader />
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <Wrench className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold font-headline group-data-[collapsible=icon]:hidden">
              Ferretools
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {allNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, className: "font-body"}}
                    className="font-body"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 mt-auto border-t">
          {user && !loading && (
            <div className="flex flex-col gap-2 items-start group-data-[collapsible=icon]:items-center">
               <div className="flex items-center gap-2 p-2 w-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                  <AvatarFallback>{user.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium truncate max-w-[120px]">{user.displayName || user.email}</span>
                </div>
              </div>
              <SidebarMenuButton
                onClick={handleSignOut}
                tooltip={{ children: "Cerrar Sesión", className: "font-body"}}
                className="font-body w-full"
              >
                <LogOut className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
              </SidebarMenuButton>
            </div>
          )}
          {(!user && !loading) && (
             <SidebarMenuItem>
                <Link href="/login">
                  <SidebarMenuButton
                    isActive={pathname === "/login"}
                    tooltip={{ children: "Iniciar Sesión", className: "font-body"}}
                    className="font-body w-full"
                  >
                    <LogIn className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Iniciar Sesión</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="md:ml-64">
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
