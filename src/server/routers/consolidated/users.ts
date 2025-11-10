/**
 * Consolidated Users Router
 * Combines functionality from procedures/users.ts and routers/users.ts
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { logError, logOperation } from '@/server/lib/logger';
import { protectedProcedure, router } from '@/server/trpc-helpers';

export const usersRouter = router({
  /**
   * Get user profile with preferences
   */
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

  /**
   * Update user profile with validation
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        full_name: z.string().min(2).max(100).optional(),
        phone: z
          .string()
          .regex(/^\+?[1-9]\d{1,14}$/)
          .optional(),
        cpf: z
          .string()
          .regex(/^\d{11}$/)
          .optional(),
        birth_date: z.string().datetime().optional(),
        autonomy_level: z.number().min(50).max(95).optional(),
        voice_command_enabled: z.boolean().optional(),
        language: z.string().min(2).max(5).optional(),
        timezone: z.string().optional(),
        currency: z.string().length(3).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Validate CPF if provided
        if (input.cpf) {
          const isValidCPF = validateCPF(input.cpf);
          if (!isValidCPF) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'CPF inválido',
            });
          }
        }

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
        if (error instanceof TRPCError) {
          throw error;
        }

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

  /**
   * Update user preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        theme: z.enum(['light', 'dark', 'system']).optional(),
        language: z.string().min(2).max(5).optional(),
        timezone: z.string().optional(),
        currency: z.string().length(3).optional(),
        notifications_enabled: z.boolean().optional(),
        email_notifications: z.boolean().optional(),
        push_notifications: z.boolean().optional(),
        voice_commands_enabled: z.boolean().optional(),
        autonomy_level: z.number().min(50).max(95).optional(),
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
            message: 'Erro ao atualizar preferências',
          });
        }

        logOperation('update_user_preferences_success', ctx.user.id, 'users', ctx.user.id, {
          updateFields: Object.keys(input),
        });

        return data;
      } catch (error) {
        logError('update_user_preferences_unexpected', ctx.user.id, error as Error, {
          resource: 'user_preferences',
          operation: 'updatePreferences',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar preferências',
        });
      }
    }),

  /**
   * Delete user account with confirmation
   */
  deleteAccount: protectedProcedure
    .input(
      z.object({
        password: z.string().min(1),
        confirmation: z.string().min(1, 'Digite "EXCLUIR" para confirmar'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.confirmation !== 'EXCLUIR') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Confirmação inválida. Digite "EXCLUIR" para confirmar.',
          });
        }

        // Verify password before deletion
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: ctx.user.email || '',
          password: input.password,
        });

        if (authError) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Senha incorreta',
          });
        }

        // Delete user data from all related tables
        const { error: deleteError } = await supabase.rpc('delete_user_account', {
          user_id: ctx.user.id,
        });

        if (deleteError) {
          logError('delete_user_account', ctx.user.id, deleteError, {
            operation: 'deleteAccount',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao excluir conta',
          });
        }

        logOperation('delete_user_account_success', ctx.user.id, 'users', ctx.user.id, {
          timestamp: new Date().toISOString(),
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logError('delete_user_account_unexpected', ctx.user.id, error as Error, {
          operation: 'deleteAccount',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao excluir conta',
        });
      }
    }),

  /**
   * Get user settings and preferences
   */
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    try {
      const [profileResult, preferencesResult] = await Promise.all([
        supabase
          .from('users')
          .select('full_name, email, phone, cpf, language, timezone, currency')
          .eq('id', ctx.user.id)
          .single(),
        supabase.from('user_preferences').select('*').eq('user_id', ctx.user.id).single(),
      ]);

      if (profileResult.error || preferencesResult.error) {
        logError(
          'fetch_user_settings',
          ctx.user.id,
          profileResult.error || preferencesResult.error,
          {
            operation: 'getSettings',
          }
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar configurações',
        });
      }

      return {
        profile: profileResult.data,
        preferences: preferencesResult.data,
      };
    } catch (error) {
      logError('fetch_user_settings_unexpected', ctx.user.id, error as Error, {
        operation: 'getSettings',
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar configurações',
      });
    }
  }),

  /**
   * Update user's last login timestamp
   */
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

  /**
   * Get user's financial summary
   */
  getFinancialSummary: protectedProcedure
    .input(
      z.object({
        period_start: z.string(),
        period_end: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
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

  /**
   * Check if user is active
   */
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
