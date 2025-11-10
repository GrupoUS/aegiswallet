import { CalendarDndProvider } from '@dnd-kit/core';
import { Calendar, Edit2, Plus, Trash2 } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { DayView } from './day-view';
import { EnhancedEventCard } from './enhanced-event-card';
import { MonthView } from './month-view';
import type { CalendarEvent, CalendarFilter } from './types';
import { WeekView } from './week-view';

interface CalendarProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventEdit?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export function Calendar({ currentDate, events, onEventEdit, onEventUpdate, onDelete, onEventClick }: CalendarProps) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [filter, setFilter] = useState<CalendarFilter>({
    status: 'all',
    priority: 'all',
    search: '',
  });

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    onEventEdit?.(event);
  }, [onEventEdit]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    onDelete?.(eventId);
  }, [onDelete]);

  const filteredEvents = React.useMemo(() => {
    let filtered = [...events];

    if (filter.status !== 'all') {
      filtered = filtered.filter(event => event.status === filter.status);
    }

    if (filter.priority !== 'all') {
      filtered = filtered.filter(event => event.priority === filter.priority);
    }

    if (filter.search) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(filter.search.toLowerCase()) ||
        event.description.toLowerCase().includes(filter.search.toLowerCase())
      );
    }

    return filtered;
  }, [events, filter]);

  const renderToolbar = () => (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search events..."
          value={filter.search}
          onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))},
          className="px-3 py-2 border rounded-md"
        />
        <select
          value={filter.status}
          onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as CalendarEvent['status'] }))}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={filter.priority}
          onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value as CalendarEvent['priority'] }))}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setView(prev => prev === 'month' ? 'week' : prev === 'week' ? 'day' : 'month')}
        >
          {view === 'month' && <Calendar className="h-4 w-4" />}
          {view === 'week' && <List className="h-4 w-4" />}
          {view === 'day' && <Calendar className="h-4 w-4" />}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            const today = new Date();
            setView('day');
            setCurrentDate(today);
          }}
        >
          Today
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case 'month':
        return (
          <MonthView
            currentDate={currentDate}
            events={filteredEvents}
            onEventEdit={handleEditEvent}
            onEventClick={onEventClick}
          />
        );
      case 'week':
        return (
          <WeekView
            weekStart={currentDate}
            events={filteredEvents}
            onEventEdit={handleEditEvent}
            onEventClick={onEventClick}
          />
        );
      case 'day':
        return (
          <DayView
            currentDate={currentDate}
            events={filteredEvents}
            onEventEdit={handleEditEvent}
            onEventClick={onEventClick}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {renderToolbar()}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
        {editingEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto m-4">
              <CardHeader>
                <CardTitle>Edit Event</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Form would go here */}
                <p className="text-center text-muted-foreground">
                  Event editing form would be implemented here
                </p>
              </CardContent>
              <CardFooter>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingEvent(null)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => setEditingEvent(null)}>
                    Save Changes
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
