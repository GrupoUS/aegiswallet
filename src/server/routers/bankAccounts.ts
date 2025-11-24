import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { protectedProcedure, router } from '@/server/trpc-helpers';

export const bankAccountsRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch bank accounts',
        cause: error,
      });
    }

    return data;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Bank account not found',
          cause: error,
        });
      }

      return data;
    }),

  create: protectedProcedure
    .input(
      z.object({
        institution_name: z.string(),
        account_type: z.string(),
        balance: z.number().default(0),
        currency: z.string().default('BRL'),
        is_primary: z.boolean().default(false),
        is_active: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate dummy values for required fields that are not in the form
      const dummyBelvoId = crypto.randomUUID();
      const dummyInstitutionId = crypto.randomUUID();
      const dummyAccountMask = `**** ${Math.floor(1000 + Math.random() * 9000)}`;

      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: ctx.user.id,
          institution_name: input.institution_name,
          account_type: input.account_type,
          balance: input.balance,
          currency: input.currency,
          is_primary: input.is_primary,
          is_active: input.is_active,
          belvo_account_id: dummyBelvoId,
          institution_id: dummyInstitutionId,
          account_mask: dummyAccountMask,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating bank account:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create bank account',
          cause: error,
        });
      }

      return data;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        institution_name: z.string().optional(),
        account_type: z.string().optional(),
        balance: z.number().optional(),
        currency: z.string().optional(),
        is_primary: z.boolean().optional(),
        is_active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update bank account',
          cause: error,
        });
      }

      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.user.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete bank account',
          cause: error,
        });
      }

      return { success: true };
    }),

  updateBalance: protectedProcedure
    .input(z.object({ id: z.string(), balance: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .update({ balance: input.balance })
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update balance',
          cause: error,
        });
      }

      return data;
    }),

  getTotalBalance: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('balance, currency')
      .eq('user_id', ctx.user.id)
      .eq('is_active', true);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch total balance',
        cause: error,
      });
    }

    const totals: Record<string, number> = {};
    if (data) {
      data.forEach((account) => {
        const currency = account.currency || 'BRL';
        totals[currency] = (totals[currency] || 0) + Number(account.balance);
      });
    }

    return totals;
  }),

  getBalanceHistory: protectedProcedure
    .input(z.object({ accountId: z.string(), days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      if (!input.accountId || input.accountId === 'all') {
          return [];
      }

      const { data: account } = await supabase
        .from('bank_accounts')
        .select('balance')
        .eq('id', input.accountId)
        .eq('user_id', ctx.user.id)
        .single();

      if (!account) return [];

      const currentBalance = Number(account.balance);
      const history = [];

      // Simple mock history: flat line
      for (let i = 0; i < input.days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          history.push({
              date: date.toISOString(),
              balance: currentBalance
          });
      }

      return history.reverse();
    }),
});
