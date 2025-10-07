import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Loading placeholder component
function PixLoader() {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row bg-background w-full flex-1 mx-auto border border overflow-hidden',
        'h-screen'
      )}
    >
      {/* Sidebar Placeholder */}
      <div className="w-64 bg-sidebar border-r p-4">
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
        <header className="bg-sidebar/90 backdrop-blur-sm sticky top-0 z-50 -mx-2 px-2">
          <div className="flex shrink-0 items-center gap-2 border-b py-4 w-full max-w-7xl mx-auto">
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
        <div className="flex max-lg:flex-col flex-1 gap-6 py-6 w-full max-w-7xl mx-auto">
          {/* Converter widget placeholder */}
          <div className="lg:order-1 lg:w-90 shrink-0">
            <Card>
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
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="h-48 w-full max-w-md" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-5 h-5" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
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
  )
}

export const Route = createFileRoute('/pix/')({
  component: lazy(() => import('./index.lazy').then((m) => ({ default: m.PixDashboard }))),
  pendingComponent: () => <PixLoader />,
})
