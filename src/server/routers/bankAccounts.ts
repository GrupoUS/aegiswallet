import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  generateManualAccountId,
  sanitizeBankAccountData,
  type ValidationError,
  validateBankAccountForInsert,
  validateBankAccountForUpdate,
} from '@/lib/validation/bank-accounts-validator';
import { logError } from '@/server/lib/logger';
import { protectedProcedure, router } from '@/server/trpc-helpers';

const formatValidationErrors = (errors: ValidationError[]) =>
  errors.map((error) => `${error.field}: ${error.message}`).join(', ');

const mapDatabaseError = (error: PostgrestError, defaultMessage: string) => {
  const message = (error.message || '').toLowerCase();

  if (message.includes('duplicate key value')) {
    return new TRPCError({
      code: 'CONFLICT',
      message: 'Já existe uma conta cadastrada com esses dados.',
      cause: error,
    });
  }

  if (message.includes('foreign key constraint')) {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Instituição ou usuário inválido para esta conta bancária.',
      cause: error,
    });
  }

  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: defaultMessage,
    cause: error,
  });
};

const safeLogPayload = (payload: Record<string, unknown>) => {
  if (payload.account_number) {
    return { ...payload, account_number: '[REDACTED]' };
  }
  return payload;
};

const ensureNoDuplicateAccount = async (
  supabaseClient: SupabaseClient,
  params: {
    userId: string;
    institutionId: string;
    accountMask: string;
    excludeAccountId?: string;
  }
) => {
  const { userId, institutionId, accountMask, excludeAccountId } = params;

  const query = supabaseClient
    .from('bank_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('institution_id', institutionId)
    .eq('account_mask', accountMask)
    .limit(1);

  if (excludeAccountId) {
    query.neq('id', excludeAccountId);
  }

  const { data, error } = await query;

  if (error) {
    logError('duplicate_bank_account_check_failed', userId, error, {
      institutionId,
      accountMask,
      excludeAccountId,
    });
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Não foi possível validar duplicidade de contas.',
      cause: error,
    });
  }

  if (data && data.length > 0) {
    throw new TRPCError({
      code: 'CONFLICT',
      message: 'Já existe uma conta cadastrada com a mesma instituição e final.',
    });
  }
};

