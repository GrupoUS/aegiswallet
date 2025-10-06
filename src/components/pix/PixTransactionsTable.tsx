'use client'

import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePixTransactions } from '@/hooks/usePix'
import { cn } from '@/lib/utils'
import type { PixTransaction } from '@/types/pix'
import { maskPixKey } from '@/types/pix'

function getStatusIcon(status: PixTransaction['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    case 'processing':
      return <Clock className="w-4 h-4 text-yellow-500" />
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />
    default:
      return <Clock className="w-4 h-4 text-gray-500" />
  }
}

function getStatusBadge(status: PixTransaction['status']) {
  const config = {
    completed: {
      variant: 'default' as const,
      label: 'Concluída',
      className:
        'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-800',
    },
    processing: {
      variant: 'secondary' as const,
      label: 'Processando',
      className:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    },
    failed: {
      variant: 'destructive' as const,
      label: 'Falhou',
      className:
        'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800',
    },
    pending: {
      variant: 'outline' as const,
      label: 'Pendente',
      className:
        'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
    },
    cancelled: {
      variant: 'outline' as const,
      label: 'Cancelada',
      className:
        'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
    },
  }

  const { variant, label, className } = config[status]

  return (
    <Badge variant={variant} className={cn('font-medium', className)}>
      {label}
    </Badge>
  )
}

export function PixTransactionsTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const { transactions, isLoading } = usePixTransactions()

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    if (!searchTerm.trim()) return transactions

    return transactions.filter(
      (tx) =>
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.pixKey.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [transactions, searchTerm])

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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                  <TableCell colSpan={7} className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {searchTerm
                      ? 'Nenhuma transação encontrada'
                      : 'Você ainda não tem transações PIX'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
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
                              'flex items-center gap-2 px-2 py-1 rounded-md',
                              'bg-red-100 dark:bg-red-950/30'
                            )}
                          >
                            <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm font-medium text-red-700 dark:text-red-400">
                              Enviado
                            </span>
                          </div>
                        ) : (
                          <div
                            className={cn(
                              'flex items-center gap-2 px-2 py-1 rounded-md',
                              'bg-green-100 dark:bg-green-950/30'
                            )}
                          >
                            <ArrowDownLeft className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">
                              Recebido
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.recipientName || 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {maskPixKey(transaction.pixKey, transaction.pixKeyType)}
                    </TableCell>
                    <TableCell>{transaction.description || '-'}</TableCell>
                    <TableCell
                      className={`text-right font-bold ${
                        transaction.type === 'sent' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {transaction.type === 'sent' ? '-' : '+'}
                      R$ {transaction.amount.toFixed(2).replace('.', ',')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        {getStatusBadge(transaction.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Load more button */}
        <div className="flex justify-center mt-4">
          <Button variant="outline">Carregar mais transações</Button>
        </div>
      </CardContent>
    </Card>
  )
}
