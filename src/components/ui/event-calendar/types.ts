// Event Calendar Types
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

export interface EventColorStyles {
  dot: string;
  subtleBg: string;
  border: string;
  text: string;
}

const successStyles: EventColorStyles = {
  border: 'border-success',
  dot: 'bg-success',
  subtleBg: 'bg-success/15',
  text: 'text-success',
};

const destructiveStyles: EventColorStyles = {
  border: 'border-destructive',
  dot: 'bg-destructive',
  subtleBg: 'bg-destructive/15',
  text: 'text-destructive',
};

const warningStyles: EventColorStyles = {
  border: 'border-warning',
  dot: 'bg-warning',
  subtleBg: 'bg-warning/15',
  text: 'text-warning',
};

const infoStyles: EventColorStyles = {
  border: 'border-info',
  dot: 'bg-info',
  subtleBg: 'bg-info/15',
  text: 'text-info',
};

const accentStyles: EventColorStyles = {
  border: 'border-accent',
  dot: 'bg-accent',
  subtleBg: 'bg-accent/15',
  text: 'text-accent',
};

const primaryStyles: EventColorStyles = {
  border: 'border-primary',
  dot: 'bg-primary',
  subtleBg: 'bg-primary/15',
  text: 'text-primary',
};

const pixPrimaryStyles: EventColorStyles = {
  border: 'border-pix-primary',
  dot: 'bg-pix-primary',
  subtleBg: 'bg-pix-primary/15',
  text: 'text-pix-primary',
};

const pixAccentStyles: EventColorStyles = {
  border: 'border-pix-accent',
  dot: 'bg-pix-accent',
  subtleBg: 'bg-pix-accent/15',
  text: 'text-pix-accent',
};

export const EVENT_COLOR_STYLES: Record<EventColor, EventColorStyles> = {
  amber: warningStyles,
  blue: infoStyles,
  cyan: pixAccentStyles,
  emerald: successStyles,
  green: successStyles,
  indigo: primaryStyles,
  orange: warningStyles,
  pink: accentStyles,
  purple: accentStyles,
  red: destructiveStyles,
  rose: destructiveStyles,
  teal: pixPrimaryStyles,
  violet: accentStyles,
  yellow: warningStyles,
};

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  color: EventColor;
  allDay?: boolean;
  category?: CalendarCategory;
  calendar?: string;
  location?: string;
  attendees?: string[];
  priority?: 'low' | 'medium' | 'high';
  status?: 'confirmed' | 'tentative' | 'cancelled';
  recurring?: boolean;
  recurrenceRule?: string;
  externalSource?: 'google' | 'other';
  syncStatus?: 'synced' | 'pending' | 'error' | 'conflict';
  icon?: React.ReactNode;
}

export interface CalendarCategory {
  id: string;
  name: string;
  color: EventColor;
  icon?: string;
  description?: string;
}

export interface CalendarFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  status?: string[];
  priority?: string[];
  calendars?: string[];
  categories?: string[];
}

export interface CalendarSettings {
  defaultView: CalendarView;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  timeFormat: '12h' | '24h';
  timezone: string;
  showWeekends: boolean;
  showWeekNumbers: boolean;
}

export interface EventPosition {
  top: number;
  left: string;
  width: string;
  height: number;
}

export interface TimeSlot {
  hour: number;
  label: string;
}

export interface WeekDay {
  date: Date;
  isToday: boolean;
  isWeekend: boolean;
}

export type CalendarView = 'week' | 'day' | 'month';

export const DEFAULT_CALENDAR_CATEGORIES: CalendarCategory[] = [
  {
    color: 'rose',
    description: 'Pagamento de contas e faturas',
    icon: '??',
    id: 'bills',
    name: 'Contas',
  },
  {
    color: 'emerald',
    description: 'Recebimentos e salarios',
    icon: '??',
    id: 'income',
    name: 'Receitas',
  },
  {
    color: 'blue',
    description: 'Aplicacoes e investimentos',
    icon: '??',
    id: 'investments',
    name: 'Investimentos',
  },
  {
    color: 'violet',
    description: 'Poupanca e reservas',
    icon: '??',
    id: 'savings',
    name: 'Economias',
  },
  {
    color: 'orange',
    description: 'Gastos e despesas do dia a dia',
    icon: '??',
    id: 'expenses',
    name: 'Despesas',
  },
  {
    color: 'indigo',
    description: 'Compromissos e eventos pessoais',
    icon: '??',
    id: 'personal',
    name: 'Pessoal',
  },
];
