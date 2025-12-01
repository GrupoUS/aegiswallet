import { Link } from '@tanstack/react-router';
import { CreditCard, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
import { lazy, Suspense, useMemo } from 'react';

import { FinancialAmount } from '@/components/financial-amount';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MagicCard } from '@/components/ui/magic-card';
import { Skeleton } from '@/components/ui/skeleton';
import { type Transaction, useTransactions } from '@/hooks/use-transactions';
import { useBankAccounts, useTotalBalance } from '@/hooks/useBankAccounts';
import { useFinancialEvents } from '@/hooks/useFinancialEvents';
import { useFinancialSummary } from '@/hooks/useProfile';

// Lazy loaded components
const LazyMiniCalendarWidget = lazy(() =>
	import('@/components/calendar/mini-calendar-widget').then((mod) => ({
		default: mod.MiniCalendarWidget,
	})),
);

// Loading components
const CalendarLoader = () => (
	<Card variant="glass">
		<CardHeader>
			<Skeleton className="h-6 w-32" />
		</CardHeader>
		<CardContent>
			<div className="grid grid-cols-7 gap-1">
				{Array.from({ length: 35 }, (_, index) => `calendar-skeleton-${index}`).map(
					(skeletonId) => (
						<Skeleton key={skeletonId} className="h-8 w-full" />
					),
				)}
			</div>
		</CardContent>
	</Card>
);

import { RouteGuard } from '@/lib/auth/route-guard';

