import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Loading placeholder component
function SaldoLoader() {
	return (
		<div className="container mx-auto space-y-6 p-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<Skeleton className="mb-2 h-9 w-24" />
					<Skeleton className="h-5 w-48" />
				</div>
				<Skeleton className="h-12 w-48" />
			</div>

			{/* Total Balance Card */}
			<Card className="border-2 border-primary/20" variant="glass">
				<CardHeader>
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-12 w-48" />
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
				<Skeleton className="mb-4 h-8 w-32" />
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<Card key={i} variant="glass">
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<Skeleton className="h-4 w-24" />
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
			<Card variant="glass">
				<CardHeader>
					<Skeleton className="mb-2 h-6 w-40" />
					<Skeleton className="h-4 w-28" />
				</CardHeader>
				<CardContent>
					<div className="flex h-64 items-center justify-center rounded-lg border-2 border-muted border-dashed">
						<div className="text-center">
							<Skeleton className="mx-auto mb-2 h-12 w-12 rounded" />
							<Skeleton className="mx-auto mb-1 h-5 w-48" />
							<Skeleton className="mx-auto h-4 w-36" />
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Recent Transactions */}
			<Card variant="glass">
				<CardHeader>
					<Skeleton className="mb-2 h-6 w-48" />
					<Skeleton className="h-4 w-36" />
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[1, 2, 3, 4, 5].map((i) => (
							<div key={i} className="flex items-center justify-between rounded-lg border p-3">
								<div className="flex items-center gap-3">
									<Skeleton className="h-5 w-5" />
									<div>
										<Skeleton className="mb-1 h-4 w-32" />
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
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<Card key={i} className="h-auto py-4" variant="glass">
						<CardContent className="pt-6">
							<div className="text-center">
								<Skeleton className="mx-auto mb-2 h-6 w-6" />
								<Skeleton className="mx-auto mb-1 h-5 w-20" />
								<Skeleton className="mx-auto h-3 w-24" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

import { z } from 'zod';

// Search params schema for the route
const saldoSearchSchema = z.object({
	tab: z.enum(['overview', 'transactions', 'bills']).optional().catch(undefined),
});

export const Route = createFileRoute('/saldo')({
	component: lazy(() => import('./saldo.lazy').then((m) => ({ default: m.Saldo }))),
	pendingComponent: () => <SaldoLoader />,
	validateSearch: saldoSearchSchema,
});
