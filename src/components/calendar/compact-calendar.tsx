/**
 * Compact Calendar Component
 * Mini calendário para dashboard com indicadores de eventos
 */

import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import type { FinancialEvent } from '@/types/financial-events'
import { useCalendar } from './calendar-context'

interface CompactCalendarProps {
  selectedDate?: Date
  onDateClick?: (date: Date) => void
  className?: string
}

export function CompactCalendar({ selectedDate, onDateClick, className }: CompactCalendarProps) {
  const { currentDate, setCurrentDate, getEventsForMonth } = useCalendar()

  const eventsInMonth = getEventsForMonth(currentDate)

  const getEventsForDay = (date: Date): FinancialEvent[] => {
    return eventsInMonth.filter((event) => isSameDay(new Date(event.start), date))
  }

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      if (onDateClick) {
        onDateClick(date)
      }
    }
  }

  return (
    <div className={className}>
      <div className="text-sm font-semibold text-center mb-2">
        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
      </div>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleSelect}
        month={currentDate}
        onMonthChange={setCurrentDate}
        className={cn('rounded-md [--cell-size:1.75rem]')}
        components={{
          DayButton: ({ day, ...props }) => {
            const dayEvents = getEventsForDay(day.date)
            const hasEvents = dayEvents.length > 0

            return (
              <button
                {...props}
                className={cn(
                  props.className,
                  'relative flex flex-col items-center justify-center text-xs'
                )}
              >
                <span>{day.date.getDate()}</span>
                {hasEvents && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          'w-1 h-1 rounded-full',
                          event.color === 'emerald' && 'bg-emerald-500',
                          event.color === 'rose' && 'bg-rose-500',
                          event.color === 'orange' && 'bg-orange-500',
                          event.color === 'blue' && 'bg-blue-500',
                          event.color === 'violet' && 'bg-violet-500'
                        )}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          },
        }}
      />
    </div>
  )
}
