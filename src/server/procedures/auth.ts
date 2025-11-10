import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { secureLogger } from '@/lib/logging/secure-logger';
import { DEFAULT_PASSWORD_POLICY, validatePassword } from '@/lib/security/password-validator';
import {
  checkAuthenticationRateLimit,
  getClientIP,
  recordAuthenticationAttempt,
} from '@/lib/security/rate-limiter';
import type { Context } from '@/server/context';
import { authRateLimit } from '@/server/middleware/rateLimitMiddleware';
import { securityMiddleware } from '@/server/middleware/securityMiddleware';
import type { RouterBuilder } from '@/server/types';

// Type definitions for auth procedures
type SignInInput = {
  email: string;
  password: string;
};

type SignUpInput = {
  email: string;
  password: string;
  name: string;
};

type AuthContext = {
  req?: any;
} & Context;

export const createAuthRouter = (t: RouterBuilder) => ({
  /**
   * Get current user session
   */
  getSession: t.procedure.use(securityMiddleware).query(async ({ ctx }: { ctx: Context }) => {
    return ctx.session?.user ?? null;
  }),

  /**
   * Sign in with email and password
   */
  signIn: t.procedure
    .use(authRateLimit)
    .use(securityMiddleware)
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(DEFAULT_PASSWORD_POLICY.minLength),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: AuthContext; input: SignInInput }) => {
      // Extract client IP for rate limiting
      const clientIP = getClientIP(ctx.req || {});

      // Check rate limits before attempting authentication
      const rateLimitCheck = checkAuthenticationRateLimit(input.email, clientIP);
      if (!rateLimitCheck.allowed) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message:
            rateLimitCheck.reason || 'Too many authentication attempts. Please try again later.',
        });
      }

      const { data, error } = await ctx.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        // Record failed attempt for rate limiting
        recordAuthenticationAttempt(input.email, clientIP, false);

        // Don't reveal specific error for security reasons
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Record successful authentication for audit and rate limiting
      recordAuthenticationAttempt(input.email, clientIP, true);

      secureLogger.authEvent('user_authenticated_successfully', data.user?.id, {
        email: input.email,
        clientIP,
        component: 'auth.signIn',
      });

      return data;
    }),

  /**
   * Sign up with email and password
   */
  signUp: t.procedure
    .use(authRateLimit)
    .use(securityMiddleware)
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(DEFAULT_PASSWORD_POLICY.minLength),
        name: z.string().min(2).max(100),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: AuthContext; input: SignUpInput }) => {
      // Validate password strength
      const passwordValidation = validatePassword(input.password, DEFAULT_PASSWORD_POLICY, {
        email: input.email,
        name: input.name,
      });

      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Password validation failed: ${passwordValidation.errors.join(', ')}`,
        });
      }

      // Warn about weak passwords (but allow if they meet minimum requirements)
      if (passwordValidation.warnings.length > 0) {
        secureLogger.warn('Weak password warnings during registration', {
          email: input.email,
          warnings: passwordValidation.warnings,
          score: passwordValidation.score,
          component: 'auth.signUp',
        });
      }

      const { data, error } = await ctx.supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            display_name: input.name,
            password_strength: passwordValidation.score,
            password_set_at: new Date().toISOString(),
          },
        },
      });

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      // Log new user registration for audit
      secureLogger.audit('New user registered', {
        userId: data.user?.id,
        email: input.email,
        passwordStrength: passwordValidation.score,
        component: 'auth.signUp',
      });

      return {
        ...data,
        passwordStrength: passwordValidation.score,
        passwordSuggestions: passwordValidation.suggestions,
      };
    }),

  /**
   * Sign out
   */
  signOut: t.procedure
    .use(securityMiddleware)
    .use(({ ctx, next }: { ctx: Context; next: () => Promise<any> }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }
      return next({
        ctx: {
          ...ctx,
          user: ctx.session.user,
        },
      });
    })
    .mutation(async ({ ctx }: { ctx: Context }) => {
      const { error } = await ctx.supabase.auth.signOut();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      return { success: true };
    }),
});
