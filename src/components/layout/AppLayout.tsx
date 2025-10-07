import {
  IconAccessible,
  IconArrowLeft,
  IconBrandTabler,
  IconHome,
  IconReceipt,
  IconSettings,
  IconUserBolt,
} from '@tabler/icons-react'
import { Link, Outlet } from '@tanstack/react-router'
import React, { useCallback, useMemo, useState } from 'react'
import { useAccessibility } from '@/components/accessibility/AccessibilityProvider'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { Button } from '@/components/ui/button'
import { Sidebar, SidebarBody, SidebarLink, SidebarProvider } from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export const AppLayout = React.memo(function AppLayout() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { showSettings, setShowSettings } = useAccessibility()

  // Memoizar links de navegação para evitar recriação a cada render
  const links = useMemo(
    () => [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: <IconHome className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      },
      {
        label: 'Transactions',
        href: '/transactions',
        icon: (
          <IconReceipt className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        ),
      },
      {
        label: 'Profile',
        href: '/profile',
        icon: (
          <IconUserBolt className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        ),
      },
      {
        label: 'Settings',
        href: '/settings',
        icon: (
          <IconSettings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        ),
      },
    ],
    []
  )

  // Memoizar URL do avatar para evitar recriação
  const avatarUrl = useMemo(() => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`
  }, [user?.email])

  // Otimizar manipuladores com useCallback
  const handleToggleSidebar = useCallback((newOpen: boolean | ((prev: boolean) => boolean)) => {
    setOpen(newOpen)
  }, [])

  const handleToggleAccessibility = useCallback(() => {
    setShowSettings(!showSettings)
  }, [showSettings, setShowSettings])

  const handleSignOut = useCallback(() => {
    signOut()
  }, [signOut])

  return (
    <SidebarProvider open={open} onOpenChange={handleToggleSidebar}>
      <div
        className={cn(
          'flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden',
          'h-screen'
        )}
      >
        <Sidebar>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {open ? <Logo /> : <LogoIcon />}
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </div>
            </div>
            <div>
              {/* Theme Toggle */}
              <Button variant="ghost" className="w-full justify-start gap-2 mb-2" asChild>
                <div className="flex items-center gap-2">
                  <AnimatedThemeToggler className="h-5 w-5" />
                  {open && (
                    <span className="text-sm text-neutral-700 dark:text-neutral-200">Theme</span>
                  )}
                </div>
              </Button>

              {/* Accessibility Button */}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 mb-4"
                onClick={handleToggleAccessibility}
              >
                <IconAccessible className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                {open && (
                  <span className="text-sm text-neutral-700 dark:text-neutral-200">
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
                className="w-full justify-start gap-2 mt-2"
              >
                <IconArrowLeft className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                {open && <span>Logout</span>}
              </Button>
            </div>
          </SidebarBody>
        </Sidebar>
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-10 bg-white dark:bg-neutral-900 h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
})

export const Logo = React.memo(function Logo() {
  return (
    <Link
      to="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <IconBrandTabler className="h-5 w-5 flex-shrink-0 text-black dark:text-white" />
      <span className="font-medium text-black dark:text-white whitespace-pre">AegisWallet</span>
    </Link>
  )
})

export const LogoIcon = React.memo(function LogoIcon() {
  return (
    <Link
      to="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <IconBrandTabler className="h-5 w-5 flex-shrink-0 text-black dark:text-white" />
    </Link>
  )
})
