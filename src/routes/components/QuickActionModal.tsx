import { ArrowDownCircle, ArrowRightCircle, ArrowUpCircle, Loader2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { FinancialAmount } from '@/components/financial-amount';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

// Type-safe action types for Brazilian financial operations
type QuickActionType = 'transfer' | 'deposit' | 'withdraw';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: QuickActionType;
  onSuccess?: () => void;
}

export function QuickActionModal({
  isOpen,
  onClose,
  actionType,
  onSuccess,
}: QuickActionModalProps) {
  const { accounts, updateBalance } = useBankAccounts();
  const createTransactionMutation = useCreateTransaction();
  const accountList = accounts ?? [];

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getTitle = () => {
    switch (actionType) {
      case 'deposit':
        return 'Novo Depósito';
      case 'withdraw':
        return 'Novo Saque';
      case 'transfer':
        return 'Nova Transferência';
    }
  };

  const getIcon = () => {
    switch (actionType) {
      case 'deposit':
        return <ArrowUpCircle className="h-6 w-6 text-emerald-500" />;
      case 'withdraw':
        return <ArrowDownCircle className="h-6 w-6 text-rose-500" />;
      case 'transfer':
        return <ArrowRightCircle className="h-6 w-6 text-blue-500" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      toast.error('Valor inválido');
      return;
    }
    if (!accountId) {
      toast.error('Selecione uma conta');
      return;
    }
    if (actionType === 'transfer' && !targetAccountId) {
      toast.error('Selecione a conta de destino');
      return;
    }
    if (actionType === 'transfer' && accountId === targetAccountId) {
      toast.error('A conta de destino deve ser diferente da origem');
      return;
    }

    const sourceAccount = accountList.find((a) => a.id === accountId);
    if (!sourceAccount) {
      return;
    }

    const val = Number(amount);

    if (actionType === 'withdraw' && Number(sourceAccount.balance) < val) {
      toast.error('Saldo insuficiente');
      return;
    }

    if (actionType === 'transfer') {
      if (Number(sourceAccount.balance) < val) {
        toast.error('Saldo insuficiente na conta de origem');
        return;
      }
    }

    setIsLoading(true);

    try {
      const _date = new Date().toISOString();

      if (actionType === 'transfer') {
        const targetAccount = accountList.find((a) => a.id === targetAccountId);
        if (!targetAccount) {
          throw new Error('Target account not found');
        }

        // 1. Debit source
        await createTransactionMutation.mutateAsync({
          fromAccountId: accountId,
          amount: -val,
          description: description || `Transferência para ${targetAccount.institution_name}`,
          type: 'transfer',
          status: 'posted',
        });

        // 2. Credit target
        await createTransactionMutation.mutateAsync({
          fromAccountId: targetAccountId,
          amount: val,
          description: description || `Transferência de ${sourceAccount.institution_name}`,
          type: 'transfer',
          status: 'posted',
        });

        // 3. Update balances
        await updateBalance({
          balance: Number(sourceAccount.balance) - val,
          id: accountId,
        });

        await updateBalance({
          balance: Number(targetAccount.balance) + val,
          id: targetAccountId,
        });
      } else if (actionType === 'deposit') {
        // Credit account
        await createTransactionMutation.mutateAsync({
          fromAccountId: accountId,
          amount: val,
          description: description || 'Depósito',
          type: 'credit',
          status: 'posted',
        });

        await updateBalance({
          balance: Number(sourceAccount.balance) + val,
          id: accountId,
        });
      } else if (actionType === 'withdraw') {
        // Debit account
        await createTransactionMutation.mutateAsync({
          fromAccountId: accountId,
          amount: -val,
          description: description || 'Saque',
          type: 'debit',
          status: 'posted',
        });

        await updateBalance({
          balance: Number(sourceAccount.balance) - val,
          id: accountId,
        });
      }

      toast.success('Operação realizada com sucesso!');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      setAmount('');
      setDescription('');
      setAccountId('');
      setTargetAccountId('');
    } catch (_error) {
      toast.error('Erro ao realizar operação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" role="dialog" aria-modal="true">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" id="quick-action-title">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription id="quick-action-description">
            Preencha os dados para realizar a operação.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 py-4"
          noValidate
          aria-labelledby="quick-action-title"
          aria-describedby="quick-action-description"
        >
          <div className="grid gap-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              aria-required="true"
              inputMode="decimal"
              aria-describedby="amount-help"
            />
            <span id="amount-help" className="sr-only">
              Valor monetário em reais para a operação
            </span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="account">Conta {actionType === 'transfer' ? 'de Origem' : ''}</Label>
            <Select value={accountId} onValueChange={setAccountId} required>
              <SelectTrigger id="account">
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {accountList.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.institution_name}
                    {account.account_mask ? ` (${account.account_mask})` : ''} -{' '}
                    <FinancialAmount amount={Number(account.balance)} showSign={false} size="sm" />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {actionType === 'transfer' && (
            <div className="grid gap-2">
              <Label htmlFor="targetAccount">Conta de Destino</Label>
              <Select value={targetAccountId} onValueChange={setTargetAccountId} required>
                <SelectTrigger id="targetAccount">
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accountList
                    .filter((a) => a.id !== accountId)
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.institution_name}
                        {account.account_mask ? ` (${account.account_mask})` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Input
              id="description"
              placeholder="Ex: Pagamento de serviço"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              aria-label="Cancelar operação"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              aria-label={isLoading ? 'Processando operação' : 'Confirmar operação'}
              aria-busy={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
