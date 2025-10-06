import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { MiniCalendarWidget } from '@/components/calendar/mini-calendar-widget'
import { FinancialAmount } from '@/components/financial-amount'
import { BentoCard, type BentoItem } from '@/components/ui/bento-grid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check for hash in URL first
      let hashToProcess = window.location.hash

      // If no hash in URL, check sessionStorage
      if (!hashToProcess) {
        hashToProcess = sessionStorage.getItem('oauth_hash') || ''
      }

      if (hashToProcess) {
        const hashParams = new URLSearchParams(hashToProcess.substring(1))
        const accessToken = hashParams.get('access_token')
        const error = hashParams.get('error')

        if (error) {
          console.error('OAuth error:', error)
          sessionStorage.removeItem('oauth_hash')
          navigate({ to: '/login', search: { error: 'Authentication failed' } })
          return
        }

        if (accessToken) {
          // Clear the hash from URL and sessionStorage
          window.history.replaceState(null, '', '/dashboard')
          sessionStorage.removeItem('oauth_hash')

          setTimeout(() => {
            // The onAuthStateChange listener in AuthContext will handle the session update
          }, 1000)
        }
      }
    }

    handleOAuthCallback()
  }, [navigate])
  // Bento Grid items for enhanced dashboard sections
  const bentoItems: BentoItem[] = [
    {
      id: 'automation-stats',
      title: 'Automação Financeira',
      description: 'Nível de automação das suas tarefas financeiras',
      feature: 'chart',
      statistic: {
        label: 'Automação',
        value: '87%',
        start: 0,
        end: 87,
        suffix: '%',
      },
      className: 'col-span-1',
    },
    {
      id: 'transactions-counter',
      title: 'Transações Processadas',
      description: 'Total de transações automatizadas este mês',
      feature: 'counter',
      statistic: {
        value: '247',
        label: 'Transações',
        start: 0,
        end: 247,
        suffix: '',
      },
      className: 'col-span-1',
    },
    {
      id: 'financial-metrics',
      title: 'Métricas Financeiras',
      description: 'Indicadores de desempenho do mês',
      feature: 'metrics',
      metrics: [
        {
          label: 'Taxa de Economia',
          value: 42,
          suffix: '%',
          color: 'primary',
        },
        {
          label: 'Tempo Economizado',
          value: 18,
          suffix: 'h',
          color: 'accent',
        },
        {
          label: 'Redução de Custos',
          value: 15,
          suffix: '%',
          color: 'secondary',
        },
      ],
      className: 'col-span-1',
    },
    {
      id: 'voice-features',
      title: 'Assistente de Voz',
      description: 'Recursos disponíveis para comandos de voz',
      feature: 'spotlight',
      spotlightItems: [
        'Pagamentos por voz',
        'Consulta de saldo',
        'Análise de gastos',
        'Alertas inteligentes',
      ],
      className: 'col-span-1',
    },
  ]

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">Insights inteligentes sobre suas finanças</p>
        </div>
      </div>

      {/* Bento Grid - Insights Inteligentes */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Insights Inteligentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {bentoItems.map((item) => (
            <BentoCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Quick Actions - 3 Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Transações Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>Últimas 5 transações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Supermercado</p>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                </div>
                <FinancialAmount amount={-125.67} />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Salário</p>
                  <p className="text-sm text-muted-foreground">3 dias atrás</p>
                </div>
                <FinancialAmount amount={3500.0} />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Restaurante</p>
                  <p className="text-sm text-muted-foreground">5 dias atrás</p>
                </div>
                <FinancialAmount amount={-85.2} />
              </div>
            </div>
            <Link to="/transactions">
              <Button variant="outline" className="w-full mt-4">
                Ver Todas as Transações
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Coluna 2: Mini Calendário */}
        <MiniCalendarWidget />

        {/* Coluna 3: Resumo Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Mensal</CardTitle>
            <CardDescription>Novembro 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Receitas</span>
                <FinancialAmount amount={5230.45} size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Despesas</span>
                <FinancialAmount amount={-3120.3} size="sm" />
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Saldo</span>
                  <FinancialAmount amount={2110.15} size="sm" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
