import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface TransactionFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

// Map UI categories to Supabase constraints
const mapCategoryToDb = (
  uiCategory: string,
  type: 'income' | 'expense'
): { merchantCategory: string | null; brazilianType: string | null } => {
  if (type === 'income') {
    if (uiCategory === 'salary') return { merchantCategory: null, brazilianType: 'salario' };
    if (uiCategory === 'other') return { merchantCategory: null, brazilianType: 'outros' }; // fallback
    // Add more income mappings if needed
    return { merchantCategory: null, brazilianType: 'outros' };
  }

  // Expenses
  switch (uiCategory) {
    case 'food':
      return { merchantCategory: 'restaurante', brazilianType: null };
    case 'transport':
      return { merchantCategory: 'transporte', brazilianType: null };
    case 'bills':
      return { merchantCategory: 'outros', brazilianType: null }; // 'contas' not in merchant_category, use outros
    case 'leisure':
      return { merchantCategory: 'lazer', brazilianType: null };
    case 'health':
      return { merchantCategory: 'saude', brazilianType: null };
    case 'education':
      return { merchantCategory: 'educacao', brazilianType: null };
    case 'clothes':
      return { merchantCategory: 'vestuario', brazilianType: null };
    case 'electronics':
      return { merchantCategory: 'eletronicos', brazilianType: null };
    case 'home':
      return { merchantCategory: 'casa_moradia', brazilianType: null };
    case 'other':
      return { merchantCategory: 'outros', brazilianType: null };
    default:
      return { merchantCategory: 'outros', brazilianType: null };
  }
};

function TransactionForm({ onCancel, onSuccess }: TransactionFormProps) {
  const formId = useId();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const descriptionId = `${formId}-description`;
  const amountId = `${formId}-amount`;
  const categoryId = `${formId}-category`;
  const dateId = `${formId}-date`;
  const typeId = `${formId}-type`;

  const handleSubmit = async () => {
    if (!description || !amount || !category || !date) {
      toast.error('Erro', {
        description: 'Por favor, preencha todos os campos.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const numericAmount = parseFloat(amount);
      const finalAmount = type === 'expense' ? -Math.abs(numericAmount) : Math.abs(numericAmount);

      const { merchantCategory, brazilianType } = mapCategoryToDb(category, type);

      const { error } = await supabase.from('financial_events').insert({
        user_id: user.id,
        title: description,
        amount: finalAmount,
        category: category, // Keep original category for UI display if needed, or map it too? Schema has 'category' text field.
        event_type: type,
        start_date: new Date(date).toISOString(),
        end_date: new Date(date).toISOString(),
        status: 'paid', // Assuming manual entry is for completed transactions
        is_income: type === 'income',
        merchant_category: merchantCategory,
        brazilian_event_type: brazilianType,
      });

      if (error) throw error;

      toast.success('Sucesso', {
        description: 'Transação adicionada com sucesso!',
      });

      // Reset form
      setDescription('');
      setAmount('');
      setCategory('');

      if (onSuccess) onSuccess();
    } catch (_error) {
      toast.error('Erro', {
        description: 'Não foi possível salvar a transação.',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border bg-background p-2"
              placeholder="Ex: Supermercado"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-sm" htmlFor={typeId}>
              Tipo
            </label>
            <select
              id={typeId}
              value={type}
              onChange={(e) => setType(e.target.value as 'income' | 'expense')}
              className="w-full rounded-md border bg-background p-2"
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium text-sm" htmlFor={amountId}>
              Valor
            </label>
            <input
              id={amountId}
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border bg-background p-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-sm" htmlFor={categoryId}>
              Categoria
            </label>
            <select
              id={categoryId}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border bg-background p-2"
            >
              <option value="">Selecione...</option>
              <option value="food">Alimentação</option>
              <option value="transport">Transporte</option>
              <option value="bills">Contas</option>
              <option value="salary">Salário</option>
              <option value="leisure">Lazer</option>
              <option value="health">Saúde</option>
              <option value="education">Educação</option>
              <option value="clothes">Vestuário</option>
              <option value="electronics">Eletrônicos</option>
              <option value="home">Casa/Moradia</option>
              <option value="other">Outros</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium text-sm" htmlFor={dateId}>
              Data
            </label>
            <input
              id={dateId}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border bg-background p-2"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button withGradient onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default TransactionForm;
