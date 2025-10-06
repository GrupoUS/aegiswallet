/**
 * Brazilian Financial Components - Story 04.03
 * Updated to use proper Card component with animation support
 */

import React from 'react'
import { formatCurrency } from '@/lib/formatters/brazilianFormatters'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface BalanceCardProps {
  balance: number
  className?: string
}

export function BalanceCard({ balance, className }: BalanceCardProps) {
  return (
    <Card
      className={cn(
        "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0",
        "hover:shadow-lg transition-all duration-300",
        "hover:scale-[1.02]",
        className
      )}
    >
      <CardContent className="pt-6">
        <CardDescription className="text-white/90 text-sm">
          Saldo Disponível
        </CardDescription>
        <h2 className="text-4xl font-bold mt-2">{formatCurrency(balance)}</h2>
      </CardContent>
    </Card>
  )
}

export function TransactionList({ transactions }: { transactions: any[] }) {
  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div key={tx.id} className="flex justify-between p-3 bg-gray-50 rounded">
          <span>{tx.description}</span>
          <span className={tx.amount < 0 ? 'text-red-600' : 'text-green-600'}>
            {formatCurrency(tx.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function PIXTransferForm() {
  return (
    <form className="space-y-4">
      <input type="text" placeholder="Chave PIX" className="w-full p-3 border rounded" />
      <input type="number" placeholder="Valor (R$)" className="w-full p-3 border rounded" />
      <button type="submit" className="w-full bg-blue-500 text-white p-3 rounded">
        Transferir
      </button>
    </form>
  )
}
