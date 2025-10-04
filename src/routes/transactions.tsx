import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FinancialAmount } from '@/components/financial-amount'
import { useState } from 'react'

const TransactionsRoute = createFileRoute('/transactions')({
  component: Transactions,
})

function Transactions() {
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transações</h1>
          <p className="text-muted-foreground">Gerencie suas transações</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          Nova Transação
        </Button>
      </div>

      {/* Formulário simples */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Transação</CardTitle>
            <CardDescription>Adicione uma nova transação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  placeholder="Ex: Supermercado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-2 border rounded"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <select className="w-full p-2 border rounded">
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
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button>Salvar</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de transações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>Suas transações recentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Dados mock - substituir com dados reais */}
            <div className="flex justify-between items-center p-3 border rounded">
              <div>
                <p className="font-medium">Supermercado</p>
                <p className="text-sm text-muted-foreground">Hoje • Alimentação</p>
              </div>
              <FinancialAmount amount={-125.67} />
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded">
              <div>
                <p className="font-medium">Salário</p>
                <p className="text-sm text-muted-foreground">3 dias atrás • Salário</p>
              </div>
              <FinancialAmount amount={3500.00} />
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded">
              <div>
                <p className="font-medium">Transporte</p>
                <p className="text-sm text-muted-foreground">5 dias atrás • Transporte</p>
              </div>
              <FinancialAmount amount={-50.00} />
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded">
              <div>
                <p className="font-medium">Restaurante</p>
                <p className="text-sm text-muted-foreground">1 semana atrás • Alimentação</p>
              </div>
              <FinancialAmount amount={-85.20} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { TransactionsRoute }