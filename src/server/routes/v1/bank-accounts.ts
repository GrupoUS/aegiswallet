/**
 * Bank Accounts API - Hono RPC Implementation
 * Handles all bank account CRUD operations with validation and business logic
 */

import { randomUUID } from 'node:crypto';

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { secureLogger } from '@/lib/logging/secure-logger';
import {
	generateManualAccountId,
	normalizeAccountMask,
	sanitizeBankAccountData,
	validateAccountMask,
	validateBankAccountForInsert,
	validateBankAccountForUpdate,
} from '@/lib/validation/bank-accounts-validator';
import type { AppEnv } from '@/server/hono-types';
import {
	authMiddleware,
	userRateLimitMiddleware,
} from '@/server/middleware/auth';

// =====================================================
// Validation Schemas
// =====================================================

const createBankAccountSchema = z.object({
	institution_name: z.string().min(1, 'Nome da instituição é obrigatório'),
	account_type: z.enum(['checking', 'savings', 'investment', 'cash'], {
		error: 'Tipo de conta é obrigatório',
	}),
	balance: z.number().default(0),
	currency: z.string().default('BRL'),
	is_primary: z.boolean().default(false),
	is_active: z.boolean().default(true),
	account_mask: z.string().optional(),
	institution_id: z.string().optional(),
});

