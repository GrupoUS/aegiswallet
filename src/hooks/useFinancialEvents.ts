/**
 * useFinancialEvents Hook
 * Hook para gerenciar eventos financeiros no Supabase
 */

import { endOfMonth, startOfMonth } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/database.types';
import type { FinancialEvent } from '@/types/financial-events';

type FinancialEventRow = Database['public']['Tables']['financial_events']['Row'];
type FinancialEventInsert = Database['public']['Tables']['financial_events']['Insert'];

/**
 * Convert database row to FinancialEvent
 */
function rowToEvent(row: FinancialEventRow): FinancialEvent {
  const eventDate = new Date(row.event_date);
  const dueDate = row.due_date ? new Date(row.due_date) : eventDate;

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    start: eventDate,
    end: dueDate,
    type: row.is_income ? 'income' : 'expense',
    amount: row.amount ?? 0,
    color: 'emerald',
    icon: undefined,
    status: row.is_completed ? 'completed' : 'pending',
    category: row.category_id ?? undefined,
    account: row.account_id ?? undefined,
    location: undefined,
    recurring: row.is_recurring,
    allDay: true,
  };
}

/**
 * Convert FinancialEvent to database row
 */
function eventToRow(event: Partial<FinancialEvent>, userId: string): FinancialEventInsert {
  const startDate = event.start ?? new Date();

  return {
    user_id: userId,
    event_type_id: null,
    title: event.title ?? '',
    description: event.description ?? null,
    amount: event.amount ?? 0,
    is_income: event.type === 'income',
    account_id: null,
    category_id: null,
    event_date: startDate.toISOString().split('T')[0],
    due_date: event.end ? event.end.toISOString().split('T')[0] : null,
    is_recurring: event.recurring ?? false,
    recurrence_rule: null,
    priority: 'medium',
    is_completed: event.status === 'completed' || event.status === 'paid',
    completed_at:
      event.status === 'completed' || event.status === 'paid' ? new Date().toISOString() : null,
    transaction_id: null,
    tags: null,
    attachments: null,
  };
}

/**
 * Hook para buscar eventos financeiros
 */
export function useFinancialEvents(startDate?: Date, endDate?: Date) {
  const [events, setEvents] = useState<FinancialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated first
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setEvents([]);
        return;
      }

      let query = supabase
        .from('financial_events')
        .select('*')
        .order('event_date', { ascending: true });

      // Filter by date range if provided
      if (startDate) {
        query = query.gte('event_date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        query = query.lte('event_date', endDate.toISOString().split('T')[0]);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setEvents([]);
        return;
      }

      const mappedEvents = (data || []).map((row: any) => rowToEvent(row as FinancialEventRow));
      setEvents(mappedEvents);
    } catch (err) {
      setError(err as Error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}

/**
 * Hook para buscar eventos de um mês específico
 */
export function useMonthlyFinancialEvents(date: Date = new Date()) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  return useFinancialEvents(monthStart, monthEnd);
}

/**
 * Hook para mutações de eventos
 */
export function useFinancialEventMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addEvent = async (event: Omit<FinancialEvent, 'id'>) => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const eventData = eventToRow(event, user.id);

      const { data, error: insertError } = await supabase
        .from('financial_events')
        .insert(eventData)
        .select()
        .single();

      if (insertError) throw insertError;

      return rowToEvent(data as FinancialEventRow);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (id: string, updates: Partial<FinancialEvent>) => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const eventData = eventToRow(updates, user.id);

      const { data, error: updateError } = await supabase
        .from('financial_events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return rowToEvent(data as FinancialEventRow);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase.from('financial_events').delete().eq('id', id);

      if (deleteError) throw deleteError;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addEvent, updateEvent, deleteEvent, loading, error };
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
        (_payload) => {
          if (onEventChange) {
            onEventChange();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onEventChange]);
}
