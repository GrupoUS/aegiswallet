import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { FinancialAmount } from '@/components/financial-amount'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, TrendingUp, TrendingDown, Wallet, PiggyBank, LineChart } from 'lucide-react'

export const Route = createFileRoute('/saldo')({
  component: Saldo,
})

function Saldo() {
  const [isListening, setIsListening] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleVoiceCommand = () => {
    setIsListening(!isListening)
    // Voice command will be implemented in Phase 3
    console.log('Voice command: Qual é meu saldo?')
  }

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
  ]

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

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
  ]

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header with Voice Command */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer">
        <CardHeader>
          <CardDescription>Saldo Total</CardDescription>
          <CardTitle className="text-4xl">
            <FinancialAmount amount={totalBalance} size="xl" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span>+12.5% em relação ao mês passado</span>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Breakdown */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Contas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const Icon = account.icon
            return (
              <Card key={account.id} className="hover:shadow-xl hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>{account.name}</CardDescription>
                    <Icon className={`w-5 h-5 ${account.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <FinancialAmount amount={account.balance} size="lg" />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Balance History Chart Placeholder */}
      <Card className="hover:shadow-lg hover:scale-[1.005] transition-all duration-300">
        <CardHeader>
          <CardTitle>Histórico de Saldo</CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
            <div className="text-center text-muted-foreground">
              <LineChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Gráfico de histórico será implementado</p>
              <p className="text-sm">Integração com Recharts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="hover:shadow-lg hover:scale-[1.005] transition-all duration-300">
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Últimas movimentações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/5 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {transaction.type === 'income' ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button variant="outline" size="lg" className="h-auto py-4">
          <div className="text-center w-full">
            <TrendingUp className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold">Transferir</p>
            <p className="text-xs text-muted-foreground">Entre contas</p>
          </div>
        </Button>
        <Button variant="outline" size="lg" className="h-auto py-4">
          <div className="text-center w-full">
            <Wallet className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold">Depositar</p>
            <p className="text-xs text-muted-foreground">Adicionar fundos</p>
          </div>
        </Button>
        <Button variant="outline" size="lg" className="h-auto py-4">
          <div className="text-center w-full">
            <TrendingDown className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold">Sacar</p>
            <p className="text-xs text-muted-foreground">Retirar dinheiro</p>
          </div>
        </Button>
      </div>

      {/* Transactions Management Section */}
      <div className="space-y-6 pt-8 border-t-2 border-border/50">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Gerenciar Transações</h2>
            <p className="text-muted-foreground">Adicione e visualize todas as suas transações</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} withGradient>
            {showCreateForm ? 'Cancelar' : 'Nova Transação'}
          </Button>
        </div>

        {/* Create Transaction Form */}
        {showCreateForm && (
          <Card className="hover:shadow-lg transition-all duration-300 border-primary/20">
            <CardHeader>
              <CardTitle>Nova Transação</CardTitle>
              <CardDescription>Adicione uma nova transação ao seu histórico</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md bg-background"
                    placeholder="Ex: Supermercado"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2 border rounded-md bg-background"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Categoria</label>
                  <select className="w-full p-2 border rounded-md bg-background">
                    <option value="">Selecione...</option>
                    <option value="food">Alimentação</option>
                    <option value="transport">Transporte</option>
                    <option value="bills">Contas</option>
                    <option value="salary">Salário</option>
                    <option value="other">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Data</label>
                  <input type="date" className="w-full p-2 border rounded-md bg-background" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button withGradient>Salvar</Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Transactions List */}
        <Card className="hover:shadow-lg hover:scale-[1.005] transition-all duration-300">
          <CardHeader>
            <CardTitle>Histórico Completo de Transações</CardTitle>
            <CardDescription>Todas as suas movimentações financeiras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mock data - will be replaced with real data */}
              <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/5 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium">Supermercado</p>
                    <p className="text-sm text-muted-foreground">Hoje • Alimentação</p>
                  </div>
                </div>
                <FinancialAmount amount={-125.67} />
              </div>

              <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/5 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Salário</p>
                    <p className="text-sm text-muted-foreground">3 dias atrás • Salário</p>
                  </div>
                </div>
                <FinancialAmount amount={3500.0} />
              </div>

              <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/5 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium">Transporte</p>
                    <p className="text-sm text-muted-foreground">5 dias atrás • Transporte</p>
                  </div>
                </div>
                <FinancialAmount amount={-50.0} />
              </div>

              <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/5 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium">Restaurante</p>
                    <p className="text-sm text-muted-foreground">1 semana atrás • Alimentação</p>
                  </div>
                </div>
                <FinancialAmount amount={-85.2} />
              </div>

              <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/5 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Freelance</p>
                    <p className="text-sm text-muted-foreground">2 semanas atrás • Salário</p>
                  </div>
                </div>
                <FinancialAmount amount={1200.0} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

