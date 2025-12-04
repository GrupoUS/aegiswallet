import { createFileRoute } from '@tanstack/react-router';

import { RouteErrorBoundary } from '@/components/routes/RouteErrorBoundary';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Loading component for import page
const ImportLoader = () => (
	<div className="container mx-auto space-y-6 p-4">
		<div className="flex items-center justify-between">
			<div>
				<Skeleton className="mb-2 h-10 w-64" />
				<Skeleton className="h-5 w-96" />
			</div>
		</div>
		<Card variant="glass">
			<CardHeader>
				<Skeleton className="h-6 w-48" />
			</CardHeader>
			<CardContent>
				<div className="flex flex-col items-center justify-center py-12 space-y-4">
					<Skeleton className="h-24 w-24 rounded-full" />
					<Skeleton className="h-6 w-64" />
					<Skeleton className="h-4 w-48" />
				</div>
			</CardContent>
		</Card>
	</div>
);

export const Route = createFileRoute('/import')({
	component: ImportLoader,
	pendingComponent: ImportLoader,
	errorComponent: RouteErrorBoundary,
});
