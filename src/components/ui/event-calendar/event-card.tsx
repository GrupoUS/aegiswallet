import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { CalendarEvent, EventPosition } from './types'

interface EventCardProps {
  event: CalendarEvent
  position: EventPosition
  onEdit?: (event: CalendarEvent) => void
  onDelete?: (eventId: string) => void
}

const colorClasses = {
  emerald: 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300',
  rose: 'bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300',
  orange: 'bg-orange-500/20 border-orange-500 text-orange-700 dark:text-orange-300',
  blue: 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300',
  violet: 'bg-violet-500/20 border-violet-500 text-violet-700 dark:text-violet-300',
  indigo: 'bg-indigo-500/20 border-indigo-500 text-indigo-700 dark:text-indigo-300',
  amber: 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300',
}

export function EventCard({ event, position, onEdit }: EventCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: event,
  })

  const style = {
    position: 'absolute' as const,
    top: `${position.top}px`,
    left: position.left,
    height: `${position.height}px`,
    width: position.width,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : 10,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onEdit?.(event)}
      className={cn(
        'rounded-md border-l-4 p-2 text-sm cursor-move pointer-events-auto',
        'hover:shadow-md transition-shadow overflow-hidden',
        colorClasses[event.color]
      )}
    >
      <div className="font-medium truncate">{event.title}</div>
      {!event.allDay && (
        <div className="text-xs opacity-80 mt-1">
          {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
        </div>
      )}
    </div>
  )
}
