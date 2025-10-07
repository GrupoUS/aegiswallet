import { AlertCircle, ArrowUpRight, CheckCircle, CreditCard, Info, TrendingUp } from 'lucide-react'
import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface VoiceResponseProps {
  type:
    | 'success'
    | 'error'
    | 'info'
    | 'balance'
    | 'budget'
    | 'bills'
    | 'incoming'
    | 'projection'
    | 'transfer'
  message: string
  data?: any
  className?: string
}

// Memoize the formatCurrency function to prevent recreation
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

// Memoize the BalanceData component
const BalanceData = React.memo(function BalanceData({ data }: { data: any }) {
  return (
    <div className="mt-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Saldo atual:</span>
        <span className="text-lg font-bold text-green-600">
          {formatCurrency(data.currentBalance)}
        </span>
      </div>
      {data.income && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Receitas:</span>
          <span className="text-sm font-medium text-green-600">+{formatCurrency(data.income)}</span>
        </div>
      )}
      {data.expenses && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Despesas:</span>
          <span className="text-sm font-medium text-red-600">-{formatCurrency(data.expenses)}</span>
        </div>
      )}
    </div>
  )
})

// Memoize the BudgetData component
const BudgetData = React.memo(function BudgetData({ data }: { data: any }) {
  const progressBarColor = React.useMemo(() => {
    if (data.spentPercentage > 90) return 'bg-red-500'
    if (data.spentPercentage > 70) return 'bg-orange-500'
    return 'bg-green-500'
  }, [data.spentPercentage])

  return (
    <div className="mt-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Disponível:</span>
        <span className="text-lg font-bold text-green-600">{formatCurrency(data.available)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all duration-300', progressBarColor)}
          style={{ width: `${Math.min(data.spentPercentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">
        {data.spentPercentage.toFixed(1)}% do orçamento utilizado
      </p>
    </div>
  )
})

// Memoize the BillsData component
const BillsData = React.memo(function BillsData({ data }: { data: any }) {
  return (
    <div className="mt-3 space-y-2">
      {data.bills?.slice(0, 3).map((bill: any, index: number) => (
        <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
          <div>
            <p className="text-sm font-medium">{bill.name}</p>
            <p className="text-xs text-gray-500">
              Vence: {new Date(bill.dueDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <span className="text-sm font-bold text-red-600">{formatCurrency(bill.amount)}</span>
        </div>
      ))}
      {data.bills?.length > 3 && (
        <p className="text-xs text-gray-500 text-center">+{data.bills.length - 3} outras contas</p>
      )}
    </div>
  )
})

// Memoize the IncomingData component
const IncomingData = React.memo(function IncomingData({ data }: { data: any }) {
  return (
    <div className="mt-3 space-y-2">
      {data.incoming?.slice(0, 3).map((item: any, index: number) => (
        <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
          <div>
            <p className="text-sm font-medium">{item.source}</p>
            <p className="text-xs text-gray-500">
              Previsto: {new Date(item.expectedDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <span className="text-sm font-bold text-green-600">+{formatCurrency(item.amount)}</span>
        </div>
      ))}
      {data.incoming?.length > 3 && (
        <p className="text-xs text-gray-500 text-center">
          +{data.incoming.length - 3} outros recebimentos
        </p>
      )}
    </div>
  )
})

// Memoize the ProjectionData component
const ProjectionData = React.memo(function ProjectionData({ data }: { data: any }) {
  const projectedBalanceColor = React.useMemo(() => {
    return data.projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'
  }, [data.projectedBalance])

  const variationColor = React.useMemo(() => {
    return data.variation >= 0 ? 'text-green-600' : 'text-red-600'
  }, [data.variation])

  return (
    <div className="mt-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Saldo projetado:</span>
        <span className={cn('text-lg font-bold', projectedBalanceColor)}>
          {formatCurrency(data.projectedBalance)}
        </span>
      </div>
      {data.variation && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Variação:</span>
          <span className={cn('text-sm font-medium', variationColor)}>
            {data.variation >= 0 ? '+' : ''}
            {formatCurrency(data.variation)}
          </span>
        </div>
      )}
    </div>
  )
})

// Memoize the TransferData component
const TransferData = React.memo(function TransferData({ data }: { data: any }) {
  return (
    <div className="mt-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Destinatário:</span>
        <span className="text-sm font-medium">{data.recipient}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Valor:</span>
        <span className="text-sm font-bold text-blue-600">{formatCurrency(data.amount)}</span>
      </div>
      {data.method && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Método:</span>
          <span className="text-sm font-medium">{data.method}</span>
        </div>
      )}
      {data.estimatedTime && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Tempo estimado: {data.estimatedTime}
        </p>
      )}
    </div>
  )
})

export const VoiceResponse = React.memo(function VoiceResponse({
  type,
  message,
  data,
  className,
}: VoiceResponseProps) {
  // Memoize the icon to prevent recalculation
  const icon = React.useMemo(() => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />
      case 'balance':
        return <TrendingUp className="w-6 h-6 text-blue-500" />
      case 'budget':
        return <Info className="w-6 h-6 text-orange-500" />
      case 'bills':
        return <CreditCard className="w-6 h-6 text-red-500" />
      case 'incoming':
        return <ArrowUpRight className="w-6 h-6 text-green-500" />
      case 'projection':
        return <TrendingUp className="w-6 h-6 text-purple-500" />
      case 'transfer':
        return <ArrowUpRight className="w-6 h-6 text-blue-500" />
      default:
        return <Info className="w-6 h-6 text-blue-500" />
    }
  }, [type])

  // Memoize the card color to prevent recalculation
  const cardColor = React.useMemo(() => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'balance':
        return 'border-blue-200 bg-blue-50'
      case 'budget':
        return 'border-orange-200 bg-orange-50'
      case 'bills':
        return 'border-red-200 bg-red-50'
      case 'incoming':
        return 'border-green-200 bg-green-50'
      case 'projection':
        return 'border-purple-200 bg-purple-50'
      case 'transfer':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }, [type])

  // Memoize the render data function
  const renderData = React.useMemo(() => {
    if (!data) return null

    switch (type) {
      case 'balance':
        return <BalanceData data={data} />
      case 'budget':
        return <BudgetData data={data} />
      case 'bills':
        return <BillsData data={data} />
      case 'incoming':
        return <IncomingData data={data} />
      case 'projection':
        return <ProjectionData data={data} />
      case 'transfer':
        return <TransferData data={data} />
      default:
        return null
    }
  }, [type, data])

  return (
    <Card className={cn('border-2 transition-all duration-300', cardColor, className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {icon}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">{message}</p>
            {renderData}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
