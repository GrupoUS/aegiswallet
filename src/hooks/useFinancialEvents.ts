/**
 * Hook completo para gerenciamento de eventos financeiros (Contas a Pagar e Receber)
 * Implementa CRUD, filtragem, ordenação, real-time subscriptions e cache local
 * Refatorado para usar API do servidor (Hono) em vez de queries diretas
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/lib/api-client';
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

// Tipos de resposta da API
interface TransactionApiResponse<T> {
  data: T;
  meta: {
    requestId: string;
    retrievedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string;
    total?: number;
  };
}

// Mapeamento de campos do backend para frontend
function mapBackendToFrontend(item: any): FinancialEvent {
  const type: FinancialEventType = item.event_type || (item.is_income ? 'income' : 'expense');

  let metadata: FinancialEventMetadata | undefined = item.metadata;
  if (item.merchant_category) {
    metadata = { ...metadata, merchantCategory: item.merchant_category };
  }

  let installmentInfo: InstallmentInfo | undefined = item.installment_info;
  if (typeof item.installment_info === 'string') {
    try {
      installmentInfo = JSON.parse(item.installment_info);
    } catch {}
  }

  return {
    id: item.id,
    userId: item.user_id,
    title: item.title,
    description: item.description || undefined,
    start: new Date(item.start_date),
    end: new Date(item.end_date),
    type,
    amount: Number(item.amount),
    color: (item.color as EventColor) || ((type === 'income' ? 'emerald' : 'rose') as EventColor),
    status: item.status as EventStatus,
    category: (item.category as FinancialEventCategory) || 'OUTROS',
    location: item.location || undefined,
    isRecurring: item.is_recurring || false,
    allDay: item.all_day || false,
    isIncome: item.is_income || false,
    priority: (item.priority as FinancialEventPriority) || 'NORMAL',
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    dueDate: item.due_date || undefined,
    completedAt: item.completed_at || undefined,
    notes: item.notes || undefined,
    tags: item.tags || undefined,
    icon: item.icon || undefined,
    metadata,
    installmentInfo,
    brazilianEventType: (item.brazilian_event_type as BrazilianEventType) || undefined,
  };
}

/**
 * Hook principal para gerenciamento de eventos financeiros
 */
export function useFinancialEvents(
  initialFilters: FinancialEventsFilters = {},
  initialPagination: PaginationOptions = {
    limit: 50,
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
  }, [clearCache, user?.id]);

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

      // Preparar query params
      const params: Record<string, any> = {
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
      };

      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.type && filters.type !== 'all') params.type = filters.type;
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.search) params.search = filters.search;

      // Executar requisição
      const response = await apiClient.get<TransactionApiResponse<any[]>>('/v1/transactions', { params });

      const mappedEvents = response.data.data.map(mapBackendToFrontend);
      const total = response.data.meta.total || mappedEvents.length;

      setEvents(mappedEvents);
      setTotalCount(total);
      setCachedData(mappedEvents, total);
    } catch (err) {
      const error = new FinancialError(
        err instanceof Error ? err.message : 'Erro desconhecido',
        'NETWORK'
      );
      setError(error);
      toast.error('Erro ao carregar eventos financeiros', {
        description: error.message,
      });
      setEvents([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination, user, getCachedData, setCachedData]);

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
          // Invalidar cache e refazer busca
          clearCache();
          fetchEvents();

          // Mostrar notificação para mudanças relevantes
          if (payload.eventType === 'INSERT') {
            const newEvent = payload.new as any;
            toast.success('Novo evento financeiro adicionado', {
              description: `${newEvent.title} - R$ ${Math.abs(Number(newEvent.amount)).toFixed(2)}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedEvent = payload.new as any;
            const oldStatus = (payload.old as any)?.status;
            if (updatedEvent.status === 'paid' && oldStatus !== 'paid') {
              toast.success('Evento marcado como pago', {
                description: `${updatedEvent.title} - R$ ${Math.abs(Number(updatedEvent.amount)).toFixed(2)}`,
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

        const payload = {
          ...event,
          categoryId: event.category, // Map category to categoryId for backend
        };

        const response = await apiClient.post<TransactionApiResponse<any>>('/v1/transactions', payload);
        const newEvent = mapBackendToFrontend(response.data.data);

        clearCache();
        fetchEvents();

        toast.success('Evento financeiro criado com sucesso!', {
          description: `${newEvent.title} - R$ ${Math.abs(newEvent.amount).toFixed(2)}`,
        });

        return newEvent;
      } catch (error) {
        const err = new FinancialError(
          error instanceof Error ? error.message : 'Erro ao criar evento',
          'NETWORK'
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

        const payload: any = { ...updates };
        if (updates.category) payload.categoryId = updates.category;

        const response = await apiClient.put<TransactionApiResponse<any>>(`/v1/transactions/${id}`, payload);
        const updatedEvent = mapBackendToFrontend(response.data.data);

        clearCache();
        fetchEvents();
        toast.success('Evento atualizado com sucesso!');

        return updatedEvent;
      } catch (error) {
        const err = new FinancialError(
          error instanceof Error ? error.message : 'Erro ao atualizar evento',
          'NETWORK'
        );
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

        await apiClient.delete(`/v1/transactions/${id}`);

        // Invalidar cache
        clearCache();
        fetchEvents();

        toast.success('Evento financeiro removido com sucesso!');
      } catch (error) {
        const err = new FinancialError(
          error instanceof Error ? error.message : 'Erro ao remover evento',
          'NETWORK'
        );
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
      return updateEvent(id, { status: 'completed' });
    },
    [updateEvent]
  );

  const duplicateEvent = useCallback(
    async (id: string) => {
      try {
        // First fetch the event details
        const response = await apiClient.get<TransactionApiResponse<any>>(`/v1/transactions`, {
           params: { search: id } // This is hacky, better to have getById or just find in current list
        });
        // Actually we can just find it in `events` if available, or fetch it.
        // Since we don't have getById exposed in hook, let's just use what we have or fetch list.
        // But wait, `duplicateEvent` logic was: fetch -> insert new.
        // We can reuse `createEvent` with data from `events` list.

        const eventToDuplicate = events.find(e => e.id === id);
        if (!eventToDuplicate) {
             throw new Error("Evento não encontrado para duplicar");
        }

        const { id: _, ...eventData } = eventToDuplicate;
        await createEvent({
            ...eventData,
            title: `${eventData.title} (Cópia)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

      } catch (error) {
         toast.error("Erro ao duplicar evento");
      }
    },
    [createEvent, events]
  );

  return {
    events,
    loading,
    error,
    filters,
    setFilters,
    pagination,
    setPagination,
    totalCount,
    createEvent,
    updateEvent,
    deleteEvent,
    markAsPaid,
    duplicateEvent,
    refresh: fetchEvents,
  };
}
