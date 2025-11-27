import {
	AlertTriangle,
	ArrowDownRight,
	ArrowUpRight,
	Wallet,
} from 'lucide-react';

import { FinancialAmount } from '@/components/financial-amount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatisticsCardsProps {
	statistics: {
		totalIncome: number;
		totalExpenses: number;
		netBalance: number;
		pendingIncome: number;
		pendingExpenses: number;
		overdueCount: number;
	};
	loading?: boolean;
}

export function StatisticsCards({ statistics, loading }: StatisticsCardsProps) {
	if (loading) {
		return (
			<div className="grid gap-4 md:grid-cols-3">
				<div className="h-32 rounded-xl bg-muted animate-pulse" />
				<div className="h-32 rounded-xl bg-muted animate-pulse" />
				<div className="h-32 rounded-xl bg-muted animate-pulse" />
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-3">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
					<Wallet className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						<FinancialAmount
							amount={statistics.netBalance}
							currency="BRL"
							size="xl"
						/>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						{statistics.netBalance >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Receitas</CardTitle>
					<ArrowUpRight className="h-4 w-4 text-emerald-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						<FinancialAmount
							amount={statistics.totalIncome}
							currency="BRL"
							size="xl"
							className="text-emerald-600"
						/>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						+{' '}
						<FinancialAmount
							amount={statistics.pendingIncome}
							currency="BRL"
							size="sm"
							showSign={false}
							className="text-muted-foreground"
						/>{' '}
						pendente
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Despesas</CardTitle>
					<ArrowDownRight className="h-4 w-4 text-rose-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						<FinancialAmount
							amount={-statistics.totalExpenses}
							currency="BRL"
							size="xl"
							className="text-rose-600"
						/>
					</div>
					<div className="flex justify-between items-center mt-1">
						<p className="text-xs text-muted-foreground">
							+{' '}
							<FinancialAmount
								amount={statistics.pendingExpenses}
								currency="BRL"
								size="sm"
								showSign={false}
								className="text-muted-foreground"
							/>{' '}
							pendente
						</p>
						{statistics.overdueCount > 0 && (
							<div className="flex items-center text-xs text-rose-600 font-medium">
								<AlertTriangle className="h-3 w-3 mr-1" />
								{statistics.overdueCount} vencidos
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
