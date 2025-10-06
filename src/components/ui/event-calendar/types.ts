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
  categories?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  search?: string
  status?: string[]
  priority?: string[]
  calendars?: string[]
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
  left: number
  width: number
  height: number
}

export interface TimeSlot {
  date: Date
  hour: number
  minute: number
  events: CalendarEvent[]
}

export interface WeekDay {
  date: Date
  events: CalendarEvent[]
  timeSlots: TimeSlot[]
}

export type CalendarView = 'week' | 'day' | 'month'

// Enhanced types for better calendar functionality
export interface EventPosition {
  top: number
  left: string | number
  height: number
  width: string | number
}

export interface WeekDayExtended {
  date: Date
  isToday: boolean
  isWeekend: boolean
  events: CalendarEvent[]
  timeSlots: TimeSlot[]
}

export interface TimeSlotExtended {
  hour: number
  label: string
  date: Date
  events: CalendarEvent[]
}

// Default calendar categories for AegisWallet
export const DEFAULT_CALENDAR_CATEGORIES: CalendarCategory[] = [
  {
    id: 'bills',
    name: 'Contas',
    color: 'rose',
    icon: '📄',
    description: 'Pagamento de contas e faturas',
  },
  {
    id: 'income',
    name: 'Receitas',
    color: 'emerald',
    icon: '💰',
    description: 'Recebimentos e salários',
  },
  {
    id: 'investments',
    name: 'Investimentos',
    color: 'blue',
    icon: '📈',
    description: 'Aplicações e investimentos',
  },
  {
    id: 'savings',
    name: 'Economias',
    color: 'violet',
    icon: '🏦',
    description: 'Poupança e reservas',
  },
  {
    id: 'expenses',
    name: 'Despesas',
    color: 'orange',
    icon: '💳',
    description: 'Gastos e despesas do dia a dia',
  },
  {
    id: 'personal',
    name: 'Pessoal',
    color: 'indigo',
    icon: '👤',
    description: 'Compromissos e eventos pessoais',
  },
]

export interface EventPosition {
  top: number
  left: string
  height: number
  width: string
}

export interface WeekDay {
  date: Date
  isToday: boolean
  isWeekend: boolean
}

export interface TimeSlot {
  hour: number
  label: string
}
