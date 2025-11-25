/**
 * Hook completo para gerenciamento de eventos financeiros (Contas a Pagar e Receber)
 * Implementa CRUD, filtragem, ordenação, real-time subscriptions e cache local
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';
import type {
  ValidationError as FinancialValidationError,
  SanitizedFinancialEvent,
} from '@/lib/validation/financial-events-validator';
import {
  sanitizeFinancialEventData,
  validateFinancialEventForInsert,
  validateFinancialEventForUpdate,
} from '@/lib/validation/financial-events-validator';
import type { Database } from '@/types/database.types';
import type {
  BrazilianEventType,
  FinancialEventCategory,
  FinancialEventMetadata,
  FinancialEventPriority,
  InstallmentInfo,
} from '@/types/financial.interfaces';
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

const formatValidationErrors = (errors: FinancialValidationError[]) =>
  errors.map((error) => `${error.field}: ${error.message}`).join(', ');

const normalizeDateInput = (value?: Date | string | null) => {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const toDateOnly = (value?: Date | string | null) => {
  const date = normalizeDateInput(value);
  return date ? date.toISOString().split('T')[0] : null;
};

const toDateTimeString = (value?: Date | string | null) => {
  const date = normalizeDateInput(value);
  return date ? date.toISOString() : null;
};

const serializeJsonField = (value?: unknown) => {
  if (value === undefined || value === null) {
    return null;
  }
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return null;
  }
};

const _safeEventLogPayload = (event?: SanitizedFinancialEvent | null) => {
  if (!event) {
    return null;
  }
  const payload: Record<string, unknown> = { ...event };

  if (event.start) {
    payload.start = event.start.toISOString();
  }
  if (event.end) {
    payload.end = event.end.toISOString();
  }
  if (event.dueDate) {
    payload.dueDate = event.dueDate instanceof Date ? event.dueDate.toISOString() : event.dueDate;
  }
  if (event.completedAt) {
    payload.completedAt =
      event.completedAt instanceof Date ? event.completedAt.toISOString() : event.completedAt;
  }

  return payload;
};

const logFinancialEventError = (
  scope: string,
  error: unknown,
  context?: Record<string, unknown>
) => {
  logger.error(`[useFinancialEvents] ${scope}`, { error, ...context });
};

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

  let metadata: FinancialEventMetadata | undefined;
  if (row.metadata) {
    try {
      metadata =
        typeof row.metadata === 'string'
          ? (JSON.parse(row.metadata) as FinancialEventMetadata)
          : (row.metadata as FinancialEventMetadata);
    } catch (_error) {}
  }

  if (row.merchant_category) {
    metadata = {
      ...metadata,
      merchantCategory: row.merchant_category,
    };
  }

  let installmentInfo: InstallmentInfo | undefined;
  if (row.installment_info) {
    try {
      installmentInfo =
        typeof row.installment_info === 'string'
          ? (JSON.parse(row.installment_info) as InstallmentInfo)
          : (row.installment_info as unknown as InstallmentInfo);
    } catch (_error) {}
  }

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    start: startDate,
    end: endDate,
    type,
    amount: row.amount,
    color: (row.color as EventColor) || ((type === 'income' ? 'emerald' : 'rose') as EventColor),
    status,
    category: (row.category as FinancialEventCategory) || 'OUTROS',
    account: undefined, // Não existe na tabela diretamente mas poderia vir de join
    location: row.location || undefined,
    isRecurring: row.is_recurring || false,
    allDay: row.all_day || false,
    isIncome: row.is_income || false,
    priority: (row.priority as FinancialEventPriority) || 'NORMAL',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    dueDate: row.due_date || undefined,
    completedAt: row.completed_at || undefined,
    notes: row.notes || undefined,
    tags: row.tags || undefined,
    icon: row.icon || undefined,
    metadata,
    installmentInfo,
    brazilianEventType: (row.brazilian_event_type as BrazilianEventType) || undefined,
  };
}

/**
 * Converte FinancialEvent para formato do banco
 */
