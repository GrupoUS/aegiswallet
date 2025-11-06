import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import type { Context } from '@/server/context'
import { logger, logError } from '@/server/lib/logger'

export const createBankingRouter = (t: any) => ({
  /**
   * Get list of supported Brazilian banks
   */
  getInstitutions: t.procedure.query(async () => {
    return [
      { id: 'banco_do_brasil_br', name: 'Banco do Brasil', displayName: 'Banco do Brasil' },
      { id: 'caixa_br', name: 'Caixa Econômica Federal', displayName: 'Caixa' },
      { id: 'itau_br', name: 'Itaú Unibanco', displayName: 'Itaú' },
      { id: 'bradesco_br', name: 'Banco Bradesco', displayName: 'Bradesco' },
      { id: 'santander_br', name: 'Santander', displayName: 'Santander' },
      { id: 'nubank_br', name: 'Nubank', displayName: 'Nubank' },
      { id: 'bancointer_br', name: 'Banco Inter', displayName: 'Inter' },
    ]
  }),

  /**
   * Get all bank links for user
   */
  getLinks: t.procedure.query(async ({ ctx }: { ctx: Context }) => {
    if (!ctx.session?.user) {
      return []
    }

    const { data, error } = await ctx.supabase
      .from('bank_links')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      })
    }

    return data || []
  }),

  /**
   * Get account balances
   */
  getBalances: t.procedure
    .input(
      z.object({
        linkId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }: { ctx: Context; input: any }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        })
      }

      try {
        let query = ctx.supabase
          .from('bank_accounts')
          .select('id, name, institution, balance, currency, updated_at')
          .eq('user_id', ctx.user.id)

        if (input.linkId) {
          query = query.eq('link_id', input.linkId)
        }

        const { data, error } = await query.order('updated_at', { ascending: false })

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          })
        }

        const totalBalance = (data || []).reduce((sum, account) => sum + (account.balance || 0), 0)

        return {
          accounts: data || [],
          totalBalance,
          currency: 'BRL',
          lastUpdated: data && data.length > 0 ? data[0].updated_at : null,
        }
      } catch (error) {
        logError('get_balances_failed', ctx.session?.user?.id || 'anonymous', error as Error, {
          resource: 'bank_accounts',
          operation: 'getBalances',
          linkId: input.linkId,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to retrieve balances',
        })
      }
    }),
})
