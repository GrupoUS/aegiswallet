import { AlertTriangle, CheckCircle, CreditCard, Info, Pause, XCircle, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/billing';
import { cn } from '@/lib/utils';
import type { SubscriptionResponse } from '@/types/billing';

interface SubscriptionStatusProps {
	className?: string;
	showDetails?: boolean;
}

const statusConfig = {
	free: {
		label: 'Gratuito',
		variant: 'secondary' as const,
		icon: Zap,
		color: 'text-muted-foreground',
		ariaLabel: 'Plano gratuito ativo',
	},
	trialing: {
		label: 'Teste Grátis',
		variant: 'default' as const,
		icon: Zap,
		color: 'text-blue-600',
		ariaLabel: 'Período de teste gratuito ativo',
	},
	active: {
		label: 'Ativo',
		variant: 'success' as const,
		icon: CheckCircle,
		color: 'text-green-600',
		ariaLabel: 'Assinatura ativa',
	},
	past_due: {
		label: 'Pagamento Atrasado',
		variant: 'destructive' as const,
		icon: AlertTriangle,
		color: 'text-orange-600',
		ariaLabel: 'Pagamento em atraso',
	},
	canceled: {
		label: 'Cancelado',
		variant: 'destructive' as const,
		icon: XCircle,
		color: 'text-red-600',
		ariaLabel: 'Assinatura cancelada',
	},
	unpaid: {
		label: 'Não Pago',
		variant: 'destructive' as const,
		icon: CreditCard,
		color: 'text-red-600',
		ariaLabel: 'Pagamento pendente',
	},
	paused: {
		label: 'Pausado',
		variant: 'outline' as const,
		icon: Pause,
		color: 'text-yellow-600',
		ariaLabel: 'Assinatura pausada',
	},
};

export function SubscriptionStatus({ className, showDetails = false }: SubscriptionStatusProps) {
	const { data: subscription, isLoading } = useSubscription();

	if (isLoading) {
		return (
			<div className={cn('flex items-center gap-2', className)}>
				<Skeleton className="h-5 w-5 rounded-full" />
				<Skeleton className="h-5 w-20" />
			</div>
		);
	}

	const status = (subscription?.subscription?.status || 'free') as keyof typeof statusConfig;
	const config = statusConfig[status] ?? statusConfig.free;
	const IconComponent = config.icon;

	// Generate tooltip content for screen readers
	const tooltipContent = {
		[config.ariaLabel]: {
			message: getStatusMessage(status),
			details: getStatusDetails(subscription),
		},
	};

	return (
		<div className="flex items-center gap-2">
			<IconComponent className={cn('h-4 w-4', config.color)} aria-hidden="true" focusable="false" />
			<Badge
				variant={config.variant}
				className={cn(
					'relative transition-colors duration-200',
					'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
					className,
				)}
				aria-label={config.ariaLabel}
				role="status"
				aria-live="polite"
			>
				{config.label}

				{showDetails && (
					<div className="ml-2 group">
						<Info
							className="h-3 w-3 cursor-help opacity-60 hover:opacity-100 transition-opacity"
							aria-label="Mais informações sobre o status"
						/>
						<div className="sr-only" role="tooltip" aria-hidden="false">
							<p>{tooltipContent[config.ariaLabel].message}</p>
							{tooltipContent[config.ariaLabel].details && (
								<p>{tooltipContent[config.ariaLabel].details}</p>
							)}
						</div>
					</div>
				)}
			</Badge>
		</div>
	);
}

function getStatusMessage(status: string): string {
	const messages = {
		free: 'Você está no plano gratuito com recursos básicos.',
		trialing: 'Você está no período de teste gratuito.',
		active: 'Sua assinatura está ativa e funcionando normalmente.',
		past_due: 'Houve um problema com o último pagamento.',
		canceled: 'Sua assinatura foi cancelada e não será renovada.',
		unpaid: 'Existe um pagamento pendente em sua conta.',
		paused: 'Sua assinatura foi pausada temporariamente.',
	};
	return messages[status as keyof typeof messages] || 'Status da assinatura desconhecido.';
}

function getStatusDetails(subscription: SubscriptionResponse | undefined): string | null {
	if (!subscription?.subscription) return null;

	const details = {
		past_due: 'Entre em contato conosco para regularizar sua situação.',
		canceled: 'Você pode reativar sua assinatura a qualquer momento.',
		unpaid: 'Verifique seus métodos de pagamento.',
		paused: 'Use "Gerenciar Assinatura" para reativar.',
	};

	const status = subscription.subscription.status;
	return details[status as keyof typeof details] || null;
}
