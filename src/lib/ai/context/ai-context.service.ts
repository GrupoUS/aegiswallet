/**
 * AI Context Service
 *
 * Aggregates user financial data for injection into AI prompts.
 * All queries are scoped to the authenticated user via RLS.
 */

import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { type FinancialAlert, generateFinancialAlerts } from './financial-alerts';
import type { DbClient } from '@/server/hono-types';
import {
	bankAccounts,
	budgetCategories,
	financialEvents,
	transactionCategories,
	transactions,
} from '@/db/schema';

// ========================================
// TYPES
// ========================================

export interface FinancialSummary {
	userName: string;
	totalBalance: number;
	availableBalance: number;
	accountsByType: {
		checking: number;
		savings: number;
		credit: number;
		investment: number;
	};
	netWorth: number;
}

export interface CategorySpending {
	categoryId: string | null;
	categoryName: string;
	totalSpent: number;
	transactionCount: number;
	averageTransaction: number;
}

export interface BudgetStatus {
	categoryId: string | null;
	categoryName: string;
	monthlyLimit: number;
	currentSpent: number;
	remaining: number;
	usagePercent: number;
}

export interface GoalProgress {
	id: string;
	name: string;
	targetAmount: number;
	currentAmount: number;
	progressPercent: number;
	targetDate: Date | null;
	status: 'overdue' | 'urgent' | 'on_track' | 'completed';
}

export interface RecentTransaction {
	id: string;
	amount: number;
	description: string;
	categoryName: string | null;
	transactionDate: Date;
	type: string;
}

export interface FinancialContext {
	summary: FinancialSummary;
	monthlySpending: CategorySpending[];
	budgets: BudgetStatus[];
	upcomingPayments: { description: string; amount: number; dueDate: Date }[];
	recentTransactions: RecentTransaction[];
	alerts: FinancialAlert[];
}

// ========================================
// CONTEXT RETRIEVAL
// ========================================

/**
 * Get comprehensive financial context for AI prompt injection
 */
export async function getAIFinancialContext(
	userId: string,
	db: DbClient,
	userName = 'Usuário',
): Promise<FinancialContext> {
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

	// Fetch all data in parallel for performance
	const [accounts, monthlyTxns, budgetData, upcoming, recent, categories] = await Promise.all([
		// 1. Account balances
		db
			.select({
				accountType: bankAccounts.accountType,
				balance: bankAccounts.balance,
				availableBalance: bankAccounts.availableBalance,
			})
			.from(bankAccounts)
			.where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.isActive, true))),

		// 2. Monthly transactions for spending summary
		db
			.select({
				categoryId: transactions.categoryId,
				amount: transactions.amount,
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.userId, userId),
					gte(transactions.transactionDate, startOfMonth),
					lte(transactions.transactionDate, endOfMonth),
					lte(transactions.amount, '0'), // Only expenses
				),
			),

		// 3. Budget categories
		db
			.select({
				categoryId: budgetCategories.categoryId,
				budgetAmount: budgetCategories.budgetAmount,
			})
			.from(budgetCategories)
			.where(and(eq(budgetCategories.userId, userId), eq(budgetCategories.isActive, true))),

		// 4. Upcoming financial events (next 30 days)
		db
			.select({
				description: financialEvents.title,
				amount: financialEvents.amount,
				dueDate: financialEvents.startDate,
			})
			.from(financialEvents)
			.where(
				and(
					eq(financialEvents.userId, userId),
					gte(financialEvents.startDate, now),
					lte(financialEvents.startDate, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
				),
			)
			.orderBy(financialEvents.startDate)
			.limit(10),

		// 5. Recent transactions (last 20)
		db
			.select({
				id: transactions.id,
				amount: transactions.amount,
				description: transactions.description,
				categoryId: transactions.categoryId,
				transactionDate: transactions.transactionDate,
				type: transactions.transactionType,
			})
			.from(transactions)
			.where(eq(transactions.userId, userId))
			.orderBy(desc(transactions.transactionDate))
			.limit(20),

		// 6. Category names
		db
			.select({
				id: transactionCategories.id,
				name: transactionCategories.name,
			})
			.from(transactionCategories)
			.where(eq(transactionCategories.userId, userId)),
	]);

	// Process account summary
	const accountsByType = {
		checking: 0,
		savings: 0,
		credit: 0,
		investment: 0,
	};
	let totalBalance = 0;
	let availableBalance = 0;

	accounts.forEach((acc) => {
		const balance = Number(acc.balance ?? 0);
		const available = Number(acc.availableBalance ?? 0);
		totalBalance += balance;
		availableBalance += available;

		const type = acc.accountType?.toLowerCase() as keyof typeof accountsByType;
		if (type in accountsByType) {
			accountsByType[type] += balance;
		}
	});

	const summary: FinancialSummary = {
		userName,
		totalBalance,
		availableBalance,
		accountsByType,
		netWorth:
			accountsByType.checking +
			accountsByType.savings +
			accountsByType.investment -
			accountsByType.credit,
	};

	// Create category map
	const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

	// Process monthly spending by category
	const spendingByCategory = new Map<string, { total: number; count: number }>();
	monthlyTxns.forEach((tx) => {
		const catId = tx.categoryId ?? 'uncategorized';
		const current = spendingByCategory.get(catId) ?? { total: 0, count: 0 };
		current.total += Math.abs(Number(tx.amount));
		current.count += 1;
		spendingByCategory.set(catId, current);
	});

	const monthlySpending: CategorySpending[] = Array.from(spendingByCategory.entries())
		.map(([categoryId, data]) => ({
			categoryId: categoryId === 'uncategorized' ? null : categoryId,
			categoryName: categoryMap.get(categoryId) ?? 'Sem categoria',
			totalSpent: data.total,
			transactionCount: data.count,
			averageTransaction: data.total / data.count,
		}))
		.sort((a, b) => b.totalSpent - a.totalSpent);

	// Process budgets with current spending
	const budgets: BudgetStatus[] = budgetData.map((b) => {
		const spent = spendingByCategory.get(b.categoryId ?? '')?.total ?? 0;
		const limit = Number(b.budgetAmount);
		return {
			categoryId: b.categoryId,
			categoryName: categoryMap.get(b.categoryId ?? '') ?? 'Orçamento',
			monthlyLimit: limit,
			currentSpent: spent,
			remaining: limit - spent,
			usagePercent: limit > 0 ? (spent / limit) * 100 : 0,
		};
	});

	// Format upcoming payments
	const upcomingPayments = upcoming.map((u) => ({
		description: u.description ?? 'Pagamento',
		amount: Number(u.amount ?? 0),
		dueDate: u.dueDate!,
	}));

	// Format recent transactions
	const recentTransactions: RecentTransaction[] = recent.map((tx) => ({
		id: tx.id,
		amount: Number(tx.amount),
		description: tx.description,
		categoryName: categoryMap.get(tx.categoryId ?? '') ?? null,
		transactionDate: tx.transactionDate!,
		type: tx.type ?? 'debit',
	}));

	// Generate alerts
	const alerts = generateFinancialAlerts(
		{ totalBalance, availableBalance },
		budgets,
		[], // Goals would be fetched if we had a goals table
	);

	return {
		summary,
		monthlySpending,
		budgets,
		upcomingPayments,
		recentTransactions,
		alerts,
	};
}

