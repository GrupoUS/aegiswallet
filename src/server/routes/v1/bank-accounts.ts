/**
 * Bank Accounts API - Hono RPC Implementation
 * Handles all bank account CRUD operations with validation and business logic
 * Uses Drizzle ORM with NeonDB
 */

import { randomUUID } from 'node:crypto';

import { zValidator } from '@hono/zod-validator';
import { and, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { bankAccounts } from '@/db/schema';
import { secureLogger } from '@/lib/logging/secure-logger';
import {
	generateManualAccountId,
	normalizeAccountMask,
	sanitizeBankAccountData,
	validateAccountMask,
	validateBankAccountForInsert,
	validateBankAccountForUpdate,
} from '@/lib/validation/bank-accounts-validator';
import { UserSyncService } from '@/services/user-sync.service';
import { categorizeDatabaseError } from '@/server/lib/db-error-handler';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';

// =====================================================
// Validation Schemas
// =====================================================

const createBankAccountSchema = z.object({
	institutionName: z.string().min(1, 'Nome da instituição é obrigatório'),
	accountType: z.enum(['checking', 'savings', 'investment', 'cash'], {
		message: 'Tipo de conta é obrigatório',
	}),
	balance: z.number().default(0),
	currency: z.string().default('BRL'),
	isPrimary: z.boolean().default(false),
	isActive: z.boolean().default(true),
	accountMask: z.string().optional(),
	institutionId: z.string().optional(),
});

const updateBankAccountSchema = z.object({
	institutionName: z.string().optional(),
	accountType: z.enum(['checking', 'savings', 'investment', 'cash']).optional(),
	balance: z.number().optional(),
	currency: z.string().optional(),
	isPrimary: z.boolean().optional(),
	isActive: z.boolean().optional(),
	accountMask: z.string().optional(),
});

const updateBalanceSchema = z.object({
	balance: z.number(),
});

const getBalanceHistorySchema = z.object({
	days: z.coerce.number().int().positive().default(30),
});

// Account type mapping from form values to database values
const ACCOUNT_TYPE_MAP: Record<string, string> = {
	checking: 'CHECKING',
	savings: 'SAVINGS',
	investment: 'INVESTMENT',
	cash: 'DIGITAL_WALLET',
};

/**
 * Normalize account type from form format to database format
 */
const normalizeAccountType = (type: string): string => {
	return ACCOUNT_TYPE_MAP[type.toLowerCase()] || type.toUpperCase();
};

/**
 * Generate account mask if not provided
 */
const generateAccountMask = (): string => {
	const lastFour = Math.floor(1000 + Math.random() * 9000);
	return `**** ${lastFour}`;
};

const bankAccountsRouter = new Hono<AppEnv>();

// =====================================================
// Bank Accounts CRUD
// =====================================================

/**
 * Get all bank accounts for the authenticated user
 */
bankAccountsRouter.get(
	'/',
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
			const data = await db
				.select()
				.from(bankAccounts)
				.where(eq(bankAccounts.userId, user.id))
				.orderBy(desc(bankAccounts.createdAt));

			return c.json({
				data: data || [],
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			const dbError = categorizeDatabaseError(error);
			secureLogger.error('Failed to get bank accounts', {
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

/**
 * Get total balance aggregated by currency
 */
bankAccountsRouter.get(
	'/total-balance',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 20,
		message: 'Too many requests, please try again later',
	}),
	async (c) => {
		const { user, db } = c.get('auth');
		const requestId = c.get('requestId');

		try {
			const data = await db
				.select({
					balance: bankAccounts.balance,
					currency: bankAccounts.currency,
				})
				.from(bankAccounts)
				.where(and(eq(bankAccounts.userId, user.id), eq(bankAccounts.isActive, true)));

			const totals: Record<string, number> = {};

			if (data) {
				data.forEach((account) => {
					const currency = account.currency || 'BRL';
					totals[currency] = (totals[currency] || 0) + Number(account.balance || 0);
				});
			}

			return c.json({
				data: totals,
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			const dbError = categorizeDatabaseError(error);
			secureLogger.error('Failed to get total balance', {
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

/**
 * Get a specific bank account by ID
 */
bankAccountsRouter.get(
	'/:id',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 30,
		message: 'Too many requests, please try again later',
	}),
	async (c) => {
		const { user, db } = c.get('auth');
		const accountId = c.req.param('id');
		const requestId = c.get('requestId');

		try {
			const [data] = await db
				.select()
				.from(bankAccounts)
				.where(and(eq(bankAccounts.id, accountId), eq(bankAccounts.userId, user.id)))
				.limit(1);

			if (!data) {
				return c.json(
					{
						code: 'NOT_FOUND',
						error: 'Conta bancária não encontrada',
					},
					404,
				);
			}

			return c.json({
				data,
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			secureLogger.error('Failed to get bank account', {
				accountId,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'BANK_ACCOUNT_ERROR',
					error: 'Failed to retrieve bank account',
				},
				500,
			);
		}
	},
);

/**
 * Get balance history for a specific account
 */
bankAccountsRouter.get(
	'/:id/balance-history',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 20,
		message: 'Too many requests, please try again later',
	}),
	zValidator('query', getBalanceHistorySchema),
	async (c) => {
		const { user, db } = c.get('auth');
		const accountId = c.req.param('id');
		const { days } = c.req.valid('query');
		const requestId = c.get('requestId');

		try {
			if (!accountId || accountId === 'all') {
				return c.json({
					data: [],
					meta: {
						requestId,
						retrievedAt: new Date().toISOString(),
					},
				});
			}

			// Get current balance
			const [account] = await db
				.select({ balance: bankAccounts.balance })
				.from(bankAccounts)
				.where(and(eq(bankAccounts.id, accountId), eq(bankAccounts.userId, user.id)))
				.limit(1);

			if (!account) {
				return c.json({
					data: [],
					meta: {
						requestId,
						retrievedAt: new Date().toISOString(),
					},
				});
			}

			const currentBalance = Number(account.balance || 0);
			const history: Array<{ date: string; balance: number }> = [];

			// Generate mock history (same balance for all days)
			for (let i = 0; i < days; i++) {
				const date = new Date();
				date.setDate(date.getDate() - i);
				history.push({
					date: date.toISOString(),
					balance: currentBalance,
				});
			}

			return c.json({
				data: history.reverse(),
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			secureLogger.error('Failed to get balance history', {
				accountId,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'BALANCE_HISTORY_ERROR',
					error: 'Failed to retrieve balance history',
				},
				500,
			);
		}
	},
);

/**
 * Create a new manual bank account
 */
bankAccountsRouter.post(
	'/',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 10,
		message: 'Too many account creation attempts, please try again later',
	}),
	zValidator('json', createBankAccountSchema),
	async (c) => {
		const { user, db } = c.get('auth');
		const input = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			// Ensure user exists in database before creating bank account
			// Uses UserSyncService for consistent user creation logic
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

			// Normalize account type
			const normalizedAccountType = normalizeAccountType(input.accountType);

			// Generate accountMask if not provided
			const accountMask = input.accountMask
				? normalizeAccountMask(input.accountMask)
				: generateAccountMask();

			// Validate account mask format
			if (!validateAccountMask(accountMask)) {
				return c.json(
					{
						code: 'BAD_REQUEST',
						error: 'A máscara da conta deve seguir o formato **** 1234',
					},
					400,
				);
			}

			// Generate institutionId if not provided
			const institutionId = input.institutionId || randomUUID();

			// Always generate manual belvoAccountId
			const belvoAccountId = generateManualAccountId();

			// Always set syncStatus as manual
			const syncStatus = 'manual';

			// Prepare account data
			const accountData = sanitizeBankAccountData({
				user_id: user.id,
				institution_name: input.institutionName,
				institution_id: institutionId,
				account_type: normalizedAccountType,
				account_mask: accountMask,
				balance: input.balance,
				currency: input.currency.toUpperCase(),
				is_primary: input.isPrimary,
				is_active: input.isActive,
				belvo_account_id: belvoAccountId,
				sync_status: syncStatus,
			});

			// Validate using the validator
			const validation = validateBankAccountForInsert(accountData);
			if (!validation.valid) {
				const errorMessage =
					validation.errors.length > 0
						? validation.errors.map((e) => e.message).join(', ')
						: 'Dados inválidos';
				return c.json(
					{
						code: 'BAD_REQUEST',
						error: errorMessage,
					},
					400,
				);
			}

			// Check for duplicates
			const [existingAccount] = await db
				.select({ id: bankAccounts.id })
				.from(bankAccounts)
				.where(
					and(
						eq(bankAccounts.userId, user.id),
						eq(bankAccounts.institutionId, institutionId),
						eq(bankAccounts.accountMask, accountMask),
					),
				)
				.limit(1);

			if (existingAccount) {
				return c.json(
					{
						code: 'CONFLICT',
						error: 'Já existe uma conta com a mesma instituição e final',
					},
					409,
				);
			}

			// Insert into database
			const [data] = await db
				.insert(bankAccounts)
				.values({
					userId: user.id,
					institutionName: input.institutionName,
					institutionId: institutionId,
					accountType: normalizedAccountType,
					accountMask: accountMask,
					balance: String(input.balance),
					currency: input.currency.toUpperCase(),
					isPrimary: input.isPrimary,
					isActive: input.isActive,
					belvoAccountId: belvoAccountId,
					syncStatus: syncStatus,
				})
				.returning();

			secureLogger.info('Bank account created', {
				accountId: data.id,
				institutionName: input.institutionName,
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					data,
					meta: {
						createdAt: new Date().toISOString(),
						requestId,
					},
				},
				201,
			);
		} catch (error) {
			const dbError = categorizeDatabaseError(error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			const errorStack = error instanceof Error ? error.stack : undefined;

			secureLogger.error('Failed to create bank account', {
				error: errorMessage,
				errorCode: dbError.code,
				errorStack,
				institutionName: input.institutionName,
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: dbError.code,
					error: dbError.message,
					details: import.meta.env.DEV ? errorMessage : undefined,
				},
				dbError.statusCode,
			);
		}
	},
);

/**
 * Update an existing bank account
 */
bankAccountsRouter.put(
	'/:id',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 30,
		message: 'Too many update attempts, please try again later',
	}),
	zValidator('json', updateBankAccountSchema),
	async (c) => {
		const { user, db } = c.get('auth');
		const accountId = c.req.param('id');
		const input = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			// Verify account exists and belongs to user
			const [existingAccount] = await db
				.select({ id: bankAccounts.id })
				.from(bankAccounts)
				.where(and(eq(bankAccounts.id, accountId), eq(bankAccounts.userId, user.id)))
				.limit(1);

			if (!existingAccount) {
				return c.json(
					{
						code: 'NOT_FOUND',
						error: 'Conta bancária não encontrada',
					},
					404,
				);
			}

			// Prepare update data
			const updateData: Record<string, unknown> = {};

			if (input.institutionName !== undefined) {
				updateData.institutionName = input.institutionName;
			}

			if (input.accountType !== undefined) {
				updateData.accountType = normalizeAccountType(input.accountType);
			}

			if (input.balance !== undefined) {
				updateData.balance = String(input.balance);
			}

			if (input.currency !== undefined) {
				updateData.currency = input.currency.toUpperCase();
			}

			if (input.isPrimary !== undefined) {
				updateData.isPrimary = input.isPrimary;
			}

			if (input.isActive !== undefined) {
				updateData.isActive = input.isActive;
			}

			if (input.accountMask !== undefined) {
				const normalizedMask = normalizeAccountMask(input.accountMask);
				if (!validateAccountMask(normalizedMask)) {
					return c.json(
						{
							code: 'BAD_REQUEST',
							error: 'A máscara da conta deve seguir o formato **** 1234',
						},
						400,
					);
				}
				updateData.accountMask = normalizedMask;
			}

			// Sanitize and validate (for snake_case version used by validator)
			const sanitized = sanitizeBankAccountData({
				institution_name: input.institutionName,
				account_type: input.accountType ? normalizeAccountType(input.accountType) : undefined,
				balance: input.balance,
				currency: input.currency?.toUpperCase(),
				is_primary: input.isPrimary,
				is_active: input.isActive,
				account_mask: input.accountMask ? normalizeAccountMask(input.accountMask) : undefined,
			});
			const validation = validateBankAccountForUpdate(sanitized);

			if (!validation.valid) {
				const errorMessage =
					validation.errors.length > 0
						? validation.errors.map((e) => e.message).join(', ')
						: 'Dados inválidos';
				return c.json(
					{
						code: 'BAD_REQUEST',
						error: errorMessage,
					},
					400,
				);
			}

			// Update in database
			const [data] = await db
				.update(bankAccounts)
				.set(updateData)
				.where(and(eq(bankAccounts.id, accountId), eq(bankAccounts.userId, user.id)))
				.returning();

			return c.json({
				data,
				meta: {
					requestId,
					updatedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			secureLogger.error('Failed to update bank account', {
				accountId,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'BANK_ACCOUNT_UPDATE_ERROR',
					error: 'Failed to update bank account',
				},
				500,
			);
		}
	},
);

/**
 * Update only the balance of a bank account
 */
bankAccountsRouter.patch(
	'/:id/balance',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 30,
		message: 'Too many balance update attempts, please try again later',
	}),
	zValidator('json', updateBalanceSchema),
	async (c) => {
		const { user, db } = c.get('auth');
		const accountId = c.req.param('id');
		const { balance } = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			const [data] = await db
				.update(bankAccounts)
				.set({ balance: String(balance) })
				.where(and(eq(bankAccounts.id, accountId), eq(bankAccounts.userId, user.id)))
				.returning();

			if (!data) {
				return c.json(
					{
						code: 'NOT_FOUND',
						error: 'Conta bancária não encontrada',
					},
					404,
				);
			}

			return c.json({
				data,
				meta: {
					requestId,
					updatedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			secureLogger.error('Failed to update balance', {
				accountId,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'BALANCE_UPDATE_ERROR',
					error: 'Failed to update balance',
				},
				500,
			);
		}
	},
);

/**
 * Delete a bank account
 */
bankAccountsRouter.delete(
	'/:id',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 20,
		message: 'Too many deletion attempts, please try again later',
	}),
	async (c) => {
		const { user, db } = c.get('auth');
		const accountId = c.req.param('id');
		const requestId = c.get('requestId');

		try {
			await db
				.delete(bankAccounts)
				.where(and(eq(bankAccounts.id, accountId), eq(bankAccounts.userId, user.id)));

			secureLogger.info('Bank account deleted', {
				accountId,
				requestId,
				userId: user.id,
			});

			return c.json({
				data: { success: true },
				meta: {
					deletedAt: new Date().toISOString(),
					requestId,
				},
			});
		} catch (error) {
			secureLogger.error('Failed to delete bank account', {
				accountId,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'BANK_ACCOUNT_DELETE_ERROR',
					error: 'Failed to delete bank account',
				},
				500,
			);
		}
	},
);

export default bankAccountsRouter;
