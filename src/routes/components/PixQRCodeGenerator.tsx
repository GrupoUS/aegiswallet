import { QrCode } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PixQRCodeGeneratorProps {
  amount: string
  description: string
  onAmountChange: (value: string) => void
  onDescriptionChange: (value: string) => void
}

export default function PixQRCodeGenerator({
  amount,
  description,
  onAmountChange,
  onDescriptionChange
}: PixQRCodeGeneratorProps) {
  const formatCurrency = (value: string) => {
    const cleanValue = value.replace(/[^\d]/g, '')
    if (!cleanValue) return ''
    const formatted = (Number(cleanValue) / 100).toFixed(2)
    return `R$ ${formatted.replace('.', ',')}`
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '')
    onAmountChange(formatCurrency(value))
  }

  const generateQRCode = () => {
    toast.success('QR Code gerado com sucesso!')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-green-500" />
          Gerar QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="qr-amount">Valor (opcional)</Label>
          <Input
            id="qr-amount"
            type="text"
            placeholder="R$ 0,00"
            value={amount}
            onChange={handleAmountChange}
          />
          <p className="text-xs text-muted-foreground">Deixe em branco para valor livre</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qr-description">Descrição (opcional)</Label>
          <Input
            id="qr-description"
            type="text"
            placeholder="O que você está recebendo?"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>

        {/* QR Code placeholder */}
        <div className="bg-muted aspect-square rounded-lg flex items-center justify-center">
          <div className="text-center p-6">
            <QrCode className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">O QR Code será gerado aqui</p>
          </div>
        </div>

        <Button onClick={generateQRCode} className="w-full" size="lg">
          <QrCode className="w-4 h-4 mr-2" />
          Gerar QR Code
        </Button>

        <div className="text-xs text-muted-foreground text-center">Válido por 24 horas</div>
      </CardContent>
    </Card>
  )
}