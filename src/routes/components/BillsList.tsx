import { Calendar, CheckCircle, Clock } from 'lucide-react'
import { FinancialAmount } from '@/components/financial-amount'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Bill {
  id: number
  name: string
  amount: number
  dueDate: string
  status: string
  category: string
  recurring: boolean
  icon: string
}

interface BillsListProps {
  bills: Bill[]
  filter: 'all' | 'pending' | 'paid'
}

export function BillsList({ bills, filter }: BillsListProps) {
  const filteredBills = bills.filter((bill) => {
    if (filter === 'all') return true
    return bill.status === filter
  })

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
                        <span>
                          Vencimento: {new Date(bill.dueDate).toLocaleDateString('pt-BR')}
                        </span>
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
                  {bill.status === 'pending' && <Button size="sm">Pagar</Button>}
                  {bill.status === 'paid' && <CheckCircle className="w-6 h-6 text-green-500" />}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
