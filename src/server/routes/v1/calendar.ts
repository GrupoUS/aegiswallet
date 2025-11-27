/**
 * Calendar API - Hono RPC Implementation
 * Handles calendar search for events and transactions
 */

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import {
	authMiddleware,
	userRateLimitMiddleware,
} from '@/server/middleware/auth';

const calendarRouter = new Hono<AppEnv>();

// =====================================================
// Validation Schemas
// =====================================================

const searchEventsSchema = z.object({
	categoryId: z.string().optional(),
	endDate: z.string().datetime().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	query: z.string().min(1, 'Query é obrigatória'),
	startDate: z.string().datetime().optional(),
});

const searchTransactionsSchema = z.object({
	accountId: z.string().optional(),
	categoryId: z.string().optional(),
	endDate: z.string().datetime().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	query: z.string().min(1, 'Query é obrigatória'),
	startDate: z.string().datetime().optional(),
});

// =====================================================
// Calendar Search Operations
// =====================================================

/**
 * Search financial events by title
 * GET /v1/calendar/events/search
 */
calendarRouter.get(
	'/events/search',
	authMiddleware,
	userRateLimitMiddleware({
		max: 30, // 30 requests per minute per user
		message: 'Muitas requisições, tente novamente mais tarde',
		windowMs: 60 * 1000, // 1 minute
	}),
	zValidator('query', searchEventsSchema),
	async (c) => {
		const { user, supabase } = c.get('auth');
		const input = c.req.valid('query');
		const requestId = c.get('requestId');

		try {
			let query = supabase
				.from('financial_events')
				.select('*')
				.eq('user_id', user.id)
				.ilike('title', `%${input.query}%`);

			// Apply optional filters
			if (input.categoryId) {
				query = query.eq('category', input.categoryId);
			}

			if (input.startDate) {
				query = query.gte('start_date', input.startDate);
			}

			if (input.endDate) {
				query = query.lte('end_date', input.endDate);
			}

			const { data, error } = await query
				.order('created_at', { ascending: false })
				.range(input.offset, input.offset + input.limit - 1);

			if (error) {
				throw new Error(`Erro ao buscar eventos: ${error.message}`);
			}

			secureLogger.info('Calendar events searched', {
				limit: input.limit,
				query: input.query,
				requestId,
				resultsCount: data?.length || 0,
				userId: user.id,
			});

			return c.json({
				data: data || [],
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			secureLogger.error('Failed to search calendar events', {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'CALENDAR_SEARCH_ERROR',
					error: 'Falha ao buscar eventos',
				},
				500,
			);
		}
	},
);

/**
 * Search transactions by description
 * GET /v1/calendar/transactions/search
 */
calendarRouter.get(
	'/transactions/search',
	authMiddleware,
	userRateLimitMiddleware({
		max: 30, // 30 requests per minute per user
		message: 'Muitas requisições, tente novamente mais tarde',
		windowMs: 60 * 1000, // 1 minute
	}),
	zValidator('query', searchTransactionsSchema),
	async (c) => {
		const { user, supabase } = c.get('auth');
		const input = c.req.valid('query');
		const requestId = c.get('requestId');

		try {
			let query = supabase
				.from('transactions')
				.select('*')
				.eq('user_id', user.id)
				.ilike('description', `%${input.query}%`);

			// Apply optional filters
			if (input.accountId) {
				query = query.eq('account_id', input.accountId);
			}

			if (input.categoryId) {
				query = query.eq('category_id', input.categoryId);
			}

			if (input.startDate) {
				query = query.gte('date', input.startDate);
			}

			if (input.endDate) {
				query = query.lte('date', input.endDate);
			}

			const { data, error } = await query
				.order('created_at', { ascending: false })
				.range(input.offset, input.offset + input.limit - 1);

			if (error) {
				throw new Error(`Erro ao buscar transações: ${error.message}`);
			}

			secureLogger.info('Calendar transactions searched', {
				limit: input.limit,
				query: input.query,
				requestId,
				resultsCount: data?.length || 0,
				userId: user.id,
			});

			return c.json({
				data: data || [],
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			secureLogger.error('Failed to search calendar transactions', {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'CALENDAR_SEARCH_ERROR',
					error: 'Falha ao buscar transações',
				},
				500,
			);
		}
	},
);

export default calendarRouter;