export const bankAccountsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        institution_name: z.string(),
        institution_id: z.string(),
        account_type: z.string(),
        account_mask: z.string(),
        account_number: z.string().optional(),
        account_holder_name: z.string().optional(),
        belvo_account_id: z.string().optional(),
        balance: z.number().default(0),
        currency: z.string().default('BRL'),
        is_primary: z.boolean().default(false),
        is_active: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user.id;
      const sanitizedInput = sanitizeBankAccountData({
        ...input,
        user_id: userId,
      });

      const validationResult = validateBankAccountForInsert(sanitizedInput);

      if (!validationResult.valid) {
        logError('create_bank_account_validation_failed', userId, new Error('validation_error'), {
          errors: validationResult.errors,
          payload: safeLogPayload(sanitizedInput),
        });
        const errorMessage = formatValidationErrors(validationResult.errors);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Dados inválidos: ${errorMessage}`,
        });
      }

      const isManualAccount = !sanitizedInput.belvo_account_id;
      const belvoAccountId = isManualAccount
        ? generateManualAccountId()
        : (sanitizedInput.belvo_account_id ?? '');
      const syncStatus = isManualAccount ? 'manual' : 'pending';

      if (!sanitizedInput.institution_id || !sanitizedInput.account_mask) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Dados de instituição ou máscara de conta ausentes',
        });
      }

      await ensureNoDuplicateAccount(supabase, {
        userId,
        institutionId: sanitizedInput.institution_id,
        accountMask: sanitizedInput.account_mask,
      });

      const payload = {
        user_id: userId,
        institution_name: sanitizedInput.institution_name ?? '',
        institution_id: sanitizedInput.institution_id,
        account_type: sanitizedInput.account_type ?? '',
        account_mask: sanitizedInput.account_mask,
        account_holder_name: sanitizedInput.account_holder_name ?? null,
        account_number: sanitizedInput.account_number ?? null,
        balance: sanitizedInput.balance ?? 0,
        currency: sanitizedInput.currency ?? 'BRL',
        is_primary: sanitizedInput.is_primary ?? false,
        is_active: sanitizedInput.is_active ?? true,
        belvo_account_id: belvoAccountId,
        sync_status: syncStatus,
        available_balance: sanitizedInput.balance ?? 0,
      };

      const { data, error } = await supabase
        .from('bank_accounts')
        .insert(payload)
        .select()
        .single();

      if (error) {
        logError('create_bank_account_failed', userId, error, {
          payload: safeLogPayload(payload),
        });
        throw mapDatabaseError(error, 'Não foi possível criar a conta bancária.');
      }

      return data;
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user.id;
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', input.id)
        .eq('user_id', userId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete bank account',
          cause: error,
        });
      }

      return { success: true };
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const supabase = ctx.supabase;
    const userId = ctx.user.id;
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch bank accounts',
        cause: error,
      });
    }

    return data;
  }),
  getBalanceHistory: protectedProcedure
    .input(z.object({ accountId: z.string(), days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      if (!input.accountId || input.accountId === 'all') {
        return [];
      }

      const supabase = ctx.supabase;
      const userId = ctx.user.id;
      const { data: account } = await supabase
        .from('bank_accounts')
        .select('balance')
        .eq('id', input.accountId)
        .eq('user_id', userId)
        .single();

      if (!account) return [];

      const currentBalance = Number(account.balance);
      const history = [];

      // Simple mock history: flat line
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
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const supabase = ctx.supabase;
    const userId = ctx.user.id;
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', input.id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Bank account not found',
        cause: error,
      });
    }

    return data;
  }),
  getTotalBalance: protectedProcedure.query(async ({ ctx }) => {
    const supabase = ctx.supabase;
    const userId = ctx.user.id;
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('balance, currency')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch total balance',
        cause: error,
      });
    }

    const totals: Record<string, number> = {};
    if (data) {
      data.forEach((account) => {
        const currency = account.currency || 'BRL';
        totals[currency] = (totals[currency] || 0) + Number(account.balance);
      });
    }

    return totals;
  }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        institution_name: z.string().optional(),
        institution_id: z.string().optional(),
        account_type: z.string().optional(),
        account_mask: z.string().optional(),
        account_holder_name: z.string().optional(),
        account_number: z.string().optional(),
        balance: z.number().optional(),
        currency: z.string().optional(),
        is_primary: z.boolean().optional(),
        is_active: z.boolean().optional(),
        sync_status: z.string().optional(),
        sync_error_message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user.id;
      const { id, ...updates } = input;

      const sanitizedUpdates = sanitizeBankAccountData(updates);
      const validationResult = validateBankAccountForUpdate(sanitizedUpdates);

      if (!validationResult.valid) {
        logError('update_bank_account_validation_failed', userId, new Error('validation_error'), {
          accountId: id,
          errors: validationResult.errors,
        });
        const errorMessage = formatValidationErrors(validationResult.errors);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Dados inválidos: ${errorMessage}`,
        });
      }

      sanitizedUpdates.belvo_account_id = undefined;
      sanitizedUpdates.user_id = undefined;

      if (Object.keys(sanitizedUpdates).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Nenhum campo para atualizar.',
        });
      }

      if (sanitizedUpdates.institution_id || sanitizedUpdates.account_mask) {
        const { data: currentAccount, error: currentAccountError } = await supabase
          .from('bank_accounts')
          .select('institution_id, account_mask')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (currentAccountError) {
          throw new TRPCError({
            code: currentAccountError.code === 'PGRST116' ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
            message:
              currentAccountError.code === 'PGRST116'
                ? 'Conta bancária não encontrada.'
                : 'Não foi possível validar a conta antes da atualização.',
            cause: currentAccountError,
          });
        }

        await ensureNoDuplicateAccount(supabase, {
          userId,
          institutionId: sanitizedUpdates.institution_id ?? currentAccount.institution_id,
          accountMask: sanitizedUpdates.account_mask ?? currentAccount.account_mask,
          excludeAccountId: id,
        });
      }

      const { data, error } = await supabase
        .from('bank_accounts')
        .update(sanitizedUpdates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logError('update_bank_account_failed', userId, error, {
          accountId: id,
          updates: safeLogPayload(sanitizedUpdates),
        });
        throw mapDatabaseError(error, 'Não foi possível atualizar a conta bancária.');
      }

      return data;
    }),
  updateBalance: protectedProcedure
    .input(z.object({ id: z.string(), balance: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const userId = ctx.user.id;
      const { data, error } = await supabase
        .from('bank_accounts')
        .update({ balance: input.balance })
        .eq('id', input.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update balance',
          cause: error,
        });
      }

      return data;
    }),
});
