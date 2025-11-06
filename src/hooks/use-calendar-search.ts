import { useCallback, useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';

interface SearchFilters {
  startDate?: string;
  endDate?: string;
  typeId?: string;
  categoryId?: string;
}

interface UseCalendarSearchProps {
  initialQuery?: string;
  initialFilters?: SearchFilters;
  enabled?: boolean;
}

export function useCalendarSearch({
  initialQuery = '',
  initialFilters = {},
  enabled = true,
}: UseCalendarSearchProps = {}) {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [searchType, setSearchType] = useState<'events' | 'transactions'>('events');

  // Buscar eventos financeiros
  const eventsQuery = trpc.calendar.searchEvents.useQuery(
    {
      query: query.trim(),
      ...filters,
      limit: 20,
    },
    {
      enabled: enabled && searchType === 'events' && query.trim().length > 0,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  // Buscar transações
  const transactionsQuery = trpc.calendar.searchTransactions.useQuery(
    {
      query: query.trim(),
      ...filters,
      limit: 20,
    },
    {
      enabled: enabled && searchType === 'transactions' && query.trim().length > 0,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

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
    isEmpty: !isLoading && !error && results.length === 0 && query.trim().length > 0,
    canSearch: query.trim().length > 0,
  };
}
