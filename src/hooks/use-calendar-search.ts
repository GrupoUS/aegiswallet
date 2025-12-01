import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import type { FinancialEvent, Transaction } from '@/db/schema';
import { apiClient } from '@/lib/api-client';

interface SearchFilters {
	startDate?: string;
	endDate?: string;
	typeId?: string;
	categoryId?: string;
	accountId?: string;
}

interface UseCalendarSearchProps {
	initialQuery?: string;
	initialFilters?: SearchFilters;
	enabled?: boolean;
}

interface ApiResponse<T> {
	data: T;
	meta: {
		requestId: string;
		retrievedAt: string;
	};
}

interface UseCalendarSearchReturn {
	// State
	query: string;
	filters: SearchFilters;
	searchType: 'events' | 'transactions';

	// Results
	results: FinancialEvent[] | Transaction[];
	isLoading: boolean;
	error: Error | null;

	// Handlers
	handleQueryChange: (newQuery: string) => void;
	handleFiltersChange: (newFilters: SearchFilters) => void;
	handleSearchTypeChange: (newType: 'events' | 'transactions') => void;
	clearSearch: () => void;
	resetQuery: () => void;

	// Computed
	hasResults: boolean;
	isEmpty: boolean;
	canSearch: boolean;
}

export function useCalendarSearch({
	initialQuery = '',
	initialFilters = {},
	enabled = true,
}: UseCalendarSearchProps = {}): UseCalendarSearchReturn {
	const [query, setQuery] = useState(initialQuery);
	const [filters, setFilters] = useState<SearchFilters>(initialFilters);
	const [searchType, setSearchType] = useState<'events' | 'transactions'>('events');

	// Buscar eventos financeiros
	const eventsQuery = useQuery({
		queryKey: ['calendar', 'events', 'search', query.trim(), filters],
		queryFn: async () => {
			const response = await apiClient.get<ApiResponse<FinancialEvent[]>>(
				'/v1/calendar/events/search',
				{
					params: {
						categoryId: filters.categoryId,
						endDate: filters.endDate,
						limit: 20,
						query: query.trim(),
						startDate: filters.startDate,
					},
				},
			);
			return response.data;
		},
		enabled: enabled && searchType === 'events' && query.trim().length > 0,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	// Buscar transações
	const transactionsQuery = useQuery({
		queryKey: ['calendar', 'transactions', 'search', query.trim(), filters],
		queryFn: async () => {
			const response = await apiClient.get<ApiResponse<Transaction[]>>(
				'/v1/calendar/transactions/search',
				{
					params: {
						accountId: filters.accountId,
						categoryId: filters.categoryId,
						endDate: filters.endDate,
						limit: 20,
						query: query.trim(),
						startDate: filters.startDate,
					},
				},
			);
			return response.data;
		},
		enabled: enabled && searchType === 'transactions' && query.trim().length > 0,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	// Computed results
	const results = useMemo(() => {
		if (searchType === 'events') {
			return eventsQuery.data || [];
		}
		return transactionsQuery.data || [];
	}, [searchType, eventsQuery.data, transactionsQuery.data]);

	// Loading state
	const isLoading = useMemo(() => {
		if (searchType === 'events') {
			return eventsQuery.isLoading;
		}
		return transactionsQuery.isLoading;
	}, [searchType, eventsQuery.isLoading, transactionsQuery.isLoading]);

	// Error state
	const error = useMemo(() => {
		if (searchType === 'events') {
			return eventsQuery.error;
		}
		return transactionsQuery.error;
	}, [searchType, eventsQuery.error, transactionsQuery.error]);

	// Handlers
	const handleQueryChange = useCallback((newQuery: string) => {
		setQuery(newQuery);
	}, []);

	const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
		setFilters((prev) => ({ ...prev, ...newFilters }));
	}, []);

	const handleSearchTypeChange = useCallback((newType: 'events' | 'transactions') => {
		setSearchType(newType);
	}, []);

	const clearSearch = useCallback(() => {
		setQuery('');
		setFilters({});
	}, []);

	// Reset query
	const resetQuery = useCallback(() => {
		setQuery(initialQuery);
		setFilters(initialFilters);
		setSearchType('events');
	}, [initialQuery, initialFilters]);

	return {
		// State
		query,
		filters,
		searchType,

		// Results
		results,
		isLoading,
		error,

		// Handlers
		handleQueryChange,
		handleFiltersChange,
		handleSearchTypeChange,
		clearSearch,
		resetQuery,

		// Computed
		hasResults: results.length > 0,
		isEmpty: !(isLoading || error) && results.length === 0 && query.trim().length > 0,
		canSearch: query.trim().length > 0,
	};
}
