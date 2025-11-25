import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { protectedProcedure, publicProcedure, router } from '@/server/trpc-helpers';

/**
 * Calendar router for financial event management
 */
export const calendarRouter = router({
  // Health check
  health: publicProcedure.query(() => ({
    status: 'ok',
    module: 'calendar',
    timestamp: new Date().toISOString(),
  })),

  // Search events
  searchEvents: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        categoryId: z.string().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        limit: z.number().min(1).max(100).default(20),
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
        .ilike('title', `%${input.query}%`)
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search events',
        });
      }

      return data || [];
    }),

  // Search transactions
  searchTransactions: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        accountId: z.string().optional(),
        categoryId: z.string().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const { data, error } = await ctx.supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .ilike('description', `%${input.query}%`)
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search transactions',
        });
      }

      return data || [];
    }),
});
