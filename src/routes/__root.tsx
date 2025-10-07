import {
  createRootRoute,
  type ErrorComponentProps,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from '@tanstack/react-router'
import { Calendar, FileText, Home, LogOut, Mic, Send, Wallet } from 'lucide-react'
import { motion } from 'motion/react'

import { CalendarProvider } from '@/components/calendar/calendar-context'
import { TRPCProvider } from '@/components/providers/TRPCProvider'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { Sidebar, SidebarBody, SidebarLink, SidebarContent, SidebarProvider, useSidebar } from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

function ErrorBoundary({ error }: ErrorComponentProps) {
  return (
    <div className="p-4 text-red-500 bg-red-50 min-h-screen flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-red-700 mb-4">Oops, something went wrong!</h2>
        <p className="text-red-600 mb-4">
          We encountered an unexpected error. Please try again later.
        </p>
        <pre className="bg-red-50 p-4 rounded-md text-sm text-red-800 overflow-auto">
          <code>{error.message}</code>
          {error.stack && <div className="mt-4 text-xs">{error.stack}</div>}
        </pre>
      </div>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: ErrorBoundary,
})

function RootComponent() {
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
        <SidebarProvider>
          <div className="flex h-screen w-full">
            <Sidebar>
              <SidebarBody className="justify-between gap-10">
                <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
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
                      icon: <Mic className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />,
                    }}
                  />
                  <LogoutButton />
                </div>
              </SidebarBody>
            </Sidebar>
            <SidebarInset>
              <Outlet />
            </SidebarInset>
          </div>
        </SidebarProvider>
      </CalendarProvider>
    </TRPCProvider>
  )
}

const SidebarContentWrapper = ({ links }: { links: any[] }) => {
  const { open } = useSidebar()
  
  return (
    <>
      {open ? <Logo /> : <LogoIcon />}
      <div className="mt-8 flex flex-col gap-2">
        {links.map((link, idx) => (
          <SidebarLink key={idx} link={link} />
        ))}
      </div>
    </>
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
