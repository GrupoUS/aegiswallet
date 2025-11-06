import { Search } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { PixChart } from '@/components/pix/PixChart';
import { PixConverter } from '@/components/pix/PixConverter';
import { PixSidebar } from '@/components/pix/PixSidebar';
import { PixTransactionsTable } from '@/components/pix/PixTransactionsTable';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { Input } from '@/components/ui/input';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

function UserDropdown() {
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-pix-primary to-pix-accent font-semibold text-white">
        {user?.email?.[0].toUpperCase() || 'U'}
      </div>
    </div>
  );
}

export function PixDashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const id = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-pix-primary border-b-2"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-1 flex-col overflow-hidden border border bg-background md:flex-row',
        'h-screen'
      )}
    >
      <SidebarProvider>
        <PixSidebar open={open} setOpen={setOpen} />
        <div className="flex-1 overflow-auto px-4 md:px-6 lg:px-8">
          {/* Header */}
          <header className="-mx-2 sticky top-0 z-50 bg-sidebar/90 px-2 backdrop-blur-sm">
            <div className="mx-auto flex w-full max-w-7xl shrink-0 items-center gap-2 border-b py-4">
              <div className="flex-1">
                <div className="relative inline-flex">
                  <Input
                    id={id}
                    className="h-8 w-fit min-w-65 border-transparent bg-border ps-9 pe-9"
                    placeholder="Buscar transações..."
                    aria-label="Search"
                  />
                  <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-muted-foreground peer-disabled:opacity-50">
                    <Search size={20} aria-hidden="true" />
                  </div>
                  <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-2 text-muted-foreground">
                    <kbd className="inline-flex size-5 max-h-full items-center justify-center rounded bg-background px-1 font-[inherit] font-medium text-[0.625rem] text-muted-foreground/70 shadow-xs">
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
          <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 py-6 max-lg:flex-col">
            {/* Converter widget */}
            <div className="shrink-0 lg:order-1 lg:w-90">
              <PixConverter />
            </div>

            {/* Chart and table */}
            <div className="flex min-w-0 flex-1 flex-col gap-6">
              <PixChart />
              <PixTransactionsTable />
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
