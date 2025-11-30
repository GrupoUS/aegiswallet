/**
 * Financial Context Service
 * Aggregates user financial data with caching for AI agent context injection
 */

import { and, desc, eq, gte, lte, sum } from 'drizzle-orm';

import type { CategorySummary, FinancialAlert, FinancialContext, UpcomingPayment } from '../types';
import { db } from '@/db/client';
import {
	aiInsights,
	bankAccounts,
	transactionCategories,
	transactionSchedules,
	transactions,
} from '@/db/schema';

// Cache TTL: 5 minutes
const CONTEXT_CACHE_TTL_MS = 5 * 60 * 1000;

// Maximum cache entries to prevent memory leaks in serverless environments
const MAX_CACHE_ENTRIES = 100;

// In-memory cache (per user) with LRU eviction
const contextCache = new Map<
	string,
	{ context: FinancialContext; expiresAt: number; lastAccess: number }
>();

/**
 * LRU cache eviction - removes oldest entries when max size is reached
 */
function evictOldestCacheEntries(): void {
	if (contextCache.size <= MAX_CACHE_ENTRIES) return;

	// Sort by lastAccess and remove oldest entries
	const entries = Array.from(contextCache.entries()).sort(
		(a, b) => a[1].lastAccess - b[1].lastAccess,
	);

	const entriesToRemove = entries.slice(0, contextCache.size - MAX_CACHE_ENTRIES);
	for (const [key] of entriesToRemove) {
		contextCache.delete(key);
	}
}

/**
 * Service for building and caching user financial context
 * Used for system prompt injection in the Financial Agent
 */
export class FinancialContextService {
	private userId: string;

	constructor(userId: string) {
		this.userId = userId;
	}

	/**
	 * Get financial context with caching
	 * @param forceRefresh - Force cache invalidation
	 */
	async getContext(forceRefresh = false): Promise<FinancialContext> {
		const cacheKey = this.userId;
		const cached = contextCache.get(cacheKey);
		const now = Date.now();

		if (!forceRefresh && cached && cached.expiresAt > now) {
			// Update last access time for LRU tracking
			cached.lastAccess = now;
			return cached.context;
		}

		const context = await this.buildContext();

		contextCache.set(cacheKey, {
			context,
			expiresAt: now + CONTEXT_CACHE_TTL_MS,
			lastAccess: now,
		});

		// Evict old entries if cache is too large
		evictOldestCacheEntries();

		return context;
	}

	/**
	 * Invalidate cache (call when user makes financial changes)
	 */
	invalidateCache(): void {
		contextCache.delete(this.userId);
	}

	/**
	 * Clear all cache entries (for testing/maintenance)
	 */
	static clearAllCache(): void {
		contextCache.clear();
	}

	private async buildContext(): Promise<FinancialContext> {
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

		// Parallel queries for performance
		const [accountsData, monthlyTotals, categorySpending, pendingAlerts, upcomingPayments] =
			await Promise.all([
				this.getAccountBalances(),
				this.getMonthlyTotals(startOfMonth, endOfMonth),
				this.getCategorySpending(startOfMonth, endOfMonth),
				this.getPendingAlerts(),
				this.getUpcomingPayments(30),
			]);

		// Calculate account totals
		const totalBalance = accountsData.reduce((acc, row) => acc + Number(row.balance || 0), 0);
		const availableBalance = accountsData.reduce(
			(acc, row) => acc + Number(row.availableBalance || 0),
			0,
		);

		return {
			totalBalance,
			availableBalance,
			monthlyIncome: monthlyTotals.income,
			monthlyExpenses: monthlyTotals.expenses,
			topCategories: categorySpending,
			pendingAlerts,
			upcomingPayments,
			lastUpdated: now,
		};
	}

	private async getAccountBalances() {
		return await db
			.select({
				id: bankAccounts.id,
				balance: bankAccounts.balance,
				availableBalance: bankAccounts.availableBalance,
				institutionName: bankAccounts.institutionName,
			})
			.from(bankAccounts)
			.where(and(eq(bankAccounts.userId, this.userId), eq(bankAccounts.isActive, true)));
	}

	private async getMonthlyTotals(
		start: Date,
		end: Date,
	): Promise<{ income: number; expenses: number }> {
		const result = await db
			.select({
				transactionType: transactions.transactionType,
				total: sum(transactions.amount),
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.userId, this.userId),
					gte(transactions.transactionDate, start),
					lte(transactions.transactionDate, end),
				),
			)
			.groupBy(transactions.transactionType);

		let income = 0;
		let expenses = 0;

		for (const row of result) {
			const amount = Math.abs(Number(row.total || 0));
			if (row.transactionType === 'credit') {
				income += amount;
			} else if (row.transactionType === 'debit') {
				expenses += amount;
			}
		}

