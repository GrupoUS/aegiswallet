import { addDays, addMonths, addWeeks, format, subDays, subMonths, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Plus,
  Receipt,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCalendarSearch } from '@/hooks/use-calendar-search';
import type { FinancialEvent } from '@/types/financial-events';
import type { CalendarView } from './types';

interface CalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  view: CalendarView;
  onViewChange?: (view: CalendarView) => void;
  onNewEvent?: () => void;
  onSearchResults?: (results: FinancialEvent[]) => void;
}

export function CalendarHeader({
  currentDate,
  onDateChange,
  view,
  onViewChange,
  onNewEvent,
  onSearchResults,
}: CalendarHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const {
    query,
    searchType,
    results,
    isLoading,
    error,
    filters,
    handleQueryChange,
    handleSearchTypeChange,
    handleFiltersChange,
    clearSearch,
    hasResults,
  } = useCalendarSearch({
    enabled: showSearch,
  });

  // Atualizar resultados quando mudam
  useEffect(() => {
    if (onSearchResults) {
      onSearchResults(results);
    }
  }, [results, onSearchResults]);

  const handleFilterChange = (key: string, value: string) => {
    handleFiltersChange({ [key]: value || undefined });
  };

  const handlePrevious = () => {
    if (view === 'month') {
      onDateChange(subMonths(currentDate, 1));
    } else if (view === 'week') {
      onDateChange(subWeeks(currentDate, 1));
    } else {
      onDateChange(subDays(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      onDateChange(addMonths(currentDate, 1));
    } else if (view === 'week') {
      onDateChange(addWeeks(currentDate, 1));
    } else {
      onDateChange(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleViewChange = (newView: CalendarView) => {
    onViewChange?.(newView);
  };

  const getViewIcon = (view: CalendarView) => {
    switch (view) {
      case 'month':
        return <Calendar className="h-4 w-4" />;
      case 'week':
        return <CalendarDays className="h-4 w-4" />;
      case 'day':
        return <Clock className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getDateFormat = (view: CalendarView) => {
    switch (view) {
      case 'month':
        return 'MMMM yyyy';
      case 'week':
        return "w 'de' MMMM yyyy";
      case 'day':
        return "EEEE, d 'de' MMMM 'de' yyyy";
      default:
        return 'MMMM yyyy';
    }
  };

  return (
    <div className="flex flex-col gap-4 border-b bg-background p-4">
      {/* First row: Date navigation and view switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-2xl">
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

      {/* Second row: Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
          <Input
            placeholder="Buscar eventos e transações..."
            className="pr-10 pl-10"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setShowSearch(true)}
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="-translate-y-1/2 absolute top-1/2 right-1 h-6 w-6 transform p-0"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search type selector */}
        {showSearch && (
          <Select value={searchType} onValueChange={handleSearchTypeChange}>
            <SelectTrigger className="w-40">
              <div className="flex items-center gap-2">
                {searchType === 'events' ? (
                  <CalendarCheck className="h-4 w-4" />
                ) : (
                  <Receipt className="h-4 w-4" />
                )}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="events">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4" />
                  Eventos
                </div>
              </SelectItem>
              <SelectItem value="transactions">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Transações
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Filters button */}
        {showSearch && (
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {(filters.startDate || filters.endDate || filters.typeId || filters.categoryId) && (
                  <Badge variant="secondary" className="h-5 px-1 text-xs">
                    {Object.values(filters).filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <h4 className="font-medium">Filtros de Busca</h4>

                {/* Date range filters */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label htmlFor="start-date" className="font-medium text-sm">
                      Data Início
                    </label>
                    <Input
                      id="start-date"
                      type="date"
                      value={filters.startDate || ''}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="end-date" className="font-medium text-sm">
                      Data Fim
                    </label>
                    <Input
                      id="end-date"
                      type="date"
                      value={filters.endDate || ''}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                  </div>
                </div>

                {/* Type filter (for events) */}
                {searchType === 'events' && (
                  <div className="space-y-2">
                    <label htmlFor="event-type" className="font-medium text-sm">
                      Tipo de Evento
                    </label>
                    <Select
                      value={filters.typeId || ''}
                      onValueChange={(value) => handleFilterChange('typeId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os tipos</SelectItem>
                        {/* Event types will be loaded dynamically */}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Category filter */}
                <div className="space-y-2">
                  <label htmlFor="category" className="font-medium text-sm">
                    Categoria
                  </label>
                  <Select
                    value={filters.categoryId || ''}
                    onValueChange={(value) => handleFilterChange('categoryId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {/* Categories will be loaded dynamically */}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear filters button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFiltersChange({})}
                  className="w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpar Filtros
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Search results indicator */}
        {showSearch && hasResults && (
          <Badge variant="secondary" className="gap-1">
            <span>{results.length} resultados</span>
          </Badge>
        )}

        {/* Loading indicator */}
        {showSearch && isLoading && (
          <Badge variant="outline" className="gap-1">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Buscando...
          </Badge>
        )}

        {/* Error indicator */}
        {showSearch && error && (
          <Badge variant="destructive" className="gap-1">
            <span>Erro na busca</span>
          </Badge>
        )}
      </div>
    </div>
  );
}
