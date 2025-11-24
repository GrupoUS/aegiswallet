/**
 * Consolidated Transactions Router
 * Combines functionality from procedures/transactions.ts and routers/transactions.ts
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { financialSchemas, validateTransactionForFraud } from '@/lib/security/financial-validator';
import { logError, logOperation, logSecurityEvent } from '@/server/lib/logger';
import { protectedProcedure, router } from '@/server/trpc-helpers';

const assertPositiveAmount = (amount: number) => {
  if (amount <= 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'O valor da transação deve ser positivo.',
    });
  }
};

const assertManualDateNotFuture = (transactionDate: string, isManualEntry: boolean | undefined) => {
  if (isManualEntry === false) {
    return;
  }

  const parsedDate = new Date(transactionDate);
  if (parsedDate.getTime() > Date.now()) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'A data da transação não pode estar no futuro.',
    });
  }
};

const assertAccountBelongsToUser = async ({
  supabase,
  userId,
  accountId,
}: {
  supabase: SupabaseClient;
  userId: string;
  accountId: string;
}) => {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      logError('validate_transaction_account_failed', userId, error, {
        accountId,
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao validar a conta bancária.',
      });
    }
  }

  if (!data) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Conta bancária inválida.',
    });
  }
};

const assertCategoryBelongsToUser = async ({
  supabase,
  userId,
  categoryId,
}: {
  supabase: SupabaseClient;
  userId: string;
  categoryId?: string | null;
}) => {
  if (!categoryId) {
    return;
  }

  const { data, error } = await supabase
    .from('financial_categories')
    .select('id')
    .eq('id', categoryId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      logError('validate_transaction_category_failed', userId, error, {
        categoryId,
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao validar a categoria.',
      });
    }
  }

  if (!data) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Categoria financeira inválida.',
    });
  }
};

export const transactionsRouter = router({
  /**
   * List transactions with pagination, advanced filtering, and full-text search.
   *
   * Supports filtering by account, category, date range, status, type, and description/notes.
   *
   * @returns Paginated result with `transactions`, `totalCount`, and `hasMore`.
   */
  getAll: protectedProcedure
    .input(
      z.object({
        accountId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        endDate: z.string().datetime().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().default(0),
        search: z.string().optional(),
        startDate: z.string().datetime().optional(),
        status: z.enum(['pending', 'posted', 'failed', 'cancelled']).optional(),
        type: z.enum(['debit', 'credit', 'transfer', 'pix', 'boleto']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user.id;
      try {
        let query = supabase
          .from('transactions')
          .select(`
            *,
            bank_accounts(id, institution_name, account_mask),
            financial_categories(id, name, color)
          `)
          .eq('user_id', userId);

        // Apply filters
        if (input.categoryId) {
          query = query.eq('category_id', input.categoryId);
        }
        if (input.accountId) {
          query = query.eq('account_id', input.accountId);
        }
        if (input.type) {
          query = query.eq('transaction_type', input.type);
        }
        if (input.status) {
          query = query.eq('status', input.status);
        }
        if (input.startDate) {
          query = query.gte('transaction_date', input.startDate);
        }
        if (input.endDate) {
          query = query.lte('transaction_date', input.endDate);
        }
        if (input.search) {
          query = query.or(`description.ilike.%${input.search}%,notes.ilike.%${input.search}%`);
        }

        // Apply pagination and ordering
        const { data, error, count } = await query
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);

        if (error) {
          logError('fetch_transactions', userId, error, {
            filters: input,
            operation: 'getAll',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar transações',
          });
        }

        logOperation('fetch_transactions_success', userId, 'transactions', null, {
          count: data?.length || 0,
          filters: input,
        });

        return {
          hasMore: input.offset + input.limit < (count || 0),
          totalCount: count || 0,
          transactions: data || [],
        };
      } catch (error) {
        logError('fetch_transactions_unexpected', userId, error as Error, {
          input,
          operation: 'getAll',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar transações',
        });
      }
    }),

  /**
   * Fetch a single transaction with related bank account, category, and tags.
   *
   * @param input Transaction ID.
   * @returns Transaction record with nested relations.
   * @throws {TRPCError} NOT_FOUND when transaction doesn't belong to the user.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user.id;
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            bank_accounts(*),
            transaction_categories(*),
            transaction_tags(*)
          `)
          .eq('id', input.id)
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Transação não encontrada',
            });
          }
          logError('fetch_transaction', userId, error, {
            operation: 'getById',
            transactionId: input.id,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar transação',
          });
        }

        logOperation('fetch_transaction_success', userId, 'transactions', input.id, {
          amount: data.amount,
          type: data.transaction_type,
        });

        return data;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logError('fetch_transaction_unexpected', userId, error as Error, {
          operation: 'getById',
          transactionId: input.id,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar transação',
        });
      }
    }),

  /**
   * Create a transaction after validating ownership, amount, date, and fraud heuristics.
   *
   * Security:
   * - Validates bank account + category ownership.
   * - Blocks future-dated manual entries and non-positive amounts.
   * - Runs `validateTransactionForFraud` and logs triggered rules.
   */
  create: protectedProcedure
    .input(financialSchemas.transaction)
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user.id;
      try {
        assertPositiveAmount(input.amount);
        assertManualDateNotFuture(input.transaction_date, input.is_manual_entry);
        await assertAccountBelongsToUser({
          accountId: input.account_id,
          supabase,
          userId,
        });
        await assertCategoryBelongsToUser({
          categoryId: input.category_id,
          supabase,
          userId,
        });

        // Get user's recent transactions for fraud detection
        const { data: recentTransactions } = await supabase
          .from('transactions')
          .select('amount, created_at, transaction_type')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        // Validate transaction for fraud
        const fraudValidation = validateTransactionForFraud({
          amount: input.amount,
          description: input.description,
          userId,
          previousTransactions: (recentTransactions || []).map((tx) => ({
            amount: Number(tx.amount),
            timestamp: new Date(tx.created_at).getTime(),
          })),
        });

        if (!fraudValidation.isValid) {
          logSecurityEvent('suspicious_transaction_blocked', userId, {
            accountId: input.account_id,
            amount: input.amount,
            categoryId: input.category_id ?? null,
            isManualEntry: input.is_manual_entry ?? true,
            rulesTriggered: fraudValidation.warnings,
            riskLevel: fraudValidation.riskLevel,
            transactionType: input.transaction_type,
          });

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Transação bloqueada por segurança: ${fraudValidation.warnings.join(', ')}`,
          });
        }

        // Create transaction
        const transactionRecord = {
          account_id: input.account_id,
          amount: input.amount,
          category_id: input.category_id ?? null,
          description: input.description,
          transaction_date: new Date(input.transaction_date).toISOString(),
          transaction_type: input.transaction_type,
          status: input.status ?? 'posted',
          merchant_name: input.merchant_name ?? null,
          notes: input.notes ?? null,
          payment_method: input.payment_method ?? null,
          tags: input.tags ?? [],
          is_manual_entry: input.is_manual_entry ?? true,
          user_id: userId,
          currency: 'BRL',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('transactions')
          .insert(transactionRecord)
          .select()
          .single();

        if (error) {
          logError('create_transaction', userId, error, {
            operation: 'create',
            transaction: transactionRecord,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao criar transação',
          });
        }

        logOperation('create_transaction_success', userId, 'transactions', data.id, {
          amount: input.amount,
          category: input.category_id,
          type: input.transaction_type,
        });

        return data;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logError('create_transaction_unexpected', userId, error as Error, {
          operation: 'create',
          transaction: input,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar transação',
        });
      }
    }),

  /**
   * Update mutable transaction fields while preventing edits to posted entries.
   *
   * Only allows updates to description, notes, tags, amount, and category.
   */
  update: protectedProcedure
    .input(
      z.object({
        data: z.object({
          amount: z.number().optional(),
          category_id: z.string().uuid().optional(),
          description: z.string().optional(),
          notes: z.string().optional(),
          tags: z.array(z.string()).optional(),
        }),
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user.id;
      try {
        // Verify transaction belongs to user
        const { data: existing } = await supabase
          .from('transactions')
          .select('id, status, user_id')
          .eq('id', input.id)
          .eq('user_id', userId)
          .single();

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Transação não encontrada',
          });
        }

        // Prevent updates to posted transactions
        if (existing.status === 'posted') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Transações já postadas não podem ser alteradas',
          });
        }

        if (typeof input.data.amount === 'number') {
          assertPositiveAmount(input.data.amount);
        }

        if (input.data.category_id) {
          await assertCategoryBelongsToUser({
            categoryId: input.data.category_id,
            supabase,
            userId,
          });
        }

        const { data, error } = await supabase
          .from('transactions')
          .update({
            ...input.data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.id)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          logError('update_transaction', userId, error, {
            operation: 'update',
            transactionId: input.id,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar transação',
          });
        }

        logOperation('update_transaction_success', userId, 'transactions', input.id, {
          updatedFields: Object.keys(input.data),
        });

        return data;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logError('update_transaction_unexpected', userId, error as Error, {
          operation: 'update',
          transactionId: input.id,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar transação',
        });
      }
    }),

  /**
   * Delete a pending transaction owned by the current user.
   *
   * Posted transactions are immutable and cannot be deleted.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user.id;
      try {
        // Verify transaction belongs to user and is pending
        const { data: existing } = await supabase
          .from('transactions')
          .select('id, status, user_id, amount')
          .eq('id', input.id)
          .eq('user_id', userId)
          .single();

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Transação não encontrada',
          });
        }

        if (existing.status !== 'pending') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Apenas transações pendentes podem ser excluídas',
          });
        }

        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', input.id)
          .eq('user_id', userId);

        if (error) {
          logError('delete_transaction', userId, error, {
            operation: 'delete',
            transactionId: input.id,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao excluir transação',
          });
        }

        logOperation('delete_transaction_success', userId, 'transactions', input.id, {
          amount: existing.amount,
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logError('delete_transaction_unexpected', userId, error as Error, {
          operation: 'delete',
          transactionId: input.id,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao excluir transação',
        });
      }
    }),

  /**
   * Aggregate transaction statistics (income, expenses, balance) for a time window.
   *
   * @param input Period selector plus optional account filter.
   * @returns Summary metrics used by dashboards.
   */
  getStatistics: protectedProcedure
    .input(
      z.object({
        accountId: z.string().uuid().optional(),
        period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
      })
    )
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user.id;
      try {
        // Calculate date range based on period
        const endDate = new Date();
        const startDate = new Date();

        switch (input.period) {
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(startDate.getMonth() - 3);
            break;
          case 'year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        }

        let query = supabase
          .from('transactions')
          .select('amount, transaction_type, status, transaction_date')
          .eq('user_id', userId)
          .gte('transaction_date', startDate.toISOString())
          .lte('transaction_date', endDate.toISOString())
          .eq('status', 'posted');

        if (input.accountId) {
          query = query.eq('account_id', input.accountId);
        }

        const { data, error } = await query;

        if (error) {
          logError('fetch_transaction_statistics', userId, error, {
            operation: 'getStatistics',
            period: input.period,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar estatísticas',
          });
        }

        // Calculate statistics
        const transactions = data || [];
        const income = transactions
          .filter((t) => t.transaction_type === 'credit')
          .reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions
          .filter((t) => ['debit', 'pix'].includes(t.transaction_type))
          .reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expenses;

        const statistics = {
          averageTransaction:
            transactions.length > 0
              ? expenses /
                transactions.filter((t) => ['debit', 'pix'].includes(t.transaction_type)).length
              : 0,
          balance,
          endDate: endDate.toISOString(),
          expenses,
          income,
          period: input.period,
          startDate: startDate.toISOString(),
          transactionCount: transactions.length,
        };

        logOperation('fetch_transaction_statistics_success', userId, 'transactions', null, {
          balance,
          period: input.period,
          transactionCount: transactions.length,
        });

        return statistics;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logError('fetch_transaction_statistics_unexpected', userId, error as Error, {
          operation: 'getStatistics',
          period: input.period,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar estatísticas',
        });
      }
    }),
});
