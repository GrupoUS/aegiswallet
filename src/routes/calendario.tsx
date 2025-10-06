import { createFileRoute } from '@tanstack/react-router'
import { FinancialCalendar } from '@/components/calendar/financial-calendar'

export const Route = createFileRoute('/calendario')({
  component: CalendarioPage,
})

function CalendarioPage() {
  return (
    <div className="h-full flex flex-col">
      <FinancialCalendar />
    </div>
  )
}
