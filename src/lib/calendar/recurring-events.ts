/**
 * Recurring Events System for Brazilian Financial Calendar
 *
 * Supports recurring patterns for Brazilian financial transactions:
 * - Monthly bills (boletos, utilities)
 * - Bi-weekly payments
 * - Weekly transactions
 * - Custom Brazilian financial patterns
 */

import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  startOfMonth,
  endOfMonth,
  isLastDayOfMonth,
  format,
  parseISO,
  differenceInDays,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/integrations/supabase/client'
import { logger, logOperation, logError } from '@/server/lib/logger'

export type RecurrencePattern =
  | 'daily'
  | 'weekly'
  | 'bi-weekly'
  | 'monthly'
  | 'bi-monthly'
  | 'quarterly'
  | 'semi-annually'
  | 'yearly'
  | 'custom'

export type BrazilianPaymentDay =
  | 'business-day'
  | 'first-business-day'
  | 'last-business-day'
  | 'fixed-day'
  | 'last-day-month'
  | 'closest-business-day'

export interface RecurrenceRule {
  pattern: RecurrencePattern
  interval: number // Interval for the pattern (e.g., every 2 weeks, every 3 months)
  dayOfWeek?: number // 0-6 (Sunday-Saturday) for weekly patterns
  dayOfMonth?: number // 1-31 for monthly patterns
  weekOfMonth?: number // 1-5 (first, second, etc. week of month)
  paymentDay?: BrazilianPaymentDay
  endDate?: string
  maxOccurrences?: number
  skipWeekends?: boolean
  skipHolidays?: boolean
  // Brazilian specific
  considerBrazilianHolidays?: boolean
  moveToNextBusinessDay?: boolean
}

export interface RecurringEvent {
  id: string
  title: string
  description?: string
  amount?: number
  eventTypeId: string
  categoryId?: string
  accountId?: string
  recurrenceRule: RecurrenceRule
  startDate: string
  endDate?: string
  isActive: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  tags: string[]
  userId: string
  created_at: string
  updated_at: string
}

export interface GeneratedEvent {
  title: string
  description?: string
  amount?: number
  eventTypeId: string
  categoryId?: string
  accountId?: string
  eventDate: string
  dueDate?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  tags: string[]
  recurrenceParentId?: string
  userId: string
}

/**
 * Brazilian Financial Recurring Events Service
 */
export class BrazilianRecurringEventsService {
  /**
   * Brazilian holidays calendar (simplified version)
   * In production, this should come from a proper holidays API
   */
  private brazilianHolidays = new Map<string, string>([
    // Fixed holidays
    '01-01', // Ano Novo
    '04-21', // Tiradentes
    '05-01', // Dia do Trabalho
    '09-07', // Independência do Brasil
    '10-12', // Nossa Senhora Aparecida
    '11-02', // Finados
    '11-15', // Proclamação da República
    '12-25', // Natal

    // Variable holidays (simplified - in production calculate properly)
    'carnival', // Carnaval (varies)
    'good-friday', // Sexta-feira Santa (varies)
    'corpus-christi', // Corpus Christi (varies)
  ])

  /**
   * Check if a date is a Brazilian holiday
   */
  private isBrazilianHoliday(date: Date): boolean {
    const monthDay = format(date, 'MM-dd')
    return this.brazilianHolidays.has(monthDay)
  }

  /**
   * Check if a date is a weekend
   */
  private isWeekend(date: Date): boolean {
    const day = date.getDay()
    return day === 0 || day === 6 // Sunday or Saturday
  }

  /**
   * Check if a date is a business day in Brazil
   */
  private isBrazilianBusinessDay(date: Date): boolean {
    return !this.isWeekend(date) && !this.isBrazilianHoliday(date)
  }

  /**
   * Get next business day in Brazil
   */
  private getNextBrazilianBusinessDay(date: Date): Date {
    let nextDay = addDays(date, 1)
    while (!this.isBrazilianBusinessDay(nextDay)) {
      nextDay = addDays(nextDay, 1)
    }
    return nextDay
  }

  /**
   * Get previous business day in Brazil
   */
  private getPreviousBrazilianBusinessDay(date: Date): Date {
    let prevDay = addDays(date, -1)
    while (!this.isBrazilianBusinessDay(prevDay)) {
      prevDay = addDays(prevDay, -1)
    }
    return prevDay
  }

