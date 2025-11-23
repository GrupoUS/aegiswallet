import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useBankAccounts } from '@/hooks/useBankAccounts';

import { useFinancialEvents } from '@/hooks/useFinancialEvents';
import { cn } from '@/lib/utils';
import type {
  BrazilianEventType,
  FinancialEventCategory,
  FinancialEventFormData,
  FinancialEventPriority,
} from '@/types/financial.interfaces';
import type { EventColor, FinancialEvent } from '@/types/financial-events';

// Schema de validação com tipos específicos para o mercado brasileiro
const financialEventSchema = z.object({
  accountId: z.string().optional(),
  allDay: z.boolean().default(true),
  amount: z.string().refine((val) => {
    const num = Number(val.replace(/[^0-9.-]+/g, ''));
    return !Number.isNaN(num) && num !== 0;
  }, 'O valor deve ser um número válido e diferente de zero'),
  attachments: z.array(z.string()).optional(),
  brazilianEventType: z.string().optional(),
  category: z.string().min(1, 'A categoria é obrigatória'),
  color: z
    .enum([
      'emerald',
      'rose',
      'orange',
      'blue',
      'violet',
      'indigo',
      'amber',
      'red',
      'green',
      'yellow',
      'purple',
      'pink',
      'teal',
      'cyan',
    ])
    .default('blue'),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  endDate: z.date().optional(),
  icon: z.string().optional(),
  isIncome: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  location: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).default('NORMAL'),
  recurrenceRule: z.string().optional(),
  startDate: z.date(),
  tags: z.array(z.string()).optional(),
  title: z.string().min(1, 'O título é obrigatório'),
});

type FinancialEventFormValues = z.infer<typeof financialEventSchema>;

