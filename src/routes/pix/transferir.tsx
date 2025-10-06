import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { PixTransfer } from '@/components/financial/PixTransfer'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export const Route = createFileRoute('/pix/transferir')({
  component: PixTransferPage,
})

function PixTransferPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login', search: { redirect: '/pix/transferir' } })
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
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/pix' })} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard PIX
        </Button>
        <h1 className="text-3xl font-bold">Transferir via PIX</h1>
        <p className="text-muted-foreground mt-2">
          Envie dinheiro instantaneamente usando chave PIX, QR Code ou número de telefone
        </p>
      </div>

      <PixTransfer />
    </div>
  )
}
