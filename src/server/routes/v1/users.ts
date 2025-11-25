/**
 * Users API - Hono RPC Implementation
 * Handles user profile and preferences management
 */

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';

// =====================================================
// Validation Schemas
// =====================================================

const updateProfileSchema = z.object({
  full_name: z.string().optional(),
  phone: z.string().optional(),
});

const updatePreferencesSchema = z.record(z.string(), z.any());

const getFinancialSummarySchema = z.object({
  period_start: z.string(),
  period_end: z.string(),
});

const usersRouter = new Hono<AppEnv>();

// =====================================================
// User Profile Endpoints
// =====================================================

/**
 * Get current user profile
 */
usersRouter.get(
  '/me',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many requests, please try again later',
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();

      if (error) {
        throw new Error(`Erro ao buscar perfil: ${error.message}`);
      }

      return c.json({
        data,
        meta: {
          requestId,
          retrievedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to get user profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json(
        {
          code: 'PROFILE_ERROR',
          error: 'Failed to retrieve profile',
        },
        500
      );
    }
  }
);

/**
 * Update user profile
 */
usersRouter.put(
  '/me',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Too many update attempts, please try again later',
  }),
  zValidator('json', updateProfileSchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('users')
        .update(input)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar perfil: ${error.message}`);
      }

      secureLogger.info('User profile updated', {
        requestId,
        userId: user.id,
      });

      return c.json({
        data,
        meta: {
          requestId,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to update user profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json(
        {
          code: 'PROFILE_UPDATE_ERROR',
          error: 'Failed to update profile',
        },
        500
      );
    }
  }
);

/**
 * Update user preferences
 */
usersRouter.put(
  '/me/preferences',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Too many update attempts, please try again later',
  }),
  zValidator('json', updatePreferencesSchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...input,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar preferências: ${error.message}`);
      }

      secureLogger.info('User preferences updated', {
        requestId,
        userId: user.id,
      });

      return c.json({
        data,
        meta: {
          requestId,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to update user preferences', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json(
        {
          code: 'PREFERENCES_UPDATE_ERROR',
          error: 'Failed to update preferences',
        },
        500
      );
    }
  }
);

/**
 * Update last login timestamp
 */
usersRouter.post(
  '/me/last-login',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000,
    max: 10,
    message: 'Too many requests, please try again later',
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      const { error } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        // Don't throw error for this non-critical operation, just log warning
        secureLogger.warn('Failed to update last login', {
          error: error.message,
          requestId,
          userId: user.id,
        });
      }

      return c.json({
        data: { success: true },
        meta: {
          requestId,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.warn('Failed to update last login', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      // Still return success - this is a non-critical operation
      return c.json({
        data: { success: true },
        meta: {
          requestId,
          updatedAt: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Check user status
 */
usersRouter.get(
  '/me/status',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many requests, please try again later',
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_active, last_login')
        .eq('id', user.id)
        .single();

      if (error) {
        return c.json({
          data: { is_active: false, last_login: null },
          meta: {
            requestId,
            retrievedAt: new Date().toISOString(),
          },
        });
      }

      return c.json({
        data,
        meta: {
          requestId,
          retrievedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to check user status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json({
        data: { is_active: false, last_login: null },
        meta: {
          requestId,
          retrievedAt: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Get financial summary for period
 */
usersRouter.get(
  '/me/financial-summary',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Too many requests, please try again later',
  }),
  zValidator('query', getFinancialSummarySchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const { period_start, period_end } = c.req.valid('query');
    const requestId = c.get('requestId');

    try {
      const { data: transactions, error } = await supabase
        .from('financial_events')
        .select('amount, event_type, is_income')
        .eq('user_id', user.id)
        .gte('created_at', period_start)
        .lte('created_at', period_end);

      if (error) {
        throw new Error(`Erro ao buscar resumo financeiro: ${error.message}`);
      }

      const summary = (transactions || []).reduce(
        (acc, t) => {
          if (['debit', 'pix', 'boleto'].includes(t.event_type)) {
            acc.expenses += t.amount;
            acc.balance -= t.amount;
          } else if (['credit', 'transfer'].includes(t.event_type)) {
            acc.income += t.amount;
            acc.balance += t.amount;
          }
          return acc;
        },
        { income: 0, expenses: 0, balance: 0 }
      );

      return c.json({
        data: summary,
        meta: {
          requestId,
          retrievedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to get financial summary', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json(
        {
          code: 'FINANCIAL_SUMMARY_ERROR',
          error: 'Failed to retrieve financial summary',
        },
        500
      );
    }
  }
);

export default usersRouter;