  /**
   * Adjust date based on Brazilian payment day rules
   */
  private adjustForBrazilianPaymentDay(
    date: Date,
    paymentDay: BrazilianPaymentDay,
    fixedDay?: number
  ): Date {
    switch (paymentDay) {
      case 'business-day':
        if (!this.isBrazilianBusinessDay(date)) {
          return this.getNextBrazilianBusinessDay(date)
        }
        return date

      case 'first-business-day':
        const firstDay = startOfMonth(date)
        if (!this.isBrazilianBusinessDay(firstDay)) {
          return this.getNextBrazilianBusinessDay(firstDay)
        }
        return firstDay

      case 'last-business-day':
        const lastDay = endOfMonth(date)
        if (!this.isBrazilianBusinessDay(lastDay)) {
          return this.getPreviousBrazilianBusinessDay(lastDay)
        }
        return lastDay

      case 'fixed-day':
        if (fixedDay) {
          const targetDate = new Date(date.getFullYear(), date.getMonth(), fixedDay)
          // Adjust if the fixed day doesn't exist in this month
          if (targetDate.getMonth() !== date.getMonth()) {
            return endOfMonth(date)
          }
          return targetDate
        }
        return date

      case 'last-day-month':
        return endOfMonth(date)

      case 'closest-business-day':
        if (this.isBrazilianBusinessDay(date)) {
          return date
        }
        // Find closest business day (could be before or after)
        const nextBusiness = this.getNextBrazilianBusinessDay(date)
        const prevBusiness = this.getPreviousBrazilianBusinessDay(date)
        const daysToNext = differenceInDays(nextBusiness, date)
        const daysToPrev = differenceInDays(date, prevBusiness)

        return daysToNext <= daysToPrev ? nextBusiness : prevBusiness

      default:
        return date
    }
  }

  /**
   * Generate next occurrence date based on recurrence rule
   */
  private getNextOccurrence(currentDate: Date, rule: RecurrenceRule, baseDate: Date): Date | null {
    let nextDate: Date

    switch (rule.pattern) {
      case 'daily':
        nextDate = addDays(currentDate, rule.interval)
        break

      case 'weekly':
        nextDate = addWeeks(currentDate, rule.interval)
        if (rule.dayOfWeek !== undefined) {
          const currentDayOfWeek = nextDate.getDay()
          const targetDayOfWeek = rule.dayOfWeek
          const dayDiff = (targetDayOfWeek - currentDayOfWeek + 7) % 7
          nextDate = addDays(nextDate, dayDiff)
        }
        break

      case 'bi-weekly':
        nextDate = addWeeks(currentDate, 2 * rule.interval)
        if (rule.dayOfWeek !== undefined) {
          const currentDayOfWeek = nextDate.getDay()
          const targetDayOfWeek = rule.dayOfWeek
          const dayDiff = (targetDayOfWeek - currentDayOfWeek + 7) % 7
          nextDate = addDays(nextDate, dayDiff)
        }
        break

      case 'monthly':
        nextDate = addMonths(currentDate, rule.interval)
        if (rule.dayOfMonth) {
          const targetDay = Math.min(
            rule.dayOfMonth,
            new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()
          )
          nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), targetDay)
        }
        break

