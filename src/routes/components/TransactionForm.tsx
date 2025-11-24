import { Loader2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTransaction } from '@/hooks/use-transactions';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import type { Tables } from '@/types/database.types';

type TransactionType = 'credit' | 'debit' | 'pix' | 'boleto' | 'transfer';
type AccountRow = Tables<'bank_accounts'>['Row'];

interface TransactionFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

export default function TransactionForm({ onCancel, onSuccess }: TransactionFormProps) {
  const { mutateAsync: createTransaction } = useCreateTransaction();
  const { accounts, updateBalance } = useBankAccounts();
  const accountList: AccountRow[] = accounts ?? [];

  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('debit');
  const [accountId, setAccountId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;

    if (!amount || !date || !accountId || !type) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Valor inválido');
      return;
    }

    const transactionDate = new Date(date);
    if (Number.isNaN(transactionDate.getTime())) {
      toast.error('Data inválida');
      return;
    }

    const account = accountList.find((a) => a.id === accountId);
    if (!account) {
      toast.error('Conta bancária inválida');
      return;
    }

    setIsLoading(true);

    try {
      const finalAmount =
        ['debit', 'pix', 'boleto', 'transfer'].includes(type) && numericAmount > 0
          ? -Math.abs(numericAmount)
          : Math.abs(numericAmount);

      await createTransaction({
        account_id: accountId,
        amount: finalAmount,
        description,
        transaction_date: transactionDate.toISOString(),
        transaction_type: type,
        status: 'posted',
        is_manual_entry: true,
      });

      await updateBalance({
        balance: Number(account.balance ?? 0) + finalAmount,
        id: accountId,
      });

      toast.success('Transação criada com sucesso!');
      onSuccess?.();

      setDescription('');
      setAmount('');
      setType('debit');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao criar transação: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className="border-primary/20 transition-all duration-300 hover:shadow-lg"
      role="form"
      aria-labelledby="transaction-form-title"
    >
      <CardHeader>
        <CardTitle id="transaction-form-title">Nova Transação</CardTitle>
        <CardDescription>Adicione uma nova transação ao seu histórico</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Supermercado"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={type} onValueChange={(value) => setType(value as TransactionType)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Débito</SelectItem>
                  <SelectItem value="credit">Crédito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="account">Conta Bancária</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="account">
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accountList.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.institution_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
