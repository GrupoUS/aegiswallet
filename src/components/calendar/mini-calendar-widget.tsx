/**
 * Mini Calendar Widget
 * Widget de calendário para o dashboard com próximos eventos
 */

import { Link, useNavigate } from '@tanstack/react-router';
import { compareAsc, format, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useCalendar } from '@/components/calendar/calendar-context';
import { OriginCompactCalendar } from '@/components/calendar/origin-compact-calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatEventAmount } from '@/types/financial-events';

export const MiniCalendarWidget = React.memo(function MiniCalendarWidget() {
  const { events } = useCalendar();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Filtrar próximos eventos com useMemo
  const upcomingEvents = useMemo(() => {
    return events
      .filter(
        (e) =>
          isFuture(new Date(e.start)) ||
          format(new Date(e.start), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      )
      .sort((a, b) => compareAsc(new Date(a.start), new Date(b.start)))
      .slice(0, 5);
  }, [events]);

  // Otimizar handleDateClick com useCallback
  const handleDateClick = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      navigate({
        search: { date: format(date, 'yyyy-MM-dd') },
        to: '/calendario',
      });
    },
    [navigate]
  );

  // Otimizar navegação com useCallback
  const handleNavigateToCalendar = useCallback(() => {
    navigate({ to: '/calendario' });
  }, [navigate]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-4 w-4" />
            Calendário
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleNavigateToCalendar}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mini calendário com dropdown de mês/ano */}
        <OriginCompactCalendar
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          defaultMonth={selectedDate}
          showOutsideDays={false}
        />

        {/* Lista de próximos eventos */}
        <div>
          <h4 className="mb-3 font-semibold text-muted-foreground text-sm">Próximos Eventos</h4>
          <div className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground text-sm">
                Nenhum evento próximo
              </p>
            ) : (
              upcomingEvents.map((event) => (
                <button
                  type="button"
                  key={event.id}
                  onClick={() => handleDateClick(new Date(event.start))}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-accent">
                    <div className="text-xl">{event.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">{event.title}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-muted-foreground text-xs">
                          {format(new Date(event.start), 'dd MMM', {
                            locale: ptBR,
                          })}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            'h-4 px-1 text-[10px]',
                            event.status === 'paid' && 'border-success text-success',
                            event.status === 'pending' && 'border-warning text-warning',
                            event.status === 'scheduled' && 'border-info text-info'
                          )}
                        >
                          {event.status === 'paid' && 'Pago'}
                          {event.status === 'pending' && 'Pendente'}
                          {event.status === 'scheduled' && 'Agendado'}
                        </Badge>
                      </div>
                    </div>
                    <div className="font-semibold text-sm">{formatEventAmount(event.amount)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Link para calendário completo */}
        <Link to="/calendario">
          <Button variant="outline" className="w-full" size="sm">
            Ver Calendário Completo
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
});