const updateBankAccountSchema = z.object({
	institution_name: z.string().optional(),
	account_type: z
		.enum(['checking', 'savings', 'investment', 'cash'])
		.optional(),
	balance: z.number().optional(),
	currency: z.string().optional(),
	is_primary: z.boolean().optional(),
	is_active: z.boolean().optional(),
	account_mask: z.string().optional(),
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
		const { user, supabase } = c.get('auth');
		const requestId = c.get('requestId');

		try {
			const { data, error } = await supabase
				.from('bank_accounts')
				.select('*')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false });

			if (error) {
				throw new Error(`Erro ao buscar contas bancárias: ${error.message}`);
			}

			return c.json({
				data: data || [],
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			secureLogger.error('Failed to get bank accounts', {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'BANK_ACCOUNTS_ERROR',
					error: 'Failed to retrieve bank accounts',
				},
				500,
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
		const { user, supabase } = c.get('auth');
		const requestId = c.get('requestId');

		try {
			const { data, error } = await supabase
				.from('bank_accounts')
				.select('balance, currency')
				.eq('user_id', user.id)
				.eq('is_active', true);

			if (error) {
				throw new Error(`Erro ao calcular saldo total: ${error.message}`);
			}

			const totals: Record<string, number> = {};

			if (data) {
				data.forEach((account) => {
					const currency = account.currency || 'BRL';
					totals[currency] =
						(totals[currency] || 0) + Number(account.balance || 0);
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
			secureLogger.error('Failed to get total balance', {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'TOTAL_BALANCE_ERROR',
					error: 'Failed to calculate total balance',
				},
				500,
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
		const { user, supabase } = c.get('auth');
		const accountId = c.req.param('id');
		const requestId = c.get('requestId');

		try {
			const { data, error } = await supabase
				.from('bank_accounts')
				.select('*')
				.eq('id', accountId)
				.eq('user_id', user.id)
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					return c.json(
						{
							code: 'NOT_FOUND',
							error: 'Conta bancária não encontrada',
						},
						404,
					);
				}
				throw new Error(`Erro ao buscar conta bancária: ${error.message}`);
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
		const { user, supabase } = c.get('auth');
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
			const { data: account, error } = await supabase
				.from('bank_accounts')
				.select('balance')
				.eq('id', accountId)
				.eq('user_id', user.id)
				.single();

			if (error || !account) {
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
		const { user, supabase } = c.get('auth');
		const input = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			// Normalize account type
			const normalizedAccountType = normalizeAccountType(input.account_type);

			// Generate account_mask if not provided
			const accountMask = input.account_mask
				? normalizeAccountMask(input.account_mask)
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

			// Generate institution_id if not provided
			const institutionId = input.institution_id || randomUUID();

			// Always generate manual belvo_account_id
			const belvoAccountId = generateManualAccountId();

			// Always set sync_status as manual
			const syncStatus = 'manual';

			// Prepare account data
			const accountData = sanitizeBankAccountData({
				user_id: user.id,
				institution_name: input.institution_name,
				institution_id: institutionId,
				account_type: normalizedAccountType,
				account_mask: accountMask,
				balance: input.balance,
				currency: input.currency.toUpperCase(),
				is_primary: input.is_primary,
				is_active: input.is_active,
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
			const { data: existingAccount } = await supabase
				.from('bank_accounts')
				.select('id')
				.eq('user_id', user.id)
				.eq('institution_id', institutionId)
				.eq('account_mask', accountMask)
				.maybeSingle();

			if (existingAccount) {
				return c.json(
					{
						code: 'CONFLICT',
						error: 'Já existe uma conta com a mesma instituição e final',
					},
					409,
				);
			}

			// Insert into database - assert required fields are present after validation
			const insertData = {
				...accountData,
				account_mask: accountData.account_mask ?? accountMask, // Ensure account_mask is present
				account_type: accountData.account_type ?? normalizedAccountType,
				user_id: user.id,
				institution_name:
					accountData.institution_name ?? input.institution_name,
				institution_id: accountData.institution_id ?? institutionId,
				belvo_account_id: belvoAccountId,
			} as typeof accountData & {
				account_mask: string;
				account_type: string;
				user_id: string;
				institution_name: string;
				institution_id: string;
				belvo_account_id: string;
			};

			const { data, error } = await supabase
				.from('bank_accounts')
				.insert(insertData)
				.select()
				.single();

			if (error) {
				if (error.code === '23505') {
					return c.json(
						{
							code: 'CONFLICT',
							error: 'Já existe uma conta com a mesma instituição e final',
						},
						409,
					);
				}
				throw new Error(`Erro ao criar conta bancária: ${error.message}`);
			}

			secureLogger.info('Bank account created', {
				accountId: data.id,
				institutionName: input.institution_name,
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
			secureLogger.error('Failed to create bank account', {
				error: error instanceof Error ? error.message : 'Unknown error',
				institutionName: input.institution_name,
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'BANK_ACCOUNT_CREATE_ERROR',
					error: 'Failed to create bank account',
				},
				500,
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
		const { user, supabase } = c.get('auth');
		const accountId = c.req.param('id');
		const input = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			// Verify account exists and belongs to user
			const { data: existingAccount, error: fetchError } = await supabase
				.from('bank_accounts')
				.select('id')
				.eq('id', accountId)
				.eq('user_id', user.id)
				.single();

			if (fetchError || !existingAccount) {
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

			if (input.institution_name !== undefined) {
				updateData.institution_name = input.institution_name;
			}

			if (input.account_type !== undefined) {
				updateData.account_type = normalizeAccountType(input.account_type);
			}

			if (input.balance !== undefined) {
				updateData.balance = input.balance;
			}

			if (input.currency !== undefined) {
				updateData.currency = input.currency.toUpperCase();
			}

			if (input.is_primary !== undefined) {
				updateData.is_primary = input.is_primary;
			}

			if (input.is_active !== undefined) {
				updateData.is_active = input.is_active;
			}

			if (input.account_mask !== undefined) {
				const normalizedMask = normalizeAccountMask(input.account_mask);
				if (!validateAccountMask(normalizedMask)) {
					return c.json(
						{
							code: 'BAD_REQUEST',
							error: 'A máscara da conta deve seguir o formato **** 1234',
						},
						400,
					);
				}
				updateData.account_mask = normalizedMask;
			}

			// Sanitize and validate
			const sanitized = sanitizeBankAccountData(updateData);
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

			// Convert null values to undefined for Supabase compatibility
			const updatePayload = Object.fromEntries(
				Object.entries(sanitized).map(([key, value]) => [
					key,
					value === null ? undefined : value,
				]),
			);

			// Update in database
			const { data, error } = await supabase
				.from('bank_accounts')
				.update(updatePayload)
				.eq('id', accountId)
				.eq('user_id', user.id)
				.select()
				.single();

			if (error) {
				throw new Error(`Erro ao atualizar conta bancária: ${error.message}`);
			}

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
		const { user, supabase } = c.get('auth');
		const accountId = c.req.param('id');
		const { balance } = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			const { data, error } = await supabase
				.from('bank_accounts')
				.update({ balance })
				.eq('id', accountId)
				.eq('user_id', user.id)
				.select()
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					return c.json(
						{
							code: 'NOT_FOUND',
							error: 'Conta bancária não encontrada',
						},
						404,
					);
				}
				throw new Error(`Erro ao atualizar saldo: ${error.message}`);
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
		const { user, supabase } = c.get('auth');
		const accountId = c.req.param('id');
		const requestId = c.get('requestId');

		try {
			const { error } = await supabase
				.from('bank_accounts')
				.delete()
				.eq('id', accountId)
				.eq('user_id', user.id);

			if (error) {
				throw new Error(`Erro ao remover conta bancária: ${error.message}`);
			}

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
