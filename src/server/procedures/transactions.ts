import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { Context } from '@/server/context';

export const createTransactionRouter = (t: any) => ({
  /**
   * Get all transactions for user
   */
  getAll: t.procedure.query(async ({ ctx }: { ctx: Context }) => {
    if (!ctx.session?.user) {
      return [];
    }

    const { data, error } = await ctx.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      });
    }

    return data || [];
  }),

  /**
   * Create new transaction
   */
  create: t.procedure
    .input(
      z.object({
        description: z.string().min(1),
        amount: z.number(),
        category: z.string(),
        date: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: Context; input: any }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
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
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      return data;
    }),

  /**
   * Delete transaction
   */
  delete: t.procedure
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
  getSummary: t.procedure.query(async ({ ctx }: { ctx: Context }) => {
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
