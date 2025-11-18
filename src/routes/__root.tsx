import {
  createRootRoute,
  type ErrorComponentProps,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { Calendar, FileText, Home, LogOut, Mic, Send, Wallet } from 'lucide-react';
import { motion } from 'motion/react';

import { CalendarProvider } from '@/components/calendar/calendar-context';
import { TRPCProvider } from '@/components/providers/TRPCProvider';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import {
  Sidebar,
  SidebarBody,
  SidebarContent,
  SidebarLink,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';
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

  // Pages that should not show the sidebar
  const noSidebarPages = ['/login'];
  const showSidebar = !noSidebarPages.includes(location.pathname);

  const links = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-5 w-5 flex-shrink-0 text-sidebar-foreground" />,
    },
    {
      label: 'Saldo',
      href: '/saldo',
      icon: <Wallet className="h-5 w-5 flex-shrink-0 text-sidebar-foreground" />,
    },
    {
      label: 'Calendário',
      href: '/calendario',
      icon: <Calendar className="h-5 w-5 flex-shrink-0 text-sidebar-foreground" />,
    },
    {
      label: 'Contas',
      href: '/contas',
      icon: <FileText className="h-5 w-5 flex-shrink-0 text-sidebar-foreground" />,
    },
    {
      label: 'PIX',
      href: '/pix',
      icon: <Send className="h-5 w-5 flex-shrink-0 text-sidebar-foreground" />,
    },
  ];

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
          <div className="flex h-screen w-full">
            <Sidebar>
              <SidebarBody className="justify-between gap-10">
                <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                  <SidebarContent>
                    <SidebarContentWrapper links={links} />
                  </SidebarContent>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center py-2">
                    <AnimatedThemeToggler />
                  </div>
                  <SidebarLink
                    link={{
                      label: 'Assistente de Voz',
                      href: '/',
                      icon: <Mic className="h-5 w-5 flex-shrink-0 text-sidebar-foreground" />,
                    }}
                  />
                  <LogoutButton />
                </div>
              </SidebarBody>
            </Sidebar>
            <div className="flex-1">
              <Outlet />
            </div>
          </div>
        </SidebarProvider>
      </CalendarProvider>
    </TRPCProvider>
  );
}

const SidebarContentWrapper = ({ links }: { links: any[] }) => {
  const { open } = useSidebar();

  return (
    <>
      {open ? <Logo /> : <LogoIcon />}
      <div className="mt-8 flex flex-col gap-2">
        {links.map((link) => (
          <SidebarLink key={link.href} link={link} />
        ))}
      </div>
    </>
  );
};

const Logo = () => {
  return (
    <Link
      to="/"
      className="relative z-20 flex items-center space-x-2 py-1 font-normal text-foreground text-sm"
    >
      <div className="h-5 w-6 flex-shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-gradient-to-r from-primary to-accent" />
      <span className="whitespace-pre bg-gradient-to-r from-primary to-accent bg-clip-text font-bold text-transparent text-xl">
        AegisWallet
      </span>
    </Link>
  );
};

const LogoIcon = () => {
  return (
    <Link
      to="/"
      className="relative z-20 flex items-center space-x-2 py-1 font-normal text-foreground text-sm"
    >
      <div className="h-5 w-6 flex-shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-gradient-to-r from-primary to-accent" />
    </Link>
  );
};

const LogoutButton = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { open } = useSidebar();

  const handleLogout = async () => {
    await signOut();
    navigate({
      to: '/login',
      search: { redirect: '/dashboard', error: undefined },
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={cn(
        'group/sidebar flex w-full items-center justify-start gap-2 py-2 text-left',
        'rounded-md px-2 transition-colors hover:bg-sidebar-accent'
      )}
    >
      <LogOut className="h-5 w-5 flex-shrink-0 text-sidebar-foreground" />
      <motion.span
        animate={{
          display: open ? 'inline-block' : 'none',
          opacity: open ? 1 : 0,
        }}
        className="!p-0 !m-0 inline-block whitespace-pre text-sidebar-foreground text-sm transition duration-150 group-hover/sidebar:translate-x-1"
      >
        Sair
      </motion.span>
    </button>
  );
};
