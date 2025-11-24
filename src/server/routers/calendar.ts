import { TRPCError } from '@trpc/server';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import type { BrazilianFinancialEvent } from '@/lib/notifications/financial-notification-service';
import { createFinancialNotificationService } from '@/lib/notifications/financial-notification-service';
import { logError, logOperation } from '@/server/lib/logger';
import { protectedProcedure, router } from '@/server/trpc-helpers';

/**
 * Gera mensagem de lembrete padrão para eventos financeiros
 */
function generateReminderMessage(event: { title: string }): string {
  return `Lembrete: ${event.title}`;
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

  // Listar eventos financeiros
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

  // Criar novo evento financeiro
  create: protectedProcedure
    .input(
      z.object({
        accountId: z.string().uuid().optional(),
        amount: z.number().optional(),
        attachments: z.array(z.string()).default([]),
        categoryId: z.string().uuid().optional(),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        eventDate: z.string(),
        isIncome: z.boolean().default(false),
        isRecurring: z.boolean().default(false),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
        recurrenceRule: z.string().optional(),
        tags: z.array(z.string()).default([]),
        title: z.string().min(1, 'Título é obrigatório'),
        typeId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('financial_events')
          .insert({
            amount: input.amount,
            description: input.description,
            event_date: input.eventDate,
            event_type_id: input.typeId,
            title: input.title,
            user_id: ctx.user.id,
          })
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

  // Atualizar evento financeiro
  update: protectedProcedure
    .input(
      z.object({
        accountId: z.string().uuid().optional(),
        amount: z.number().optional(),
        categoryId: z.string().uuid().optional(),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        eventDate: z.string().optional(),
        id: z.string().uuid(),
        isCompleted: z.boolean().optional(),
        isIncome: z.boolean().optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
        tags: z.array(z.string()).optional(),
        title: z.string().optional(),
        typeId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;

        // Map the input to database column names (only use columns that exist)
        const dbUpdateData: Record<string, unknown> = {};
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
          dbUpdateData.event_date = updateData.eventDate;
        }
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
            eventId: input.id,
            operation: 'update',
            resource: 'financial_events',
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
          eventId: input.id,
          operation: 'update',
          resource: 'financial_events',
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

  // Criar lembrete para evento
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
            message: defaultMessage,
            remind_at: input.remindAt,
            reminder_type: input.reminderType,
          })
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

  // Criar lembretes automáticos para evento financeiro brasileiro
  createAutomatedReminders: protectedProcedure
    .input(
      z.object({
        customSchedule: z.array(z.number()).optional(),
        eventId: z.string().uuid(), // dias antes do evento
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
          ttl: 3600,
          urgency: 'normal',
          vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
          vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
          vapidSubject: `mailto:${ctx.user.email || 'user@aegiswallet.com'}`,
        });

        // Converter para formato BrazilianFinancialEvent
        const brazilianEvent: BrazilianFinancialEvent = {
          amount: event.amount,
          categoryName: event.transaction_categories?.name,
          description: event.description,
          dueDate: event.due_date,
          eventDate: event.event_date,
          eventTypeId: event.event_type_id,
          id: event.id,
          isCompleted: event.is_completed || false,
          priority: event.priority || 'normal',
          title: event.title,
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

  // Enviar notificação financeira imediata
  sendFinancialNotification: protectedProcedure
    .input(
      z.object({
        customMessage: z.string().optional(),
        eventId: z.string().uuid(),
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
          ttl: 3600,
          urgency: 'normal',
          vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
          vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
          vapidSubject: `mailto:${ctx.user.email || 'user@aegiswallet.com'}`,
        });

        // Converter para formato BrazilianFinancialEvent
        const brazilianEvent: BrazilianFinancialEvent = {
          amount: event.amount,
          categoryName: event.transaction_categories?.name,
          description: event.description,
          dueDate: event.due_date,
          eventDate: event.event_date,
          eventTypeId: event.event_type_id,
          id: event.id,
          isCompleted: event.is_completed || false,
          priority: event.priority || 'normal',
          title: event.title,
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
          ttl: 3600,
          urgency: 'normal',
          vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
          vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
          vapidSubject: `mailto:${ctx.user.email || 'user@aegiswallet.com'}`,
        });

        // Converter para formato BrazilianFinancialEvent
        const brazilianEvent: BrazilianFinancialEvent = {
          amount: event.amount,
          categoryName: event.transaction_categories?.name,
          description: event.description,
          dueDate: event.due_date,
          eventDate: event.event_date,
          eventTypeId: event.event_type_id,
          id: event.id,
          isCompleted: event.is_completed || false,
          priority: event.priority || 'normal',
          title: event.title,
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

  // Processar lembretes pendentes (background job)
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

  // Buscar eventos financeiros
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

  // Buscar transações relacionadas a eventos
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

        logOperation('search_transactions_success', ctx.user.id, 'transactions', undefined, {
          hasCategoryFilter: !!input.categoryId,
          hasDateFilter: !!(input.startDate || input.endDate),
          query: input.query,
          resultsCount: data?.length || 0,
        });

        return data || [];
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
