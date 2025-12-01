/**
 * Calendar API - Hono RPC Implementation
 * Handles calendar search for events and transactions
 * Using Drizzle ORM with Neon serverless
 */

import { zValidator } from '@hono/zod-validator';
import { and, desc, eq, gte, ilike, lte } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { financialEvents, transactions } from '@/db/schema';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';

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
		max: 30,
		message: 'Muitas requisições, tente novamente mais tarde',
		windowMs: 60 * 1000,
	}),
	zValidator('query', searchEventsSchema),
	async (c) => {
		const { user, db } = c.get('auth');
		const input = c.req.valid('query');
		const requestId = c.get('requestId');

		try {
			// Build where conditions
			const conditions = [
				eq(financialEvents.userId, user.id),
				ilike(financialEvents.title, `%${input.query}%`),
			];

			if (input.categoryId) {
				conditions.push(eq(financialEvents.categoryId, input.categoryId));
			}

			if (input.startDate) {
				conditions.push(gte(financialEvents.startDate, new Date(input.startDate)));
			}

			if (input.endDate) {
				conditions.push(lte(financialEvents.endDate, new Date(input.endDate)));
			}

			const data = await db
				.select()
				.from(financialEvents)
				.where(and(...conditions))
				.orderBy(desc(financialEvents.createdAt))
				.limit(input.limit)
				.offset(input.offset);

			secureLogger.info('Calendar events searched', {
				limit: input.limit,
				query: input.query,
				requestId,
				resultsCount: data.length,
				userId: user.id,
			});

			return c.json({
				data,
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
		max: 30,
		message: 'Muitas requisições, tente novamente mais tarde',
		windowMs: 60 * 1000,
	}),
	zValidator('query', searchTransactionsSchema),
	async (c) => {
		const { user, db } = c.get('auth');
		const input = c.req.valid('query');
		const requestId = c.get('requestId');

		try {
			// Build where conditions
			const conditions = [
				eq(transactions.userId, user.id),
				ilike(transactions.description, `%${input.query}%`),
			];

			if (input.accountId) {
				conditions.push(eq(transactions.accountId, input.accountId));
			}

			if (input.categoryId) {
				conditions.push(eq(transactions.categoryId, input.categoryId));
			}

			if (input.startDate) {
				conditions.push(gte(transactions.transactionDate, new Date(input.startDate)));
			}

			if (input.endDate) {
				conditions.push(lte(transactions.transactionDate, new Date(input.endDate)));
			}

			const data = await db
				.select()
				.from(transactions)
				.where(and(...conditions))
				.orderBy(desc(transactions.createdAt))
				.limit(input.limit)
				.offset(input.offset);

			secureLogger.info('Calendar transactions searched', {
				limit: input.limit,
				query: input.query,
				requestId,
				resultsCount: data.length,
				userId: user.id,
			});

			return c.json({
				data,
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
