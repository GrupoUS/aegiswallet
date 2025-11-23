import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Copy,
  CreditCard,
  FileText,
  QrCode,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Boleto {
  id: string;
  name: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue';
  barcode?: string;
  type: 'utility' | 'credit_card' | 'other';
}

interface BoletoPaymentProps {
  className?: string;
}

export const BoletoPayment = React.memo(function BoletoPayment({ className }: BoletoPaymentProps) {
  const [boletoCode, setBoletoCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'debit' | 'credit'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>(
    'idle'
  );
  const [showQrCode, setShowQrCode] = useState(false);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [isLoadingBoletos, setIsLoadingBoletos] = useState(true);

  // Fetch boletos from Supabase
  useEffect(() => {
    const fetchBoletos = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setIsLoadingBoletos(false);
          return;
        }

        const { data, error } = await supabase
          .from('boletos')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['pending', 'overdue']);

        if (error) {
          return;
        }

        if (data) {
          setBoletos(
            data.map((b) => ({
              amount: Number(b.amount),
              barcode: b.barcode,
              dueDate: new Date(b.due_date),
              id: b.id,
              name: b.payee_name,
              status:
                b.status === 'pending' || b.status === 'overdue' || b.status === 'paid'
                  ? b.status
                  : 'pending',
              type: 'utility', // Defaulting to utility as type isn't in current schema
            }))
          );
        }
      } catch (_error) {
      } finally {
        setIsLoadingBoletos(false);
      }
    };

    fetchBoletos();
  }, []);

  // Memoize the formatCurrency function
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      currency: 'BRL',
      style: 'currency',
    }).format(amount);
  }, []);

  // Memoize the formatBoletoCode function
  const formatBoletoCode = useCallback((value: string) => {
    // Remove non-digits and format as XXXXX.XXXXX XXXXX.XXXXX XXXXX.XXXXX XXXXX.XXXXXX
    const cleanValue = value.replace(/[^\d]/g, '');
    if (cleanValue.length <= 5) {
      return cleanValue;
    }
    if (cleanValue.length <= 10) {
      return `${cleanValue.slice(0, 5)}.${cleanValue.slice(5)}`;
    }
    if (cleanValue.length <= 15) {
      return `${cleanValue.slice(0, 5)}.${cleanValue.slice(5, 10)}.${cleanValue.slice(10)}`;
    }
    if (cleanValue.length <= 20) {
      return `${cleanValue.slice(0, 5)}.${cleanValue.slice(5, 10)}.${cleanValue.slice(10, 15)}.${cleanValue.slice(15)}`;
    }
    return `${cleanValue.slice(0, 5)}.${cleanValue.slice(5, 10)}.${cleanValue.slice(10, 15)}.${cleanValue.slice(15, 20)}.${cleanValue.slice(20, 25)}`;
  }, []);

  // Memoize the validateBoletoCode function
  const validateBoletoCode = useCallback((code: string) => {
    const cleanCode = code.replace(/[^\d]/g, '');
    return cleanCode.length === 47 || cleanCode.length === 48;
  }, []);

  // Memoize the getBoletoStatusColor function
  const getBoletoStatusColor = useCallback((status: Boleto['status']) => {
    switch (status) {
      case 'paid':
        return 'text-success bg-success/10';
      case 'overdue':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-warning bg-warning/10';
    }
  }, []);

  // Memoize the getBoletoStatusText function
  const getBoletoStatusText = useCallback((status: Boleto['status']) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'overdue':
        return 'Vencido';
      default:
        return 'A pagar';
    }
  }, []);

  // Memoize the handleBoletoCodeChange function
  const handleBoletoCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setBoletoCode(formatBoletoCode(e.target.value));
    },
    [formatBoletoCode]
  );

  // Memoize the handlePayment function
  const handlePayment = useCallback(async () => {
    if (!validateBoletoCode(boletoCode)) {
      setPaymentStatus('error');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    // Simulate payment processing with Supabase
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Create transaction record
        // Note: In a real app we would verify the barcode and amount first
        const { error } = await supabase.from('financial_events').insert({
          user_id: user.id,
          title: `Pagamento de Boleto`,
          amount: -100.0, // Mock amount for manual entry
          event_type: 'expense',
          brazilian_event_type: 'boleto_pago',
          status: 'paid',
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
          description: `Código: ${boletoCode}`,
        });

        if (error) {
          throw error;
        }
      }

      setPaymentStatus('success');
      setIsProcessing(false);

      // Reset form after success
      setTimeout(() => {
        setBoletoCode('');
        setPaymentStatus('idle');
        setShowQrCode(false);
      }, 3000);
    } catch (_error) {
      setPaymentStatus('error');
      setIsProcessing(false);
    }
  }, [boletoCode, validateBoletoCode]);

  // Memoize the copyToClipboard function
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  // Filter pending boletos
  const pendingBoletos = useMemo(() => {
    return boletos.filter((boleto) => boleto.status !== 'paid');
  }, [boletos]);

  // Memoize payment method options
  const paymentMethodOptions = useMemo(
    () => [
      { label: 'PIX', value: 'pix' },
      { label: 'Débito', value: 'debit' },
      { label: 'Crédito', value: 'credit' },
    ],
    []
  );

  // Memoize payment info text
  const paymentInfoText = useMemo(() => {
    return paymentMethod === 'pix'
      ? 'Pagamentos via PIX são processados instantaneamente'
      : 'Pagamentos em débito/crédito podem levar até 3 dias úteis';
  }, [paymentMethod]);

  // Memoize payment method text for success state
  const paymentMethodText = useMemo(() => {
    switch (paymentMethod) {
      case 'pix':
        return 'PIX';
      case 'debit':
        return 'Débito';
      case 'credit':
        return 'Crédito';
      default:
        return 'PIX';
    }
  }, [paymentMethod]);

  // Memoize success state component
  const SuccessState = useMemo(() => {
    if (paymentStatus !== 'success') {
      return null;
    }

    return (
      <Card className={cn('border-success/20 bg-success/10', className)}>
        <CardContent className="p-6 text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-success" />
          <h3 className="mb-2 font-semibold text-success text-xl">Pagamento Realizado!</h3>
          <p className="text-success">Boleto pago com sucesso via {paymentMethodText}</p>
        </CardContent>
      </Card>
    );
  }, [paymentStatus, className, paymentMethodText]);

  if (paymentStatus === 'success') {
    return SuccessState;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Pagamento de Boletos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pending Boletos List */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 text-sm">Boletos Próximos</h4>
          {isLoadingBoletos ? (
            <div className="py-4 text-center text-muted-foreground text-sm">
              Carregando boletos...
            </div>
          ) : pendingBoletos.length > 0 ? (
            pendingBoletos.map((boleto) => (
              <BoletoItem
                key={boleto.id}
                boleto={boleto}
                formatCurrency={formatCurrency}
                getBoletoStatusColor={getBoletoStatusColor}
                getBoletoStatusText={getBoletoStatusText}
                copyToClipboard={copyToClipboard}
                onToggleQrCode={() => setShowQrCode(!showQrCode)}
              />
            ))
          ) : (
            <div className="py-4 text-center text-muted-foreground text-sm">
              Nenhum boleto pendente
            </div>
          )}
        </div>

        {/* Manual Boleto Payment */}
        <div className="border-t pt-6">
          <h4 className="mb-4 font-medium text-gray-700 text-sm">Pagar Boleto Manualmente</h4>

          {/* Boleto Code Input */}
          <div className="space-y-2">
            <Label htmlFor="boleto-code">Código do Boleto</Label>
            <Input
              id="boleto-code"
              type="text"
              placeholder="XXXXX.XXXXX XXXXX.XXXXX XXXXX.XXXXX XXXXX.XXXXXX"
              value={boletoCode}
              onChange={handleBoletoCodeChange}
              className={cn(
                'font-mono text-sm',
                paymentStatus === 'error' && !validateBoletoCode(boletoCode) && 'border-destructive'
              )}
            />
            {paymentStatus === 'error' && !validateBoletoCode(boletoCode) && (
              <p className="text-destructive text-sm">
                Por favor, insira um código de boleto válido
              </p>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <div className="flex gap-2">
              {paymentMethodOptions.map((method) => (
                <Button
                  key={method.value}
                  variant={paymentMethod === method.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod(method.value as 'debit' | 'credit' | 'pix')}
                  className="flex-1"
                >
                  {method.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <div className="rounded-lg bg-info/10 p-4">
            <div className="flex items-center gap-2 text-info text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{paymentInfoText}</span>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !validateBoletoCode(boletoCode)}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar Boleto
              </>
            )}
          </Button>
        </div>

        {/* QR Code Modal Placeholder */}
        {showQrCode && (
          <div className="border-t pt-4">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-32 w-32 items-center justify-center bg-gray-200">
                <QrCode className="h-16 w-16 text-gray-400" />
              </div>
              <p className="text-gray-600 text-sm">QR Code para pagamento (simulação)</p>
            </div>
          </div>
        )}

        {/* Security Info */}
        <div className="border-t pt-4 text-center text-gray-500 text-xs">
          <p>Os dados do boleto são criptografados e seguros</p>
          <p>Verifique sempre as informações antes de pagar</p>
        </div>
      </CardContent>
    </Card>
  );
});

// Memoize the BoletoItem component
const BoletoItem = React.memo(function BoletoItem({
  boleto,
  formatCurrency,
  getBoletoStatusColor,
  getBoletoStatusText,
  copyToClipboard,
  onToggleQrCode,
}: {
  boleto: Boleto;
  formatCurrency: (amount: number) => string;
  getBoletoStatusColor: (status: Boleto['status']) => string;
  getBoletoStatusText: (status: Boleto['status']) => string;
  copyToClipboard: (text: string) => void;
  onToggleQrCode: () => void;
}) {
  // Memoize formatted due date
  const formattedDueDate = useMemo(() => {
    return boleto.dueDate.toLocaleDateString('pt-BR');
  }, [boleto.dueDate]);

  // Memoize formatted amount
  const formattedAmount = useMemo(() => {
    return formatCurrency(boleto.amount);
  }, [boleto.amount, formatCurrency]);

  // Memoize status color
  const statusColor = useMemo(() => {
    return getBoletoStatusColor(boleto.status);
  }, [boleto.status, getBoletoStatusColor]);

  // Memoize status text
  const statusText = useMemo(() => {
    return getBoletoStatusText(boleto.status);
  }, [boleto.status, getBoletoStatusText]);

  // Memoize copy barcode handler
  const handleCopyBarcode = useCallback(() => {
    copyToClipboard(boleto.barcode || '');
  }, [boleto.barcode, copyToClipboard]);

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div>
          <h5 className="font-medium text-gray-900">{boleto.name}</h5>
          <div className="mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 text-sm">Vence: {formattedDueDate}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg">{formattedAmount}</div>
          <span className={cn('rounded-full px-2 py-1 text-xs', statusColor)}>{statusText}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleCopyBarcode} className="flex-1">
          <Copy className="mr-2 h-4 w-4" />
          Copiar Código
        </Button>
        <Button variant="outline" size="sm" onClick={onToggleQrCode} className="flex-1">
          <QrCode className="mr-2 h-4 w-4" />
          QR Code
        </Button>
      </div>
    </div>
  );
});
