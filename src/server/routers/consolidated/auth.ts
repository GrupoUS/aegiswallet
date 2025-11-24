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

const toRateLimitRequest = (req?: Request | null) => {
  if (!req) {
    return { headers: {} as Record<string, string> };
  }

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  return { headers };
};

export const authRouter = router({
  /**
   * Return the current Supabase session (if any) with contextual logging.
   *
   * Security:
   * - Logs session checks with client IP and user agent for auditing.
   * - Does not throw when session is missing to avoid enumeration.
   */
  getSession: publicProcedure.query(async ({ ctx }) => {
    try {
      const clientIP = getClientIP(toRateLimitRequest(ctx.req));
      const userAgent = ctx.req?.headers.get('user-agent') ?? 'unknown';
      const hasSession = Boolean(ctx.session?.user);

      logOperation('session_check', ctx.user?.id, 'auth', ctx.user?.id, {
        clientIP,
        hasActiveSession: hasSession,
        userAgent,
      });

      if (!hasSession) {
        return { session: null, user: null };
      }

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
   * Sign in with email/password under layered security controls.
   *
   * Security Features:
   * - Rate limiting per email and IP (`checkAuthenticationRateLimit`).
   * - Security event logging with IP + user agent.
   * - Generic error messaging to prevent user enumeration.
   */
  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().email('Email inválido'),
        password: z.string().min(DEFAULT_PASSWORD_POLICY.minLength),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rateLimitRequest = toRateLimitRequest(ctx.req);
      const clientIP = getClientIP(rateLimitRequest);
      const userAgent = ctx.req?.headers.get('user-agent') ?? 'unknown';

      try {
        // Rate limiting: email (authentication limiter) + IP (general limiter)
        const rateLimitCheck = checkAuthenticationRateLimit(input.email, clientIP);
        if (!rateLimitCheck.allowed) {
          logSecurityEvent('rate_limit_blocked', clientIP, {
            email: input.email,
            reason: rateLimitCheck.reason,
            retryAfter: rateLimitCheck.retryAfter,
            userAgent,
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
            userAgent,
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
          userAgent,
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
          userAgent,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao realizar autenticação',
        });
      }
    }),

  /**
   * Register a new user with password policy enforcement and rate limiting.
   *
   * Security Features:
   * - Password validation via `validatePassword` using DEFAULT_PASSWORD_POLICY.
   * - Audit logging with client IP + user agent.
   * - Generic error responses to avoid user enumeration.
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
      const rateLimitRequest = toRateLimitRequest(ctx.req);
      const clientIP = getClientIP(rateLimitRequest);
      const userAgent = ctx.req?.headers.get('user-agent') ?? 'unknown';

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
            userAgent,
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
            userAgent,
          });

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Não foi possível criar a conta. Tente novamente mais tarde.',
          });
        }

        logOperation('registration_success', data.user?.id, 'auth', data.user?.id, {
          clientIP,
          email: input.email,
          name: input.name,
          timestamp: new Date().toISOString(),
          userAgent,
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
          userAgent,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar conta',
        });
      }
    }),

  /**
   * Sign out the current session and log the event for auditing.
   *
   * Security:
   * - Logs sign-out attempts with client IP and user agent.
   * - Returns generic errors on failure.
   */
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    const rateLimitRequest = toRateLimitRequest(ctx.req);
    const clientIP = getClientIP(rateLimitRequest);
    const userAgent = ctx.req?.headers.get('user-agent') ?? 'unknown';

    try {
      const { error } = await ctx.supabase.auth.signOut();

      if (error) {
        logError('sign_out_error', ctx.user.id, error, {
          clientIP,
          operation: 'signOut',
          userAgent,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao sair da conta',
        });
      }

      logOperation('sign_out_success', ctx.user.id, 'auth', ctx.user.id, {
        clientIP,
        timestamp: new Date().toISOString(),
        userAgent,
      });

      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      logError('sign_out_unexpected_error', ctx.user.id, error as Error, {
        clientIP,
        operation: 'signOut',
        userAgent,
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao sair da conta',
      });
    }
  }),

  /**
   * Initiate password reset email.
   *
   * Security:
   * - Subject to general API rate limiting plus Supabase throttling.
   * - Logs client IP and user agent for every request.
   * - Returns generic messaging to avoid revealing account existence.
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email('Email inválido'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rateLimitRequest = toRateLimitRequest(ctx.req);
      const clientIP = getClientIP(rateLimitRequest);
      const userAgent = ctx.req?.headers.get('user-agent') ?? 'unknown';
      const origin =
        ctx.req?.headers.get('origin') ||
        ctx.req?.headers.get('referer') ||
        'https://app.aegiswallet.com';

      try {
        const { error } = await ctx.supabase.auth.resetPasswordForEmail(input.email, {
          redirectTo: `${origin}/reset-password`,
        });

        if (error) {
          logSecurityEvent('password_reset_failed', clientIP, {
            email: input.email,
            error: error.message,
            userAgent,
          });

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Não foi possível iniciar a redefinição de senha.',
          });
        }

        logOperation('password_reset_requested', null, 'auth', null, {
          clientIP,
          email: input.email,
          timestamp: new Date().toISOString(),
          userAgent,
        });

        return {
          message: 'Se este email estiver cadastrado, enviaremos as instruções.',
          success: true,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logError('password_reset_unexpected_error', null, error as Error, {
          clientIP,
          email: input.email,
          operation: 'resetPassword',
          userAgent,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Não foi possível iniciar a redefinição de senha.',
        });
      }
    }),
});
