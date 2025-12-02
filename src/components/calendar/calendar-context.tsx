/**
 * Calendar Context
 * Gerencia estado global do calendário financeiro
 */

import { addDays, addMonths, endOfMonth, startOfMonth, subMonths } from 'date-fns';
import type { ReactNode } from 'react';
import { createContext, useCallback, useMemo, useState } from 'react';

import type {
	CalendarCategory,
	CalendarFilter,
	CalendarSettings,
	CalendarView,
} from '@/components/ui/event-calendar/types';
import { DEFAULT_CALENDAR_CATEGORIES } from '@/components/ui/event-calendar/types';
import { useFinancialEventMutations, useFinancialEvents } from '@/hooks/useFinancialEvents';
import type { EventColor, FinancialEvent } from '@/types/financial-events';

interface CalendarContextType {
	currentDate: Date;
	setCurrentDate: (date: Date) => void;
	currentView: CalendarView;
	setCurrentView: (view: CalendarView) => void;
	events: FinancialEvent[];
	categories: CalendarCategory[];
	filters: CalendarFilter;
	setFilters: (filters: Partial<CalendarFilter>) => void;
	settings: CalendarSettings;
	updateSettings: (settings: Partial<CalendarSettings>) => void;
	addEvent: (event: FinancialEvent) => Promise<FinancialEvent>;
	updateEvent: (event: FinancialEvent) => Promise<FinancialEvent>;
	deleteEvent: (eventId: string) => Promise<void>;
	getEventsForDate: (date: Date) => FinancialEvent[];
	getEventsForMonth: (date: Date) => FinancialEvent[];
	getFilteredEvents: () => FinancialEvent[];
	visibleColors: Set<EventColor>;
	toggleColorVisibility: (color: EventColor) => void;
	isColorVisible: (color: EventColor) => boolean;
	searchEvents: (query: string) => FinancialEvent[];
	goToToday: () => void;
	navigateDate: (direction: 'prev' | 'next') => void;
}

export const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

// Re-export useCalendar for backward compatibility
export { useCalendar } from './hooks/useCalendar';

// Financial events come exclusively from the database via API

