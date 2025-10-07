import { TrendingDown, TrendingUp } from 'lucide-react'
import { FinancialAmount } from '@/components/financial-amount'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Transaction {
  id: number
  description: string
  amount: number
  date: string
  type: 'income' | 'expense'
  category?: string
}

interface TransactionsListProps {
  transactions: Transaction[]
}

function TransactionsList({ transactions }: TransactionsListProps) {
  return (
    <Card className="hover:shadow-lg hover:scale-[1.005] transition-all duration-300">
      <CardHeader>
        <CardTitle>Histórico Completo de Transações</CardTitle>
        <CardDescription>Todas as suas movimentações financeiras</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/5 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {transaction.type === 'income' ? (
                  <TrendingUp className="w-5 h-5 text-financial-positive" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-financial-negative" />
                )}
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.date} {transaction.category && `• ${transaction.category}`}
                  </p>
                </div>
              </div>
              <FinancialAmount amount={transaction.amount} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default TransactionsList
