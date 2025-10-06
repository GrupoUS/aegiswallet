import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, addHours, setHours, setMinutes } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/ui/date-picker'
import type { CalendarEvent, EventColor } from './types'

const eventFormSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  color: z.enum(['emerald', 'rose', 'orange', 'blue', 'violet', 'indigo', 'amber']),
  allDay: z.boolean().default(false),
  recurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
})

type EventFormValues = z.infer<typeof eventFormSchema>

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (event: Partial<CalendarEvent>) => void
  event?: CalendarEvent | null
  initialDate?: Date
  initialStartTime?: Date
}

const colorOptions: { value: EventColor; label: string; class: string }[] = [
  { value: 'emerald', label: 'Verde (Receita)', class: 'bg-emerald-500' },
  { value: 'rose', label: 'Vermelho (Despesa)', class: 'bg-rose-500' },
  { value: 'orange', label: 'Laranja (Conta)', class: 'bg-orange-500' },
  { value: 'blue', label: 'Azul (Agendamento)', class: 'bg-blue-500' },
  { value: 'violet', label: 'Roxo (Transferência)', class: 'bg-violet-500' },
  { value: 'indigo', label: 'Índigo', class: 'bg-indigo-500' },
  { value: 'amber', label: 'Âmbar', class: 'bg-amber-500' },
]

const recurrenceOptions = [
  { value: 'FREQ=DAILY', label: 'Diariamente' },
  { value: 'FREQ=WEEKLY', label: 'Semanalmente' },
  { value: 'FREQ=WEEKLY;BYDAY=MO,WE,FR', label: 'Seg, Qua, Sex' },
  { value: 'FREQ=MONTHLY', label: 'Mensalmente' },
  { value: 'FREQ=YEARLY', label: 'Anualmente' },
]

export function EventDialog({
  open,
  onOpenChange,
  onSave,
  event,
  initialDate,
  initialStartTime,
}: EventDialogProps) {
  const [isRecurring, setIsRecurring] = useState(false)
  const isEditing = !!event

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      date: format(initialDate || new Date(), 'yyyy-MM-dd'),
      startTime: initialStartTime ? format(initialStartTime, 'HH:mm') : '09:00',
      endTime: initialStartTime ? format(addHours(initialStartTime, 1), 'HH:mm') : '10:00',
      color: 'blue',
      allDay: false,
      recurring: false,
      recurrenceRule: '',
    },
  })

  // Update form when event changes
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description || '',
        date: format(event.start, 'yyyy-MM-dd'),
        startTime: format(event.start, 'HH:mm'),
        endTime: format(event.end, 'HH:mm'),
        color: event.color,
        allDay: event.allDay || false,
        recurring: false,
        recurrenceRule: '',
      })
    } else if (initialDate || initialStartTime) {
      form.reset({
        title: '',
        description: '',
        date: format(initialDate || new Date(), 'yyyy-MM-dd'),
        startTime: initialStartTime ? format(initialStartTime, 'HH:mm') : '09:00',
        endTime: initialStartTime ? format(addHours(initialStartTime, 1), 'HH:mm') : '10:00',
        color: 'blue',
        allDay: false,
        recurring: false,
        recurrenceRule: '',
      })
    }
  }, [event, initialDate, initialStartTime, form])

  const onSubmit = (values: EventFormValues) => {
    const [startHour, startMinute] = values.startTime.split(':').map(Number)
    const [endHour, endMinute] = values.endTime.split(':').map(Number)
    const baseDate = new Date(values.date)

    const start = setMinutes(setHours(baseDate, startHour), startMinute)
    const end = setMinutes(setHours(baseDate, endHour), endMinute)

    const eventData: Partial<CalendarEvent> = {
      id: event?.id,
      title: values.title,
      description: values.description,
      start,
      end,
      color: values.color,
      allDay: values.allDay,
    }

    onSave(eventData)
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do evento'
              : 'Crie um novo evento no calendário financeiro'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do evento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes adicionais sobre o evento"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data *</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => {
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                      }}
                      placeholder="Selecione a data do evento"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Início *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Fim *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria (Cor) *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${option.class}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* All Day Toggle */}
            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Dia inteiro</FormLabel>
                    <FormDescription>
                      Evento sem horário específico
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Recurring Toggle */}
            <FormField
              control={form.control}
              name="recurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Evento recorrente</FormLabel>
                    <FormDescription>
                      Repetir este evento periodicamente
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        setIsRecurring(checked)
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Recurrence Rule */}
            {isRecurring && (
              <FormField
                control={form.control}
                name="recurrenceRule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência de Repetição</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {recurrenceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Define quando e como o evento será repetido
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  form.reset()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? 'Atualizar' : 'Criar'} Evento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
