import { FeatureList } from './FeatureList';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { useCheckout } from '@/hooks/billing';
import { formatPrice } from '@/lib/billing/format-price';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan } from '@/types/billing';

interface PricingCardProps {
	plan: SubscriptionPlan & { priceFormatted: string };
	currentPlanId?: string;
	recommended?: boolean;
	onSelect?: (plan: SubscriptionPlan) => void;
}

export function PricingCard({ plan, currentPlanId, recommended, onSelect }: PricingCardProps) {
	const { mutate: createCheckout, isPending } = useCheckout();
	const isCurrent = currentPlanId === plan.id;
	const isFree = plan.id === 'free';

	const handleSelect = () => {
		if (isFree || isCurrent) return;

		if (onSelect) {
			onSelect(plan);
		} else if (plan.stripePriceId) {
			createCheckout({
				priceId: plan.stripePriceId,
				successUrl: `${window.location.origin}/billing/success`,
				cancelUrl: `${window.location.origin}/billing/cancel`,
			});
		}
	};

	return (
		<Card
			className={cn(
				'relative flex flex-col',
				recommended && 'border-primary shadow-lg',
				isCurrent && 'border-green-500',
			)}
		>
			{/* Show only one badge: isCurrent takes precedence over recommended */}
			{recommended && !isCurrent && (
				<Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="default">
					Recomendado
				</Badge>
			)}

			{isCurrent && (
				<Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="outline">
					Plano Atual
				</Badge>
			)}

			<CardHeader>
				<CardTitle>{plan.name}</CardTitle>
				<CardDescription>{plan.description}</CardDescription>
				<div className="mt-4">
					<span className="text-4xl font-bold">{formatPrice(plan.priceCents, plan.currency)}</span>
					{!isFree && <span className="text-muted-foreground">/mês</span>}
				</div>
			</CardHeader>

			<CardContent className="flex-1">
				<FeatureList features={plan.features ?? []} />
			</CardContent>

			<CardFooter>
				<Button
					className="w-full"
					variant={recommended ? 'default' : 'outline'}
					disabled={isFree || isCurrent || isPending}
					onClick={handleSelect}
				>
					{isCurrent
						? 'Plano Atual'
						: isFree
							? 'Gratuito'
							: isPending
								? 'Processando...'
								: 'Assinar'}
				</Button>
			</CardFooter>
		</Card>
	);
}
