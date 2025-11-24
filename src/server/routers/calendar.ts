import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { BrazilianFinancialEvent } from '@/lib/notifications/financial-notification-service';
import { createFinancialNotificationService } from '@/lib/notifications/financial-notification-service';
import { logError, logOperation } from '@/server/lib/logger';
import { protectedProcedure, router } from '@/server/trpc-helpers';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

const RECURRENCE_RULE_REGEX =
  /^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(;UNTIL=\d{8}T\d{6}Z)?(;INTERVAL=\d+)?(;BYDAY=(MO|TU|WE|TH|FR|SA|SU)(,(MO|TU|WE|TH|FR|SA|SU))*)?$/;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const isDateString = (value: string | undefined | null) => {
  if (!value) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const isPastDate = (value: string) => {
  if (!isDateString(value)) {
    return false;
  }
  return new Date(value).setHours(0, 0, 0, 0) < startOfToday().getTime();
};

const isBefore = (value: string, comparison: string) => {
  if (!isDateString(value) || !isDateString(comparison)) {
    return false;
  }
  return new Date(value).getTime() < new Date(comparison).getTime();
};

type FinancialEventRow = Tables<'financial_events'>;
type FinancialEventInsert = TablesInsert<'financial_events'>;
type FinancialEventUpdate = TablesUpdate<'financial_events'>;
type FinancialEventWithRelations = FinancialEventRow & {
  transaction_categories?: { name?: string | null } | null;
};
type EventReminderInsert = TablesInsert<'event_reminders'>;
type EventReminderUpdate = TablesUpdate<'event_reminders'>;
type TransactionRow = Tables<'transactions'>;
type TransactionCategoryPreview = {
  id: string;
  name?: string | null;
  color?: string | null;
  icon?: string | null;
};
type BankAccountPreview = {
  id: string;
  institution_name?: string | null;
  account_mask?: string | null;
};
type CalendarTransaction = Pick<
  TransactionRow,
  'id' | 'description' | 'amount' | 'status' | 'transaction_date'
> & {
  transaction_categories?: TransactionCategoryPreview | TransactionCategoryPreview[] | null;
  bank_accounts?: BankAccountPreview | BankAccountPreview[] | null;
};

const PRIORITY_VALUES: ReadonlyArray<BrazilianFinancialEvent['priority']> = [
  'low',
  'normal',
  'high',
  'urgent',
];

const normalizePriority = (value?: string | null): BrazilianFinancialEvent['priority'] => {
  if (!value) {
    return 'normal';
  }
  const normalized = value.toLowerCase() as BrazilianFinancialEvent['priority'];
  return PRIORITY_VALUES.includes(normalized) ? normalized : 'normal';
};

const mapToBrazilianFinancialEvent = (
  event: FinancialEventWithRelations
): BrazilianFinancialEvent => ({
  amount: event.amount ?? undefined,
  categoryName: event.transaction_categories?.name ?? undefined,
  description: event.description ?? undefined,
  dueDate: event.due_date ?? undefined,
  eventDate: event.start_date,
  eventTypeId: event.event_type_id ?? 'unknown',
  id: event.id,
  isCompleted: event.is_completed ?? false,
  priority: normalizePriority(event.priority),
  title: event.title,
});

/**
 * Gera mensagem de lembrete padrão para eventos financeiros
 */
function generateReminderMessage(event: { title: string }): string {
  return `Lembrete: ${event.title}`;
}

/**
 * Calendar Router - Gerenciamento de eventos financeiros, notificações e lembretes.
 *
 * Recomendações de índice:
 * - `financial_events (user_id, start_date)` para filtros por período
 * - `financial_events (user_id, event_type_id)` e `(user_id, category_id)`
 * - `financial_events (user_id, is_completed, due_date)` para eventos atrasados
 */
export const calendarRouter = router({
  /**
   * List available financial event types for populating selectors.
   *
   * @returns Tipos de evento ordenados alfabeticamente.
   */
  getEventTypes: protectedProcedure.query(async ({ ctx }) => {
    const supabase = ctx.supabase;
    try {
      const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        logError('fetch_event_types', 'system', error, {
          operation: 'getEventTypes',
          resource: 'event_types',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar tipos de eventos',
        });
      }

      return data || [];
    } catch (error) {
      logError('fetch_event_types_unexpected', 'system', error as Error, {
        operation: 'getEventTypes',
        resource: 'event_types',
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar tipos de eventos',
      });
    }
  }),

  /**
   * List paginated financial events with optional filters for type, category, status and date range.
   *
   * Recomendação: índices em `(user_id, start_date)`, `(user_id, event_type_id)` e `(user_id, category_id)` para otimizar esta consulta.
   */
  getEvents: protectedProcedure
    .input(
      z.object({
        categoryId: z.string().uuid().optional(),
        endDate: z.string(),
        isCompleted: z.boolean().optional(),
        startDate: z.string(),
        typeId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      try {
        let query = supabase
          .from('financial_events')
          .select(`
            *,
            event_types(id, name, color, icon),
            transaction_categories(id, name, color, icon),
            transactions(id, amount, description, status)
          `)
          .eq('user_id', ctx.user.id)
          .gte('start_date', input.startDate)
          .lte('start_date', input.endDate)
          .order('start_date', { ascending: true });

        if (input.typeId) {
          query = query.eq('event_type_id', input.typeId);
        }
        if (input.isCompleted !== undefined) {
          query = query.eq('is_completed', input.isCompleted);
        }
        if (input.categoryId) {
          query = query.eq('category_id', input.categoryId);
        }

        const { data, error } = await query;

        if (error) {
          logError('fetch_financial_events', ctx.user.id, error, {
            categoryId: input.categoryId,
            endDate: input.endDate,
            isCompleted: input.isCompleted,
            operation: 'getEvents',
            resource: 'financial_events',
            startDate: input.startDate,
            typeId: input.typeId,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar eventos financeiros',
          });
        }

        logOperation('fetch_financial_events_success', ctx.user.id, 'financial_events', undefined, {
          categoryId: input.categoryId,
          endDate: input.endDate,
          isCompleted: input.isCompleted,
          resultsCount: data?.length || 0,
          startDate: input.startDate,
          typeId: input.typeId,
        });

        return data || [];
      } catch (error) {
        logError('fetch_financial_events_unexpected', ctx.user.id, error as Error, {
          categoryId: input.categoryId,
          endDate: input.endDate,
          isCompleted: input.isCompleted,
          operation: 'getEvents',
          resource: 'financial_events',
          startDate: input.startDate,
          typeId: input.typeId,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar eventos financeiros',
        });
      }
    }),

  /**
   * Retrieve a single financial event with related type, category, and linked transactions.
   */
  getEventById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      try {
        const { data, error } = await supabase
          .from('financial_events')
          .select(`
            *,
            event_types(id, name, color, icon),
            transaction_categories(id, name, color, icon),
            transactions(id, amount, description, status)
          `)
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            logOperation(
              'fetch_financial_event_not_found',
              ctx.user.id,
              'financial_events',
              input.id,
              {
                reason: 'event_not_found',
              }
            );
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Evento financeiro não encontrado',
            });
          }
          logError('fetch_financial_event_by_id', ctx.user.id, error, {
            eventId: input.id,
            operation: 'getEventById',
            resource: 'financial_events',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar evento financeiro',
          });
        }

        return data;
      } catch (error) {
        logError('fetch_financial_event_by_id_unexpected', ctx.user.id, error as Error, {
          eventId: input.id,
          operation: 'getEventById',
          resource: 'financial_events',
        });
        throw error;
      }
    }),

  /**
   * Create a financial event with validation for dates, recurrence, and optional automation metadata.
   *
   * - `eventDate` deve ser uma data futura/próxima.
   * - `dueDate` (quando informado) não pode ser anterior ao `eventDate`.
   * - `amount`, se presente, precisa ser positivo.
   * - Eventos recorrentes exigem `recurrenceRule` no formato RFC5545 simplificado.
   */
  create: protectedProcedure
    .input(
      z
        .object({
          accountId: z.string().uuid().optional(),
          amount: z.number().positive('O valor deve ser positivo.').optional(),
          attachments: z.array(z.string()).default([]),
          categoryId: z.string().uuid().optional(),
          description: z.string().optional(),
          dueDate: z.string().datetime().optional(),
          eventDate: z.string().datetime(),
          isIncome: z.boolean().default(false),
          isRecurring: z.boolean().default(false),
          priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
          recurrenceRule: z.string().optional(),
          tags: z.array(z.string()).default([]),
          title: z.string().min(1, 'Título é obrigatório'),
          typeId: z.string().uuid(),
        })
        .superRefine((data, ctx) => {
          if (isPastDate(data.eventDate)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'A data do evento não pode estar no passado.',
              path: ['eventDate'],
            });
          }
          if (data.dueDate && isBefore(data.dueDate, data.eventDate)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'O vencimento deve ser igual ou posterior à data do evento.',
              path: ['dueDate'],
            });
          }
          if (data.isRecurring && !data.recurrenceRule) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Eventos recorrentes exigem uma regra de recorrência.',
              path: ['recurrenceRule'],
            });
          }
          if (data.recurrenceRule && !RECURRENCE_RULE_REGEX.test(data.recurrenceRule)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Regra de recorrência inválida. Use o padrão FREQ=...;INTERVAL=...',
              path: ['recurrenceRule'],
            });
          }
        })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      try {
        const startDate = input.eventDate;
        const endDate = input.dueDate ?? input.eventDate;

        const payload: FinancialEventInsert = {
          account_id: input.accountId ?? null,
          attachments: input.attachments,
          category_id: input.categoryId ?? null,
          description: input.description ?? null,
          due_date: input.dueDate ?? null,
          end_date: endDate,
          event_type_id: input.typeId,
          is_income: input.isIncome,
          is_recurring: input.isRecurring,
          priority: input.priority,
          recurrence_rule: input.recurrenceRule ?? null,
          start_date: startDate,
          status: 'pending',
          tags: input.tags,
          title: input.title,
          user_id: ctx.user.id,
        };

        if (input.amount !== undefined) {
          payload.amount = input.amount;
        }

        const { data, error } = await supabase
          .from('financial_events')
          .insert(payload)
          .select(`
            *,
            event_types(id, name, color, icon),
            transaction_categories(id, name, color, icon)
          `)
          .single();

        if (error) {
          logError('create_financial_event', ctx.user.id, error, {
            amount: input.amount,
            eventDate: input.eventDate,
            eventTitle: input.title,
            operation: 'create',
            resource: 'financial_events',
            typeId: input.typeId,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao criar evento financeiro',
          });
        }

        logOperation('create_financial_event_success', ctx.user.id, 'financial_events', data?.id, {
          amount: input.amount,
          eventDate: input.eventDate,
          eventTitle: input.title,
          hasDescription: !!input.description,
          typeId: input.typeId,
        });

        return data;
      } catch (error) {
        logError('create_financial_event_unexpected', ctx.user.id, error as Error, {
          amount: input.amount,
          eventDate: input.eventDate,
          eventTitle: input.title,
          operation: 'create',
          resource: 'financial_events',
          typeId: input.typeId,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar evento financeiro',
        });
      }
    }),

  /**
   * Update mutable fields of a financial event while preventing historical or inconsistent data.
   *
   * Validations replicam as mesmas regras de criação (datas futuras, recorrência válida, valores positivos).
   */
  update: protectedProcedure
    .input(
      z
        .object({
          accountId: z.string().uuid().optional(),
          amount: z.number().positive('O valor deve ser positivo.').optional(),
          attachments: z.array(z.string()).optional(),
          categoryId: z.string().uuid().optional(),
          description: z.string().optional(),
          dueDate: z.string().datetime().optional(),
          eventDate: z.string().datetime().optional(),
          id: z.string().uuid(),
          isCompleted: z.boolean().optional(),
          isIncome: z.boolean().optional(),
          isRecurring: z.boolean().optional(),
          priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
          recurrenceRule: z.string().optional(),
          tags: z.array(z.string()).optional(),
          title: z.string().optional(),
          typeId: z.string().uuid().optional(),
        })
        .superRefine((data, ctx) => {
          if (data.eventDate && isPastDate(data.eventDate)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'A nova data do evento não pode estar no passado.',
              path: ['eventDate'],
            });
          }
          if (data.dueDate && data.eventDate && isBefore(data.dueDate, data.eventDate)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'O vencimento deve ser igual ou posterior à data do evento.',
              path: ['dueDate'],
            });
          }
          if (data.isRecurring && !data.recurrenceRule) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Eventos recorrentes exigem uma regra de recorrência.',
              path: ['recurrenceRule'],
            });
          }
          if (data.recurrenceRule && !RECURRENCE_RULE_REGEX.test(data.recurrenceRule)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Regra de recorrência inválida. Use o padrão FREQ=...;INTERVAL=...',
              path: ['recurrenceRule'],
            });
          }
        })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      const { id, ...updateData } = input;
      const dbUpdateData: Partial<FinancialEventUpdate> = {};

      try {
        if (updateData.accountId !== undefined) {
          dbUpdateData.account_id = updateData.accountId ?? null;
        }
        if (updateData.typeId !== undefined) {
          dbUpdateData.event_type_id = updateData.typeId;
        }
        if (updateData.title !== undefined) {
          dbUpdateData.title = updateData.title;
        }
        if (updateData.description !== undefined) {
          dbUpdateData.description = updateData.description;
        }
        if (updateData.amount !== undefined) {
          dbUpdateData.amount = updateData.amount;
        }
        if (updateData.eventDate !== undefined) {
          dbUpdateData.start_date = updateData.eventDate;
          if (!updateData.dueDate) {
            dbUpdateData.end_date = updateData.eventDate;
          }
        }
        if (updateData.dueDate !== undefined) {
          dbUpdateData.due_date = updateData.dueDate ?? null;
          if (updateData.dueDate) {
            dbUpdateData.end_date = updateData.dueDate;
          }
        }
        if (updateData.isCompleted !== undefined) {
          dbUpdateData.is_completed = updateData.isCompleted;
        }
        if (updateData.categoryId !== undefined) {
          dbUpdateData.category_id = updateData.categoryId ?? null;
        }
        if (updateData.priority !== undefined) {
          dbUpdateData.priority = updateData.priority;
        }
        if (updateData.tags !== undefined) {
          dbUpdateData.tags = updateData.tags ?? [];
        }
        if (updateData.attachments !== undefined) {
          dbUpdateData.attachments = updateData.attachments ?? [];
        }
        if (updateData.isIncome !== undefined) {
          dbUpdateData.is_income = updateData.isIncome;
        }
        if (updateData.isRecurring !== undefined) {
          dbUpdateData.is_recurring = updateData.isRecurring;
        }
        if (updateData.recurrenceRule !== undefined) {
          dbUpdateData.recurrence_rule = updateData.recurrenceRule ?? null;
        }

        const { data, error } = await supabase
          .from('financial_events')
          .update(dbUpdateData)
          .eq('id', id)
          .eq('user_id', ctx.user.id)
          .select(`
            *,
            event_types(id, name, color, icon),
            transaction_categories(id, name, color, icon)
          `)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            logOperation(
              'update_financial_event_not_found',
              ctx.user.id,
              'financial_events',
              input.id,
              {
                reason: 'event_not_found',
              }
            );
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Evento financeiro não encontrado',
            });
          }
          logError('update_financial_event', ctx.user.id, error, {
            eventId: input.id,
            operation: 'update',
            resource: 'financial_events',
            updateFields: Object.keys(dbUpdateData),
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar evento financeiro',
          });
        }

        logOperation('update_financial_event_success', ctx.user.id, 'financial_events', input.id, {
          updateFields: Object.keys(dbUpdateData),
        });

        return data;
      } catch (error) {
        logError('update_financial_event_unexpected', ctx.user.id, error as Error, {
          eventId: input.id,
          operation: 'update',
          resource: 'financial_events',
          updateFields: Object.keys(dbUpdateData),
        });
        throw error;
      }
    }),

  /**
   * Delete a financial event owned by the authenticated user.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      try {
        const { data, error } = await supabase
          .from('financial_events')
          .delete()
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            logOperation(
              'delete_financial_event_not_found',
              ctx.user.id,
              'financial_events',
              input.id,
              {
                reason: 'event_not_found',
              }
            );
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Evento financeiro não encontrado',
            });
          }
          logError('delete_financial_event', ctx.user.id, error, {
            eventId: input.id,
            operation: 'delete',
            resource: 'financial_events',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao deletar evento financeiro',
          });
        }

        logOperation('delete_financial_event_success', ctx.user.id, 'financial_events', input.id, {
          deletedEventId: input.id,
        });

        return data;
      } catch (error) {
        logError('delete_financial_event_unexpected', ctx.user.id, error as Error, {
          eventId: input.id,
          operation: 'delete',
          resource: 'financial_events',
        });
        throw error;
      }
    }),

  /**
   * Fetch the next 30 days of pending events for proactive reminders.
   */
  getUpcomingEvents: protectedProcedure.query(async ({ ctx }) => {
    const supabase = ctx.supabase;
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const { data, error } = await supabase
        .from('financial_events')
        .select(`
            *,
            event_types(id, name, color, icon),
            transaction_categories(id, name, color, icon)
          `)
        .eq('user_id', ctx.user.id)
        .eq('is_completed', false)
        .gte('start_date', today.toISOString().split('T')[0])
        .lte('start_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(10);

      if (error) {
        logError('fetch_upcoming_events', ctx.user.id, error, {
          operation: 'getUpcomingEvents',
          resource: 'financial_events',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar próximos eventos',
        });
      }

      logOperation('fetch_upcoming_events_success', ctx.user.id, 'financial_events', undefined, {
        daysRange: 30,
        resultsCount: data?.length || 0,
      });

      return data || [];
    } catch (error) {
      logError('fetch_upcoming_events_unexpected', ctx.user.id, error as Error, {
        operation: 'getUpcomingEvents',
        resource: 'financial_events',
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar próximos eventos',
      });
    }
  }),

  /**
   * Fetch overdue events (dueDate anterior a hoje) para alertas críticos.
   */
  getOverdueEvents: protectedProcedure.query(async ({ ctx }) => {
    const supabase = ctx.supabase;
    try {
      const today = new Date();

      const { data, error } = await supabase
        .from('financial_events')
        .select(`
            *,
            event_types(id, name, color, icon),
            transaction_categories(id, name, color, icon)
          `)
        .eq('user_id', ctx.user.id)
        .eq('is_completed', false)
        .lt('due_date', today.toISOString().split('T')[0])
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true });

      if (error) {
        logError('fetch_overdue_events', ctx.user.id, error, {
          operation: 'getOverdueEvents',
          resource: 'financial_events',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar eventos atrasados',
        });
      }

      logOperation('fetch_overdue_events_success', ctx.user.id, 'financial_events', undefined, {
        resultsCount: data?.length || 0,
      });

      return data || [];
    } catch (error) {
      logError('fetch_overdue_events_unexpected', ctx.user.id, error as Error, {
        operation: 'getOverdueEvents',
        resource: 'financial_events',
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar eventos atrasados',
      });
    }
  }),

  /**
   * Create a manual reminder for a financial event (notification/email/SMS/voice).
   *
   * Integração: os lembretes podem ser posteriormente enviados pelo `financial-notification-service`.
   */
  createReminder: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        message: z.string().optional(),
        remindAt: z.string(),
        reminderType: z.enum(['notification', 'email', 'sms', 'voice']).default('notification'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      try {
        // Verificar se o evento pertence ao usuário
        const { data: event, error: eventError } = await supabase
          .from('financial_events')
          .select('id, title, start_date, amount')
          .eq('id', input.eventId)
          .eq('user_id', ctx.user.id)
          .single();

        if (eventError || !event) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Evento financeiro não encontrado',
          });
        }

        // Criar mensagem padrão se não fornecida
        const defaultMessage = input.message || generateReminderMessage(event);

        // Inserir lembrete no banco de dados
        const reminderPayload: EventReminderInsert = {
          event_id: input.eventId,
          is_sent: false,
          message: defaultMessage,
          remind_at: input.remindAt,
          reminder_type: input.reminderType,
          user_id: ctx.user.id,
        };

        const { data, error } = await supabase
          .from('event_reminders')
          .insert(reminderPayload)
          .select()
          .single();

        if (error) {
          logError('create_event_reminder', ctx.user.id, error, {
            eventId: input.eventId,
            operation: 'createReminder',
            remindAt: input.remindAt,
            reminderType: input.reminderType,
            resource: 'event_reminders',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao criar lembrete',
          });
        }

        logOperation('create_event_reminder_success', ctx.user.id, 'event_reminders', data?.id, {
          eventId: input.eventId,
          hasCustomMessage: !!input.message,
          remindAt: input.remindAt,
          reminderType: input.reminderType,
        });

        return data;
      } catch (error) {
        logError('create_event_reminder_unexpected', ctx.user.id, error as Error, {
          eventId: input.eventId,
          operation: 'createReminder',
          remindAt: input.remindAt,
          reminderType: input.reminderType,
          resource: 'event_reminders',
        });
        throw error;
      }
    }),

  /**
   * Mark a reminder as sent (used pelo job de notificações para auditoria).
   */
  markReminderSent: protectedProcedure
    .input(z.object({ reminderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      try {
        // Verificar se o lembrete existe e pertence a um evento do usuário
        const { data: reminder, error: reminderError } = await supabase
          .from('event_reminders')
          .select('id, user_id, event_id')
          .eq('id', input.reminderId)
          .single();

        if (reminderError || !reminder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Lembrete não encontrado',
          });
        }

        // Verificar se o evento pertence ao usuário
        if (reminder.user_id !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso negado ao lembrete',
          });
        }

        const now = new Date().toISOString();
        const reminderUpdate: EventReminderUpdate = {
          is_sent: true,
          sent_at: now,
          updated_at: now,
        };

        // Atualizar lembrete como enviado
        const { data, error } = await supabase
          .from('event_reminders')
          .update(reminderUpdate)
          .eq('id', input.reminderId)
          .eq('user_id', ctx.user.id)
          .select()
          .single();

        if (error) {
          logError('mark_reminder_sent', ctx.user.id, error, {
            operation: 'markReminderSent',
            reminderId: input.reminderId,
            resource: 'event_reminders',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao marcar lembrete como enviado',
          });
        }

        logOperation(
          'mark_reminder_sent_success',
          ctx.user.id,
          'event_reminders',
          input.reminderId,
          {
            reminderId: input.reminderId,
            sentAt: data.sent_at,
          }
        );

        return data;
      } catch (error) {
        logError('mark_reminder_sent_unexpected', ctx.user.id, error as Error, {
          operation: 'markReminderSent',
          reminderId: input.reminderId,
          resource: 'event_reminders',
        });
        throw error;
      }
    }),

  /**
   * Generate automated reminders for a Brazilian financial event using the notification service.
   *
   * O `financial-notification-service` cria lembretes (push/email/voz) respeitando TTL, urgência e limites.
   * Quando `customSchedule` não é informado, aplica o cronograma padrão (3d/1d/mesmo dia).
   */
  createAutomatedReminders: protectedProcedure
    .input(
      z.object({
        customSchedule: z.array(z.number()).optional(),
        eventId: z.string().uuid(), // dias antes do evento
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      try {
        // Buscar evento completo
        const { data: event, error: eventError } = await supabase
          .from('financial_events')
          .select(`
            *,
            event_types(id, name, color, icon),
            transaction_categories(id, name, color, icon)
          `)
          .eq('id', input.eventId)
          .eq('user_id', ctx.user.id)
          .single();

        if (eventError || !event) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Evento financeiro não encontrado',
          });
        }

        // Criar serviço de notificação financeira
        const notificationService = createFinancialNotificationService({
          ttl: 3600,
          urgency: 'normal',
          vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
          vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
          vapidSubject: `mailto:${ctx.user.email || 'user@aegiswallet.com'}`,
        });

        // Converter para formato BrazilianFinancialEvent
        const brazilianEvent = mapToBrazilianFinancialEvent(event as FinancialEventWithRelations);

        // Criar lembretes automáticos
        await notificationService.createAutomatedReminders(brazilianEvent, ctx.user.id);

        logOperation(
          'create_automated_reminders_success',
          ctx.user.id,
          'event_reminders',
          undefined,
          {
            eventId: input.eventId,
            eventTitle: event.title,
            hasCustomSchedule: !!input.customSchedule,
          }
        );

        return {
          message: 'Lembretes automáticos criados com sucesso',
          success: true,
        };
      } catch (error) {
        logError('create_automated_reminders', ctx.user.id, error as Error, {
          eventId: input.eventId,
          operation: 'createAutomatedReminders',
          resource: 'event_reminders',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar lembretes automáticos',
        });
      }
    }),

  /**
   * Send an immediate financial notification (push/email) via the notification service.
   *
   * Aplica rate limiting interno do serviço e exige token VAPID configurado.
   */
  sendFinancialNotification: protectedProcedure
    .input(
      z.object({
        customMessage: z.string().optional(),
        eventId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      try {
        // Buscar evento completo
        const { data: event, error: eventError } = await supabase
          .from('financial_events')
          .select(`
            *,
            event_types(id, name, color, icon),
            transaction_categories(id, name, color, icon)
          `)
          .eq('id', input.eventId)
          .eq('user_id', ctx.user.id)
          .single();

        if (eventError || !event) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Evento financeiro não encontrado',
          });
        }

        // Criar serviço de notificação financeira
        const notificationService = createFinancialNotificationService({
          ttl: 3600,
          urgency: 'normal',
          vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
          vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
          vapidSubject: `mailto:${ctx.user.email || 'user@aegiswallet.com'}`,
        });

        // Converter para formato BrazilianFinancialEvent
        const brazilianEvent = mapToBrazilianFinancialEvent(event as FinancialEventWithRelations);

        // Enviar notificação imediata
        await notificationService.sendFinancialNotification(
          brazilianEvent,
          ctx.user.id,
          input.customMessage
        );

        logOperation(
          'send_financial_notification_success',
          ctx.user.id,
          'notifications',
          undefined,
          {
            eventId: input.eventId,
            eventTitle: event.title,
            hasCustomMessage: !!input.customMessage,
          }
        );

        return { message: 'Notificação enviada com sucesso', success: true };
      } catch (error) {
        logError('send_financial_notification', ctx.user.id, error as Error, {
          eventId: input.eventId,
          operation: 'sendFinancialNotification',
          resource: 'notifications',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao enviar notificação financeira',
        });
      }
    }),

  /**
   * Schedule a voice reminder (TTS) for a financial event.
   *
   * Integração: delega ao `financial-notification-service` a criação do áudio/tts com segurança LGPD.
   */
  createVoiceReminder: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        reminderTime: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      try {
        // Buscar evento completo
        const { data: event, error: eventError } = await supabase
          .from('financial_events')
          .select(`
            *,
            event_types(id, name, color, icon),
            transaction_categories(id, name, color, icon)
          `)
          .eq('id', input.eventId)
          .eq('user_id', ctx.user.id)
          .single();

        if (eventError || !event) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Evento financeiro não encontrado',
          });
        }

        // Criar serviço de notificação financeira
        const notificationService = createFinancialNotificationService({
          ttl: 3600,
          urgency: 'normal',
          vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
          vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
          vapidSubject: `mailto:${ctx.user.email || 'user@aegiswallet.com'}`,
        });

        // Converter para formato BrazilianFinancialEvent
        const brazilianEvent = mapToBrazilianFinancialEvent(event as FinancialEventWithRelations);

        // Criar lembrete por voz
        await notificationService.createVoiceReminder(
          brazilianEvent,
          ctx.user.id,
          input.reminderTime
        );

        logOperation('create_voice_reminder_success', ctx.user.id, 'event_reminders', undefined, {
          eventId: input.eventId,
          eventTitle: event.title,
          reminderTime: input.reminderTime,
        });

        return {
          message: 'Lembrete por voz criado com sucesso',
          success: true,
        };
      } catch (error) {
        logError('create_voice_reminder', ctx.user.id, error as Error, {
          eventId: input.eventId,
          operation: 'createVoiceReminder',
          reminderTime: input.reminderTime,
          resource: 'event_reminders',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar lembrete por voz',
        });
      }
    }),

  /**
   * Process pending reminders (background job trigger).
   *
   * Utilizado por CRON/Queue e respeita o rate limiting configurado no notification service.
   */
  processPendingReminders: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Criar serviço de notificação financeira
      const notificationService = createFinancialNotificationService({
        ttl: 3600,
        urgency: 'normal',
        vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
        vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
        vapidSubject: `mailto:${ctx.user.email || 'user@aegiswallet.com'}`,
      });

      // Processar lembretes pendentes
      await notificationService.processPendingReminders();

      logOperation('process_pending_reminders_success', ctx.user.id, 'event_reminders', undefined, {
        operation: 'background_job',
      });

      return {
        message: 'Lembretes pendentes processados com sucesso',
        success: true,
      };
    } catch (error) {
      logError('process_pending_reminders', ctx.user.id, error as Error, {
        operation: 'processPendingReminders',
        resource: 'event_reminders',
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao processar lembretes pendentes',
      });
    }
  }),

  /**
   * Search events by title/description with optional filters and pagination.
   */
  searchEvents: protectedProcedure
    .input(
      z.object({
        categoryId: z.string().uuid().optional(),
        endDate: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        query: z.string().min(1, 'Termo de busca é obrigatório'),
        startDate: z.string().optional(),
        typeId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      try {
        let query = supabase
          .from('financial_events')
          .select(`
            *,
            event_types(id, name, color, icon),
            transaction_categories(id, name, color, icon),
            transactions(id, amount, description, status)
          `)
          .eq('user_id', ctx.user.id)
          .or(`title.ilike.%${input.query}%,description.ilike.%${input.query}%`)
          .order('start_date', { ascending: false })
          .limit(input.limit);

        // Aplicar filtros de data se fornecidos
        if (input.startDate) {
          query = query.gte('start_date', input.startDate);
        }
        if (input.endDate) {
          query = query.lte('start_date', input.endDate);
        }

        // Aplicar filtros adicionais
        if (input.typeId) {
          query = query.eq('event_type_id', input.typeId);
        }
        if (input.categoryId) {
          query = query.eq('category_id', input.categoryId);
        }

        const { data, error } = await query;

        if (error) {
          logError('search_financial_events', ctx.user.id, error, {
            categoryId: input.categoryId,
            endDate: input.endDate,
            limit: input.limit,
            operation: 'searchEvents',
            query: input.query,
            resource: 'financial_events',
            startDate: input.startDate,
            typeId: input.typeId,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar eventos financeiros',
          });
        }

        logOperation(
          'search_financial_events_success',
          ctx.user.id,
          'financial_events',
          undefined,
          {
            hasCategoryFilter: !!input.categoryId,
            hasDateFilter: !!(input.startDate || input.endDate),
            hasTypeFilter: !!input.typeId,
            query: input.query,
            resultsCount: data?.length || 0,
          }
        );

        return data || [];
      } catch (error) {
        logError('search_financial_events_unexpected', ctx.user.id, error as Error, {
          categoryId: input.categoryId,
          endDate: input.endDate,
          limit: input.limit,
          operation: 'searchEvents',
          query: input.query,
          resource: 'financial_events',
          startDate: input.startDate,
          typeId: input.typeId,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar eventos financeiros',
        });
      }
    }),

  /**
   * Search transactions (PIX/boletos/etc.) related to events for contextual insights.
   */
  searchTransactions: protectedProcedure
    .input(
      z.object({
        categoryId: z.string().uuid().optional(),
        endDate: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        query: z.string().min(1, 'Termo de busca é obrigatório'),
        startDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;
      try {
        let query = supabase
          .from('transactions')
          .select(`
            id,
            description,
            amount,
            status,
            transaction_date,
            transaction_categories(id, name, color, icon),
            bank_accounts(id, institution_name, account_mask)
          `)
          .eq('user_id', ctx.user.id)
          .or(`description.ilike.%${input.query}%`)
          .order('transaction_date', { ascending: false })
          .limit(input.limit);

        // Aplicar filtros de data se fornecidos
        if (input.startDate) {
          query = query.gte('transaction_date', input.startDate);
        }
        if (input.endDate) {
          query = query.lte('transaction_date', input.endDate);
        }

        // Aplicar filtro de categoria se fornecido
        if (input.categoryId) {
          query = query.eq('category_id', input.categoryId);
        }

        const { data, error } = await query;

        if (error) {
          logError('search_transactions', ctx.user.id, error, {
            categoryId: input.categoryId,
            endDate: input.endDate,
            limit: input.limit,
            operation: 'searchTransactions',
            query: input.query,
            resource: 'transactions',
            startDate: input.startDate,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar transações',
          });
        }

        const typedData = (data ?? []) as unknown as CalendarTransaction[];

        logOperation('search_transactions_success', ctx.user.id, 'transactions', undefined, {
          hasCategoryFilter: !!input.categoryId,
          hasDateFilter: !!(input.startDate || input.endDate),
          query: input.query,
          resultsCount: typedData.length,
        });

        return typedData;
      } catch (error) {
        logError('search_transactions_unexpected', ctx.user.id, error as Error, {
          categoryId: input.categoryId,
          endDate: input.endDate,
          limit: input.limit,
          operation: 'searchTransactions',
          query: input.query,
          resource: 'transactions',
          startDate: input.startDate,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar transações',
        });
      }
    }),
});