interface FinancialEventFormProps {
  initialData?: FinancialEvent;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CATEGORIES = [
  { label: 'Receita', value: 'RECEITA' },
  { label: 'Despesa Fixa', value: 'DESPESA_FIXA' },
  { label: 'Despesa Variável', value: 'DESPESA_VARIAVEL' },
  { label: 'Investimento', value: 'INVESTIMENTO' },
  { label: 'Empréstimo', value: 'EMPRESTIMO' },
  { label: 'Imposto', value: 'IMPOSTO' },
  { label: 'Transporte', value: 'TRANSPORTE' },
  { label: 'Alimentação', value: 'ALIMENTACAO' },
  { label: 'Moradia', value: 'MORADIA' },
  { label: 'Saúde', value: 'SAUDE' },
  { label: 'Educação', value: 'EDUCACAO' },
  { label: 'Lazer', value: 'LAZER' },
  { label: 'Outros', value: 'OUTROS' },
];

const RECURRENCE_OPTIONS = [
  { label: 'Diariamente', value: 'FREQ=DAILY' },
  { label: 'Semanalmente', value: 'FREQ=WEEKLY' },
  { label: 'Mensalmente', value: 'FREQ=MONTHLY' },
  { label: 'Anualmente', value: 'FREQ=YEARLY' },
];

const COLORS: { value: EventColor; label: string; class: string }[] = [
  { class: 'bg-emerald-500', label: 'Verde (Receita)', value: 'emerald' },
  { class: 'bg-rose-500', label: 'Vermelho (Despesa)', value: 'rose' },
  { class: 'bg-orange-500', label: 'Laranja (Conta)', value: 'orange' },
  { class: 'bg-blue-500', label: 'Azul (Agendamento)', value: 'blue' },
  { class: 'bg-violet-500', label: 'Roxo (Transferência)', value: 'violet' },
  { class: 'bg-indigo-500', label: 'Índigo', value: 'indigo' },
  { class: 'bg-amber-500', label: 'Âmbar', value: 'amber' },
  { class: 'bg-red-500', label: 'Vermelho', value: 'red' },
  { class: 'bg-green-500', label: 'Verde', value: 'green' },
  { class: 'bg-yellow-500', label: 'Amarelo', value: 'yellow' },
  { class: 'bg-purple-500', label: 'Roxo', value: 'purple' },
  { class: 'bg-pink-500', label: 'Rosa', value: 'pink' },
  { class: 'bg-teal-500', label: 'Ciano', value: 'teal' },
  { class: 'bg-cyan-500', label: 'Azul claro', value: 'cyan' },
];

export function FinancialEventForm({ initialData, onSuccess, onCancel }: FinancialEventFormProps) {
  const { createEvent, updateEvent } = useFinancialEvents();
  const { accounts } = useBankAccounts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Type-safe React Hook Form integration with proper TypeScript interfaces
  const form = useForm<FinancialEventFormValues>({
    defaultValues: {
      accountId: '',
      allDay: true,
      amount: '',
      attachments: [],
      brazilianEventType: '',
      category: '',
      color: 'blue',
      description: '',
      dueDate: undefined,
      endDate: undefined,
      icon: '',
      isIncome: false,
      isRecurring: false,
      location: '',
      notes: '',
      priority: 'NORMAL',
      recurrenceRule: '',
      startDate: new Date(),
      tags: [],
      title: '',
    },
    resolver: zodResolver(financialEventSchema),
  });

  // Preencher formulário se houver dados iniciais (edição)
  useEffect(() => {
    if (initialData) {
      form.reset({
        accountId: initialData.metadata?.accountId || '',
        allDay: initialData.allDay || true,
        amount: Math.abs(initialData.amount).toString(),
        attachments: initialData.attachments || [],
        brazilianEventType: initialData.brazilianEventType || '',
        category: initialData.category || '',
        color: initialData.color || 'blue',
        description: initialData.description || '',
        dueDate: initialData.dueDate ? new Date(initialData.dueDate) : undefined,
        endDate: initialData.endDate ? new Date(initialData.endDate) : undefined,
        icon: initialData.icon || '',
        isIncome: initialData.isIncome || false,
        isRecurring: initialData.isRecurring || false,
        location: initialData.location || '',
        notes: initialData.notes || '',
        priority: initialData.priority || 'NORMAL',
        recurrenceRule: initialData.recurrenceRule || '',
        startDate: new Date(initialData.startDate),
        tags: initialData.tags || [],
        title: initialData.title,
      });
    }
  }, [initialData, form]);

  const onSubmit = async (values: FinancialEventFormValues) => {
    setIsSubmitting(true);
    try {
      const numericAmount = parseFloat(values.amount.replace(/[^0-9.-]+/g, ''));
      // Ajustar sinal baseado no tipo (despesa/conta = negativo, receita = positivo)
      const finalAmount = values.isIncome ? Math.abs(numericAmount) : -Math.abs(numericAmount);

      const eventData: FinancialEventFormData = {
        allDay: values.allDay,
        amount: finalAmount,
        attachments: values.attachments,
        brazilianEventType: values.brazilianEventType as BrazilianEventType | undefined,
        category: values.category as FinancialEventCategory,
        color: values.color,
        description: values.description,
        dueDate: values.dueDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
        icon: values.icon,
        isIncome: values.isIncome,
        isRecurring: values.isRecurring,
        location: values.location,
        notes: values.notes,
        priority: values.priority as FinancialEventPriority,
        recurrenceRule: values.recurrenceRule,
        startDate: values.startDate.toISOString(),
        tags: values.tags,
        title: values.title,
      };

      if (initialData) {
        await updateEvent(initialData.id, eventData);
      } else {
        await createEvent(eventData);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch {
      // Error handled by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchRecurring = form.watch('recurring');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Título */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Aluguel, Salário, Supermercado" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Valor */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de Vencimento (Opcional) */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Vencimento (Opcional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'dd/MM/yyyy')
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo (Receita/Despesa) */}
          <FormField
            control={form.control}
            name="isIncome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === 'true')}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="false">Despesa</SelectItem>
                    <SelectItem value="true">Receita</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de Início */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Início</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'dd/MM/yyyy')
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Categoria */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Conta Bancária */}
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conta Associada (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.institution_name} ({account.account_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cor */}
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma cor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn('h-3 w-3 rounded-full', color.class)} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Recorrência */}
          <div className="col-span-2 space-y-4 rounded-lg border p-4">
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Recorrência</FormLabel>
                    <FormDescription>Repetir este evento periodicamente</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {watchRecurring && (
              <>
                <FormField
                  control={form.control}
                  name="recurrenceRule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequência</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RECURRENCE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a prioridade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BAIXA">Baixa</SelectItem>
                          <SelectItem value="NORMAL">Normal</SelectItem>
                          <SelectItem value="ALTA">Alta</SelectItem>
                          <SelectItem value="URGENTE">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>

          {/* Descrição */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Descrição (Opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Detalhes adicionais..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Localização (Opcional) */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Localização (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Onde ocorreu este evento?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notas (Opcional) */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Notas (Opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Observações importantes..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
