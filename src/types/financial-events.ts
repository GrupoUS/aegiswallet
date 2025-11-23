/**
 * Financial Event Types
 * Tipos de eventos financeiros para o calendário
 */

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

export interface FinancialEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: FinancialEventType;
  amount: number;
  color: EventColor;
  icon?: string;
  status: EventStatus;
  category?: string;
  account?: string;
  location?: string;
  recurring?: boolean;
  allDay?: boolean;
}

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