// ========================================
// CONTEXT FORMATTING
// ========================================

/**
 * Format financial context as XML for AI prompt injection
 * XML format provides clear structure for LLM parsing
 */
export function formatContextForPrompt(context: FinancialContext): string {
	const { summary, monthlySpending, budgets, upcomingPayments, recentTransactions, alerts } =
		context;

	const formatCurrency = (value: number): string =>
		`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

	const formatDate = (date: Date): string =>
		date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

	return `
<user_financial_data>
  <profile>
    <name>${summary.userName}</name>
    <net_worth>${formatCurrency(summary.netWorth)}</net_worth>
  </profile>

  <accounts>
    <total_balance>${formatCurrency(summary.totalBalance)}</total_balance>
    <available_balance>${formatCurrency(summary.availableBalance)}</available_balance>
    <checking>${formatCurrency(summary.accountsByType.checking)}</checking>
    <savings>${formatCurrency(summary.accountsByType.savings)}</savings>
    <credit_debt>${formatCurrency(summary.accountsByType.credit)}</credit_debt>
    <investments>${formatCurrency(summary.accountsByType.investment)}</investments>
  </accounts>

  <monthly_spending>
    ${monthlySpending
			.slice(0, 10)
			.map(
				(s) =>
					`<category name="${s.categoryName}" total="${formatCurrency(s.totalSpent)}" count="${s.transactionCount}"/>`,
			)
			.join('\n    ')}
  </monthly_spending>

  <budgets>
    ${budgets
			.map(
				(b) =>
					`<budget category="${b.categoryName}" limit="${formatCurrency(b.monthlyLimit)}" spent="${formatCurrency(b.currentSpent)}" usage="${b.usagePercent.toFixed(0)}%"/>`,
			)
			.join('\n    ')}
  </budgets>

  <upcoming_payments>
    ${upcomingPayments
			.slice(0, 5)
			.map(
				(p) =>
					`<payment description="${p.description}" amount="${formatCurrency(p.amount)}" due="${formatDate(p.dueDate)}"/>`,
			)
			.join('\n    ')}
  </upcoming_payments>

  <alerts priority="high_first">
    ${alerts.map((a) => `<alert type="${a.type}" severity="${a.severity}">${a.message}</alert>`).join('\n    ')}
  </alerts>

  <recent_transactions>
    ${recentTransactions
			.slice(0, 10)
			.map(
				(t) =>
					`<transaction date="${formatDate(t.transactionDate)}" category="${t.categoryName ?? 'N/A'}" amount="${formatCurrency(t.amount)}" description="${t.description}"/>`,
			)
			.join('\n    ')}
  </recent_transactions>
</user_financial_data>
`.trim();
}

/**
 * Get a minimal context summary for token-limited scenarios
 */
export function getMinimalContext(context: FinancialContext): string {
	const { summary, alerts } = context;
	const formatCurrency = (value: number): string =>
		`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

	return `
Resumo Financeiro:
- Saldo Total: ${formatCurrency(summary.totalBalance)}
- Patrimônio Líquido: ${formatCurrency(summary.netWorth)}
${alerts.length > 0 ? `\nAlertas: ${alerts.map((a) => a.message).join('; ')}` : ''}
`.trim();
}
