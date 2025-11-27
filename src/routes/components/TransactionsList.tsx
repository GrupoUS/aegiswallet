import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeftRight,
  FileText,
  MoreVertical,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { FinancialAmount } from '@/components/financial-amount';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type Transaction, useDeleteTransaction, useTransactions } from '@/hooks/use-transactions';
import { useBankAccounts } from '@/hooks/useBankAccounts';

export default function TransactionsList() {
  const { data: transactions, isLoading, refetch } = useTransactions({ limit: 20 });
  const deleteMutation = useDeleteTransaction();
  const { updateBalance, accounts } = useBankAccounts();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deletingId) {
      return;
    }

    // Find transaction to revert balance
    const transaction = (transactions as Transaction[] | undefined)?.find(
      (t) => t.id === deletingId
    );

    try {
      await deleteMutation.mutateAsync({ id: deletingId });

      // Revert balance if possible
      if (transaction?.account_id) {
        const account = accounts.find((a) => a.id === transaction.account_id);
        if (account) {
          // Inverse amount: subtract transaction amount (which is signed)
          // If transaction was -100 (debit), we need to add 100.
          // So: current - (-100) = current + 100.
          // So: balance - transaction.amount
          await updateBalance({
            balance: Number(account.balance) - Number(transaction.amount),
            id: transaction.account_id,
          });
        }
      }

      setDeletingId(null);
      refetch();
    } catch (_error) {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case 'debit':
        return <TrendingDown className="h-5 w-5 text-rose-500" />;
      case 'boleto':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'pix':
        return <ArrowLeftRight className="h-5 w-5 text-blue-500" />;
      case 'transfer':
        return <ArrowLeftRight className="h-5 w-5 text-violet-500" />;
      default:
        return <TrendingDown className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'posted':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Concluído</Badge>;
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Pendente
          </Badge>
        );
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transações</CardTitle>
            <CardDescription>Gerencie suas movimentações</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(transactions as Transaction[]).map((transaction) => (
              <div
                key={transaction.id}
                className="w-full text-left flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-background border shadow-sm">
                    {getIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-medium leading-none">{transaction.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(transaction.created_at), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </span>
                      {transaction.type && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{transaction.type}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <FinancialAmount
                      amount={Number(transaction.amount)}
                      className={
                        Number(transaction.amount) > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }
                    />
                    <div className="flex justify-end mt-1">
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={() => setDeletingId(transaction.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}

        <ConfirmDialog
          open={!!deletingId}
          onOpenChange={(open) => !open && setDeletingId(null)}
          title="Excluir Transação"
          description="Tem certeza que deseja excluir esta transação? O saldo da conta será revertido."
          onConfirm={handleDelete}
          variant="destructive"
        />
      </CardContent>
    </Card>
  );
}
