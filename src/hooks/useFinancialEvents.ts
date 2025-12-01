/**
 * Hook completo para gerenciamento de eventos financeiros (Contas a Pagar e Receber)
 * Migrado para TanStack Query para eliminar cache manual e melhorar performance
 * Implementa CRUD, filtragem, ordenação, optimistic updates e cache automático
 * Refatorado para usar API do servidor (Hono) em vez de queries diretas
 */

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import type { FinancialEventCategory } from '@/types/financial.interfaces';
import type {
	EventColor,
	EventStatus,
	FinancialEvent,
	FinancialEventType,
	BackendTransaction,
	TransactionApiPayload,
	TransactionApiQueryParams,
	TransactionApiResponse,
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

// Query keys factory for financial events
export const financialEventsKeys = {
	all: ['financial-events'] as const,
	lists: () => [...financialEventsKeys.all, 'list'] as const,
	list: (filters?: FinancialEventsFilters, pagination?: PaginationOptions) => 
		[...financialEventsKeys.lists(), filters, pagination] as const,
	details: () => [...financialEventsKeys.all, 'detail'] as const,
	detail: (id: string) => [...financialEventsKeys.details(), id] as const,
	statistics: (filters?: FinancialEventsFilters) => [...financialEventsKeys.all, 'statistics', filters] as const,
};

// Mapeamento de campos do backend para frontend
function mapBackendToFrontend(item: BackendTransaction): FinancialEvent {
	const type: FinancialEventType = Number(item.amount) > 0 ? 'income' : 'expense';

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
		isIncome: Number(item.amount) > 0,
		priority: 'NORMAL',
		createdAt: item.createdAt,
		updatedAt: item.updatedAt,
		dueDate: item.transactionDate,
		completedAt: item.status === 'posted' ? item.updatedAt : undefined,
		notes: item.notes || undefined,
		tags: [], // Initialize empty array for now
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
	const queryClient = useQueryClient();

	// Estados para filtros e paginação
	const [filters, setFilters] = useState<FinancialEventsFilters>(initialFilters);
	const [pagination, setPagination] = useState<PaginationOptions>(initialPagination);

	// Memoized query key
	const queryKey = useMemo(() => 
		financialEventsKeys.list(filters, pagination), 
		[filters, pagination]
	);

	// Query for fetching financial events
	const {
		data: events = [],
		isLoading: loading,
		error: queryError,
		refetch,
	} = useQuery({
		queryKey,
		queryFn: async () => {
			if (!user) {
				return [];
			}

			// Preparar query params com tipos definidos
			const params: TransactionApiQueryParams = {
				limit: pagination.limit,
				offset: (pagination.page - 1) * pagination.limit,
			};

			if (filters.categoryId) params.categoryId = filters.categoryId;
			if (filters.type && filters.type !== 'all') {
				params.type = filters.type === 'income' ? 'income' : 'expense';
			}
			if (filters.status && filters.status !== 'all') {
				params.status = filters.status === 'completed' ? 'posted' : 'pending';
			}
			if (filters.startDate) params.startDate = filters.startDate;
			if (filters.endDate) params.endDate = filters.endDate;
			if (filters.search) params.search = filters.search;

			// Executar requisição com tipos corretos
			const response = await apiClient.get<TransactionApiResponse<BackendTransaction[]>>(
				'/v1/transactions',
				{ params }
			);

			const mappedEvents = response.data.map(mapBackendToFrontend);
			return mappedEvents;
		},
		enabled: !!user,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});

	// Calculate total count from query data
	const totalCount = events.length;

	// Mutation for creating events
	const createEventMutation = useMutation({
		mutationFn: async (event: Omit<FinancialEvent, 'id'>): Promise<FinancialEvent> => {
			if (!user) {
				throw new FinancialError('Usuário não autenticado', 'AUTH');
			}

			const payload: TransactionApiPayload = {
				amount: Number(event.amount),
				description: event.title,
				transactionType: event.type === 'income' ? 'credit' : 'debit',
				status: event.status === 'completed' ? 'posted' : 'pending',
				transactionDate: event.start instanceof Date ? event.start.toISOString() : event.start,
				categoryId: event.category,
				notes: event.description,
			};

			const response = await apiClient.post<TransactionApiResponse<BackendTransaction>>(
				'/v1/transactions',
				payload,
			);
			return mapBackendToFrontend(response.data);
		},
		onSuccess: (newEvent) => {
			toast.success('Evento financeiro criado com sucesso!', {
				description: `${newEvent.title} - R$ ${Math.abs(newEvent.amount).toFixed(2)}`,
			});
			queryClient.invalidateQueries({ queryKey: financialEventsKeys.lists() });
		},
		onError: (error: Error) => {
			const err = new FinancialError(error.message, 'NETWORK');
			toast.error('Erro ao criar evento financeiro', {
				description: err.message,
			});
			throw err;
		},
	});

	// Mutation for updating events
	const updateEventMutation = useMutation({
		mutationFn: async ({ id, updates }: { id: string; updates: Partial<FinancialEvent> }): Promise<FinancialEvent> => {
			if (!user) {
				throw new FinancialError('Usuário não autenticado', 'AUTH');
			}

			// Convert frontend fields to backend format
			const payload: Partial<TransactionApiPayload> = {};
			if (updates.amount !== undefined) payload.amount = Number(updates.amount);
			if (updates.title !== undefined) payload.description = updates.title;
			if (updates.type !== undefined) payload.transactionType = updates.type === 'income' ? 'credit' : 'debit';
			if (updates.status !== undefined) payload.status = updates.status === 'completed' ? 'posted' : 'pending';
			if (updates.start !== undefined) payload.transactionDate = updates.start instanceof Date ? updates.start.toISOString() : updates.start;
			if (updates.category !== undefined) payload.categoryId = updates.category;
			if (updates.description !== undefined) payload.notes = updates.description;

			const response = await apiClient.put<TransactionApiResponse<BackendTransaction>>(
				`/v1/transactions/${id}`,
				payload as Record<string, unknown>,
			);
			return mapBackendToFrontend(response.data);
		},
		onSuccess: () => {
			toast.success('Evento atualizado com sucesso!');
			queryClient.invalidateQueries({ queryKey: financialEventsKeys.lists() });
		},
		onError: (error: Error) => {
			const err = new FinancialError(error.message, 'NETWORK');
			toast.error('Erro ao atualizar evento financeiro', {
				description: err.message,
			});
			throw err;
		},
	});

	// Mutation for deleting events
	const deleteEventMutation = useMutation({
		mutationFn: async (id: string): Promise<void> => {
			if (!user) {
				throw new FinancialError('Usuário não autenticado', 'AUTH');
			}

			await apiClient.delete(`/v1/transactions/${id}`);
		},
		onSuccess: () => {
			toast.success('Evento financeiro removido com sucesso!');
			queryClient.invalidateQueries({ queryKey: financialEventsKeys.lists() });
		},
		onError: (error: Error) => {
			const err = new FinancialError(error.message, 'NETWORK');
			toast.error('Erro ao remover evento financeiro', {
				description: err.message,
			});
			throw err;
		},
	});

	// Helper functions that use mutations
	const createEvent = async (event: Omit<FinancialEvent, 'id'>) => {
		return createEventMutation.mutateAsync(event);
	};

	



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

	const error = queryError instanceof Error ? new FinancialError(queryError.message, 'NETWORK') : null;

	const updateEvent = async (id: string, updates: Partial<FinancialEvent>) => {
		return updateEventMutation.mutateAsync({ id, updates });
	};

	const deleteEvent = async (id: string) => {
		await deleteEventMutation.mutateAsync(id);
	};

	const markAsPaid = async (id: string) => {
		return updateEvent(id, { status: 'completed' });
	};

	const duplicateEvent = useCallback(
		async (event: FinancialEvent): Promise<FinancialEvent> => {
			if (!user) {
				throw new FinancialError('Usuário não autenticado', 'AUTH');
			}

			const duplicatedEvent = {
				...event,
				id: undefined, // Remove ID to create new event
				title: `${event.title} (Cópia)`,
				createdAt: undefined,
				updatedAt: undefined,
			};

			return createEvent(duplicatedEvent);
		},
		[user, createEvent],
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
		statistics,
		createEvent,
		updateEvent,
		deleteEvent,
		markAsPaid,
		duplicateEvent,
		refresh: refetch,
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

				const response = await apiClient.post<TransactionApiResponse<BackendTransaction>>(
					'/v1/transactions',
					payload,
				);
				const newEvent = mapBackendToFrontend(response.data);

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

				const payload: Partial<TransactionApiPayload> = { ...updates };
				if (updates.category) payload.categoryId = updates.category;

				const response = await apiClient.put<TransactionApiResponse<BackendTransaction>>(
					`/v1/transactions/${id}`,
					payload,
				);
				const updatedEvent = mapBackendToFrontend(response.data);

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
