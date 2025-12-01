/**
 * Transactions API - Hono RPC Implementation
 * Handles transaction CRUD operations and statistics
 * Using Drizzle ORM with Neon serverless
 */

import { zValidator } from '@hono/zod-validator';
import { and, desc, eq, gte, ilike, lte } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { transactions } from '@/db/schema';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';

// =====================================================
// Validation Schemas
// =====================================================

const listTransactionsSchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(50),
	offset: z.coerce.number().int().min(0).default(0),
	categoryId: z.string().optional(),
	accountId: z.string().optional(),
	type: z.enum(['transfer', 'debit', 'credit', 'pix', 'boleto']).optional(),
	status: z.enum(['cancelled', 'failed', 'pending', 'posted']).optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	search: z.string().optional(),
});

const createTransactionSchema = z.object({
	amount: z.number(),
	categoryId: z.string().optional(),
	description: z.string(),
	transactionType: z.enum(['transfer', 'debit', 'credit', 'pix', 'boleto']),
	status: z.enum(['cancelled', 'failed', 'pending', 'posted']).default('pending'),
	transactionDate: z.string().optional(),
	accountId: z.string().optional(),
	paymentMethod: z.string().optional(),
	merchantName: z.string().optional(),
	notes: z.string().optional(),
	tags: z.array(z.string()).optional(),
});

const getStatisticsSchema = z.object({
	period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
	accountId: z.string().optional(),
});

const transactionsRouter = new Hono<AppEnv>();

// =====================================================
// Transactions CRUD
// =====================================================

/**
 * List transactions with filters
 */
transactionsRouter.get(
	'/',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 30,
		message: 'Too many requests, please try again later',
	}),
	zValidator('query', listTransactionsSchema),
	async (c) => {
		const { user, db } = c.get('auth');
		const filters = c.req.valid('query');
		const requestId = c.get('requestId');

		try {
			// Build conditions array
			const conditions = [eq(transactions.userId, user.id)];

			if (filters.categoryId) {
				conditions.push(eq(transactions.categoryId, filters.categoryId));
			}

			if (filters.accountId) {
				conditions.push(eq(transactions.accountId, filters.accountId));
			}

			if (filters.type) {
				conditions.push(eq(transactions.transactionType, filters.type));
			}

			if (filters.status) {
				conditions.push(eq(transactions.status, filters.status));
			}

			if (filters.startDate) {
				conditions.push(gte(transactions.transactionDate, new Date(filters.startDate)));
			}

			if (filters.endDate) {
				conditions.push(lte(transactions.transactionDate, new Date(filters.endDate)));
			}

			if (filters.search) {
				conditions.push(ilike(transactions.description, `%${filters.search}%`));
			}

			const data = await db
				.select()
				.from(transactions)
				.where(and(...conditions))
				.orderBy(desc(transactions.createdAt))
				.limit(filters.limit)
				.offset(filters.offset);

			return c.json({
				data,
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
					total: data.length,
				},
			});
		} catch (error) {
			secureLogger.error('Failed to get transactions', {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'TRANSACTIONS_ERROR',
					error: 'Failed to retrieve transactions',
				},
				500,
			);
		}
	},
);

/**
 * Get transaction statistics
 */
transactionsRouter.get(
	'/statistics',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 20,
		message: 'Too many requests, please try again later',
	}),
	zValidator('query', getStatisticsSchema),
	async (c) => {
		const { user, db } = c.get('auth');
		const { period } = c.req.valid('query');
		const requestId = c.get('requestId');

		try {
			const now = new Date();
			const startDate = new Date();

			switch (period) {
				case 'week':
					startDate.setDate(now.getDate() - 7);
					break;
				case 'month':
					startDate.setMonth(now.getMonth() - 1);
					break;
				case 'quarter':
					startDate.setMonth(now.getMonth() - 3);
					break;
				case 'year':
					startDate.setFullYear(now.getFullYear() - 1);
					break;
			}

			const result = await db
				.select()
				.from(transactions)
				.where(
					and(
						eq(transactions.userId, user.id),
						gte(transactions.transactionDate, startDate),
						lte(transactions.transactionDate, now),
					),
				);

			const balance = result.reduce((sum, t) => sum + Number(t.amount), 0);
			const expenses = result
				.filter((t) => Number(t.amount) < 0)
				.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
			const income = result
				.filter((t) => Number(t.amount) > 0)
				.reduce((sum, t) => sum + Number(t.amount), 0);

			return c.json({
				data: {
					balance,
					expenses,
					income,
					period,
					transactionsCount: result.length,
				},
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			secureLogger.error('Failed to get transaction statistics', {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'STATISTICS_ERROR',
					error: 'Failed to retrieve statistics',
				},
				500,
			);
		}
	},
);

/**
 * Create a new transaction
 */
transactionsRouter.post(
	'/',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 10,
		message: 'Too many transaction creation attempts, please try again later',
	}),
	zValidator('json', createTransactionSchema),
	async (c) => {
		const { user, db } = c.get('auth');
		const input = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			const now = new Date();

			const [newTransaction] = await db
				.insert(transactions)
				.values({
					userId: user.id,
					amount: input.amount.toString(),
					description: input.description,
					transactionType: input.transactionType,
					status: input.status,
					transactionDate: input.transactionDate ? new Date(input.transactionDate) : now,
					categoryId: input.categoryId,
					accountId: input.accountId,
					paymentMethod: input.paymentMethod,
					merchantName: input.merchantName,
					notes: input.notes,
					tags: input.tags,
					isManualEntry: true,
				})
				.returning();

			secureLogger.info('Transaction created', {
				amount: input.amount,
				requestId,
				transactionId: newTransaction.id,
				type: input.transactionType,
				userId: user.id,
			});

			return c.json(
				{
					data: newTransaction,
					meta: {
						createdAt: new Date().toISOString(),
						requestId,
					},
				},
				201,
			);
		} catch (error) {
			secureLogger.error('Failed to create transaction', {
				amount: input.amount,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				type: input.transactionType,
				userId: user.id,
			});

			return c.json(
				{
					code: 'TRANSACTION_CREATE_ERROR',
					error: 'Failed to create transaction',
				},
				500,
			);
		}
	},
);

