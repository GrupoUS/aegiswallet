import { eachDayOfInterval, format, isSameDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinancialEvents } from "@/hooks/useFinancialEvents";

export function BalanceChart() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");

  const dateRange = useMemo(() => {
    const end = new Date();
    let start = new Date();
    if (period === "week") {
      start = subDays(end, 7);
    }
    if (period === "month") {
      start = subDays(end, 30);
    }
    if (period === "quarter") {
      start = subDays(end, 90);
    }
    return { end, start };
  }, [period]);

  const { events, loading } = useFinancialEvents(
    {
      endDate: dateRange.end.toISOString(),
      startDate: dateRange.start.toISOString(),
      status: "all",
    },
    {
      page: 1,
      limit: 1000, // Fetch enough events for the chart
      sortBy: "due_date",
      sortOrder: "asc",
    },
  );

  const data = useMemo(() => {
    if (loading) {
      return [];
    }

    const days = eachDayOfInterval({
      end: dateRange.end,
      start: dateRange.start,
    });

    return days.map((day) => {
      const dayEvents = events.filter((e) => isSameDay(new Date(e.start), day));

      const income = dayEvents
        .filter((e) => e.type === "income")
        .reduce((sum, e) => sum + e.amount, 0);

      const expense = dayEvents
        .filter((e) => e.type !== "income")
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);

      return {
        balance: income - expense,
        date: format(day, "dd/MM"),
        expense,
        fullDate: format(day, "dd 'de' MMMM", { locale: ptBR }),
        income,
      };
    });
  }, [events, loading, dateRange]);

  if (loading) {
    return <Card className="h-[400px] animate-pulse bg-muted" />;
  }

  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-normal">Fluxo de Caixa</CardTitle>
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as "week" | "month" | "quarter")}
          className="space-y-0"
        >
          <TabsList>
            <TabsTrigger value="week">7 dias</TabsTrigger>
            <TabsTrigger value="month">30 dias</TabsTrigger>
            <TabsTrigger value="quarter">90 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Receitas
                            </span>
                            <span className="font-bold text-emerald-500">
                              R$ {payload[0].value}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Despesas
                            </span>
                            <span className="font-bold text-rose-500">
                              R$ {payload[1].value}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
                          {payload[0].payload.fullDate}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorIncome)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#f43f5e"
                fillOpacity={1}
                fill="url(#colorExpense)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
