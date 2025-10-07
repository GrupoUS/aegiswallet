import { differenceInMinutes, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, Edit2, MapPin, MoreHorizontal, Trash2, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { CalendarEvent, EventColor } from './types'
import { EVENT_COLOR_STYLES } from './types'

interface EnhancedEventCardProps {
  event: CalendarEvent
  variant?: 'compact' | 'detailed' | 'draggable'
  position?: { top: number; left: string; height: number; width: string }
  onClick?: (event: CalendarEvent) => void
  onEdit?: (event: CalendarEvent) => void
  onDelete?: (eventId: string) => void
  className?: string
}

export function EnhancedEventCard({
  event,
  variant = 'draggable',
  position,
  onClick,
  onEdit,
  onDelete,
  className,
}: EnhancedEventCardProps) {
  const eventStart = new Date(event.start)
  const eventEnd = new Date(event.end)
  const duration = differenceInMinutes(eventEnd, eventStart)
  const isAllDay = event.allDay || duration >= 24 * 60

  const eventColor = (event.color ?? 'blue') as EventColor
  const colorTokens = EVENT_COLOR_STYLES[eventColor] ?? EVENT_COLOR_STYLES.blue
  const colorClasses = {
    bg: colorTokens.subtleBg,
    text: colorTokens.text,
    border: colorTokens.border,
  }

  const handleClick = () => {
    onClick?.(event)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(event)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(event.id)
  }

  // Compact variant for month view
  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'cursor-pointer truncate rounded px-1 py-0.5 text-xs font-medium',
          colorClasses.bg,
          colorClasses.text,
          'hover:opacity-80 transition-opacity',
          className
        )}
      >
        <span className="truncate">{event.title}</span>
      </div>
    )
  }

  // Detailed variant for day view
  if (variant === 'detailed') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'cursor-pointer rounded-lg border p-3 space-y-2 hover:shadow-md transition-shadow',
          colorClasses.bg,
          colorClasses.border,
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className={cn('font-semibold truncate', colorClasses.text)}>{event.title}</h4>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Time and location */}
        <div className="space-y-1">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {isAllDay ? (
              'Dia inteiro'
            ) : (
              <>
                {format(eventStart, 'HH:mm', { locale: ptBR })}
                {' - '}
                {format(eventEnd, 'HH:mm', { locale: ptBR })}
              </>
            )}
          </div>

          {event.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              {event.location}
            </div>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-3 w-3 mr-1" />
              {event.attendees.length} participante{event.attendees.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1 flex-wrap">
          {event.category && (
            <Badge variant="secondary" className="text-xs">
              {event.category.name}
            </Badge>
          )}

          {event.priority && (
            <Badge
              variant={event.priority === 'high' ? 'destructive' : 'outline'}
              className="text-xs"
            >
              {event.priority === 'high' ? 'Alta' : event.priority === 'medium' ? 'Média' : 'Baixa'}
            </Badge>
          )}

          {event.recurring && (
            <Badge variant="outline" className="text-xs">
              Recorrente
            </Badge>
          )}
        </div>
      </div>
    )
  }

  // Draggable variant for week view (existing behavior)
  return (
    <div
      onClick={handleClick}
      className={cn(
        'cursor-pointer rounded border p-2 space-y-1 hover:shadow-md transition-shadow',
        colorClasses.bg,
        colorClasses.border,
        className
      )}
      style={position}
    >
      <h4 className={cn('font-semibold text-sm truncate', colorClasses.text)}>{event.title}</h4>

      <div className="flex items-center text-xs text-muted-foreground">
        <Clock className="h-3 w-3 mr-1" />
        {isAllDay ? 'Dia inteiro' : format(eventStart, 'HH:mm', { locale: ptBR })}
      </div>

      {event.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
      )}
    </div>
  )
}
