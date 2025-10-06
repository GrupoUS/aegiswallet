import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { FinancialAmount } from '@/components/financial-amount'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, Calendar, CheckCircle, Clock, FileText } from 'lucide-react'

export const Route = createFileRoute('/contas')({
  component: Contas,
})

function Contas() {
  const [isListening, setIsListening] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')

  const handleVoiceCommand = () => {
    setIsListening(!isListening)
    console.log('Voice command: Quais contas tenho que pagar?')
  }

  // Mock bills data
  const bills = [
    {
      id: 1,
      name: 'Energia Elétrica',
      amount: 245.67,
      dueDate: '2024-01-15',
      status: 'pending',
      category: 'utilities',
      recurring: true,
      icon: '⚡',
    },
    {
      id: 2,
      name: 'Internet',
      amount: 99.9,
      dueDate: '2024-01-10',
      status: 'paid',
      category: 'utilities',
      recurring: true,
      icon: '🌐',
    },
    {
      id: 3,
      name: 'Aluguel',
      amount: 1500.0,
      dueDate: '2024-01-05',
      status: 'paid',
      category: 'housing',
      recurring: true,
      icon: '🏠',
    },
    {
      id: 4,
      name: 'Água',
      amount: 85.3,
      dueDate: '2024-01-20',
      status: 'pending',
      category: 'utilities',
      recurring: true,
      icon: '💧',
    },
    {
      id: 5,
      name: 'Cartão de Crédito',
      amount: 1250.45,
      dueDate: '2024-01-25',
      status: 'pending',
      category: 'credit',
      recurring: true,
      icon: '💳',
    },
    {
      id: 6,
      name: 'Academia',
      amount: 150.0,
      dueDate: '2024-01-12',
      status: 'pending',
      category: 'health',
      recurring: true,
      icon: '💪',
    },
  ]

  const filteredBills = bills.filter((bill) => {
    if (filter === 'all') return true
    return bill.status === filter
  })

  const pendingBills = bills.filter((b) => b.status === 'pending')
  const paidBills = bills.filter((b) => b.status === 'paid')
  const totalPending = pendingBills.reduce((sum, bill) => sum + bill.amount, 0)
  const totalPaid = paidBills.reduce((sum, bill) => sum + bill.amount, 0)

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getBillStatus = (dueDate: string, status: string) => {
    if (status === 'paid') return { color: 'bg-green-500', text: 'Pago' }
    const days = getDaysUntilDue(dueDate)
    if (days < 0) return { color: 'bg-red-500', text: 'Atrasado' }
    if (days <= 3) return { color: 'bg-yellow-500', text: 'Vence em breve' }
    return { color: 'bg-blue-500', text: 'Pendente' }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Contas
          </h1>
          <p className="text-muted-foreground">Gerencie suas contas e pagamentos</p>
        </div>
        <Button
          onClick={handleVoiceCommand}
          variant={isListening ? 'default' : 'outline'}
          size="lg"
          className="gap-2"
          withGradient
        >
          <Mic className={isListening ? 'animate-pulse' : ''} />
          {isListening ? 'Ouvindo...' : 'Quais contas pagar?'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardDescription>Contas Pendentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <FinancialAmount amount={-totalPending} size="lg" />
              <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                {pendingBills.length} contas
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/20">
          <CardHeader className="pb-2">
            <CardDescription>Contas Pagas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <FinancialAmount amount={-totalPaid} size="lg" />
              <Badge variant="outline" className="text-green-500 border-green-500">
                {paidBills.length} contas
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Total do Mês</CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialAmount amount={-(totalPending + totalPaid)} size="lg" />
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Todas ({bills.length})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pendentes ({pendingBills.length})
        </Button>
        <Button
          variant={filter === 'paid' ? 'default' : 'outline'}
          onClick={() => setFilter('paid')}
        >
          Pagas ({paidBills.length})
        </Button>
      </div>

      {/* Bills List */}
      <div className="space-y-4">
        {filteredBills.map((bill) => {
          const status = getBillStatus(bill.dueDate, bill.status)
          const daysUntilDue = getDaysUntilDue(bill.dueDate)

          return (
            <Card key={bill.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl">{bill.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{bill.name}</h3>
                        {bill.recurring && (
                          <Badge variant="outline" className="text-xs">
                            Recorrente
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Vencimento: {new Date(bill.dueDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {bill.status === 'pending' && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {daysUntilDue > 0
                                ? `${daysUntilDue} dias restantes`
                                : `${Math.abs(daysUntilDue)} dias atrasado`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <FinancialAmount amount={-bill.amount} size="lg" />
                      <Badge className={`${status.color} mt-2`}>{status.text}</Badge>
                    </div>
                    {bill.status === 'pending' && (
                      <Button size="sm">Pagar</Button>
                    )}
                    {bill.status === 'paid' && (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button size="lg" className="flex-1" withGradient>
          <FileText className="w-5 h-5 mr-2" />
          Adicionar Nova Conta
        </Button>
        <Button variant="outline" size="lg" className="flex-1">
          Gerenciar Recorrentes
        </Button>
      </div>
    </div>
  )
}

