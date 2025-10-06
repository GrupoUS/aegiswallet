import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, useDndMonitor } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { startOfWeek, addDays, addMinutes, differenceInMinutes } from 'date-fns'
import { CalendarHeader } from './calendar-header'
import { WeekView } from './week-view'
import { EventDialog } from './event-dialog'
import type { CalendarEvent, CalendarView } from './types'

interface EventCalendarProps {
  events: CalendarEvent[]
  initialView?: CalendarView
  onEventAdd?: (event: Partial<CalendarEvent>) => void
  onEventUpdate?: (event: CalendarEvent) => void
  onEventDelete?: (eventId: string) => void
  onEventEdit?: (event: CalendarEvent) => void
}

const HOUR_HEIGHT = 60 // pixels per hour (must match time-grid.tsx)
const START_HOUR = 8

export function EventCalendar({
  events,
  initialView = 'week',
  onEventAdd,
  onEventUpdate,
  onEventEdit,
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view] = useState<CalendarView>(initialView)
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogInitialDate, setDialogInitialDate] = useState<Date | undefined>()
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  useDndMonitor({
    onDragStart(event) {
      setActiveEvent(event.active.data.current as CalendarEvent)
    },
    onDragEnd() {
      setActiveEvent(null)
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event
    const draggedEvent = active.data.current as CalendarEvent

    if (!draggedEvent || !onEventUpdate) return

    // Calculate new time based on vertical movement (delta.y)
    const minutesMoved = Math.round((delta.y / HOUR_HEIGHT) * 60)
    
    // Calculate new dates
    const newStart = addMinutes(draggedEvent.start, minutesMoved)
    const duration = differenceInMinutes(draggedEvent.end, draggedEvent.start)
    const newEnd = addMinutes(newStart, duration)

    // Update event with new times
    onEventUpdate({
      ...draggedEvent,
      start: newStart,
      end: newEnd,
    })
  }

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
    <>
      <DndContext 
        onDragEnd={handleDragEnd}
        modifiers={[snapCenterToCursor]}
      >
        <div className="flex flex-col h-full bg-background">
          <CalendarHeader
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            view={view}
            onNewEvent={handleNewEvent}
          />

          {view === 'week' && (
            <WeekView
              weekStart={currentDate}
              events={events}
              onEventUpdate={onEventUpdate}
              onEventEdit={onEventEdit || handleEditEvent}
            />
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeEvent ? (
            <div className="bg-primary/20 border-2 border-primary rounded-md p-2 shadow-lg">
              <div className="font-medium text-sm">{activeEvent.title}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <EventDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveEvent}
        event={editingEvent}
        initialDate={dialogInitialDate}
      />
    </>
  )
}
