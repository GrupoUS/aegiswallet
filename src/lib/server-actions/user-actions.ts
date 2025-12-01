/**
 * Server Actions using Clerk + NeonDB Integration
 *
 * Following official Clerk + NeonDB documentation pattern
 * All operations use authenticated database clients for proper data isolation
 *
 * NOTE: These functions require a valid JWT token to be passed.
 * In a real-world scenario, you would get the token from the request
 * or use Clerk's server-side authentication context.
 */

import { eq } from 'drizzle-orm';

import { createAuthenticatedDbClientFromToken } from '@/db/auth-client';
import { type InsertUserPreferences, userPreferences, users } from '@/db/schema';
import logger from '@/lib/logging/logger';

// ========================================
// PROFILE ACTIONS
// ========================================

/**
 * Get current user profile
 * @param token - Clerk JWT token
 */
export async function getUserProfile(token: string) {
	const { db, userId } = await createAuthenticatedDbClientFromToken(token);

	try {
		const [user] = await db.select().from(users).where(eq(users.id, userId));

		return user;
	} catch (error) {
		logger.error('Error fetching user profile:', {
			error: String(error),
			userId,
		});
		throw new Error('Failed to fetch user profile');
	}
}

/**
 * Update user preferences
 * @param token - Clerk JWT token
 * @param data - Partial preferences data
 */
export async function updateUserPreferences(token: string, data: Partial<InsertUserPreferences>) {
	const { db, userId } = await createAuthenticatedDbClientFromToken(token);

	try {
		// First check if preferences exist
		const existingPrefs = await db
			.select()
			.from(userPreferences)
			.where(eq(userPreferences.userId, userId))
			.limit(1);

		if (existingPrefs.length === 0) {
			// Create new preferences
			const [newPrefs] = await db
				.insert(userPreferences)
				.values({
					userId,
					...data,
				})
				.returning();
			return newPrefs;
		}
		// Update existing preferences
		const [updatedPrefs] = await db
			.update(userPreferences)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(userPreferences.userId, userId))
			.returning();
		return updatedPrefs;
	} catch (error) {
		logger.error('Error updating user preferences:', {
			error: String(error),
			userId,
		});
		throw new Error('Failed to update user preferences');
	}
}

/**
 * Get user preferences
 * @param token - Clerk JWT token
 */
export async function getUserPreferences(token: string) {
	const { db, userId } = await createAuthenticatedDbClientFromToken(token);

	try {
		const [preferences] = await db
			.select()
			.from(userPreferences)
			.where(eq(userPreferences.userId, userId))
			.limit(1);

		return preferences || null;
	} catch (error) {
		logger.error('Error fetching user preferences:', {
			error: String(error),
			userId,
		});
		throw new Error('Failed to fetch user preferences');
	}
}

// ========================================
// TRANSACTIONS ACTIONS (Example)
// ========================================

/**
 * Get user transactions with automatic data isolation
 * @param token - Clerk JWT token
 * @param limit - Maximum number of transactions to return
 */
export async function getUserTransactions(token: string, limit = 50) {
	const { db, userId } = await createAuthenticatedDbClientFromToken(token);
	const { transactions } = await import('@/db/schema');

	try {
		const userTransactions = await db
			.select()
			.from(transactions)
			.where(eq(transactions.userId, userId))
			.limit(limit)
			.orderBy(transactions.createdAt);

		return userTransactions;
	} catch (error) {
		logger.error('Error fetching user transactions:', {
			error: String(error),
			userId,
		});
		throw new Error('Failed to fetch user transactions');
	}
}

/**
 * Create a transaction with automatic user assignment
 * @param token - Clerk JWT token
 * @param data - Transaction data
 */
export async function createUserTransaction(
	token: string,
	data: {
		amount: number;
		description: string;
		categoryId?: string;
		transactionType: string;
	},
) {
	const { db, userId } = await createAuthenticatedDbClientFromToken(token);
	const { transactions } = await import('@/db/schema');

	try {
		// Transaction is automatically assigned to the authenticated user
		const [transaction] = await db
			.insert(transactions)
			.values({
				userId,
				amount: data.amount.toString(),
				description: data.description,
				categoryId: data.categoryId,
				transactionType: data.transactionType,
				transactionDate: new Date(),
				isManualEntry: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		return transaction;
	} catch (error) {
		logger.error('Error creating user transaction:', {
			error: String(error),
			userId,
		});
		throw new Error('Failed to create user transaction');
	}
}
