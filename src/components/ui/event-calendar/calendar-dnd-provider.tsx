import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { addMinutes, differenceInMinutes } from 'date-fns'
import type { CalendarEvent } from './types'

// Define the context type
type CalendarDndContextType = {
  activeEvent: CalendarEvent | null
  activeId: UniqueIdentifier | null
}

// Create the context
const CalendarDndContext = createContext<CalendarDndContextType>({
  activeEvent: null,
  activeId: null,
})

// Hook to use the context
export const useCalendarDnd = () => useContext(CalendarDndContext)

// Props for the provider
interface CalendarDndProviderProps {
  children: ReactNode
  onEventUpdate: (event: CalendarEvent) => void
}

export function CalendarDndProvider({
  children,
  onEventUpdate,
}: CalendarDndProviderProps) {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)

  // Configure sensors for better drag detection
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 5px before activating
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 5px of movement
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      // Require the pointer to move by 5px before activating
      activationConstraint: {
        distance: 5,
      },
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event

    // Add safety check for data.current
    if (!active.data.current) {
      console.error('Missing data in drag start event', event)
      return
    }

    const calendarEvent = active.data.current as CalendarEvent
    setActiveEvent(calendarEvent)
    setActiveId(active.id)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event

    if (!activeEvent || !onEventUpdate) {
      // Reset state and exit early
      setActiveEvent(null)
      setActiveId(null)
      return
    }

    try {
      // Safely access data with checks
      if (!active.data.current) {
        throw new Error('Missing data in drag event')
      }

      const draggedEvent = active.data.current as CalendarEvent

      // Calculate new time based on vertical movement (delta.y)
      const HOUR_HEIGHT = 60 // pixels per hour (must match time-grid.tsx)
      const minutesMoved = Math.round((delta.y / HOUR_HEIGHT) * 60)
      
      // Calculate new dates
      const newStart = addMinutes(draggedEvent.start, minutesMoved)
      const duration = differenceInMinutes(draggedEvent.end, draggedEvent.start)
      const newEnd = addMinutes(newStart, duration)

      // Only update if the start time has actually changed
      const hasStartTimeChanged =
        draggedEvent.start.getFullYear() !== newStart.getFullYear() ||
        draggedEvent.start.getMonth() !== newStart.getMonth() ||
        draggedEvent.start.getDate() !== newStart.getDate() ||
        draggedEvent.start.getHours() !== newStart.getHours() ||
        draggedEvent.start.getMinutes() !== newStart.getMinutes()

      if (hasStartTimeChanged) {
        // Update the event only if the time has changed
        onEventUpdate({
          ...draggedEvent,
          start: newStart,
          end: newEnd,
        })
      }
    } catch (error) {
      console.error('Error in drag end handler:', error)
    } finally {
      // Always reset state
      setActiveEvent(null)
      setActiveId(null)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CalendarDndContext.Provider
        value={{
          activeEvent,
          activeId,
        }}
      >
        {children}

        <DragOverlay dropAnimation={null}>
          {activeEvent ? (
            <div className="bg-primary/20 border-2 border-primary rounded-md p-2 shadow-lg">
              <div className="font-medium text-sm">{activeEvent.title}</div>
            </div>
          ) : null}
        </DragOverlay>
      </CalendarDndContext.Provider>
    </DndContext>
  )
}