function eventToRow(event: Omit<FinancialEvent, 'id'>, userId: string): FinancialEventInsert {
  const startDate = event.start || new Date();
  const endDate = event.end || startDate;
  const type = event.type === 'income' ? 'income' : event.type || 'expense';
  const dueDate = normalizeDateInput(event.dueDate);
  const completedAt = normalizeDateInput(event.completedAt);

  return {
    user_id: userId,
    title: event.title || '',
    description: event.description || null,
    amount: event.amount ?? 0,
    start_date: startDate.toISOString(), // Supabase handles timestamp with TZ
    end_date: endDate.toISOString(),
    event_type: type,
    is_income: type === 'income',
    category: (event.category as string) || null,
    location: event.location || null,
    is_recurring: event.isRecurring || false,
    all_day: event.allDay || false,
    status: (event.status as EventStatus) || 'pending',
    updated_at: new Date().toISOString(),
    color: event.color || 'blue',
    priority: event.priority || 'NORMAL',
    recurrence_rule: event.recurrenceRule || null,
    parent_event_id: (event as { parentEventId?: string }).parentEventId || null,
    due_date: dueDate ? dueDate.toISOString().split('T')[0] : null,
    completed_at: completedAt ? completedAt.toISOString() : null,
    notes: event.notes || null,
    tags: event.tags?.length ? event.tags : null,
    icon: event.icon || null,
    attachments: event.attachments?.length ? event.attachments : null,
    brazilian_event_type: event.brazilianEventType || null,
    installment_info: serializeJsonField(event.installmentInfo),
    metadata: serializeJsonField(event.metadata),
    merchant_category: event.metadata?.merchantCategory || null,
  };
}

const buildUpdatePayload = (updates: SanitizedFinancialEvent): Partial<FinancialEventInsert> => {
  const payload: Partial<FinancialEventInsert> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) {
    payload.title = updates.title;
  }
  if (updates.description !== undefined) {
    payload.description = updates.description || null;
  }
  if (updates.amount !== undefined) {
    payload.amount = updates.amount;
  }
  if (updates.start) {
    payload.start_date = updates.start.toISOString();
  }
  if (updates.end) {
    payload.end_date = updates.end.toISOString();
  }
  if (updates.type) {
    payload.event_type = updates.type;
    payload.is_income = updates.type === 'income';
  } else if (updates.isIncome !== undefined) {
    payload.is_income = updates.isIncome;
  }

  if (updates.category !== undefined) {
    payload.category = (updates.category as string) || null;
  }

  if (updates.location !== undefined) {
    payload.location = updates.location || null;
  }

  if (updates.isRecurring !== undefined) {
    payload.is_recurring = updates.isRecurring;
  }

  if (updates.allDay !== undefined) {
    payload.all_day = updates.allDay;
  }

  if (updates.status !== undefined) {
    payload.status = updates.status as EventStatus;
  }

  if (updates.color !== undefined) {
    payload.color = updates.color || 'blue';
  }

  if (updates.priority !== undefined) {
    payload.priority = updates.priority as FinancialEventPriority;
  }

  if (updates.recurrenceRule !== undefined) {
    payload.recurrence_rule = updates.recurrenceRule || null;
  }

  if ((updates as { parentEventId?: string }).parentEventId !== undefined) {
    payload.parent_event_id = (updates as { parentEventId?: string }).parentEventId || null;
  }

  if (updates.dueDate !== undefined) {
    payload.due_date = updates.dueDate ? toDateOnly(updates.dueDate) : null;
  }

  if (updates.completedAt !== undefined) {
    payload.completed_at = updates.completedAt ? toDateTimeString(updates.completedAt) : null;
  }

  if (updates.notes !== undefined) {
    payload.notes = updates.notes || null;
  }

  if (updates.tags !== undefined) {
    payload.tags = updates.tags ?? null;
  }

  if (updates.icon !== undefined) {
    payload.icon = updates.icon || null;
  }

  if (updates.attachments !== undefined) {
    payload.attachments = updates.attachments ?? null;
  }

  if (updates.installmentInfo !== undefined) {
    payload.installment_info = serializeJsonField(updates.installmentInfo);
  }

  if (updates.metadata !== undefined) {
    payload.metadata = serializeJsonField(updates.metadata);
    payload.merchant_category = updates.metadata?.merchantCategory || null;
  }

  if (updates.brazilianEventType !== undefined) {
    payload.brazilian_event_type = updates.brazilianEventType || null;
  }

  return payload;
};

type EventWithoutId = Omit<FinancialEvent, 'id'>;

