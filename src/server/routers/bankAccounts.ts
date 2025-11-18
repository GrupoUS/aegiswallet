import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { logError, logOperation } from '@/server/lib/logger';
import { protectedProcedure, router } from '@/server/trpc-helpers';

/**
 * Bank Accounts Router - Gerenciamento de contas bancárias
 */
export const bankAccountsRouter = router({
  // Listar todas as contas do usuário
  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', ctx.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        logError('fetch_bank_accounts', ctx.user.id, error, {
          resource: 'bank_accounts',
          operation: 'getAll',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar contas bancárias',
        });
      }

      logOperation('fetch_bank_accounts_success', ctx.user.id, 'bank_accounts', undefined, {
        accountsCount: data?.length || 0,
      });

      return data || [];
    } catch (error) {
      logError('fetch_bank_accounts_unexpected', ctx.user.id, error as Error, {
        resource: 'bank_accounts',
        operation: 'getAll',
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar contas bancárias',
      });
    }
  }),

  // Obter conta específica
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            logOperation('fetch_bank_account_not_found', ctx.user.id, 'bank_accounts', input.id, {
              reason: 'account_not_found',
            });
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Conta bancária não encontrada',
            });
          }
          logError('fetch_bank_account_by_id', ctx.user.id, error, {
            resource: 'bank_accounts',
            operation: 'getById',
            accountId: input.id,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar conta bancária',
          });
        }

        return data;
      } catch (error) {
        logError('fetch_bank_account_by_id_unexpected', ctx.user.id, error as Error, {
          resource: 'bank_accounts',
          operation: 'getById',
          accountId: input.id,
        });
        throw error;
      }
    }),

  // Criar nova conta bancária
  create: protectedProcedure
    .input(
      z.object({
        institution_name: z.string().min(1, 'Nome da instituição é obrigatório'),
        account_mask: z.string().min(1, 'Máscara da conta é obrigatória'),
        balance: z.number().default(0),
        currency: z.string().default('BRL'),
        is_primary: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Se for conta primária, desativar outras contas primárias
        if (input.is_primary) {
          await supabase
            .from('bank_accounts')
            .update({ is_primary: false } as any)
            .eq('user_id', ctx.user.id)
            .eq('is_primary', true);
        }

        const { data, error } = await supabase
          .from('bank_accounts')
          .insert({
            institution_name: input.institution_name,
            account_mask: input.account_mask,
            balance: input.balance,
            currency: input.currency,
            is_active: true,
            is_primary: input.is_primary,
            user_id: ctx.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any)
          .select()
          .single();

        if (error) {
          logError('create_bank_account', ctx.user.id, error, {
            resource: 'bank_accounts',
            operation: 'create',
            institutionName: input.institution_name,
            accountMask: input.account_mask,
            isPrimary: input.is_primary,
            currency: input.currency,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao criar conta bancária',
          });
        }

        logOperation('create_bank_account_success', ctx.user.id, 'bank_accounts', data?.id, {
          institutionName: input.institution_name,
          accountMask: input.account_mask,
          isPrimary: input.is_primary,
          currency: input.currency,
          initialBalance: input.balance,
        });

        return data;
      } catch (error) {
        logError('create_bank_account_unexpected', ctx.user.id, error as Error, {
          resource: 'bank_accounts',
          operation: 'create',
          institutionName: input.institution_name,
          accountMask: input.account_mask,
          isPrimary: input.is_primary,
          currency: input.currency,
        });
        throw error;
      }
    }),

  // Atualizar conta bancária
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        institution_name: z.string().optional(),
        account_mask: z.string().optional(),
        balance: z.number().optional(),
        currency: z.string().optional(),
        is_active: z.boolean().optional(),
        is_primary: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;

        // Se for conta primária, desativar outras contas primárias
        if (updateData.is_primary) {
          await supabase
            .from('bank_accounts')
            .update({ is_primary: false } as any)
            .eq('user_id', ctx.user.id)
            .eq('is_primary', true)
            .neq('id', id);
        }

        const { data, error } = await supabase
          .from('bank_accounts')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', id)
          .eq('user_id', ctx.user.id)
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            logOperation('update_bank_account_not_found', ctx.user.id, 'bank_accounts', input.id, {
              reason: 'account_not_found',
            });
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Conta bancária não encontrada',
            });
          }
          logError('update_bank_account', ctx.user.id, error, {
            resource: 'bank_accounts',
            operation: 'update',
            accountId: input.id,
            updateFields: Object.keys(updateData),
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar conta bancária',
          });
        }

        logOperation('update_bank_account_success', ctx.user.id, 'bank_accounts', input.id, {
          updateFields: Object.keys(updateData),
        });

        return data;
      } catch (error) {
        logError('update_bank_account_unexpected', ctx.user.id, error as Error, {
          resource: 'bank_accounts',
          operation: 'update',
          accountId: input.id,
          updateFields: Object.keys(input).filter((k) => k !== 'id'),
        });
        throw error;
      }
    }),

  // Deletar conta bancária (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('bank_accounts')
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            logOperation('delete_bank_account_not_found', ctx.user.id, 'bank_accounts', input.id, {
              reason: 'account_not_found',
            });
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Conta bancária não encontrada',
            });
          }
          logError('delete_bank_account', ctx.user.id, error, {
            resource: 'bank_accounts',
            operation: 'delete',
            accountId: input.id,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao deletar conta bancária',
          });
        }

        logOperation('delete_bank_account_success', ctx.user.id, 'bank_accounts', input.id, {
          deletedAccountId: input.id,
          softDelete: true,
        });

        return data;
      } catch (error) {
        logError('delete_bank_account_unexpected', ctx.user.id, error as Error, {
          resource: 'bank_accounts',
          operation: 'delete',
          accountId: input.id,
        });
        throw error;
      }
    }),

  // Obter saldo total
  getTotalBalance: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('balance, currency')
        .eq('user_id', ctx.user.id)
        .eq('is_active', true);

      if (error) {
        logError('fetch_total_balance', ctx.user.id, error, {
          resource: 'bank_accounts',
          operation: 'getTotalBalance',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar saldo total',
        });
      }

      const balances = data?.reduce(
        (acc, account) => {
          const currency = account.currency || 'BRL';
          if (!acc[currency]) {
            acc[currency] = 0;
          }
          acc[currency] += Number(account.balance) || 0;
          return acc;
        },
        {} as Record<string, number>
      );

      logOperation('fetch_total_balance_success', ctx.user.id, 'bank_accounts', undefined, {
        currencies: Object.keys(balances),
        accountsCount: data?.length || 0,
      });

      return balances;
    } catch (error) {
      logError('fetch_total_balance_unexpected', ctx.user.id, error as Error, {
        resource: 'bank_accounts',
        operation: 'getTotalBalance',
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar saldo total',
      });
    }
  }),

  // Atualizar saldo (para integração externa)
  updateBalance: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        balance: z.number(),
        available_balance: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('bank_accounts')
          .update({
            balance: input.balance,
            available_balance: input.available_balance ?? input.balance,
            last_sync: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .select()
          .single();

        if (error) {
          logError('update_balance', ctx.user.id, error, {
            resource: 'bank_accounts',
            operation: 'updateBalance',
            accountId: input.id,
            newBalance: input.balance,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar saldo',
          });
        }

        // Registrar histórico do saldo
        await supabase.from('account_balance_history' as any).insert({
          account_id: input.id,
          balance: input.balance,
          available_balance: input.available_balance ?? input.balance,
          recorded_at: new Date().toISOString(),
          source: 'sync',
        } as any);

        logOperation('update_balance_success', ctx.user.id, 'bank_accounts', input.id, {
          newBalance: input.balance,
          availableBalance: input.available_balance ?? input.balance,
          source: 'sync',
        });

        return data;
      } catch (error) {
        logError('update_balance_unexpected', ctx.user.id, error as Error, {
          resource: 'bank_accounts',
          operation: 'updateBalance',
          accountId: input.id,
          newBalance: input.balance,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar saldo',
        });
      }
    }),

  // Obter histórico de saldos
  getBalanceHistory: protectedProcedure
    .input(
      z.object({
        accountId: z.string().uuid(),
        days: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        const { data, error } = await supabase
          .from('account_balance_history' as any)
          .select('*')
          .eq('account_id', input.accountId)
          .gte('recorded_at', startDate.toISOString())
          .order('recorded_at', { ascending: true });

        if (error) {
          logError('fetch_balance_history', 'system', error, {
            resource: 'account_balance_history',
            operation: 'getBalanceHistory',
            accountId: input.accountId,
            days: input.days,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar histórico de saldos',
          });
        }

        return data || [];
      } catch (error) {
        logError('fetch_balance_history_unexpected', 'system', error as Error, {
          resource: 'account_balance_history',
          operation: 'getBalanceHistory',
          accountId: input.accountId,
          days: input.days,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar histórico de saldos',
        });
      }
    }),
});
