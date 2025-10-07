/**
 * Mini Calendar Widget
 * Widget de calendário para o dashboard com próximos eventos
 */

import { Link, useNavigate } from '@tanstack/react-router'
import { compareAsc, format, isFuture } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react'
import React, { useCallback, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatEventAmount } from '@/types/financial-events'
import { useCalendar } from './calendar-context'
import { OriginCompactCalendar } from './origin-compact-calendar'

export const MiniCalendarWidget = React.memo(function MiniCalendarWidget() {
  const { events } = useCalendar()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Filtrar próximos eventos com useMemo
  const upcomingEvents = useMemo(() => {
    return events
      .filter(
        (e) =>
          isFuture(new Date(e.start)) ||
          format(new Date(e.start), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      )
      .sort((a, b) => compareAsc(new Date(a.start), new Date(b.start)))
      .slice(0, 5)
  }, [events])

  // Otimizar handleDateClick com useCallback
  const handleDateClick = useCallback(
    (date: Date) => {
      setSelectedDate(date)
      navigate({
        to: '/calendario',
        search: { date: format(date, 'yyyy-MM-dd') },
      })
    },
    [navigate]
  )

  // Otimizar navegação com useCallback
  const handleNavigateToCalendar = useCallback(() => {
    navigate({ to: '/calendario' })
  }, [navigate])

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="w-4 h-4" />
            Calendário
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleNavigateToCalendar}
          >
            <ChevronRight className="w-4 h-4" />
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
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Próximos Eventos</h4>
          <div className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum evento próximo
              </p>
            ) : (
              upcomingEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleDateClick(new Date(event.start))}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors">
                    <div className="text-xl">{event.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.start), 'dd MMM', { locale: ptBR })}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] h-4 px-1',
                            event.status === 'paid' && 'border-green-500 text-green-500',
                            event.status === 'pending' && 'border-yellow-500 text-yellow-500',
                            event.status === 'scheduled' && 'border-blue-500 text-blue-500'
                          )}
                        >
                          {event.status === 'paid' && 'Pago'}
                          {event.status === 'pending' && 'Pendente'}
                          {event.status === 'scheduled' && 'Agendado'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{formatEventAmount(event.amount)}</div>
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
  )
})
