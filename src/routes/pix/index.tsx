import { createFileRoute } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { PixChart } from '@/components/pix/PixChart'
import { PixConverter } from '@/components/pix/PixConverter'
import { PixSidebar } from '@/components/pix/PixSidebar'
import { PixTransactionsTable } from '@/components/pix/PixTransactionsTable'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { Input } from '@/components/ui/input'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/pix/')({
  component: PixDashboard,
})

function UserDropdown() {
  const { user } = useAuth()

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-semibold">
        {user?.email?.[0].toUpperCase() || 'U'}
      </div>
    </div>
  )
}

function PixDashboard() {
  const { isAuthenticated, isLoading } = useAuth()
  const id = useId()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login'
    }
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row bg-background w-full flex-1 mx-auto border border overflow-hidden',
        'h-screen'
      )}
    >
      <SidebarProvider>
        <PixSidebar open={open} setOpen={setOpen} />
        <div className="flex-1 overflow-auto px-4 md:px-6 lg:px-8">
          {/* Header */}
          <header className="bg-sidebar/90 backdrop-blur-sm sticky top-0 z-50 -mx-2 px-2">
            <div className="flex shrink-0 items-center gap-2 border-b py-4 w-full max-w-7xl mx-auto">
              <div className="flex-1">
                <div className="relative inline-flex">
                  <Input
                    id={id}
                    className="h-8 ps-9 pe-9 bg-border border-transparent w-fit min-w-65"
                    placeholder="Buscar transações..."
                    aria-label="Search"
                  />
                  <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-muted-foreground peer-disabled:opacity-50">
                    <Search size={20} aria-hidden="true" />
                  </div>
                  <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-2 text-muted-foreground">
                    <kbd className="inline-flex size-5 max-h-full items-center justify-center rounded bg-background shadow-xs px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                      /
                    </kbd>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <AnimatedThemeToggler />
                <UserDropdown />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex max-lg:flex-col flex-1 gap-6 py-6 w-full max-w-7xl mx-auto">
            {/* Converter widget */}
            <div className="lg:order-1 lg:w-90 shrink-0">
              <PixConverter />
            </div>

            {/* Chart and table */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
              <PixChart />
              <PixTransactionsTable />
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}
