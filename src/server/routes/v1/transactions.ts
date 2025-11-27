/**
 * Transactions API - Hono RPC Implementation
 * Handles transaction CRUD operations and statistics
 * Refactored to use Supabase directly (KISS/YAGNI)
 */

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { supabase } from '@/integrations/supabase/client';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import {
	authMiddleware,
	userRateLimitMiddleware,
} from '@/server/middleware/auth';

// =====================================================
// Validation Schemas
// =====================================================

const listTransactionsSchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(50),
	offset: z.coerce.number().int().min(0).default(0),
	categoryId: z.string().optional(),
	accountId: z.string().optional(),
	type: z.enum(['transfer', 'debit', 'credit', 'expense', 'income']).optional(),
	status: z
		.enum(['cancelled', 'failed', 'pending', 'posted', 'completed'])
		.optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	search: z.string().optional(),
});

const createTransactionSchema = z.object({
	amount: z.number(),
	categoryId: z.string().optional(),
	description: z.string().optional(),
	title: z.string().optional(),
	type: z.enum(['transfer', 'debit', 'credit', 'expense', 'income']),
	status: z
		.enum(['cancelled', 'failed', 'pending', 'posted', 'completed'])
		.default('pending'),
	metadata: z.record(z.string(), z.unknown()).optional(),
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
		const { user } = c.get('auth');
		const filters = c.req.valid('query');
		const requestId = c.get('requestId');

		try {
			let query = supabase
				.from('financial_events')
				.select('*')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false })
				.range(filters.offset, filters.offset + filters.limit - 1);

			if (filters.categoryId) {
				query = query.eq('category', filters.categoryId);
			}

			if (filters.type) {
				query = query.eq('event_type', filters.type);
			}

			if (filters.status) {
				query = query.eq('status', filters.status);
			}

			if (filters.startDate) {
				query = query.gte('created_at', filters.startDate);
			}

			if (filters.endDate) {
				query = query.lte('created_at', filters.endDate);
			}

			if (filters.search) {
				query = query.ilike('description', `%${filters.search}%`);
			}

			const { data, error } = await query;

			if (error) throw error;

			return c.json({
				data: data || [],
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
					total: data?.length || 0,
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
		const { user } = c.get('auth');
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

			const { data: transactions, error } = await supabase
				.from('financial_events')
				.select('amount, event_type, status, is_income')
				.eq('user_id', user.id)
				.gte('created_at', startDate.toISOString())
				.lte('created_at', now.toISOString());

			if (error) throw error;

			const balance = (transactions || []).reduce(
				(sum, t) => sum + Number(t.amount),
				0,
			);
			const expenses = (transactions || [])
				.filter((t) => !t.is_income)
				.reduce((sum, t) => sum + Number(t.amount), 0);
			const income = (transactions || [])
				.filter((t) => t.is_income)
				.reduce((sum, t) => sum + Number(t.amount), 0);

			return c.json({
				data: {
					balance,
					expenses,
					income,
					period,
					transactionsCount: transactions?.length || 0,
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
		const { user } = c.get('auth');
		const input = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			const now = new Date().toISOString();

			const { data: newTransaction, error } = await supabase
				.from('financial_events')
				.insert({
					user_id: user.id,
					title:
						input.title || input.description || `Transaction ${input.type}`,
					amount: input.amount,
					event_type: input.type,
					status: input.status,
					start_date: now,
					end_date: now,
					description: input.description,
					category: input.categoryId,
					is_income: input.type === 'income' || input.type === 'credit',
					metadata: input.metadata as any,
				})
				.select()
				.single();

			if (error) throw error;

			secureLogger.info('Transaction created', {
				amount: input.amount,
				requestId,
				transactionId: newTransaction.id,
				type: input.type,
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
				type: input.type,
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
		const { user } = c.get('auth');
		const transactionId = c.req.param('id');
		const input = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			// Verify ownership
			const { data: existing, error: fetchError } = await supabase
				.from('financial_events')
				.select('id')
				.eq('id', transactionId)
				.eq('user_id', user.id)
				.single();

			if (fetchError || !existing) {
				return c.json(
					{
						code: 'NOT_FOUND',
						error: 'Transação não encontrada',
					},
					404,
				);
			}

			const updateData: Record<string, unknown> = {
				updated_at: new Date().toISOString(),
			};

			if (input.title) updateData.title = input.title;
			if (input.amount !== undefined) updateData.amount = input.amount;
			if (input.type) {
				updateData.event_type = input.type;
				updateData.is_income =
					input.type === 'income' || input.type === 'credit';
			}
			if (input.status) updateData.status = input.status;
			if (input.description !== undefined)
				updateData.description = input.description;
			if (input.categoryId) updateData.category = input.categoryId;

			// Handle metadata updates if needed
			if (input.metadata) updateData.metadata = input.metadata;

			const { data: updatedTransaction, error } = await supabase
				.from('financial_events')
				.update(updateData)
				.eq('id', transactionId)
				.eq('user_id', user.id)
				.select()
				.single();

			if (error) throw error;

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
		const { user } = c.get('auth');
		const transactionId = c.req.param('id');
		const requestId = c.get('requestId');

		try {
			const { data: deleted, error } = await supabase
				.from('financial_events')
				.delete()
				.eq('id', transactionId)
				.eq('user_id', user.id)
				.select();

			if (error) throw error;

			if (!deleted || deleted.length === 0) {
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
