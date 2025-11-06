import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Loading placeholder component
const PixReceiveLoader = () => (
  <div className="container mx-auto max-w-4xl px-4 py-8">
    <div className="mb-6">
      <Skeleton className="mb-4 h-10 w-48" />
      <Skeleton className="mb-2 h-9 w-64" />
      <Skeleton className="h-5 w-96" />
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      {/* QR Code Generator placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
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
          <div className="flex aspect-square items-center justify-center rounded-lg bg-muted">
            <Skeleton className="h-16 w-16" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="mx-auto h-3 w-24" />
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
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex-1">
                <Skeleton className="mb-1 h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
          <div className="mt-4 rounded-lg bg-info/10 p-4 dark:bg-info/20">
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
        <div className="py-8 text-center">
          <Skeleton className="mx-auto h-5 w-64" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export const Route = createFileRoute('/pix/receber')({
  component: lazy(() => import('./receber.lazy').then((m) => ({ default: m.PixReceivePage }))),
  pendingComponent: () => <PixReceiveLoader />,
});
