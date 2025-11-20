import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarDndProvider } from './calendar-dnd-provider';
import { DayView } from './day-view';
import { MonthView } from './month-view';
import type { CalendarEvent } from './types';
import { WeekView } from './week-view';

type CalendarView = 'month' | 'week' | 'day';

function DraggableNewEvent() {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'new-event-source',
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
      }
    : undefined;

  return (
    <Button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      variant="secondary"
      size="sm"
      className="cursor-grab active:cursor-grabbing"
    >
      + Novo Evento
    </Button>
  );
}

export interface EventCalendarProps {
  events: CalendarEvent[];
  initialDate?: Date;
  initialView?: CalendarView;
  onEventAdd?: (event: Partial<CalendarEvent>) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventEdit?: (event: CalendarEvent) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export function EventCalendar({
  events,
  initialDate = new Date(),
  initialView = 'month',
  onEventAdd,
  onEventUpdate,
  onEventEdit,
  onEventClick,
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [view, setView] = useState<CalendarView>(initialView);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CalendarEvent['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | CalendarEvent['priority']>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const normalizedSearch = search.trim().toLowerCase();
      if (normalizedSearch) {
        const titleMatch = event.title.toLowerCase().includes(normalizedSearch);
        const descriptionMatch = event.description?.toLowerCase().includes(normalizedSearch);
        if (!titleMatch && !descriptionMatch) {
          return false;
        }
      }

      if (statusFilter !== 'all' && event.status !== statusFilter) {
        return false;
      }

      if (priorityFilter !== 'all' && event.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [events, priorityFilter, search, statusFilter]);

  const handleEventEdit = useCallback(
    (event: CalendarEvent) => {
      onEventEdit?.(event);
    },
    [onEventEdit]
  );

  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      onEventClick?.(event);
    },
    [onEventClick]
  );

  // DnD Handlers
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over) {
        // Handle New Event Creation via Drag
        if (active.id === 'new-event-source') {
          const newDateString = over.id as string;
          const newDate = new Date(newDateString);
          if (!Number.isNaN(newDate.getTime())) {
            // Default to 09:00 AM if checking just date
            // But if over.id is just date string (YYYY-MM-DD), time is 00:00
            // Set default duration 1 hour
            // If in day view, newDate might have time.
            onEventAdd?.({
              start: newDate,
              end: new Date(newDate.getTime() + 60 * 60 * 1000),
              allDay: view === 'month',
            });
          }
          return;
        }

        if (active.id !== over.id) {
          const draggedEventId = active.id as string;
          const draggedEvent = events.find((e) => e.id === draggedEventId);

          if (draggedEvent) {
            const newDateString = over.id as string;
            const newDate = new Date(newDateString);

            if (!Number.isNaN(newDate.getTime())) {
              const timeDiff = newDate.getTime() - draggedEvent.start.getTime();

              const updatedEvent = {
                ...draggedEvent,
                start: new Date(draggedEvent.start.getTime() + timeDiff),
                end: new Date(draggedEvent.end.getTime() + timeDiff),
              };

              onEventUpdate?.(updatedEvent);
            }
          }
        }
      }
    },
    [events, onEventUpdate, onEventAdd, view]
  );

  const renderView = () => {
    switch (view) {
      case 'week':
        return (
          <WeekView weekStart={currentDate} events={filteredEvents} onEventEdit={handleEventEdit} />
        );
      case 'day':
        return (
          <DayView
            currentDate={currentDate}
            events={filteredEvents}
            onEventEdit={handleEventEdit}
            onEventClick={handleEventClick}
          />
        );
      default:
        return (
          <MonthView
            currentDate={currentDate}
            events={filteredEvents}
            onEventEdit={handleEventEdit}
            onEventClick={handleEventClick}
            onEventAdd={(date: Date) => onEventAdd?.({ start: date, end: date, allDay: true })}
            onEventUpdate={onEventUpdate}
          />
        );
    }
  };

  return (
    <CalendarDndProvider>
      <section className="flex h-full flex-col gap-4">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex flex-wrap items-center gap-3">
            {/* New Event Draggable Button */}
            <DraggableNewEvent />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar eventos..."
              className="w-full max-w-xs"
            />
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={statusFilter ?? 'all'}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'all' | CalendarEvent['status'])
              }
            >
              <option value="all">Todos os status</option>
              <option value="confirmed">Confirmados</option>
              <option value="tentative">Pendentes</option>
              <option value="cancelled">Cancelados</option>
            </select>
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={priorityFilter ?? 'all'}
              onChange={(event) =>
                setPriorityFilter(event.target.value as 'all' | CalendarEvent['priority'])
              }
            >
              <option value="all">Todas prioridades</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
            <div className="ml-auto flex gap-2">
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('month')}
              >
                Mês
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                Semana
              </Button>
              <Button
                variant={view === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('day')}
              >
                Dia
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Hoje
              </Button>
            </div>
          </div>

          {/* Dnd Context Wrapper for cross-view drag */}
          <div className="flex-1 overflow-hidden rounded-lg border bg-background">
            {renderView()}
          </div>
        </DndContext>
      </section>
    </CalendarDndProvider>
  );
}
