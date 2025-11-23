import { differenceInMinutes, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Cloud, Edit2, MapPin, MoreHorizontal, Trash2, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import type { CalendarEvent, EventColor } from './types';
import { EVENT_COLOR_STYLES } from './types';

interface EnhancedEventCardProps {
  event: CalendarEvent;
  variant?: 'compact' | 'detailed' | 'draggable';
  position?: { top: number; left: string; height: number; width: string };
  onClick?: (event: CalendarEvent) => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  className?: string;
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
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  const duration = differenceInMinutes(eventEnd, eventStart);
  const isAllDay = event.allDay || duration >= 24 * 60;

  const eventColor = (event.color ?? 'blue') as EventColor;
  const colorTokens = EVENT_COLOR_STYLES[eventColor] ?? EVENT_COLOR_STYLES.blue;
  const colorClasses = {
    bg: colorTokens.subtleBg,
    border: colorTokens.border,
    text: colorTokens.text,
  };

  const handleClick = () => {
    onClick?.(event);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(event);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(event.id);
  };

  // Compact variant for month view
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
          'cursor-pointer font-medium hover:opacity-80',
          'truncate rounded px-1 py-0.5 text-xs transition-opacity',
          colorClasses.bg,
          colorClasses.text,
          className
        )}
        aria-label={`Ver evento: ${event.title}`}
      >
        <span className="truncate">{event.title}</span>
        {event.syncStatus === 'synced' && (
          <Cloud className="ml-1 inline-block h-3 w-3 opacity-70" />
        )}
      </button>
    );
  }

  // Detailed variant for day view
  if (variant === 'detailed') {
    return (
      <article
        className={cn(
          'rounded-lg border transition-shadow focus-within:ring-2 focus-within:ring-blue-500',
          colorClasses.bg,
          colorClasses.border,
          className
        )}
      >
        <div className="flex items-start justify-between gap-2 p-3">
          <button
            type="button"
            onClick={handleClick}
            className={cn(
              'min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
            )}
            aria-label={`Ver evento: ${event.title}`}
          >
            <div className="space-y-2">
              <h4 className={cn('truncate font-semibold', colorClasses.text)}>{event.title}</h4>
              {event.description && (
                <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                  {event.description}
                </p>
              )}

              <div className="space-y-1">
                <div className="flex items-center text-muted-foreground text-sm">
                  <Clock className="mr-1 h-3 w-3" />
                  {isAllDay
                    ? 'Dia inteiro'
                    : `${format(eventStart, 'HH:mm', { locale: ptBR })} - ${format(eventEnd, 'HH:mm', { locale: ptBR })}`}
                </div>

                {event.location && (
                  <div className="flex items-center text-muted-foreground text-sm">
                    <MapPin className="mr-1 h-3 w-3" />
                    {event.location}
                  </div>
                )}

                {event.attendees && event.attendees.length > 0 && (
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Users className="mr-1 h-3 w-3" />
                    {event.attendees.length} participante
                    {event.attendees.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {event.category && <Badge className="text-xs">{event.category.name}</Badge>}

                {event.priority && (
                  <Badge
                    variant={event.priority === 'high' ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {event.priority === 'high'
                      ? 'Alta'
                      : event.priority === 'medium'
                        ? 'Média'
                        : 'Baixa'}
                  </Badge>
                )}

                {event.recurring && (
                  <Badge variant="outline" className="text-xs">
                    Recorrente
                  </Badge>
                )}

                {event.syncStatus === 'synced' && (
                  <Badge
                    variant="secondary"
                    className="text-xs gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    <Cloud className="h-3 w-3" /> Google
                  </Badge>
                )}
              </div>
            </div>
          </button>

          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  aria-label="Abrir ações do evento"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    {onEdit && <DropdownMenuSeparator />}
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </article>
    );
  }

  // Draggable variant for week view - use button with drag support
  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'cursor-pointer border hover:shadow-md',
        'space-y-1 rounded p-2 text-left transition-shadow',
        colorClasses.bg,
        colorClasses.border,
        className
      )}
      aria-label={`Ver evento: ${event.title}`}
      style={position}
      draggable
    >
      <h4 className={cn('truncate font-semibold text-sm', colorClasses.text)}>{event.title}</h4>

      <div className="flex items-center text-muted-foreground text-xs">
        <Clock className="mr-1 h-3 w-3" />
        {isAllDay ? 'Dia inteiro' : format(eventStart, 'HH:mm', { locale: ptBR })}
      </div>

      {event.description && (
        <p className="line-clamp-2 text-muted-foreground text-xs">{event.description}</p>
      )}
    </button>
  );
}
