/**
 * useFinancialEvents Hook
 * Hook para gerenciar eventos financeiros no Supabase
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { FinancialEvent } from '@/types/financial-events'
import { startOfMonth, endOfMonth } from 'date-fns'

interface FinancialEventRow {
  id: string
  user_id: string
  bank_account_id: string | null
  title: string
  description: string | null
  amount: number
  category: string | null
  event_type: 'income' | 'expense' | 'bill' | 'scheduled' | 'transfer'
  status: 'pending' | 'paid' | 'scheduled' | 'cancelled'
  start_date: string
  end_date: string
  all_day: boolean
  color: 'emerald' | 'rose' | 'orange' | 'blue' | 'violet'
  icon: string | null
  is_recurring: boolean
  recurrence_rule: string | null
  parent_event_id: string | null
  location: string | null
  notes: string | null
  transaction_id: string | null
  bill_id: string | null
  pix_transaction_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Convert database row to FinancialEvent
 */
function rowToEvent(row: FinancialEventRow): FinancialEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    start: new Date(row.start_date),
    end: new Date(row.end_date),
    type: row.event_type,
    amount: Number(row.amount),
    color: row.color,
    icon: row.icon || undefined,
    status: row.status,
    category: row.category || undefined,
    account: row.bank_account_id || undefined,
    location: row.location || undefined,
    recurring: row.is_recurring,
    allDay: row.all_day,
  }
}

/**
 * Convert FinancialEvent to database row
 */
function eventToRow(event: Partial<FinancialEvent>, userId: string): Partial<FinancialEventRow> {
  return {
    user_id: userId,
    title: event.title,
    description: event.description || null,
    amount: event.amount,
    category: event.category || null,
    event_type: event.type!,
    status: event.status!,
    start_date: event.start?.toISOString(),
    end_date: event.end?.toISOString(),
    all_day: event.allDay || false,
    color: event.color!,
    icon: event.icon || null,
    is_recurring: event.recurring || false,
    location: event.location || null,
  }
}

/**
 * Hook para buscar eventos financeiros
 */
export function useFinancialEvents(startDate?: Date, endDate?: Date) {
  const [events, setEvents] = useState<FinancialEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [startDate, endDate])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if user is authenticated first
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.info('User not authenticated - using mock data')
        setEvents([])
        return
      }

      let query = supabase
        .from('financial_events')
        .select('*')
        .order('start_date', { ascending: true })

      // Filter by date range if provided
      if (startDate) {
        query = query.gte('start_date', startDate.toISOString())
      }
      if (endDate) {
        query = query.lte('end_date', endDate.toISOString())
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        console.warn('Supabase query failed, falling back to mock data:', fetchError)
        setEvents([])
        return
      }

      const mappedEvents = (data || []).map(rowToEvent)
      setEvents(mappedEvents)
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching financial events:', err)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  return { events, loading, error, refetch: fetchEvents }
}

/**
 * Hook para buscar eventos de um mês específico
 */
export function useMonthlyFinancialEvents(date: Date = new Date()) {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  return useFinancialEvents(monthStart, monthEnd)
}

/**
 * Hook para mutações de eventos
 */
export function useFinancialEventMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const addEvent = async (event: Omit<FinancialEvent, 'id'>) => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const eventData = eventToRow(event, user.id)

      const { data, error: insertError } = await supabase
        .from('financial_events')
        .insert([eventData])
        .select()
        .single()

      if (insertError) throw insertError

      return rowToEvent(data as FinancialEventRow)
    } catch (err) {
      setError(err as Error)
      console.error('Error adding financial event:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateEvent = async (id: string, updates: Partial<FinancialEvent>) => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const eventData = eventToRow(updates, user.id)

      const { data, error: updateError } = await supabase
        .from('financial_events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      return rowToEvent(data as FinancialEventRow)
    } catch (err) {
      setError(err as Error)
      console.error('Error updating financial event:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('financial_events')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
    } catch (err) {
      setError(err as Error)
      console.error('Error deleting financial event:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { addEvent, updateEvent, deleteEvent, loading, error }
}

/**
 * Hook para real-time subscriptions
 */
export function useFinancialEventsRealtime(onEventChange?: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel('financial_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_events',
        },
        (payload) => {
          console.log('Financial event changed:', payload)
          if (onEventChange) {
            onEventChange()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onEventChange])
}
