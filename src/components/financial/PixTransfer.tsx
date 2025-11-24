import { CheckCircle, Clock, CreditCard, QrCode, Smartphone, User } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PixTransferProps {
  className?: string;
}

export const PixTransfer = React.memo(function PixTransfer({ className }: PixTransferProps) {
  const [transferType, setTransferType] = useState<'key' | 'qr' | 'phone'>('key');
  const [pixKey, setPixKey] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferStatus, setTransferStatus] = useState<'idle' | 'processing' | 'success' | 'error'>(
    'idle'
  );

  // Memoize the formatCurrency function
  const formatCurrency = useCallback((value: string) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    const formatted = (Number(cleanValue) / 100).toFixed(2);
    return `R$ ${formatted}`;
  }, []);

  // Memoize the handleAmountChange function
  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^\d]/g, '');
      setAmount(formatCurrency(value));
    },
    [formatCurrency]
  );

  // Memoize the validatePixKey function
  const validatePixKey = useCallback((key: string) => {
    // Basic validation for different PIX key types
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cpfRegex = /^\d{11}$/;
    const cnpjRegex = /^\d{14}$/;
    const phoneRegex = /^\d{11,13}$/;
    const randomKeyRegex =
      /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;

    return (
      emailRegex.test(key) ||
      cpfRegex.test(key.replace(/[^\d]/g, '')) ||
      cnpjRegex.test(key.replace(/[^\d]/g, '')) ||
      phoneRegex.test(key.replace(/[^\d]/g, '')) ||
      randomKeyRegex.test(key)
    );
  }, []);

  // Memoize the handleTransfer function
  const handleTransfer = useCallback(async () => {
    if (!validatePixKey(pixKey) || !amount) {
      setTransferStatus('error');
      return;
    }

    setIsProcessing(true);
    setTransferStatus('processing');

    try {
      const numericAmount = parseFloat(amount.replace(/[^\d,]/g, '').replace(',', '.'));

      // Use default account for now (would come from context/selector in real app)
      // We need to fetch an account ID first.
      // Since we don't have account context here, we'll fetch the user's primary account
      // inside pixClient (refactored to handle this lookup if needed, or we do it here).
      // Actually pixClient.sendPixPayment requires fromAccountId.
      // Let's assume we fetch the primary account here first.

      const {
        data: { user },
      } = await import('@/integrations/supabase/client').then((m) => m.supabase.auth.getUser());

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: account } = await import('@/integrations/supabase/client').then((m) =>
        m.supabase
          .from('bank_accounts')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .single()
      );

      // If no primary account, try any account
      let accountId = account?.id;
      if (!accountId) {
        const { data: anyAccount } = await import('@/integrations/supabase/client').then((m) =>
          m.supabase.from('bank_accounts').select('id').eq('user_id', user.id).limit(1).single()
        );
        accountId = anyAccount?.id;
      }

      if (!accountId) {
        throw new Error('No bank account found');
      }

      await import('@/lib/banking/pixApi').then((m) =>
        m.pixClient.sendPixPayment(accountId || '', pixKey, numericAmount, description)
      );

      setTransferStatus('success');
      setIsProcessing(false);

      // Reset form after success
      setTimeout(() => {
        setPixKey('');
        setAmount('');
        setDescription('');
        setTransferStatus('idle');
      }, 3000);
    } catch (_error) {
      setTransferStatus('error');
      setIsProcessing(false);
    }
  }, [pixKey, amount, description, validatePixKey]);

  // Memoize the getTransferTypeIcon function
  const getTransferTypeIcon = useCallback(() => {
    switch (transferType) {
      case 'key':
        return <CreditCard className="h-5 w-5" />;
      case 'qr':
        return <QrCode className="h-5 w-5" />;
      case 'phone':
        return <Smartphone className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  }, [transferType]);

  // Memoize the getTransferTypePlaceholder function
  const getTransferTypePlaceholder = useCallback(() => {
    switch (transferType) {
      case 'key':
        return 'Email, CPF, CNPJ ou chave aleatória';
      case 'qr':
        return 'Escaneie o QR Code';
      case 'phone':
        return 'Telefone com DDD';
      default:
        return 'Digite a chave PIX';
    }
  }, [transferType]);

  // Memoize transfer type options
  const transferTypeOptions = useMemo(
    () => [
      { label: 'Chave PIX', value: 'key' },
      { label: 'QR Code', value: 'qr' },
      { label: 'Telefone', value: 'phone' },
    ],
    []
  );

  // Memoize success state component
  const SuccessState = useMemo(() => {
    if (transferStatus !== 'success') {
      return null;
    }

    return (
      <Card className={cn('border-success/20 bg-success/10', className)}>
        <CardContent className="p-6 text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-success" />
          <h3 className="mb-2 font-semibold text-success text-xl">Transferência Realizada!</h3>
          <p className="mb-2 text-success">{formatCurrency(amount)}</p>
          <p className="text-sm text-success">Transferência PIX processada instantaneamente</p>
        </CardContent>
      </Card>
    );
  }, [transferStatus, className, amount, formatCurrency]);

  if (transferStatus === 'success') {
    return SuccessState;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-r from-pix-primary to-pix-accent">
            <span className="font-bold text-white">PIX</span>
          </div>
          Transferência PIX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transfer Type Selection */}
        <div className="flex gap-2">
          {transferTypeOptions.map((type) => (
            <Button
              key={type.value}
              variant={transferType === type.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTransferType(type.value as 'key' | 'qr' | 'phone')}
              className="flex-1"
            >
              {type.label}
            </Button>
          ))}
        </div>

        {/* PIX Key Input */}
        <div className="space-y-2">
          <Label htmlFor="pix-key" className="flex items-center gap-2">
            {getTransferTypeIcon()}
            Chave PIX
          </Label>
          <Input
            id="pix-key"
            type="text"
            placeholder={getTransferTypePlaceholder()}
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            disabled={transferType === 'qr'}
            className={cn(
              transferStatus === 'error' && !validatePixKey(pixKey) && 'border-destructive'
            )}
          />
          {transferStatus === 'error' && !validatePixKey(pixKey) && (
            <p className="text-destructive text-sm">Por favor, insira uma chave PIX válida</p>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Valor</Label>
          <Input
            id="amount"
            type="text"
            placeholder="R$ 0,00"
            value={amount}
            onChange={handleAmountChange}
            className={cn(transferStatus === 'error' && !amount && 'border-destructive')}
          />
          {transferStatus === 'error' && !amount && (
            <p className="text-destructive text-sm">Por favor, insira um valor</p>
          )}
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Input
            id="description"
            type="text"
            placeholder="O que você está pagando?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Transfer Info */}
        <div className="rounded-lg bg-info/10 p-4">
          <div className="flex items-center gap-2 text-info text-sm">
            <Clock className="h-4 w-4" />
            <span>Transferências PIX são processadas instantaneamente</span>
          </div>
          <div className="mt-1 text-info text-xs">Disponível 24/7, todos os dias</div>
        </div>

        {/* Transfer Button */}
        <Button
          onClick={handleTransfer}
          disabled={isProcessing || !validatePixKey(pixKey) || !amount}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Fazer Transferência PIX
            </>
          )}
        </Button>

        {/* Security Info */}
        <div className="text-center text-gray-500 text-xs">
          <p>Transferências PIX são seguras e irreversíveis</p>
          <p>Verifique sempre os dados antes de confirmar</p>
        </div>
      </CardContent>
    </Card>
  );
});