export function Dashboard() {
	// useEffect for OAuth callback removed as it is handled by the auth callback route and Clerk

	// Hooks for data
	const { totalBRL } = useTotalBalance();
	const { accounts } = useBankAccounts();
	const { statistics } = useFinancialEvents({ status: 'all' });

	// Get current month date range for financial summary
	const startOfCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
		.toISOString()
		.split('T')[0];
	const endOfCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
		.toISOString()
		.split('T')[0];
	const { summary, isLoading: summaryLoading } = useFinancialSummary(
		startOfCurrentMonth,
		endOfCurrentMonth,
	);

	const recentTransactionsQuery = useTransactions({ limit: 5 });
	const recentTransactions = recentTransactionsQuery.data ?? [];

	// Calculate Investments Balance
	const investmentsBalance = useMemo(() => {
		return accounts
			.filter((acc) => acc.account_type === 'investment' || acc.account_type === 'investimento')
			.reduce((sum, acc) => sum + Number(acc.balance), 0);
	}, [accounts]);

	// PIX Sent Calculation (approximation or use a specific query if available)
	// Since we don't have a direct hook for "PIX Sent Today", we'll assume we might fetch it via transactions if needed.
	// For now, let's use useTransactions with filters for today.
	const today = new Date().toISOString().split('T')[0];
	const pixTransactionsQuery = useTransactions({
		endDate: today,
		startDate: today,
		transactionType: 'pix',
	});
	const pixTransactions = pixTransactionsQuery.data ?? [];

	const pixSentToday = useMemo(() => {
		const list = pixTransactions;
		// Already filtered by type: 'pix' in query, just check if it's an expense
		return list
			.filter((transaction: Transaction) => transaction.amount < 0)
			.reduce(
				(sum: number, transaction: Transaction) => sum + Math.abs(Number(transaction.amount)),
				0,
			);
	}, [pixTransactions]);

	// Magic Cards com dados reais
	const magicCardsData = [
		{
			change: 'Total',
			color: 'text-green-600',
			icon: Wallet,
			isCurrency: true,
			title: 'Saldo em Conta',
			value: totalBRL,
		},
		{
			change: 'Total',
			color: 'text-blue-600',
			icon: TrendingUp,
			isCurrency: true,
			title: 'Investimentos',
			value: investmentsBalance,
		},
		{
			change: 'Este mês',
			color: 'text-purple-600',
			icon: PiggyBank,
			title: 'Economia Mensal',
			value: statistics.netBalance, // Or summary.projectedBalance if preferred
			isCurrency: true,
		},
		{
			change: 'Hoje',
			color: 'text-orange-600',
			icon: CreditCard,
			isCurrency: true,
			title: 'PIX Enviados',
			value: pixSentToday,
		},
	];

	return (
		<RouteGuard>
			<div className="container mx-auto space-y-6 p-4">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text font-bold text-3xl text-transparent">
							Dashboard
						</h1>
						<p className="text-muted-foreground">Insights inteligentes sobre suas finanças</p>
					</div>
				</div>

				{/* Magic Cards - Insights Financeiros */}
				<div>
					<h2 className="mb-4 font-semibold text-2xl">Insights Financeiros</h2>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
						{magicCardsData.map((card) => {
							const Icon = card.icon;
							return (
								<MagicCard key={card.title} className="p-6">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-medium text-muted-foreground text-sm">{card.title}</p>
											<p className="font-bold text-2xl">
												{card.isCurrency ? (
													<FinancialAmount
														amount={card.value}
														currency="BRL"
														size="xl"
														showSign={false}
														className="text-foreground"
													/>
												) : (
													card.value
												)}
											</p>
											<p className={`text-sm ${card.color}`}>{card.change}</p>
										</div>
										<Icon className="h-8 w-8 text-muted-foreground/50" />
									</div>
								</MagicCard>
							);
						})}
					</div>
				</div>

				{/* Quick Actions - 3 Columns Layout */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{/* Coluna 1: Transações Recentes */}
					<Card variant="glass">
						<CardHeader>
							<CardTitle>Transações Recentes</CardTitle>
							<CardDescription>Últimas transações</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{((recentTransactions as Transaction[] | undefined) ?? []).map((transaction) => (
									<div key={transaction.id} className="flex items-center justify-between">
										<div>
											<p className="font-medium truncate max-w-[150px]">
												{transaction.description}
											</p>
											<p className="text-muted-foreground text-sm">
												{new Date(transaction.created_at).toLocaleDateString('pt-BR')}
											</p>
										</div>
										<FinancialAmount amount={Number(transaction.amount)} />
									</div>
								))}
								{!recentTransactions?.length && (
									<p className="text-sm text-muted-foreground text-center py-4">
										Nenhuma transação recente
									</p>
								)}
							</div>
							<Link to="/saldo">
								<Button variant="outline" className="mt-4 w-full">
									Ver Todas as Transações
								</Button>
							</Link>
						</CardContent>
					</Card>

					{/* Coluna 2: Mini Calendário */}
					<Suspense fallback={<CalendarLoader />}>
						<LazyMiniCalendarWidget />
					</Suspense>

					{/* Coluna 3: Resumo Mensal */}
					<Card variant="glass">
						<CardHeader>
							<CardTitle>Resumo Mensal</CardTitle>
							<CardDescription>
								{new Date().toLocaleDateString('pt-BR', {
									month: 'long',
									year: 'numeric',
								})}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{summaryLoading ? (
									<div className="space-y-2">
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-4 w-full" />
									</div>
								) : (
									<>
										<div className="flex items-center justify-between">
											<span className="text-sm">Receitas</span>
											<FinancialAmount amount={summary?.income ?? 0} size="sm" />
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm">Despesas</span>
											<FinancialAmount amount={-(summary?.expenses ?? 0)} size="sm" />
										</div>
										{/* Note: Summary now returns { income, expenses, balance } from useProfile.ts
						  This gives a breakdown for the current month based on the API response.
					  */}
									</>
								)}

								{/* Re-implementing monthly summary using a dedicated useFinancialEvents call for this month to get proper breakdown */}
							</div>
							<MonthlySummaryContent />
						</CardContent>
					</Card>
				</div>
			</div>
		</RouteGuard>
	);
}

function MonthlySummaryContent() {
	// Helper component to fetch monthly stats cleanly
	const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
		.toISOString()
		.split('T')[0];
	const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
		.toISOString()
		.split('T')[0];

	const { statistics, loading } = useFinancialEvents({
		endDate: endOfMonth,
		startDate: startOfMonth,
		status: 'all',
	});

	if (loading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-full" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<span className="text-sm">Receitas</span>
				<FinancialAmount amount={statistics.totalIncome + statistics.pendingIncome} size="sm" />
			</div>
			<div className="flex items-center justify-between">
				<span className="text-sm">Despesas</span>
				<FinancialAmount
					amount={-(statistics.totalExpenses + statistics.pendingExpenses)}
					size="sm"
				/>
			</div>
			<div className="border-t pt-2">
				<div className="flex items-center justify-between">
					<span className="font-semibold">Saldo Previsto</span>
					<FinancialAmount amount={statistics.netBalance} size="sm" />
				</div>
			</div>
		</div>
	);
}
