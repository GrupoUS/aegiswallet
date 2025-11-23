/**
 * Voice Response Type Definitions
 *
 * Provides TypeScript strict mode compliant interfaces for all voice response data structures.
 * This replaces the use of 'any' type in VoiceResponse component with properly typed unions.
 */

// ============================================================================
// Base Voice Response Types
// ============================================================================

export interface BaseVoiceResponse {
  /** Timestamp when the response was generated */
  timestamp: string;
  /** Unique identifier for tracking */
  id: string;
  /** Response metadata */
  metadata?: {
    source: string;
    confidence?: number;
    processingTime?: number;
  };
}

// ============================================================================
// Specific Response Type Interfaces
// ============================================================================

export interface BalanceResponseData {
  currentBalance: number;
  income?: number;
  expenses?: number;
  accountType?: string;
  currency?: string;
  lastUpdated?: string;
}

export interface BudgetResponseData {
  available: number;
  total: number;
  spent: number;
  spentPercentage: number;
  category?: string;
  period?: string;
  currency?: string;
}

export interface BillItem {
  name: string;
  amount: number;
  dueDate: string | Date;
  isPastDue?: boolean;
  status?: 'pending' | 'paid' | 'overdue';
  category?: string;
}

export interface BillsResponseData {
  bills: BillItem[];
  totalAmount: number;
  pastDueCount: number;
  currency?: string;
  period?: string;
}

export interface IncomeItem {
  source: string;
  amount: number;
  expectedDate: string | Date;
  confirmed?: boolean;
  category?: string;
  recurring?: boolean;
}

export interface IncomingResponseData {
  incoming: IncomeItem[];
  totalExpected: number;
  nextIncome?: {
    source: string;
    amount: number;
    date: string | Date;
  };
  currency?: string;
  period?: string;
}

export interface ProjectionResponseData {
  projectedBalance: number;
  currentBalance: number;
  expectedIncome: number;
  expectedExpenses: number;
  variation: number;
  period: string;
  currency?: string;
  confidence?: number;
}

export interface TransferResponseData {
  recipient: string;
  amount: number;
  method: string;
  estimatedTime?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId?: string;
  currency?: string;
  fees?: number;
}

export interface SuccessResponseData {
  message: string;
  action?: string;
  details?: string;
  duration?: number;
}

export interface ErrorResponseData {
  message: string;
  code?: string;
  details?: string;
  recoverable?: boolean;
  suggestedActions?: string[];
}

// ============================================================================
// Discriminated Union Type for All Voice Responses
// ============================================================================

export type VoiceResponseType =
  | 'success'
  | 'error'
  | 'balance'
  | 'budget'
  | 'bills'
  | 'incoming'
  | 'projection'
  | 'transfer';

export type VoiceResponseData =
  | { type: 'success'; data: SuccessResponseData }
  | { type: 'error'; data: ErrorResponseData }
  | { type: 'balance'; data: BalanceResponseData }
  | { type: 'budget'; data: BudgetResponseData }
  | { type: 'bills'; data: BillsResponseData }
  | { type: 'incoming'; data: IncomingResponseData }
  | { type: 'projection'; data: ProjectionResponseData }
  | { type: 'transfer'; data: TransferResponseData };

// ============================================================================
// Component Props Interface
// ============================================================================

export interface TypedVoiceResponseProps {
  type: VoiceResponseType;
  message: string;
  data?: VoiceResponseData[keyof VoiceResponseData];
  className?: string;
  timestamp?: string;
  accessibility?: {
    'aria-live'?: 'polite' | 'assertive' | 'off';
    'aria-atomic'?: boolean;
    role?: string;
  };
}

// ============================================================================
// Type Guards and Validators
// ============================================================================

export function isBalanceResponse(data: unknown): data is BalanceResponseData {
  const d = data as BalanceResponseData;
  return (
    typeof d === 'object' &&
    d !== null &&
    typeof d.currentBalance === 'number' &&
    !Number.isNaN(d.currentBalance)
  );
}

export function isBudgetResponse(data: unknown): data is BudgetResponseData {
  const d = data as BudgetResponseData;
  return (
    typeof d === 'object' &&
    d !== null &&
    typeof d.available === 'number' &&
    typeof d.total === 'number' &&
    typeof d.spent === 'number' &&
    typeof d.spentPercentage === 'number'
  );
}

