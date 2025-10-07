/**
 * Brazilian Financial Components - Story 04.03
 * Updated to use proper Card component with animation support
 */

import React from 'react'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters/brazilianFormatters'
import { cn } from '@/lib/utils'

interface BalanceCardProps {
  balance: number
  className?: string
}

export const BalanceCard = React.memo(function BalanceCard({
  balance,
  className,
}: BalanceCardProps) {
  // Memoize formatted balance
  const formattedBalance = React.useMemo(() => {
    return formatCurrency(balance)
  }, [balance])

  return (
    <Card
      className={cn(
        'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0',
        'hover:shadow-lg transition-all duration-300',
        'hover:scale-[1.02]',
        className
      )}
    >
      <CardContent className="pt-6">
        <CardDescription className="text-white/90 text-sm">Saldo Disponível</CardDescription>
        <h2 className="text-4xl font-bold mt-2">{formattedBalance}</h2>
      </CardContent>
    </Card>
  )
})

interface TransactionListProps {
  transactions: any[]
  className?: string
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
  )
})

// Memoize the TransactionItem component
const TransactionItem = React.memo(function TransactionItem({ transaction }: { transaction: any }) {
  // Memoize formatted amount
  const formattedAmount = React.useMemo(() => {
    return formatCurrency(transaction.amount)
  }, [transaction.amount])

  // Memoize amount color class
  const amountColorClass = React.useMemo(() => {
    return transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
  }, [transaction.amount])

  return (
    <div className="flex justify-between p-3 bg-gray-50 rounded">
      <span>{transaction.description}</span>
      <span className={amountColorClass}>{formattedAmount}</span>
    </div>
  )
})

interface PIXTransferFormProps {
  className?: string
}

export const PIXTransferForm = React.memo(function PIXTransferForm({
  className,
}: PIXTransferFormProps) {
  // Memoize submit handler
  const handleSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
  }, [])

  return (
    <form className={cn('space-y-4', className)} onSubmit={handleSubmit}>
      <input type="text" placeholder="Chave PIX" className="w-full p-3 border rounded" />
      <input type="number" placeholder="Valor (R$)" className="w-full p-3 border rounded" />
      <button type="submit" className="w-full bg-blue-500 text-white p-3 rounded">
        Transferir
      </button>
    </form>
  )
})
