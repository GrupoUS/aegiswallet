import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Loading placeholder component
function PixLoader() {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-1 flex-col overflow-hidden border border bg-background md:flex-row',
        'h-screen'
      )}
    >
      {/* Sidebar Placeholder */}
      <div className="w-64 border-r bg-sidebar p-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Placeholder */}
      <div className="flex-1 overflow-auto px-4 md:px-6 lg:px-8">
        {/* Header Placeholder */}
        <header className="-mx-2 sticky top-0 z-50 bg-sidebar/90 px-2 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl shrink-0 items-center gap-2 border-b py-4">
            <div className="flex-1">
              <Skeleton className="h-8 w-64" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </header>

        {/* Content Placeholder */}
        <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 py-6 max-lg:flex-col">
          {/* Converter widget placeholder */}
          <div className="shrink-0 lg:order-1 lg:w-90">
            <Card variant="glass">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-20" />
              </CardContent>
            </Card>
          </div>

          {/* Chart and table placeholder */}
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <Card variant="glass">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center">
                  <Skeleton className="h-48 w-full max-w-md" />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5" />
                        <div>
                          <Skeleton className="mb-1 h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/pix/')({
  component: lazy(() => import('./index.lazy').then((m) => ({ default: m.PixDashboard }))),
  pendingComponent: () => <PixLoader />,
});
