import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { logError, logOperation } from '@/server/lib/logger';
import { protectedProcedure, router } from '@/server/trpc-helpers';

/**
 * Transactions Router - Gerenciamento de transações financeiras
 */
export const transactionsRouter = router({
  // Listar transações com paginação e filtros
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().default(0),
        categoryId: z.string().uuid().optional(),
        accountId: z.string().uuid().optional(),
        type: z.enum(['debit', 'credit', 'transfer', 'pix', 'boleto']).optional(),
        status: z.enum(['pending', 'posted', 'failed', 'cancelled']).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        let query = supabase
          .from('transactions')
          .select(`
            *,
            bank_accounts(id, institution_name, account_mask),
            transaction_categories(id, name, color)
          `)
          .eq('user_id', ctx.user.id);

        // Aplicar filtros
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
          query = query.or(
            `description.ilike.%${input.search}%,merchant_name.ilike.%${input.search}%`
          );
        }

        const { data, error, count } = await query
          .order('transaction_date', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);

        if (error) {
          logError('fetch_transactions', ctx.user.id, error, {
            resource: 'transactions',
            operation: 'getAll',
            limit: input.limit,
            offset: input.offset,
            categoryId: input.categoryId,
            accountId: input.accountId,
            type: input.type,
            status: input.status,
            startDate: input.startDate,
            endDate: input.endDate,
            search: input.search,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar transações',
          });
        }

        logOperation('fetch_transactions_success', ctx.user.id, 'transactions', undefined, {
          resultsCount: data?.length || 0,
          total: count || 0,
          hasMore: (count || 0) > input.offset + input.limit,
          filters: {
            categoryId: input.categoryId,
            accountId: input.accountId,
            type: input.type,
            status: input.status,
            search: input.search,
          },
        });

        return {
          transactions: data || [],
          total: count || 0,
          hasMore: (count || 0) > input.offset + input.limit,
        };
      } catch (error) {
        logError('fetch_transactions_unexpected', ctx.user.id, error as Error, {
          resource: 'transactions',
          operation: 'getAll',
          limit: input.limit,
          offset: input.offset,
          categoryId: input.categoryId,
          accountId: input.accountId,
          type: input.type,
          status: input.status,
          startDate: input.startDate,
          endDate: input.endDate,
          search: input.search,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar transações',
        });
      }
    }),

  // Obter transação específica
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            bank_accounts(id, institution_name, account_mask),
            transaction_categories(id, name, color)
          `)
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            logOperation('fetch_transaction_not_found', ctx.user.id, 'transactions', input.id, {
              reason: 'transaction_not_found',
            });
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Transação não encontrada',
            });
          }
          logError('fetch_transaction_by_id', ctx.user.id, error, {
            resource: 'transactions',
            operation: 'getById',
            transactionId: input.id,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar transação',
          });
        }

        return data;
      } catch (error) {
        logError('fetch_transaction_by_id_unexpected', ctx.user.id, error as Error, {
          resource: 'transactions',
          operation: 'getById',
          transactionId: input.id,
        });
        throw error;
      }
    }),

  // Criar nova transação
  create: protectedProcedure
    .input(
      z.object({
        accountId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        amount: z.number(),
        description: z.string().min(1, 'Descrição é obrigatória'),
        merchant_name: z.string().optional(),
        transaction_date: z.string(),
        transaction_type: z.enum(['debit', 'credit', 'transfer', 'pix', 'boleto']),
        payment_method: z.string().optional(),
        status: z.enum(['pending', 'posted', 'failed', 'cancelled']).default('posted'),
        is_recurring: z.boolean().default(false),
        recurring_rule: z.string().optional(),
        tags: z.array(z.string()).default([]),
        notes: z.string().optional(),
        attachments: z.array(z.string()).default([]),
        is_manual_entry: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            ...input,
            user_id: ctx.user.id,
            currency: 'BRL',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select(`
            *,
            bank_accounts(id, institution_name, account_mask),
            transaction_categories(id, name, color)
          `)
          .single();

        if (error) {
          logError('create_transaction', ctx.user.id, error, {
            resource: 'transactions',
            operation: 'create',
            amount: input.amount,
            type: input.transaction_type,
            description: input.description,
            merchantName: input.merchant_name,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao criar transação',
          });
        }

        logOperation('create_transaction_success', ctx.user.id, 'transactions', data?.id, {
          amount: input.amount,
          type: input.transaction_type,
          description: input.description,
          merchantName: input.merchant_name,
          status: input.status,
          isManualEntry: input.is_manual_entry,
        });

        return data;
      } catch (error) {
        logError('create_transaction_unexpected', ctx.user.id, error as Error, {
          resource: 'transactions',
          operation: 'create',
          amount: input.amount,
          type: input.transaction_type,
          description: input.description,
          merchantName: input.merchant_name,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar transação',
        });
      }
    }),

  // Atualizar transação
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        categoryId: z.string().uuid().optional(),
        amount: z.number().optional(),
        description: z.string().optional(),
        merchant_name: z.string().optional(),
        transaction_date: z.string().optional(),
        payment_method: z.string().optional(),
        status: z.enum(['pending', 'posted', 'failed', 'cancelled']).optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        is_categorized: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;

        const { data, error } = await supabase
          .from('transactions')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', ctx.user.id)
          .select(`
            *,
            bank_accounts(id, institution_name, account_mask),
            transaction_categories(id, name, color)
          `)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            logOperation('update_transaction_not_found', ctx.user.id, 'transactions', input.id, {
              reason: 'transaction_not_found',
            });
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Transação não encontrada',
            });
          }
          logError('update_transaction', ctx.user.id, error, {
            resource: 'transactions',
            operation: 'update',
            transactionId: input.id,
            updateFields: Object.keys(input).filter((k) => k !== 'id'),
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar transação',
          });
        }

        logOperation('update_transaction_success', ctx.user.id, 'transactions', input.id, {
          updateFields: Object.keys(input).filter((k) => k !== 'id'),
        });

        return data;
      } catch (error) {
        logError('update_transaction_unexpected', ctx.user.id, error as Error, {
          resource: 'transactions',
          operation: 'update',
          transactionId: input.id,
          updateFields: Object.keys(input).filter((k) => k !== 'id'),
        });
        throw error;
      }
    }),

  // Deletar transação
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            logOperation('delete_transaction_not_found', ctx.user.id, 'transactions', input.id, {
              reason: 'transaction_not_found',
            });
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Transação não encontrada',
            });
          }
          logError('delete_transaction', ctx.user.id, error, {
            resource: 'transactions',
            operation: 'delete',
            transactionId: input.id,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao deletar transação',
          });
        }

        logOperation('delete_transaction_success', ctx.user.id, 'transactions', input.id, {
          deletedTransactionId: input.id,
        });

        return data;
      } catch (error) {
        logError('delete_transaction_unexpected', ctx.user.id, error as Error, {
          resource: 'transactions',
          operation: 'delete',
          transactionId: input.id,
        });
        throw error;
      }
    }),

  // Obter estatísticas de transações
  getStats: protectedProcedure
    .input(
      z.object({
        period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
        categoryId: z.string().uuid().optional(),
        accountId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Calcular data de início
        const now = new Date();
        const startDate = new Date();

        switch (input.period) {
          case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(now.getDate() - 90);
            break;
          case '1y':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        let query = supabase
          .from('transactions')
          .select('amount, transaction_type, transaction_date')
          .eq('user_id', ctx.user.id)
          .eq('status', 'posted')
          .gte('transaction_date', startDate.toISOString());

        if (input.categoryId) {
          query = query.eq('category_id', input.categoryId);
        }
        if (input.accountId) {
          query = query.eq('account_id', input.accountId);
        }

        const { data, error } = await query;

        if (error) {
          logError('fetch_transaction_stats', ctx.user.id, error, {
            resource: 'transactions',
            operation: 'getStats',
            period: input.period,
            categoryId: input.categoryId,
            accountId: input.accountId,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar estatísticas de transações',
          });
        }

        const transactions = data || [];

        // Calcular estatísticas
        const income = transactions
          .filter((t) => t.amount > 0)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = transactions
          .filter((t) => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

        const totalTransactions = transactions.length;
        const averageTransaction =
          totalTransactions > 0
            ? transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) /
              totalTransactions
            : 0;

        const largestTransaction =
          transactions.length > 0
            ? Math.max(...transactions.map((t) => Math.abs(Number(t.amount))))
            : 0;

        return {
          income,
          expenses,
          netBalance: income - expenses,
          totalTransactions,
          averageTransaction,
          largestTransaction,
          period: input.period,
        };
      } catch (error) {
        logError('fetch_transaction_stats_unexpected', ctx.user.id, error as Error, {
          resource: 'transactions',
          operation: 'getStats',
          period: input.period,
          categoryId: input.categoryId,
          accountId: input.accountId,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar estatísticas de transações',
        });
      }
    }),

  // Obter transações por categoria
  getByCategory: protectedProcedure
    .input(
      z.object({
        period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Calcular data de início
        const now = new Date();
        const startDate = new Date();

        switch (input.period) {
          case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(now.getDate() - 90);
            break;
          case '1y':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        const { data, error } = await supabase
          .from('transactions')
          .select(`
            amount,
            transaction_categories!inner(id, name, color)
          `)
          .eq('user_id', ctx.user.id)
          .eq('status', 'posted')
          .gte('transaction_date', startDate.toISOString())
          .not('category_id', 'is', null);

        if (error) {
          logError('fetch_transactions_by_category', ctx.user.id, error, {
            resource: 'transactions',
            operation: 'getByCategory',
            period: input.period,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar transações por categoria',
          });
        }

        // Agrupar por categoria
        const categoryStats = (data || []).reduce(
          (acc, transaction) => {
            const category = transaction.transaction_categories;
            if (!category) return acc;

            if (!acc[category.id]) {
              acc[category.id] = {
                id: category.id,
                name: category.name,
                color: category.color,
                totalAmount: 0,
                transactionCount: 0,
                income: 0,
                expenses: 0,
              };
            }

            const amount = Number(transaction.amount);
            acc[category.id].totalAmount += amount;
            acc[category.id].transactionCount += 1;

            if (amount > 0) {
              acc[category.id].income += amount;
            } else {
              acc[category.id].expenses += Math.abs(amount);
            }

            return acc;
          },
          {} as Record<string, any>
        );

        return Object.values(categoryStats);
      } catch (error) {
        logError('fetch_transactions_by_category_unexpected', ctx.user.id, error as Error, {
          resource: 'transactions',
          operation: 'getByCategory',
          period: input.period,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar transações por categoria',
        });
      }
    }),
});
