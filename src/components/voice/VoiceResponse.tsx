import { AlertCircle, ArrowUpRight, CheckCircle, CreditCard, Info, TrendingUp } from 'lucide-react';
import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    | 'transfer';
  message: string;
  data?: any;
  className?: string;
}

// Memoize the formatCurrency function to prevent recreation
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

// Memoize the BalanceData component
const BalanceData = React.memo(function BalanceData({ data }: { data: any }) {
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-sm">Saldo atual:</span>
        <span className="font-bold text-financial-positive text-lg">
          {formatCurrency(data.currentBalance)}
        </span>
      </div>
      {data.income && (
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Receitas:</span>
          <span className="font-medium text-financial-positive text-sm">
            +{formatCurrency(data.income)}
          </span>
        </div>
      )}
      {data.expenses && (
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Despesas:</span>
          <span className="font-medium text-financial-negative text-sm">
            -{formatCurrency(data.expenses)}
          </span>
        </div>
      )}
    </div>
  );
});

// Memoize the BudgetData component
const BudgetData = React.memo(function BudgetData({ data }: { data: any }) {
  const progressBarColor = React.useMemo(() => {
    if (data.spentPercentage > 90) return 'bg-destructive';
    if (data.spentPercentage > 70) return 'bg-warning';
    return 'bg-success';
  }, [data.spentPercentage]);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-sm">Disponível:</span>
        <span className="font-bold text-financial-positive text-lg">
          {formatCurrency(data.available)}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className={cn('h-2 rounded-full transition-all duration-300', progressBarColor)}
          style={{ width: `${Math.min(data.spentPercentage, 100)}%` }}
        />
      </div>
      <p className="text-gray-500 text-xs">
        {data.spentPercentage.toFixed(1)}% do orçamento utilizado
      </p>
    </div>
  );
});

// Memoize the BillsData component
const BillsData = React.memo(function BillsData({ data }: { data: any }) {
  return (
    <div className="mt-3 space-y-2">
      {data.bills?.slice(0, 3).map((bill: any) => (
        <div
          key={bill.id || bill.name}
          className="flex items-center justify-between rounded bg-white p-2"
        >
          <div>
            <p className="font-medium text-sm">{bill.name}</p>
            <p className="text-gray-500 text-xs">
              Vence: {new Date(bill.dueDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <span className="font-bold text-financial-negative text-sm">
            {formatCurrency(bill.amount)}
          </span>
        </div>
      ))}
      {data.bills?.length > 3 && (
        <p className="text-center text-gray-500 text-xs">+{data.bills.length - 3} outras contas</p>
      )}
    </div>
  );
});

// Memoize the IncomingData component
const IncomingData = React.memo(function IncomingData({ data }: { data: any }) {
  return (
    <div className="mt-3 space-y-2">
      {data.incoming?.slice(0, 3).map((item: any) => (
        <div
          key={item.id || item.source}
          className="flex items-center justify-between rounded bg-white p-2"
        >
          <div>
            <p className="font-medium text-sm">{item.source}</p>
            <p className="text-gray-500 text-xs">
              Previsto: {new Date(item.expectedDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <span className="font-bold text-financial-positive text-sm">
            +{formatCurrency(item.amount)}
          </span>
        </div>
      ))}
      {data.incoming?.length > 3 && (
        <p className="text-center text-gray-500 text-xs">
          +{data.incoming.length - 3} outros recebimentos
        </p>
      )}
    </div>
  );
});

// Memoize the ProjectionData component
const ProjectionData = React.memo(function ProjectionData({ data }: { data: any }) {
  const projectedBalanceColor = React.useMemo(() => {
    return data.projectedBalance >= 0 ? 'text-financial-positive' : 'text-financial-negative';
  }, [data.projectedBalance]);

  const variationColor = React.useMemo(() => {
    return data.variation >= 0 ? 'text-financial-positive' : 'text-financial-negative';
  }, [data.variation]);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-sm">Saldo projetado:</span>
        <span className={cn('font-bold text-lg', projectedBalanceColor)}>
          {formatCurrency(data.projectedBalance)}
        </span>
      </div>
      {data.variation && (
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Variação:</span>
          <span className={cn('font-medium text-sm', variationColor)}>
            {data.variation >= 0 ? '+' : ''}
            {formatCurrency(data.variation)}
          </span>
        </div>
      )}
    </div>
  );
});

// Memoize the TransferData component
const TransferData = React.memo(function TransferData({ data }: { data: any }) {
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-sm">Destinatário:</span>
        <span className="font-medium text-sm">{data.recipient}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-sm">Valor:</span>
        <span className="font-bold text-info text-sm">{formatCurrency(data.amount)}</span>
      </div>
      {data.method && (
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Método:</span>
          <span className="font-medium text-sm">{data.method}</span>
        </div>
      )}
      {data.estimatedTime && (
        <p className="mt-2 text-center text-gray-500 text-xs">
          Tempo estimado: {data.estimatedTime}
        </p>
      )}
    </div>
  );
});

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
        return <CheckCircle className="h-6 w-6 text-success" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-destructive" />;
      case 'balance':
        return <TrendingUp className="h-6 w-6 text-info" />;
      case 'budget':
        return <Info className="h-6 w-6 text-warning" />;
      case 'bills':
        return <CreditCard className="h-6 w-6 text-destructive" />;
      case 'incoming':
        return <ArrowUpRight className="h-6 w-6 text-success" />;
      case 'projection':
        return <TrendingUp className="h-6 w-6 text-accent" />;
      case 'transfer':
        return <ArrowUpRight className="h-6 w-6 text-info" />;
      default:
        return <Info className="h-6 w-6 text-info" />;
    }
  }, [type]);

  // Memoize the card color to prevent recalculation
  const cardColor = React.useMemo(() => {
    switch (type) {
      case 'success':
        return 'border-success/20 bg-success/10';
      case 'error':
        return 'border-destructive/20 bg-destructive/10';
      case 'balance':
        return 'border-info/20 bg-info/10';
      case 'budget':
        return 'border-warning/20 bg-warning/10';
      case 'bills':
        return 'border-destructive/20 bg-destructive/10';
      case 'incoming':
        return 'border-success/20 bg-success/10';
      case 'projection':
        return 'border-accent bg-accent/10';
      case 'transfer':
        return 'border-info/20 bg-info/10';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  }, [type]);

  // Memoize the render data function
  const renderData = React.useMemo(() => {
    if (!data) return null;

    switch (type) {
      case 'balance':
        return <BalanceData data={data} />;
      case 'budget':
        return <BudgetData data={data} />;
      case 'bills':
        return <BillsData data={data} />;
      case 'incoming':
        return <IncomingData data={data} />;
      case 'projection':
        return <ProjectionData data={data} />;
      case 'transfer':
        return <TransferData data={data} />;
      default:
        return null;
    }
  }, [type, data]);

  return (
    <Card className={cn('border-2 transition-all duration-300', cardColor, className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {icon}
          <div className="flex-1">
            <p className="font-medium text-gray-800 text-sm">{message}</p>
            {renderData}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
