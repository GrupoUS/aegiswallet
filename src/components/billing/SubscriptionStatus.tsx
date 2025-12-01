import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/billing';
import { cn } from '@/lib/utils';

interface SubscriptionStatusProps {
	className?: string;
}

const statusConfig = {
	free: { label: 'Gratuito', variant: 'secondary' as const },
	trialing: { label: 'Teste Grátis', variant: 'default' as const },
	active: { label: 'Ativo', variant: 'success' as const },
	past_due: { label: 'Pagamento Atrasado', variant: 'destructive' as const },
	canceled: { label: 'Cancelado', variant: 'destructive' as const },
	unpaid: { label: 'Não Pago', variant: 'destructive' as const },
};

export function SubscriptionStatus({ className }: SubscriptionStatusProps) {
	const { data: subscription, isLoading } = useSubscription();

	if (isLoading) {
		return <Skeleton className="h-6 w-24" />;
	}

	const status = (subscription?.subscription?.status || 'free') as keyof typeof statusConfig;
	const config = statusConfig[status] ?? statusConfig.free;

	return (
		<Badge variant={config.variant} className={cn('', className)}>
			{config.label}
		</Badge>
	);
}
