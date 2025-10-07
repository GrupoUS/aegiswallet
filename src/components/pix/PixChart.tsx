'use client'

import { isAfter, subDays, subMonths, subYears } from 'date-fns'
import { Loader2, TrendingDown, TrendingUp } from 'lucide-react'
import React, { useCallback, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { usePixTransactions } from '@/hooks/usePix'
import { cn } from '@/lib/utils'

const chartConfig = {
  sent: {
    label: 'Enviado',
    color: 'hsl(var(--chart-1))',
  },
  received: {
    label: 'Recebido',
    color: 'hsl(var(--chart-2))',
  },
  total: {
    label: 'Total',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig

const TIME_PERIODS = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '1y', label: '1a' },
]

export const PixChart = React.memo(function PixChart() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  // Otimizar manipulador de período com useCallback
  const handlePeriodChange = useCallback((value: string) => {
    setSelectedPeriod(value)
  }, [])

  // Fetch transactions
  const { transactions, isLoading } = usePixTransactions()

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    if (!transactions) return []

    const now = new Date()
    let startDate: Date

    switch (selectedPeriod) {
      case '24h':
        startDate = subDays(now, 1)
        break
      case '7d':
        startDate = subDays(now, 7)
        break
      case '30d':
        startDate = subMonths(now, 1)
        break
      case '1y':
        startDate = subYears(now, 1)
        break
      default:
        startDate = subDays(now, 7)
    }

    return transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt)
      return isAfter(txDate, startDate) && tx.status === 'completed'
    })
  }, [transactions, selectedPeriod])

  // Group transactions by date
  const chartData = useMemo(() => {
    const grouped = filteredTransactions.reduce(
      (acc, tx) => {
        const date = new Date(tx.createdAt).toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = { date, sent: 0, received: 0 }
        }

        if (tx.type === 'sent') {
          acc[date].sent += tx.amount
        } else if (tx.type === 'received') {
          acc[date].received += tx.amount
        }

        return acc
      },
      {} as Record<string, { date: string; sent: number; received: number }>
    )

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredTransactions])

  // Otimizar cálculo de estatísticas com useMemo
  const stats = useMemo(() => {
    const totalSent = filteredTransactions
      .filter((tx) => tx.type === 'sent')
      .reduce((sum, tx) => sum + tx.amount, 0)
    const totalReceived = filteredTransactions
      .filter((tx) => tx.type === 'received')
      .reduce((sum, tx) => sum + tx.amount, 0)
    const balance = totalReceived - totalSent
    const isPositive = balance >= 0

    return {
      totalSent,
      totalReceived,
      balance,
      isPositive,
      formattedBalance: balance.toFixed(2).replace('.', ','),
      formattedTotalSent: totalSent.toFixed(2).replace('.', ','),
      formattedTotalReceived: totalReceived.toFixed(2).replace('.', ','),
    }
  }, [filteredTransactions])

  return (
    <Card
      className={cn(
        'gap-4',
        'shadow-[0_1px_1px_rgba(0,0,0,0.05),_0_2px_2px_rgba(0,0,0,0.05),_0_4px_4px_rgba(0,0,0,0.05),_0_8px_8px_rgba(0,0,0,0.05)]',
        'dark:shadow-[0_1px_1px_rgba(255,255,255,0.02),_0_2px_2px_rgba(255,255,255,0.02)]'
      )}
    >
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle>Transações PIX</CardTitle>
            <div className="font-bold text-3xl mb-1">
              <span className="text-xl text-muted-foreground">R$</span>
              {stats.formattedBalance}
            </div>
            <div
              className={`text-sm font-medium flex items-center gap-1 ${stats.isPositive ? 'text-financial-positive' : 'text-financial-negative'}`}
            >
              {stats.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {stats.isPositive ? '+' : ''}
              {stats.formattedBalance} no período
            </div>
          </div>
          <div className="bg-muted dark:bg-background/50 inline-flex h-8 rounded-full p-1 shrink-0">
            <RadioGroup
              value={selectedPeriod}
              onValueChange={handlePeriodChange}
              className="flex gap-1"
            >
              {TIME_PERIODS.map((period) => (
                <div key={period.value} className="relative">
                  <RadioGroupItem
                    id={`period-${period.value}`}
                    value={period.value}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`period-${period.value}`}
                    className={cn(
                      'inline-flex h-6 min-w-8 cursor-pointer items-center justify-center px-2',
                      'whitespace-nowrap transition-all duration-200 select-none text-xs uppercase rounded-full',
                      selectedPeriod === period.value
                        ? cn(
                            'bg-background dark:bg-card/64 text-foreground',
                            'shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_2px_rgba(255,255,255,0.05)]',
                            'relative before:absolute before:inset-0 before:-z-10',
                            'before:bg-pix-primary/20 before:blur-[6px] before:rounded-full'
                          )
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {period.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <p>Nenhuma transação neste período</p>
            <p className="text-xs mt-2">Faça uma transação PIX para ver o gráfico</p>
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `R$ ${value}`}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    labelFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sent"
                    stroke="var(--color-sent)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="received"
                    stroke="var(--color-received)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div
                className={cn(
                  'relative p-3 rounded-lg',
                  'bg-financial-negative/10',
                  'dark:bg-financial-negative/5',
                  'border border-financial-negative/20',
                  'shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                )}
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Enviado</div>
                <div className="text-lg font-bold text-financial-negative">
                  R$ {stats.formattedTotalSent}
                </div>
              </div>
              <div
                className={cn(
                  'relative p-3 rounded-lg',
                  'bg-financial-positive/10',
                  'dark:bg-financial-positive/5',
                  'border border-financial-positive/20',
                  'shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                )}
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Recebido
                </div>
                <div className="text-lg font-bold text-financial-positive">
                  R$ {stats.formattedTotalReceived}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
})
