import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { secureLogger } from '@/lib/logging/secure-logger';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';

/**
 * Consolidated routers combining auth, users, and transactions
 * Single source of truth for core functionality
 */

const authRouter = createTRPCRouter({
  // Get current session
  getSession: publicProcedure.query(({ ctx }) => {
    return {
      user: ctx.session?.user ?? null,
      session: ctx.session,
    };
  }),

  // Sign out
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.supabase.auth.signOut();
    return { success: true };
  }),
});

const usersRouter = createTRPCRouter({
  // Get current user profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
    }

    const { data, error } = await ctx.supabase.from('users').select('*').eq('id', userId).single();

    if (error) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User profile not found',
      });
    }

    return data;
  }),

  // Update user profile
  update: protectedProcedure
    .input(
      z.object({
        full_name: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const { data, error } = await ctx.supabase
        .from('users')
        .update(input)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        });
      }

      return data;
    }),

  // Update user preferences
  updatePreferences: protectedProcedure
    .input(z.record(z.string(), z.unknown()))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // Upsert preferences
      const { data, error } = await ctx.supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...input,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update preferences',
        });
      }

      return data;
    }),

  // Update last login
  updateLastLogin: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
    }

    const { error } = await ctx.supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      secureLogger.warn('Failed to update last login', { error: error.message });
      // Don't throw error for this non-critical operation
    }

    return { success: true };
  }),

  // Check user status
  checkUserStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      return { is_active: false, last_login: null };
    }

    const { data, error } = await ctx.supabase
      .from('users')
      .select('is_active, last_login')
      .eq('id', userId)
      .single();

    if (error) {
      return { is_active: false, last_login: null };
    }

    return data;
  }),

  // Get financial summary
  getFinancialSummary: protectedProcedure
    .input(
      z.object({
        period_start: z.string(),
        period_end: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // Calculate summary from financial_events
      const { data: events, error } = await ctx.supabase
        .from('financial_events')
        .select('amount, event_type')
        .eq('user_id', userId)
        .gte('created_at', input.period_start)
        .lte('created_at', input.period_end);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch financial summary',
        });
      }

      interface FinancialSummary {
        income: number;
        expenses: number;
        balance: number;
      }

      const summary = (events || []).reduce<FinancialSummary>(
        (acc, event) => {
          const eventType = event.event_type?.toLowerCase() ?? '';
          if (['expense', 'debit', 'pix', 'boleto'].includes(eventType)) {
            acc.expenses += event.amount ?? 0;
            acc.balance -= event.amount ?? 0;
          } else if (['income', 'credit', 'transfer'].includes(eventType)) {
            acc.income += event.amount ?? 0;
            acc.balance += event.amount ?? 0;
          }
          return acc;
        },
        { income: 0, expenses: 0, balance: 0 }
      );

      return summary;
    }),
});

const transactionsRouter = createTRPCRouter({
  // List user financial events (transactions)
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const { data, error } = await ctx.supabase
        .from('financial_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch transactions',
        });
      }

      return data ?? [];
    }),

  // Create a new financial event (transaction)
  create: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        category_id: z.string().optional(),
        description: z.string().optional(),
        account_id: z.string(),
        event_type: z.string(),
        status: z.string().default('pending'),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const { data, error } = await ctx.supabase
        .from('financial_events')
        .insert({
          ...input,
          user_id: userId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create transaction',
        });
      }

      return data;
    }),

  // Delete a financial event (transaction)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const { error } = await ctx.supabase
        .from('financial_events')
        .delete()
        .eq('id', input.id)
        .eq('user_id', userId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete transaction',
        });
      }

      return { success: true };
    }),

  // Get transaction statistics
  getStatistics: protectedProcedure
    .input(
      z.object({
        period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
        accountId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // Calculate date range based on period
      const now = new Date();
      const startDate = new Date();

      switch (input.period) {
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

      // Build query for financial events
      let query = ctx.supabase
        .from('financial_events')
        .select('amount, event_type, status')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString());

      if (input.accountId) {
        query = query.eq('account_id', input.accountId);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch statistics',
        });
      }

      // Calculate statistics
      const events = data || [];
      let balance = 0;
      let expenses = 0;
      let income = 0;

      for (const event of events) {
        const amount = event.amount ?? 0;
        const eventType = event.event_type?.toLowerCase() ?? '';

        if (['expense', 'debit', 'pix', 'boleto'].includes(eventType)) {
          expenses += amount;
          balance -= amount;
        } else if (['income', 'credit', 'transfer'].includes(eventType)) {
          income += amount;
          balance += amount;
        }
      }

      return {
        balance,
        expenses,
        income,
        period: input.period,
        transactionsCount: events.length,
      };
    }),
});

export const consolidatedRouters = {
  auth: authRouter,
  users: usersRouter,
  transactions: transactionsRouter,
};
