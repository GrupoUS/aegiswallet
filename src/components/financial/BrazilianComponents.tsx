/**
 * Brazilian Financial Components - Story 04.03
 * Updated to use proper Card component with animation support
 */

import React from 'react';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters/brazilianFormatters';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database.types';

interface BalanceCardProps {
  balance: number;
  className?: string;
}

export const BalanceCard = React.memo(function BalanceCard({
  balance,
  className,
}: BalanceCardProps) {
  // Memoize formatted balance
  const formattedBalance = React.useMemo(() => {
    return formatCurrency(balance);
  }, [balance]);

  return (
    <Card
      className={cn(
        'border-0 bg-gradient-to-r from-info to-info/90 text-white',
        'transition-all duration-300 hover:shadow-lg',
        'hover:scale-[1.02]',
        className
      )}
    >
      <CardContent className="pt-6">
        <CardDescription className="text-sm text-white/90">Saldo Disponível</CardDescription>
        <h2 className="mt-2 font-bold text-4xl">{formattedBalance}</h2>
      </CardContent>
    </Card>
  );
});

interface TransactionListProps {
  transactions: Database['public']['Tables']['transactions']['Row'][];
  className?: string;
}

export const TransactionList = React.memo(function TransactionList({
  transactions,
  className,
}: TransactionListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {transactions.map((tx) => (
        <TransactionItem key={tx.id} transaction={tx} />
      ))}
    </div>
  );
});

// Memoize the TransactionItem component
const TransactionItem = React.memo(function TransactionItem({
  transaction,
}: {
  transaction: Database['public']['Tables']['transactions']['Row'];
}) {
  // Memoize formatted amount
  const formattedAmount = React.useMemo(() => {
    return formatCurrency(transaction.amount);
  }, [transaction.amount]);

  // Memoize amount color class
  const amountColorClass = React.useMemo(() => {
    return transaction.amount < 0 ? 'text-financial-negative' : 'text-financial-positive';
  }, [transaction.amount]);

  return (
    <div className="flex justify-between rounded bg-gray-50 p-3">
      <span>{transaction.description}</span>
      <span className={amountColorClass}>{formattedAmount}</span>
    </div>
  );
});

interface PIXTransferFormProps {
  className?: string;
}

export const PIXTransferForm = React.memo(function PIXTransferForm({
  className,
}: PIXTransferFormProps) {
  // Memoize submit handler
  const handleSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  }, []);

  return (
    <form className={cn('space-y-4', className)} onSubmit={handleSubmit}>
      <input type="text" placeholder="Chave PIX" className="w-full rounded border p-3" />
      <input type="number" placeholder="Valor (R$)" className="w-full rounded border p-3" />
      <button type="submit" className="w-full rounded bg-info p-3 text-white">
        Transferir
      </button>
    </form>
  );
});
