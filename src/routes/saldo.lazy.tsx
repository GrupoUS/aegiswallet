'use client';

import { useNavigate, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Mic, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

import { FinancialTabs } from './components/FinancialTabs';
import { QuickActionModal } from './components/QuickActionModal';
import { StatisticsCards } from './components/StatisticsCards';
import { AccountsCarousel } from '@/components/bank-accounts/AccountsCarousel';
import { BankAccountsDrawer } from '@/components/bank-accounts/BankAccountsDrawer';
import { FinancialAmount } from '@/components/financial-amount';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTotalBalance } from '@/hooks/useBankAccounts';
import { useFinancialEvents } from '@/hooks/useFinancialEvents';
import { RouteGuard } from '@/lib/auth/route-guard';

type TabId = 'overview' | 'transactions' | 'bills';

export function Saldo() {
	// Get tab and drawer from URL search params (for redirects from deprecated routes)
	const search = useSearch({ from: '/saldo' });
	const navigate = useNavigate({ from: '/saldo' });

	// Derive active tab from URL, with fallback to 'overview'
	const activeTab: TabId = (search.tab as TabId) || 'overview';

	const [isListening, setIsListening] = useState(false);
	const [showTransactionForm, setShowTransactionForm] = useState(false);
	const [quickActionType, setQuickActionType] = useState<
		'transfer' | 'deposit' | 'withdraw' | null
	>(null);
	const [isAccountsDrawerOpen, setIsAccountsDrawerOpen] = useState(false);

	// Comment 3: Open drawer if search.drawer === 'accounts' on mount
	useEffect(() => {
		if (search.drawer === 'accounts') {
			setIsAccountsDrawerOpen(true);
			// Clear the drawer param after opening to avoid unexpected behavior on reload
			void navigate({ search: (prev) => ({ ...prev, drawer: undefined }), replace: true });
		}
	}, [search.drawer, navigate]);

	// Comment 2: Handle tab change by updating URL search params
	const handleTabChange = (tab: TabId) => {
		void navigate({ search: (prev) => ({ ...prev, tab }), replace: true });
	};

	const handleVoiceCommand = () => {
		setIsListening(!isListening);
		// Voice command logic to be implemented
	};

	const { statistics, loading: statsLoading } = useFinancialEvents();
	const { totalBRL, isLoading: balanceLoading } = useTotalBalance();

	// Quick actions slot for the tabs component
	const quickActionsSlot = (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
			<Button
				variant="outline"
				size="lg"
				className="h-auto py-4"
				onClick={() => setQuickActionType('transfer')}
			>
				<div className="w-full text-center">
					<TrendingUp className="mx-auto mb-2 h-6 w-6" />
					<p className="font-semibold">Transferir</p>
					<p className="text-muted-foreground text-xs">Entre contas</p>
				</div>
			</Button>
			<Button
				variant="outline"
				size="lg"
				className="h-auto py-4"
				onClick={() => setQuickActionType('deposit')}
			>
				<div className="w-full text-center">
					<Wallet className="mx-auto mb-2 h-6 w-6" />
					<p className="font-semibold">Depositar</p>
					<p className="text-muted-foreground text-xs">Adicionar fundos</p>
				</div>
			</Button>
			<Button
				variant="outline"
				size="lg"
				className="h-auto py-4"
				onClick={() => setQuickActionType('withdraw')}
			>
				<div className="w-full text-center">
					<TrendingDown className="mx-auto mb-2 h-6 w-6" />
					<p className="font-semibold">Sacar</p>
					<p className="text-muted-foreground text-xs">Retirar dinheiro</p>
				</div>
			</Button>
		</div>
	);

	return (
		<RouteGuard>
			<div className="container mx-auto space-y-6 p-4">
				{/* Header with Voice Command */}
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
				>
					<div>
						<h1 className="bg-linear-to-r from-primary to-accent bg-clip-text font-bold text-3xl text-transparent">
							Finanças
						</h1>
						<p className="text-muted-foreground">Visão unificada das suas finanças</p>
					</div>
					<div className="flex items-center gap-2">
						<Button
							onClick={() => {
								// Navigate to transactions tab and show form
								if (!showTransactionForm) {
									void navigate({
										search: (prev) => ({ ...prev, tab: 'transactions' }),
										replace: true,
									});
								}
								setShowTransactionForm(!showTransactionForm);
							}}
							variant="outline"
							size="sm"
						>
							{showTransactionForm ? 'Cancelar' : 'Nova Transação'}
						</Button>
						<Button
							onClick={handleVoiceCommand}
							variant={isListening ? 'default' : 'outline'}
							size="lg"
							className="gap-2"
							withGradient
						>
							<Mic className={isListening ? 'animate-pulse' : ''} />
							<span className="hidden sm:inline">
								{isListening ? 'Ouvindo...' : 'Qual é meu saldo?'}
							</span>
						</Button>
					</div>
				</motion.div>

				{/* Statistics Cards */}
				<StatisticsCards statistics={statistics} loading={statsLoading} />

				{/* Total Balance Card with drawer trigger */}
				<motion.div
					initial={{ opacity: 0, scale: 0.98 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.1 }}
				>
					<Card
						onClick={() => setIsAccountsDrawerOpen(true)}
						className="cursor-pointer border-2 border-primary/20 bg-linear-to-br from-background to-primary/5 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
						variant="glass-hover"
					>
						<CardHeader>
							<CardDescription>Saldo Total (Contas Bancárias)</CardDescription>
							<CardTitle className="text-4xl">
								{balanceLoading ? (
									<Skeleton className="h-10 w-48" />
								) : (
									<FinancialAmount amount={totalBRL} currency="BRL" size="xl" />
								)}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2 text-muted-foreground text-sm">
								<Wallet className="h-4 w-4 text-primary" />
								<span>Clique para gerenciar contas bancárias</span>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Accounts Carousel - horizontal preview of accounts */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					<AccountsCarousel
						onAccountClick={() => setIsAccountsDrawerOpen(true)}
						onAddClick={() => setIsAccountsDrawerOpen(true)}
					/>
				</motion.div>

				{/* Financial Tabs - Overview, Transactions, Bills */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
				>
					<FinancialTabs
						activeTab={activeTab}
						onTabChange={handleTabChange}
						showTransactionForm={showTransactionForm}
						onToggleTransactionForm={() => setShowTransactionForm(false)}
						quickActionsSlot={quickActionsSlot}
					/>
				</motion.div>

				{/* Bank Accounts Drawer */}
				<BankAccountsDrawer open={isAccountsDrawerOpen} onOpenChange={setIsAccountsDrawerOpen} />

				{/* Quick Action Modal */}
				{quickActionType && (
					<QuickActionModal
						isOpen={!!quickActionType}
						onClose={() => setQuickActionType(null)}
						actionType={quickActionType}
					/>
				)}
			</div>
		</RouteGuard>
	);
}