export const insertFinancialEventRecord = async (userId: string, event: EventWithoutId) => {
  let sanitizedEvent: SanitizedFinancialEvent | null = null;
  sanitizedEvent = sanitizeFinancialEventData({ ...event, userId });
  const validationResult = validateFinancialEventForInsert(sanitizedEvent);

  if (!validationResult.valid) {
    logFinancialEventError('insert_validation_failed', new Error('validation_error'), {
      errors: validationResult.errors,
      payload: _safeEventLogPayload(sanitizedEvent),
      userId,
    });
    throw new FinancialError(
      `Dados inválidos: ${formatValidationErrors(validationResult.errors)}`,
      'VALIDATION'
    );
  }

  const baseRow = eventToRow(sanitizedEvent as EventWithoutId, userId);
  const eventData: FinancialEventInsert = {
    ...baseRow,
    user_id: userId,
    created_at: new Date().toISOString(),
    amount: sanitizedEvent.amount ?? baseRow.amount,
    title: sanitizedEvent.title || baseRow.title || 'Novo Evento',
  };

  const { data, error } = await supabase
    .from('financial_events')
    .insert(eventData)
    .select()
    .single();

  if (error) {
    logFinancialEventError('insert_supabase_failed', error, {
      payload: _safeEventLogPayload(sanitizedEvent),
      userId,
    });
    throw new FinancialError(error.message, 'NETWORK');
  }

  return rowToEvent(data as FinancialEventRow);
};

export const updateFinancialEventRecord = async (
  userId: string,
  id: string,
  updates: Partial<FinancialEvent>
) => {
  let sanitizedUpdates: SanitizedFinancialEvent | null = null;
  sanitizedUpdates = sanitizeFinancialEventData({ ...updates, userId });
  const validationResult = validateFinancialEventForUpdate(sanitizedUpdates);

  if (!validationResult.valid) {
    logFinancialEventError('update_validation_failed', new Error('validation_error'), {
      errors: validationResult.errors,
      eventId: id,
      payload: _safeEventLogPayload(sanitizedUpdates),
      userId,
    });
    throw new FinancialError(
      `Dados inválidos: ${formatValidationErrors(validationResult.errors)}`,
      'VALIDATION'
    );
  }

  const updatePayload = buildUpdatePayload(sanitizedUpdates);
  const hasChanges = Object.keys(updatePayload).some((key) => key !== 'updated_at');

  if (!hasChanges) {
    throw new FinancialError('Nenhum campo para atualizar.', 'VALIDATION');
  }

  const { data, error } = await supabase
    .from('financial_events')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    logFinancialEventError('update_supabase_failed', error, {
      eventId: id,
      payload: _safeEventLogPayload(sanitizedUpdates),
      userId,
    });
    throw new FinancialError(error.message, 'NETWORK');
  }

  return rowToEvent(data as FinancialEventRow);
};

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
  const cache = useRef<Map<string, CacheEntry>>(new Map());

  // Gerar chave de cache baseada nos filtros e paginação e usuário
  const cacheKey = useMemo(() => {
    return JSON.stringify({ filters, pagination, userId: user?.id });
  }, [filters, pagination, user?.id]);

  // Limpar cache público
  const clearCache = useCallback(() => {
    cache.current = new Map();
  }, []);

  // Clear cache when user changes
  useEffect(() => {
    clearCache();
  }, [clearCache]);

  // Verificar se há cache válido
  const getCachedData = useCallback((): { data: FinancialEvent[]; count: number } | null => {
    const cached = cache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { count: cached.totalCount, data: cached.data };
    }
    return null;
  }, [cacheKey]);

  // Salvar dados no cache
  const setCachedData = useCallback(
    (data: FinancialEvent[], count: number) => {
      const currentCache = cache.current;

      // Limitar tamanho do cache
      if (currentCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = currentCache.keys().next().value;
        if (oldestKey) {
          currentCache.delete(oldestKey);
        }
      }

      currentCache.set(cacheKey, {
        data,
        filters,
        pagination,
        timestamp: Date.now(),
        totalCount: count,
      });
    },
    [cacheKey, filters, pagination]
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
        const newEvent = await insertFinancialEventRecord(user.id, event);
        clearCache();
        fetchEvents();
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
        const updatedEvent = await updateFinancialEventRecord(user.id, id, updates);
        clearCache();
        fetchEvents();
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
        const newEvent = await insertFinancialEventRecord(user.id, event);
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
        const updatedEvent = await updateFinancialEventRecord(user.id, id, updates);
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
