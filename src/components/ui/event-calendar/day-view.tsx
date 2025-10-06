import { addHours, endOfDay, format, isSameDay, startOfDay } from 'date-fns'
import { useMemo } from 'react'
import { EnhancedEventCard } from './enhanced-event-card'
import type { CalendarEvent } from './types'

interface DayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventEdit?: (event: CalendarEvent) => void
  onEventClick?: (event: CalendarEvent) => void
}

export function DayView({ currentDate, events, onEventEdit, onEventClick }: DayViewProps) {
  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i)
  }, [])

  const dayEvents = useMemo(() => {
    const dayStart = startOfDay(currentDate)
    const dayEnd = endOfDay(currentDate)

    return events.filter((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      return (
        isSameDay(eventStart, currentDate) ||
        isSameDay(eventEnd, currentDate) ||
        (eventStart <= dayEnd && eventEnd >= dayStart)
      )
    })
  }, [currentDate, events])

  const getEventsForHour = (hour: number) => {
    return dayEvents.filter((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      const hourStart = addHours(startOfDay(currentDate), hour)
      const hourEnd = addHours(hourStart, 1)

      return (
        (eventStart >= hourStart && eventStart < hourEnd) ||
        (eventEnd > hourStart && eventEnd <= hourEnd) ||
        (eventStart <= hourStart && eventEnd >= hourEnd)
      )
    })
  }

  return (
    <div className="flex-1 bg-background">
      {/* Header with current date */}
      <div className="border-b border p-4 bg-background">
        <div className="text-lg font-semibold">
          {format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
        <div className="text-sm text-muted-foreground">
          {dayEvents.length} evento{dayEvents.length !== 1 ? 's' : ''} hoje
        </div>
      </div>

      {/* Hours grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {hours.map((hour) => {
            const hourEvents = getEventsForHour(hour)
            const hourStart = addHours(startOfDay(currentDate), hour)

            return (
              <div key={hour} className="flex border-b border min-h-[60px]">
                {/* Hour label */}
                <div className="w-20 p-2 text-sm text-muted-foreground border-r border bg-muted/30">
                  {format(hourStart, 'HH:mm')}
                </div>

                {/* Events container */}
                <div className="flex-1 relative p-1">
                  {hourEvents.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                      <div className="w-full h-px bg-border/50" />
                    </div>
                  )}

                  {hourEvents.map((event) => (
                    <div key={event.id} className="mb-1">
                      <EnhancedEventCard
                        event={event}
                        variant="detailed"
                        onClick={() => onEventClick?.(event)}
                        onEdit={() => onEventEdit?.(event)}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
