import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Loading component for billing page
const BillingLoader = () => (
	<div className="container mx-auto space-y-8 p-4">
		<div className="text-center space-y-4">
			<Skeleton className="mx-auto h-12 w-96" />
			<Skeleton className="mx-auto h-6 w-80" />
		</div>
		
		<Card className="border-2 border-primary/20">
			<CardHeader>
				<div className="flex items-center gap-2">
					<Skeleton className="h-5 w-5" />
					<Skeleton className="h-6 w-32" />
				</div>
				<Skeleton className="h-4 w-64" />
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{Array.from({ length: 3 }, (_, i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-6 w-20" />
						</div>
					))}
				</div>
			</CardContent>
		</Card>

		<div className="space-y-6">
			<div className="text-center">
				<Skeleton className="mx-auto h-8 w-48 mb-2" />
				<Skeleton className="mx-auto h-4 w-80" />
			</div>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{Array.from({ length: 3 }, (_, i) => (
					<Card key={i} variant="outline">
						<CardHeader>
							<Skeleton className="h-6 w-32" />
							<Skeleton className="h-4 w-48" />
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{Array.from({ length: 4 }, (_, j) => (
									<Skeleton key={j} className="h-4 w-full" />
								))}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	</div>
);

export const Route = createFileRoute('/billing')({
	component: lazy(() => import('./billing.lazy').then((m) => ({ default: m.BillingPage }))),
	pendingComponent: () => <BillingLoader />,
});
