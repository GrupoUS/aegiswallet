/**
 * Bank Accounts tRPC Router
 * Handles all bank account CRUD operations with validation and business logic
 *
 * Note: Currently only supports manual account creation (Belvo/Open Banking integration paused)
 */

import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  generateManualAccountId,
  normalizeAccountMask,
  sanitizeBankAccountData,
  validateAccountMask,
  validateBankAccountForInsert,
  validateBankAccountForUpdate,
} from '@/lib/validation/bank-accounts-validator';
import type { Context } from '@/server/context';
import { protectedProcedure, router } from '@/server/trpc-helpers';

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

/**
 * Check for duplicate accounts by institution_id + account_mask
 */
const checkDuplicate = async (
  supabase: Context['supabase'],
  userId: string,
  institutionId: string,
  accountMask: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('institution_id', institutionId)
    .eq('account_mask', accountMask)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" which is fine
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro ao verificar duplicidade',
      cause: error,
    });
  }

  return !!data;
};

export const bankAccountsRouter = router({
  /**
   * Get all bank accounts for the authenticated user
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar contas bancárias',
        cause: error,
      });
    }

    return data || [];
  }),

  /**
   * Get a specific bank account by ID
   */
  getById: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid('ID inválido'),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Conta bancária não encontrada',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar conta bancária',
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Create a new manual bank account
   * All accounts are created as manual (Belvo/Open Banking integration paused)
   */
  create: protectedProcedure
    .input(
      z.object({
        institution_name: z.string().min(1, 'Nome da instituição é obrigatório'),
        account_type: z.enum(['checking', 'savings', 'investment', 'cash'], {
          required_error: 'Tipo de conta é obrigatório',
        }),
        balance: z.number().default(0),
        currency: z.string().default('BRL'),
        is_primary: z.boolean().default(false),
        is_active: z.boolean().default(true),
        account_mask: z.string().optional(),
        institution_id: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Normalize account type
      const normalizedAccountType = normalizeAccountType(input.account_type);

      // Generate account_mask if not provided
      const accountMask = input.account_mask
        ? normalizeAccountMask(input.account_mask)
        : generateAccountMask();

      // Validate account mask format
      if (!validateAccountMask(accountMask)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'A máscara da conta deve seguir o formato **** 1234',
        });
      }

      // Generate institution_id if not provided
      const institutionId = input.institution_id || randomUUID();

      // Always generate manual belvo_account_id (Belvo/Open Banking paused)
      const belvoAccountId = generateManualAccountId();

      // Always set sync_status as manual (no external sync)
      const syncStatus = 'manual';

      // Prepare account data
      const accountData = sanitizeBankAccountData({
        user_id: ctx.user.id,
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
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: errorMessage,
        });
      }

      // Check for duplicates
      const isDuplicate = await checkDuplicate(
        ctx.supabase,
        ctx.user.id,
        institutionId,
        accountMask
      );

      if (isDuplicate) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Já existe uma conta com a mesma instituição e final',
        });
      }

      // Insert into database
      const { data, error } = await ctx.supabase
        .from('bank_accounts')
        .insert(accountData)
        .select()
        .single();

      if (error) {
        // Check for duplicate key error
        if (error.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Já existe uma conta com a mesma instituição e final',
          });
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar conta bancária',
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Update an existing bank account
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid('ID inválido'),
        institution_name: z.string().optional(),
        account_type: z.enum(['checking', 'savings', 'investment', 'cash']).optional(),
        balance: z.number().optional(),
        currency: z.string().optional(),
        is_primary: z.boolean().optional(),
        is_active: z.boolean().optional(),
        account_mask: z.string().optional(),
        // belvo_account_id is not updatable (always manual)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      // Verify account exists and belongs to user
      const { data: existingAccount, error: fetchError } = await ctx.supabase
        .from('bank_accounts')
        .select('id')
        .eq('id', id)
        .eq('user_id', ctx.user.id)
        .single();

      if (fetchError || !existingAccount) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conta bancária não encontrada',
        });
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {};

      if (updates.institution_name !== undefined) {
        updateData.institution_name = updates.institution_name;
      }

      if (updates.account_type !== undefined) {
        updateData.account_type = normalizeAccountType(updates.account_type);
      }

      if (updates.balance !== undefined) {
        updateData.balance = updates.balance;
      }

      if (updates.currency !== undefined) {
        updateData.currency = updates.currency.toUpperCase();
      }

      if (updates.is_primary !== undefined) {
        updateData.is_primary = updates.is_primary;
      }

      if (updates.is_active !== undefined) {
        updateData.is_active = updates.is_active;
      }

      if (updates.account_mask !== undefined) {
        const normalizedMask = normalizeAccountMask(updates.account_mask);
        if (!validateAccountMask(normalizedMask)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'A máscara da conta deve seguir o formato **** 1234',
          });
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
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: errorMessage,
        });
      }

      // Update in database
      const { data, error } = await ctx.supabase
        .from('bank_accounts')
        .update(sanitized)
        .eq('id', id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar conta bancária',
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Delete a bank account
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid('ID inválido'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('bank_accounts')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.user.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao remover conta bancária',
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * Update only the balance of a bank account
   */
  updateBalance: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid('ID inválido'),
        balance: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('bank_accounts')
        .update({ balance: input.balance })
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Conta bancária não encontrada',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar saldo',
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Get total balance aggregated by currency
   */
  getTotalBalance: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('bank_accounts')
      .select('balance, currency')
      .eq('user_id', ctx.user.id)
      .eq('is_active', true);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao calcular saldo total',
        cause: error,
      });
    }

    const totals: Record<string, number> = {};

    if (data) {
      data.forEach((account) => {
        const currency = account.currency || 'BRL';
        totals[currency] = (totals[currency] || 0) + Number(account.balance || 0);
      });
    }

    return totals;
  }),

  /**
   * Get balance history for a specific account (mock implementation)
   */
  getBalanceHistory: protectedProcedure
    .input(
      z.object({
        accountId: z.string().uuid('ID da conta inválido'),
        days: z.number().int().positive().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!input.accountId || input.accountId === 'all') {
        return [];
      }

      // Get current balance
      const { data: account, error } = await ctx.supabase
        .from('bank_accounts')
        .select('balance')
        .eq('id', input.accountId)
        .eq('user_id', ctx.user.id)
        .single();

      if (error || !account) {
        return [];
      }

      const currentBalance = Number(account.balance || 0);
      const history: Array<{ date: string; balance: number }> = [];

      // Generate mock history (same balance for all days)
      for (let i = 0; i < input.days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        history.push({
          date: date.toISOString(),
          balance: currentBalance,
        });
      }

      return history.reverse();
    }),
});
