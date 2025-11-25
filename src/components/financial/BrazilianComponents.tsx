import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  balance: number;
  className?: string;
}

export function BalanceCard({ balance, className }: BalanceCardProps) {
  return (
    <Card className={cn('w-full', className)} variant="glass">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-muted-foreground text-sm">Saldo Atual</p>
            <p className="font-bold text-2xl text-primary">{formatCurrency(balance)}</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <div className="h-4 w-4 rounded-full bg-primary/20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TransactionItemProps {
  description: string;
  amount: number;
  date: Date;
  type: 'income' | 'expense';
  className?: string;
}

export function TransactionItem({
  description,
  amount,
  date,
  type,
  className,
}: TransactionItemProps) {
  const isIncome = type === 'income';

  return (
    <div className={cn('flex items-center justify-between rounded-lg border p-4', className)}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            isIncome ? 'bg-green-100' : 'bg-red-100'
          )}
        >
          <DollarSign className={cn('h-5 w-5', isIncome ? 'text-green-600' : 'text-red-600')} />
        </div>
        <div>
          <p className="font-medium">{description}</p>
          <p className="text-muted-foreground text-sm">
            {format(date, "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn('font-semibold', isIncome ? 'text-green-600' : 'text-red-600')}>
          {isIncome ? '+' : '-'} {formatCurrency(amount)}
        </p>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  className?: string;
}

export function StatsCard({ title, value, change, icon, className }: StatsCardProps) {
  const isPositive = change && change > 0;

  return (
    <Card className={cn('w-full', className)} variant="glass">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-muted-foreground text-sm">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl">{value}</div>
        {change !== undefined && (
          <p className="text-muted-foreground text-xs">
            <span className={cn('font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
              {isPositive ? '+' : ''}
              {change}%
            </span>{' '}
            em relação ao mês anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface BudgetProgressProps {
  category: string;
  spent: number;
  budget: number;
  className?: string;
}

export function BudgetProgress({ category, spent, budget, className }: BudgetProgressProps) {
  const percentage = Math.min((spent / budget) * 100, 100);
  const isOverBudget = spent > budget;

  return (
    <div className={cn('space-y-2 rounded-lg border p-4', className)}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{category}</span>
        <Badge variant={isOverBudget ? 'destructive' : 'secondary'}>{percentage.toFixed(0)}%</Badge>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary">
        <div
          className={cn(
            'h-2 rounded-full transition-all',
            isOverBudget ? 'bg-red-500' : 'bg-green-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <span>{formatCurrency(spent)} gastados</span>
        <span>de {formatCurrency(budget)}</span>
      </div>
    </div>
  );
}

interface PaymentReminderProps {
  title: string;
  dueDate: Date;
  amount: number;
  status?: 'pending' | 'paid' | 'overdue';
  className?: string;
}

export function PaymentReminder({
  title,
  dueDate,
  amount,
  status = 'pending',
  className,
}: PaymentReminderProps) {
  const isOverdue = status === 'overdue';
  const isPaid = status === 'paid';

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-4',
        isOverdue && 'border-red-200 bg-red-50',
        isPaid && 'border-green-200 bg-green-50',
        className
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          isOverdue && 'bg-red-100',
          isPaid && 'bg-green-100',
          !isOverdue && !isPaid && 'bg-yellow-100'
        )}
      >
        <Calendar
          className={cn(
            'h-5 w-5',
            isOverdue && 'text-red-600',
            isPaid && 'text-green-600',
            !isOverdue && !isPaid && 'text-yellow-600'
          )}
        />
      </div>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">
          Vence em {format(dueDate, "dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold">{formatCurrency(amount)}</p>
        <Badge
          variant={isOverdue ? 'destructive' : isPaid ? 'default' : 'secondary'}
          className="text-xs"
        >
          {isOverdue ? 'Vencido' : isPaid ? 'Pago' : 'Pendente'}
        </Badge>
      </div>
    </div>
  );
}

// Utility function for currency formatting
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(value);
}

interface QuickActionsProps {
  onPixTransfer?: () => void;
  onPayBill?: () => void;
  onViewBalance?: () => void;
  onTransfer?: () => void;
  className?: string;
}

export function QuickActions({
  onPayBill,
  onViewBalance,
  onTransfer,
  className,
}: QuickActionsProps) {
  const actions = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      id: 'transfer',
      label: 'Transferência',
      onClick: onTransfer,
      primary: true,
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      id: 'pay-bill',
      label: 'Pagar Conta',
      onClick: onPayBill,
      primary: false,
    },
    {
      icon: <DollarSign className="h-5 w-5" />,
      id: 'view-balance',
      label: 'Ver Saldo',
      onClick: onViewBalance,
      primary: false,
    },
  ];

  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-3', className)}>
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.onClick}
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg border p-3 font-medium text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            action.primary && 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}
