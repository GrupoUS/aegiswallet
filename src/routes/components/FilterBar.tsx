import { Filter, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FinancialEventsFilters } from '@/hooks/useFinancialEvents';
import { cn } from '@/lib/utils';
import type { EventStatus, FinancialEventType } from '@/types/financial-events';

interface FilterBarProps {
  filters: FinancialEventsFilters;
  onFiltersChange: (filters: Partial<FinancialEventsFilters>) => void;
  className?: string;
}

export function FilterBar({ filters, onFiltersChange, className }: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // Update local search when filters prop changes
  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  // Debounce search update
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({ search: localSearch });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch, filters.search, onFiltersChange]);

  const activeFiltersCount = [
    filters.status !== 'all' && filters.status,
    filters.type !== 'all' && filters.type,
    filters.startDate,
    filters.endDate,
    filters.isRecurring !== undefined,
    filters.minAmount,
    filters.maxAmount,
    filters.search,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      categoryId: undefined,
      endDate: undefined,
      isRecurring: undefined,
      maxAmount: undefined,
      minAmount: undefined,
      search: '',
      startDate: undefined,
      status: 'all',
      type: 'all',
    });
    setLocalSearch('');
  };

  return (
    <div className={cn('space-y-4 bg-card p-4 rounded-lg border shadow-sm', className)}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 flex gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transações..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant={showAdvanced ? 'secondary' : 'outline'}
            size="icon"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="shrink-0"
          >
            <Filter className="h-4 w-4" />
          </Button>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => onFiltersChange({ status: value as EventStatus | 'all' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) =>
                onFiltersChange({ type: value as FinancialEventType | 'all' })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="bill">Conta</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <DatePicker
              date={filters.startDate ? new Date(filters.startDate) : undefined}
              onDateChange={(date) =>
                onFiltersChange({ startDate: date ? date.toISOString() : undefined })
              }
              placeholder="Início"
            />
          </div>

          <div className="space-y-2">
            <Label>Data Final</Label>
            <DatePicker
              date={filters.endDate ? new Date(filters.endDate) : undefined}
              onDateChange={(date) =>
                onFiltersChange({ endDate: date ? date.toISOString() : undefined })
              }
              placeholder="Fim"
            />
          </div>

          <div className="space-y-2">
            <Label>Valor Mínimo</Label>
            <Input
              type="number"
              placeholder="0,00"
              value={filters.minAmount || ''}
              onChange={(e) =>
                onFiltersChange({ minAmount: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Valor Máximo</Label>
            <Input
              type="number"
              placeholder="0,00"
              value={filters.maxAmount || ''}
              onChange={(e) =>
                onFiltersChange({ maxAmount: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>

          <div className="flex items-center space-x-2 pt-8">
            <Checkbox
              id="recurring"
              checked={filters.isRecurring}
              onCheckedChange={(checked) =>
                onFiltersChange({ isRecurring: checked === true ? true : undefined })
              }
            />
            <Label htmlFor="recurring">Apenas recorrentes</Label>
          </div>
        </div>
      )}

      {activeFiltersCount > 0 && !showAdvanced && (
        <div className="flex gap-2 overflow-x-auto py-1">
          {filters.status && filters.status !== 'all' && (
            <Badge variant="secondary">Status: {filters.status}</Badge>
          )}
          {filters.type && filters.type !== 'all' && (
            <Badge variant="secondary">Tipo: {filters.type}</Badge>
          )}
          {(filters.startDate || filters.endDate) && (
            <Badge variant="secondary">Período selecionado</Badge>
          )}
        </div>
      )}
    </div>
  );
}
