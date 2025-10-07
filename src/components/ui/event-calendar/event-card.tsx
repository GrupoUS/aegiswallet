import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { CalendarEvent, EventPosition } from './types'
import { EVENT_COLOR_STYLES } from './types'

interface EventCardProps {
  event: CalendarEvent
  position: EventPosition
  onEdit?: (event: CalendarEvent) => void
  onDelete?: (eventId: string) => void
}

export function EventCard({ event, position, onEdit }: EventCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: event,
  })
  const colorTokens = EVENT_COLOR_STYLES[event.color] ?? EVENT_COLOR_STYLES.blue

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
        colorTokens.subtleBg,
        colorTokens.border,
        colorTokens.text,
        colorTokens.dot.replace('bg-', 'border-l-')
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
