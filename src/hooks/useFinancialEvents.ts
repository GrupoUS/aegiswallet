/**
 * Hook completo para gerenciamento de eventos financeiros (Contas a Pagar e Receber)
 * Implementa CRUD, filtragem, ordenação, real-time subscriptions e cache local
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/database.types';
import type {
  EventColor,
  EventStatus,
  FinancialEvent,
  FinancialEventType,
} from '@/types/financial-events';

// Tipos baseados no schema do banco de dados
type FinancialEventRow = Database['public']['Tables']['financial_events']['Row'];
type FinancialEventInsert = Database['public']['Tables']['financial_events']['Insert'];

// Erros específicos
export class FinancialError extends Error {
  constructor(
    message: string,
    public type: 'NETWORK' | 'AUTH' | 'VALIDATION' | 'UNKNOWN'
  ) {
    super(message);
    this.name = 'FinancialError';
  }
}

// Interface para filtros avançados
export interface FinancialEventsFilters {
  status?: EventStatus | 'all';
  type?: FinancialEventType | 'all';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  isRecurring?: boolean;
  minAmount?: number;
  maxAmount?: number;
}

// Interface para paginação
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: 'due_date' | 'created_at' | 'amount' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// Interface para cache local
interface CacheEntry {
  data: FinancialEvent[];
  timestamp: number;
  filters: FinancialEventsFilters;
  pagination: PaginationOptions;
  totalCount: number;
}

// Configurações de cache
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const MAX_CACHE_SIZE = 50; // Máximo de entradas no cache

/**
 * Converte linha do banco para FinancialEvent
 */
function rowToEvent(row: FinancialEventRow): FinancialEvent {
  const startDate = row.start_date ? new Date(row.start_date) : new Date();
  const endDate = row.end_date ? new Date(row.end_date) : startDate;
  // Fallback logic for type and status if necessary, using the values from the row
  const type: FinancialEventType =
    (row.event_type as FinancialEventType) || (row.is_income ? 'income' : 'expense');
  const status: EventStatus = (row.status as EventStatus) || 'pending';

  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    start: startDate,
    end: endDate,
    type,
    amount: row.amount,
    color: (row.color as EventColor) || ((type === 'income' ? 'emerald' : 'rose') as EventColor),
    icon: row.icon || undefined,
    status,
    category: row.category || undefined,
    account: undefined, // Não existe na tabela diretamente mas poderia vir de join
    location: row.location || undefined,
    recurring: row.is_recurring || false,
    allDay: row.all_day || false,
  };
}

/**
 * Converte FinancialEvent para formato do banco
 */
function eventToRow(event: Omit<FinancialEvent, 'id'>, userId: string): FinancialEventInsert {
  const startDate = event.start || new Date();
  const type = event.type === 'income' ? 'income' : event.type || 'expense';

  return {
    user_id: userId,
    title: event.title || '',
    description: event.description || null,
    amount: event.amount ?? 0,
    start_date: startDate.toISOString(), // Supabase handles timestamp with TZ
    end_date: (event.end || startDate).toISOString(),
    event_type: type,
    is_income: type === 'income',
    category: event.category || null,
    location: event.location || null,
    is_recurring: event.recurring || false,
    all_day: event.allDay || false,
    status: (event.status as EventStatus) || 'pending',
    updated_at: new Date().toISOString(),
    color: event.color || 'blue',
  };
}

/**
 * Hook principal para gerenciamento de eventos financeiros
 */
