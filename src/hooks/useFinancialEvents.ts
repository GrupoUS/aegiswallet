/**
 * Hook completo para gerenciamento de eventos financeiros (Contas a Pagar e Receber)
 * Implementa CRUD, filtragem, ordenação, real-time subscriptions e cache local
 * Refatorado para usar API do servidor (Hono) em vez de queries diretas
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import type { FinancialEventCategory } from '@/types/financial.interfaces';
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
		public type: 'NETWORK' | 'AUTH' | 'VALIDATION' | 'UNKNOWN',
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
// biome-ignore lint/suspicious/noExplicitAny: Database response mapping requires flexible types - output is strictly typed via FinancialEvent
function mapBackendToFrontend(item: any): FinancialEvent {
	const type: FinancialEventType = item.amount > 0 ? 'income' : 'expense';

	return {
		id: item.id,
		userId: item.userId,
		title: item.description,
		description: item.notes || undefined,
		start: new Date(item.transactionDate),
		end: new Date(item.transactionDate),
		type,
		amount: Number(item.amount),
		color: (type === 'income' ? 'emerald' : 'rose') as EventColor,
		status: item.status === 'posted' ? 'completed' : 'pending',
		category: (item.categoryId as FinancialEventCategory) || 'OUTROS',
		isRecurring: false, // Not yet supported in transactions table
		allDay: false,
		isIncome: item.amount > 0,
		priority: 'NORMAL',
		createdAt: item.createdAt,
		updatedAt: item.updatedAt,
		dueDate: item.transactionDate,
		completedAt: item.status === 'posted' ? item.updatedAt : undefined,
		notes: item.notes || undefined,
		tags: item.tags || undefined,
		brazilianEventType: undefined, // Map if needed
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
	},
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
	// biome-ignore lint/correctness/useExhaustiveDependencies: user?.id triggers cache clear when user changes
	useEffect(() => {
		clearCache();
	}, [clearCache, user?.id]);

	// Verificar se há cache válido
	const getCachedData = useCallback((): {
		data: FinancialEvent[];
		count: number;
	} | null => {
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
		[cacheKey, filters, pagination],
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
			// biome-ignore lint/suspicious/noExplicitAny: Dynamic query params require flexible typing for API compatibility
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
			// biome-ignore lint/suspicious/noExplicitAny: Backend transaction response structure is dynamic and mapped via mapBackendToFrontend
			const response = await apiClient.get<TransactionApiResponse<any[]>>('/v1/transactions', {
				params,
			});

			const mappedEvents = response.data.map(mapBackendToFrontend);
			const total = response.meta.total || mappedEvents.length;

			setEvents(mappedEvents);
			setTotalCount(total);
			setCachedData(mappedEvents, total);
		} catch (err) {
			const error = new FinancialError(
				err instanceof Error ? err.message : 'Erro desconhecido',
				'NETWORK',
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

	// Note: Realtime subscriptions removed in Neon migration
	// Data is refreshed via polling and manual refetch
	// TODO: Add WebSocket support for realtime updates if needed

	// Mutations
	const createEvent = useCallback(
		async (event: Omit<FinancialEvent, 'id'>) => {
			try {
				if (!user) {
					throw new FinancialError('Usuário não autenticado', 'AUTH');
				}

				const payload = {
					amount: Number(event.amount),
					description: event.title,
					transactionType: event.type === 'income' ? 'credit' : 'debit',
					status: event.status === 'completed' ? 'posted' : 'pending',
					transactionDate: event.start instanceof Date ? event.start.toISOString() : event.start,
					categoryId: event.category,
					notes: event.description,
				};

				// biome-ignore lint/suspicious/noExplicitAny: API response type is dynamic
				const response = await apiClient.post<TransactionApiResponse<any>>(
					'/v1/transactions',
					payload,
				);
				const newEvent = mapBackendToFrontend(response.data.data);

				clearCache();
				await fetchEvents();

				toast.success('Evento financeiro criado com sucesso!', {
					description: `${newEvent.title} - R$ ${Math.abs(newEvent.amount).toFixed(2)}`,
				});

				return newEvent;
			} catch (error) {
				const err = new FinancialError(
					error instanceof Error ? error.message : 'Erro ao criar evento',
					'NETWORK',
				);
				toast.error('Erro ao criar evento financeiro', {
					description: err.message,
				});
				throw err;
			}
		},
		[clearCache, fetchEvents, user],
	);

	const updateEvent = useCallback(
		async (id: string, updates: Partial<FinancialEvent>) => {
			try {
				if (!user) {
					throw new FinancialError('Usuário não autenticado', 'AUTH');
				}

				// biome-ignore lint/suspicious/noExplicitAny: Payload type is dynamic for partial updates
				const payload: any = { ...updates };
				if (updates.category) payload.categoryId = updates.category;

				// biome-ignore lint/suspicious/noExplicitAny: API response type is dynamic
				const response = await apiClient.put<TransactionApiResponse<any>>(
					`/v1/transactions/${id}`,
					payload,
				);
				const updatedEvent = mapBackendToFrontend(response.data.data);

				clearCache();
				await fetchEvents();
				toast.success('Evento atualizado com sucesso!');

				return updatedEvent;
			} catch (error) {
				const err = new FinancialError(
					error instanceof Error ? error.message : 'Erro ao atualizar evento',
					'NETWORK',
				);
				toast.error('Erro ao atualizar evento financeiro', {
					description: err.message,
				});
				throw err;
			}
		},
		[clearCache, fetchEvents, user],
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
					'NETWORK',
				);
				toast.error('Erro ao remover evento financeiro', {
					description: err.message,
				});
				throw err;
			}
		},
		[clearCache, fetchEvents, user],
	);

	const markAsPaid = useCallback(
		async (id: string) => {
			return updateEvent(id, { status: 'completed' });
		},
		[updateEvent],
	);

	const duplicateEvent = useCallback(
		async (id: string) => {
			try {
				// Find event in local state instead of making an API call
				const eventToDuplicate = events.find((e) => e.id === id);
				if (!eventToDuplicate) {
					throw new Error('Evento não encontrado para duplicar');
				}

				const { id: _, ...eventData } = eventToDuplicate;
				await createEvent({
					...eventData,
					title: `${eventData.title} (Cópia)`,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				});
			} catch {
				toast.error('Erro ao duplicar evento');
			}
		},
		[createEvent, events],
	);

	// Calculate statistics from events
	const statistics = useMemo(() => {
		const totalIncome = events
			.filter((e) => e.type === 'income' && e.status === 'completed')
			.reduce((sum, e) => sum + Math.abs(e.amount), 0);

		const totalExpenses = events
			.filter((e) => e.type === 'expense' && e.status === 'completed')
			.reduce((sum, e) => sum + Math.abs(e.amount), 0);

		const pendingIncome = events
			.filter((e) => e.type === 'income' && e.status === 'pending')
			.reduce((sum, e) => sum + Math.abs(e.amount), 0);

		const pendingExpenses = events
			.filter((e) => e.type === 'expense' && e.status === 'pending')
			.reduce((sum, e) => sum + Math.abs(e.amount), 0);

		const overdueCount = events.filter(
			(e) => e.status === 'pending' && e.dueDate && new Date(e.dueDate) < new Date(),
		).length;

		const netBalance = totalIncome - totalExpenses + pendingIncome - pendingExpenses;

		return {
			totalIncome,
			totalExpenses,
			pendingIncome,
			pendingExpenses,
			overdueCount,
			netBalance,
			totalEvents: events.length,
		};
	}, [events]);

	return {
		events,
		loading,
		error,
		filters,
		setFilters,
		pagination,
		setPagination,
		totalCount,
		statistics,
		createEvent,
		updateEvent,
		deleteEvent,
		markAsPaid,
		duplicateEvent,
		refresh: fetchEvents,
	};
}

/**
 * Hook for financial event mutations only (without query state)
 * Used when you only need to modify events without managing the list state
 */
