import { useState } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { CalendarHeader } from './calendar-header'
import { WeekView } from './week-view'
import type { CalendarEvent, CalendarView } from './types'

interface EventCalendarProps {
  events: CalendarEvent[]
  initialView?: CalendarView
  onEventAdd?: (event: CalendarEvent) => void
  onEventUpdate?: (event: CalendarEvent) => void
  onEventDelete?: (eventId: string) => void
  onEventEdit?: (event: CalendarEvent) => void
}

export function EventCalendar({
  events,
  initialView = 'week',
  onEventUpdate,
  onEventEdit,
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view] = useState<CalendarView>(initialView)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event
    const draggedEvent = active.data.current as CalendarEvent

    if (draggedEvent && onEventUpdate) {
      // TODO: Calculate new time based on drop position
      onEventUpdate(draggedEvent)
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full bg-background">
        <CalendarHeader
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          view={view}
          onNewEvent={() => {
            // TODO: Open dialog to create new event
            console.log('Create new event')
          }}
        />

        {view === 'week' && (
          <WeekView
            weekStart={currentDate}
            events={events}
            onEventUpdate={onEventUpdate}
            onEventEdit={onEventEdit}
          />
        )}
      </div>
    </DndContext>
  )
}
