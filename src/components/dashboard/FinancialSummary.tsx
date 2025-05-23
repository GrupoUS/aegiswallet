
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface FinancialData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  expensesByCategory: { name: string; value: number; color: string }[];
}

const FinancialSummary = () => {
  const [data, setData] = useState<FinancialData>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    expensesByCategory: [],
  });
  const [loading, setLoading] = useState(true);

  const colors = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe",
    "#00c49f", "#ffbb28", "#ff8042", "#8dd1e1", "#d084d0"
  ];

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar transações do mês atual
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data: transactions } = await supabase
        .from("transactions")
        .select(`
          *,
          categories!inner(name)
        `)
        .eq("user_id", user.id)
        .gte("date", startOfMonth.toISOString().split('T')[0])
        .lte("date", endOfMonth.toISOString().split('T')[0]);

      if (transactions) {
        const income = transactions
          .filter(t => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = transactions
          .filter(t => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Agrupar despesas por categoria
        const expensesByCategory = transactions
          .filter(t => t.type === "expense")
          .reduce((acc, t) => {
            const categoryName = t.categories.name;
            const amount = Number(t.amount);
            
            const existing = acc.find(item => item.name === categoryName);
            if (existing) {
              existing.value += amount;
            } else {
              acc.push({
                name: categoryName,
                value: amount,
                color: colors[acc.length % colors.length],
              });
            }
            return acc;
          }, [] as { name: string; value: number; color: string }[]);

        setData({
          totalIncome: income,
          totalExpenses: expenses,
          balance: income - expenses,
          expensesByCategory,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar dados financeiros:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return <div className="text-center">Carregando dados financeiros...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Financeiro</h2>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">Mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">Mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              data.balance >= 0 ? "text-blue-600" : "text-red-600"
            }`}>
              {formatCurrency(data.balance)}
            </div>
            <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Despesas por Categoria */}
      {data.expensesByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria - Mês Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialSummary;
