/**
 * Brazilian Financial Components - Story 04.03
 */

import React from 'react'
import { formatCurrency } from '@/lib/formatters/brazilianFormatters'

export function BalanceCard({ balance }: { balance: number }) {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
      <p className="text-sm opacity-90">Saldo Disponível</p>
      <h2 className="text-4xl font-bold mt-2">{formatCurrency(balance)}</h2>
    </div>
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
