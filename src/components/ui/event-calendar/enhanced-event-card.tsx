import React from 'react'
import { format, differenceInMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  MapPin, 
  Users, 
  MoreHorizontal,
  Edit2,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CalendarEvent } from './types'

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
  
  const getEventColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
      rose: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      violet: { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
      amber: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
      red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
      green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
      pink: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
      teal: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
      cyan: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
    }
    
    return colorMap[color] || colorMap.blue
  }

  const colorClasses = getEventColorClasses(event.color)

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
            <h4 className={cn('font-semibold truncate', colorClasses.text)}>
              {event.title}
            </h4>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {event.description}
              </p>
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
            {isAllDay ? 'Dia inteiro' : (
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
              {event.category}
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
      <h4 className={cn('font-semibold text-sm truncate', colorClasses.text)}>
        {event.title}
      </h4>
      
      <div className="flex items-center text-xs text-muted-foreground">
        <Clock className="h-3 w-3 mr-1" />
        {isAllDay ? 'Dia inteiro' : format(eventStart, 'HH:mm', { locale: ptBR })}
      </div>
      
      {event.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {event.description}
        </p>
      )}
    </div>
  )
}