/**
 * Financial Event Types
 * Tipos de eventos financeiros para o calendário
 *
 * @deprecated This file is being consolidated with src/types/financial.interfaces.ts
 * Use CalendarFinancialEvent for UI/Calendar specific needs (Date objects)
 * Use FinancialEvent from financial.interfaces.ts for Core/API needs (ISO strings)
 */

import type {
  FinancialEvent as CoreFinancialEvent,
  FinancialEventCategory,
} from './financial.interfaces';

export type FinancialEventType =
  | 'income' // Entrada/Receita
  | 'expense' // Saída/Despesa
  | 'bill' // Conta a pagar
  | 'scheduled' // Pagamento agendado
  | 'transfer'; // Transferência

export type EventColor =
  | 'emerald'
  | 'rose'
  | 'orange'
  | 'blue'
  | 'violet'
  | 'indigo'
  | 'amber'
  | 'red'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'pink'
  | 'teal'
  | 'cyan';

export type EventStatus = 'pending' | 'paid' | 'scheduled' | 'cancelled' | 'completed';

/**
 * Calendar-specific Financial Event interface
 * Extends the Core Financial Event but uses Date objects for start/end
 * and maps specific UI fields.
 */
export interface CalendarFinancialEvent
  extends Omit<
    CoreFinancialEvent,
    'startDate' | 'endDate' | 'status' | 'color' | 'category' | 'allDay' | 'isRecurring'
  > {
  // Calendar specific overrides (Date objects instead of ISO strings)
  start: Date;
  end: Date;

  // UI specific fields
  type: FinancialEventType;
  color: EventColor;
  status: EventStatus;

  // Optional fields from Core that might be used in Calendar
  category?: FinancialEventCategory | string; // Allow string for flexibility or strict category
  account?: string; // Not in Core yet, but used in Calendar
  allDay?: boolean;

  // Recurring and compatibility fields
  isRecurring?: boolean;
  recurring?: boolean; // Alias for isRecurring for backward compatibility

  // Additional fields used in dashboard/list views
  date?: Date; // Alias for start date in some views
  account_id?: string; // Account ID reference
  is_expense?: boolean; // Whether this is an expense (type === 'expense' || type === 'bill')
}

// Re-export as FinancialEvent for backward compatibility during refactor
// TODO: Rename usages to CalendarFinancialEvent and remove this alias
export type FinancialEvent = CalendarFinancialEvent;

/**
 * Helper function to get color for event type
 */
export function getColorForEventType(type: FinancialEventType): EventColor {
  const colorMap: Record<FinancialEventType, EventColor> = {
    bill: 'orange',
    expense: 'rose',
    income: 'emerald',
    scheduled: 'blue',
    transfer: 'violet',
  };
  return colorMap[type];
}

/**
 * Helper function to get icon for event type
 */
export function getIconForEventType(type: FinancialEventType): string {
  const iconMap: Record<FinancialEventType, string> = {
    bill: '📄',
    expense: '💸',
    income: '💰',
    scheduled: '📅',
    transfer: '↔️',
  };
  return iconMap[type];
}

/**
 * Helper function to format event for display
 */
export function formatEventAmount(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(Math.abs(amount));
}
