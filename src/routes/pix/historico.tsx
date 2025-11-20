import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Loading placeholder component
const PixHistoryLoader = () => (
  <div className="container mx-auto max-w-7xl px-4 py-8">
    <div className="mb-6">
      <Skeleton className="mb-4 h-10 w-48" />
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-9 w-80" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
    </div>

    {/* Filters placeholder */}
    <Card className="mb-6" variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-16" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Skeleton className="h-4 w-16" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>

    {/* Transactions Summary placeholder */}
    <div className="mb-6 grid gap-4 md:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} variant="glass">
          <CardContent className="pt-6">
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Transactions Table placeholder */}
    <Card variant="glass">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, index) => `pix-history-skeleton-${index}`).map(
            (skeletonId) => (
              <div key={skeletonId} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);

export const Route = createFileRoute('/pix/historico')({
  component: lazy(() => import('./historico.lazy').then((m) => ({ default: m.PixHistoryPage }))),
  pendingComponent: () => <PixHistoryLoader />,
});