export function isBillsResponse(data: unknown): data is BillsResponseData {
  const d = data as BillsResponseData;
  return (
    typeof d === 'object' &&
    d !== null &&
    Array.isArray(d.bills) &&
    typeof d.totalAmount === 'number' &&
    typeof d.pastDueCount === 'number'
  );
}

export function isIncomingResponse(data: unknown): data is IncomingResponseData {
  const d = data as IncomingResponseData;
  return (
    typeof d === 'object' &&
    d !== null &&
    Array.isArray(d.incoming) &&
    typeof d.totalExpected === 'number'
  );
}

export function isProjectionResponse(data: unknown): data is ProjectionResponseData {
  const d = data as ProjectionResponseData;
  return (
    typeof d === 'object' &&
    d !== null &&
    typeof d.projectedBalance === 'number' &&
    typeof d.currentBalance === 'number' &&
    typeof d.variation === 'number' &&
    typeof d.period === 'string'
  );
}

export function isTransferResponse(data: unknown): data is TransferResponseData {
  const d = data as TransferResponseData;
  return (
    typeof d === 'object' &&
    d !== null &&
    typeof d.recipient === 'string' &&
    typeof d.amount === 'number' &&
    typeof d.method === 'string' &&
    ['pending', 'processing', 'completed', 'failed'].includes(d.status)
  );
}

export function isSuccessResponse(data: unknown): data is SuccessResponseData {
  const d = data as SuccessResponseData;
  return typeof d === 'object' && d !== null && typeof d.message === 'string';
}

export function isErrorResponse(data: unknown): data is ErrorResponseData {
  const d = data as ErrorResponseData;
  return typeof d === 'object' && d !== null && typeof d.message === 'string';
}

// ============================================================================
// Utility Functions for Safe Type Handling
// ============================================================================

export function getResponseDataType(type: VoiceResponseType) {
  switch (type) {
    case 'success':
      return 'SuccessResponseData' as const;
    case 'error':
      return 'ErrorResponseData' as const;
    case 'balance':
      return 'BalanceResponseData' as const;
    case 'budget':
      return 'BudgetResponseData' as const;
    case 'bills':
      return 'BillsResponseData' as const;
    case 'incoming':
      return 'IncomingResponseData' as const;
    case 'projection':
      return 'ProjectionResponseData' as const;
    case 'transfer':
      return 'TransferResponseData' as const;
    default: {
      const _exhaustiveCheck: never = type;
      return _exhaustiveCheck;
    }
  }
}

export function createDefaultResponseData(type: VoiceResponseType) {
  switch (type) {
    case 'success':
      return { message: 'Operação concluída com sucesso' } as SuccessResponseData;
    case 'error':
      return { message: 'Ocorreu um erro', recoverable: false } as ErrorResponseData;
    case 'balance':
      return { currentBalance: 0 } as BalanceResponseData;
    case 'budget':
      return { available: 0, spent: 0, spentPercentage: 0, total: 0 } as BudgetResponseData;
    case 'bills':
      return { bills: [], pastDueCount: 0, totalAmount: 0 } as BillsResponseData;
    case 'incoming':
      return { incoming: [], totalExpected: 0 } as IncomingResponseData;
    case 'projection':
      return {
        currentBalance: 0,
        expectedExpenses: 0,
        expectedIncome: 0,
        period: 'mensal',
        projectedBalance: 0,
        variation: 0,
      } as ProjectionResponseData;
    case 'transfer':
      return {
        amount: 0,
        method: 'pix',
        recipient: '',
        status: 'pending' as const,
      } as TransferResponseData;
    default: {
      const _exhaustiveCheck: never = type;
      return _exhaustiveCheck;
    }
  }
}

// ============================================================================
// Legacy Compatibility (for gradual migration)
// ============================================================================

/**
 * @deprecated Use TypedVoiceResponseProps instead
 */
export type VoiceResponseProps = TypedVoiceResponseProps;

/**
 * @deprecated Use specific response types instead
 */
export type LegacyVoiceResponseData =
  | SuccessResponseData
  | ErrorResponseData
  | BalanceResponseData
  | BudgetResponseData
  | BillsResponseData
  | IncomingResponseData
  | ProjectionResponseData
  | TransferResponseData;
