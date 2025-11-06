import { TrendingDown, TrendingUp } from 'lucide-react';
import { FinancialAmount } from '@/components/financial-amount';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category?: string;
}

interface TransactionsListProps {
  transactions: Transaction[];
}

function TransactionsList({ transactions }: TransactionsListProps) {
  return (
    <Card className="transition-all duration-300 hover:scale-[1.005] hover:shadow-lg">
      <CardHeader>
        <CardTitle>Histórico Completo de Transações</CardTitle>
        <CardDescription>Todas as suas movimentações financeiras</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all duration-200 hover:scale-[1.01] hover:bg-accent/5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                {transaction.type === 'income' ? (
                  <TrendingUp className="h-5 w-5 text-financial-positive" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-financial-negative" />
                )}
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-muted-foreground text-sm">
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
  );
}

export default TransactionsList;
