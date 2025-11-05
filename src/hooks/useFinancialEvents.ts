/**
 * useFinancialEvents Hook
 * Hook para gerenciar eventos financeiros no Supabase
 */

import { endOfMonth, startOfMonth } from 'date-fns'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { FinancialEvent } from '@/types/financial-events'

interface FinancialEventRow {
  id: string
  user_id: string
  event_type_id: string | null
  title: string
  description: string | null
  amount: number | null
  is_income: boolean
  account_id: string | null
  category_id: string | null
  event_date: string
  due_date: string | null
  is_recurring: boolean
  recurrence_rule: string | null
  is_completed: boolean
  completed_at: string | null
  transaction_id: string | null
  priority: string
  tags: string[] | null
  attachments: string[] | null
  created_at: string
  updated_at: string
}

/**
 * Convert database row to FinancialEvent
 */
function rowToEvent(row: FinancialEventRow): FinancialEvent {
  const eventDate = new Date(row.event_date)
  const dueDate = row.due_date ? new Date(row.due_date) : eventDate

  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    start: eventDate,
    end: dueDate,
    type: row.is_income ? 'income' : 'expense',
    amount: Number(row.amount || 0),
    color: 'emerald', // Default color - can be enhanced based on event_type_id later
    icon: undefined, // Can be enhanced based on event_type_id later
    status: row.is_completed ? 'completed' : 'pending',
    category: undefined, // Can be enhanced based on category_id later
    account: row.account_id || undefined,
    location: undefined,
    recurring: row.is_recurring,
    allDay: true, // Financial events are typically all-day
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
    is_income: event.type === 'income',
    event_date: event.start?.toISOString().split('T')[0], // Use only the date part
    due_date: event.end?.toISOString().split('T')[0],
    is_recurring: event.recurring || false,
    is_completed: event.status === 'completed',
    completed_at: event.status === 'completed' ? new Date().toISOString() : null,
    priority: 'normal', // Default priority
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
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        console.info('User not authenticated - using mock data')
        setEvents([])
        return
      }

      let query = supabase
        .from('financial_events')
        .select('*')
        .order('event_date', { ascending: true })

      // Filter by date range if provided
      if (startDate) {
        query = query.gte('event_date', startDate.toISOString().split('T')[0])
      }
      if (endDate) {
        query = query.lte('event_date', endDate.toISOString().split('T')[0])
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        console.warn('Supabase query failed, falling back to mock data:', fetchError)
        setEvents([])
        return
      }

      const mappedEvents = (data || []).map((row: any) => rowToEvent(row as FinancialEventRow))
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
        .insert(eventData)
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

      const { error: deleteError } = await supabase.from('financial_events').delete().eq('id', id)

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
