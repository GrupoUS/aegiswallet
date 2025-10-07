/**
 * Financial Calendar Component
 * Calendário semanal com eventos financeiros
 */

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type CalendarEvent, EventCalendar } from '@/components/ui/event-calendar'
import { cn } from '@/lib/utils'
import { type FinancialEvent, formatEventAmount } from '@/types/financial-events'
import { useCalendar } from './calendar-context'

// Converter FinancialEvent para CalendarEvent
function toCalendarEvent(event: FinancialEvent): CalendarEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    start: new Date(event.start),
    end: new Date(event.end),
    color: event.color,
    allDay: event.allDay,
  }
}

export function FinancialCalendar() {
  const { events: financialEvents, addEvent, updateEvent, categories, filters } = useCalendar()
  const [selectedEvent, setSelectedEvent] = useState<FinancialEvent | null>(null)
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)

  // Filtrar eventos baseado nos filtros atuais
  const filteredEvents = useMemo(() => {
    let filtered = financialEvents

    // Aplicar filtros do contexto
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter((event) => filters.categories!.includes(event.category || ''))
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.start)
        return eventDate >= start && eventDate <= end
      })
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [financialEvents, filters])

  // Enhanced converter com categorias
  const calendarEvents = useMemo(() => {
    return filteredEvents.map((event) => {
      const calendarEvent = toCalendarEvent(event)

      // Encontrar a categoria correspondente
      const category = categories.find((cat) => cat.id === event.category)
      if (category) {
        calendarEvent.category = category
        calendarEvent.color = category.color
      }

      // Adicionar informações adicionais
      calendarEvent.status = event.status as any
      calendarEvent.priority =
        event.amount && Math.abs(event.amount) > 1000
          ? 'high'
          : event.amount && Math.abs(event.amount) > 500
            ? 'medium'
            : 'low'
      calendarEvent.recurring = event.recurring

      return calendarEvent
    })
  }, [filteredEvents, categories])

  const handleEventAdd = async (calendarEvent: Partial<CalendarEvent>) => {
    // Converter CalendarEvent para FinancialEvent
    const financialEvent: Partial<FinancialEvent> = {
      title: calendarEvent.title!,
      description: calendarEvent.description,
      start: calendarEvent.start!,
      end: calendarEvent.end!,
      color: calendarEvent.color!,
      allDay: calendarEvent.allDay,
      type: 'scheduled', // Default type
      amount: 0, // Default amount
      status: 'scheduled',
      icon: '📅',
    }

    await addEvent(financialEvent as FinancialEvent)
  }

  const handleEventUpdate = async (calendarEvent: CalendarEvent) => {
    // Encontrar o evento financeiro original e atualizar
    const financialEvent = financialEvents.find((e) => e.id === calendarEvent.id)
    if (financialEvent) {
      await updateEvent({
        ...financialEvent,
        title: calendarEvent.title,
        description: calendarEvent.description,
        start: calendarEvent.start,
        end: calendarEvent.end,
        color: calendarEvent.color,
        allDay: calendarEvent.allDay,
      })
    }
  }

  const handleEventEdit = (calendarEvent: CalendarEvent) => {
    // Encontrar o evento financeiro original para mostrar detalhes completos
    const financialEvent = financialEvents.find((e) => e.id === calendarEvent.id)
    if (financialEvent) {
      setSelectedEvent(financialEvent)
      setIsEventDialogOpen(true)
    }
  }

  return (
    <>
      <EventCalendar
        events={calendarEvents}
        initialView="week"
        onEventAdd={handleEventAdd}
        onEventUpdate={handleEventUpdate}
        onEventEdit={handleEventEdit}
      />

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
                    selectedEvent.status === 'paid' && 'bg-success',
                    selectedEvent.status === 'pending' && 'bg-warning',
                    selectedEvent.status === 'scheduled' && 'bg-info'
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
    </>
  )
}
