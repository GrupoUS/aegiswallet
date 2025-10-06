import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle, Copy, QrCode } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'

export const Route = createFileRoute('/pix/receber')({
  component: PixReceivePage,
})

// Mock PIX keys - replace with real data
const mockPixKeys = [
  { type: 'email', value: 'usuario@exemplo.com', label: 'Email Principal' },
  { type: 'phone', value: '+55 (11) 99999-9999', label: 'Celular' },
  { type: 'cpf', value: '123.456.789-00', label: 'CPF' },
]

function PixReceivePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login', search: { redirect: '/pix/receber' } })
    }
  }, [isAuthenticated, isLoading, navigate])

  const formatCurrency = (value: string) => {
    const cleanValue = value.replace(/[^\d]/g, '')
    if (!cleanValue) return ''
    const formatted = (Number(cleanValue) / 100).toFixed(2)
    return `R$ ${formatted.replace('.', ',')}`
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '')
    setAmount(formatCurrency(value))
  }

  const copyPixKey = (key: string, type: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    toast.success(`Chave PIX ${type} copiada!`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const generateQRCode = () => {
    toast.success('QR Code gerado com sucesso!')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/pix' })} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard PIX
        </Button>
        <h1 className="text-3xl font-bold">Receber via PIX</h1>
        <p className="text-muted-foreground mt-2">
          Compartilhe suas chaves PIX ou gere um QR Code para receber pagamentos
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* QR Code Generator */}
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
                onChange={(e) => setDescription(e.target.value)}
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

        {/* PIX Keys List */}
        <Card>
          <CardHeader>
            <CardTitle>Minhas Chaves PIX</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockPixKeys.map((pixKey, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{pixKey.label}</div>
                  <div className="font-mono text-xs text-muted-foreground">{pixKey.value}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyPixKey(pixKey.value, pixKey.label)}
                >
                  {copiedKey === pixKey.value ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg mt-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 Dica: Compartilhe qualquer uma das suas chaves PIX para receber pagamentos
                instantâneos
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Received Transactions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Últimas Transações Recebidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma transação recebida recentemente
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
