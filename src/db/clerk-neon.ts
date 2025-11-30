/**
 * Clerk + Neon Integration Utilities
 *
 * Provides user-scoped database access following the official
 * Clerk + Neon integration pattern for multi-tenant data isolation.
 *
 * @see https://clerk.com/docs/integrations/databases/neon
 */

import { neon } from '@neondatabase/serverless';
import { and, desc, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

// ========================================
// DATABASE CLIENT
// ========================================

/**
 * Get database URL from environment
 */
const getDatabaseUrl = (): string => {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error('DATABASE_URL must be a Neon postgres connection string');
	}
	return url;
};

/**
 * Create database client with schema
 */
export const createDb = () => {
	const sql = neon(getDatabaseUrl());
	return drizzle(sql, { schema });
};

/**
 * Default database instance
 *
 * Note: In browser context, this will be null. Only use on server-side.
 */
export const db =
	typeof window === 'undefined' && process.env.DATABASE_URL
		? createDb()
		: (null as unknown as ReturnType<typeof createDb>);

// ========================================
// USER-SCOPED QUERY HELPERS
// ========================================

/**
 * Get user's bank accounts
 */
export async function getUserBankAccounts(userId: string) {
	return db
		.select()
		.from(schema.bankAccounts)
		.where(eq(schema.bankAccounts.userId, userId))
		.orderBy(desc(schema.bankAccounts.createdAt));
}

/**
 * Get user's transactions with optional filters
 */
export async function getUserTransactions(
	userId: string,
	options?: {
		limit?: number;
		offset?: number;
		accountId?: string;
		categoryId?: string;
		startDate?: Date;
		endDate?: Date;
	},
) {
	const conditions = [eq(schema.transactions.userId, userId)];

	if (options?.accountId) {
		conditions.push(eq(schema.transactions.accountId, options.accountId));
	}

	if (options?.categoryId) {
		conditions.push(eq(schema.transactions.categoryId, options.categoryId));
	}

	let query = db
		.select()
		.from(schema.transactions)
		.where(and(...conditions))
		.orderBy(desc(schema.transactions.transactionDate));

	if (options?.limit) {
		query = query.limit(options.limit) as typeof query;
	}

	if (options?.offset) {
		query = query.offset(options.offset) as typeof query;
	}

	return query;
}

/**
 * Get user's PIX keys
 */
export async function getUserPixKeys(userId: string) {
	return db
		.select()
		.from(schema.pixKeys)
		.where(eq(schema.pixKeys.userId, userId))
		.orderBy(desc(schema.pixKeys.createdAt));
}

/**
 * Get user's PIX transactions
 */
export async function getUserPixTransactions(userId: string, options?: { limit?: number }) {
	let query = db
		.select()
		.from(schema.pixTransactions)
		.where(eq(schema.pixTransactions.userId, userId))
		.orderBy(desc(schema.pixTransactions.createdAt));

	if (options?.limit) {
		query = query.limit(options.limit) as typeof query;
	}

	return query;
}

/**
 * Get user's contacts
 */
export async function getUserContacts(userId: string) {
	return db
		.select()
		.from(schema.contacts)
		.where(eq(schema.contacts.userId, userId))
		.orderBy(schema.contacts.name);
}

/**
 * Get user's boletos
 */
export async function getUserBoletos(
	userId: string,
	options?: { status?: 'pending' | 'paid' | 'overdue' | 'cancelled' },
) {
	const conditions = [eq(schema.boletos.userId, userId)];

	if (options?.status) {
		conditions.push(eq(schema.boletos.status, options.status));
	}

	return db
		.select()
		.from(schema.boletos)
		.where(and(...conditions))
		.orderBy(desc(schema.boletos.dueDate));
}

/**
 * Get user's LGPD consents
 */
export async function getUserConsents(userId: string) {
	return db.select().from(schema.lgpdConsents).where(eq(schema.lgpdConsents.userId, userId));
}

/**
 * Get user's transaction limits
 */
export async function getUserTransactionLimits(userId: string) {
	return db
		.select()
		.from(schema.transactionLimits)
		.where(eq(schema.transactionLimits.userId, userId));
}

/**
 * Get user's financial summary
 */
export async function getUserFinancialSummary(userId: string) {
	// Get total balance
	const accounts = await db
		.select({
			balance: schema.bankAccounts.balance,
			currency: schema.bankAccounts.currency,
		})
		.from(schema.bankAccounts)
		.where(and(eq(schema.bankAccounts.userId, userId), eq(schema.bankAccounts.isActive, true)));

	const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);

	// Get recent transactions count
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	const recentTransactions = await db
		.select({ count: sql<number>`count(*)` })
		.from(schema.transactions)
		.where(
			and(
				eq(schema.transactions.userId, userId),
				sql`${schema.transactions.transactionDate} >= ${thirtyDaysAgo}`,
			),
		);

	return {
		totalBalance,
		accountCount: accounts.length,
		transactionCount: Number(recentTransactions[0]?.count || 0),
		currency: 'BRL',
	};
}

// ========================================
// CRUD OPERATIONS
// ========================================

/**
 * Create a transaction for user
 */
export async function createUserTransaction(
	userId: string,
	data: Omit<schema.InsertTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
) {
	const result = await db
		.insert(schema.transactions)
		.values({
			...data,
			userId,
		})
		.returning();

	return result[0];
}

/**
 * Update a transaction (with ownership check)
 */
export async function updateUserTransaction(
	userId: string,
	transactionId: string,
	data: Partial<schema.InsertTransaction>,
) {
	const result = await db
		.update(schema.transactions)
		.set({
			...data,
			updatedAt: new Date(),
		})
		.where(and(eq(schema.transactions.id, transactionId), eq(schema.transactions.userId, userId)))
		.returning();

	return result[0];
}

/**
 * Delete a transaction (with ownership check)
 */
export async function deleteUserTransaction(userId: string, transactionId: string) {
	const result = await db
		.delete(schema.transactions)
		.where(and(eq(schema.transactions.id, transactionId), eq(schema.transactions.userId, userId)))
		.returning();

	return result[0];
}

/**
 * Create a bank account for user
 */
export async function createUserBankAccount(
	userId: string,
	data: Omit<schema.InsertBankAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
) {
	const result = await db
		.insert(schema.bankAccounts)
		.values({
			...data,
			userId,
		})
		.returning();

	return result[0];
}

/**
 * Update bank account balance (with ownership check)
 */
export async function updateUserBankAccountBalance(
	userId: string,
	accountId: string,
	newBalance: string,
) {
	const result = await db
		.update(schema.bankAccounts)
		.set({
			balance: newBalance,
			updatedAt: new Date(),
		})
		.where(and(eq(schema.bankAccounts.id, accountId), eq(schema.bankAccounts.userId, userId)))
		.returning();

	return result[0];
}

// ========================================
// TYPE EXPORTS
// ========================================

export type Database = ReturnType<typeof createDb>;
export { schema };
