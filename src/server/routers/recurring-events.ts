/**
 * Recurring Events Router
 *
 * tRPC procedures for managing recurring financial events
 * with Brazilian financial context
 */

import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { supabase } from '@/integrations/supabase/client'
import { protectedProcedure, router } from '@/server/trpc-helpers'
import { logger, logError, logOperation } from '@/server/lib/logger'
import {
  createBrazilianRecurringEventsService,
  type RecurrenceRule,
} from '@/lib/calendar/recurring-events'

// Zod schemas for recurrence rules
const recurrenceRuleSchema = z.object({
  pattern: z.enum([
    'daily',
    'weekly',
    'bi-weekly',
    'monthly',
    'bi-monthly',
    'quarterly',
    'semi-annually',
    'yearly',
    'custom',
  ]),
  interval: z.number().min(1).default(1),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  weekOfMonth: z.number().min(1).max(5).optional(),
  paymentDay: z
    .enum([
      'business-day',
      'first-business-day',
      'last-business-day',
      'fixed-day',
      'last-day-month',
      'closest-business-day',
    ])
    .optional(),
  endDate: z.string().optional(),
  maxOccurrences: z.number().min(1).optional(),
  skipWeekends: z.boolean().default(false),
  skipHolidays: z.boolean().default(false),
  considerBrazilianHolidays: z.boolean().default(false),
  moveToNextBusinessDay: z.boolean().default(false),
})

/**
 * Recurring Events Router
 */
