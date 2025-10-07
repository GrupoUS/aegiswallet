import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { supabase } from '@/integrations/supabase/client'
import { protectedProcedure, router } from '../trpc-helpers'

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
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching event types:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar tipos de eventos',
        })
      }

      return data || []
    } catch (error) {
      console.error('Event types fetch error:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar tipos de eventos',
      })
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
          .order('event_date', { ascending: true })

        if (input.typeId) {
          query = query.eq('event_type_id', input.typeId)
        }
        if (input.isCompleted !== undefined) {
          query = query.eq('is_completed', input.isCompleted)
        }
        if (input.categoryId) {
          query = query.eq('category_id', input.categoryId)
        }

        const { data, error } = await query

        if (error) {
          console.error('Error fetching financial events:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar eventos financeiros',
          })
        }

        return data || []
      } catch (error) {
        console.error('Financial events fetch error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar eventos financeiros',
        })
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
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Evento financeiro não encontrado',
            })
          }
          console.error('Error fetching financial event:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar evento financeiro',
          })
        }

        return data
      } catch (error) {
        console.error('Financial event fetch error:', error)
        throw error
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
          .single()

        if (error) {
          console.error('Error creating financial event:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao criar evento financeiro',
          })
        }

        return data
      } catch (error) {
        console.error('Financial event creation error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar evento financeiro',
        })
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
        const { id, ...updateData } = input

        // Map the input to database column names (only use columns that exist)
        const dbUpdateData: any = {}
        if (updateData.typeId !== undefined) dbUpdateData.event_type_id = updateData.typeId
        if (updateData.title !== undefined) dbUpdateData.title = updateData.title
        if (updateData.description !== undefined) dbUpdateData.description = updateData.description
        if (updateData.amount !== undefined) dbUpdateData.amount = updateData.amount
        if (updateData.eventDate !== undefined) dbUpdateData.event_date = updateData.eventDate
        if (updateData.isCompleted !== undefined) {
          dbUpdateData.is_completed = updateData.isCompleted
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
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Evento financeiro não encontrado',
            })
          }
          console.error('Error updating financial event:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar evento financeiro',
          })
        }

        return data
      } catch (error) {
        console.error('Financial event update error:', error)
        throw error
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
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Evento financeiro não encontrado',
            })
          }
          console.error('Error deleting financial event:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao deletar evento financeiro',
          })
        }

        return data
      } catch (error) {
        console.error('Financial event deletion error:', error)
        throw error
      }
    }),

  // Obter eventos próximos (próximos 30 dias)
  getUpcomingEvents: protectedProcedure.query(async ({ ctx }) => {
    try {
      const today = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(today.getDate() + 30)

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
        .limit(10)

      if (error) {
        console.error('Error fetching upcoming events:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar próximos eventos',
        })
      }

      return data || []
    } catch (error) {
      console.error('Upcoming events fetch error:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar próximos eventos',
      })
    }
  }),

  // Obter eventos atrasados
  getOverdueEvents: protectedProcedure.query(async ({ ctx }) => {
    try {
      const today = new Date()

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
        .order('due_date', { ascending: true })

      if (error) {
        console.error('Error fetching overdue events:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar eventos atrasados',
        })
      }

      return data || []
    } catch (error) {
      console.error('Overdue events fetch error:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar eventos atrasados',
      })
    }
  }),

  // Criar lembrete para evento (placeholder implementation)
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
          .select('id')
          .eq('id', input.eventId)
          .eq('user_id', ctx.user.id)
          .single()

        if (eventError || !event) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Evento financeiro não encontrado',
          })
        }

        // For now, just return a placeholder response
        // TODO: Implement actual reminder functionality when event_reminders table is available
        return {
          id: crypto.randomUUID(),
          event_id: input.eventId,
          remind_at: input.remindAt,
          reminder_type: input.reminderType,
          message: input.message,
          is_sent: false,
          created_at: new Date().toISOString(),
        }
      } catch (error) {
        console.error('Event reminder creation error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar lembrete',
        })
      }
    }),

  // Marcar lembrete como enviado (placeholder implementation)
  markReminderSent: protectedProcedure
    .input(z.object({ reminderId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        // For now, just return a placeholder response
        // TODO: Implement actual reminder functionality when event_reminders table is available
        return {
          id: input.reminderId,
          is_sent: true,
          sent_at: new Date().toISOString(),
        }
      } catch (error) {
        console.error('Reminder sent mark error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao marcar lembrete como enviado',
        })
      }
    }),
})
