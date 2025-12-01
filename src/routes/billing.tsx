import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';

import { RouteErrorBoundary } from '@/components/routes/RouteErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

const BillingLoader = () => (
	<div className="container mx-auto space-y-8 p-4">
		<Skeleton className="h-12 w-64 mx-auto" />
		<Skeleton className="h-6 w-96 mx-auto" />
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
			{[1, 2, 3].map((i) => (
				<Skeleton key={i} className="h-96" />
			))}
		</div>
	</div>
);

export const Route = createFileRoute('/billing')({
	component: lazy(() => import('./billing/index.lazy').then((m) => ({ default: m.BillingPage }))),
	pendingComponent: () => <BillingLoader />,
	errorComponent: RouteErrorBoundary,
});
