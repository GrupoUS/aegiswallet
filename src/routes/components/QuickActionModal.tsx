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
import { useFinancialEvents } from '@/hooks/useFinancialEvents';

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
  account_mask: string;
  currency: string;
}

export function QuickActionModal({
  isOpen,
  onClose,
  actionType,
  onSuccess,
}: QuickActionModalProps) {
  const { createEvent } = useFinancialEvents();
  const { accounts } = useBankAccounts();
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

    setIsLoading(true);

    try {
      const value = Number(amount);

      if (actionType === 'transfer') {
        // Create expense in source
        await createEvent({
          amount: -value,
          end: new Date(),
          start: new Date(),
          status: 'paid',
          title: description || 'Transferência Enviada',
          type: 'transfer',
        });

        // Create income in target
        await createEvent({
          amount: value,
          end: new Date(),
          start: new Date(),
          status: 'paid',
          title: description || 'Transferência Recebida',
          type: 'transfer',
        });
      } else {
        // Deposit or Withdraw
        const isDeposit = actionType === 'deposit';
        await createEvent({
          amount: isDeposit ? value : -value,
          end: new Date(),
          start: new Date(),
          status: 'paid',
          title: description || (isDeposit ? 'Depósito' : 'Saque'),
          type: isDeposit ? 'income' : 'expense',
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
                {accounts.map((account: BankAccountDisplay) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.institution_name} ({account.account_mask}) -{' '}
                    <FinancialAmount amount={account.balance} showSign={false} size="sm" />
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
                    .filter((a: BankAccountDisplay) => a.id !== accountId)
                    .map((account: BankAccountDisplay) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.institution_name} ({account.account_mask})
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
