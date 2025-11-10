import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { secureLogger } from '@/lib/logging/secure-logger';
import { financialSchemas, validateTransactionForFraud } from '@/lib/security/financial-validator';
import type { Context } from '@/server/context';
import { securityMiddleware, transactionRateLimit } from '@/server/middleware/securityMiddleware';

export const createTransactionRouter = (t: any) => ({
  /**
   * Get all transactions for user
   */
  getAll: t.procedure
    .use(securityMiddleware)
    .input(
      z
        .object({
          limit: z.number().min(1).max(1000).default(50),
          offset: z.number().min(0).default(0),
          category: z.string().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }: { ctx: Context; input?: any }) => {
      if (!ctx.session?.user) {
        return [];
      }

      // Build query with proper filtering
      let query = ctx.supabase
        .from('transactions')
        .select('id, description, amount, category, date, created_at, risk_level', {
          count: 'exact',
        })
        .eq('user_id', ctx.user.id);

      // Apply filters if provided
      if (input) {
        if (input.category) {
          query = query.eq('category', input.category);
        }
        if (input.dateFrom) {
          query = query.gte('date', input.dateFrom);
        }
        if (input.dateTo) {
          query = query.lte('date', input.dateTo);
        }

        // Apply pagination
        query = query
          .order('created_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);
      } else {
        query = query.order('created_at', { ascending: false }).limit(50);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      return {
        transactions: data || [],
        totalCount: count || 0,
        hasMore: input ? input.offset + input.limit < (count || 0) : false,
      };
    }),

  /**
   * Create new transaction
   */
  create: t.procedure
    .use(transactionRateLimit)
    .use(securityMiddleware)
    .input(financialSchemas.transaction)
    .mutation(async ({ ctx, input }: { ctx: Context; input: any }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        });
      }

      // Get user's recent transactions for fraud detection
      const { data: recentTransactions } = await ctx.supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Format previous transactions for fraud detection
      const previousTransactions = (recentTransactions || []).map((tx) => ({
        amount: tx.amount,
        timestamp: new Date(tx.created_at).getTime(),
      }));

      // Validate transaction for fraud patterns
      const fraudCheck = validateTransactionForFraud({
        amount: input.amount,
        description: input.description,
        userId: ctx.user.id,
        previousTransactions,
      });

      if (fraudCheck.blocked) {
        // Log fraud attempt using secure logger
        secureLogger.security('Fraud attempt blocked', {
          userId: ctx.user.id,
          amount: input.amount,
          riskLevel: fraudCheck.riskLevel,
          warnings: fraudCheck.warnings,
          component: 'transaction.create',
        });

        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Transaction blocked due to security concerns',
        });
      }

      // Log warnings for suspicious transactions
      if (fraudCheck.warnings.length > 0) {
        secureLogger.warn('Suspicious transaction detected', {
          userId: ctx.user.id,
          amount: input.amount,
          riskLevel: fraudCheck.riskLevel,
          warnings: fraudCheck.warnings,
          component: 'transaction.create',
        });
      }

      const { data, error } = await ctx.supabase
        .from('transactions')
        .insert({
          user_id: ctx.user.id,
          description: input.description,
          amount: input.amount,
          category: input.category,
          date: input.date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          // Add security metadata
          risk_level: fraudCheck.riskLevel,
          fraud_warnings: fraudCheck.warnings,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      // Log successful transaction for audit
      secureLogger.audit('Transaction created successfully', {
        userId: ctx.user.id,
        transactionId: data.id,
        amount: input.amount,
        category: input.category,
        riskLevel: fraudCheck.riskLevel,
        component: 'transaction.create',
      });

      return {
        ...data,
        riskLevel: fraudCheck.riskLevel,
        warnings: fraudCheck.warnings,
      };
    }),

  /**
   * Delete transaction
   */
  delete: t.procedure
    .use(transactionRateLimit)
    .use(securityMiddleware)
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: Context; input: any }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        });
      }

      const { error } = await ctx.supabase
        .from('transactions')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.user.id);

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      return { success: true };
    }),

  /**
   * Get summary statistics
   */
  getSummary: t.procedure.use(securityMiddleware).query(async ({ ctx }: { ctx: Context }) => {
    if (!ctx.session?.user) {
      return null;
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const { data, error } = await ctx.supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', ctx.user.id)
      .like('date', `${currentMonth}%`);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      });
    }

    const transactions = data || [];
    const income = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      income,
      expenses,
      balance: income - expenses,
      transactionCount: transactions.length,
    };
  }),
});
