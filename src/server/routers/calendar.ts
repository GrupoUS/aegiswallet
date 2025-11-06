import { TRPCError } from '@trpc/server';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import {
  type BrazilianFinancialEvent,
  createFinancialNotificationService,
} from '@/lib/notifications/financial-notification-service';
import { logError, logOperation } from '@/server/lib/logger';
import { protectedProcedure, router } from '@/server/trpc-helpers';

/**
 * Gera mensagem de lembrete padrão para eventos financeiros
 */
function generateReminderMessage(event: any): string {
  const eventDate = event.event_date ? new Date(event.event_date) : null;
  const formattedDate = eventDate
    ? format(eventDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
    : '';

  if (event.amount) {
    const formattedAmount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(event.amount));

    if (event.amount < 0) {
      return `💰 Lembrete: Pagamento de "${event.title}" no valor de ${formattedAmount} em ${formattedDate}`;
    } else {
      return `💳 Lembrete: Recebimento de "${event.title}" no valor de ${formattedAmount} em ${formattedDate}`;
    }
  }

  return `📅 Lembrete: "${event.title}" em ${formattedDate}`;
}

/**
 * Calendar Router - Gerenciamento de eventos financeiros
 */
export const calendarRouter = router({
  // Listar tipos de eventos
  getEventTypes: protectedProcedure.query(async () => {
    try {
      const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        logError('fetch_event_types', 'system', error, {
          resource: 'event_types',
          operation: 'getEventTypes',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar tipos de eventos',
        });
      }

      return data || [];
    } catch (error) {
      logError('fetch_event_types_unexpected', 'system', error as Error, {
        resource: 'event_types',
        operation: 'getEventTypes',
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar tipos de eventos',
      });
    }
  }),

  // Listar eventos financeiros
  getEvents: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        typeId: z.string().uuid().optional(),
        isCompleted: z.boolean().optional(),
        categoryId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
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
          .gte('event_date', input.startDate)
          .lte('event_date', input.endDate)
          .order('event_date', { ascending: true });

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
            resource: 'financial_events',
            operation: 'getEvents',
            startDate: input.startDate,
            endDate: input.endDate,
            typeId: input.typeId,
            isCompleted: input.isCompleted,
            categoryId: input.categoryId,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar eventos financeiros',
          });
        }

        logOperation('fetch_financial_events_success', ctx.user.id, 'financial_events', undefined, {
          startDate: input.startDate,
          endDate: input.endDate,
          typeId: input.typeId,
          isCompleted: input.isCompleted,
          categoryId: input.categoryId,
          resultsCount: data?.length || 0,
        });

        return data || [];
      } catch (error) {
        logError('fetch_financial_events_unexpected', ctx.user.id, error as Error, {
          resource: 'financial_events',
          operation: 'getEvents',
          startDate: input.startDate,
          endDate: input.endDate,
          typeId: input.typeId,
          isCompleted: input.isCompleted,
          categoryId: input.categoryId,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar eventos financeiros',
        });
      }
    }),

  // Obter evento específico
  getEventById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
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
            resource: 'financial_events',
            operation: 'getEventById',
            eventId: input.id,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar evento financeiro',
          });
        }

        return data;
      } catch (error) {
        logError('fetch_financial_event_by_id_unexpected', ctx.user.id, error as Error, {
          resource: 'financial_events',
          operation: 'getEventById',
          eventId: input.id,
        });
        throw error;
      }
    }),

  // Criar novo evento financeiro
  create: protectedProcedure
    .input(
      z.object({
        typeId: z.string().uuid(),
        title: z.string().min(1, 'Título é obrigatório'),
        description: z.string().optional(),
        amount: z.number().optional(),
        isIncome: z.boolean().default(false),
        accountId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        eventDate: z.string(),
        dueDate: z.string().optional(),
        isRecurring: z.boolean().default(false),
        recurrenceRule: z.string().optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
        tags: z.array(z.string()).default([]),
        attachments: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('financial_events')
          .insert({
            event_type_id: input.typeId,
            title: input.title,
            description: input.description,
            amount: input.amount,
            user_id: ctx.user.id,
            event_date: input.eventDate,
          })
          .select(`
            *,
            event_types(id, name, color, icon),
            transaction_categories(id, name, color, icon)
          `)
          .single();

        if (error) {
          logError('create_financial_event', ctx.user.id, error, {
            resource: 'financial_events',
            operation: 'create',
            eventTitle: input.title,
            typeId: input.typeId,
            eventDate: input.eventDate,
            amount: input.amount,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao criar evento financeiro',
          });
        }

        logOperation('create_financial_event_success', ctx.user.id, 'financial_events', data?.id, {
          eventTitle: input.title,
          typeId: input.typeId,
          eventDate: input.eventDate,
          amount: input.amount,
          hasDescription: !!input.description,
        });

        return data;
      } catch (error) {
        logError('create_financial_event_unexpected', ctx.user.id, error as Error, {
          resource: 'financial_events',
          operation: 'create',
          eventTitle: input.title,
          typeId: input.typeId,
          eventDate: input.eventDate,
          amount: input.amount,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar evento financeiro',
        });
      }
    }),

  // Atualizar evento financeiro
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        typeId: z.string().uuid().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        amount: z.number().optional(),
        isIncome: z.boolean().optional(),
        accountId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        eventDate: z.string().optional(),
        dueDate: z.string().optional(),
        isCompleted: z.boolean().optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;

        // Map the input to database column names (only use columns that exist)
        const dbUpdateData: any = {};
        if (updateData.typeId !== undefined) dbUpdateData.event_type_id = updateData.typeId;
        if (updateData.title !== undefined) dbUpdateData.title = updateData.title;
        if (updateData.description !== undefined) dbUpdateData.description = updateData.description;
        if (updateData.amount !== undefined) dbUpdateData.amount = updateData.amount;
        if (updateData.eventDate !== undefined) dbUpdateData.event_date = updateData.eventDate;
        if (updateData.isCompleted !== undefined) {
          dbUpdateData.is_completed = updateData.isCompleted;
          // Note: completed_at column doesn't exist yet, so we can't set it
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
            resource: 'financial_events',
            operation: 'update',
            eventId: input.id,
            updateFields: Object.keys(updateData),
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar evento financeiro',
          });
        }

        logOperation('update_financial_event_success', ctx.user.id, 'financial_events', input.id, {
          updateFields: Object.keys(updateData),
        });

        return data;
      } catch (error) {
        logError('update_financial_event_unexpected', ctx.user.id, error as Error, {
          resource: 'financial_events',
          operation: 'update',
          eventId: input.id,
          updateFields: Object.keys(input).filter((k) => k !== 'id'),
        });
        throw error;
      }
    }),

  // Deletar evento financeiro
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
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
            resource: 'financial_events',
            operation: 'delete',
            eventId: input.id,
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
          resource: 'financial_events',
          operation: 'delete',
          eventId: input.id,
        });
        throw error;
      }
    }),

  // Obter eventos próximos (próximos 30 dias)
  getUpcomingEvents: protectedProcedure.query(async ({ ctx }) => {
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
        .gte('event_date', today.toISOString().split('T')[0])
        .lte('event_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(10);

      if (error) {
        logError('fetch_upcoming_events', ctx.user.id, error, {
          resource: 'financial_events',
          operation: 'getUpcomingEvents',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar próximos eventos',
        });
      }

      logOperation('fetch_upcoming_events_success', ctx.user.id, 'financial_events', undefined, {
        resultsCount: data?.length || 0,
        daysRange: 30,
      });

      return data || [];
    } catch (error) {
      logError('fetch_upcoming_events_unexpected', ctx.user.id, error as Error, {
        resource: 'financial_events',
        operation: 'getUpcomingEvents',
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar próximos eventos',
      });
    }
  }),

  // Obter eventos atrasados
  getOverdueEvents: protectedProcedure.query(async ({ ctx }) => {
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
          resource: 'financial_events',
          operation: 'getOverdueEvents',
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
        resource: 'financial_events',
        operation: 'getOverdueEvents',
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar eventos atrasados',
      });
    }
  }),

  // Criar lembrete para evento
  createReminder: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        remindAt: z.string(),
        reminderType: z.enum(['notification', 'email', 'sms', 'voice']).default('notification'),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verificar se o evento pertence ao usuário
        const { data: event, error: eventError } = await supabase
          .from('financial_events')
          .select('id, title, event_date, amount')
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
        const { data, error } = await supabase
          .from('event_reminders')
          .insert({
            event_id: input.eventId,
            remind_at: input.remindAt,
            reminder_type: input.reminderType,
            message: defaultMessage,
          })
          .select()
          .single();

        if (error) {
          logError('create_event_reminder', ctx.user.id, error, {
            resource: 'event_reminders',
            operation: 'createReminder',
            eventId: input.eventId,
            reminderType: input.reminderType,
            remindAt: input.remindAt,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao criar lembrete',
          });
        }

        logOperation('create_event_reminder_success', ctx.user.id, 'event_reminders', data?.id, {
          eventId: input.eventId,
          reminderType: input.reminderType,
          remindAt: input.remindAt,
          hasCustomMessage: !!input.message,
        });

        return data;
      } catch (error) {
        logError('create_event_reminder_unexpected', ctx.user.id, error as Error, {
          resource: 'event_reminders',
          operation: 'createReminder',
          eventId: input.eventId,
          reminderType: input.reminderType,
          remindAt: input.remindAt,
        });
        throw error;
      }
    }),

  // Marcar lembrete como enviado
  markReminderSent: protectedProcedure
    .input(z.object({ reminderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verificar se o lembrete existe e pertence a um evento do usuário
        const { data: reminder, error: reminderError } = await supabase
          .from('event_reminders')
          .select(`
            *,
            financial_events(user_id)
          `)
          .eq('id', input.reminderId)
          .single();

        if (reminderError || !reminder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Lembrete não encontrado',
          });
        }

        // Verificar se o evento pertence ao usuário
        if (reminder.financial_events?.user_id !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso negado ao lembrete',
          });
        }

        // Atualizar lembrete como enviado
        const { data, error } = await supabase
          .from('event_reminders')
          .update({
            is_sent: true,
            sent_at: new Date().toISOString(),
          })
          .eq('id', input.reminderId)
          .select()
          .single();

        if (error) {
          logError('mark_reminder_sent', ctx.user.id, error, {
            resource: 'event_reminders',
            operation: 'markReminderSent',
            reminderId: input.reminderId,
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
          resource: 'event_reminders',
          operation: 'markReminderSent',
          reminderId: input.reminderId,
        });
        throw error;
      }
    }),

  // Criar lembretes automáticos para evento financeiro brasileiro
  createAutomatedReminders: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        customSchedule: z.array(z.number()).optional(), // dias antes do evento
      })
    )
    .mutation(async ({ ctx, input }) => {
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
          vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
          vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
          vapidSubject: `mailto:${ctx.user.email || 'user@aegiswallet.com'}`,
          ttl: 3600,
          urgency: 'normal',
        });

        // Converter para formato BrazilianFinancialEvent
        const brazilianEvent: BrazilianFinancialEvent = {
          id: event.id,
          title: event.title,
          description: event.description,
          amount: event.amount,
          eventDate: event.event_date,
          dueDate: event.due_date,
          eventTypeId: event.event_type_id,
          categoryName: event.transaction_categories?.name,
          priority: event.priority || 'normal',
          isCompleted: event.is_completed || false,
        };

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
          success: true,
          message: 'Lembretes automáticos criados com sucesso',
        };
      } catch (error) {
        logError('create_automated_reminders', ctx.user.id, error as Error, {
          resource: 'event_reminders',
          operation: 'createAutomatedReminders',
          eventId: input.eventId,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar lembretes automáticos',
        });
      }
    }),

  // Enviar notificação financeira imediata
  sendFinancialNotification: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        customMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
          vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
          vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
          vapidSubject: `mailto:${ctx.user.email || 'user@aegiswallet.com'}`,
          ttl: 3600,
          urgency: 'normal',
        });

        // Converter para formato BrazilianFinancialEvent
        const brazilianEvent: BrazilianFinancialEvent = {
          id: event.id,
          title: event.title,
          description: event.description,
          amount: event.amount,
          eventDate: event.event_date,
          dueDate: event.due_date,
          eventTypeId: event.event_type_id,
          categoryName: event.transaction_categories?.name,
          priority: event.priority || 'normal',
          isCompleted: event.is_completed || false,
        };

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

        return { success: true, message: 'Notificação enviada com sucesso' };
      } catch (error) {
        logError('send_financial_notification', ctx.user.id, error as Error, {
          resource: 'notifications',
          operation: 'sendFinancialNotification',
          eventId: input.eventId,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao enviar notificação financeira',
        });
      }
    }),

  // Criar lembrete por voz para evento financeiro
  createVoiceReminder: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        reminderTime: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
          vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
          vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
          vapidSubject: `mailto:${ctx.user.email || 'user@aegiswallet.com'}`,
          ttl: 3600,
          urgency: 'normal',
        });

        // Converter para formato BrazilianFinancialEvent
        const brazilianEvent: BrazilianFinancialEvent = {
          id: event.id,
          title: event.title,
          description: event.description,
          amount: event.amount,
          eventDate: event.event_date,
          dueDate: event.due_date,
          eventTypeId: event.event_type_id,
          categoryName: event.transaction_categories?.name,
          priority: event.priority || 'normal',
          isCompleted: event.is_completed || false,
        };

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
          success: true,
          message: 'Lembrete por voz criado com sucesso',
        };
      } catch (error) {
        logError('create_voice_reminder', ctx.user.id, error as Error, {
          resource: 'event_reminders',
          operation: 'createVoiceReminder',
          eventId: input.eventId,
          reminderTime: input.reminderTime,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar lembrete por voz',
        });
      }
    }),

  // Processar lembretes pendentes (background job)
  processPendingReminders: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Criar serviço de notificação financeira
      const notificationService = createFinancialNotificationService({
        vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
        vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
        vapidSubject: `mailto:${ctx.user.email || 'user@aegiswallet.com'}`,
        ttl: 3600,
        urgency: 'normal',
      });

      // Processar lembretes pendentes
      await notificationService.processPendingReminders();

      logOperation('process_pending_reminders_success', ctx.user.id, 'event_reminders', undefined, {
        operation: 'background_job',
      });

      return {
        success: true,
        message: 'Lembretes pendentes processados com sucesso',
      };
    } catch (error) {
      logError('process_pending_reminders', ctx.user.id, error as Error, {
        resource: 'event_reminders',
        operation: 'processPendingReminders',
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao processar lembretes pendentes',
      });
    }
  }),

  // Buscar eventos financeiros
  searchEvents: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1, 'Termo de busca é obrigatório'),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        typeId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
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
          .order('event_date', { ascending: false })
          .limit(input.limit);

        // Aplicar filtros de data se fornecidos
        if (input.startDate) {
          query = query.gte('event_date', input.startDate);
        }
        if (input.endDate) {
          query = query.lte('event_date', input.endDate);
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
            resource: 'financial_events',
            operation: 'searchEvents',
            query: input.query,
            startDate: input.startDate,
            endDate: input.endDate,
            typeId: input.typeId,
            categoryId: input.categoryId,
            limit: input.limit,
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
            query: input.query,
            resultsCount: data?.length || 0,
            hasDateFilter: !!(input.startDate || input.endDate),
            hasTypeFilter: !!input.typeId,
            hasCategoryFilter: !!input.categoryId,
          }
        );

        return data || [];
      } catch (error) {
        logError('search_financial_events_unexpected', ctx.user.id, error as Error, {
          resource: 'financial_events',
          operation: 'searchEvents',
          query: input.query,
          startDate: input.startDate,
          endDate: input.endDate,
          typeId: input.typeId,
          categoryId: input.categoryId,
          limit: input.limit,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar eventos financeiros',
        });
      }
    }),

  // Buscar transações relacionadas a eventos
  searchTransactions: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1, 'Termo de busca é obrigatório'),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        categoryId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        let query = supabase
          .from('transactions')
          .select(`
            *,
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
            resource: 'transactions',
            operation: 'searchTransactions',
            query: input.query,
            startDate: input.startDate,
            endDate: input.endDate,
            categoryId: input.categoryId,
            limit: input.limit,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar transações',
          });
        }

        logOperation('search_transactions_success', ctx.user.id, 'transactions', undefined, {
          query: input.query,
          resultsCount: data?.length || 0,
          hasDateFilter: !!(input.startDate || input.endDate),
          hasCategoryFilter: !!input.categoryId,
        });

        return data || [];
      } catch (error) {
        logError('search_transactions_unexpected', ctx.user.id, error as Error, {
          resource: 'transactions',
          operation: 'searchTransactions',
          query: input.query,
          startDate: input.startDate,
          endDate: input.endDate,
          categoryId: input.categoryId,
          limit: input.limit,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar transações',
        });
      }
    }),
});
