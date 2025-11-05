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
  | 'cyan'

export interface EventColorStyles {
  dot: string
  subtleBg: string
  border: string
  text: string
}

const successStyles: EventColorStyles = {
  dot: 'bg-success',
  subtleBg: 'bg-success/15',
  border: 'border-success',
  text: 'text-success',
}

const destructiveStyles: EventColorStyles = {
  dot: 'bg-destructive',
  subtleBg: 'bg-destructive/15',
  border: 'border-destructive',
  text: 'text-destructive',
}

const warningStyles: EventColorStyles = {
  dot: 'bg-warning',
  subtleBg: 'bg-warning/15',
  border: 'border-warning',
  text: 'text-warning',
}

const infoStyles: EventColorStyles = {
  dot: 'bg-info',
  subtleBg: 'bg-info/15',
  border: 'border-info',
  text: 'text-info',
}

const accentStyles: EventColorStyles = {
  dot: 'bg-accent',
  subtleBg: 'bg-accent/15',
  border: 'border-accent',
  text: 'text-accent',
}

const primaryStyles: EventColorStyles = {
  dot: 'bg-primary',
  subtleBg: 'bg-primary/15',
  border: 'border-primary',
  text: 'text-primary',
}

const pixPrimaryStyles: EventColorStyles = {
  dot: 'bg-pix-primary',
  subtleBg: 'bg-pix-primary/15',
  border: 'border-pix-primary',
  text: 'text-pix-primary',
}

const pixAccentStyles: EventColorStyles = {
  dot: 'bg-pix-accent',
  subtleBg: 'bg-pix-accent/15',
  border: 'border-pix-accent',
  text: 'text-pix-accent',
}

export const EVENT_COLOR_STYLES: Record<EventColor, EventColorStyles> = {
  emerald: successStyles,
  rose: destructiveStyles,
  orange: warningStyles,
  blue: infoStyles,
  violet: accentStyles,
  indigo: primaryStyles,
  amber: warningStyles,
  red: destructiveStyles,
  green: successStyles,
  yellow: warningStyles,
  purple: accentStyles,
  pink: accentStyles,
  teal: pixPrimaryStyles,
  cyan: pixAccentStyles,
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  color: EventColor
  allDay?: boolean
  category?: CalendarCategory
  calendar?: string
  location?: string
  attendees?: string[]
  priority?: 'low' | 'medium' | 'high'
  status?: 'confirmed' | 'tentative' | 'cancelled'
  recurring?: boolean
  recurrenceRule?: string
}

export interface CalendarCategory {
  id: string
  name: string
  color: EventColor
  icon?: string
  description?: string
}

export interface CalendarFilter {
  dateRange?: {
    start: Date
    end: Date
  }
  search?: string
  status?: string[]
  priority?: string[]
  calendars?: string[]
  categories?: string[]
}

export interface CalendarSettings {
  defaultView: CalendarView
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
  timeFormat: '12h' | '24h'
  timezone: string
  showWeekends: boolean
  showWeekNumbers: boolean
}

export interface EventPosition {
  top: number
  left: string
  width: string
  height: number
}

export interface TimeSlot {
  hour: number
  label: string
}

export interface WeekDay {
  date: Date
  isToday: boolean
  isWeekend: boolean
}

export type CalendarView = 'week' | 'day' | 'month'

export const DEFAULT_CALENDAR_CATEGORIES: CalendarCategory[] = [
  {
    id: 'bills',
    name: 'Contas',
    color: 'rose',
    icon: '??',
    description: 'Pagamento de contas e faturas',
  },
  {
    id: 'income',
    name: 'Receitas',
    color: 'emerald',
    icon: '??',
    description: 'Recebimentos e salarios',
  },
  {
    id: 'investments',
    name: 'Investimentos',
    color: 'blue',
    icon: '??',
    description: 'Aplicacoes e investimentos',
  },
  {
    id: 'savings',
    name: 'Economias',
    color: 'violet',
    icon: '??',
    description: 'Poupanca e reservas',
  },
  {
    id: 'expenses',
    name: 'Despesas',
    color: 'orange',
    icon: '??',
    description: 'Gastos e despesas do dia a dia',
  },
  {
    id: 'personal',
    name: 'Pessoal',
    color: 'indigo',
    icon: '??',
    description: 'Compromissos e eventos pessoais',
  },
]
