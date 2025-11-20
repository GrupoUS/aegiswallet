import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Download, Filter } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

// Lazy loaded components
const LazyPixTransactionsTable = lazy(() =>
  import('@/components/pix/PixTransactionsTable').then((mod) => ({
    default: mod.PixTransactionsTable,
  }))
);

// Loading component for transactions table
const TransactionsTableLoader = () => (
  <Card variant="glass">
    <CardHeader>
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, index) => `pix-transaction-skeleton-${index}`).map(
          (skeletonId) => (
            <div key={skeletonId} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          )
        )}
      </div>
    </CardContent>
  </Card>
);

export function PixHistoryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({
        to: '/login',
        search: { redirect: '/pix/historico', error: undefined },
      });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const exportStatement = () => {
    toast.success('Extrato exportado com sucesso!');
  };

  const applyFilters = () => {
    toast.info('Filtros aplicados!');
  };

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setFilterType('all');
    setFilterStatus('all');
    toast.info('Filtros limpos!');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-financial-positive border-b-2"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/pix' })} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard PIX
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Histórico de Transações PIX</h1>
            <p className="mt-2 text-muted-foreground">
              Consulte e exporte seu extrato completo de transações PIX
            </p>
          </div>
          <Button onClick={exportStatement}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Extrato
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6" variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Período</Label>
              <DateRangePicker
                startDate={dateFrom}
                endDate={dateTo}
                onStartDateChange={setDateFrom}
                onEndDateChange={setDateTo}
                className="grid-cols-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-type">Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="filter-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="sent">Enviadas</SelectItem>
                  <SelectItem value="received">Recebidas</SelectItem>
                  <SelectItem value="scheduled">Agendadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filter-status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="failed">Falhadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={applyFilters}>Aplicar Filtros</Button>
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Summary */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">Total Transações</div>
            <div className="mt-1 font-bold text-2xl">142</div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">Total Enviado</div>
            <div className="mt-1 font-bold text-2xl text-financial-negative">R$ 8.450,00</div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">Total Recebido</div>
            <div className="mt-1 font-bold text-2xl text-financial-positive">R$ 12.680,50</div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">Saldo Período</div>
            <div className="mt-1 font-bold text-2xl text-financial-positive">R$ 4.230,50</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Suspense fallback={<TransactionsTableLoader />}>
        <LazyPixTransactionsTable />
      </Suspense>
    </div>
  );
}
