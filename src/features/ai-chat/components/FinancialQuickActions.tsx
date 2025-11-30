import {
	Calendar,
	Lightbulb,
	PieChart,
	TrendingDown,
	Wallet,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickAction {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	query: string;
}

const QUICK_ACTIONS: QuickAction[] = [
	{
		icon: Wallet,
		label: 'Meu saldo',
		query: 'Qual é meu saldo atual em todas as contas?',
	},
	{
		icon: TrendingDown,
		label: 'Onde estou gastando',
		query:
			'Onde estou gastando mais este mês? Mostre as principais categorias.',
	},
	{
		icon: Calendar,
		label: 'Contas a pagar',
		query: 'Quais contas vencem nos próximos 7 dias?',
	},
	{
		icon: Lightbulb,
		label: 'Dicas de economia',
		query:
			'Me dê dicas personalizadas para economizar este mês baseado nos meus gastos.',
	},
	{
		icon: PieChart,
		label: 'Resumo do mês',
		query:
			'Como está minha situação financeira este mês? Faça um resumo completo.',
	},
];

interface FinancialQuickActionsProps {
	onActionSelect: (query: string) => void;
	disabled?: boolean;
	className?: string;
}

/**
 * Quick action buttons for common financial queries
 * Displayed when chat is empty or when user needs suggestions
 */
export function FinancialQuickActions({
	onActionSelect,
	disabled = false,
	className,
}: FinancialQuickActionsProps) {
	return (
		<div className={cn('flex flex-wrap gap-2 p-3', className)}>
			{QUICK_ACTIONS.map((action) => (
				<Button
					key={action.label}
					variant="outline"
					size="sm"
					onClick={() => onActionSelect(action.query)}
					disabled={disabled}
					className="flex items-center gap-1.5 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30"
				>
					<action.icon className="h-3.5 w-3.5" />
					<span>{action.label}</span>
				</Button>
			))}
		</div>
	);
}
