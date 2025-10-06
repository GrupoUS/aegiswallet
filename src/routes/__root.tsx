import { createRootRoute, Outlet, Link, useLocation, useNavigate } from '@tanstack/react-router'
import { TRPCProvider } from '@/components/providers/TRPCProvider'
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from '@/components/ui/sidebar'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { AccessibilitySettings } from '@/components/accessibility/AccessibilitySettings'
import { useState } from 'react'
import {
  Home,
  Wallet,
  PieChart,
  FileText,
  Send,
  Receipt,
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
      icon: <Home className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: 'Saldo',
      href: '/saldo',
      icon: <Wallet className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: 'Orçamento',
      href: '/orcamento',
      icon: <PieChart className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: 'Contas',
      href: '/contas',
      icon: <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: 'PIX',
      href: '/pix',
      icon: <Send className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: 'Transações',
      href: '/transactions',
      icon: <Receipt className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
  ]

  // Render without sidebar for login page
  if (!showSidebar) {
    return (
      <TRPCProvider>
        <div className="min-h-screen bg-background">
          <Outlet />
        </div>
      </TRPCProvider>
    )
  }

  // Render with sidebar for authenticated pages
  return (
    <TRPCProvider>
      <div
        className={cn(
          'flex flex-col md:flex-row bg-background w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden',
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
              {/* Theme and Accessibility Controls */}
              <div className="flex items-center gap-2 px-2 py-1">
                <AnimatedThemeToggler />
                {open && (
                  <div className="w-32">
                    <AccessibilitySettings />
                  </div>
                )}
              </div>
              
              <SidebarLink
                link={{
                  label: 'Assistente de Voz',
                  href: '/',
                  icon: <Mic className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
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
    </TRPCProvider>
  )
}

const Logo = () => {
  return (
    <Link
      to="/"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
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
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
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
        'hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md px-2 transition-colors'
      )}
    >
      <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        Sair
      </motion.span>
    </button>
  )
}
