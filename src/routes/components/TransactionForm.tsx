import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface TransactionFormProps {
  onCancel: () => void
}

function TransactionForm({ onCancel }: TransactionFormProps) {
  return (
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
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default TransactionForm
