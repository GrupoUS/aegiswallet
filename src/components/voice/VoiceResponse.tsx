import { AlertCircle, ArrowUpRight, CheckCircle, CreditCard, Info, TrendingUp } from 'lucide-react'
import React from 'react'
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

export function VoiceResponse({ type, message, data, className }: VoiceResponseProps) {
  const getIcon = () => {
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
  }

  const getCardColor = () => {
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
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount)
  }

  const renderData = () => {
    if (!data) return null

    switch (type) {
      case 'balance':
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
                <span className="text-sm font-medium text-green-600">
                  +{formatCurrency(data.income)}
                </span>
              </div>
            )}
            {data.expenses && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Despesas:</span>
                <span className="text-sm font-medium text-red-600">
                  -{formatCurrency(data.expenses)}
                </span>
              </div>
            )}
          </div>
        )

      case 'budget':
        return (
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Disponível:</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(data.available)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  data.spentPercentage > 90
                    ? 'bg-red-500'
                    : data.spentPercentage > 70
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                )}
                style={{ width: `${Math.min(data.spentPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {data.spentPercentage.toFixed(1)}% do orçamento utilizado
            </p>
          </div>
        )

      case 'bills':
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
                <span className="text-sm font-bold text-red-600">
                  {formatCurrency(bill.amount)}
                </span>
              </div>
            ))}
            {data.bills?.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{data.bills.length - 3} outras contas
              </p>
            )}
          </div>
        )

      case 'incoming':
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
                <span className="text-sm font-bold text-green-600">
                  +{formatCurrency(item.amount)}
                </span>
              </div>
            ))}
            {data.incoming?.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{data.incoming.length - 3} outros recebimentos
              </p>
            )}
          </div>
        )

      case 'projection':
        return (
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Saldo projetado:</span>
              <span
                className={cn(
                  'text-lg font-bold',
                  data.projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {formatCurrency(data.projectedBalance)}
              </span>
            </div>
            {data.variation && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Variação:</span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    data.variation >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {data.variation >= 0 ? '+' : ''}
                  {formatCurrency(data.variation)}
                </span>
              </div>
            )}
          </div>
        )

      case 'transfer':
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

      default:
        return null
    }
  }

  return (
    <Card className={cn('border-2 transition-all duration-300', getCardColor(), className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">{message}</p>
            {renderData()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