/**
 * Update an existing transaction
 */
transactionsRouter.put(
	'/:id',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 30,
		message: 'Too many update attempts, please try again later',
	}),
	zValidator('json', createTransactionSchema.partial()),
	async (c) => {
		const { user, db } = c.get('auth');
		const transactionId = c.req.param('id');
		const input = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			// Verify ownership
			const [existing] = await db
				.select({ id: transactions.id })
				.from(transactions)
				.where(and(eq(transactions.id, transactionId), eq(transactions.userId, user.id)))
				.limit(1);

			if (!existing) {
				return c.json(
					{
						code: 'NOT_FOUND',
						error: 'Transação não encontrada',
					},
					404,
				);
			}

			// Build update object
			const updateData: Record<string, unknown> = {
				updatedAt: new Date(),
			};

			if (input.description !== undefined) updateData.description = input.description;
			if (input.amount !== undefined) updateData.amount = input.amount.toString();
			if (input.transactionType !== undefined) updateData.transactionType = input.transactionType;
			if (input.status !== undefined) updateData.status = input.status;
			if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
			if (input.accountId !== undefined) updateData.accountId = input.accountId;
			if (input.paymentMethod !== undefined) updateData.paymentMethod = input.paymentMethod;
			if (input.merchantName !== undefined) updateData.merchantName = input.merchantName;
			if (input.notes !== undefined) updateData.notes = input.notes;
			if (input.tags !== undefined) updateData.tags = input.tags;

			const [updatedTransaction] = await db
				.update(transactions)
				.set(updateData)
				.where(and(eq(transactions.id, transactionId), eq(transactions.userId, user.id)))
				.returning();

			secureLogger.info('Transaction updated', {
				requestId,
				transactionId,
				userId: user.id,
			});

			return c.json({
				data: updatedTransaction,
				meta: {
					updatedAt: new Date().toISOString(),
					requestId,
				},
			});
		} catch (error) {
			secureLogger.error('Failed to update transaction', {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				transactionId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'TRANSACTION_UPDATE_ERROR',
					error: 'Failed to update transaction',
				},
				500,
			);
		}
	},
);

/**
 * Delete a transaction
 */
transactionsRouter.delete(
	'/:id',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 20,
		message: 'Too many deletion attempts, please try again later',
	}),
	async (c) => {
		const { user, db } = c.get('auth');
		const transactionId = c.req.param('id');
		const requestId = c.get('requestId');

		try {
			const deleted = await db
				.delete(transactions)
				.where(and(eq(transactions.id, transactionId), eq(transactions.userId, user.id)))
				.returning();

			if (deleted.length === 0) {
				return c.json(
					{
						code: 'NOT_FOUND',
						error: 'Transação não encontrada ou permissão negada',
					},
					404,
				);
			}

			secureLogger.info('Transaction deleted', {
				requestId,
				transactionId,
				userId: user.id,
			});

			return c.json({
				data: { success: true },
				meta: {
					deletedAt: new Date().toISOString(),
					requestId,
				},
			});
		} catch (error) {
			secureLogger.error('Failed to delete transaction', {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				transactionId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'TRANSACTION_DELETE_ERROR',
					error: 'Failed to delete transaction',
				},
				500,
			);
		}
	},
);

export default transactionsRouter;
