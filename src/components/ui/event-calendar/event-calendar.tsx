import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DayView } from './day-view';
import { MonthView } from './month-view';
import type { CalendarEvent } from './types';
import { WeekView } from './week-view';

type CalendarView = 'month' | 'week' | 'day';

export interface EventCalendarProps {
  events: CalendarEvent[];
  initialDate?: Date;
  initialView?: CalendarView;
  onEventAdd?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventEdit?: (event: CalendarEvent) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export function EventCalendar({
  events,
  initialDate = new Date(),
  initialView = 'month',
  onEventAdd: _onEventAdd,
  onEventUpdate: _onEventUpdate,
  onEventEdit,
  onEventClick,
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [view, setView] = useState<CalendarView>(initialView);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CalendarEvent['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | CalendarEvent['priority']>('all');

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
          />
        );
    }
  };

  return (
    <section className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
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
      <div className="flex-1 overflow-hidden rounded-lg border bg-background">{renderView()}</div>
    </section>
  );
}
