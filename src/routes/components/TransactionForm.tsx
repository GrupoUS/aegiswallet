import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TransactionFormProps {
  onCancel: () => void;
}

function TransactionForm({ onCancel }: TransactionFormProps) {
  const formId = useId();
  const descriptionId = `${formId}-description`;
  const amountId = `${formId}-amount`;
  const categoryId = `${formId}-category`;
  const dateId = `${formId}-date`;

  return (
    <Card className="border-primary/20 transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle>Nova Transação</CardTitle>
        <CardDescription>Adicione uma nova transação ao seu histórico</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium text-sm" htmlFor={descriptionId}>
              Descrição
            </label>
            <input
              id={descriptionId}
              type="text"
              className="w-full rounded-md border bg-background p-2"
              placeholder="Ex: Supermercado"
            />
          </div>
          <div>
            <label className="mb-2 block font-medium text-sm" htmlFor={amountId}>
              Valor
            </label>
            <input
              id={amountId}
              type="number"
              step="0.01"
              className="w-full rounded-md border bg-background p-2"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="mb-2 block font-medium text-sm" htmlFor={categoryId}>
              Categoria
            </label>
            <select id={categoryId} className="w-full rounded-md border bg-background p-2">
              <option value="">Selecione...</option>
              <option value="food">Alimentação</option>
              <option value="transport">Transporte</option>
              <option value="bills">Contas</option>
              <option value="salary">Salário</option>
              <option value="other">Outros</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block font-medium text-sm" htmlFor={dateId}>
              Data
            </label>
            <input id={dateId} type="date" className="w-full rounded-md border bg-background p-2" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button withGradient>Salvar</Button>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default TransactionForm;
