import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { format, addWeeks, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { CalendarView } from './types'

interface CalendarHeaderProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  view: CalendarView
  onViewChange?: (view: CalendarView) => void
  onNewEvent?: () => void
}

export function CalendarHeader({
  currentDate,
  onDateChange,
  onNewEvent,
}: CalendarHeaderProps) {
  const handlePrevious = () => {
    onDateChange(subWeeks(currentDate, 1))
  }

  const handleNext = () => {
    onDateChange(addWeeks(currentDate, 1))
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-semibold">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-8"
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button onClick={onNewEvent} className="gap-2">
        <Plus className="h-4 w-4" />
        Novo Evento
      </Button>
    </div>
  )
}