export function CalendarProvider({ children }: { children: ReactNode }) {
	const [currentDate, setCurrentDate] = useState<Date>(new Date());
	const [visibleColors, setVisibleColors] = useState<Set<EventColor>>(
		new Set(['emerald', 'rose', 'orange', 'blue', 'violet']),
	);

	// Use financial events hook (data from database via API)
	const { events: databaseEvents, loading, error } = useFinancialEvents();
	const {
		addEvent: addEventMutation,
		updateEvent: updateEventMutation,
		deleteEvent: deleteEventMutation,
	} = useFinancialEventMutations();

	// Use database events directly instead of duplicating in local state
	// This prevents infinite loops caused by useEffect syncing state
	const localEvents = useMemo(() => {
		if (loading) return [];
		if (error) return [];
		return databaseEvents ?? [];
	}, [databaseEvents, loading, error]);
	
	// Enhanced states for view and filtering
	const [currentView, setCurrentView] = useState<CalendarView>('week');
	const [categories] = useState<CalendarCategory[]>(DEFAULT_CALENDAR_CATEGORIES);
	const [filters, setFilters] = useState<CalendarFilter>({});
	const [settings, setSettings] = useState<CalendarSettings>({
		defaultView: 'week',
		showWeekNumbers: false,
		showWeekends: true,
		timeFormat: '24h',
		timezone: 'America/Sao_Paulo',
		weekStartsOn: 0,
	});

	const addEvent = useCallback(
		async (event: FinancialEvent) => {
			const newEvent = await addEventMutation(event);
			// React Query will automatically invalidate and refetch
			return newEvent;
		},
		[addEventMutation],
	);

	const updateEvent = useCallback(
		async (updatedEvent: FinancialEvent) => {
			const result = await updateEventMutation(updatedEvent.id, updatedEvent);
			// React Query will automatically invalidate and refetch
			return result;
		},
		[updateEventMutation],
	);

	const deleteEvent = useCallback(
		async (eventId: string) => {
			await deleteEventMutation(eventId);
			// React Query will automatically invalidate and refetch
		},
		[deleteEventMutation],
	);

	const getEventsForDate = useCallback(
		(date: Date): FinancialEvent[] => {
			return localEvents.filter((event) => {
				const eventDate = new Date(event.start);
				return (
					eventDate.getDate() === date.getDate() &&
					eventDate.getMonth() === date.getMonth() &&
					eventDate.getFullYear() === date.getFullYear()
				);
			});
		},
		[localEvents],
	);

	const getEventsForMonth = useCallback(
		(date: Date): FinancialEvent[] => {
			const monthStart = startOfMonth(date);
			const monthEnd = endOfMonth(date);

			return localEvents.filter((event) => {
				const eventDate = new Date(event.start);
				return eventDate >= monthStart && eventDate <= monthEnd;
			});
		},
		[localEvents],
	);

	const toggleColorVisibility = useCallback((color: EventColor) => {
		setVisibleColors((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(color)) {
				newSet.delete(color);
			} else {
				newSet.add(color);
			}
			return newSet;
		});
	}, []);

	const isColorVisible = useCallback(
		(color: EventColor): boolean => {
			return visibleColors.has(color);
		},
		[visibleColors],
	);

	// Enhanced filtering functions
	const getFilteredEvents = useCallback((): FinancialEvent[] => {
		let filteredEvents = localEvents;

		// Filter by categories
		if (filters.categories && filters.categories.length > 0) {
			filteredEvents = filteredEvents.filter((event) =>
				filters.categories?.includes(event.category || ''),
			);
		}

		// Filter by date range
		if (filters.dateRange) {
			const { start, end } = filters.dateRange;
			filteredEvents = filteredEvents.filter((event) => {
				const eventDate = new Date(event.start);
				return eventDate >= start && eventDate <= end;
			});
		}

		// Filter by search query
		if (filters.search) {
			const searchLower = filters.search.toLowerCase();
			filteredEvents = filteredEvents.filter(
				(event) =>
					event.title.toLowerCase().includes(searchLower) ||
					event.description?.toLowerCase().includes(searchLower),
			);
		}

		// Filter by status
		if (filters.status && filters.status.length > 0) {
			filteredEvents = filteredEvents.filter((event) =>
				filters.status?.includes(event.status || ''),
			);
		}

		// Filter by priority
		if (filters.priority && filters.priority.length > 0) {
			filteredEvents = filteredEvents.filter((event) => {
				const priority =
					event.amount && Math.abs(event.amount) > 1000
						? 'high'
						: event.amount && Math.abs(event.amount) > 500
							? 'medium'
							: 'low';
				return filters.priority?.includes(priority);
			});
		}

		return filteredEvents;
	}, [localEvents, filters]);

	// Search function
	const searchEvents = useCallback(
		(query: string): FinancialEvent[] => {
			if (!query.trim()) {
				return localEvents;
			}

			const searchLower = query.toLowerCase();
			return localEvents.filter(
				(event) =>
					event.title.toLowerCase().includes(searchLower) ||
					event.description?.toLowerCase().includes(searchLower) ||
					event.category?.toLowerCase().includes(searchLower),
			);
		},
		[localEvents],
	);

	// Navigation functions
	const goToToday = useCallback(() => {
		setCurrentDate(new Date());
	}, []);

	const navigateDate = useCallback(
		(direction: 'prev' | 'next') => {
			setCurrentDate((prev) => {
				if (currentView === 'month') {
					return direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1);
				}
				if (currentView === 'week') {
					return direction === 'prev' ? addDays(prev, -7) : addDays(prev, 7);
				}
				return direction === 'prev' ? addDays(prev, -1) : addDays(prev, 1);
			});
		},
		[currentView],
	);

	// Settings update function
	const updateSettings = useCallback((newSettings: Partial<CalendarSettings>) => {
		setSettings((prev) => ({ ...prev, ...newSettings }));
	}, []);

	// Filter update function
	const setFiltersCallback = useCallback((newFilters: Partial<CalendarFilter>) => {
		setFilters((prev) => ({ ...prev, ...newFilters }));
	}, []);

	const value = useMemo<CalendarContextType>(
		() => ({
			addEvent,
			categories,
			currentDate,
			currentView,
			deleteEvent,
			events: localEvents,
			filters,
			getEventsForDate,
			getEventsForMonth,
			getFilteredEvents,
			goToToday,
			isColorVisible,
			navigateDate,
			searchEvents,
			setCurrentDate,
			setCurrentView,
			setFilters: setFiltersCallback,
			settings,
			toggleColorVisibility,
			updateEvent,
			updateSettings,
			visibleColors,
		}),
		[
			addEvent,
			categories,
			currentDate,
			currentView,
			deleteEvent,
			localEvents,
			filters,
			getEventsForDate,
			getEventsForMonth,
			getFilteredEvents,
			goToToday,
			isColorVisible,
			navigateDate,
			searchEvents,
			setFiltersCallback,
			settings,
			toggleColorVisibility,
			updateEvent,
			updateSettings,
			visibleColors,
		],
	);

	return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}
