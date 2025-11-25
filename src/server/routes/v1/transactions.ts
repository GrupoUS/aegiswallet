/**
 * Transactions API - Hono RPC Implementation
 * Handles transaction CRUD operations and statistics
 */

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
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
    const { user, supabase } = c.get('auth');
    const filters = c.req.valid('query');
    const requestId = c.get('requestId');

    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(filters.offset, filters.offset + filters.limit - 1);

      // Apply optional filters
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
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
        query = query.or(`description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar transações: ${error.message}`);
      }

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
    const { user, supabase } = c.get('auth');
    const { period, accountId } = c.req.valid('query');
    const requestId = c.get('requestId');

    try {
      // Calculate date range based on period
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

      // Build query
      let query = supabase
        .from('transactions')
        .select('amount, type, status')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString());

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
      }

      // Calculate statistics
      const transactions = data || [];
      const balance = transactions.reduce((sum, t) => sum + t.amount, 0);
      const expenses = transactions
        .filter((t) => ['debit', 'pix', 'boleto'].includes(t.type))
        .reduce((sum, t) => sum + t.amount, 0);
      const income = transactions
        .filter((t) => ['credit', 'transfer'].includes(t.type))
        .reduce((sum, t) => sum + t.amount, 0);

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
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...input,
          user_id: user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar transação: ${error.message}`);
      }

      secureLogger.info('Transaction created', {
        amount: input.amount,
        requestId,
        transactionId: data.id,
        type: input.type,
        userId: user.id,
      });

      return c.json(
        {
          data,
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
    const { user, supabase } = c.get('auth');
    const transactionId = c.req.param('id');
    const requestId = c.get('requestId');

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Erro ao remover transação: ${error.message}`);
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

