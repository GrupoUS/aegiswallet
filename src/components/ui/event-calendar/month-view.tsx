import { format, isSameDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { EnhancedEventCard } from './enhanced-event-card';
import type { CalendarEvent } from './types';

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onEventEdit?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  onNavigate?: (date: Date) => void;
  onEventAdd?: (date: Date) => void;
  className?: string;
}

export function MonthView({
  currentDate,
  events,
  onEventClick,
  onEventEdit,
  onEventDelete,
  onNavigate,
  onEventAdd,
  className,
}: MonthViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const weeks = useMemo(() => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const start = new Date(startOfMonth);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(endOfMonth);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const days: Date[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const chunked: Date[][] = [];
    for (let index = 0; index < days.length; index += 7) {
      chunked.push(days.slice(index, index + 7));
    }

    return chunked;
  }, [currentDate]);

  const getDayEvents = (date: Date) => {
    return events.filter((event) => isSameDay(new Date(event.start), date));
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onNavigate?.(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onNavigate?.(newDate);
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-lg">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <table className="w-full border-collapse" aria-label="Calendário mensal">
        <thead>
          <tr>
            {WEEK_DAYS.map((day) => (
              <th
                key={day}
                scope="col"
                className="px-2 py-2 text-center font-medium text-muted-foreground text-sm"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0].toISOString()}>
              {week.map((date) => {
                const dayEvents = getDayEvents(date);
                const isCurrentMonth = isSameMonth(date, currentDate);
                const isToday = isSameDay(date, new Date());
                const isSelected = selectedDate !== null && isSameDay(date, selectedDate);
                const dayLabel = format(date, "d 'de' MMMM yyyy", { locale: ptBR });

                return (
                  <td key={date.toISOString()} className="p-1 align-top">
                    {/* biome-ignore lint/a11y/noStaticElementInteractions: Calendar cell interaction */}
                    <div
                      tabIndex={0}
                      onDoubleClick={() => onEventAdd?.(date)}
                      className={cn(
                        'min-h-[100px] rounded bg-background p-1 text-left focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background',
                        !isCurrentMonth && 'text-muted-foreground/50',
                        isToday && 'bg-primary/5',
                        isSelected && 'ring-2 ring-primary'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        onFocus={() => setSelectedDate(date)}
                        className="mb-1 inline-flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={`Selecionar ${dayLabel}`}
                        aria-current={isToday ? 'date' : undefined}
                      >
                        {format(date, 'd')}
                      </button>

                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <EnhancedEventCard
                            key={event.id}
                            event={event}
                            variant="compact"
                            onClick={onEventClick}
                            onEdit={onEventEdit}
                            onDelete={onEventDelete}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="px-1 text-muted-foreground text-xs">
                            +{dayEvents.length - 3} eventos
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
