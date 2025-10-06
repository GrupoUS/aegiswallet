"use client"

import { useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { TrendingUp, TrendingDown } from "lucide-react"

// Mock data - replace with real data from tRPC/Supabase
const mockDailyData = [
  { date: "2025-01-01", sent: 150.00, received: 280.50, total: 430.50 },
  { date: "2025-01-02", sent: 220.00, received: 190.00, total: 410.00 },
  { date: "2025-01-03", sent: 180.00, received: 350.00, total: 530.00 },
  { date: "2025-01-04", sent: 300.00, received: 240.00, total: 540.00 },
  { date: "2025-01-05", sent: 250.00, received: 420.00, total: 670.00 },
  { date: "2025-01-06", sent: 190.00, received: 310.00, total: 500.00 },
  { date: "2025-01-07", sent: 280.00, received: 380.00, total: 660.00 },
]

const chartConfig = {
  sent: {
    label: "Enviado",
    color: "hsl(var(--chart-1))",
  },
  received: {
    label: "Recebido",
    color: "hsl(var(--chart-2))",
  },
  total: {
    label: "Total",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

const TIME_PERIODS = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "1y", label: "1a" },
]

export function PixChart() {
  const [selectedPeriod, setSelectedPeriod] = useState("7d")
  
  // Calculate stats
  const totalSent = mockDailyData.reduce((sum, d) => sum + d.sent, 0)
  const totalReceived = mockDailyData.reduce((sum, d) => sum + d.received, 0)
  const balance = totalReceived - totalSent
  const isPositive = balance >= 0

  return (
    <Card className="gap-4">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle>Transações PIX</CardTitle>
            <div className="font-bold text-3xl mb-1">
              <span className="text-xl text-muted-foreground">R$</span>
              {balance.toFixed(2).replace('.', ',')}
            </div>
            <div className={`text-sm font-medium flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isPositive ? '+' : ''}{balance.toFixed(2).replace('.', ',')} no período
            </div>
          </div>
          <div className="bg-muted dark:bg-background/50 inline-flex h-8 rounded-full p-1 shrink-0">
            <RadioGroup
              value={selectedPeriod}
              onValueChange={setSelectedPeriod}
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
                    className={`inline-flex h-6 min-w-8 cursor-pointer items-center justify-center px-2 whitespace-nowrap transition-colors select-none text-xs uppercase rounded-full ${
                      selectedPeriod === period.value
                        ? 'bg-background dark:bg-card/64 text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
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
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={mockDailyData}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
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
                    year: 'numeric'
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
          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
            <div className="text-xs text-muted-foreground">Enviado</div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              R$ {totalSent.toFixed(2).replace('.', ',')}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
            <div className="text-xs text-muted-foreground">Recebido</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              R$ {totalReceived.toFixed(2).replace('.', ',')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
