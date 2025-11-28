import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/db/client';
import { bankAccounts, financialEvents, users } from '@/db/schema';
import logger from '@/lib/logging/logger';

export interface FinancialContext {
	recentTransactions: Transaction[];
	accountBalances: AccountBalance[];
	upcomingEvents: FinancialEvent[];
	userPreferences: UserPreferences;
	summary: {
		totalBalance: number;
		monthlyIncome: number;
		monthlyExpenses: number;
		upcomingBillsCount: number;
	};
}

export interface Transaction {
	id: string;
	amount: number;
	description: string;
	category: string;
	date: string;
	type: 'income' | 'expense';
}

interface AccountBalance {
	accountId: string;
	accountName: string;
	balance: number;
	currency: string;
}

interface FinancialEvent {
	id: string;
	title: string;
	amount: number;
	date: string;
	type: string;
	status: string;
}

interface UserPreferences {
	language: string;
	currency: string;
	timezone: string;
}

export class ContextRetriever {
	private cacheTimeout = 5 * 60 * 1000; // 5 minutes
	private cache: Map<
		string,
		{
			data:
				| FinancialContext
				| Transaction[]
				| AccountBalance[]
				| FinancialEvent[]
				| UserPreferences;
			timestamp: number;
		}
	> = new Map();

	/**
	 * Fetch complete financial context for the user
	 * Simplified version using direct queries only
	 */
	async getFinancialContext(userId: string): Promise<FinancialContext> {
		const cacheKey = `context:${userId}`;
		const cached = this.getFromCache<FinancialContext>(cacheKey);
		if (cached) return cached as FinancialContext;

		// Use direct queries only
		const [transactions, balances, events, preferences] = await Promise.all([
			this.getRecentTransactions(userId),
			this.getAccountBalances(userId),
			this.getUpcomingEvents(userId),
			this.getUserPreferences(userId),
		]);

		const context: FinancialContext = {
			recentTransactions: transactions,
			accountBalances: balances,
			upcomingEvents: events,
			userPreferences: preferences,
			summary: this.calculateSummary(transactions, balances, events),
		};

		this.setCache(cacheKey, context);
		return context;
	}

	/**
	 * Get recent transactions (last 30 days)
	 */
	async getRecentTransactions(
		userId: string,
		days = 30,
	): Promise<Transaction[]> {
		const cacheKey = `transactions:${userId}:${days}`;
		const cached = this.getFromCache<Transaction[]>(cacheKey);
		if (cached) return cached as Transaction[];

		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		try {
			const data = await db
				.select({
					id: financialEvents.id,
					amount: financialEvents.amount,
					description: financialEvents.description,
					title: financialEvents.title,
					createdAt: financialEvents.createdAt,
					isIncome: financialEvents.isIncome,
				})
				.from(financialEvents)
				.where(
					and(
						eq(financialEvents.userId, userId),
						gte(financialEvents.createdAt, startDate),
					),
				)
				.orderBy(desc(financialEvents.createdAt))
				.limit(50);

			const transactions: Transaction[] = (data || []).map((t) => ({
				id: t.id,
				amount: Number(t.amount) || 0,
				description: t.description || t.title || '',
				category: 'other', // Would need to join with categories table
				date: t.createdAt?.toISOString() ?? new Date().toISOString(),
				type: (t.isIncome ? 'income' : 'expense') as 'income' | 'expense',
			}));

			this.setCache(cacheKey, transactions);
			return transactions;
		} catch (err) {
			logger.error('Error fetching transactions', {
				component: 'ContextRetriever',
				action: 'getRecentTransactions',
				error: String(err),
			});
			return [];
		}
	}

	/**
	 * Get account balances
	 */
	async getAccountBalances(userId: string): Promise<AccountBalance[]> {
		const cacheKey = `balances:${userId}`;
		const cached = this.getFromCache<AccountBalance[]>(cacheKey);
		if (cached) return cached as AccountBalance[];

		try {
			const data = await db
				.select({
					id: bankAccounts.id,
					institutionName: bankAccounts.institutionName,
					currentBalance: bankAccounts.currentBalance,
					currency: bankAccounts.currency,
				})
				.from(bankAccounts)
				.where(
					and(
						eq(bankAccounts.userId, userId),
						eq(bankAccounts.isActive, true),
					),
				);

			const balances: AccountBalance[] = (data || []).map((a) => ({
				accountId: a.id,
				accountName: a.institutionName || 'Unnamed Account',
				balance: Number(a.currentBalance) || 0,
				currency: a.currency || 'BRL',
			}));

			this.setCache(cacheKey, balances);
			return balances;
		} catch (err) {
			logger.error('Error fetching balances', {
				component: 'ContextRetriever',
				action: 'getAccountBalances',
				error: String(err),
			});
			return [];
		}
	}

