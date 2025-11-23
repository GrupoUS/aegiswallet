'use client';

import { isAfter, subDays, subMonths, subYears } from 'date-fns';
import { Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePixTransactions } from '@/hooks/usePix';
import { cn } from '@/lib/utils';

const chartConfig = {
  received: {
    color: 'hsl(var(--chart-2))',
    label: 'Recebido',
  },
  sent: {
    color: 'hsl(var(--chart-1))',
    label: 'Enviado',
  },
  total: {
    color: 'hsl(var(--chart-3))',
    label: 'Total',
  },
} satisfies ChartConfig;

const TIME_PERIODS = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '1a', value: '1y' },
];

export const PixChart = React.memo(function PixChart() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // Otimizar manipulador de período com useCallback
  const handlePeriodChange = useCallback((value: string) => {
    setSelectedPeriod(value);
  }, []);

  // Fetch transactions
  const { transactions, isLoading } = usePixTransactions();

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    if (!transactions) {
      return [];
    }

    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case '24h':
        startDate = subDays(now, 1);
        break;
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subMonths(now, 1);
        break;
      case '1y':
        startDate = subYears(now, 1);
        break;
      default:
        startDate = subDays(now, 7);
    }

    return transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return isAfter(txDate, startDate) && tx.status === 'completed';
    });
  }, [transactions, selectedPeriod]);

  // Group transactions by date
  const chartData = useMemo(() => {
    const grouped = filteredTransactions.reduce(
      (acc, tx) => {
        const date = new Date(tx.createdAt).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, received: 0, sent: 0 };
        }

        if (tx.type === 'sent') {
          acc[date].sent += tx.amount;
        } else if (tx.type === 'received') {
          acc[date].received += tx.amount;
        }

        return acc;
      },
      {} as Record<string, { date: string; sent: number; received: number }>
    );

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTransactions]);

  // Otimizar cálculo de estatísticas com useMemo
  const stats = useMemo(() => {
    const totalSent = filteredTransactions
      .filter((tx) => tx.type === 'sent')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalReceived = filteredTransactions
      .filter((tx) => tx.type === 'received')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const balance = totalReceived - totalSent;
    const isPositive = balance >= 0;

    return {
      balance,
      formattedBalance: balance.toFixed(2).replace('.', ','),
      formattedTotalReceived: totalReceived.toFixed(2).replace('.', ','),
      formattedTotalSent: totalSent.toFixed(2).replace('.', ','),
      isPositive,
      totalReceived,
      totalSent,
    };
  }, [filteredTransactions]);

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
            <div className="mb-1 font-bold text-3xl">
              <span className="text-muted-foreground text-xl">R$</span>
              {stats.formattedBalance}
            </div>
            <div
              className={`flex items-center gap-1 font-medium text-sm ${stats.isPositive ? 'text-financial-positive' : 'text-financial-negative'}`}
            >
              {stats.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {stats.isPositive ? '+' : ''}
              {stats.formattedBalance} no período
            </div>
          </div>
          <div className="inline-flex h-8 shrink-0 rounded-full bg-muted p-1 dark:bg-background/50">
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
                      'select-none whitespace-nowrap rounded-full text-xs uppercase transition-all duration-200',
                      selectedPeriod === period.value
                        ? cn(
                            'bg-background text-foreground dark:bg-card/64',
                            'shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_2px_rgba(255,255,255,0.05)]',
                            'before:-z-10 relative before:absolute before:inset-0',
                            'before:rounded-full before:bg-pix-primary/20 before:blur-[6px]'
                          )
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
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
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center text-muted-foreground">
            <p>Nenhuma transação neste período</p>
            <p className="mt-2 text-xs">Faça uma transação PIX para ver o gráfico</p>
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ bottom: 0, left: 10, right: 10, top: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      });
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
                      const date = new Date(value);
                      return date.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
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
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div
                className={cn(
                  'relative rounded-lg p-3',
                  'bg-financial-negative/10',
                  'dark:bg-financial-negative/5',
                  'border border-financial-negative/20',
                  'shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                )}
              >
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Enviado</div>
                <div className="font-bold text-financial-negative text-lg">
                  R$ {stats.formattedTotalSent}
                </div>
              </div>
              <div
                className={cn(
                  'relative rounded-lg p-3',
                  'bg-financial-positive/10',
                  'dark:bg-financial-positive/5',
                  'border border-financial-positive/20',
                  'shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                )}
              >
                <div className="text-muted-foreground text-xs uppercase tracking-wide">
                  Recebido
                </div>
                <div className="font-bold text-financial-positive text-lg">
                  R$ {stats.formattedTotalReceived}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});
