/**
 * Type Guards Utility - AegisWallet Quality Control
 *
 * Provides type-safe validation functions to replace dangerous non-null assertions
 * and ensure runtime type safety throughout the application.
 *
 * @version 1.0.0
 * @since 2025-11-19
 */

import type { CalendarEvent } from '@/components/ui/event-calendar/types';
import type { FinancialEvent } from '@/types';

/**
 * Generic non-null type guard
 * Replaces dangerous non-null assertions (!) with safe type narrowing
 *
 * @param value - Value to check for null/undefined
 * @returns Type predicate indicating value is not null or undefined
 *
 * @example
 * ```typescript
 * const result = someNullableValue;
 * if (isNonNull(result)) {
 *   // TypeScript now knows result is not null/undefined
 *   console.log(result.toString());
 * }
 * ```
 */
export function isNonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for valid calendar events
 * Ensures calendar event has required properties for safe rendering
 *
 * @param event - Potential calendar event object
 * @returns Type predicate for valid CalendarEvent
 *
 * @example
 * ```typescript
 * if (isValidCalendarEvent(event)) {
 *   // Safe to access calendar event properties
 *   renderEvent(event.title, event.start, event.end);
 * }
 * ```
 */
export function isValidCalendarEvent(event: unknown): event is CalendarEvent {
  if (!event || typeof event !== 'object') {
    return false;
  }

  const e = event as Record<string, unknown>;

  // Required properties for calendar events
  return (
    typeof e.id === 'string' &&
    typeof e.title === 'string' &&
    (e.start instanceof Date || typeof e.start === 'string') &&
    (e.end instanceof Date || typeof e.end === 'string') &&
    typeof e.allDay === 'boolean'
  );
}

/**
 * Type guard for valid financial events
 * Ensures financial event has required properties for safe financial operations
 *
 * @param event - Potential financial event object
 * @returns Type predicate for valid FinancialEvent
 *
 * @example
 * ```typescript
 * if (isValidFinancialEvent(event)) {
 *   // Safe to perform financial calculations
 *   processTransaction(event.amount, event.category);
 * }
 * ```
 */
export function isValidFinancialEvent(event: unknown): event is FinancialEvent {
  if (!event || typeof event !== 'object') {
    return false;
  }

  const e = event as Record<string, unknown>;

  // Required properties for financial events
  return (
    typeof e.id === 'string' &&
    typeof e.amount === 'number' &&
    typeof e.description === 'string' &&
    (e.date instanceof Date || typeof e.date === 'string') &&
    typeof e.category === 'string' &&
    typeof e.type === 'string'
  );
}

/**
 * Type guard for PIX key validation
 * Ensures PIX key has required properties for safe payment operations
 *
 * @param pixKey - Potential PIX key object
 * @returns Type predicate for valid PIX key
 *
 * @LGPD This function handles sensitive financial data - ensure proper encryption
 */
export function isValidPixKey(pixKey: unknown): pixKey is {
  id: string;
  key_type: string;
  key_value: string;
  label?: string;
  is_active?: boolean;
  is_favorite?: boolean;
} {
  if (!pixKey || typeof pixKey !== 'object') {
    return false;
  }

  const key = pixKey as Record<string, unknown>;

  return (
    typeof key.id === 'string' &&
    typeof key.key_type === 'string' &&
    typeof key.key_value === 'string' &&
    (key.label === undefined || typeof key.label === 'string') &&
    (key.is_active === undefined || typeof key.is_active === 'boolean') &&
    (key.is_favorite === undefined || typeof key.is_favorite === 'boolean')
  );
}

/**
 * Type guard for user profile validation
 * Ensures user object has required properties for authentication
 *
 * @param user - Potential user object
 * @returns Type predicate for valid user profile
 */
export function isValidUser(user: unknown): user is {
  id: string;
  email: string;
  name?: string;
  role?: string;
} {
  if (!user || typeof user !== 'object') {
    return false;
  }

  const u = user as Record<string, unknown>;

  return (
    typeof u.id === 'string' &&
    typeof u.email === 'string' &&
    (u.name === undefined || typeof u.name === 'string') &&
    (u.role === undefined || typeof u.role === 'string')
  );
}

/**
 * Type guard for bank account validation
 * Ensures bank account has required properties for financial operations
 *
 * @param account - Potential bank account object
 * @returns Type predicate for valid bank account
 *
 * @LGPD This function handles sensitive financial data - ensure proper encryption
 */
export function isValidBankAccount(account: unknown): account is {
  id: string;
  account_number: string;
  account_type: string;
  balance?: number;
  available_balance?: number;
  is_primary?: boolean;
} {
  if (!account || typeof account !== 'object') {
    return false;
  }

  const acc = account as Record<string, unknown>;

  return (
    typeof acc.id === 'string' &&
    typeof acc.account_number === 'string' &&
    typeof acc.account_type === 'string' &&
    (acc.balance === undefined || typeof acc.balance === 'number') &&
    (acc.available_balance === undefined || typeof acc.available_balance === 'number') &&
    (acc.is_primary === undefined || typeof acc.is_primary === 'boolean')
  );
}

/**
 * Type guard for transaction validation
 * Ensures transaction has required properties for financial tracking
 *
 * @param transaction - Potential transaction object
 * @returns Type predicate for valid transaction
 */
export function isValidTransaction(transaction: unknown): transaction is {
  id: string;
  amount: number;
  description: string;
  date: string | Date;
  category: string;
  type: 'income' | 'expense' | 'transfer';
  account_id?: string;
} {
  if (!transaction || typeof transaction !== 'object') {
    return false;
  }

  const tx = transaction as Record<string, unknown>;

  return (
    typeof tx.id === 'string' &&
    typeof tx.amount === 'number' &&
    typeof tx.description === 'string' &&
    (tx.date instanceof Date || typeof tx.date === 'string') &&
    typeof tx.category === 'string' &&
    (tx.type === 'income' || tx.type === 'expense' || tx.type === 'transfer') &&
    (tx.account_id === undefined || typeof tx.account_id === 'string')
  );
}

/**
 * Generic array type guard
 * Ensures all elements in array pass the provided type guard
 *
 * @param arr - Array to validate
 * @param guard - Type guard function to apply to each element
 * @returns Type predicate for valid array of specified type
 *
 * @example
 * ```typescript
 * if (isValidArray(events, isValidCalendarEvent)) {
 *   // events is now typed as CalendarEvent[]
 *   events.forEach(event => console.log(event.title));
 * }
 * ```
 */
export function isValidArray<T>(arr: unknown, guard: (item: unknown) => item is T): arr is T[] {
  return Array.isArray(arr) && arr.every(guard);
}

/**
 * Safe property accessor with type guard
 * Provides safe access to object properties with type validation
 *
 * @param obj - Object to access
 * @param key - Property key
 * @param guard - Type guard for the property value
 * @returns The property value if valid, undefined otherwise
 *
 * @example
 * ```typescript
 * const amount = getSafeProperty(event, 'amount', (v): v is number => typeof v === 'number');
 * if (amount !== undefined) {
 *   // amount is guaranteed to be a number
 *   console.log(amount * 2);
 * }
 * ```
 */
export function getSafeProperty<T>(
  obj: unknown,
  key: string,
  guard: (value: unknown) => value is T
): T | undefined {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  const value = (obj as Record<string, unknown>)[key];
  return guard(value) ? value : undefined;
}
