/**
 * Natural Language Understanding (NLU) Type Definitions
 * Replaces 'any' types with proper TypeScript interfaces for better type safety
 */

export type IntentType =
  | 'transaction.create'
  | 'transaction.query'
  | 'account.query'
  | 'transfer.money'
  | 'bill.payment'
  | 'investment.query'
  | 'budget.create'
  | 'budget.query'
  | 'unknown';

export interface NLUEntity {
  type: string;
  value: string | number;
  confidence: number;
  startIndex?: number;
  endIndex?: number;
  metadata?: Record<string, unknown>;
}

export interface NLUIntent {
  type: IntentType;
  confidence: number;
  entities: NLUEntity[];
  context?: Record<string, unknown>;
}

export interface IntentSlot {
  name: string;
  type: string;
  required: boolean;
  filled: boolean;
  value?: unknown;
  prompt?: string;
}

export interface TransactionEntity {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  created_at: string;
  user_id: string;
  type: 'income' | 'expense';
}

export interface NLUContext {
  userId: string;
  sessionId: string;
  previousIntents: NLUIntent[];
  currentTransaction?: TransactionEntity;
  userProfile: {
    name?: string;
    preferences?: Record<string, unknown>;
  };
  conversationHistory: {
    timestamp: string;
    userMessage: string;
    systemResponse: string;
    intent?: NLUIntent;
  }[];
}

export interface PatternEvolution {
  pattern: string;
  successRate: number;
  usageCount: number;
  lastUsed: string;
  effectiveness: number;
}

export interface UserAdaptation {
  userId: string;
  patterns: Record<string, number>;
  preferences: Record<string, unknown>;
  adaptationHistory: {
    timestamp: string;
    pattern: string;
    outcome: 'success' | 'failure';
    confidence: number;
  }[];
}

export interface NLUResponse {
  intent: NLUIntent;
  response: string;
  actions: {
    type: string;
    parameters: Record<string, unknown>;
  }[];
  followUpQuestions?: string[];
  confidence: number;
}

export interface NLUEngineConfig {
  modelVersion: string;
  confidenceThreshold: number;
  maxRetries: number;
  timeoutMs: number;
  enableLearning: boolean;
  language: string;
}

export interface FinancialQuery {
  amount?: number;
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  limit?: number;
  offset?: number;
}

export interface TransferRequest {
  amount: number;
  recipient: string;
  recipientType: 'pix' | 'account' | 'contact';
  description?: string;
  scheduledDate?: string;
}

export interface BillPaymentRequest {
  billId: string;
  amount: number;
  dueDate: string;
  paymentMethod: 'pix' | 'account' | 'card';
  autoDebit?: boolean;
}

export interface BudgetRequest {
  category: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: string;
  endDate?: string;
  alerts?: boolean;
}

// Helper functions for type guards
export function isValidIntentType(value: string): value is IntentType {
  const validTypes: IntentType[] = [
    'transaction.create',
    'transaction.query',
    'account.query',
    'transfer.money',
    'bill.payment',
    'investment.query',
    'budget.create',
    'budget.query',
    'unknown',
  ];
  return validTypes.includes(value as IntentType);
}

export function isTransactionEntity(obj: unknown): obj is TransactionEntity {
  const entity = obj as Record<string, unknown>;
  return (
    typeof entity === 'object' &&
    entity !== null &&
    typeof entity.id === 'string' &&
    typeof entity.amount === 'number' &&
    typeof entity.description === 'string' &&
    typeof entity.category === 'string' &&
    typeof entity.date === 'string' &&
    typeof entity.user_id === 'string' &&
    (entity.type === 'income' || entity.type === 'expense')
  );
}

export function isNLUEntity(obj: unknown): obj is NLUEntity {
  const entity = obj as Record<string, unknown>;
  return (
    typeof entity === 'object' &&
    entity !== null &&
    typeof entity.type === 'string' &&
    (typeof entity.value === 'string' || typeof entity.value === 'number') &&
    typeof entity.confidence === 'number' &&
    entity.confidence >= 0 &&
    entity.confidence <= 1
  );
}
