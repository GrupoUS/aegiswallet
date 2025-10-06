import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { EnhancedEventCard } from './enhanced-event-card'
import type { CalendarEvent } from './types'

interface MonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventEdit?: (event: CalendarEvent) => void
  onEventClick?: (event: CalendarEvent) => void
  onEventUpdate?: (event: CalendarEvent) => void
}

export function MonthView({ currentDate, events, onEventEdit, onEventClick }: MonthViewProps) {
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentDate])

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.start), day))
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="flex-1 bg-background">
      {/* Week days header */}
      <div className="grid grid-cols-7 border-b border">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="p-2 text-center text-sm font-medium text-muted-foreground border-r border last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days grid */}
      <div className="grid grid-cols-7 flex-1">
        {monthDays.map((day, dayIndex) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={dayIndex}
              className={cn(
                'min-h-[100px] border-r border-b border p-1 overflow-hidden',
                !isCurrentMonth && 'bg-muted/30',
                isToday && 'bg-primary/5',
                dayIndex % 7 === 6 && 'border-r-0',
                dayIndex >= monthDays.length - 7 && 'border-b-0'
              )}
            >
              {/* Day number */}
              <div
                className={cn(
                  'text-sm font-medium mb-1 px-1',
                  !isCurrentMonth && 'text-muted-foreground',
                  isToday && 'text-primary font-bold'
                )}
              >
                {format(day, 'd')}
              </div>

              {/* Events for this day */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <EnhancedEventCard
                    key={event.id}
                    event={event}
                    variant="compact"
                    onClick={() => onEventClick?.(event)}
                    onEdit={() => onEventEdit?.(event)}
                    className="text-xs py-0.5 px-1"
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1 py-0.5">
                    +{dayEvents.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
