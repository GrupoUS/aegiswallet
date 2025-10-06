import { createRootRoute, Outlet, Link, useLocation, useNavigate } from '@tanstack/react-router'
import { TRPCProvider } from '@/components/providers/TRPCProvider'
import { CalendarProvider } from '@/components/calendar/calendar-context'
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from '@/components/ui/sidebar'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { useState } from 'react'
import {
  Home,
  Wallet,
  Calendar,
  FileText,
  Send,
  Mic,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'motion/react'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Pages that should not show the sidebar
  const noSidebarPages = ['/login']
  const showSidebar = !noSidebarPages.includes(location.pathname)

  const links = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />,
    },
    {
      label: 'Saldo',
      href: '/saldo',
      icon: <Wallet className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />,
    },
    {
      label: 'Calendário',
      href: '/calendario',
      icon: <Calendar className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />,
    },
    {
      label: 'Contas',
      href: '/contas',
      icon: <FileText className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />,
    },
    {
      label: 'PIX',
      href: '/pix',
      icon: <Send className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />,
    },
  ]

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
    )
  }

  // Render with sidebar for authenticated pages
  return (
    <TRPCProvider>
      <CalendarProvider>
        <div
          className={cn(
            'flex flex-col md:flex-row bg-background w-full flex-1 mx-auto border border-border overflow-hidden',
            'h-screen'
          )}
        >
          <Sidebar open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10">
              <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                {open ? <Logo /> : <LogoIcon />}
                <div className="mt-8 flex flex-col gap-2">
                  {links.map((link, idx) => (
                    <SidebarLink key={idx} link={link} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center py-2">
                  <AnimatedThemeToggler />
                </div>
                <SidebarLink
                  link={{
                    label: 'Assistente de Voz',
                    href: '/',
                    icon: <Mic className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />,
                  }}
                />
                <LogoutButton />
              </div>
            </SidebarBody>
          </Sidebar>
          <div className="flex flex-1 overflow-auto">
            <div className="flex-1 w-full">
              <Outlet />
            </div>
          </div>
        </div>
      </CalendarProvider>
    </TRPCProvider>
  )
}

const Logo = () => {
  return (
    <Link
      to="/"
      className="font-normal flex space-x-2 items-center text-sm text-foreground py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-gradient-to-r from-primary to-accent rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent whitespace-pre">
        AegisWallet
      </span>
    </Link>
  )
}

const LogoIcon = () => {
  return (
    <Link
      to="/"
      className="font-normal flex space-x-2 items-center text-sm text-foreground py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-gradient-to-r from-primary to-accent rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  )
}

const LogoutButton = () => {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { open, animate } = useSidebar()

  const handleLogout = async () => {
    await signOut()
    navigate({ to: '/login', search: { redirect: '/dashboard' } })
  }

  return (
    <button
      onClick={handleLogout}
      className={cn(
        'flex items-center justify-start gap-2 group/sidebar py-2 w-full text-left',
        'hover:bg-sidebar-accent rounded-md px-2 transition-colors'
      )}
    >
      <LogOut className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sidebar-foreground text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        Sair
      </motion.span>
    </button>
  )
}
