import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Suspense, lazy, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'

// Lazy loading components
const PixQRCodeGenerator = lazy(() => import('../components/PixQRCodeGenerator'))
const PixKeysList = lazy(() => import('../components/PixKeysList'))

export const Route = createFileRoute('/pix/receber')({
  component: PixReceivePage,
})

// Mock PIX keys - replace with real data
const mockPixKeys = [
  { type: 'email', value: 'usuario@exemplo.com', label: 'Email Principal' },
  { type: 'phone', value: '+55 (11) 99999-9999', label: 'Celular' },
  { type: 'cpf', value: '123.456.789-00', label: 'CPF' },
]

// Loading placeholder components
function QRCodeGeneratorLoader() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="h-6 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="bg-muted aspect-square rounded-lg flex items-center justify-center">
          <Skeleton className="w-16 h-16" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-24 mx-auto" />
      </CardContent>
    </Card>
  )
}

function PixKeysListLoader() {
  return (
    <Card>
      <CardHeader>
        <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="w-8 h-8" />
          </div>
        ))}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg mt-4">
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function PixReceivePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login', search: { redirect: '/pix/receber', error: undefined } })
    }
  }, [isAuthenticated, isLoading, navigate])

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
        <Suspense fallback={<QRCodeGeneratorLoader />}>
          <PixQRCodeGenerator
            amount={amount}
            description={description}
            onAmountChange={setAmount}
            onDescriptionChange={setDescription}
          />
        </Suspense>

        {/* PIX Keys List */}
        <Suspense fallback={<PixKeysListLoader />}>
          <PixKeysList pixKeys={mockPixKeys} />
        </Suspense>
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
