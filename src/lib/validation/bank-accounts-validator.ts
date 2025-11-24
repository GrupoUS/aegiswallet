import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { BRAZILIAN_BANKS } from '@/lib/security/financial-validator';

const BANK_ACCOUNT_TYPES = [
  'CHECKING',
  'SAVINGS',
  'INVESTMENT',
  'SALARY',
  'DIGITAL_WALLET',
] as const;

const SYNC_STATUSES = ['pending', 'manual', 'success', 'error'] as const;

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface SanitizedBankAccountInput extends Record<string, unknown> {
  user_id?: string;
  institution_name?: string;
  institution_id?: string;
  account_type?: string;
  account_mask?: string;
  account_holder_name?: string | null;
  account_number?: string | null;
  belvo_account_id?: string | null;
  balance?: number;
  currency?: string;
  is_primary?: boolean;
  is_active?: boolean;
  sync_status?: string;
  sync_error_message?: string | null;
}

const baseInsertSchema = z.object({
  user_id: z.string().min(1, 'Usuário é obrigatório.'),
  institution_name: z.string().min(1, 'Nome da instituição é obrigatório.'),
  institution_id: z.string().min(1, 'ID da instituição é obrigatório.'),
  account_type: z.enum(BANK_ACCOUNT_TYPES),
  account_mask: z.string().min(7, 'Máscara da conta é obrigatória.'),
  account_holder_name: z.string().optional(),
  account_number: z.string().optional(),
  belvo_account_id: z.string().optional(),
  balance: z.number(),
  currency: z.string().default('BRL'),
  is_primary: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

const baseUpdateSchema = z.object({
  institution_name: z.string().optional(),
  institution_id: z.string().optional(),
  account_type: z.enum(BANK_ACCOUNT_TYPES).optional(),
  account_mask: z.string().optional(),
  account_holder_name: z.string().optional(),
  account_number: z.string().optional(),
  belvo_account_id: z.string().optional(),
  balance: z.number().optional(),
  currency: z.string().optional(),
  is_primary: z.boolean().optional(),
  is_active: z.boolean().optional(),
  sync_status: z.enum(SYNC_STATUSES).optional(),
  sync_error_message: z.string().optional(),
});

const allowedKeys = new Set<keyof SanitizedBankAccountInput>([
  'user_id',
  'institution_name',
  'institution_id',
  'account_type',
  'account_mask',
  'account_holder_name',
  'account_number',
  'belvo_account_id',
  'balance',
  'currency',
  'is_primary',
  'is_active',
  'sync_status',
  'sync_error_message',
]);

const MANUAL_PREFIX = 'manual_';

const isValidInstitutionId = (institutionId?: string) => {
  if (!institutionId) return false;
  const trimmed = institutionId.trim();
  if (BRAZILIAN_BANKS.has(trimmed)) {
    return true;
  }
  // Accept UUID-like identifiers for Open Banking integrations
  return /^[0-9a-f-]{8,}$/i.test(trimmed);
};

const isValidCurrency = (currency?: string) => !currency || currency.toUpperCase() === 'BRL';

const isValidBelvoId = (belvoId?: string | null) => {
  if (!belvoId) return true;
  if (belvoId.startsWith(MANUAL_PREFIX)) {
    return true;
  }
  return /^[a-z0-9_-]{6,}$/i.test(belvoId);
};

export const validateAccountMask = (mask?: string | null) => {
  if (!mask) return false;
  return /^\*{4}\s\d{4}$/.test(mask);
};

const collectZodErrors = (issues: z.ZodIssue[]): ValidationError[] =>
  issues.map((issue) => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
  }));

export const sanitizeBankAccountData = (
  account: Record<string, unknown>
): SanitizedBankAccountInput => {
  const sanitized: SanitizedBankAccountInput = {};

  Object.entries(account).forEach(([key, value]) => {
    if (!allowedKeys.has(key as keyof SanitizedBankAccountInput)) {
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') {
        return;
      }

      switch (key) {
        case 'currency':
          sanitized.currency = trimmed.toUpperCase();
          break;
        case 'account_number':
          sanitized.account_number = trimmed.replace(/\s+/g, '');
          break;
        case 'account_mask':
          sanitized.account_mask = trimmed;
          break;
        default:
          sanitized[key as keyof SanitizedBankAccountInput] = trimmed;
      }
      return;
    }

    if (typeof value === 'number') {
      sanitized[key as keyof SanitizedBankAccountInput] = Number(value);
      return;
    }

    sanitized[key as keyof SanitizedBankAccountInput] = value as never;
  });

  return sanitized;
};

export const generateManualAccountId = () => `${MANUAL_PREFIX}${randomUUID()}`;

export const validateBankAccountForInsert = (
  account: SanitizedBankAccountInput
): ValidationResult => {
  const errors: ValidationError[] = [];

  const parsed = baseInsertSchema.safeParse(account);

  if (!parsed.success) {
    errors.push(...collectZodErrors(parsed.error.issues));
    return { valid: false, errors };
  }

  const data = parsed.data;

  if (!validateAccountMask(data.account_mask)) {
    errors.push({
      field: 'account_mask',
      message: 'A máscara deve seguir o formato **** 1234.',
    });
  }

  if (!isValidInstitutionId(data.institution_id)) {
    errors.push({
      field: 'institution_id',
      message: 'Instituição bancária inválida.',
    });
  }

  if (!isValidCurrency(data.currency)) {
    errors.push({
      field: 'currency',
      message: 'Apenas contas em BRL são suportadas no momento.',
    });
  }

  if (!isValidBelvoId(data.belvo_account_id)) {
    errors.push({
      field: 'belvo_account_id',
      message: 'Identificador da conta Belvo inválido.',
    });
  }

  if (Number.isNaN(data.balance)) {
    errors.push({
      field: 'balance',
      message: 'Saldo precisa ser um número válido.',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateBankAccountForUpdate = (
  account: SanitizedBankAccountInput
): ValidationResult => {
  const errors: ValidationError[] = [];

  const parsed = baseUpdateSchema.safeParse(account);

  if (!parsed.success) {
    errors.push(...collectZodErrors(parsed.error.issues));
    return { valid: false, errors };
  }

  const data = parsed.data;

  if (data.account_mask && !validateAccountMask(data.account_mask)) {
    errors.push({
      field: 'account_mask',
      message: 'A máscara deve seguir o formato **** 1234.',
    });
  }

  if (data.institution_id && !isValidInstitutionId(data.institution_id)) {
    errors.push({
      field: 'institution_id',
      message: 'Instituição bancária inválida.',
    });
  }

  if (data.currency && !isValidCurrency(data.currency)) {
    errors.push({
      field: 'currency',
      message: 'Apenas contas em BRL são suportadas.',
    });
  }

  if (data.belvo_account_id && !isValidBelvoId(data.belvo_account_id)) {
    errors.push({
      field: 'belvo_account_id',
      message: 'Identificador da conta Belvo inválido.',
    });
  }

  if (data.balance !== undefined && Number.isNaN(data.balance)) {
    errors.push({
      field: 'balance',
      message: 'Saldo precisa ser um número válido.',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
