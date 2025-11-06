import {
  IconAccessible,
  IconArrowLeft,
  IconBrandTabler,
  IconHome,
  IconReceipt,
  IconSettings,
  IconUserBolt,
} from '@tabler/icons-react';
import { Link, Outlet } from '@tanstack/react-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useAccessibility } from '@/components/accessibility/AccessibilityProvider';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarBody, SidebarLink, SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export const AppLayout = React.memo(function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { showSettings, setShowSettings } = useAccessibility();

  // Memoizar links de navegação para evitar recriação a cada render
  const links = useMemo(
    () => [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: <IconHome className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
      },
      {
        label: 'Transactions',
        href: '/transactions',
        icon: (
          <IconReceipt className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
        ),
      },
      {
        label: 'Profile',
        href: '/profile',
        icon: (
          <IconUserBolt className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
        ),
      },
      {
        label: 'Settings',
        href: '/settings',
        icon: (
          <IconSettings className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
        ),
      },
    ],
    []
  );

  // Memoizar URL do avatar para evitar recriação
  const avatarUrl = useMemo(() => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`;
  }, [user?.email]);

  // Otimizar manipuladores com useCallback
  const handleToggleSidebar = useCallback((newOpen: boolean | ((prev: boolean) => boolean)) => {
    setOpen(newOpen);
  }, []);

  const handleToggleAccessibility = useCallback(() => {
    setShowSettings(!showSettings);
  }, [showSettings, setShowSettings]);

  const handleSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  return (
    <SidebarProvider open={open} onOpenChange={handleToggleSidebar}>
      <div
        className={cn(
          'mx-auto flex w-full flex-1 flex-col overflow-hidden border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800',
          'h-screen'
        )}
      >
        <Sidebar>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
              {open ? <Logo /> : <LogoIcon />}
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link) => (
                  <SidebarLink key={link.href} link={link} />
                ))}
              </div>
            </div>
            <div>
              {/* Theme Toggle */}
              <Button variant="ghost" className="mb-2 w-full justify-start gap-2" asChild>
                <div className="flex items-center gap-2">
                  <AnimatedThemeToggler className="h-5 w-5" />
                  {open && (
                    <span className="text-neutral-700 text-sm dark:text-neutral-200">Theme</span>
                  )}
                </div>
              </Button>

              {/* Accessibility Button */}
              <Button
                variant="ghost"
                className="mb-4 w-full justify-start gap-2"
                onClick={handleToggleAccessibility}
              >
                <IconAccessible className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
                {open && (
                  <span className="text-neutral-700 text-sm dark:text-neutral-200">
                    Accessibility
                  </span>
                )}
              </Button>

              <SidebarLink
                link={{
                  label: user?.email || 'User',
                  href: '#',
                  icon: (
                    <img
                      src={avatarUrl}
                      className="h-7 w-7 flex-shrink-0 rounded-full"
                      width={50}
                      height={50}
                      alt="Avatar"
                    />
                  ),
                }}
              />
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="mt-2 w-full justify-start gap-2"
              >
                <IconArrowLeft className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
                {open && <span>Logout</span>}
              </Button>
            </div>
          </SidebarBody>
        </Sidebar>
        <main className="flex-1 overflow-auto">
          <div className="h-full bg-white p-4 md:p-10 dark:bg-neutral-900">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
});

export const Logo = React.memo(function Logo() {
  return (
    <Link
      to="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 font-normal text-black text-sm"
    >
      <IconBrandTabler className="h-5 w-5 flex-shrink-0 text-black dark:text-white" />
      <span className="whitespace-pre font-medium text-black dark:text-white">AegisWallet</span>
    </Link>
  );
});

export const LogoIcon = React.memo(function LogoIcon() {
  return (
    <Link
      to="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 font-normal text-black text-sm"
    >
      <IconBrandTabler className="h-5 w-5 flex-shrink-0 text-black dark:text-white" />
    </Link>
  );
});