	/**
	 * Get upcoming financial events (next 30 days)
	 */
	async getUpcomingEvents(
		userId: string,
		days = 30,
	): Promise<FinancialEvent[]> {
		const cacheKey = `events:${userId}:${days}`;
		const cached = this.getFromCache<FinancialEvent[]>(cacheKey);
		if (cached) return cached as FinancialEvent[];

		const endDate = new Date();
		endDate.setDate(endDate.getDate() + days);

		try {
			const data = await db
				.select({
					id: financialEvents.id,
					title: financialEvents.title,
					amount: financialEvents.amount,
					dueDate: financialEvents.dueDate,
					eventTypeId: financialEvents.eventTypeId,
					status: financialEvents.status,
				})
				.from(financialEvents)
				.where(
					and(
						eq(financialEvents.userId, userId),
						lte(financialEvents.dueDate, endDate),
					),
				)
				.orderBy(financialEvents.dueDate)
				.limit(20);

			const events: FinancialEvent[] = (data || []).map((e) => ({
				id: e.id,
				title: e.title || '',
				amount: Number(e.amount) || 0,
				date: e.dueDate?.toISOString() || new Date().toISOString(),
				type: e.eventTypeId || 'other',
				status: e.status || 'pending',
			}));

			this.setCache(cacheKey, events);
			return events;
		} catch (err) {
			logger.error('Error fetching events', {
				component: 'ContextRetriever',
				action: 'getUpcomingEvents',
				error: String(err),
			});
			return [];
		}
	}

	/**
	 * Get user preferences
	 */
	async getUserPreferences(userId: string): Promise<UserPreferences> {
		const cacheKey = `preferences:${userId}`;
		const cached = this.getFromCache<UserPreferences>(cacheKey);
		if (cached) return cached as UserPreferences;

		try {
			const [data] = await db
				.select({
					preferredLanguage: users.preferredLanguage,
					currency: users.currency,
					timezone: users.timezone,
				})
				.from(users)
				.where(eq(users.id, userId))
				.limit(1);

			const preferences: UserPreferences = {
				language: data?.preferredLanguage || 'pt-BR',
				currency: data?.currency || 'BRL',
				timezone: data?.timezone || 'America/Sao_Paulo',
			};

			this.setCache(cacheKey, preferences);
			return preferences;
		} catch (err) {
			logger.error('Error fetching preferences', {
				component: 'ContextRetriever',
				action: 'getUserPreferences',
				error: String(err),
			});
			return {
				language: 'pt-BR',
				currency: 'BRL',
				timezone: 'America/Sao_Paulo',
			};
		}
	}

	/**
	 * Calculate summary statistics
	 */
	private calculateSummary(
		transactions: Transaction[],
		balances: AccountBalance[],
		events: FinancialEvent[],
	) {
		const totalBalance = balances.reduce((sum, acc) => sum + acc.balance, 0);

		const monthlyIncome = transactions
			.filter((t) => t.type === 'income')
			.reduce((sum, t) => sum + t.amount, 0);

		const monthlyExpenses = transactions
			.filter((t) => t.type === 'expense')
			.reduce((sum, t) => sum + t.amount, 0);

		const upcomingBillsCount = events.filter(
			(e) => e.status === 'pending',
		).length;

		return {
			totalBalance,
			monthlyIncome,
			monthlyExpenses,
			upcomingBillsCount,
		};
	}

	/**
	 * Clear cache (useful for testing or when data changes)
	 */
	clearCache() {
		this.cache.clear();
	}

	/**
	 * Get from cache if not expired
	 */
	private getFromCache<
		T extends
			| FinancialContext
			| Transaction[]
			| AccountBalance[]
			| FinancialEvent[]
			| UserPreferences,
	>(key: string): T | null {
		const cached = this.cache.get(key);
		if (!cached || cached.data === undefined) return null;

		const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
		if (isExpired) {
			this.cache.delete(key);
			return null;
		}

		return cached.data as T;
	}

	/**
	 * Set cache
	 */
	private setCache(
		key: string,
		data:
			| FinancialContext
			| Transaction[]
			| AccountBalance[]
			| FinancialEvent[]
			| UserPreferences,
	) {
		this.cache.set(key, { data, timestamp: Date.now() });
	}
}
