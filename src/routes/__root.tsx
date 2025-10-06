import { createRootRoute, Outlet, Link } from '@tanstack/react-router'
import { TRPCProvider } from '@/components/providers/TRPCProvider'
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'
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

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const [open, setOpen] = useState(false)

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
            <div>
              <SidebarLink
                link={{
                  label: 'Assistente de Voz',
                  href: '/',
                  icon: <Mic className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                }}
              />
              <SidebarLink
                link={{
                  label: 'Sair',
                  href: '/login',
                  icon: <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                }}
              />
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
