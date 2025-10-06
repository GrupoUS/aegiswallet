import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy loading do componente FinancialCalendar
const FinancialCalendar = lazy(() => import('@/components/calendar/financial-calendar').then(module => ({
  default: module.FinancialCalendar
})))

// Componente de loading para o calendário
function CalendarLoader() {
  return (
    <div className="h-full flex flex-col space-y-4 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      
      <div className="flex-1">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/calendario')({
  component: CalendarioPage,
})

function CalendarioPage() {
  return (
    <div className="h-full flex flex-col">
      <Suspense fallback={<CalendarLoader />}>
        <FinancialCalendar />
      </Suspense>
    </div>
  )
}
