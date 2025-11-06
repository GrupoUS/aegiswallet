import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { logError, logOperation } from '@/server/lib/logger';
import { protectedProcedure, router } from '@/server/trpc-helpers';

/**
 * Users Router - Gerenciamento de perfis de usuário
 */
export const usersRouter = router({
  // Obter perfil do usuário
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
            *,
            user_preferences(*)
          `)
        .eq('id', ctx.user.id)
        .single();

      if (error) {
        logError('fetch_user_profile', ctx.user.id, error, {
          resource: 'users',
          operation: 'getProfile',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar perfil do usuário',
        });
      }

      logOperation('fetch_user_profile_success', ctx.user.id, 'users', ctx.user.id, {
        hasPreferences: !!data?.user_preferences,
      });

      return data;
    } catch (error) {
      logError('fetch_user_profile_unexpected', ctx.user.id, error as Error, {
        resource: 'users',
        operation: 'getProfile',
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar perfil do usuário',
      });
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
          .single();

        if (error) {
          logError('update_user_profile', ctx.user.id, error, {
            resource: 'users',
            operation: 'updateProfile',
            updateFields: Object.keys(input),
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar perfil do usuário',
          });
        }

        logOperation('update_user_profile_success', ctx.user.id, 'users', ctx.user.id, {
          updateFields: Object.keys(input),
          hasProfileChanges: true,
        });

        return data;
      } catch (error) {
        logError('update_user_profile_unexpected', ctx.user.id, error as Error, {
          resource: 'users',
          operation: 'updateProfile',
          updateFields: Object.keys(input),
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar perfil do usuário',
        });
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
          .single();

        if (error) {
          logError('update_user_preferences', ctx.user.id, error, {
            resource: 'user_preferences',
            operation: 'updatePreferences',
            updateFields: Object.keys(input),
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar preferências do usuário',
          });
        }

        logOperation('update_user_preferences_success', ctx.user.id, 'user_preferences', data?.id, {
          updateFields: Object.keys(input),
        });

        return data;
      } catch (error) {
        logError('update_user_preferences_unexpected', ctx.user.id, error as Error, {
          resource: 'user_preferences',
          operation: 'updatePreferences',
          updateFields: Object.keys(input),
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar preferências do usuário',
        });
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
        const { data, error } = await supabase.rpc('get_financial_summary', {
          p_user_id: ctx.user.id,
          p_period_start: input.period_start,
          p_period_end: input.period_end,
        });

        if (error) {
          logError('get_financial_summary', ctx.user.id, error, {
            resource: 'users',
            operation: 'getFinancialSummary',
            periodStart: input.period_start,
            periodEnd: input.period_end,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar resumo financeiro',
          });
        }

        logOperation('get_financial_summary_success', ctx.user.id, 'users', undefined, {
          periodStart: input.period_start,
          periodEnd: input.period_end,
        });

        return data;
      } catch (error) {
        logError('get_financial_summary_unexpected', ctx.user.id, error as Error, {
          resource: 'users',
          operation: 'getFinancialSummary',
          periodStart: input.period_start,
          periodEnd: input.period_end,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar resumo financeiro',
        });
      }
    }),

  // Atualizar último login
  updateLastLogin: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', ctx.user.id)
        .select()
        .single();

      if (error) {
        logError('update_last_login', ctx.user.id, error, {
          resource: 'users',
          operation: 'updateLastLogin',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar último login',
        });
      }

      logOperation('update_last_login_success', ctx.user.id, 'users', ctx.user.id, {
        loginTime: new Date().toISOString(),
      });

      return data;
    } catch (error) {
      logError('update_last_login_unexpected', ctx.user.id, error as Error, {
        resource: 'users',
        operation: 'updateLastLogin',
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao atualizar último login',
      });
    }
  }),

  // Verificar se o usuário está ativo
  checkUserStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_active, last_login')
        .eq('id', ctx.user.id)
        .single();

      if (error) {
        logError('check_user_status', ctx.user.id, error, {
          resource: 'users',
          operation: 'checkUserStatus',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao verificar status do usuário',
        });
      }

      logOperation('check_user_status_success', ctx.user.id, 'users', ctx.user.id, {
        isActive: data?.is_active ?? false,
        hasLastLogin: !!data?.last_login,
      });

      return {
        is_active: data?.is_active ?? false,
        last_login: data?.last_login,
      };
    } catch (error) {
      logError('check_user_status_unexpected', ctx.user.id, error as Error, {
        resource: 'users',
        operation: 'checkUserStatus',
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao verificar status do usuário',
      });
    }
  }),
});