		return { income, expenses };
	}

	private async getCategorySpending(start: Date, end: Date): Promise<CategorySummary[]> {
		const result = await db
			.select({
				categoryId: transactions.categoryId,
				categoryName: transactionCategories.name,
				total: sum(transactions.amount),
			})
			.from(transactions)
			.leftJoin(transactionCategories, eq(transactions.categoryId, transactionCategories.id))
			.where(
				and(
					eq(transactions.userId, this.userId),
					eq(transactions.transactionType, 'debit'),
					gte(transactions.transactionDate, start),
					lte(transactions.transactionDate, end),
				),
			)
			.groupBy(transactions.categoryId, transactionCategories.name)
			.orderBy(desc(sum(transactions.amount)))
			.limit(10);

		const totalSpending = result.reduce((acc, r) => acc + Math.abs(Number(r.total || 0)), 0);

		return result.map((r) => ({
			categoryId: r.categoryId || 'uncategorized',
			categoryName: r.categoryName || 'Sem categoria',
			amount: Math.abs(Number(r.total || 0)),
			percentage:
				totalSpending > 0 ? Math.round((Math.abs(Number(r.total || 0)) / totalSpending) * 100) : 0,
			trend: 'stable' as const, // TODO: Calculate from historical data in future iteration
		}));
	}

	private async getPendingAlerts(): Promise<FinancialAlert[]> {
		const insights = await db
			.select({
				id: aiInsights.id,
				insightType: aiInsights.insightType,
				title: aiInsights.title,
				impactLevel: aiInsights.impactLevel,
				recommendation: aiInsights.recommendation,
			})
			.from(aiInsights)
			.where(and(eq(aiInsights.userId, this.userId), eq(aiInsights.isRead, false)))
			.orderBy(desc(aiInsights.createdAt))
			.limit(5);

		return insights.map((insight) => ({
			id: insight.id,
			type: this.mapInsightTypeToAlertType(insight.insightType),
			message: insight.title,
			severity: (insight.impactLevel || 'medium') as 'low' | 'medium' | 'high',
			actionable: !!insight.recommendation,
		}));
	}

	/**
	 * Maps database insightType values to FinancialAlert types
	 *
	 * CRITICAL: Database stores insightType in snake_case format.
	 * Case values MUST match exactly: 'budget_alert', 'spending_pattern', 'warning', 'opportunity'
	 * This function normalizes both camelCase and snake_case inputs to handle edge cases defensively.
	 *
	 * @see src/db/schema/voice-ai.ts - insightType field comment for valid values
	 */
	private mapInsightTypeToAlertType(insightType: string): FinancialAlert['type'] {
		// Normalize to snake_case to handle both formats defensively
		// Database stores values as snake_case, but normalize in case camelCase is passed
		const normalized = this.normalizeInsightType(insightType);

		switch (normalized) {
			case 'budget_alert':
				return 'budget_exceeded';
			case 'warning':
				return 'low_balance';
			case 'spending_pattern':
				return 'unusual_spending';
			case 'opportunity':
				return 'payment_due';
			default:
				return 'unusual_spending';
		}
	}

	/**
	 * Normalize insightType to snake_case format
	 * Handles both camelCase (budgetAlert, spendingPattern) and snake_case (budget_alert, spending_pattern)
	 * Database schema expects snake_case: spending_pattern, budget_alert, opportunity, warning
	 */
	private normalizeInsightType(insightType: string): string {
		// If already snake_case, return as-is
		if (insightType.includes('_')) {
			return insightType;
		}

		// Convert camelCase to snake_case
		// budgetAlert -> budget_alert, spendingPattern -> spending_pattern
		return insightType.replace(/([A-Z])/g, '_$1').toLowerCase();
	}

	private async getUpcomingPayments(daysAhead: number): Promise<UpcomingPayment[]> {
		const today = new Date();
		const futureDate = new Date();
		futureDate.setDate(today.getDate() + daysAhead);

		// Format dates as YYYY-MM-DD strings for date column comparison
		const todayStr = today.toISOString().split('T')[0];
		const futureDateStr = futureDate.toISOString().split('T')[0];

		const schedules = await db
			.select({
				id: transactionSchedules.id,
				description: transactionSchedules.description,
				amount: transactionSchedules.amount,
				scheduledDate: transactionSchedules.scheduledDate,
				recurrenceRule: transactionSchedules.recurrenceRule,
			})
			.from(transactionSchedules)
			.where(
				and(
					eq(transactionSchedules.userId, this.userId),
					eq(transactionSchedules.isActive, true),
					eq(transactionSchedules.executed, false),
					gte(transactionSchedules.scheduledDate, todayStr),
					lte(transactionSchedules.scheduledDate, futureDateStr),
				),
			)
			.orderBy(transactionSchedules.scheduledDate)
			.limit(10);

		return schedules.map((s) => ({
			id: s.id,
			description: s.description,
			amount: Math.abs(Number(s.amount)),
			dueDate: new Date(s.scheduledDate),
			isRecurring: !!s.recurrenceRule,
		}));
	}
}
