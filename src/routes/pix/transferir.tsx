import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Loading component for PixTransfer
const PixTransferLoader = () => (
  <div className="container mx-auto max-w-2xl px-4 py-8">
    <div className="mb-6">
      <Skeleton className="mb-4 h-10 w-48" />
      <Skeleton className="mb-2 h-9 w-64" />
      <Skeleton className="h-5 w-96" />
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  </div>
);

export const Route = createFileRoute('/pix/transferir')({
  component: lazy(() => import('./transferir.lazy').then((m) => ({ default: m.PixTransferPage }))),
  pendingComponent: () => <PixTransferLoader />,
});
