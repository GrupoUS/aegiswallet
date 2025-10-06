import { useState } from 'react'
import { CalendarDndProvider } from './calendar-dnd-provider'
import { CalendarHeader } from './calendar-header'
import { DayView } from './day-view'
import { EventDialog } from './event-dialog'
import { MonthView } from './month-view'
import type { CalendarEvent, CalendarView } from './types'
import { WeekView } from './week-view'

interface EventCalendarProps {
  events: CalendarEvent[]
  initialView?: CalendarView
  onEventAdd?: (event: Partial<CalendarEvent>) => void
  onEventUpdate?: (event: CalendarEvent) => void
  onEventEdit?: (event: CalendarEvent) => void
}

export function EventCalendar({
  events,
  initialView = 'week',
  onEventAdd,
  onEventUpdate,
  onEventEdit,
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>(initialView)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogInitialDate, setDialogInitialDate] = useState<Date | undefined>()
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const handleNewEvent = () => {
    setEditingEvent(null)
    setDialogInitialDate(currentDate)
    setIsDialogOpen(true)
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setIsDialogOpen(true)
  }

  const handleSaveEvent = (eventData: Partial<CalendarEvent>) => {
    if (editingEvent && onEventUpdate) {
      // Update existing event
      onEventUpdate({
        ...editingEvent,
        ...eventData,
      } as CalendarEvent)
    } else if (onEventAdd) {
      // Create new event
      onEventAdd({
        ...eventData,
        id: `event-${Date.now()}`,
      })
    }
  }

  return (
    <CalendarDndProvider onEventUpdate={onEventUpdate || (() => {})}>
      <div className="flex flex-col h-full bg-background">
        <CalendarHeader
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          view={view}
          onViewChange={setView}
          onNewEvent={handleNewEvent}
        />

        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onEventUpdate={onEventUpdate}
            onEventEdit={onEventEdit || handleEditEvent}
          />
        )}

        {view === 'week' && (
          <WeekView
            weekStart={currentDate}
            events={events}
            onEventUpdate={onEventUpdate}
            onEventEdit={onEventEdit || handleEditEvent}
          />
        )}

        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events}
            onEventUpdate={onEventUpdate}
            onEventEdit={onEventEdit || handleEditEvent}
          />
        )}
      </div>

      <EventDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveEvent}
        event={editingEvent}
        initialDate={dialogInitialDate}
      />
    </CalendarDndProvider>
  )
}
