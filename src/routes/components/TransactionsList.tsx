import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeftRight,
  Calendar,
  FileText,
  MoreVertical,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { FinancialAmount } from '@/components/financial-amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinancialEventsFilters } from '@/hooks/useFinancialEvents';
import { useFinancialEvents } from '@/hooks/useFinancialEvents';
import type { FinancialEventType } from '@/types/financial-events';
import { FilterBar } from './FilterBar';
import { PaginationControls } from './PaginationControls';
import { TransactionDetailsModal } from './TransactionDetailsModal';

interface TransactionsListProps {
  initialFilters?: FinancialEventsFilters;
  showFilters?: boolean;
  showPagination?: boolean;
  className?: string;
}

export default function TransactionsList({
  initialFilters = {},
  showFilters = true,
  showPagination = true,
  className,
}: TransactionsListProps) {
  const { events, loading, totalCount, pagination, filters, updateFilters, updatePagination } =
    useFinancialEvents(initialFilters);

  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleTransactionClick = (id: string) => {
    setSelectedTransactionId(id);
    setIsDetailsOpen(true);
  };

  const getIcon = (type: FinancialEventType) => {
    switch (type) {
      case 'income':
        return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case 'expense':
        return <TrendingDown className="h-5 w-5 text-rose-500" />;
      case 'bill':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'scheduled':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'transfer':
        return <ArrowLeftRight className="h-5 w-5 text-violet-500" />;
      default:
        return <TrendingDown className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Pago</Badge>;
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Pendente
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Agendado
          </Badge>
        );
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className={`transition-all duration-300 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transações</CardTitle>
            <CardDescription>Gerencie suas movimentações</CardDescription>
          </div>
        </div>
        {showFilters && (
          <FilterBar filters={filters} onFiltersChange={updateFilters} className="mt-4" />
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer group"
                onClick={() => handleTransactionClick(event.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTransactionClick(event.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-background border shadow-sm">
                    {getIcon(event.type)}
                  </div>
                  <div>
                    <p className="font-medium leading-none">{event.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(event.start), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </span>
                      {event.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{event.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <FinancialAmount
                      amount={event.type === 'expense' ? -event.amount : event.amount}
                      className={event.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}
                    />
                    <div className="flex justify-end mt-1">{getStatusBadge(event.status)}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showPagination && totalCount > 0 && (
          <PaginationControls
            pagination={pagination}
            totalItems={totalCount}
            onPaginationChange={updatePagination}
          />
        )}
      </CardContent>

      <TransactionDetailsModal
        transactionId={selectedTransactionId}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTransactionId(null);
        }}
      />
    </Card>
  );
}