export function useFinancialEventMutations() {
	const { user } = useAuth();

	const addEvent = useCallback(
		async (event: Omit<FinancialEvent, 'id'>) => {
			try {
				if (!user) {
					throw new FinancialError('Usuário não autenticado', 'AUTH');
				}

				const payload = {
					...event,
					categoryId: event.category,
				};

				// biome-ignore lint/suspicious/noExplicitAny: Backend transaction response structure is dynamic and mapped via mapBackendToFrontend
				const response = await apiClient.post<TransactionApiResponse<any>>(
					'/v1/transactions',
					payload,
				);
				const newEvent = mapBackendToFrontend(response.data.data);

				toast.success('Evento financeiro criado com sucesso!', {
					description: `${newEvent.title} - R$ ${Math.abs(newEvent.amount).toFixed(2)}`,
				});

				return newEvent;
			} catch (error) {
				const err = new FinancialError(
					error instanceof Error ? error.message : 'Erro ao criar evento',
					'NETWORK',
				);
				toast.error('Erro ao criar evento financeiro', {
					description: err.message,
				});
				throw err;
			}
		},
		[user],
	);

	const updateEvent = useCallback(
		async (id: string, updates: Partial<FinancialEvent>) => {
			try {
				if (!user) {
					throw new FinancialError('Usuário não autenticado', 'AUTH');
				}

				// biome-ignore lint/suspicious/noExplicitAny: Payload needs flexible typing for optional field mapping
				const payload: any = { ...updates };
				if (updates.category) payload.categoryId = updates.category;

				// biome-ignore lint/suspicious/noExplicitAny: Backend transaction response structure is dynamic and mapped via mapBackendToFrontend
				const response = await apiClient.put<TransactionApiResponse<any>>(
					`/v1/transactions/${id}`,
					payload,
				);
				const updatedEvent = mapBackendToFrontend(response.data.data);

				toast.success('Evento atualizado com sucesso!');
				return updatedEvent;
			} catch (error) {
				const err = new FinancialError(
					error instanceof Error ? error.message : 'Erro ao atualizar evento',
					'NETWORK',
				);
				toast.error('Erro ao atualizar evento financeiro', {
					description: err.message,
				});
				throw err;
			}
		},
		[user],
	);

	const deleteEvent = useCallback(
		async (id: string) => {
			try {
				if (!user) {
					throw new FinancialError('Usuário não autenticado', 'AUTH');
				}

				await apiClient.delete(`/v1/transactions/${id}`);
				toast.success('Evento financeiro removido com sucesso!');
			} catch (error) {
				const err = new FinancialError(
					error instanceof Error ? error.message : 'Erro ao remover evento',
					'NETWORK',
				);
				toast.error('Erro ao remover evento financeiro', {
					description: err.message,
				});
				throw err;
			}
		},
		[user],
	);

	const markAsPaid = useCallback(
		async (id: string) => {
			return updateEvent(id, { status: 'completed' });
		},
		[updateEvent],
	);

	return {
		addEvent,
		updateEvent,
		deleteEvent,
		markAsPaid,
	};
}
