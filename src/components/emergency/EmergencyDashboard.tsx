/**
 * Emergency Dashboard - Story 04.02
 * Visual mode for when voice fails
 */

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function EmergencyDashboard() {
  return (
    <div className="p-4">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Modo Visual de Emergência</h2>
        <p className="text-gray-600 mb-6">Use os controles visuais abaixo</p>
        <div className="space-y-4">
          <Button className="w-full">Ver Saldo</Button>
          <Button className="w-full">Pagar Conta</Button>
          <Button className="w-full">Transferir</Button>
        </div>
      </Card>
    </div>
  )
}