      case 'bi-monthly':
        nextDate = addMonths(currentDate, 2 * rule.interval)
        if (rule.dayOfMonth) {
          const targetDay = Math.min(
            rule.dayOfMonth,
            new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()
          )
          nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), targetDay)
        }
        break

      case 'quarterly':
        nextDate = addMonths(currentDate, 3 * rule.interval)
        if (rule.dayOfMonth) {
          const targetDay = Math.min(
            rule.dayOfMonth,
            new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()
          )
          nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), targetDay)
        }
        break

      case 'semi-annually':
        nextDate = addMonths(currentDate, 6 * rule.interval)
        if (rule.dayOfMonth) {
          const targetDay = Math.min(
            rule.dayOfMonth,
            new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()
          )
          nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), targetDay)
        }
        break

      case 'yearly':
        nextDate = addYears(currentDate, rule.interval)
        if (rule.dayOfMonth) {
          const targetDay = Math.min(
            rule.dayOfMonth,
            new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()
          )
          nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), targetDay)
        }
        break

      case 'custom':
        // Custom patterns would need special handling
        // For now, default to monthly
        nextDate = addMonths(currentDate, rule.interval)
        break

      default:
        return null
    }

    // Apply Brazilian payment day adjustments
    if (rule.paymentDay) {
      nextDate = this.adjustForBrazilianPaymentDay(nextDate, rule.paymentDay, rule.dayOfMonth)
    }

    // Skip weekends if configured
    if (rule.skipWeekends && this.isWeekend(nextDate)) {
      nextDate = this.getNextBrazilianBusinessDay(nextDate)
    }

    // Skip holidays if configured
    if (rule.skipHolidays && this.isBrazilianHoliday(nextDate)) {
      nextDate = this.getNextBrazilianBusinessDay(nextDate)
    }

    // Move to next business day if configured
    if (rule.moveToNextBusinessDay && !this.isBrazilianBusinessDay(nextDate)) {
      nextDate = this.getNextBrazilianBusinessDay(nextDate)
    }

    return nextDate
  }

  /**
   * Generate recurring events for a period
   */
  generateRecurringEvents(
    recurringEvent: RecurringEvent,
    startDate: Date,
    endDate: Date
  ): GeneratedEvent[] {
    const events: GeneratedEvent[] = []
    let currentDate = parseISO(recurringEvent.startDate)
    let occurrenceCount = 0

    // Skip if start date is after generation period
    if (currentDate > endDate) {
      return events
    }

    // Adjust start date to be within generation period
    if (currentDate < startDate) {
      currentDate = startDate
    }

    while (
      currentDate <= endDate &&
      (!recurringEvent.endDate || currentDate <= parseISO(recurringEvent.endDate)) &&
      (!recurringEvent.recurrenceRule.maxOccurrences ||
        occurrenceCount < recurringEvent.recurrenceRule.maxOccurrences)
    ) {
      events.push({
        title: recurringEvent.title,
        description: recurringEvent.description,
        amount: recurringEvent.amount,
        eventTypeId: recurringEvent.eventTypeId,
        categoryId: recurringEvent.categoryId,
        accountId: recurringEvent.accountId,
        eventDate: currentDate.toISOString().split('T')[0],
        priority: recurringEvent.priority,
        tags: recurringEvent.tags,
        recurrenceParentId: recurringEvent.id,
        userId: recurringEvent.userId,
      })

      occurrenceCount++
      currentDate = this.getNextOccurrence(
        currentDate,
        recurringEvent.recurrenceRule,
        parseISO(recurringEvent.startDate)
      )

      if (!currentDate) break
    }

    return events
  }

  /**
   * Create recurring event in database
   */
  async createRecurringEvent(
    recurringEvent: Omit<RecurringEvent, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RecurringEvent> {
    try {
      const { data, error } = await supabase
        .from('recurring_events')
        .insert({
          title: recurringEvent.title,
          description: recurringEvent.description,
          amount: recurringEvent.amount,
          event_type_id: recurringEvent.eventTypeId,
          category_id: recurringEvent.categoryId,
          account_id: recurringEvent.accountId,
          recurrence_rule: recurringEvent.recurrenceRule,
          start_date: recurringEvent.startDate,
          end_date: recurringEvent.endDate,
          is_active: recurringEvent.isActive,
          priority: recurringEvent.priority,
          tags: recurringEvent.tags,
          user_id: recurringEvent.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        logError('create_recurring_event', recurringEvent.userId, error, {
          resource: 'recurring_events',
          operation: 'createRecurringEvent',
          title: recurringEvent.title,
        })
        throw error
      }

      logOperation(
        'create_recurring_event_success',
        recurringEvent.userId,
        'recurring_events',
        data.id,
        {
          title: recurringEvent.title,
          pattern: recurringEvent.recurrenceRule.pattern,
          interval: recurringEvent.recurrenceRule.interval,
        }
      )

      return data
    } catch (error) {
      logError('create_recurring_event_unexpected', recurringEvent.userId, error as Error, {
        resource: 'recurring_events',
        operation: 'createRecurringEvent',
        title: recurringEvent.title,
      })
      throw error
    }
  }

  /**
   * Generate and create events from recurring patterns
   */
  async generateEventsFromRecurring(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<GeneratedEvent[]> {
    try {
      // Get active recurring events for user
      const { data: recurringEvents, error } = await supabase
        .from('recurring_events')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .lte('start_date', endDate.toISOString().split('T')[0])

      if (error) {
        logError('fetch_recurring_events', userId, error, {
          resource: 'recurring_events',
          operation: 'generateEventsFromRecurring',
        })
        throw error
      }

      const allGeneratedEvents: GeneratedEvent[] = []

      for (const recurringEvent of recurringEvents || []) {
        const generatedEvents = this.generateRecurringEvents(recurringEvent, startDate, endDate)

        // Insert generated events into database
        for (const event of generatedEvents) {
          try {
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
              user_id: event.userId,
              created_at: new Date().toISOString(),
            })
          } catch (insertError) {
            // Log error but continue with other events
            logError('insert_generated_event', userId, insertError as Error, {
              resource: 'financial_events',
              operation: 'insertGeneratedEvent',
              eventTitle: event.title,
              eventDate: event.eventDate,
            })
          }
        }

        allGeneratedEvents.push(...generatedEvents)
      }

      logOperation(
        'generate_events_from_recurring_success',
        userId,
        'financial_events',
        undefined,
        {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          recurringEventsCount: recurringEvents?.length || 0,
          generatedEventsCount: allGeneratedEvents.length,
        }
      )

      return allGeneratedEvents
    } catch (error) {
      logError('generate_events_from_recurring_error', userId, error as Error, {
        resource: 'recurring_events',
        operation: 'generateEventsFromRecurring',
      })
      throw error
    }
  }

  /**
   * Get Brazilian financial recurrence templates
   */
  getBrazilianRecurrenceTemplates(): Array<{
    name: string
    description: string
    rule: RecurrenceRule
    eventTypeIds: string[]
  }> {
    return [
      {
        name: 'Aluguel Mensal',
        description: 'Pagamento de aluguel no dia útil de cada mês',
        rule: {
          pattern: 'monthly',
          interval: 1,
          dayOfMonth: 1,
          paymentDay: 'first-business-day',
          skipWeekends: true,
          considerBrazilianHolidays: true,
        },
        eventTypeIds: ['rent-payment'],
      },
      {
        name: 'Salário',
        description: 'Recebimento de salário no último dia útil do mês',
        rule: {
          pattern: 'monthly',
          interval: 1,
          paymentDay: 'last-business-day',
          skipWeekends: true,
          considerBrazilianHolidays: true,
        },
        eventTypeIds: ['salary'],
      },
      {
        name: 'Contas de Luz/Água',
        description: 'Contas de utilidade pública com vencimento fixo',
        rule: {
          pattern: 'monthly',
          interval: 1,
          dayOfMonth: 10,
          paymentDay: 'closest-business-day',
          moveToNextBusinessDay: true,
        },
        eventTypeIds: ['utility-bill'],
      },
      {
        name: 'Fatura Cartão Crédito',
        description: 'Fatura de cartão de crédito',
        rule: {
          pattern: 'monthly',
          interval: 1,
          dayOfMonth: 15,
          paymentDay: 'closest-business-day',
        },
        eventTypeIds: ['credit-card-bill'],
      },
      {
        name: 'Assinatura Streaming',
        description: 'Assinaturas mensais de serviços',
        rule: {
          pattern: 'monthly',
          interval: 1,
          dayOfMonth: 1,
          paymentDay: 'business-day',
        },
        eventTypeIds: ['subscription'],
      },
      {
        name: 'Imposto de Renda',
        description: 'Parcelas de imposto de renda',
        rule: {
          pattern: 'monthly',
          interval: 1,
          dayOfMonth: 30,
          paymentDay: 'last-business-day',
          skipWeekends: true,
          considerBrazilianHolidays: true,
        },
        eventTypeIds: ['income-tax'],
      },
      {
        name: 'Investimento Mensal',
        description: 'Aporte mensal em investimentos',
        rule: {
          pattern: 'monthly',
          interval: 1,
          dayOfMonth: 5,
          paymentDay: 'business-day',
        },
        eventTypeIds: ['savings-goal', 'fixed-income'],
      },
      {
        name: 'Condomínio',
        description: 'Taxa de condomínio',
        rule: {
          pattern: 'monthly',
          interval: 1,
          dayOfMonth: 10,
          paymentDay: 'closest-business-day',
        },
        eventTypeIds: ['condominium'],
      },
    ]
  }
}

/**
 * Create Brazilian recurring events service instance
 */
export function createBrazilianRecurringEventsService(): BrazilianRecurringEventsService {
  return new BrazilianRecurringEventsService()
}
