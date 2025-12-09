/**
 * User Dashboard Component
 *
 * Displays user-specific financial data with real-time updates
 * following Clerk + Neon integration pattern.
 */

import { useAuth, useUser } from '@clerk/clerk-react';
import { ArrowDownLeft, ArrowUpRight, CreditCard, RefreshCw, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactions } from '@/hooks/use-transactions';
import { useBankAccounts, useTotalBalance } from '@/hooks/useBankAccounts';
import { useInvalidateUserData } from '@/hooks/useUserData';
import { formatCurrency } from '@/lib/formatters/brazilianFormatters';
import { safeParseDate } from '@/lib/utils/date-validation';

// ========================================
// LOADING SKELETON
// ========================================

function DashboardSkeleton() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-32 w-full" />
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Skeleton className="h-24" />
				<Skeleton className="h-24" />
				<Skeleton className="h-24" />
			</div>
			<Skeleton className="h-64 w-full" />
		</div>
	);
}

// ========================================
// BALANCE CARD
// ========================================

function BalanceCard() {
	const { totalBRL, isLoading, error } = useTotalBalance();

	if (isLoading) {
		return <Skeleton className="h-32" />;
	}

	if (error) {
		return (
			<Card className="bg-destructive/10">
				<CardContent className="pt-6">
					<p className="text-destructive">Erro ao carregar saldo</p>
				</CardContent>
			</Card>
		);
	}

	const balance = totalBRL || 0;

	return (
		<Card className="bg-gradient-to-br from-primary/10 to-primary/5">
			<CardHeader className="pb-2">
				<CardDescription className="flex items-center gap-2">
					<Wallet className="h-4 w-4" />
					Saldo Total
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-3xl font-bold">{formatCurrency(balance)}</p>
				<p className="text-sm text-muted-foreground mt-1">Atualizado em tempo real</p>
			</CardContent>
		</Card>
	);
}

// ========================================
// ACCOUNTS LIST
// ========================================

function AccountsList() {
	const { accounts, isLoading, error } = useBankAccounts();

	if (isLoading) {
		return (
			<div className="space-y-2">
				<Skeleton className="h-16" />
				<Skeleton className="h-16" />
			</div>
		);
	}

	if (error) {
		return <p className="text-destructive">Erro ao carregar contas</p>;
	}

	if (!accounts?.length) {
		return (
			<Card>
				<CardContent className="pt-6 text-center text-muted-foreground">
					<CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
					<p>Nenhuma conta cadastrada</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-2">
			{Array.isArray(accounts) &&
				accounts.map((account) => (
					<Card key={account.id} className="hover:bg-accent/50 transition-colors">
						<CardContent className="flex items-center justify-between py-4">
							<div>
								<p className="font-medium">{account.institution_name}</p>
								<p className="text-sm text-muted-foreground">
									{account.account_mask} · {account.account_type}
								</p>
							</div>
							<p className="font-semibold">{formatCurrency(Number(account.balance || 0))}</p>
						</CardContent>
					</Card>
				))}
		</div>
	);
}

// ========================================
// RECENT TRANSACTIONS
// ========================================

function RecentTransactionsList() {
	const { data: transactions, isLoading, error } = useTransactions({ limit: 10 });

	if (isLoading) {
		return (
			<div className="space-y-2">
				{[...Array(5)].map((_, i) => (
					<Skeleton key={`loading-skeleton-${Date.now()}-${i}`} className="h-12" />
				))}
			</div>
		);
	}

	if (error) {
		return <p className="text-destructive">Erro ao carregar transações</p>;
	}

	if (!transactions?.length) {
		return (
			<div className="text-center text-muted-foreground py-8">
				<p>Nenhuma transação recente</p>
			</div>
		);
	}

	return (
		<div className="space-y-1">
			{Array.isArray(transactions) &&
				transactions.map((tx) => (
					<div
						key={tx.id}
						className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-accent/50 transition-colors"
					>
						<div className="flex items-center gap-3">
							<div
								className={`p-2 rounded-full ${
									tx.transactionType === 'credit' || tx.amount > 0
										? 'bg-green-100 text-green-600'
										: 'bg-red-100 text-red-600'
								}`}
							>
								{tx.amount > 0 ? (
									<ArrowDownLeft className="h-4 w-4" />
								) : (
									<ArrowUpRight className="h-4 w-4" />
								)}
							</div>
							<div>
								<p className="font-medium">{tx.description}</p>
								<p className="text-sm text-muted-foreground">
									{safeParseDate(tx.transaction_date || tx.transactionDate)?.toLocaleDateString(
										'pt-BR',
									) || '-'}
								</p>
							</div>
						</div>
						<p
							className={`font-semibold ${
								tx.transactionType === 'credit' || tx.amount > 0 ? 'text-green-600' : 'text-red-600'
							}`}
						>
							{tx.amount > 0 ? '+' : '-'}
							{formatCurrency(Math.abs(Number(tx.amount)))}
						</p>
					</div>
				))}
		</div>
	);
}

// ========================================
// MAIN DASHBOARD
// ========================================

export function UserDashboard() {
	const { isSignedIn, isLoaded } = useAuth();
	const { user } = useUser();
	const { invalidateAll } = useInvalidateUserData();

	// Show loading state while Clerk loads
	if (!isLoaded) {
		return <DashboardSkeleton />;
	}

	// Redirect or show sign-in prompt if not authenticated
	if (!isSignedIn) {
		return (
			<Card>
				<CardContent className="pt-6 text-center">
					<p className="text-muted-foreground">Faça login para ver seu dashboard financeiro</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Olá, {user?.fullName?.split(' ')[0] || 'Usuário'}!</h1>
					<p className="text-muted-foreground">Aqui está seu resumo financeiro</p>
				</div>
				<Button variant="outline" size="sm" onClick={() => invalidateAll()} className="gap-2">
					<RefreshCw className="h-4 w-4" />
					Atualizar
				</Button>
			</div>

			{/* Balance Card */}
			<BalanceCard />

			{/* Accounts and Transactions Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Accounts */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Minhas Contas</CardTitle>
						<CardDescription>Contas bancárias vinculadas</CardDescription>
					</CardHeader>
					<CardContent>
						<AccountsList />
					</CardContent>
				</Card>

				{/* Recent Transactions */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Transações Recentes</CardTitle>
						<CardDescription>Últimas 10 movimentações</CardDescription>
					</CardHeader>
					<CardContent>
						<RecentTransactionsList />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default UserDashboard;
