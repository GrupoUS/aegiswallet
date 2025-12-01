import { AlertCircle } from 'lucide-react';

import { PricingCard } from './PricingCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlans, useSubscription } from '@/hooks/billing';

export function PricingTable() {
	const { data: plans, isLoading: plansLoading, error: plansError } = usePlans();
	const { data: subscription } = useSubscription();

	if (plansLoading) {
		return (
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{[...Array(3)].map((_, i) => (
					<Skeleton key={`skeleton-${i}`} className="h-[500px] rounded-lg" />
				))}
			</div>
		);
	}

	if (plansError) {
		return (
			<Alert variant="destructive">
				<AlertCircle className="h-4 w-4" />
				<AlertDescription>Erro ao carregar os planos. Por favor, tente novamente.</AlertDescription>
			</Alert>
		);
	}

	if (!plans || plans.length === 0) {
		return (
			<Alert>
				<AlertDescription>Nenhum plano disponível no momento.</AlertDescription>
			</Alert>
		);
	}

	const currentPlanId = subscription?.plan?.id || 'free';

	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{plans.map((plan: (typeof plans)[number], index: number) => (
				<PricingCard
					key={plan.id}
					plan={plan}
					currentPlanId={currentPlanId}
					recommended={index === 1} // Middle plan is recommended
				/>
			))}
		</div>
	);
}
