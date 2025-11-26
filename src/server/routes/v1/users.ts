/**
 * Users API - Hono RPC Implementation
 * Handles user profile and preferences management
 */

import { zValidator } from '@hono/zod-validator';
import { and, eq, gte, lte } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '@/db';
import { financialEvents } from '@/db/schema/transactions';
import { userPreferences, users } from '@/db/schema/users';
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
    const { user } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      const [profile] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);

      return c.json({
        data: profile || null,
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
    const { user } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      const updateData: Partial<typeof users.$inferInsert> = {};
      if (input.full_name) updateData.fullName = input.full_name;
      if (input.phone) updateData.phone = input.phone;

      const [updatedProfile] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, user.id))
        .returning();

      secureLogger.info('User profile updated', {
        requestId,
        userId: user.id,
      });

      return c.json({
        data: updatedProfile,
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
    const { user } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      const prefData: any = {
        userId: user.id,
        updatedAt: new Date(),
      };

      if (input.theme) prefData.theme = input.theme;
      if (input.notifications_email !== undefined)
        prefData.notificationsEmail = input.notifications_email;
      if (input.notifications_push !== undefined)
        prefData.notificationsPush = input.notifications_push;
      if (input.notifications_sms !== undefined)
        prefData.notificationsSms = input.notifications_sms;
      if (input.auto_categorize !== undefined) prefData.autoCategorize = input.auto_categorize;
      if (input.budget_alerts !== undefined) prefData.budgetAlerts = input.budget_alerts;
      if (input.voice_feedback !== undefined) prefData.voiceFeedback = input.voice_feedback;

      const [updatedPrefs] = await db
        .insert(userPreferences)
        .values(prefData)
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: prefData,
        })
        .returning();

      secureLogger.info('User preferences updated', {
        requestId,
        userId: user.id,
      });

      return c.json({
        data: updatedPrefs,
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
    const { user } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));

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
    const { user } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      const [status] = await db
        .select({
          isActive: users.isActive,
          lastLogin: users.lastLogin,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (!status) {
        return c.json({
          data: { is_active: false, last_login: null },
          meta: {
            requestId,
            retrievedAt: new Date().toISOString(),
          },
        });
      }

      return c.json({
        data: {
          is_active: status.isActive,
          last_login: status.lastLogin,
        },
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
    const { user } = c.get('auth');
    const { period_start, period_end } = c.req.valid('query');
    const requestId = c.get('requestId');

    try {
      const transactions = await db
        .select({
          amount: financialEvents.amount,
          eventType: financialEvents.eventType,
          isIncome: financialEvents.isIncome,
        })
        .from(financialEvents)
        .where(
          and(
            eq(financialEvents.userId, user.id),
            gte(financialEvents.createdAt, new Date(period_start)),
            lte(financialEvents.createdAt, new Date(period_end))
          )
        );

      const summary = transactions.reduce(
        (acc: { income: number; expenses: number; balance: number }, t: any) => {
          const amount = Number(t.amount);
          if (['debit', 'pix', 'boleto'].includes(t.eventType)) {
            acc.expenses += amount;
            acc.balance -= amount;
          } else if (['credit', 'transfer'].includes(t.eventType)) {
            acc.income += amount;
            acc.balance += amount;
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
