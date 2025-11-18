import {
  createRootRoute,
  type ErrorComponentProps,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { Calendar, FileText, Home, LogOut, Mic, Send, Wallet } from 'lucide-react';
import * as React from 'react';

import { CalendarProvider } from '@/components/calendar/calendar-context';
import { TRPCProvider } from '@/components/providers/TRPCProvider';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';

function ErrorBoundary({ error }: ErrorComponentProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-destructive/10 p-4 text-destructive">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg">
        <h2 className="mb-4 font-bold text-2xl text-destructive">Oops, something went wrong!</h2>
        <p className="mb-4 text-destructive">
          We encountered an unexpected error. Please try again later.
        </p>
        <pre className="overflow-auto rounded-md bg-destructive/10 p-4 text-destructive text-sm">
          <code>{error.message}</code>
          {error.stack && <div className="mt-4 text-xs">{error.stack}</div>}
        </pre>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: ErrorBoundary,
});

function RootComponent() {
  const location = useLocation();

  // Pages that should not show the sidebar
  const noSidebarPages = ['/login'];
  const showSidebar = !noSidebarPages.includes(location.pathname);

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-5 w-5" />,
      active: location.pathname === '/dashboard',
    },
    {
      title: 'Saldo',
      href: '/saldo',
      icon: <Wallet className="h-5 w-5" />,
      active: location.pathname === '/saldo',
    },
    {
      title: 'Calendário',
      href: '/calendario',
      icon: <Calendar className="h-5 w-5" />,
      active: location.pathname === '/calendario',
    },
    {
      title: 'Contas',
      href: '/contas',
      icon: <FileText className="h-5 w-5" />,
      active: location.pathname === '/contas',
    },
    {
      title: 'PIX',
      href: '/pix',
      icon: <Send className="h-5 w-5" />,
      active: location.pathname === '/pix',
    },
  ];

  // Handle logout functionality
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({
      to: '/login',
      search: { redirect: '/dashboard', error: undefined },
    });
  };

  // Render without sidebar for login page
  if (!showSidebar) {
    return (
      <TRPCProvider>
        <CalendarProvider>
          <div className="min-h-screen bg-background">
            <Outlet />
          </div>
        </CalendarProvider>
      </TRPCProvider>
    );
  }

  // Render with sidebar for authenticated pages
  return (
    <TRPCProvider>
      <CalendarProvider>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <Link
                to="/"
                className="flex items-center gap-3 text-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="font-bold text-sm">AW</span>
                </div>
                <span className="font-semibold text-lg">AegisWallet</span>
              </Link>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={item.active}>
                          <Link to={item.href}>
                            {item.icon}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>Ações</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link to="/">
                          <Mic className="h-5 w-5" />
                          <span>Assistente de Voz</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={handleLogout}>
                        <LogOut className="h-5 w-5" />
                        <span>Sair</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <div className="p-4 border-t">
              <AnimatedThemeToggler />
            </div>
            <SidebarRail />
          </Sidebar>
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold">
                  {navigationItems.find((item) => item.active)?.title || 'AegisWallet'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {navigationItems.find((item) => item.active)?.title
                    ? 'Seu assistente financeiro inteligente'
                    : 'Gerencie suas finanças com IA'}
                </p>
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </CalendarProvider>
    </TRPCProvider>
  );
}
