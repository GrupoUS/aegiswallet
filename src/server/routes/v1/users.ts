/**
 * Users API - Hono RPC Implementation
 * Handles user profile and preferences management
 * Using Drizzle ORM with Neon serverless
 */

import { zValidator } from '@hono/zod-validator';
import { and, eq, gte, lte } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { financialEvents, userPreferences, users } from '@/db/schema';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { categorizeDatabaseError } from '@/server/lib/db-error-handler';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';
import { UserSyncService } from '@/services/user-sync.service';

// =====================================================
// Validation Schemas
// =====================================================

const updateProfileSchema = z.object({
	full_name: z.string().optional(),
	phone: z.string().optional(),
	cpf: z.string().optional(),
	birth_date: z.string().optional(),
	profile_image_url: z.string().url().optional(),
});

const updatePreferencesSchema = z.record(z.string(), z.any());

const getFinancialSummarySchema = z.object({
	period_start: z.string(),
	period_end: z.string(),
});

// List of allowed preference fields to prevent arbitrary field injection
const ALLOWED_PREFERENCE_FIELDS = [
	// Theme
	'theme',
	// Notifications
	'notificationsEmail',
	'notificationsPush',
	'notificationsSms',
	// Features
	'autoCategorize',
	'budgetAlerts',
	'voiceFeedback',
	// Accessibility
	'accessibilityHighContrast',
	'accessibilityLargeText',
	'accessibilityScreenReader',
] as const;

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
		const { user, db } = c.get('auth');
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
				500,
			);
		}
	},
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
		const { user, db } = c.get('auth');
		const input = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			const updateData: Partial<typeof users.$inferInsert> = {
				updatedAt: new Date(),
			};

			if (input.full_name) updateData.fullName = input.full_name;
			if (input.phone) updateData.phone = input.phone;
			if (input.cpf) updateData.cpf = input.cpf;
			if (input.birth_date) updateData.birthDate = input.birth_date;
			if (input.profile_image_url) updateData.profileImageUrl = input.profile_image_url;

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
				500,
			);
		}
	},
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
		const { user, db } = c.get('auth');
		const input = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			// Ensure user exists in database before updating preferences
			try {
				await UserSyncService.ensureUserExists(user.id);
			} catch (syncError) {
				secureLogger.error('Failed to ensure user exists in database', {
					userId: user.id,
					requestId,
					error: syncError instanceof Error ? syncError.message : 'Unknown error',
				});

				return c.json(
					{
						code: 'USER_SYNC_ERROR',
						error: 'Failed to verify user account. Please try again.',
					},
					500,
				);
			}

			// Check if preferences exist
			const [existing] = await db
				.select({ id: userPreferences.id })
				.from(userPreferences)
				.where(eq(userPreferences.userId, user.id))
				.limit(1);

			let updatedPrefs: typeof userPreferences.$inferSelect | undefined;

			if (existing) {
				// Update existing preferences
				const updateFields: Record<string, unknown> = {
					updatedAt: new Date(),
				};

				for (const field of ALLOWED_PREFERENCE_FIELDS) {
					if (input[field] !== undefined) {
						updateFields[field] = input[field];
					}
				}

				[updatedPrefs] = await db
					.update(userPreferences)
					.set(updateFields)
					.where(eq(userPreferences.id, existing.id))
					.returning();
			} else {
				// Insert new preferences
				const insertFields: Record<string, unknown> = {
					userId: user.id,
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				for (const field of ALLOWED_PREFERENCE_FIELDS) {
					if (input[field] !== undefined) {
						insertFields[field] = input[field];
					}
				}

				[updatedPrefs] = await db
					.insert(userPreferences)
					.values(insertFields as typeof userPreferences.$inferInsert)
					.returning();
			}

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
				500,
			);
		}
	},
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
		const { user, db } = c.get('auth');
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

			// Still return success - last login update is not critical
			return c.json({
				data: { success: true },
				meta: {
					requestId,
					updatedAt: new Date().toISOString(),
				},
			});
		}
	},
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
		const { user, db } = c.get('auth');
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
					data: { isActive: false, lastLogin: null },
					meta: {
						requestId,
						retrievedAt: new Date().toISOString(),
					},
				});
			}

			return c.json({
				data: {
					isActive: status.isActive,
					lastLogin: status.lastLogin?.toISOString() || null,
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
				data: { isActive: false, lastLogin: null },
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
				},
			});
		}
	},
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
		const { user, db } = c.get('auth');
		const { period_start, period_end } = c.req.valid('query');
		const requestId = c.get('requestId');

		try {
			// Validate date formats
			const startDate = new Date(period_start);
			const endDate = new Date(period_end);

			if (isNaN(startDate.getTime())) {
				return c.json(
					{
						code: 'INVALID_DATE',
						error: 'Invalid period_start format. Expected ISO 8601 date string (e.g., YYYY-MM-DD)',
					},
					400,
				);
			}

			if (isNaN(endDate.getTime())) {
				return c.json(
					{
						code: 'INVALID_DATE',
						error: 'Invalid period_end format. Expected ISO 8601 date string (e.g., YYYY-MM-DD)',
					},
					400,
				);
			}

			// Validate date range
			if (startDate > endDate) {
				return c.json(
					{
						code: 'INVALID_DATE_RANGE',
						error: 'period_start must be before or equal to period_end',
					},
					400,
				);
			}

			const events = await db
				.select({
					amount: financialEvents.amount,
					isIncome: financialEvents.isIncome,
				})
				.from(financialEvents)
				.where(
					and(
						eq(financialEvents.userId, user.id),
						gte(financialEvents.createdAt, startDate),
						lte(financialEvents.createdAt, endDate),
					),
				);

			const summary = events.reduce(
				(acc, t) => {
					const amount = Number(t.amount);
					if (t.isIncome) {
						acc.income += amount;
						acc.balance += amount;
					} else {
						acc.expenses += amount;
						acc.balance -= amount;
					}
					return acc;
				},
				{ income: 0, expenses: 0, balance: 0 },
			);

			return c.json({
				data: summary,
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			const dbError = categorizeDatabaseError(error);
			secureLogger.error('Failed to get financial summary', {
				error: error instanceof Error ? error.message : 'Unknown error',
				errorCode: dbError.code,
				requestId,
				stack: error instanceof Error ? error.stack : undefined,
				userId: user.id,
			});

			return c.json(
				{
					code: dbError.code,
					error: dbError.message,
				},
				dbError.statusCode,
			);
		}
	},
);

export default usersRouter;
