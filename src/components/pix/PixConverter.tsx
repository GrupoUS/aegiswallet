'use client';

import { Calculator, Copy, Loader2, QrCode as QrCodeIcon, Send } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePixQRCodes, usePixTransactions } from '@/hooks/usePix';
import { cn } from '@/lib/utils';

export const PixConverter = React.memo(function PixConverter() {
  const [activeTab, setActiveTab] = useState('transferir');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pixKey, setPixKey] = useState('');

  const { createTransaction, isLoading: isCreatingTransaction } = usePixTransactions();
  const { generateQRCode, isGenerating: isCreatingQRCode, qrCodes } = usePixQRCodes();

  const qrCodeData = qrCodes[0]; // Get the most recent QR Code

  // Otimizar funções com useCallback
  const formatCurrency = useCallback((value: string) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    if (!cleanValue) return '';
    const formatted = (Number(cleanValue) / 100).toFixed(2);
    return `R$ ${formatted.replace('.', ',')}`;
  }, []);

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^\d]/g, '');
      setAmount(formatCurrency(value));
    },
    [formatCurrency]
  );

  const copyAmount = useCallback(() => {
    const numericAmount = amount.replace(/[^\d,]/g, '').replace(',', '.');
    navigator.clipboard.writeText(numericAmount);
    toast.success('Valor copiado!');
  }, [amount]);

  const getNumericAmount = useCallback(() => {
    const cleanValue = amount.replace(/[^\d,]/g, '').replace(',', '.');
    return Number(cleanValue);
  }, [amount]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  const handlePixKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPixKey(e.target.value);
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  }, []);

  const handleSendPix = useCallback(() => {
    const numericAmount = getNumericAmount();

    if (!pixKey || !pixKey.trim()) {
      toast.error('Informe a chave PIX do destinatário');
      return;
    }

    if (numericAmount <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    createTransaction({
      transactionType: 'sent',
      pixKey,
      pixKeyType: 'email', // Default - could be dynamic
      amount: numericAmount,
      description: description || undefined,
    });

    // Reset form
    setAmount('');
    setDescription('');
    setPixKey('');
  }, [getNumericAmount, pixKey, description, createTransaction]);

  const handleGenerateQRCode = useCallback(() => {
    const numericAmount = getNumericAmount();

    if (numericAmount <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    generateQRCode({
      amount: numericAmount,
      description: description || undefined,
      pixKey: '', // Will be generated
    });
  }, [getNumericAmount, description, generateQRCode]);

  const handleQuickAmount = useCallback(
    (value: number) => {
      setAmount(formatCurrency(String(value * 100)));
    },
    [formatCurrency]
  );

  const handleCopyQRCode = useCallback(() => {
    if (qrCodeData?.qrCodeData) {
      navigator.clipboard.writeText(qrCodeData.qrCodeData);
      toast.success('Código PIX copiado!');
    }
  }, [qrCodeData]);

  // Otimizar valores com useMemo
  const quickAmounts = useMemo(() => [50, 100, 200], []);

  return (
    <Card
      className={cn(
        'shrink-0 lg:w-90',
        'shadow-[0_1px_1px_rgba(0,0,0,0.05),_0_2px_2px_rgba(0,0,0,0.05),_0_4px_4px_rgba(0,0,0,0.05),_0_8px_8px_rgba(0,0,0,0.05)]',
        'dark:shadow-[0_1px_1px_rgba(255,255,255,0.02),_0_2px_2px_rgba(255,255,255,0.02)]'
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-pix-primary" />
          PIX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transferir" className="gap-2">
              <Send className="h-4 w-4" />
              Transferir
            </TabsTrigger>
            <TabsTrigger value="receber" className="gap-2">
              <QrCodeIcon className="h-4 w-4" />
              Receber
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transferir" className="mt-4 space-y-4">
            {/* Transferir content */}
            {/* PIX Key Input */}
            <div className="space-y-2">
              <Label htmlFor="converter-pix-key">Chave PIX do Destinatário</Label>
              <Input
                id="converter-pix-key"
                type="text"
                placeholder="Email, CPF, telefone ou chave aleatória"
                value={pixKey}
                onChange={handlePixKeyChange}
              />
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="converter-amount">Valor</Label>
              <div className="relative">
                <Input
                  id="converter-amount"
                  type="text"
                  placeholder="R$ 0,00"
                  value={amount}
                  onChange={handleAmountChange}
                  className="pr-12 font-bold text-2xl"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="-translate-y-1/2 absolute top-1/2 right-2"
                  onClick={copyAmount}
                  disabled={!amount}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="converter-description">Descrição (opcional)</Label>
              <Input
                id="converter-description"
                type="text"
                placeholder="Para que é este valor?"
                value={description}
                onChange={handleDescriptionChange}
              />
            </div>

            {/* Quick amount buttons */}
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(value)}
                  className={cn(
                    'relative overflow-hidden',
                    'before:absolute before:inset-0 before:bg-gradient-to-r before:from-pix-primary/0 before:via-pix-primary/10 before:to-pix-primary/0',
                    'before:translate-x-[-100%] before:transition-transform before:duration-500 hover:before:translate-x-[100%]'
                  )}
                >
                  R$ {value}
                </Button>
              ))}
            </div>

            {/* Summary */}
            {amount && (
              <div
                className={cn(
                  'relative space-y-2 rounded-lg p-4',
                  'bg-pix-primary/10',
                  'dark:bg-pix-primary/5',
                  'border border-pix-primary/20',
                  '[mask-image:radial-gradient(100%_100%_at_50%_50%,white,transparent_90%)]'
                )}
              >
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-semibold">{amount}</span>
                </div>
                {description && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descrição</span>
                    <span className="text-right">{description}</span>
                  </div>
                )}
                <div className="flex justify-between border-pix-primary/20 border-t pt-2 font-bold">
                  <span>Total</span>
                  <span className="text-pix-primary">{amount}</span>
                </div>
              </div>
            )}

            {/* Send Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSendPix}
              disabled={isCreatingTransaction || !amount || !pixKey}
            >
              {isCreatingTransaction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar PIX
                </>
              )}
            </Button>

            {/* Info */}
            <div className="text-center text-muted-foreground text-xs">
              Transferências PIX são instantâneas e disponíveis 24/7
            </div>
          </TabsContent>

          <TabsContent value="receber" className="mt-4 space-y-4">
            {/* Receber content */}
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="receive-amount">Valor a Receber</Label>
              <div className="relative">
                <Input
                  id="receive-amount"
                  type="text"
                  placeholder="R$ 0,00"
                  value={amount}
                  onChange={handleAmountChange}
                  className="font-bold text-2xl"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="receive-description">Descrição (opcional)</Label>
              <Input
                id="receive-description"
                type="text"
                placeholder="Para que é este pagamento?"
                value={description}
                onChange={handleDescriptionChange}
              />
            </div>

            {/* Generate QR Code Button */}
            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={handleGenerateQRCode}
              disabled={isCreatingQRCode || !amount}
            >
              {isCreatingQRCode ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <QrCodeIcon className="mr-2 h-4 w-4" />
                  Gerar QR Code
                </>
              )}
            </Button>

            {/* QR Code Display */}
            {qrCodeData && (
              <div
                className={cn(
                  'relative space-y-4 rounded-lg p-6',
                  'bg-pix-primary/10',
                  'dark:bg-pix-primary/5',
                  'border border-pix-primary/20',
                  'text-center'
                )}
              >
                <div className="font-medium text-muted-foreground text-sm">QR Code PIX Gerado</div>
                <div className="inline-block rounded-lg bg-white p-4">
                  {qrCodeData.qrCodeData ? (
                    <QRCode
                      value={qrCodeData.qrCodeData}
                      size={200}
                      level="H"
                      fgColor="#000000"
                      bgColor="#FFFFFF"
                    />
                  ) : (
                    <div className="flex h-[200px] w-[200px] items-center justify-center rounded bg-gray-100">
                      <QrCodeIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="text-muted-foreground text-xs">
                  Escaneie este código para realizar o pagamento
                </div>
                <Button variant="ghost" size="sm" onClick={handleCopyQRCode}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar código PIX
                </Button>
              </div>
            )}

            {/* Info */}
            <div className="text-center text-muted-foreground text-xs">
              O QR Code expira em 15 minutos
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});
