import { Link, useNavigate } from '@tanstack/react-router';
import { CreditCard, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
import { lazy, Suspense, useEffect } from 'react';
import { FinancialAmount } from '@/components/financial-amount';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MagicCard } from '@/components/ui/magic-card';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy loaded components
const LazyMiniCalendarWidget = lazy(() =>
  import('@/components/calendar/mini-calendar-widget').then((mod) => ({
    default: mod.MiniCalendarWidget,
  }))
);

// Loading components
const CalendarLoader = () => (
  <Card variant="glass">
    <CardHeader>
      <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }, (_, index) => `calendar-skeleton-${index}`).map(
          (skeletonId) => (
            <Skeleton key={skeletonId} className="h-8 w-full" />
          )
        )}
      </div>
    </CardContent>
  </Card>
);

export function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check for hash in URL first
      let hashToProcess = window.location.hash;

      // If no hash in URL, check sessionStorage
      if (!hashToProcess) {
        hashToProcess = sessionStorage.getItem('oauth_hash') || '';
      }

      if (hashToProcess) {
        const hashParams = new URLSearchParams(hashToProcess.substring(1));
        const accessToken = hashParams.get('access_token');
        const error = hashParams.get('error');

        if (error) {
          sessionStorage.removeItem('oauth_hash');
          navigate({
            to: '/login',
            search: {
              redirect: '/dashboard',
              error: 'Authentication failed',
            },
          });
          return;
        }

        if (accessToken) {
          // Clear the hash from URL and sessionStorage
          window.history.replaceState(null, '', '/dashboard');
          sessionStorage.removeItem('oauth_hash');

          setTimeout(() => {
            // The onAuthStateChange listener in AuthContext will handle the session update
          }, 1000);
        }
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  // Magic Cards com dados financeiros
  const magicCardsData = [
    {
      title: 'Saldo em Conta',
      value: 'R$ 12.450,00',
      change: '+5.2%',
      icon: Wallet,
      color: 'text-green-600',
    },
    {
      title: 'Investimentos',
      value: 'R$ 45.320,00',
      change: '+12.8%',
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: 'Economia Mensal',
      value: 'R$ 2.110,15',
      change: '+8.4%',
      icon: PiggyBank,
      color: 'text-purple-600',
    },
    {
      title: 'PIX Enviados',
      value: 'R$ 3.240,00',
      change: 'Hoje',
      icon: CreditCard,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="container mx-auto space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text font-bold text-3xl text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">Insights inteligentes sobre suas finanças</p>
        </div>
      </div>

      {/* Magic Cards - Insights Financeiros */}
      <div>
        <h2 className="mb-4 font-semibold text-2xl">Insights Financeiros</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {magicCardsData.map((card) => {
            const Icon = card.icon;
            return (
              <MagicCard key={card.title} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">{card.title}</p>
                    <p className="font-bold text-2xl">{card.value}</p>
                    <p className={`text-sm ${card.color}`}>{card.change}</p>
                  </div>
                  <Icon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </MagicCard>
            );
          })}
        </div>
      </div>

      {/* Quick Actions - 3 Columns Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna 1: Transações Recentes */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>Últimas 5 transações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Supermercado</p>
                  <p className="text-muted-foreground text-sm">Hoje</p>
                </div>
                <FinancialAmount amount={-125.67} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Salário</p>
                  <p className="text-muted-foreground text-sm">3 dias atrás</p>
                </div>
                <FinancialAmount amount={3500.0} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Restaurante</p>
                  <p className="text-muted-foreground text-sm">5 dias atrás</p>
                </div>
                <FinancialAmount amount={-85.2} />
              </div>
            </div>
            <Link to="/saldo">
              <Button variant="outline" className="mt-4 w-full">
                Ver Todas as Transações
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Coluna 2: Mini Calendário */}
        <Suspense fallback={<CalendarLoader />}>
          <LazyMiniCalendarWidget />
        </Suspense>

        {/* Coluna 3: Resumo Mensal */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Resumo Mensal</CardTitle>
            <CardDescription>Novembro 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Receitas</span>
                <FinancialAmount amount={5230.45} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Despesas</span>
                <FinancialAmount amount={-3120.3} size="sm" />
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Saldo</span>
                  <FinancialAmount amount={2110.15} size="sm" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
