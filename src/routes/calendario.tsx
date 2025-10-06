import { createFileRoute } from '@tanstack/react-router'
import { FinancialCalendar } from '@/components/calendar/financial-calendar'

export const Route = createFileRoute('/calendario')({
  component: CalendarioPage,
})

function CalendarioPage() {
  return (
    <div className="container mx-auto p-4 h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Calendário Financeiro
        </h1>
        <p className="text-muted-foreground">
          Acompanhe suas entradas, saídas e agendamentos
        </p>
      </div>
      <FinancialCalendar />
    </div>
  )
}
