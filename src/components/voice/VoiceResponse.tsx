import { AlertCircle, ArrowUpRight, CheckCircle, CreditCard, Info, TrendingUp } from 'lucide-react';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  BalanceResponseData,
  BillsResponseData,
  BudgetResponseData,
  ErrorResponseData,
  IncomingResponseData,
  ProjectionResponseData,
  SuccessResponseData,
  TransferResponseData,
  TypedVoiceResponseProps,
  VoiceResponseType,
} from '@/types/voice/responseTypes';
import {
  isBalanceResponse,
  isBillsResponse,
  isBudgetResponse,
  isErrorResponse,
  isIncomingResponse,
  isProjectionResponse,
  isSuccessResponse,
  isTransferResponse,
} from '@/types/voice/responseTypes';

// ============================================================================
// Typed Data Renderer Components
// ============================================================================

const BalanceData: React.FC<{ data: BalanceResponseData }> = ({ data }) => (
  <div className="mt-2 space-y-1">
    <p className="font-medium text-sm">Saldo: R$ {data.currentBalance.toFixed(2)}</p>
    {data.income !== undefined && (
      <p className="text-xs text-muted-foreground">Receitas: R$ {data.income.toFixed(2)}</p>
    )}
    {data.expenses !== undefined && (
      <p className="text-xs text-muted-foreground">Despesas: R$ {data.expenses.toFixed(2)}</p>
    )}
    {data.accountType && <p className="text-xs text-muted-foreground">Conta: {data.accountType}</p>}
  </div>
);

const BudgetData: React.FC<{ data: BudgetResponseData }> = ({ data }) => (
  <div className="mt-2 space-y-1">
    <p className="font-medium text-sm">Disponível: R$ {data.available.toFixed(2)}</p>
    <p className="text-xs text-muted-foreground">
      Gasto: R$ {data.spent.toFixed(2)} / R$ {data.total.toFixed(2)}
    </p>
    <p className="text-xs text-muted-foreground">Utilizado: {data.spentPercentage.toFixed(1)}%</p>
    {data.category && <p className="text-xs text-muted-foreground">Categoria: {data.category}</p>}
  </div>
);

const BillsData: React.FC<{ data: BillsResponseData }> = ({ data }) => (
  <div className="mt-2 space-y-1">
    <p className="font-medium text-sm">
      {data.bills.length} {data.bills.length === 1 ? 'conta' : 'contas'} para pagar
    </p>
    <p className="text-xs text-muted-foreground">Total: R$ {data.totalAmount.toFixed(2)}</p>
    {data.pastDueCount > 0 && (
      <p className="text-xs text-destructive">
        {data.pastDueCount} {data.pastDueCount === 1 ? 'vencida' : 'vencidas'}
      </p>
    )}
    {data.bills.slice(0, 3).map((bill, index) => (
      <p key={`bill-${bill.name}-${index}`} className="text-xs text-muted-foreground">
        {bill.name}: R$ {bill.amount.toFixed(2)}
      </p>
    ))}
  </div>
);

const IncomingData: React.FC<{ data: IncomingResponseData }> = ({ data }) => (
  <div className="mt-2 space-y-1">
    <p className="font-medium text-sm">Recebimentos: R$ {data.totalExpected.toFixed(2)}</p>
    {data.nextIncome && (
      <p className="text-xs text-muted-foreground">
        Próximo: {data.nextIncome.source} - R$ {data.nextIncome.amount.toFixed(2)}
      </p>
    )}
    {data.incoming.slice(0, 3).map((income, index) => (
      <p key={`income-${income.source}-${index}`} className="text-xs text-muted-foreground">
        {income.source}: R$ {income.amount.toFixed(2)}
      </p>
    ))}
  </div>
);

const ProjectionData: React.FC<{ data: ProjectionResponseData }> = ({ data }) => (
  <div className="mt-2 space-y-1">
    <p className="font-medium text-sm">
      Projeção ({data.period}): R$ {data.projectedBalance.toFixed(2)}
    </p>
    <p className="text-xs text-muted-foreground">
      Saldo atual: R$ {data.currentBalance.toFixed(2)}
    </p>
    <p className={cn('text-xs', data.variation >= 0 ? 'text-success' : 'text-destructive')}>
      Variação: {data.variation >= 0 ? '+' : ''}R$ {data.variation.toFixed(2)}
    </p>
    {data.confidence && (
      <p className="text-xs text-muted-foreground">
        Confiança: {(data.confidence * 100).toFixed(0)}%
      </p>
    )}
  </div>
);

const TransferData: React.FC<{ data: TransferResponseData }> = ({ data }) => (
  <div className="mt-2 space-y-1">
    <p className="font-medium text-sm">Para: {data.recipient}</p>
    <p className="text-xs text-muted-foreground">Valor: R$ {data.amount.toFixed(2)}</p>
    <p className="text-xs text-muted-foreground">Método: {data.method}</p>
    <p
      className={cn(
        'font-medium text-xs',
        data.status === 'pending'
          ? 'text-warning'
          : data.status === 'processing'
            ? 'text-info'
            : data.status === 'completed'
              ? 'text-success'
              : 'text-destructive'
      )}
    >
      Status:{' '}
      {
        {
          pending: 'Pendente',
          processing: 'Processando',
          completed: 'Concluído',
          failed: 'Falhou',
        }[data.status]
      }
    </p>
    {data.estimatedTime && (
      <p className="text-xs text-muted-foreground">Tempo estimado: {data.estimatedTime}</p>
    )}
    {data.fees && data.fees > 0 && (
      <p className="text-xs text-muted-foreground">Taxas: R$ {data.fees.toFixed(2)}</p>
    )}
  </div>
);

