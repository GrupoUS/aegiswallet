import {
  createRootRoute,
  type ErrorComponentProps,
  Outlet,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { Calendar, FileText, Home, LogOut, Mic, Send, Wallet } from 'lucide-react';
import { useState } from 'react';

import { CalendarProvider } from '@/components/calendar/calendar-context';
import { TRPCProvider } from '@/components/providers/TRPCProvider';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

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
  const [open, setOpen] = useState(false);

  // Pages that should not show the sidebar
  const noSidebarPages = ['/login'];
  const showSidebar = !noSidebarPages.includes(location.pathname);

  const navigationItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: 'Saldo',
      href: '/saldo',
      icon: <Wallet className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: 'Calendário',
      href: '/calendario',
      icon: <Calendar className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: 'Contas',
      href: '/contas',
      icon: <FileText className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: 'PIX',
      href: '/pix',
      icon: <Send className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
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
        <div
          className={cn(
            'mx-auto flex w-full flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800',
            'h-screen' // Use h-screen to take full height
          )}
        >
          <Sidebar open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10">
              <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                <div className="flex flex-col gap-4">
                  <Logo />
                  {navigationItems.map((item, idx) => (
                    <SidebarLink key={idx} link={item} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <SidebarLink
                  link={{
                    label: 'Assistente',
                    href: '/',
                    icon: (
                      <Mic className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
                    ),
                  }}
                />
                <div onClick={handleLogout} className="cursor-pointer">
                  <SidebarLink
                    link={{
                      label: 'Sair',
                      href: '#',
                      icon: (
                        <LogOut className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
                      ),
                    }}
                  />
                </div>
                <div className="mt-2 pl-1">
                  <AnimatedThemeToggler />
                </div>
              </div>
            </SidebarBody>
          </Sidebar>
          <div className="flex flex-1">
            <div className="flex h-full w-full flex-1 flex-col gap-2 overflow-y-auto rounded-tl-2xl border border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-900">
              <Outlet />
            </div>
          </div>
        </div>
      </CalendarProvider>
    </TRPCProvider>
  );
}

export const Logo = () => {
  return (
    <div className="relative z-20 flex items-center space-x-2 py-1 font-normal text-black text-sm">
      <div className="h-5 w-6 flex-shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <span className="whitespace-pre font-medium text-black opacity-100 dark:text-white">
        AegisWallet
      </span>
    </div>
  );
};
