import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Componente de loading para a lista de contas
function BillsListLoader() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }, (_, index) => `bill-skeleton-${index}`).map((skeletonId) => (
        <Card key={skeletonId} className="transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-1 items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="mt-1 flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <Skeleton className="mb-2 h-8 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-10 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export const Route = createFileRoute('/contas')({
  component: lazy(() => import('./contas.lazy').then((m) => ({ default: m.Contas }))),
  pendingComponent: () => <BillsListLoader />,
});
