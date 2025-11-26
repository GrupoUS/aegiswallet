/**
 * Transactions API - Hono RPC Implementation
 * Handles transaction CRUD operations and statistics
 */

import { zValidator } from '@hono/zod-validator';
import { and, desc, eq, gte, ilike, lte } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '@/db';
import { financialEvents } from '@/db/schema/transactions';
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
  description: z.string().optional(),
  fromAccountId: z.string(),
  toAccountId: z.string().optional(),
  type: z.enum(['transfer', 'debit', 'credit', 'pix', 'boleto']),
  status: z.enum(['cancelled', 'failed', 'pending', 'posted']).default('pending'),
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
      const conditions = [eq(financialEvents.userId, user.id)];

      if (filters.categoryId) {
        conditions.push(eq(financialEvents.category, filters.categoryId));
      }

      if (filters.accountId) {
        // Note: Using sql for account_id as it might be missing from Drizzle schema but present in DB
        // conditions.push(sql`account_id = ${filters.accountId}`);
      }

      if (filters.type) {
        conditions.push(eq(financialEvents.eventType, filters.type));
      }

      if (filters.status) {
        conditions.push(eq(financialEvents.status, filters.status));
      }

      if (filters.startDate) {
        conditions.push(gte(financialEvents.createdAt, new Date(filters.startDate)));
      }

      if (filters.endDate) {
        conditions.push(lte(financialEvents.createdAt, new Date(filters.endDate)));
      }

      if (filters.search) {
        conditions.push(ilike(financialEvents.description, `%${filters.search}%`));
      }

      const data = await db
        .select()
        .from(financialEvents)
        .where(and(...conditions))
        .orderBy(desc(financialEvents.createdAt))
        .limit(filters.limit)
        .offset(filters.offset);

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
        500
      );
    }
  }
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
    const { period, accountId } = c.req.valid('query');
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

      const conditions = [
        eq(financialEvents.userId, user.id),
        gte(financialEvents.createdAt, startDate),
        lte(financialEvents.createdAt, now),
      ];

      if (accountId) {
        // conditions.push(sql`account_id = ${accountId}`);
      }

      const transactions = await db
        .select({
          amount: financialEvents.amount,
          eventType: financialEvents.eventType,
          status: financialEvents.status,
          isIncome: financialEvents.isIncome,
        })
        .from(financialEvents)
        .where(and(...conditions));

      const balance = transactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const expenses = transactions
        .filter((t: any) => ['debit', 'pix', 'boleto'].includes(t.eventType))
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const income = transactions
        .filter((t: any) => ['credit', 'transfer'].includes(t.eventType))
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      return c.json({
        data: {
          balance,
          expenses,
          income,
          period,
          transactionsCount: transactions.length,
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
        500
      );
    }
  }
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
      const now = new Date();

      const [newTransaction] = await db
        .insert(financialEvents)
        .values({
          userId: user.id,
          title: input.description || `Transaction ${input.type}`,
          amount: input.amount.toString(),
          eventType: input.type,
          status: input.status,
          startDate: now,
          endDate: now,
          createdAt: now,
          description: input.description,
          metadata: input.metadata,
          category: input.categoryId,
        })
        .returning();

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
        201
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
        500
      );
    }
  }
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
      const deleted = await db
        .delete(financialEvents)
        .where(and(eq(financialEvents.id, transactionId), eq(financialEvents.userId, user.id)))
        .returning();

      if (!deleted.length) {
        throw new Error('Transação não encontrada ou permissão negada');
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
        500
      );
    }
  }
);

export default transactionsRouter;
