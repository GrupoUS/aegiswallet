/**
 * Consolidated Authentication Router
 * Combines functionality from procedures/auth.ts with enhanced patterns
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { DEFAULT_PASSWORD_POLICY, validatePassword } from '@/lib/security/password-validator';
import {
  checkAuthenticationRateLimit,
  getClientIP,
  recordAuthenticationAttempt,
} from '@/lib/security/rate-limiter';
import { logError, logOperation, logSecurityEvent } from '@/server/lib/logger';
import { protectedProcedure, publicProcedure, router } from '@/server/trpc-helpers';

export const authRouter = router({
  /**
   * Get current user session with enhanced logging
   */
  getSession: publicProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.session?.user) {
        return { session: null, user: null };
      }

      logOperation('session_check', ctx.user.id, 'auth', ctx.user.id, {
        hasActiveSession: true,
      });

      return {
        session: ctx.session,
        user: ctx.user,
      };
    } catch (error) {
      logError('session_check_error', ctx.user?.id, error as Error, {
        operation: 'getSession',
      });
      return { session: null, user: null };
    }
  }),

  /**
   * Enhanced sign in with rate limiting and comprehensive logging
   */
  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().email('Email inválido'),
        password: z.string().min(DEFAULT_PASSWORD_POLICY.minLength),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const clientIP = getClientIP(ctx.req || {});

      try {
        // Check rate limits before attempting authentication
        const rateLimitCheck = checkAuthenticationRateLimit(input.email, clientIP);
        if (!rateLimitCheck.allowed) {
          logSecurityEvent('rate_limit_blocked', clientIP, {
            email: input.email,
            reason: rateLimitCheck.reason,
            retryAfter: rateLimitCheck.retryAfter,
          });

          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: rateLimitCheck.reason || 'Muitas tentativas. Tente novamente mais tarde.',
          });
        }

        // Attempt authentication
        const { data, error } = await ctx.supabase.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });

        if (error) {
          // Record failed attempt
          recordAuthenticationAttempt(input.email, clientIP, false);

          logSecurityEvent('authentication_failed', clientIP, {
            email: input.email,
            error: error.message,
          });

          // Don't reveal specific error for security
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Email ou senha inválidos',
          });
        }

        // Record successful authentication
        recordAuthenticationAttempt(input.email, clientIP, true);

        logOperation('authentication_success', data.user?.id, 'auth', data.user?.id, {
          clientIP,
          email: input.email,
          timestamp: new Date().toISOString(),
        });

        return data;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logError('authentication_unexpected_error', null, error as Error, {
          clientIP,
          email: input.email,
          operation: 'signIn',
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao realizar autenticação',
        });
      }
    }),

  /**
   * Enhanced sign up with password validation and security checks
   */
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email('Email inválido'),
        name: z.string().min(2).max(100),
        password: z.string().min(DEFAULT_PASSWORD_POLICY.minLength),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const clientIP = getClientIP(ctx.req || {});

      try {
        // Validate password strength
        const passwordValidation = validatePassword(input.password, DEFAULT_PASSWORD_POLICY, {
          email: input.email,
          name: input.name,
        });

        if (!passwordValidation.isValid) {
          logSecurityEvent('weak_password_attempt', clientIP, {
            email: input.email,
            issues: passwordValidation.issues,
            score: passwordValidation.score,
          });

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Senha fraca: ${passwordValidation.issues.join(', ')}`,
          });
        }

        // Create user account
        const { data, error } = await ctx.supabase.auth.signUp({
          email: input.email,
          options: {
            data: {
              full_name: input.name,
              phone: input.phone,
            },
          },
          password: input.password,
        });

        if (error) {
          logSecurityEvent('registration_failed', clientIP, {
            email: input.email,
            error: error.message,
          });

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }

        logOperation('registration_success', data.user?.id, 'auth', data.user?.id, {
          clientIP,
          email: input.email,
          name: input.name,
          timestamp: new Date().toISOString(),
        });

        return data;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logError('registration_unexpected_error', null, error as Error, {
          clientIP,
          email: input.email,
          operation: 'signUp',
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar conta',
        });
      }
    }),

  /**
   * Sign out with session cleanup
   */
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const { error } = await ctx.supabase.auth.signOut();

      if (error) {
        logError('sign_out_error', ctx.user.id, error, {
          operation: 'signOut',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao sair da conta',
        });
      }

      logOperation('sign_out_success', ctx.user.id, 'auth', ctx.user.id, {
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      logError('sign_out_unexpected_error', ctx.user.id, error as Error, {
        operation: 'signOut',
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao sair da conta',
      });
    }
  }),

  /**
   * Reset password request with rate limiting
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email('Email inválido'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const clientIP = getClientIP(ctx.req || {});

      try {
        const { error } = await ctx.supabase.auth.resetPasswordForEmail(input.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          logSecurityEvent('password_reset_failed', clientIP, {
            email: input.email,
            error: error.message,
          });

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Erro ao solicitar redefinição de senha',
          });
        }

        logOperation('password_reset_requested', null, 'auth', null, {
          clientIP,
          email: input.email,
          timestamp: new Date().toISOString(),
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logError('password_reset_unexpected_error', null, error as Error, {
          clientIP,
          email: input.email,
          operation: 'resetPassword',
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao solicitar redefinição de senha',
        });
      }
    }),
});
