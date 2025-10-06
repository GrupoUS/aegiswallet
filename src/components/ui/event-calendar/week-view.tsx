import { startOfWeek, addDays, isToday, isWeekend } from 'date-fns'
import { TimeGrid } from './time-grid'
import type { CalendarEvent, WeekDay, TimeSlot } from './types'

interface WeekViewProps {
  weekStart: Date
  events: CalendarEvent[]
  onEventUpdate?: (event: CalendarEvent) => void
  onEventEdit?: (event: CalendarEvent) => void
}

const HOURS: TimeSlot[] = [
  { hour: 8, label: '8 AM' },
  { hour: 9, label: '9 AM' },
  { hour: 10, label: '10 AM' },
  { hour: 11, label: '11 AM' },
  { hour: 12, label: '12 PM' },
  { hour: 13, label: '1 PM' },
  { hour: 14, label: '2 PM' },
  { hour: 15, label: '3 PM' },
  { hour: 16, label: '4 PM' },
  { hour: 17, label: '5 PM' },
  { hour: 18, label: '6 PM' },
  { hour: 19, label: '7 PM' },
]

function getWeekDays(date: Date): WeekDay[] {
  const start = startOfWeek(date, { weekStartsOn: 0 }) // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i)
    return {
      date: day,
      isToday: isToday(day),
      isWeekend: isWeekend(day),
    }
  })
}

export function WeekView({
  weekStart,
  events,
  onEventUpdate,
  onEventEdit,
}: WeekViewProps) {
  const weekDays = getWeekDays(weekStart)

  return (
    <TimeGrid
      weekDays={weekDays}
      hours={HOURS}
      events={events}
      onEventUpdate={onEventUpdate}
      onEventEdit={onEventEdit}
    />
  )
}
