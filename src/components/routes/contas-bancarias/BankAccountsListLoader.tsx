import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function BankAccountsListLoader() {
	return (
		<div className="container mx-auto space-y-6 p-4">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-10 w-32" />
			</div>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{['placeholder-1', 'placeholder-2', 'placeholder-3'].map(
					(placeholder) => (
						<Card key={placeholder} className="h-48">
							<CardContent className="p-6">
								<Skeleton className="mb-4 h-6 w-32" />
								<Skeleton className="mb-2 h-8 w-24" />
								<Skeleton className="h-4 w-16" />
							</CardContent>
						</Card>
					),
				)}
			</div>
		</div>
	);
}
