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
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCreateTransaction } from '@/hooks/use-transactions';

// Type-safe action types for Brazilian financial operations
type QuickActionType = 'transfer' | 'deposit' | 'withdraw';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: QuickActionType;
  onSuccess?: () => void;
}

// Type-safe account interface for component usage
interface BankAccountDisplay {
  id: string;
  institution_name: string;
  account_type: string;
  balance: number;
  is_active: boolean;
  is_primary: boolean;
  account_mask: string; // Assuming this exists or we handle missing
  currency: string;
}

export function QuickActionModal({
  isOpen,
  onClose,
  actionType,
  onSuccess,
}: QuickActionModalProps) {
  const { accounts, updateBalance } = useBankAccounts();
  const { mutateAsync: createTransaction } = useCreateTransaction();

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

    const sourceAccount = accounts.find((a: any) => a.id === accountId);
    if (!sourceAccount) {return;}

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
      const date = new Date().toISOString();

      if (actionType === 'transfer') {
        const targetAccount = accounts.find((a: any) => a.id === targetAccountId);
        if (!targetAccount) {throw new Error("Target account not found");}

        // 1. Debit source
        await createTransaction({
          account_id: accountId, amount: -val, date, description: description || `Transferência para ${targetAccount.institution_name}`, status: 'posted', type: 'transfer'
        });

        // 2. Credit target
        await createTransaction({
          account_id: targetAccountId, amount: val, date, description: description || `Transferência de ${sourceAccount.institution_name}`, status: 'posted', type: 'transfer'
        });

        // 3. Update balances
        await updateBalance({
          balance: Number(sourceAccount.balance) - val, id: accountId
        });

        await updateBalance({
          balance: Number(targetAccount.balance) + val, id: targetAccountId
        });

      } else if (actionType === 'deposit') {
        // Credit account
        await createTransaction({
          account_id: accountId, amount: val, date, description: description || 'Depósito', status: 'posted', type: 'credit'
        });

        await updateBalance({
            balance: Number(sourceAccount.balance) + val, id: accountId
        });

      } else if (actionType === 'withdraw') {
        // Debit account
        await createTransaction({
          account_id: accountId, amount: -val, date, description: description || 'Saque', status: 'posted', type: 'debit'
        });

        await updateBalance({
            balance: Number(sourceAccount.balance) - val, id: accountId
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
      console.error(_error);
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
                {accounts.map((account: any) => (
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
                  {accounts
                    .filter((a: any) => a.id !== accountId)
                    .map((account: any) => (
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
