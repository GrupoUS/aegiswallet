import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Download, Filter } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'

// Lazy loaded components
const LazyPixTransactionsTable = lazy(() =>
  import('@/components/pix/PixTransactionsTable').then((mod) => ({
    default: mod.PixTransactionsTable,
  }))
)

// Loading component for transactions table
const TransactionsTableLoader = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

export const Route = createFileRoute('/pix/historico')({
  component: PixHistoryPage,
})

function PixHistoryPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login', search: { redirect: '/pix/historico', error: undefined } })
    }
  }, [isAuthenticated, isLoading, navigate])

  const exportStatement = () => {
    toast.success('Extrato exportado com sucesso!')
  }

  const applyFilters = () => {
    toast.info('Filtros aplicados!')
  }

  const clearFilters = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
    setFilterType('all')
    setFilterStatus('all')
    toast.info('Filtros limpos!')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/pix' })} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard PIX
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Histórico de Transações PIX</h1>
            <p className="text-muted-foreground mt-2">
              Consulte e exporte seu extrato completo de transações PIX
            </p>
          </div>
          <Button onClick={exportStatement}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Extrato
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
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

          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters}>Aplicar Filtros</Button>
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Summary */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Transações</div>
            <div className="text-2xl font-bold mt-1">142</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Enviado</div>
            <div className="text-2xl font-bold text-red-600 mt-1">R$ 8.450,00</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Recebido</div>
            <div className="text-2xl font-bold text-green-600 mt-1">R$ 12.680,50</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Saldo Período</div>
            <div className="text-2xl font-bold text-green-600 mt-1">R$ 4.230,50</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Suspense fallback={<TransactionsTableLoader />}>
        <LazyPixTransactionsTable />
      </Suspense>
    </div>
  )
}
