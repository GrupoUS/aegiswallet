'use client';

import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePixTransactions } from '@/hooks/usePix';
import { cn } from '@/lib/utils';
import type { PixTransaction } from '@/types/pix';
import { maskPixKey } from '@/types/pix';

const getStatusIcon = React.memo(function getStatusIcon(status: PixTransaction['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'processing':
      return <Clock className="h-4 w-4 text-warning" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
});

const getStatusBadge = React.memo(function getStatusBadge(status: PixTransaction['status']) {
  const config = {
    cancelled: {
      className:
        'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
      label: 'Cancelada',
      variant: 'outline' as const,
    },
    completed: {
      className: 'bg-success/10 text-success border-success/20',
      label: 'Concluída',
      variant: 'default' as const,
    },
    failed: {
      className: 'bg-destructive/10 text-destructive border-destructive/20',
      label: 'Falhou',
      variant: 'destructive' as const,
    },
    pending: {
      className:
        'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
      label: 'Pendente',
      variant: 'outline' as const,
    },
    processing: {
      className: 'bg-warning/10 text-warning border-warning/20',
      label: 'Processando',
      variant: 'secondary' as const,
    },
  };

  const { variant, label, className } = config[status];

  return (
    <Badge variant={variant} className={cn('font-medium', className)}>
      {label}
    </Badge>
  );
});

export const PixTransactionsTable = React.memo(function PixTransactionsTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const { transactions, isLoading } = usePixTransactions();

  const filteredTransactions = useMemo(() => {
    if (!transactions) {
      return [];
    }
    if (!searchTerm.trim()) {
      return transactions;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return transactions.filter(
      (tx) =>
        tx.description?.toLowerCase().includes(lowerSearchTerm) ||
        tx.recipientName?.toLowerCase().includes(lowerSearchTerm) ||
        tx.pixKey.toLowerCase().includes(lowerSearchTerm)
    );
  }, [transactions, searchTerm]);

  // Otimizar manipuladores com useCallback
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleLoadMore = useCallback(() => {}, []);

  return (
    <Card
      className={cn(
        'shadow-[0_1px_1px_rgba(0,0,0,0.05),_0_2px_2px_rgba(0,0,0,0.05),_0_4px_4px_rgba(0,0,0,0.05),_0_8px_8px_rgba(0,0,0,0.05)]',
        'dark:shadow-[0_1px_1px_rgba(255,255,255,0.02),_0_2px_2px_rgba(255,255,255,0.02)]'
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transações Recentes</CardTitle>
          <div className="relative w-64">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Tipo</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Chave PIX</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    {searchTerm
                      ? 'Nenhuma transação encontrada'
                      : 'Você ainda não tem transações PIX'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Load more button */}
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={handleLoadMore}>
            Carregar mais transações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

// Componente separado para a linha da transação com React.memo
const TransactionRow = React.memo(function TransactionRow({
  transaction,
}: {
  transaction: PixTransaction;
}) {
  // Memoizar a data formatada
  const formattedDate = useMemo(() => {
    return new Date(transaction.createdAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: '2-digit',
    });
  }, [transaction.createdAt]);

  // Memoizar o valor formatado
  const formattedAmount = useMemo(() => {
    return `${transaction.type === 'sent' ? '-' : '+'}R$ ${transaction.amount.toFixed(2).replace('.', ',')}`;
  }, [transaction.type, transaction.amount]);

  return (
    <TableRow
      className={cn(
        'transition-all duration-200',
        'hover:bg-muted/50',
        'hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_2px_4px_rgba(255,255,255,0.02)]',
        'cursor-pointer'
      )}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          {transaction.type === 'sent' ? (
            <div
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1',
                'bg-financial-negative/10'
              )}
            >
              <ArrowUpRight className="h-4 w-4 text-financial-negative" />
              <span className="font-medium text-financial-negative text-sm">Enviado</span>
            </div>
          ) : (
            <div
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1',
                'bg-financial-positive/10'
              )}
            >
              <ArrowDownLeft className="h-4 w-4 text-financial-positive" />
              <span className="font-medium text-financial-positive text-sm">Recebido</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="font-medium">{transaction.recipientName || 'N/A'}</TableCell>
      <TableCell className="font-mono text-sm">
        {maskPixKey(transaction.pixKey, transaction.pixKeyType)}
      </TableCell>
      <TableCell>{transaction.description || '-'}</TableCell>
      <TableCell
        className={`text-right font-bold ${
          transaction.type === 'sent' ? 'text-financial-negative' : 'text-financial-positive'
        }`}
      >
        {formattedAmount}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {getStatusIcon(transaction.status)}
          {getStatusBadge(transaction.status)}
        </div>
      </TableCell>
      <TableCell className="text-right text-muted-foreground text-sm">{formattedDate}</TableCell>
    </TableRow>
  );
});
