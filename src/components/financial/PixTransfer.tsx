import { CheckCircle, Clock, CreditCard, QrCode, Smartphone, User } from 'lucide-react'
import React, { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface PixTransferProps {
  className?: string
}

export const PixTransfer = React.memo(function PixTransfer({ className }: PixTransferProps) {
  const [transferType, setTransferType] = useState<'key' | 'qr' | 'phone'>('key')
  const [pixKey, setPixKey] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [transferStatus, setTransferStatus] = useState<'idle' | 'processing' | 'success' | 'error'>(
    'idle'
  )

  // Memoize the formatCurrency function
  const formatCurrency = useCallback((value: string) => {
    const cleanValue = value.replace(/[^\d]/g, '')
    const formatted = (Number(cleanValue) / 100).toFixed(2)
    return `R$ ${formatted}`
  }, [])

  // Memoize the handleAmountChange function
  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^\d]/g, '')
      setAmount(formatCurrency(value))
    },
    [formatCurrency]
  )

  // Memoize the validatePixKey function
  const validatePixKey = useCallback((key: string) => {
    // Basic validation for different PIX key types
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const cpfRegex = /^\d{11}$/
    const cnpjRegex = /^\d{14}$/
    const phoneRegex = /^\d{11,13}$/
    const randomKeyRegex =
      /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/

    return (
      emailRegex.test(key) ||
      cpfRegex.test(key.replace(/[^\d]/g, '')) ||
      cnpjRegex.test(key.replace(/[^\d]/g, '')) ||
      phoneRegex.test(key.replace(/[^\d]/g, '')) ||
      randomKeyRegex.test(key)
    )
  }, [])

  // Memoize the handleTransfer function
  const handleTransfer = useCallback(async () => {
    if (!validatePixKey(pixKey) || !amount) {
      setTransferStatus('error')
      return
    }

    setIsProcessing(true)
    setTransferStatus('processing')

    // Simulate PIX transfer processing
    setTimeout(() => {
      setTransferStatus('success')
      setIsProcessing(false)

      // Reset form after success
      setTimeout(() => {
        setPixKey('')
        setAmount('')
        setDescription('')
        setTransferStatus('idle')
      }, 3000)
    }, 2000)
  }, [pixKey, amount, validatePixKey])

  // Memoize the getTransferTypeIcon function
  const getTransferTypeIcon = useCallback(() => {
    switch (transferType) {
      case 'key':
        return <CreditCard className="w-5 h-5" />
      case 'qr':
        return <QrCode className="w-5 h-5" />
      case 'phone':
        return <Smartphone className="w-5 h-5" />
      default:
        return <User className="w-5 h-5" />
    }
  }, [transferType])

  // Memoize the getTransferTypePlaceholder function
  const getTransferTypePlaceholder = useCallback(() => {
    switch (transferType) {
      case 'key':
        return 'Email, CPF, CNPJ ou chave aleatória'
      case 'qr':
        return 'Escaneie o QR Code'
      case 'phone':
        return 'Telefone com DDD'
      default:
        return 'Digite a chave PIX'
    }
  }, [transferType])

  // Memoize transfer type options
  const transferTypeOptions = useMemo(
    () => [
      { value: 'key', label: 'Chave PIX' },
      { value: 'qr', label: 'QR Code' },
      { value: 'phone', label: 'Telefone' },
    ],
    []
  )

  // Memoize success state component
  const SuccessState = useMemo(() => {
    if (transferStatus !== 'success') return null

    return (
      <Card className={cn('border-green-200 bg-green-50', className)}>
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-800 mb-2">Transferência Realizada!</h3>
          <p className="text-green-600 mb-2">{formatCurrency(amount)}</p>
          <p className="text-sm text-green-600">Transferência PIX processada instantaneamente</p>
        </CardContent>
      </Card>
    )
  }, [transferStatus, className, amount, formatCurrency])

  if (transferStatus === 'success') {
    return SuccessState
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">PIX</span>
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
              onClick={() => setTransferType(type.value as any)}
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
              transferStatus === 'error' && !validatePixKey(pixKey) && 'border-red-500'
            )}
          />
          {transferStatus === 'error' && !validatePixKey(pixKey) && (
            <p className="text-sm text-red-500">Por favor, insira uma chave PIX válida</p>
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
            className={cn(transferStatus === 'error' && !amount && 'border-red-500')}
          />
          {transferStatus === 'error' && !amount && (
            <p className="text-sm text-red-500">Por favor, insira um valor</p>
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
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Clock className="w-4 h-4" />
            <span>Transferências PIX são processadas instantaneamente</span>
          </div>
          <div className="text-xs text-blue-600 mt-1">Disponível 24/7, todos os dias</div>
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
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Fazer Transferência PIX
            </>
          )}
        </Button>

        {/* Security Info */}
        <div className="text-xs text-gray-500 text-center">
          <p>Transferências PIX são seguras e irreversíveis</p>
          <p>Verifique sempre os dados antes de confirmar</p>
        </div>
      </CardContent>
    </Card>
  )
})
