import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
import { RouteErrorBoundary } from '@/components/routes/RouteErrorBoundary';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Loading component for the entire dashboard page
const DashboardLoader = () => (
	<div className="container mx-auto space-y-6 p-4">
		<div className="flex items-center justify-between">
			<div>
				<Skeleton className="mb-2 h-10 w-48" />
				<Skeleton className="h-5 w-64" />
			</div>
		</div>
		<div className="space-y-6">
			<Skeleton className="h-8 w-48" />
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }, (_, index) => `dashboard-loader-card-${index}`).map((cardId) => (
					<Card key={cardId} variant="glass">
						<CardHeader>
							<Skeleton className="h-6 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-20 w-full" />
						</CardContent>
					</Card>
				))}
			</div>
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{Array.from({ length: 3 }, (_, index) => `dashboard-loader-section-${index}`).map(
					(sectionId) => (
						<Card key={sectionId} variant="glass">
							<CardHeader>
								<Skeleton className="h-6 w-32" />
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{Array.from({ length: 3 }, (_, index) => `dashboard-loader-row-${index}`).map(
										(rowId) => (
											<div key={rowId} className="flex items-center justify-between">
												<Skeleton className="h-5 w-24" />
												<Skeleton className="h-5 w-16" />
											</div>
										),
									)}
								</div>
							</CardContent>
						</Card>
					),
				)}
			</div>
		</div>
	</div>
);

export const Route = createFileRoute('/dashboard')({
	component: lazy(() => import('./dashboard.lazy').then((m) => ({ default: m.Dashboard }))),
	pendingComponent: () => <DashboardLoader />,
});
