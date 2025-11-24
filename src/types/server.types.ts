/**
 * Server-side Type Definitions for AegisWallet
 * Replaces 'any' types in tRPC procedures, middleware, and server utilities
 * LGPD-compliant server interfaces with proper error handling
 */

import { z } from 'zod';
import type {
  BoletoFormData,
  FinancialEventFormData,
  LGPDUserProfile,
  PIXTransferFormData,
  PaymentRuleFormData,
} from './financial.interfaces';

// =============================================================================
// TROUT CONTEXT INTERFACES
// =============================================================================

/**
 * tRPC Context interface for server-side procedures
 */
export interface TRPCContext {
  user?: LGPDUserProfile;
  sessionId?: string;
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  permissions: UserPermissions;
  rateLimitInfo?: RateLimitInfo;
}

/**
 * User permissions for context
 */
export interface UserPermissions {
  canCreateTransactions: boolean;
  canViewTransactions: boolean;
  canCreateTransfers: boolean;
  canViewTransfers: boolean;
  canManageBankAccounts: boolean;
  canManagePaymentRules: boolean;
  canUseVoiceCommands: boolean;
  autonomyLevel: number; // 50-95%
  transactionLimit: number;
  dailyTransferLimit: number;
  monthlyTransferLimit: number;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// =============================================================================
// TROUT PROCEDURE INPUT/OUTPUT INTERFACES
// =============================================================================

/**
 * Base procedure input interface
 */
export interface BaseProcedureInput {
  sessionId?: string;
  clientTimestamp?: string;
  requestId?: string;
}

/**
 * Financial Event procedure inputs
 */
export interface CreateFinancialEventInput extends BaseProcedureInput {
  eventData: FinancialEventFormData;
}

export interface UpdateFinancialEventInput extends BaseProcedureInput {
  eventId: string;
  eventData: Partial<FinancialEventFormData>;
}

export interface GetFinancialEventsInput extends BaseProcedureInput {
  filters?: {
    category?: string;
    dateRange?: {
      start: string;
      end: string;
    };
    status?: string;
    isIncome?: boolean;
    search?: string;
  };
  pagination?: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export interface DeleteFinancialEventInput extends BaseProcedureInput {
  eventId: string;
  reason?: string;
}

/**
 * PIX Transfer procedure inputs
 */
export interface CreatePIXTransferInput extends BaseProcedureInput {
  transferData: PIXTransferFormData;
  confirmationMethod?: 'BIOMETRIC' | 'PIN' | 'OTP' | 'PUSH';
}

export interface GetPIXTransfersInput extends BaseProcedureInput {
  filters?: {
    status?: string;
    dateRange?: {
      start: string;
      end: string;
    };
    recipientName?: string;
    minAmount?: number;
    maxAmount?: number;
  };
  pagination?: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export interface ConfirmPIXTransferInput extends BaseProcedureInput {
  transferId: string;
  confirmationCode?: string;
  biometricData?: string;
}

/**
 * Boleto procedure inputs
 */
export interface CreateBoletoInput extends BaseProcedureInput {
  boletoData: BoletoFormData;
  captureMethod?: 'CAMERA' | 'MANUAL' | 'VOICE';
}

export interface GetBoletosInput extends BaseProcedureInput {
  filters?: {
    status?: string;
    dateRange?: {
      start: string;
      end: string;
    };
    payeeName?: string;
    isOverdue?: boolean;
  };
  pagination?: {
    limit?: number;
    offset?: number;
    sortBy?: 'dueDate' | 'amount' | 'payeeName';
    sortOrder?: 'asc' | 'desc';
  };
}

export interface PayBoletoInput extends BaseProcedureInput {
  boletoId: string;
  paymentMethod?: 'PIX' | 'ACCOUNT' | 'CREDIT_CARD';
  scheduledDate?: string;
}

/**
 * Payment Rule procedure inputs
 */
export interface CreatePaymentRuleInput extends BaseProcedureInput {
  ruleData: PaymentRuleFormData;
}

export interface UpdatePaymentRuleInput extends BaseProcedureInput {
  ruleId: string;
  ruleData: Partial<PaymentRuleFormData>;
}

export interface GetPaymentRulesInput extends BaseProcedureInput {
  filters?: {
    category?: string;
    payeeType?: string;
    isActive?: boolean;
  };
  pagination?: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

/**
 * Bank Account procedure inputs
 */
export interface GetBankAccountsInput extends BaseProcedureInput {
  includeBalance?: boolean;
  includeTransactions?: boolean;
  limit?: number;
}

export interface SyncBankAccountInput extends BaseProcedureInput {
  accountId: string;
  forceSync?: boolean;
}

/**
 * Voice Command procedure inputs
 */
export interface ProcessVoiceCommandInput extends BaseProcedureInput {
  audioData?: string; // Base64 encoded audio
  commandText?: string;
  sessionId: string;
  language?: string;
  requireConfirmation?: boolean;
}

export interface GetVoiceHistoryInput extends BaseProcedureInput {
  sessionId?: string;
  limit?: number;
  offset?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}

// =============================================================================
// PROCEDURE OUTPUT INTERFACES
// =============================================================================

/**
 * Standard procedure output with metadata
 */
export interface ProcedureOutput<T = unknown> {
  success: boolean;
  data?: T;
  error?: ProcedureError;
  metadata?: ProcedureMetadata;
}

/**
 * Paginated procedure output
 */
export interface PaginatedProcedureOutput<T = unknown> extends ProcedureOutput<T[]> {
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Procedure error interface
 */
export interface ProcedureError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
  userFriendly?: string;
  lgpdCompliant?: boolean;
}

/**
 * Procedure metadata
 */
export interface ProcedureMetadata {
  requestId: string;
  timestamp: string;
  processingTime: number; // milliseconds
  rateLimit?: RateLimitInfo;
  warnings?: string[];
  audit?: AuditInfo;
}

/**
 * Audit information
 */
export interface AuditInfo {
  action: string;
  resourceType: string;
  resourceId?: string;
  userId: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  success: boolean;
  changes?: Record<string, { old?: unknown; new?: unknown }>;
}

// =============================================================================
// MIDDLEWARE INTERFACES
// =============================================================================

/**
 * Security middleware input
 */
export interface SecurityMiddlewareInput {
  type: 'auth' | 'transaction' | 'transfer' | 'voice' | 'data_access';
  requiresAuth: boolean;
  rateLimitKey?: string;
  maxAttempts?: number;
  windowMs?: number;
  requiresBiometric?: boolean;
  requiresOTP?: boolean;
  sensitiveOperation?: boolean;
}

/**
 * Rate limiting middleware interface
 */
export interface RateLimitMiddlewareConfig {
  keyGenerator?: (ctx: TRPCContext) => string;
  customResponse?: (limitInfo: RateLimitInfo) => string;
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

/**
 * Authentication middleware interface
 */
export interface AuthMiddlewareConfig {
  required: boolean;
  allowGuest?: boolean;
  requireBiometric?: boolean;
  requireOTP?: boolean;
  sessionTimeout?: number;
  refreshSession?: boolean;
}

/**
 * Logging middleware interface
 */
export interface LoggingMiddlewareConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
  sanitizeSensitiveData?: boolean;
  customFields?: Record<string, (ctx: TRPCContext) => unknown>;
}

// =============================================================================
// VALIDATION SCHEMAS (Zod)
// =============================================================================

/**
 * Base procedure input schema
 */
export const BaseProcedureInputSchema = z.object({
  clientTimestamp: z.string().datetime().optional(),
  requestId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
});

/**
 * Financial Event procedure schemas
 */
export const CreateFinancialEventInputSchema = BaseProcedureInputSchema.extend({
  eventData: z.object({
    allDay: z.boolean(),
    amount: z.number().positive(),
    attachments: z.array(z.string()).optional(),
    brazilianEventType: z.string().optional(),
    category: z.string(),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isIncome: z.boolean(),
    isRecurring: z.boolean(),
    location: z.string().optional(),
    notes: z.string().optional(),
    priority: z.string(),
    recurrenceRule: z.string().optional(),
    startDate: z.string().datetime(),
    tags: z.array(z.string()).optional(),
    title: z.string().min(1),
  }),
});

export const UpdateFinancialEventInputSchema = BaseProcedureInputSchema.extend({
  eventData: z
    .object({
      allDay: z.boolean().optional(),
      amount: z.number().positive().optional(),
      attachments: z.array(z.string()).optional(),
      brazilianEventType: z.string().optional(),
      category: z.string().optional(),
      description: z.string().optional(),
      dueDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      isIncome: z.boolean().optional(),
      isRecurring: z.boolean().optional(),
      location: z.string().optional(),
      notes: z.string().optional(),
      priority: z.string().optional(),
      recurrenceRule: z.string().optional(),
      startDate: z.string().datetime().optional(),
      tags: z.array(z.string()).optional(),
      title: z.string().min(1).optional(),
    })
    .partial(),
  eventId: z.string().uuid(),
});

export const GetFinancialEventsInputSchema = BaseProcedureInputSchema.extend({
  filters: z
    .object({
      category: z.string().optional(),
      dateRange: z
        .object({
          end: z.string().datetime(),
          start: z.string().datetime(),
        })
        .optional(),
      isIncome: z.boolean().optional(),
      search: z.string().optional(),
      status: z.string().optional(),
    })
    .optional(),
  pagination: z
    .object({
      limit: z.number().positive().max(100).optional(),
      offset: z.number().nonnegative().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    })
    .optional(),
});

export const DeleteFinancialEventInputSchema = BaseProcedureInputSchema.extend({
  eventId: z.string().uuid(),
  reason: z.string().optional(),
});

/**
 * PIX Transfer procedure schemas
 */
export const CreatePIXTransferInputSchema = BaseProcedureInputSchema.extend({
  confirmationMethod: z.enum(['BIOMETRIC', 'PIN', 'OTP', 'PUSH']).optional(),
  transferData: z.object({
    amount: z.number().positive(),
    description: z.string().optional(),
    pixKey: z.string().min(1),
    pixKeyType: z.enum(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM_KEY']),
    recipientName: z.string().min(1),
    requiresConfirmation: z.boolean(),
    scheduledDate: z.string().datetime().optional(),
  }),
});

export const GetPIXTransfersInputSchema = BaseProcedureInputSchema.extend({
  filters: z
    .object({
      dateRange: z
        .object({
          end: z.string().datetime(),
          start: z.string().datetime(),
        })
        .optional(),
      maxAmount: z.number().positive().optional(),
      minAmount: z.number().positive().optional(),
      recipientName: z.string().optional(),
      status: z.string().optional(),
    })
    .optional(),
  pagination: z
    .object({
      limit: z.number().positive().max(100).optional(),
      offset: z.number().nonnegative().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    })
    .optional(),
});

export const ConfirmPIXTransferInputSchema = BaseProcedureInputSchema.extend({
  biometricData: z.string().optional(),
  confirmationCode: z.string().optional(),
  transferId: z.string().uuid(),
});

/**
 * Boleto procedure schemas
 */
export const CreateBoletoInputSchema = BaseProcedureInputSchema.extend({
  boletoData: z.object({
    amount: z.number().positive(),
    autoSchedulePayment: z.boolean().optional(),
    barcode: z.string().optional(),
    description: z.string().optional(),
    digitableLine: z.string().optional(),
    dueDate: z.string().datetime(),
    payeeName: z.string().min(1),
  }),
  captureMethod: z.enum(['CAMERA', 'MANUAL', 'VOICE']).optional(),
}).refine((data) => data.boletoData.barcode || data.boletoData.digitableLine, {
  message: 'Código de barras ou linha digitável é obrigatório',
  path: ['boletoData.barcode'],
});

export const GetBoletosInputSchema = BaseProcedureInputSchema.extend({
  filters: z
    .object({
      dateRange: z
        .object({
          end: z.string().datetime(),
          start: z.string().datetime(),
        })
        .optional(),
      isOverdue: z.boolean().optional(),
      payeeName: z.string().optional(),
      status: z.string().optional(),
    })
    .optional(),
  pagination: z
    .object({
      limit: z.number().positive().max(100).optional(),
      offset: z.number().nonnegative().optional(),
      sortBy: z.enum(['dueDate', 'amount', 'payeeName']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    })
    .optional(),
});

export const PayBoletoInputSchema = BaseProcedureInputSchema.extend({
  boletoId: z.string().uuid(),
  paymentMethod: z.enum(['PIX', 'ACCOUNT', 'CREDIT_CARD']).optional(),
  scheduledDate: z.string().datetime().optional(),
});

/**
 * Payment Rule procedure schemas
 */
export const CreatePaymentRuleInputSchema = BaseProcedureInputSchema.extend({
  ruleData: z.object({
    autonomyLevel: z.number().min(50).max(95),
    category: z.string().optional(),
    description: z.string().optional(),
    maxAmount: z.number().positive(),
    payeeKey: z.string().optional(),
    payeeName: z.string().min(1),
    payeeType: z.enum(['MERCHANT', 'PERSON', 'INSTITUTION', 'UTILITY']),
    preferredTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    tolerancePercentage: z.number().min(0).max(100).optional(),
  }),
});

export const UpdatePaymentRuleInputSchema = BaseProcedureInputSchema.extend({
  ruleData: z
    .object({
      autonomyLevel: z.number().min(50).max(95).optional(),
      category: z.string().optional(),
      description: z.string().optional(),
      maxAmount: z.number().positive().optional(),
      payeeKey: z.string().optional(),
      payeeName: z.string().min(1).optional(),
      payeeType: z.enum(['MERCHANT', 'PERSON', 'INSTITUTION', 'UTILITY']).optional(),
      preferredTime: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional(),
      tolerancePercentage: z.number().min(0).max(100).optional(),
    })
    .partial(),
  ruleId: z.string().uuid(),
});

export const GetPaymentRulesInputSchema = BaseProcedureInputSchema.extend({
  filters: z
    .object({
      category: z.string().optional(),
      isActive: z.boolean().optional(),
      payeeType: z.string().optional(),
    })
    .optional(),
  pagination: z
    .object({
      limit: z.number().positive().max(100).optional(),
      offset: z.number().nonnegative().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    })
    .optional(),
});

/**
 * Voice Command procedure schemas
 */
export const ProcessVoiceCommandInputSchema = BaseProcedureInputSchema.extend({
  audioData: z.string().optional(),
  commandText: z.string().optional(),
  language: z.string().default('pt-BR'),
  requireConfirmation: z.boolean().default(false),
  sessionId: z.string().uuid(),
}).refine((data) => data.audioData || data.commandText, {
  message: 'Dados de áudio ou texto do comando são obrigatórios',
  path: ['audioData'],
});

export const GetVoiceHistoryInputSchema = BaseProcedureInputSchema.extend({
  dateRange: z
    .object({
      end: z.string().datetime(),
      start: z.string().datetime(),
    })
    .optional(),
  limit: z.number().positive().max(100).optional(),
  offset: z.number().nonnegative().optional(),
  sessionId: z.string().uuid().optional(),
});

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extract input types from schemas
 */
export type CreateFinancialEventInputType = z.infer<typeof CreateFinancialEventInputSchema>;
export type UpdateFinancialEventInputType = z.infer<typeof UpdateFinancialEventInputSchema>;
export type GetFinancialEventsInputType = z.infer<typeof GetFinancialEventsInputSchema>;
export type DeleteFinancialEventInputType = z.infer<typeof DeleteFinancialEventInputSchema>;

export type CreatePIXTransferInputType = z.infer<typeof CreatePIXTransferInputSchema>;
export type GetPIXTransfersInputType = z.infer<typeof GetPIXTransfersInputSchema>;
export type ConfirmPIXTransferInputType = z.infer<typeof ConfirmPIXTransferInputSchema>;

export type CreateBoletoInputType = z.infer<typeof CreateBoletoInputSchema>;
export type GetBoletosInputType = z.infer<typeof GetBoletosInputSchema>;
export type PayBoletoInputType = z.infer<typeof PayBoletoInputSchema>;

export type CreatePaymentRuleInputType = z.infer<typeof CreatePaymentRuleInputSchema>;
export type UpdatePaymentRuleInputType = z.infer<typeof UpdatePaymentRuleInputSchema>;
export type GetPaymentRulesInputType = z.infer<typeof GetPaymentRulesInputSchema>;

export type ProcessVoiceCommandInputType = z.infer<typeof ProcessVoiceCommandInputSchema>;
export type GetVoiceHistoryInputType = z.infer<typeof GetVoiceHistoryInputSchema>;

/**
 * Generic procedure handler type
 */
export type ProcedureHandler<TInput, TOutput = unknown> = (
  input: TInput,
  ctx: TRPCContext
) => Promise<ProcedureOutput<TOutput>>;

/**
 * Protected procedure handler type
 */
export type ProtectedProcedureHandler<TInput, TOutput = unknown> = (
  input: TInput,
  ctx: TRPCContext & { user: LGPDUserProfile }
) => Promise<ProcedureOutput<TOutput>>;

// =============================================================================
// ERROR CODES ENUMS
// =============================================================================

/**
 * Standard error codes for procedures
 */
export enum ProcedureErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Business logic errors
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TRANSFER_LIMIT_EXCEEDED = 'TRANSFER_LIMIT_EXCEEDED',
  INVALID_RECIPIENT = 'INVALID_RECIPIENT',
  DUPLICATE_TRANSACTION = 'DUPLICATE_TRANSACTION',

  // System errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // LGPD compliance errors
  DATA_RETENTION_POLICY = 'DATA_RETENTION_POLICY',
  CONSENT_REQUIRED = 'CONSENT_REQUIRED',
  DATA_ANONYMIZATION_REQUIRED = 'DATA_ANONYMIZATION_REQUIRED',

  // Voice processing errors
  SPEECH_RECOGNITION_FAILED = 'SPEECH_RECOGNITION_FAILED',
  VOICE_COMMAND_NOT_UNDERSTOOD = 'VOICE_COMMAND_NOT_UNDERSTOOD',
  AUDIO_QUALITY_LOW = 'AUDIO_QUALITY_LOW',
}

/**
 * Security event types
 */
export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  SUSPICIOUS_LOGIN = 'SUSPICIOUS_LOGIN',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  ACCOUNT_LOCKOUT = 'ACCOUNT_LOCKOUT',
  TRANSFER_INITIATED = 'TRANSFER_INITIATED',
  LARGE_TRANSACTION = 'LARGE_TRANSACTION',
  UNUSUAL_LOCATION = 'UNUSUAL_LOCATION',
  MULTIPLE_FAILED_ATTEMPTS = 'MULTIPLE_FAILED_ATTEMPTS',
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard functions for runtime validation
 */
export function isTRPCContext(obj: unknown): obj is TRPCContext {
  const ctx = obj as Record<string, unknown>;
  return (
    typeof ctx === 'object' &&
    ctx !== null &&
    typeof ctx.requestId === 'string' &&
    typeof ctx.timestamp === 'string' &&
    typeof ctx.permissions === 'object' &&
    ctx.permissions !== null
  );
}

export function isProcedureError(obj: unknown): obj is ProcedureError {
  const error = obj as Record<string, unknown>;
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof error.code === 'string' &&
    typeof error.message === 'string' &&
    typeof error.timestamp === 'string'
  );
}

export function isValidProcedureErrorCode(code: string): code is ProcedureErrorCode {
  return Object.values(ProcedureErrorCode).includes(code as ProcedureErrorCode);
}

export function isValidSecurityEventType(type: string): type is SecurityEventType {
  return Object.values(SecurityEventType).includes(type as SecurityEventType);
}
