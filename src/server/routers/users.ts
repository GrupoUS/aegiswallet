import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { supabase } from '@/integrations/supabase/client'
import { TRPCError } from '@trpc/server'

/**
 * Users Router - Gerenciamento de perfis de usuário
 */
export const usersRouter = router({
  // Obter perfil do usuário
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select(`
            *,
            user_preferences(*)
          `)
          .eq('id', ctx.user.id)
          .single()

        if (error) {
          console.error('Error fetching user profile:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar perfil do usuário',
          })
        }

        return data
      } catch (error) {
        console.error('Profile fetch error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar perfil do usuário',
        })
      }
    }),

  // Atualizar perfil do usuário
  updateProfile: protectedProcedure
    .input(
      z.object({
        full_name: z.string().optional(),
        phone: z.string().optional(),
        cpf: z.string().optional(),
        birth_date: z.string().optional(),
        autonomy_level: z.number().min(50).max(95).optional(),
        voice_command_enabled: z.boolean().optional(),
        language: z.string().optional(),
        timezone: z.string().optional(),
        currency: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .update({
            ...input,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ctx.user.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating user profile:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar perfil do usuário',
          })
        }

        return data
      } catch (error) {
        console.error('Profile update error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar perfil do usuário',
        })
      }
    }),

  // Atualizar preferências do usuário
  updatePreferences: protectedProcedure
    .input(
      z.object({
        theme: z.enum(['light', 'dark', 'system']).optional(),
        notifications_email: z.boolean().optional(),
        notifications_push: z.boolean().optional(),
        notifications_sms: z.boolean().optional(),
        auto_categorize: z.boolean().optional(),
        budget_alerts: z.boolean().optional(),
        voice_feedback: z.boolean().optional(),
        accessibility_high_contrast: z.boolean().optional(),
        accessibility_large_text: z.boolean().optional(),
        accessibility_screen_reader: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: ctx.user.id,
            ...input,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          console.error('Error updating user preferences:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar preferências do usuário',
          })
        }

        return data
      } catch (error) {
        console.error('Preferences update error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar preferências do usuário',
        })
      }
    }),

  // Obter resumo financeiro do usuário
  getFinancialSummary: protectedProcedure
    .input(
      z.object({
        period_start: z.string(),
        period_end: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Chamar a função do banco de dados
        const { data, error } = await supabase
          .rpc('get_financial_summary', {
            p_user_id: ctx.user.id,
            p_period_start: input.period_start,
            p_period_end: input.period_end,
          })

        if (error) {
          console.error('Error getting financial summary:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar resumo financeiro',
          })
        }

        return data
      } catch (error) {
        console.error('Financial summary error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar resumo financeiro',
        })
      }
    }),

  // Atualizar último login
  updateLastLogin: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .update({
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', ctx.user.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating last login:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar último login',
          })
        }

        return data
      } catch (error) {
        console.error('Last login update error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar último login',
        })
      }
    }),

  // Verificar se o usuário está ativo
  checkUserStatus: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_active, last_login')
          .eq('id', ctx.user.id)
          .single()

        if (error) {
          console.error('Error checking user status:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao verificar status do usuário',
          })
        }

        return {
          is_active: data?.is_active ?? false,
          last_login: data?.last_login,
        }
      } catch (error) {
        console.error('User status check error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao verificar status do usuário',
        })
      }
    }),
})
