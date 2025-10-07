import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Loading placeholder component
const PixReceiveLoader = () => (
  <div className="container mx-auto py-8 px-4 max-w-4xl">
    <div className="mb-6">
      <Skeleton className="h-10 w-48 mb-4" />
      <Skeleton className="h-9 w-64 mb-2" />
      <Skeleton className="h-5 w-96" />
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      {/* QR Code Generator placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="bg-muted aspect-square rounded-lg flex items-center justify-center">
            <Skeleton className="w-16 h-16" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-24 mx-auto" />
        </CardContent>
      </Card>

      {/* PIX Keys List placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="w-8 h-8" />
            </div>
          ))}
          <div className="bg-info/10 dark:bg-info/20 p-4 rounded-lg mt-4">
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Recent Received Transactions placeholder */}
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-48" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Skeleton className="h-5 w-64 mx-auto" />
        </div>
      </CardContent>
    </Card>
  </div>
)

export const Route = createFileRoute('/pix/receber')({
  component: lazy(() => import('./receber.lazy').then((m) => ({ default: m.PixReceivePage }))),
  pendingComponent: () => <PixReceiveLoader />,
})