const SuccessData: React.FC<{ data: SuccessResponseData }> = ({ data }) => (
  <div className="mt-2 space-y-1">
    <p className="text-sm text-success">{data.message}</p>
    {data.action && <p className="text-xs text-muted-foreground">Ação: {data.action}</p>}
    {data.details && <p className="text-xs text-muted-foreground">{data.details}</p>}
  </div>
);

const ErrorData: React.FC<{ data: ErrorResponseData }> = ({ data }) => (
  <div className="mt-2 space-y-1">
    <p className="text-sm text-destructive">{data.message}</p>
    {data.code && <p className="text-xs text-muted-foreground">Código: {data.code}</p>}
    {data.details && <p className="text-xs text-muted-foreground">{data.details}</p>}
    {data.recoverable && <p className="text-xs text-warning">Este erro pode ser recuperado</p>}
    {data.suggestedActions && data.suggestedActions.length > 0 && (
      <div className="mt-1">
        <p className="text-xs font-medium text-muted-foreground">Sugestões:</p>
        {data.suggestedActions.map((action, index) => (
          <p
            key={`suggestion-${action.replace(/\s+/g, '-')}-${index}`}
            className="text-xs text-muted-foreground ml-2"
          >
            • {action}
          </p>
        ))}
      </div>
    )}
  </div>
);

// ============================================================================
// Main VoiceResponse Component
// ============================================================================

export const VoiceResponse = React.memo(function VoiceResponse({
  type,
  message,
  data,
  className,
  timestamp,
  accessibility,
}: TypedVoiceResponseProps) {
  // Memoize icon to prevent recalculation
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
      default: {
        const _exhaustiveCheck: never = type;
        return <Info className="h-6 w-6 text-info" />;
      }
    }
  }, [type]);

  // Memoize card color to prevent recalculation
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
      default: {
        const _exhaustiveCheck: never = type;
        return 'border-gray-200 bg-gray-50';
      }
    }
  }, [type]);

  // Type-safe data rendering with validation
  const renderData = React.useMemo(() => {
    if (!data) return null;

    // Use type guards for safe rendering
    if (type === 'balance' && isBalanceResponse(data)) {
      return <BalanceData data={data} />;
    }
    if (type === 'budget' && isBudgetResponse(data)) {
      return <BudgetData data={data} />;
    }
    if (type === 'bills' && isBillsResponse(data)) {
      return <BillsData data={data} />;
    }
    if (type === 'incoming' && isIncomingResponse(data)) {
      return <IncomingData data={data} />;
    }
    if (type === 'projection' && isProjectionResponse(data)) {
      return <ProjectionData data={data} />;
    }
    if (type === 'transfer' && isTransferResponse(data)) {
      return <TransferData data={data} />;
    }
    if (type === 'success' && isSuccessResponse(data)) {
      return <SuccessData data={data} />;
    }
    if (type === 'error' && isErrorResponse(data)) {
      return <ErrorData data={data} />;
    }

    // Type-safe fallback - this should never happen with proper typing
    console.warn('Invalid data type for VoiceResponse:', { type, data });
    return null;
  }, [type, data]);

  // Generate accessibility properties
  const accessibilityProps = React.useMemo(() => {
    const props: Record<string, any> = {};

    if (accessibility) {
      if (accessibility['aria-live']) {
        props['aria-live'] = accessibility['aria-live'];
      }
      if (accessibility['aria-atomic']) {
        props['aria-atomic'] = accessibility['aria-atomic'];
      }
      if (accessibility.role) {
        props.role = accessibility.role;
      }
    }

    // Default accessibility based on type
    if (!props.role) {
      switch (type) {
        case 'error':
        case 'success':
          props.role = 'alert';
          break;
        case 'transfer':
          props.role = 'status';
          break;
        default:
          props.role = 'status';
      }
    }

    if (!props['aria-live']) {
      props['aria-live'] = type === 'error' ? 'assertive' : 'polite';
    }

    return props;
  }, [accessibility, type]);

  return (
    <Card
      className={cn('border-2 transition-all duration-300', cardColor, className)}
      {...accessibilityProps}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {icon}
          <div className="flex-1">
            <p className="font-medium text-gray-800 text-sm">{message}</p>
            {renderData}
            {timestamp && (
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(timestamp).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

VoiceResponse.displayName = 'VoiceResponse';

// ============================================================================
// Component Type Exports
// ============================================================================

export type {
  TypedVoiceResponseProps,
  VoiceResponseType,
  BalanceResponseData,
  BudgetResponseData,
  BillsResponseData,
  IncomingResponseData,
  ProjectionResponseData,
  TransferResponseData,
  SuccessResponseData,
  ErrorResponseData,
};
