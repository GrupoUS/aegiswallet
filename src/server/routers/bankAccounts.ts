import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { supabase } from '@/integrations/supabase/client'
import { protectedProcedure, router } from '../trpc'

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
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching bank accounts:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar contas bancárias',
        })
      }

      return data || []
    } catch (error) {
      console.error('Bank accounts fetch error:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar contas bancárias',
      })
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
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Conta bancária não encontrada',
            })
          }
          console.error('Error fetching bank account:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar conta bancária',
          })
        }

        return data
      } catch (error) {
        console.error('Bank account fetch error:', error)
        throw error
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
            .update({ is_primary: false })
            .eq('user_id', ctx.user.id)
            .eq('is_primary', true)
        }

        const { data, error } = await supabase
          .from('bank_accounts')
          .insert({
            ...input,
            user_id: ctx.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating bank account:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao criar conta bancária',
          })
        }

        return data
      } catch (error) {
        console.error('Bank account creation error:', error)
        throw error
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
        const { id, ...updateData } = input

        // Se for conta primária, desativar outras contas primárias
        if (updateData.is_primary) {
          await supabase
            .from('bank_accounts')
            .update({ is_primary: false })
            .eq('user_id', ctx.user.id)
            .eq('is_primary', true)
            .neq('id', id)
        }

        const { data, error } = await supabase
          .from('bank_accounts')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', ctx.user.id)
          .select()
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Conta bancária não encontrada',
            })
          }
          console.error('Error updating bank account:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar conta bancária',
          })
        }

        return data
      } catch (error) {
        console.error('Bank account update error:', error)
        throw error
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
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Conta bancária não encontrada',
            })
          }
          console.error('Error deleting bank account:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao deletar conta bancária',
          })
        }

        return data
      } catch (error) {
        console.error('Bank account deletion error:', error)
        throw error
      }
    }),

  // Obter saldo total
  getTotalBalance: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('balance, currency')
        .eq('user_id', ctx.user.id)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching total balance:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar saldo total',
        })
      }

      const balances = data?.reduce(
        (acc, account) => {
          const currency = account.currency || 'BRL'
          if (!acc[currency]) {
            acc[currency] = 0
          }
          acc[currency] += Number(account.balance) || 0
          return acc
        },
        {} as Record<string, number>
      )

      return balances
    } catch (error) {
      console.error('Total balance fetch error:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar saldo total',
      })
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
          .single()

        if (error) {
          console.error('Error updating balance:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar saldo',
          })
        }

        // Registrar histórico do saldo
        await supabase.from('account_balance_history').insert({
          account_id: input.id,
          balance: input.balance,
          available_balance: input.available_balance ?? input.balance,
          recorded_at: new Date().toISOString(),
          source: 'sync',
        })

        return data
      } catch (error) {
        console.error('Balance update error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar saldo',
        })
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
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - input.days)

        const { data, error } = await supabase
          .from('account_balance_history')
          .select('*')
          .eq('account_id', input.accountId)
          .gte('recorded_at', startDate.toISOString())
          .order('recorded_at', { ascending: true })

        if (error) {
          console.error('Error fetching balance history:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar histórico de saldos',
          })
        }

        return data || []
      } catch (error) {
        console.error('Balance history fetch error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar histórico de saldos',
        })
      }
    }),
})
