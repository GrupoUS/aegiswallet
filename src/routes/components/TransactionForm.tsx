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
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCreateTransaction } from '@/hooks/use-transactions';

interface TransactionFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

export default function TransactionForm({ onCancel, onSuccess }: TransactionFormProps) {
  const { mutateAsync: createTransaction } = useCreateTransaction();
  const { accounts, updateBalance } = useBankAccounts();
  const [isLoading, setIsLoading] = useState(false);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'credit' | 'debit' | 'pix' | 'boleto' | 'transfer'>('debit');
  const [accountId, setAccountId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || !date || !accountId || !type) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      const numericAmount = parseFloat(amount);
      // For debit/transfer/pix/boleto, amount in DB usually negative for expenses or handled by type.
      // The plan says: "account_id, amount, type, description, date".
      // Typically amount is signed based on type? Or backend handles it?
      // QuickActionModal logic:
      // credit -> amount positive
      // debit -> amount negative
      // Let's assume we send signed amount.

      let finalAmount = Math.abs(numericAmount);
      if (['debit', 'pix', 'boleto', 'transfer'].includes(type)) {
        finalAmount = -finalAmount;
      }

      await createTransaction({
        description,
        amount: finalAmount,
        type,
        date: new Date(date).toISOString(),
        account_id: accountId,
        status: 'posted' // Assuming instant transaction
      });

      // Update account balance
      const account = accounts.find(a => a.id === accountId);
      if (account) {
         await updateBalance({
             id: accountId,
             balance: Number(account.balance) + finalAmount
         });
      }

      toast.success('Transação criada com sucesso!');

      if (onSuccess) {
        onSuccess();
      }

      // Reset
      setDescription('');
      setAmount('');
      setType('debit');
    } catch (error: any) {
      toast.error('Erro ao criar transação: ' + (error.message || 'Erro desconhecido'));
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Select value={type} onValueChange={(v: any) => setType(v)}>
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
                  {accounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.institution_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
