/**
 * Financial Calendar Component
 * Calendário principal com eventos financeiros
 */

import { useState } from 'react'
import { format, isSameDay, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useCalendar } from './calendar-context'
import { formatEventAmount, type FinancialEvent } from '@/types/financial-events'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FinancialAmount } from '@/components/financial-amount'

export function FinancialCalendar() {
  const { currentDate, setCurrentDate, getEventsForMonth, getEventsForDate } = useCalendar()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedEvent, setSelectedEvent] = useState<FinancialEvent | null>(null)
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)

  const eventsInMonth = getEventsForMonth(currentDate)
  const selectedDateEvents = getEventsForDate(selectedDate)

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleEventClick = (event: FinancialEvent) => {
    setSelectedEvent(event)
    setIsEventDialogOpen(true)
  }

  // Função para verificar se uma data tem eventos
  const getEventsForDay = (date: Date): FinancialEvent[] => {
    return eventsInMonth.filter((event) => isSameDay(new Date(event.start), date))
  }

  // Calcular totais do mês
  const monthlyTotals = eventsInMonth.reduce(
    (acc, event) => {
      if (event.type === 'income') {
        acc.income += event.amount
      } else if (event.type === 'expense' || event.type === 'bill') {
        acc.expenses += Math.abs(event.amount)
      }
      return acc
    },
    { income: 0, expenses: 0 }
  )

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Calendário Principal */}
      <Card className="flex-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Calendário Financeiro
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-[150px] text-center font-semibold">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </div>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Evento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={currentDate}
            onMonthChange={setCurrentDate}
            className="rounded-md border"
            components={{
              DayButton: ({ day, ...props }) => {
                const dayEvents = getEventsForDay(day.date)
                const hasEvents = dayEvents.length > 0

                return (
                  <button
                    {...props}
                    className={cn(
                      props.className,
                      'relative flex flex-col items-center justify-center h-full min-h-[60px]'
                    )}
                  >
                    <span className="text-sm">{day.date.getDate()}</span>
                    {hasEvents && (
                      <div className="flex gap-0.5 mt-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              event.color === 'emerald' && 'bg-emerald-500',
                              event.color === 'rose' && 'bg-rose-500',
                              event.color === 'orange' && 'bg-orange-500',
                              event.color === 'blue' && 'bg-blue-500',
                              event.color === 'violet' && 'bg-violet-500'
                            )}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-muted-foreground ml-0.5">
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              },
            }}
          />

          {/* Resumo do Mês */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Receitas</p>
                <FinancialAmount amount={monthlyTotals.income} size="lg" className="mt-1" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Despesas</p>
                <FinancialAmount
                  amount={-monthlyTotals.expenses}
                  size="lg"
                  className="mt-1"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Saldo</p>
                <FinancialAmount
                  amount={monthlyTotals.income - monthlyTotals.expenses}
                  size="lg"
                  className="mt-1"
                />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Eventos do Dia Selecionado */}
      <Card className="w-full lg:w-[350px]">
        <CardHeader>
          <CardTitle className="text-lg">
            {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {selectedDateEvents.length} evento(s)
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedDateEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum evento neste dia
              </p>
            ) : (
              selectedDateEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="w-full text-left"
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{event.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{event.title}</h4>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
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
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.start), 'HH:mm')}
                          </p>
                          <p className="text-lg font-semibold mt-1">
                            {formatEventAmount(event.amount)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes do Evento */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedEvent?.icon}</span>
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent &&
                format(new Date(selectedEvent.start), "d 'de' MMMM 'às' HH:mm", {
                  locale: ptBR,
                })}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="text-2xl font-bold">{formatEventAmount(selectedEvent.amount)}</p>
              </div>
              {selectedEvent.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p>{selectedEvent.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  className={cn(
                    'mt-1',
                    selectedEvent.status === 'paid' && 'bg-green-500',
                    selectedEvent.status === 'pending' && 'bg-yellow-500',
                    selectedEvent.status === 'scheduled' && 'bg-blue-500'
                  )}
                >
                  {selectedEvent.status === 'paid' && 'Pago'}
                  {selectedEvent.status === 'pending' && 'Pendente'}
                  {selectedEvent.status === 'scheduled' && 'Agendado'}
                </Badge>
              </div>
              {selectedEvent.category && (
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="capitalize">{selectedEvent.category}</p>
                </div>
              )}
              {selectedEvent.recurring && (
                <div>
                  <Badge variant="outline">Recorrente</Badge>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  Editar
                </Button>
                {selectedEvent.status === 'pending' && (
                  <Button className="flex-1">Marcar como Pago</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
