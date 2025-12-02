import { AlertCircle } from 'lucide-react';
import { useId } from 'react';

import { PricingCard } from './PricingCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlans, useSubscription } from '@/hooks/billing';

export function PricingTable() {
	const { data: plans, isLoading: plansLoading, error: plansError } = usePlans();
	const { data: subscription } = useSubscription();
	const descriptionId = useId();

	if (plansLoading) {
		return (
			<div className="space-y-4">
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 overflow-x-auto">
					<div className="flex gap-6 pb-4 min-w-[320px]">
						{[...Array(3)].map((_, i) => (
							<div key={`skeleton-${i}`} className="flex-shrink-0 w-[300px]">
								<Skeleton className="h-[500px] rounded-lg" />
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (plansError) {
		return (
			<div role="alert" aria-live="polite">
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" aria-hidden="true" />
					<AlertDescription>
						Erro ao carregar os planos. Por favor, tente novamente.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	if (!plans || plans.length === 0) {
		return (
			<output aria-live="polite">
				<Alert>
					<AlertCircle className="h-4 w-4" aria-hidden="true" />
					<AlertDescription>Nenhum plano disponível no momento.</AlertDescription>
				</Alert>
			</output>
		);
	}

	const currentPlanId = subscription?.plan?.id || 'free';

	return (
		<div className="space-y-4">
			{/* Mobile-first horizontal scroll container */}
			<section
				className="relative overflow-x-auto pb-4 md:hidden"
				aria-label="Seleção de planos de assinatura"
				aria-describedby={descriptionId}
			>
				<div className="flex gap-6 min-w-max">
					{plans.map((plan: (typeof plans)[number], index: number) => (
						<div key={plan.id} className="flex-shrink-0 w-[280px]">
							<PricingCard
								plan={plan}
								currentPlanId={currentPlanId}
								recommended={index === 1} // Middle plan is recommended
							/>
						</div>
					))}
				</div>

				{/* Scroll indicator for mobile */}
				<div className="flex justify-center mt-2">
					<div className="flex gap-1">
						{plans.map((_, index: number) => (
							<div
								key={`dot-${index}`}
								className="w-2 h-2 rounded-full bg-muted-foreground/30"
								aria-hidden="true"
							/>
						))}
					</div>
				</div>
			</section>
			{/* Desktop/Tablet grid layout */}
			<section
				className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6"
				aria-label="Planos de assinatura"
				aria-describedby={descriptionId}
			>
				{plans.map((plan: (typeof plans)[number], index: number) => (
					<PricingCard
						key={plan.id}
						plan={plan}
						currentPlanId={currentPlanId}
						recommended={index === 1} // Middle plan is recommended
					/>
				))}
			</section>

			{/* Screen reader description */}
			<div id={descriptionId} className="sr-only">
				<h3>Tabela de planos disponíveis</h3>
				<p>
					Use as setas do teclado para navegar entre os planos.
					{plans.length > 0 && ` Existem ${plans.length} planos disponíveis.`}
				</p>
			</div>
		</div>
	);
}
