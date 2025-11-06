import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { EventCard } from './event-card';
import type { CalendarEvent, EventPosition, TimeSlot, WeekDay } from './types';

interface TimeGridProps {
  weekDays: WeekDay[];
  hours: TimeSlot[];
  events: CalendarEvent[];
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventEdit?: (event: CalendarEvent) => void;
}

const HOUR_HEIGHT = 60; // pixels per hour
const START_HOUR = 8;

function calculateEventPosition(
  event: CalendarEvent,
  dayIndex: number,
  weekDays: WeekDay[]
): EventPosition | null {
  // Find which day this event belongs to
  const eventDay = weekDays.findIndex((day) => isSameDay(day.date, event.start));

  if (eventDay !== dayIndex) return null;

  // Calculate position
  const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
  const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
  const startOffset = startMinutes - START_HOUR * 60;
  const duration = endMinutes - startMinutes;

  // Skip events outside visible hours
  if (startOffset < 0 || startOffset > 12 * 60) return null;

  return {
    top: (startOffset / 60) * HOUR_HEIGHT,
    left: `${(dayIndex / 7) * 100}%`,
    height: (duration / 60) * HOUR_HEIGHT,
    width: `${(1 / 7) * 100}%`,
  };
}

export function TimeGrid({ weekDays, hours, events, onEventEdit }: TimeGridProps) {
  return (
    <div className="flex-1 overflow-auto">
      {/* Header with days */}
      <div className="sticky top-0 z-20 grid grid-cols-8 border-b bg-background">
        <div className="col-span-1 border-r p-3 text-muted-foreground text-xs">GMT-3</div>
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={cn('col-span-1 border-r p-3 text-center', day.isToday && 'bg-primary/5')}
          >
            <div className="text-muted-foreground text-xs">{format(day.date, 'EEE')}</div>
            <div className={cn('mt-1 font-semibold text-lg', day.isToday && 'text-primary')}>
              {format(day.date, 'dd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="relative">
        {/* Background grid */}
        {hours.map((timeSlot) => (
          <div
            key={timeSlot.hour}
            className="grid grid-cols-8 border-b"
            style={{ height: `${HOUR_HEIGHT}px` }}
          >
            {/* Hour label */}
            <div className="col-span-1 border-r p-2 text-muted-foreground text-xs">
              {timeSlot.label}
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={cn('col-span-1 border-r', day.isToday && 'bg-primary/5')}
              />
            ))}
          </div>
        ))}

        {/* Events layer */}
        <div className="pointer-events-none absolute inset-0" style={{ left: `${(1 / 8) * 100}%` }}>
          {weekDays.map((_, dayIndex) => (
            <div key={dayIndex}>
              {events.map((event) => {
                const position = calculateEventPosition(event, dayIndex, weekDays);
                if (!position) return null;

                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    position={position}
                    onEdit={onEventEdit}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
