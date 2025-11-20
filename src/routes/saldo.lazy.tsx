import { LineChart, Mic, PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
// Lazy loading components
import { lazy, Suspense, useState } from 'react';
import { FinancialAmount } from '@/components/financial-amount';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const TransactionForm = lazy(() => import('./components/TransactionForm'));
const TransactionsList = lazy(() => import('./components/TransactionsList'));

// Loading placeholder components
function TransactionFormLoader() {
  return (
    <Card className="border-primary/20 transition-all duration-300 hover:shadow-lg" variant="glass">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-32" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-1/2" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid-col-1 grid gap-4 md:grid-cols-2">
          <div>
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionsListLoader() {
  return (
    <Card
      className="transition-all duration-300 hover:scale-[1.005] hover:shadow-lg"
      variant="glass"
    >
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-1/2" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-1/3" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <div>
                  <Skeleton className="mb-1 h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function Saldo() {
  const [isListening, setIsListening] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleVoiceCommand = () => {
    setIsListening(!isListening);
  };

  // Mock data - will be replaced with real data from Supabase
  const accounts = [
    {
      id: 1,
      name: 'Conta Corrente',
      type: 'checking',
      balance: 8450.67,
      icon: Wallet,
      color: 'text-primary',
    },
    {
      id: 2,
      name: 'Poupança',
      type: 'savings',
      balance: 3200.0,
      icon: PiggyBank,
      color: 'text-accent',
    },
    {
      id: 3,
      name: 'Investimentos',
      type: 'investments',
      balance: 8900.0,
      icon: LineChart,
      color: 'text-secondary',
    },
  ];

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  const recentTransactions = [
    {
      id: 1,
      description: 'Salário',
      amount: 5230.45,
      date: '2024-01-05',
      type: 'income',
    },
    {
      id: 2,
      description: 'Supermercado',
      amount: -125.67,
      date: '2024-01-06',
      type: 'expense',
    },
    {
      id: 3,
      description: 'Transferência Recebida',
      amount: 500.0,
      date: '2024-01-06',
      type: 'income',
    },
  ];

  return (
    <div className="container mx-auto space-y-6 p-4">
      {/* Header with Voice Command */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text font-bold text-3xl text-transparent">
            Saldo
          </h1>
          <p className="text-muted-foreground">Visão geral das suas contas</p>
        </div>
        <Button
          onClick={handleVoiceCommand}
          variant={isListening ? 'default' : 'outline'}
          size="lg"
          className="gap-2"
          withGradient
        >
          <Mic className={isListening ? 'animate-pulse' : ''} />
          {isListening ? 'Ouvindo...' : 'Qual é meu saldo?'}
        </Button>
      </div>

      {/* Total Balance Card */}
      <Card
        className="cursor-pointer border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
        variant="glass-hover"
      >
        <CardHeader>
          <CardDescription>Saldo Total</CardDescription>
          <CardTitle className="text-4xl">
            <FinancialAmount amount={totalBalance} size="xl" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <TrendingUp className="h-4 w-4 text-financial-positive" />
            <span>+12.5% em relação ao mês passado</span>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Breakdown */}
      <div>
        <h2 className="mb-4 font-semibold text-2xl">Contas</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {accounts.map((account) => {
            const Icon = account.icon;
            return (
              <Card
                key={account.id}
                className="cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 hover:shadow-xl"
                variant="glass-hover"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>{account.name}</CardDescription>
                    <Icon className={`h-5 w-5 ${account.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <FinancialAmount amount={account.balance} size="lg" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Balance History Chart Placeholder */}
      <Card
        className="transition-all duration-300 hover:scale-[1.005] hover:shadow-lg"
        variant="glass"
      >
        <CardHeader>
          <CardTitle>Histórico de Saldo</CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-muted border-dashed">
            <div className="text-center text-muted-foreground">
              <LineChart className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p>Gráfico de histórico será implementado</p>
              <p className="text-sm">Integração com Recharts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card
        className="transition-all duration-300 hover:scale-[1.005] hover:shadow-lg"
        variant="glass"
      >
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Últimas movimentações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all duration-200 hover:scale-[1.01] hover:bg-accent/5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  {transaction.type === 'income' ? (
                    <TrendingUp className="h-5 w-5 text-financial-positive" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-financial-negative" />
                  )}
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-muted-foreground text-sm">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <FinancialAmount amount={transaction.amount} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Button variant="outline" size="lg" className="h-auto py-4">
          <div className="w-full text-center">
            <TrendingUp className="mx-auto mb-2 h-6 w-6" />
            <p className="font-semibold">Transferir</p>
            <p className="text-muted-foreground text-xs">Entre contas</p>
          </div>
        </Button>
        <Button variant="outline" size="lg" className="h-auto py-4">
          <div className="w-full text-center">
            <Wallet className="mx-auto mb-2 h-6 w-6" />
            <p className="font-semibold">Depositar</p>
            <p className="text-muted-foreground text-xs">Adicionar fundos</p>
          </div>
        </Button>
        <Button variant="outline" size="lg" className="h-auto py-4">
          <div className="w-full text-center">
            <TrendingDown className="mx-auto mb-2 h-6 w-6" />
            <p className="font-semibold">Sacar</p>
            <p className="text-muted-foreground text-xs">Retirar dinheiro</p>
          </div>
        </Button>
      </div>

      {/* Transactions Management Section */}
      <div className="border/50 space-y-6 border-t-2 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-2xl">Gerenciar Transações</h2>
            <p className="text-muted-foreground">Adicione e visualize todas as suas transações</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} withGradient>
            {showCreateForm ? 'Cancelar' : 'Nova Transação'}
          </Button>
        </div>

        {/* Create Transaction Form */}
        {showCreateForm && (
          <Suspense fallback={<TransactionFormLoader />}>
            <TransactionForm onCancel={() => setShowCreateForm(false)} />
          </Suspense>
        )}

        {/* All Transactions List */}
        <Suspense fallback={<TransactionsListLoader />}>
          <TransactionsList
            transactions={[
              {
                id: 1,
                description: 'Supermercado',
                amount: -125.67,
                date: 'Hoje',
                type: 'expense',
                category: 'Alimentação',
              },
              {
                id: 2,
                description: 'Salário',
                amount: 3500.0,
                date: '3 dias atrás',
                type: 'income',
                category: 'Salário',
              },
              {
                id: 3,
                description: 'Transporte',
                amount: -50.0,
                date: '5 dias atrás',
                type: 'expense',
                category: 'Transporte',
              },
              {
                id: 4,
                description: 'Restaurante',
                amount: -85.2,
                date: '1 semana atrás',
                type: 'expense',
                category: 'Alimentação',
              },
              {
                id: 5,
                description: 'Freelance',
                amount: 1200.0,
                date: '2 semanas atrás',
                type: 'income',
                category: 'Salário',
              },
            ]}
          />
        </Suspense>
      </div>
    </div>
  );
}
