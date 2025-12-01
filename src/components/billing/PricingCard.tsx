import { Check, CreditCard, Loader2, Lock, Shield, Sparkles, Star } from 'lucide-react';

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
	'aria-describedby'?: string;
}

export function PricingCard({
	plan,
	currentPlanId,
	recommended,
	onSelect,
	'aria-describedby': ariaDescribedBy,
}: PricingCardProps) {
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

	// Generate unique IDs for accessibility
	const cardId = `pricing-card-${plan.id}`;
	const featuresId = `${cardId}-features`;
	const priceId = `${cardId}-price`;

	return (
		<Card
			id={cardId}
			className={cn(
				'relative flex flex-col h-full transition-all duration-200 hover:shadow-lg focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
				recommended && 'border-primary shadow-lg',
				isCurrent && 'border-green-500',
				'focus:outline-none',
			)}
			aria-describedby={`${ariaDescribedBy} ${cardId}-description ${featuresId}`}
			role="article"
			aria-labelledby={`${cardId}-title`}
		>
			{/* Trust badges */}
			<div className="absolute top-4 right-4 flex gap-1">
				<Shield className="h-4 w-4 text-green-600" aria-label="Transação segura" />
				<Lock className="h-4 w-4 text-blue-600" aria-label="Dados protegidos por LGPD" />
			</div>

			{/* Show only one badge: isCurrent takes precedence over recommended */}
			{recommended && !isCurrent && (
				<div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
					<Badge
						className="flex items-center gap-1 shadow-lg"
						variant="default"
						aria-label="Plano recomendado"
					>
						<Star className="h-3 w-3" aria-hidden="true" />
						Recomendado
					</Badge>
				</div>
			)}

			{isCurrent && (
				<div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
					<Badge className="flex items-center gap-1" variant="outline" aria-label="Seu plano atual">
						<Check className="h-3 w-3" aria-hidden="true" />
						Plano Atual
					</Badge>
				</div>
			)}

			<CardHeader className="space-y-4">
				<div>
					<CardTitle id={`${cardId}-title`} className="text-xl font-semibold text-center">
						{plan.name}
					</CardTitle>
					<CardDescription id={`${cardId}-description`} className="text-center mt-2">
						{plan.description}
					</CardDescription>
				</div>

				<div className="text-center space-y-2">
					<div className="flex items-baseline justify-center gap-1">
						<span
							id={priceId}
							className="text-4xl font-bold text-primary"
							aria-live="polite"
							aria-label={`Preço: ${formatPrice(plan.priceCents, plan.currency)}`}
						>
							{formatPrice(plan.priceCents, plan.currency)}
						</span>
						{!isFree && <span className="text-muted-foreground">/mês</span>}
					</div>

					{/* Payment methods */}
					<div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
						<CreditCard className="h-3 w-3" aria-label="Aceita cartões" />
						<span>Aceita PIX, Cartão e Boleto</span>
					</div>
				</div>
			</CardHeader>

			<CardContent className="flex-1 space-y-4">
				<FeatureList
					features={plan.features ?? []}
					aria-label={`Recursos incluídos no plano ${plan.name}`}
					aria-describedby={featuresId}
				/>

				{/* Trust signals for Brazilian market */}
				<div className="pt-4 border-t border-border/50">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<Sparkles className="h-3 w-3 text-yellow-500" aria-hidden="true" />
						<span>7 dias de teste grátis</span>
					</div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
						<Shield className="h-3 w-3 text-green-500" aria-hidden="true" />
						<span>Cancelamento sem multa</span>
					</div>
				</div>
			</CardContent>

			<CardFooter className="pt-4">
				<Button
					className={cn(
						'w-full min-h-[44px] text-base font-medium transition-all duration-200',
						recommended && 'bg-primary hover:bg-primary/90',
						'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
					)}
					variant={recommended ? 'default' : 'outline'}
					disabled={isFree || isCurrent || isPending}
					onClick={handleSelect}
					aria-label={
						isCurrent
							? `Você já possui o ${plan.name}`
							: isFree
								? `${plan.name} é gratuito`
								: isPending
									? `Processando assinatura do ${plan.name}`
									: `Assinar o ${plan.name} por ${formatPrice(plan.priceCents, plan.currency)}`
					}
					role="button"
					aria-describedby={`${cardId}-button-help`}
				>
					{isCurrent && (
						<>
							<Check className="h-4 w-4 mr-2" aria-hidden="true" />
							Plano Atual
						</>
					)}
					{isFree && (
						<>
							<Check className="h-4 w-4 mr-2" aria-hidden="true" />
							Gratuito
						</>
					)}
					{isPending && (
						<>
							<Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
							Processando...
						</>
					)}
					{!(isCurrent || isFree || isPending) && (
						<>
							<Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
							Assinar Agora
						</>
					)}
				</Button>

				{/* Screen reader help text */}
				<div id={`${cardId}-button-help`} className="sr-only">
					{isCurrent
						? `Este é seu plano atual`
						: isFree
							? `Este plano é gratuito e não requer cartão de crédito`
							: `Clique para prosseguir com a assinatura deste plano`}
				</div>
			</CardFooter>
		</Card>
	);
}
