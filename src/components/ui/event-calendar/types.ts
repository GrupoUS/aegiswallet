// Event Calendar Types
export type EventColor = 'emerald' | 'rose' | 'orange' | 'blue' | 'violet' | 'indigo' | 'amber'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  color: EventColor
  allDay?: boolean
}

export type CalendarView = 'week' | 'day' | 'month'

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
