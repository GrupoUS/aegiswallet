'use client';

import { motion } from 'framer-motion';
import { BarChart3, FileText, LayoutDashboard } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinancialEvents } from '@/hooks/useFinancialEvents';
import { cn } from '@/lib/utils';

// Lazy load heavy components
const BalanceChart = lazy(() =>
	import('./BalanceChart').then((m) => ({ default: m.BalanceChart })),
);
const TransactionForm = lazy(() => import('./TransactionForm'));
const TransactionsList = lazy(() => import('./TransactionsList'));
const BillsList = lazy(() => import('./BillsList').then((m) => ({ default: m.BillsList })));

// Loading skeleton for chart
function ChartSkeleton() {
	return (
		<div className="h-[300px] w-full rounded-xl bg-muted/50 animate-pulse flex items-center justify-center">
			<BarChart3 className="h-12 w-12 text-muted-foreground/30" />
		</div>
	);
}

// Loading skeleton for transactions list
function TransactionsListSkeleton() {
	return (
		<div className="space-y-4">
			{[1, 2, 3, 4, 5].map((i) => (
				<div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
					<Skeleton className="h-10 w-10 rounded-full" />
					<div className="flex-1">
						<Skeleton className="h-5 w-32 mb-2" />
						<Skeleton className="h-4 w-24" />
					</div>
					<Skeleton className="h-6 w-20" />
				</div>
			))}
		</div>
	);
}

// Loading skeleton for bills list
function BillsListSkeleton() {
	return (
		<div className="space-y-4">
			{[1, 2, 3, 4].map((i) => (
				<div key={i} className="p-6 rounded-lg border bg-card">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Skeleton className="h-12 w-12 rounded-full" />
							<div>
								<Skeleton className="h-6 w-48 mb-2" />
								<Skeleton className="h-4 w-32" />
							</div>
						</div>
						<div className="text-right">
							<Skeleton className="h-8 w-24 mb-2" />
							<Skeleton className="h-5 w-16" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

// Loading skeleton for form
function FormSkeleton() {
	return (
		<div className="p-6 rounded-xl border bg-card">
			<Skeleton className="h-6 w-32 mb-4" />
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i}>
						<Skeleton className="h-4 w-20 mb-2" />
						<Skeleton className="h-10 w-full" />
					</div>
				))}
			</div>
			<div className="mt-4 flex gap-2">
				<Skeleton className="h-10 w-24" />
				<Skeleton className="h-10 w-24" />
			</div>
		</div>
	);
}

// Tab configuration
const tabs = [
	{
		id: 'overview',
		label: 'Visão Geral',
		icon: LayoutDashboard,
		description: 'Gráficos e resumo financeiro',
	},
	{
		id: 'transactions',
		label: 'Transações',
		icon: BarChart3,
		description: 'Receitas e despesas',
	},
	{
		id: 'bills',
		label: 'Contas a Pagar',
		icon: FileText,
		description: 'Contas e vencimentos',
	},
] as const;

type TabId = (typeof tabs)[number]['id'];

interface FinancialTabsProps {
	/** Default active tab */
	defaultTab?: TabId;
	/** Callback when tab changes */
	onTabChange?: (tab: TabId) => void;
	/** Show transaction form state */
	showTransactionForm?: boolean;
	/** Callback to toggle transaction form */
	onToggleTransactionForm?: () => void;
	/** Quick actions component to render in overview */
	quickActionsSlot?: React.ReactNode;
	/** Additional class name */
	className?: string;
}

export function FinancialTabs({
	defaultTab = 'overview',
	onTabChange,
	showTransactionForm,
	onToggleTransactionForm,
	quickActionsSlot,
	className,
}: FinancialTabsProps) {
	const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

	const handleTabChange = (value: string) => {
		const newTab = value as TabId;
		setActiveTab(newTab);
		onTabChange?.(newTab);
	};

	return (
		<Tabs value={activeTab} onValueChange={handleTabChange} className={cn('w-full', className)}>
			<TabsList className="grid w-full grid-cols-3 h-auto p-1">
				{tabs.map((tab) => (
					<TabsTrigger
						key={tab.id}
						value={tab.id}
						className="relative flex items-center gap-2 py-2.5 data-[state=active]:bg-background"
					>
						<tab.icon className="h-4 w-4" />
						<span className="hidden sm:inline">{tab.label}</span>
						{activeTab === tab.id && (
							<motion.div
								layoutId="activeTabIndicator"
								className="absolute inset-0 rounded-md bg-background shadow-sm -z-10"
								transition={{ type: 'spring', damping: 25, stiffness: 300 }}
							/>
						)}
					</TabsTrigger>
				))}
			</TabsList>

			{/* Overview Tab */}
			<TabsContent value="overview" className="mt-6 space-y-6">
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					{/* Balance Chart */}
					<Suspense fallback={<ChartSkeleton />}>
						<BalanceChart />
					</Suspense>

					{/* Quick Actions Slot */}
					{quickActionsSlot && <div className="mt-6">{quickActionsSlot}</div>}
				</motion.div>
			</TabsContent>

			{/* Transactions Tab */}
			<TabsContent value="transactions" className="mt-6 space-y-6">
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
					className="space-y-6"
				>
					{/* Transaction Form Toggle */}
					{showTransactionForm && onToggleTransactionForm && (
						<Suspense fallback={<FormSkeleton />}>
							<TransactionForm
								onCancel={onToggleTransactionForm}
								onSuccess={onToggleTransactionForm}
							/>
						</Suspense>
					)}

					{/* Transactions List */}
					<Suspense fallback={<TransactionsListSkeleton />}>
						<TransactionsList />
					</Suspense>
				</motion.div>
			</TabsContent>

			{/* Bills Tab */}
			<TabsContent value="bills" className="mt-6 space-y-6">
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					<BillsTabContent />
				</motion.div>
			</TabsContent>
		</Tabs>
	);
}

// Separated Bills Tab Content for better code organization
function BillsTabContent() {
	const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

	const statusFilter = filter === 'all' ? 'all' : filter === 'pending' ? 'pending' : 'completed';

	const {
		events: bills,
		loading,
		deleteEvent,
	} = useFinancialEvents(
		{
			type: 'expense',
			status: statusFilter,
		},
		{
			page: 1,
			limit: 50,
			sortBy: 'due_date',
			sortOrder: 'asc',
		},
	);

	return (
		<div className="space-y-4">
			{/* Filter Buttons */}
			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => setFilter('all')}
					className={cn(
						'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
						filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80',
					)}
				>
					Todas
				</button>
				<button
					type="button"
					onClick={() => setFilter('pending')}
					className={cn(
						'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
						filter === 'pending'
							? 'bg-primary text-primary-foreground'
							: 'bg-muted hover:bg-muted/80',
					)}
				>
					Pendentes
				</button>
				<button
					type="button"
					onClick={() => setFilter('paid')}
					className={cn(
						'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
						filter === 'paid' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80',
					)}
				>
					Pagas
				</button>
			</div>

			{/* Bills List */}
			{loading ? (
				<BillsListSkeleton />
			) : (
				<Suspense fallback={<BillsListSkeleton />}>
					<BillsList bills={bills} filter={filter} onDelete={deleteEvent} />
				</Suspense>
			)}
		</div>
	);
}
