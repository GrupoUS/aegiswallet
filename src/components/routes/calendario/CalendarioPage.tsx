import { Suspense } from 'react';

import { FinancialCalendar } from '@/components/calendar/financial-calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteGuard } from '@/lib/auth/route-guard';

function CalendarLoader() {
	return (
		<div className="flex h-full flex-col space-y-4 p-6">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-48" />
				<div className="flex space-x-2">
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-10 w-24" />
				</div>
			</div>

			<div className="flex-1">
				<div className="mb-2 grid grid-cols-7 gap-1">
					{['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((dayKey) => (
						<Skeleton key={`weekday-${dayKey}`} className="h-8 w-full" />
					))}
				</div>

				<div className="grid grid-cols-7 gap-1">
					{Array.from({ length: 35 }, (_, index) => `day-${index}`).map((cellKey) => (
						<Skeleton key={cellKey} className="h-20 w-full" />
					))}
				</div>
			</div>
		</div>
	);
}

export function CalendarioPage() {
	return (
		<RouteGuard>
			<div className="flex h-full flex-col p-6">
				<Suspense fallback={<CalendarLoader />}>
					<FinancialCalendar />
				</Suspense>
			</div>
		</RouteGuard>
	);
}