export function useFinancialEvents(
  initialFilters: FinancialEventsFilters = {},
  initialPagination: PaginationOptions = {
    limit: 20,
    page: 1,
    sortBy: 'due_date',
    sortOrder: 'asc',
  }
) {
  const { user } = useAuth();
  // Estados
  const [events, setEvents] = useState<FinancialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FinancialError | null>(null);
  const [filters, setFilters] = useState<FinancialEventsFilters>(initialFilters);
  const [pagination, setPagination] = useState<PaginationOptions>(initialPagination);
  const [totalCount, setTotalCount] = useState(0);
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());

  // Gerar chave de cache baseada nos filtros e paginação e usuário
  const cacheKey = useMemo(() => {
    return JSON.stringify({ filters, pagination, userId: user?.id });
  }, [filters, pagination, user?.id]);

  // Limpar cache público
  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  // Clear cache when user changes
  useEffect(() => {
    clearCache();
  }, [clearCache]);

  // Verificar se há cache válido
  const getCachedData = useCallback((): { data: FinancialEvent[]; count: number } | null => {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { count: cached.totalCount, data: cached.data };
    }
    return null;
  }, [cache, cacheKey]);

  // Salvar dados no cache
  const setCachedData = useCallback(
    (data: FinancialEvent[], count: number) => {
      const newCache = new Map(cache);

      // Limitar tamanho do cache
      if (newCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = newCache.keys().next().value;
        if (oldestKey) {
          newCache.delete(oldestKey);
        }
      }

      newCache.set(cacheKey, {
        data,
        filters,
        pagination,
        timestamp: Date.now(),
        totalCount: count,
      });

      setCache(newCache);
    },
    [cache, cacheKey, filters, pagination]
  );

  // Construir query com filtros e paginação
  const buildQuery = useCallback(() => {
    let query = supabase.from('financial_events').select('*', { count: 'exact' });

    if (user?.id) {
      query = query.eq('user_id', user.id);
    }

    // Aplicar filtros
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.type && filters.type !== 'all') {
      if (filters.type === 'income') {
        query = query.eq('is_income', true);
      } else if (filters.type === 'expense') {
        query = query.eq('is_income', false); // Covers expense, bill, transfer usually
      } else {
        query = query.eq('event_type', filters.type);
      }
    }

    if (filters.categoryId) {
      query = query.eq('category', filters.categoryId); // Assuming category column stores ID or name matches
    }

    if (filters.startDate) {
      query = query.gte('start_date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('start_date', filters.endDate);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.isRecurring !== undefined) {
      query = query.eq('is_recurring', filters.isRecurring);
    }

    if (filters.minAmount !== undefined) {
      query = query.gte('amount', filters.minAmount);
    }

    if (filters.maxAmount !== undefined) {
      query = query.lte('amount', filters.maxAmount);
    }

    // Aplicar ordenação
    // Looking at schema, there is due_date column (nullable) and end_date (not null).
    // If we sort by due date, we should use due_date if popualted? Schema says `due_date` exists.
    // Let's stick to types. `due_date` exists.
    const actualSortField =
      pagination.sortBy === 'due_date' ? 'due_date' : pagination.sortBy || 'start_date';

    // Safe fallback if due_date is null for sorting? Maybe coalesce? Supabase sort handles nulls.
    const sortOrder = pagination.sortOrder || 'asc';
    query = query.order(actualSortField, { ascending: sortOrder === 'asc' });

    // Aplicar paginação
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.range(offset, offset + pagination.limit - 1);

    return query;
  }, [filters, pagination, user?.id]);

  // Buscar dados do servidor
  const fetchEvents = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Verificar cache primeiro
      const cached = getCachedData();
      if (cached) {
        setEvents(cached.data);
        setTotalCount(cached.count);
        setLoading(false);
        return;
      }

      // Executar query
      const query = buildQuery();
      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        throw new FinancialError(fetchError.message, 'NETWORK');
      }

      const eventRows: FinancialEventRow[] = (data || []) as FinancialEventRow[];
      const mappedEvents = eventRows.map(rowToEvent);

      setEvents(mappedEvents);
      setTotalCount(count || 0);
      setCachedData(mappedEvents, count || 0);
    } catch (err) {
      const error =
        err instanceof FinancialError ? err : new FinancialError((err as Error).message, 'UNKNOWN');
      setError(error);
      toast.error('Erro ao carregar eventos financeiros', {
        description: error.message,
      });
      setEvents([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [buildQuery, getCachedData, setCachedData, user]);

  // Efeito para buscar dados quando filtros ou paginação mudam
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Configurar real-time subscription
  useEffect(() => {
    if (!user) {
      return;
    }

    const channel = supabase
      .channel(`financial_events_changes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          filter: `user_id=eq.${user.id}`,
          schema: 'public',
          table: 'financial_events',
        },
        (payload) => {
          // Invalidar cache e refazer busca (debounce could be added here but for simplicity calling directly)
          clearCache();
          fetchEvents();

          // Mostrar notificação para mudanças relevantes
          if (payload.eventType === 'INSERT') {
            const newEvent = rowToEvent(payload.new as FinancialEventRow);
            toast.success('Novo evento financeiro adicionado', {
              description: `${newEvent.title} - R$ ${Math.abs(newEvent.amount).toFixed(2)}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedEvent = rowToEvent(payload.new as FinancialEventRow);
            const oldStatus = (payload.old as Partial<FinancialEventRow>)?.status;
            if (updatedEvent.status === 'paid' && oldStatus !== 'paid') {
              toast.success('Evento marcado como pago', {
                description: `${updatedEvent.title} - R$ ${Math.abs(updatedEvent.amount).toFixed(2)}`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents, clearCache, user]);

  // Mutations
  const createEvent = useCallback(
    async (event: Omit<FinancialEvent, 'id'>) => {
      try {
        if (!user) {
          throw new FinancialError('Usuário não autenticado', 'AUTH');
        }

        const baseRow = eventToRow(event, user.id);
        // Ensure we don't send undefined/null for required fields if any logic missed it
        const eventData: FinancialEventInsert = {
          ...baseRow,
          user_id: user.id,
          created_at: new Date().toISOString(),
          amount: event.amount ?? baseRow.amount,
          title: event.title || baseRow.title || 'Novo Evento',
        };

        const { data, error } = await supabase
          .from('financial_events')
          .insert(eventData)
          .select()
          .single();

        if (error) {
          const errorMessage =
            typeof error === 'object' && error.message ? error.message : 'Erro ao criar evento';
          throw new FinancialError(errorMessage, 'NETWORK');
        }

        // Invalidar cache
        clearCache();
        fetchEvents();

        const newEvent = rowToEvent(data as FinancialEventRow);
        toast.success('Evento financeiro criado com sucesso!', {
          description: `${newEvent.title} - R$ ${Math.abs(newEvent.amount).toFixed(2)}`,
        });

        return newEvent;
      } catch (error) {
        const err =
          error instanceof FinancialError
            ? error
            : new FinancialError(
                error instanceof Error ? error.message : 'Erro ao atualizar evento',
                'UNKNOWN'
              );
        toast.error('Erro ao criar evento financeiro', {
          description: err.message,
        });
        throw err;
      }
    },
    [clearCache, fetchEvents, user]
  );

  const updateEvent = useCallback(
    async (id: string, updates: Partial<FinancialEvent>) => {
      try {
        if (!user) {
          throw new FinancialError('Usuário não autenticado', 'AUTH');
        }

        // Mapear updates para colunas do DB
        const updatePayload: Partial<FinancialEventInsert> = {
          updated_at: new Date().toISOString(),
        };

        if (updates.title !== undefined) {
          updatePayload.title = updates.title;
        }
        if (updates.description !== undefined) {
          updatePayload.description = updates.description;
        }
        if (updates.amount !== undefined) {
          updatePayload.amount = updates.amount;
        }
        if (updates.start !== undefined) {
          updatePayload.start_date = updates.start.toISOString();
        }
        if (updates.end !== undefined) {
          updatePayload.end_date = updates.end.toISOString();
        }
        if (updates.type !== undefined) {
          updatePayload.event_type = updates.type;
          updatePayload.is_income = updates.type === 'income';
        }
        if (updates.category !== undefined) {
          updatePayload.category = updates.category;
        }
        if (updates.recurring !== undefined) {
          updatePayload.is_recurring = updates.recurring;
        }
        if (updates.status !== undefined) {
          updatePayload.status = updates.status;
        }
        if (updates.color !== undefined) {
          updatePayload.color = updates.color;
        }
        if (updates.icon !== undefined) {
          updatePayload.icon = updates.icon;
        }
        if (updates.location !== undefined) {
          updatePayload.location = updates.location;
        }

        const { data, error } = await supabase
          .from('financial_events')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw new FinancialError(error.message, 'NETWORK');
        }

        // Invalidar cache
        clearCache();
        fetchEvents();

        const updatedEvent = rowToEvent(data as FinancialEventRow);
        toast.success('Evento atualizado com sucesso!');

        return updatedEvent;
      } catch (error) {
        const err =
          error instanceof FinancialError
            ? error
            : new FinancialError((error as Error).message, 'UNKNOWN');
        toast.error('Erro ao atualizar evento financeiro', {
          description: err.message,
        });
        throw err;
      }
    },
    [clearCache, fetchEvents, user]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      try {
        if (!user) {
          throw new FinancialError('Usuário não autenticado', 'AUTH');
        }

        const { error } = await supabase.from('financial_events').delete().eq('id', id);

        if (error) {
          throw new FinancialError(error.message, 'NETWORK');
        }

        // Invalidar cache
        clearCache();
        fetchEvents();

        toast.success('Evento financeiro removido com sucesso!');
      } catch (error) {
        const err =
          error instanceof FinancialError
            ? error
            : new FinancialError((error as Error).message, 'UNKNOWN');
        toast.error('Erro ao remover evento financeiro', {
          description: err.message,
        });
        throw err;
      }
    },
    [clearCache, fetchEvents, user]
  );

  const markAsPaid = useCallback(
    async (id: string) => {
      return updateEvent(id, { status: 'paid' });
    },
    [updateEvent]
  );

  const duplicateEvent = useCallback(
    async (id: string) => {
      try {
        const { data, error } = await supabase
          .from('financial_events')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw new FinancialError(error.message, 'NETWORK');
        }

        const originalEvent = rowToEvent(data as FinancialEventRow);
        const newEventData: Omit<FinancialEvent, 'id'> = {
          ...originalEvent,
          title: `${originalEvent.title} (Cópia)`,
          start: new Date(),
          end: new Date(),
          status: 'pending',
        };

        return createEvent(newEventData);
      } catch (error) {
        const err =
          error instanceof FinancialError
            ? error
            : new FinancialError((error as Error).message, 'UNKNOWN');
        toast.error('Erro ao duplicar evento', {
          description: err.message,
        });
        throw err;
      }
    },
    [createEvent]
  );

  const exportEvents = useCallback(
    (format: 'csv' | 'json') => {
      if (!events.length) {
        toast.warning('Nenhum evento para exportar');
        return;
      }

      const dataStr =
        format === 'json'
          ? `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(events, null, 2))}`
          : `data:text/csv;charset=utf-8,${encodeURIComponent(
              ['ID,Title,Amount,Date,Status,Type']
                .concat(
                  events.map(
                    (e) =>
                      `${e.id},"${e.title}",${e.amount},${e.start.toISOString()},${e.status},${e.type}`
                  )
                )
                .join('\n')
            )}`;

      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute(
        'download',
        `financial_events_${new Date().toISOString()}.${format}`
      );
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    },
    [events]
  );

  // Ações de filtros e paginação
  const updateFilters = useCallback((newFilters: Partial<FinancialEventsFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Resetar para primeira página
  }, []);

  const updatePagination = useCallback((newPagination: Partial<PaginationOptions>) => {
    setPagination((prev) => ({ ...prev, ...newPagination }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setPagination(initialPagination);
  }, [initialFilters, initialPagination]);

  // Utilitários
  const refetch = useCallback(() => {
    clearCache();
    fetchEvents();
  }, [fetchEvents, clearCache]);

  // Estatísticas calculadas
  const statistics = useMemo(() => {
    const totalIncome = events
      .filter((e) => e.type === 'income' && e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpenses = events
      .filter((e) => e.type !== 'income' && e.status === 'paid')
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    const pendingIncome = events
      .filter((e) => e.type === 'income' && e.status === 'pending')
      .reduce((sum, e) => sum + e.amount, 0);

    const pendingExpenses = events
      .filter((e) => e.type !== 'income' && e.status === 'pending')
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    const overdueCount = events.filter((e) => {
      const dueDate = new Date(e.end);
      const today = new Date();
      return e.status === 'pending' && dueDate < today;
    }).length;

    return {
      netBalance: totalIncome - totalExpenses,
      overdueCount,
      pendingExpenses,
      pendingIncome,
      totalEvents: totalCount,
      totalExpenses,
      totalIncome,
    };
  }, [events, totalCount]);

  return {
    // Dados
    events,
    totalCount,
    statistics,

    // Estados
    loading,
    error,

    // Ações
    createEvent,
    updateEvent,
    deleteEvent,
    markAsPaid,
    duplicateEvent,
    exportEvents,
    refetch,
    clearCache,

    // Controles
    filters,
    pagination,
    updateFilters,
    updatePagination,
    resetFilters,
  };
}

/**
 * Hook para obter um evento financeiro específico
 */
export function useFinancialEvent(id: string) {
  const [event, setEvent] = useState<FinancialEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setEvent(null);
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('financial_events')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        setEvent(rowToEvent(data as FinancialEventRow));
      } catch (err) {
        setError(err as Error);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  return { error, event, loading };
}

/**
 * Hook para eventos vencidos
 */
export function useOverdueEvents() {
  const [events, setEvents] = useState<FinancialEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverdueEvents = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('financial_events')
          .select('*')
          .eq('status', 'pending')
          .lt('due_date', new Date().toISOString().split('T')[0])
          .order('due_date', { ascending: true });

        if (error) {
          throw error;
        }

        const eventRows: FinancialEventRow[] = (data || []) as FinancialEventRow[];
        setEvents(eventRows.map(rowToEvent));
      } catch (_error) {
        toast.error('Erro ao carregar eventos vencidos');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOverdueEvents();

    // Real-time subscription para eventos vencidos
    const channel = supabase
      .channel('overdue_events')
      .on(
        'postgres_changes',
        {
          event: '*',
          filter: `status=eq.pending&due_date=lt.${new Date().toISOString().split('T')[0]}`,
          schema: 'public',
          table: 'financial_events',
        },
        () => {
          fetchOverdueEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { events, loading };
}

/**
 * Hook para resumo financeiro
 */
export function useFinancialSummary() {
  const { events, loading } = useFinancialEvents({
    endDate: new Date().toISOString().split('T')[0],
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    status: 'all',
  });

  const summary = useMemo(() => {
    const currentMonth = new Date();
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const currentMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const currentMonthEvents = events.filter((e) => {
      const eventDate = new Date(e.end);
      return eventDate >= currentMonthStart && eventDate <= currentMonthEnd;
    });

    const paidThisMonth = currentMonthEvents
      .filter((e) => e.status === 'paid')
      .reduce((sum, e) => sum + (e.type === 'income' ? e.amount : -Math.abs(e.amount)), 0);

    const pendingThisMonth = currentMonthEvents
      .filter((e) => e.status === 'pending')
      .reduce((sum, e) => sum + (e.type === 'income' ? e.amount : -Math.abs(e.amount)), 0);

    const overdueThisMonth = currentMonthEvents
      .filter((e) => {
        const dueDate = new Date(e.end);
        return e.status === 'pending' && dueDate < new Date();
      })
      .reduce((sum, e) => sum - Math.abs(e.amount), 0);

    return {
      overdueThisMonth,
      paidThisMonth,
      pendingThisMonth,
      projectedBalance: paidThisMonth + pendingThisMonth,
    };
  }, [events]);

  return { loading, summary };
}

/**
 * Hook para mutações de eventos financeiros (CRUD operations)
 * Extrai as operações de mutação do hook principal para uso independente
 */
export function useFinancialEventMutations() {
  const { user } = useAuth();

  const createEvent = useCallback(
    async (event: Omit<FinancialEvent, 'id'>) => {
      try {
        if (!user) {
          throw new FinancialError('Usuário não autenticado', 'AUTH');
        }

        const baseRow = eventToRow(event, user.id);
        const eventData: FinancialEventInsert = {
          ...baseRow,
          user_id: user.id,
          created_at: new Date().toISOString(),
          amount: event.amount ?? baseRow.amount,
          title: event.title || baseRow.title || 'Novo Evento',
        };

        const { data, error } = await supabase
          .from('financial_events')
          .insert(eventData)
          .select()
          .single();

        if (error) {
          const errorMessage =
            typeof error === 'object' && error.message ? error.message : 'Erro ao criar evento';
          throw new FinancialError(errorMessage, 'NETWORK');
        }

        const newEvent = rowToEvent(data as FinancialEventRow);
        toast.success('Evento financeiro criado com sucesso!', {
          description: `${newEvent.title} - R$ ${Math.abs(newEvent.amount).toFixed(2)}`,
        });

        return newEvent;
      } catch (error) {
        const err =
          error instanceof FinancialError
            ? error
            : new FinancialError(
                error instanceof Error ? error.message : 'Erro ao criar evento',
                'UNKNOWN'
              );
        toast.error('Erro ao criar evento financeiro', {
          description: err.message,
        });
        throw err;
      }
    },
    [user]
  );

  const updateEvent = useCallback(
    async (id: string, updates: Partial<FinancialEvent>) => {
      try {
        if (!user) {
          throw new FinancialError('Usuário não autenticado', 'AUTH');
        }

        const updatePayload: Partial<FinancialEventInsert> = {
          updated_at: new Date().toISOString(),
        };

        if (updates.title !== undefined) {
          updatePayload.title = updates.title;
        }
        if (updates.description !== undefined) {
          updatePayload.description = updates.description;
        }
        if (updates.amount !== undefined) {
          updatePayload.amount = updates.amount;
        }
        if (updates.start !== undefined) {
          updatePayload.start_date = updates.start.toISOString();
        }
        if (updates.end !== undefined) {
          updatePayload.end_date = updates.end.toISOString();
        }
        if (updates.type !== undefined) {
          updatePayload.event_type = updates.type;
          updatePayload.is_income = updates.type === 'income';
        }
        if (updates.category !== undefined) {
          updatePayload.category = updates.category;
        }
        if (updates.recurring !== undefined) {
          updatePayload.is_recurring = updates.recurring;
        }
        if (updates.status !== undefined) {
          updatePayload.status = updates.status;
        }
        if (updates.color !== undefined) {
          updatePayload.color = updates.color;
        }
        if (updates.icon !== undefined) {
          updatePayload.icon = updates.icon;
        }
        if (updates.location !== undefined) {
          updatePayload.location = updates.location;
        }

        const { data, error } = await supabase
          .from('financial_events')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw new FinancialError(error.message, 'NETWORK');
        }

        const updatedEvent = rowToEvent(data as FinancialEventRow);
        toast.success('Evento atualizado com sucesso!');

        return updatedEvent;
      } catch (error) {
        const err =
          error instanceof FinancialError
            ? error
            : new FinancialError((error as Error).message, 'UNKNOWN');
        toast.error('Erro ao atualizar evento financeiro', {
          description: err.message,
        });
        throw err;
      }
    },
    [user]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      try {
        if (!user) {
          throw new FinancialError('Usuário não autenticado', 'AUTH');
        }

        const { error } = await supabase.from('financial_events').delete().eq('id', id);

        if (error) {
          throw new FinancialError(error.message, 'NETWORK');
        }

        toast.success('Evento financeiro removido com sucesso!');
      } catch (error) {
        const err =
          error instanceof FinancialError
            ? error
            : new FinancialError((error as Error).message, 'UNKNOWN');
        toast.error('Erro ao remover evento financeiro', {
          description: err.message,
        });
        throw err;
      }
    },
    [user]
  );

  return {
    addEvent: createEvent,
    deleteEvent,
    updateEvent,
  };
}

/**
 * Hook para inscrição real-time de eventos financeiros
 * Permite componentes se inscreverem em mudanças de eventos financeiros
 */
export function useFinancialEventsRealtime(onChange?: () => void) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    const channel = supabase
      .channel(`financial_events_realtime_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          filter: `user_id=eq.${user.id}`,
          schema: 'public',
          table: 'financial_events',
        },
        (payload) => {
          // Executar callback quando houver mudanças
          if (onChange) {
            onChange();
          }

          // Mostrar notificações para mudanças relevantes
          if (payload.eventType === 'INSERT') {
            const newEvent = rowToEvent(payload.new as FinancialEventRow);
            toast.success('Novo evento financeiro adicionado', {
              description: `${newEvent.title} - R$ ${Math.abs(newEvent.amount).toFixed(2)}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedEvent = rowToEvent(payload.new as FinancialEventRow);
            const oldStatus = (payload.old as Partial<FinancialEventRow>)?.status;
            if (updatedEvent.status === 'paid' && oldStatus !== 'paid') {
              toast.success('Evento marcado como pago', {
                description: `${updatedEvent.title} - R$ ${Math.abs(updatedEvent.amount).toFixed(2)}`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange, user]);
}
