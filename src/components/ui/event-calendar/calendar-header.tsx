import { addDays, addMonths, addWeeks, format, subDays, subMonths, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  view,
  onViewChange,
  onNewEvent,
}: CalendarHeaderProps) {
  const handlePrevious = () => {
    if (view === 'month') {
      onDateChange(subMonths(currentDate, 1))
    } else if (view === 'week') {
      onDateChange(subWeeks(currentDate, 1))
    } else {
      onDateChange(subDays(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (view === 'month') {
      onDateChange(addMonths(currentDate, 1))
    } else if (view === 'week') {
      onDateChange(addWeeks(currentDate, 1))
    } else {
      onDateChange(addDays(currentDate, 1))
    }
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const handleViewChange = (newView: CalendarView) => {
    onViewChange?.(newView)
  }

  const getViewIcon = (view: CalendarView) => {
    switch (view) {
      case 'month':
        return <Calendar className="h-4 w-4" />
      case 'week':
        return <CalendarDays className="h-4 w-4" />
      case 'day':
        return <Clock className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getDateFormat = (view: CalendarView) => {
    switch (view) {
      case 'month':
        return 'MMMM yyyy'
      case 'week':
        return "w 'de' MMMM yyyy"
      case 'day':
        return "EEEE, d 'de' MMMM 'de' yyyy"
      default:
        return 'MMMM yyyy'
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 border-b bg-background">
      {/* First row: Date navigation and view switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">
            {format(currentDate, getDateFormat(view), { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handlePrevious} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday} className="h-8">
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <Select value={view} onValueChange={handleViewChange}>
            <SelectTrigger className="w-32">
              <div className="flex items-center gap-2">
                {getViewIcon(view)}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Mês
                </div>
              </SelectItem>
              <SelectItem value="week">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Semana
                </div>
              </SelectItem>
              <SelectItem value="day">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Dia
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={onNewEvent} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Second row: Search and filters (optional for future enhancement) */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            className="pl-10"
            // TODO: Add search functionality
          />
        </div>
      </div>
    </div>
  )
}
