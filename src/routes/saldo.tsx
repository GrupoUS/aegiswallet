import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Loading placeholder component
function SaldoLoader() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-9 w-24 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-12 w-48" />
      </div>

      {/* Total Balance Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardDescription>
            <Skeleton className="h-4 w-24" />
          </CardDescription>
          <CardTitle>
            <Skeleton className="h-12 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Accounts Breakdown */}
      <div>
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>
                    <Skeleton className="h-4 w-24" />
                  </CardDescription>
                  <Skeleton className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Balance History Chart Placeholder */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <CardDescription>
            <Skeleton className="h-4 w-28" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
            <div className="text-center">
              <Skeleton className="h-12 w-12 mx-auto mb-2 rounded" />
              <Skeleton className="h-5 w-48 mx-auto mb-1" />
              <Skeleton className="h-4 w-36 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <CardDescription>
            <Skeleton className="h-4 w-36" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-auto py-4">
            <CardContent className="pt-6">
              <div className="text-center">
                <Skeleton className="h-6 w-6 mx-auto mb-2" />
                <Skeleton className="h-5 w-20 mx-auto mb-1" />
                <Skeleton className="h-3 w-24 mx-auto" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/saldo')({
  component: lazy(() => import('./saldo.lazy').then((m) => ({ default: m.Saldo }))),
  pendingComponent: () => <SaldoLoader />,
})
