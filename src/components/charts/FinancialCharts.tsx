'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, PieChart, BarChart3, Calendar, Download } from 'lucide-react';
import { analyticsService } from '@/lib/financial-services';

// Tipos para os dados dos gráficos
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }[];
}

interface ExpenseData {
  category: string;
  amount: number;
}

interface TrendData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

// Componente principal dos gráficos financeiros
export default function FinancialCharts({ userId }: { userId: string }) {
  const [period, setPeriod] = useState('30'); // dias
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'line'>('pie');
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const lineChartRef = useRef<HTMLCanvasElement>(null);

  // Carregar dados financeiros
  useEffect(() => {
    loadFinancialData();
  }, [userId, period]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      // Carregar dados de gastos por categoria
      const expenses = await analyticsService.getExpensesByCategory(
        userId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      // Carregar dados de tendência
      const trends = await analyticsService.getSpendingTrend(userId, 6);

      setExpenseData(expenses);
      setTrendData(trends);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar gráfico de pizza
  const renderPieChart = () => {
    if (!pieChartRef.current || expenseData.length === 0) return;

    const ctx = pieChartRef.current.getContext('2d');
    if (!ctx) return;

    // Limpar canvas anterior
    ctx.clearRect(0, 0, pieChartRef.current.width, pieChartRef.current.height);

    const total = expenseData.reduce((sum, item) => sum + item.amount, 0);
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
      '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];

    let currentAngle = -Math.PI / 2; // Começar do topo
    const centerX = pieChartRef.current.width / 2;
    const centerY = pieChartRef.current.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    expenseData.forEach((item, index) => {
      const sliceAngle = (item.amount / total) * 2 * Math.PI;
      
      // Desenhar fatia
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });

    // Adicionar legenda
    expenseData.forEach((item, index) => {
      const y = 20 + index * 25;
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(10, y, 15, 15);
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.fillText(
        `${item.category}: R$ ${item.amount.toFixed(2)}`,
        30, y + 12
      );
    });
  };

  // Renderizar gráfico de barras
  const renderBarChart = () => {
    if (!barChartRef.current || expenseData.length === 0) return;

    const ctx = barChartRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, barChartRef.current.width, barChartRef.current.height);

    const maxAmount = Math.max(...expenseData.map(item => item.amount));
    const barWidth = (barChartRef.current.width - 100) / expenseData.length;
    const chartHeight = barChartRef.current.height - 100;

    expenseData.forEach((item, index) => {
      const barHeight = (item.amount / maxAmount) * chartHeight;
      const x = 50 + index * barWidth;
      const y = barChartRef.current!.height - 50 - barHeight;

      // Desenhar barra
      ctx.fillStyle = `hsl(${index * 360 / expenseData.length}, 70%, 50%)`;
      ctx.fillRect(x, y, barWidth - 10, barHeight);

      // Rótulo da categoria
      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      ctx.save();
      ctx.translate(x + barWidth / 2, barChartRef.current!.height - 30);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(item.category, 0, 0);
      ctx.restore();

      // Valor
      ctx.fillText(
        `R$ ${item.amount.toFixed(0)}`,
        x + 5,
        y - 5
      );
    });

    // Eixos
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(50, barChartRef.current.height - 50);
    ctx.lineTo(barChartRef.current.width - 50, barChartRef.current.height - 50);
    ctx.stroke();
  };

  // Renderizar gráfico de linha
  const renderLineChart = () => {
    if (!lineChartRef.current || trendData.length === 0) return;

    const ctx = lineChartRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, lineChartRef.current.width, lineChartRef.current.height);

    const maxValue = Math.max(
      ...trendData.flatMap(item => [item.income, item.expenses])
    );
    const chartWidth = lineChartRef.current.width - 100;
    const chartHeight = lineChartRef.current.height - 100;
    const stepX = chartWidth / (trendData.length - 1);

    // Desenhar linhas de receita e gastos
    const drawLine = (data: number[], color: string, label: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();

      data.forEach((value, index) => {
        const x = 50 + index * stepX;
        const y = 50 + chartHeight - (value / maxValue) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        // Pontos
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });

      ctx.stroke();
    };

    // Receitas (verde)
    drawLine(trendData.map(item => item.income), '#10B981', 'Receitas');
    
    // Gastos (vermelho)
    drawLine(trendData.map(item => item.expenses), '#EF4444', 'Gastos');

    // Eixos
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(50, lineChartRef.current.height - 50);
    ctx.lineTo(lineChartRef.current.width - 50, lineChartRef.current.height - 50);
    ctx.stroke();

    // Rótulos dos meses
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    trendData.forEach((item, index) => {
      const x = 50 + index * stepX;
      ctx.fillText(
        item.month,
        x - 15,
        lineChartRef.current!.height - 30
      );
    });

    // Legenda
    ctx.fillStyle = '#10B981';
    ctx.fillRect(lineChartRef.current.width - 150, 20, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText('Receitas', lineChartRef.current.width - 130, 32);

    ctx.fillStyle = '#EF4444';
    ctx.fillRect(lineChartRef.current.width - 150, 45, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText('Gastos', lineChartRef.current.width - 130, 57);
  };

  // Renderizar gráfico baseado no tipo selecionado
  useEffect(() => {
    if (loading) return;

    setTimeout(() => {
      switch (chartType) {
        case 'pie':
          renderPieChart();
          break;
        case 'bar':
          renderBarChart();
          break;
        case 'line':
          renderLineChart();
          break;
      }
    }, 100);
  }, [chartType, expenseData, trendData, loading]);

  // Exportar gráfico como imagem
  const exportChart = () => {
    let canvas: HTMLCanvasElement | null = null;
    
    switch (chartType) {
      case 'pie':
        canvas = pieChartRef.current;
        break;
      case 'bar':
        canvas = barChartRef.current;
        break;
      case 'line':
        canvas = lineChartRef.current;
        break;
    }

    if (canvas) {
      const link = document.createElement('a');
      link.download = `grafico-financeiro-${chartType}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análise Visual dos Gastos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Período:</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                  <SelectItem value="365">1 ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Tipo:</label>
              <div className="flex gap-1">
                <Button
                  variant={chartType === 'pie' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('pie')}
                >
                  <PieChart className="h-4 w-4" />
                </Button>
                <Button
                  variant={chartType === 'bar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('bar')}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={chartType === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('line')}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={exportChart}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            {chartType === 'pie' && (
              <canvas
                ref={pieChartRef}
                width={600}
                height={400}
                className="w-full max-w-2xl mx-auto"
              />
            )}
            
            {chartType === 'bar' && (
              <canvas
                ref={barChartRef}
                width={800}
                height={400}
                className="w-full max-w-4xl mx-auto"
              />
            )}
            
            {chartType === 'line' && (
              <canvas
                ref={lineChartRef}
                width={800}
                height={400}
                className="w-full max-w-4xl mx-auto"
              />
            )}

            {expenseData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dado encontrado para o período selecionado.</p>
                <p className="text-sm">Adicione algumas transações para ver os gráficos.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumo dos dados */}
      {expenseData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseData.map((item, index) => (
                <div key={item.category} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.category}</span>
                    <span className="text-lg font-bold">
                      R$ {item.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(item.amount / Math.max(...expenseData.map(e => e.amount))) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