export const recurringEventsRouter = router({
  // Listar eventos recorrentes
  getRecurringEvents: protectedProcedure
    .input(
      z.object({
        isActive: z.boolean().optional(),
        typeId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        let query = supabase
          .from('recurring_events')
          .select(`
            *,
            event_types(id, name, color, icon),
            transaction_categories(id, name, color, icon),
            bank_accounts(id, institution_name, account_mask)
          `)
          .eq('user_id', ctx.user.id)
          .order('created_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1)

        if (input.isActive !== undefined) {
          query = query.eq('is_active', input.isActive)
        }
        if (input.typeId) {
          query = query.eq('event_type_id', input.typeId)
        }

        const { data, error } = await query

        if (error) {
          logError('fetch_recurring_events', ctx.user.id, error, {
            resource: 'recurring_events',
            operation: 'getRecurringEvents',
            isActive: input.isActive,
            typeId: input.typeId,
          })
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar eventos recorrentes',
          })
        }

        logOperation('fetch_recurring_events_success', ctx.user.id, 'recurring_events', undefined, {
          isActive: input.isActive,
          typeId: input.typeId,
          resultsCount: data?.length || 0,
        })

        return data || []
      } catch (error) {
        logError('fetch_recurring_events_unexpected', ctx.user.id, error as Error, {
          resource: 'recurring_events',
          operation: 'getRecurringEvents',
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar eventos recorrentes',
        })
      }
    }),

  // Obter evento recorrente específico
  getRecurringEventById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('recurring_events')
          .select(`
            *,
            event_types(id, name, color, icon),
            transaction_categories(id, name, color, icon),
            bank_accounts(id, institution_name, account_mask)
          `)
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Evento recorrente não encontrado',
            })
          }
          logError('fetch_recurring_event_by_id', ctx.user.id, error, {
            resource: 'recurring_events',
            operation: 'getRecurringEventById',
            eventId: input.id,
          })
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar evento recorrente',
          })
        }

        return data
      } catch (error) {
        logError('fetch_recurring_event_by_id_unexpected', ctx.user.id, error as Error, {
          resource: 'recurring_events',
          operation: 'getRecurringEventById',
          eventId: input.id,
        })
        throw error
      }
    }),

  // Criar evento recorrente
  createRecurringEvent: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, 'Título é obrigatório'),
        description: z.string().optional(),
        amount: z.number().optional(),
        typeId: z.string().uuid(),
        categoryId: z.string().uuid().optional(),
        accountId: z.string().uuid().optional(),
        recurrenceRule: recurrenceRuleSchema,
        startDate: z.string(),
        endDate: z.string().optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
        tags: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const service = createBrazilianRecurringEventsService()

        const recurringEvent = await service.createRecurringEvent({
          title: input.title,
          description: input.description,
          amount: input.amount,
          eventTypeId: input.typeId,
          categoryId: input.categoryId,
          accountId: input.accountId,
          recurrenceRule: input.recurrenceRule,
          startDate: input.startDate,
          endDate: input.endDate,
          isActive: true,
          priority: input.priority,
          tags: input.tags,
          userId: ctx.user.id,
        })

        logOperation(
          'create_recurring_event_success',
          ctx.user.id,
          'recurring_events',
          recurringEvent.id,
          {
            title: input.title,
            pattern: input.recurrenceRule.pattern,
            interval: input.recurrenceRule.interval,
            amount: input.amount,
          }
        )

        return recurringEvent
      } catch (error) {
        logError('create_recurring_event', ctx.user.id, error as Error, {
          resource: 'recurring_events',
          operation: 'createRecurringEvent',
          title: input.title,
          pattern: input.recurrenceRule.pattern,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar evento recorrente',
        })
      }
    }),

  // Atualizar evento recorrente
  updateRecurringEvent: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().optional(),
        description: z.string().optional(),
        amount: z.number().optional(),
        typeId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        accountId: z.string().uuid().optional(),
        recurrenceRule: recurrenceRuleSchema.optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isActive: z.boolean().optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input

        // Map the input to database column names
        const dbUpdateData: any = {}
        if (updateData.title !== undefined) dbUpdateData.title = updateData.title
        if (updateData.description !== undefined) dbUpdateData.description = updateData.description
        if (updateData.amount !== undefined) dbUpdateData.amount = updateData.amount
        if (updateData.typeId !== undefined) dbUpdateData.event_type_id = updateData.typeId
        if (updateData.categoryId !== undefined) dbUpdateData.category_id = updateData.categoryId
        if (updateData.accountId !== undefined) dbUpdateData.account_id = updateData.accountId
        if (updateData.recurrenceRule !== undefined)
          dbUpdateData.recurrence_rule = updateData.recurrenceRule
        if (updateData.startDate !== undefined) dbUpdateData.start_date = updateData.startDate
        if (updateData.endDate !== undefined) dbUpdateData.end_date = updateData.endDate
        if (updateData.isActive !== undefined) dbUpdateData.is_active = updateData.isActive
        if (updateData.priority !== undefined) dbUpdateData.priority = updateData.priority
        if (updateData.tags !== undefined) dbUpdateData.tags = updateData.tags
        dbUpdateData.updated_at = new Date().toISOString()

        const { data, error } = await supabase
          .from('recurring_events')
          .update(dbUpdateData)
          .eq('id', id)
          .eq('user_id', ctx.user.id)
          .select(`
            *,
            event_types(id, name, color, icon),
            transaction_categories(id, name, color, icon)
          `)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Evento recorrente não encontrado',
            })
          }
          logError('update_recurring_event', ctx.user.id, error, {
            resource: 'recurring_events',
            operation: 'updateRecurringEvent',
            eventId: input.id,
            updateFields: Object.keys(updateData),
          })
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar evento recorrente',
          })
        }

        logOperation('update_recurring_event_success', ctx.user.id, 'recurring_events', input.id, {
          updateFields: Object.keys(updateData),
        })

        return data
      } catch (error) {
        logError('update_recurring_event_unexpected', ctx.user.id, error as Error, {
          resource: 'recurring_events',
          operation: 'updateRecurringEvent',
          eventId: input.id,
        })
        throw error
      }
    }),

  // Deletar evento recorrente
  deleteRecurringEvent: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('recurring_events')
          .delete()
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .select()
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Evento recorrente não encontrado',
            })
          }
          logError('delete_recurring_event', ctx.user.id, error, {
            resource: 'recurring_events',
            operation: 'deleteRecurringEvent',
            eventId: input.id,
          })
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao deletar evento recorrente',
          })
        }

        logOperation('delete_recurring_event_success', ctx.user.id, 'recurring_events', input.id, {
          deletedEventId: input.id,
        })

        return data
      } catch (error) {
        logError('delete_recurring_event_unexpected', ctx.user.id, error as Error, {
          resource: 'recurring_events',
          operation: 'deleteRecurringEvent',
          eventId: input.id,
        })
        throw error
      }
    }),

  // Gerar eventos a partir de padrões recorrentes
  generateEventsFromRecurring: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        eventId: z.string().uuid().optional(), // Gerar para evento específico ou todos
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const service = createBrazilianRecurringEventsService()
        const startDate = new Date(input.startDate)
        const endDate = new Date(input.endDate)

        if (input.eventId) {
          // Gerar para evento específico
          const { data: recurringEvent, error } = await supabase
            .from('recurring_events')
            .select('*')
            .eq('id', input.eventId)
            .eq('user_id', ctx.user.id)
            .eq('is_active', true)
            .single()

          if (error || !recurringEvent) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Evento recorrente não encontrado',
            })
          }

          const generatedEvents = service.generateRecurringEvents(
            recurringEvent,
            startDate,
            endDate
          )

          // Inserir eventos gerados
          for (const event of generatedEvents) {
            await supabase.from('financial_events').insert({
              title: event.title,
              description: event.description,
              amount: event.amount,
              event_type_id: event.eventTypeId,
              category_id: event.categoryId,
              account_id: event.accountId,
              event_date: event.eventDate,
              priority: event.priority,
              tags: event.tags,
              recurrence_parent_id: event.recurrenceParentId,
              user_id: ctx.user.id,
              created_at: new Date().toISOString(),
            })
          }

          logOperation(
            'generate_events_from_specific_recurring_success',
            ctx.user.id,
            'financial_events',
            undefined,
            {
              recurringEventId: input.eventId,
              startDate: input.startDate,
              endDate: input.endDate,
              generatedEventsCount: generatedEvents.length,
            }
          )

          return { success: true, generatedCount: generatedEvents.length }
        } else {
          // Gerar para todos os eventos recorrentes ativos
          const generatedEvents = await service.generateEventsFromRecurring(
            ctx.user.id,
            startDate,
            endDate
          )

          logOperation(
            'generate_events_from_all_recurring_success',
            ctx.user.id,
            'financial_events',
            undefined,
            {
              startDate: input.startDate,
              endDate: input.endDate,
              generatedEventsCount: generatedEvents.length,
            }
          )

          return { success: true, generatedCount: generatedEvents.length }
        }
      } catch (error) {
        logError('generate_events_from_recurring', ctx.user.id, error as Error, {
          resource: 'recurring_events',
          operation: 'generateEventsFromRecurring',
          eventId: input.eventId,
          startDate: input.startDate,
          endDate: input.endDate,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao gerar eventos a partir de padrões recorrentes',
        })
      }
    }),

  // Obter templates brasileiros de recorrência
  getBrazilianRecurrenceTemplates: protectedProcedure.query(async () => {
    try {
      const service = createBrazilianRecurringEventsService()
      const templates = service.getBrazilianRecurrenceTemplates()

      logOperation(
        'fetch_brazilian_recurrence_templates_success',
        'system',
        'recurring_events',
        undefined,
        {
          templatesCount: templates.length,
        }
      )

      return templates
    } catch (error) {
      logError('fetch_brazilian_recurrence_templates', 'system', error as Error, {
        resource: 'recurring_events',
        operation: 'getBrazilianRecurrenceTemplates',
      })
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar templates brasileiros de recorrência',
      })
    }
  }),

  // Pausar/retomar evento recorrente
  toggleRecurringEvent: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('recurring_events')
          .update({
            is_active: input.isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .select()
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Evento recorrente não encontrado',
            })
          }
          logError('toggle_recurring_event', ctx.user.id, error, {
            resource: 'recurring_events',
            operation: 'toggleRecurringEvent',
            eventId: input.id,
            isActive: input.isActive,
          })
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar evento recorrente',
          })
        }

        logOperation('toggle_recurring_event_success', ctx.user.id, 'recurring_events', input.id, {
          eventId: input.id,
          isActive: input.isActive,
        })

        return data
      } catch (error) {
        logError('toggle_recurring_event_unexpected', ctx.user.id, error as Error, {
          resource: 'recurring_events',
          operation: 'toggleRecurringEvent',
          eventId: input.id,
        })
        throw error
      }
    }),
})
