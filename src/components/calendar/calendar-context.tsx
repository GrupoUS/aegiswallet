/**
 * Calendar Context
 * Gerencia estado global do calendário financeiro
 */

import { addDays, addMonths, endOfMonth, startOfMonth, subMonths } from 'date-fns'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import type {
  CalendarCategory,
  CalendarFilter,
  CalendarSettings,
  CalendarView,
} from '@/components/ui/event-calendar/types'
import { DEFAULT_CALENDAR_CATEGORIES } from '@/components/ui/event-calendar/types'
import {
  useFinancialEventMutations,
  useFinancialEvents,
  useFinancialEventsRealtime,
} from '@/hooks/useFinancialEvents'
import type { EventColor, FinancialEvent } from '@/types/financial-events'

interface CalendarContextType {
  currentDate: Date
  setCurrentDate: (date: Date) => void
  currentView: CalendarView
  setCurrentView: (view: CalendarView) => void
  events: FinancialEvent[]
  categories: CalendarCategory[]
  filters: CalendarFilter
  setFilters: (filters: Partial<CalendarFilter>) => void
  settings: CalendarSettings
  updateSettings: (settings: Partial<CalendarSettings>) => void
  addEvent: (event: FinancialEvent) => void
  updateEvent: (event: FinancialEvent) => void
  deleteEvent: (eventId: string) => void
  getEventsForDate: (date: Date) => FinancialEvent[]
  getEventsForMonth: (date: Date) => FinancialEvent[]
  getFilteredEvents: () => FinancialEvent[]
  visibleColors: Set<EventColor>
  toggleColorVisibility: (color: EventColor) => void
  isColorVisible: (color: EventColor) => boolean
  searchEvents: (query: string) => FinancialEvent[]
  goToToday: () => void
  navigateDate: (direction: 'prev' | 'next') => void
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

// Mock data - eventos financeiros de exemplo
// Mock data removed - use only real Supabase data
// Financial events should come exclusively from the database

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [visibleColors, setVisibleColors] = useState<Set<EventColor>>(
    new Set(['emerald', 'rose', 'orange', 'blue', 'violet'])
  )

  // Use Supabase hooks
  const { events: supabaseEvents, loading, error, refetch } = useFinancialEvents()
  const {
    addEvent: addEventMutation,
    updateEvent: updateEventMutation,
    deleteEvent: deleteEventMutation,
  } = useFinancialEventMutations()

  // State for events (only from Supabase - no mock data)
  const [localEvents, setLocalEvents] = useState<FinancialEvent[]>([])
  // Enhanced states for view and filtering
  const [currentView, setCurrentView] = useState<CalendarView>('week')
  const [categories] = useState<CalendarCategory[]>(DEFAULT_CALENDAR_CATEGORIES)
  const [filters, setFilters] = useState<CalendarFilter>({})
  const [settings, setSettings] = useState<CalendarSettings>({
    defaultView: 'week',
    weekStartsOn: 0,
    timeFormat: '24h',
    timezone: 'America/Sao_Paulo',
    showWeekends: true,
    showWeekNumbers: false,
  })

  // Initialize with Supabase data only - no mock data fallback
  useEffect(() => {
    if (!loading) {
      if (error) {
        console.warn('Error loading financial events:', error)
        setLocalEvents([])
      } else {
        // Use only Supabase data, even if empty
        setLocalEvents(supabaseEvents)
      }
    }
  }, [supabaseEvents, loading, error])

  // Real-time subscription
  useFinancialEventsRealtime(() => {
    console.log('Financial events changed, refetching...')
    refetch()
  })

  const addEvent = useCallback(
    async (event: FinancialEvent) => {
      try {
        const newEvent = await addEventMutation(event)
        setLocalEvents((prev) => [...prev, newEvent])
      } catch (err) {
        console.error('Failed to add event to Supabase:', err)
        throw err
      }
    },
    [addEventMutation]
  )

  const updateEvent = useCallback(
    async (updatedEvent: FinancialEvent) => {
      try {
        await updateEventMutation(updatedEvent.id, updatedEvent)
        setLocalEvents((prev) =>
          prev.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
        )
      } catch (err) {
        console.error('Failed to update event in Supabase:', err)
        throw err
      }
    },
    [updateEventMutation]
  )

  const deleteEvent = useCallback(
    async (eventId: string) => {
      try {
        await deleteEventMutation(eventId)
        setLocalEvents((prev) => prev.filter((event) => event.id !== eventId))
      } catch (err) {
        console.error('Failed to delete event from Supabase:', err)
        throw err
      }
    },
    [deleteEventMutation]
  )

  const getEventsForDate = useCallback(
    (date: Date): FinancialEvent[] => {
      return localEvents.filter((event) => {
        const eventDate = new Date(event.start)
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        )
      })
    },
    [localEvents]
  )

  const getEventsForMonth = useCallback(
    (date: Date): FinancialEvent[] => {
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)

      return localEvents.filter((event) => {
        const eventDate = new Date(event.start)
        return eventDate >= monthStart && eventDate <= monthEnd
      })
    },
    [localEvents]
  )

  const toggleColorVisibility = useCallback((color: EventColor) => {
    setVisibleColors((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(color)) {
        newSet.delete(color)
      } else {
        newSet.add(color)
      }
      return newSet
    })
  }, [])

  const isColorVisible = useCallback(
    (color: EventColor): boolean => {
      return visibleColors.has(color)
    },
    [visibleColors]
  )

  // Enhanced filtering functions
  const getFilteredEvents = useCallback((): FinancialEvent[] => {
    let filteredEvents = localEvents

    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      filteredEvents = filteredEvents.filter((event) =>
        filters.categories!.includes(event.category || '')
      )
    }

    // Filter by date range
    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      filteredEvents = filteredEvents.filter((event) => {
        const eventDate = new Date(event.start)
        return eventDate >= start && eventDate <= end
      })
    }

    // Filter by search query
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredEvents = filteredEvents.filter(
        (event) =>
          event.title.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower)
      )
    }

    // Filter by status
    if (filters.status && filters.status.length > 0) {
      filteredEvents = filteredEvents.filter((event) =>
        filters.status!.includes(event.status || '')
      )
    }

    // Filter by priority
    if (filters.priority && filters.priority.length > 0) {
      filteredEvents = filteredEvents.filter((event) => {
        const priority =
          event.amount && Math.abs(event.amount) > 1000
            ? 'high'
            : event.amount && Math.abs(event.amount) > 500
              ? 'medium'
              : 'low'
        return filters.priority!.includes(priority)
      })
    }

    return filteredEvents
  }, [localEvents, filters])

  // Search function
  const searchEvents = useCallback(
    (query: string): FinancialEvent[] => {
      if (!query.trim()) return localEvents

      const searchLower = query.toLowerCase()
      return localEvents.filter(
        (event) =>
          event.title.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.category?.toLowerCase().includes(searchLower)
      )
    },
    [localEvents]
  )

  // Navigation functions
  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  const navigateDate = useCallback(
    (direction: 'prev' | 'next') => {
      setCurrentDate((prev) => {
        if (currentView === 'month') {
          return direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
        } else if (currentView === 'week') {
          return direction === 'prev' ? addDays(prev, -7) : addDays(prev, 7)
        } else {
          return direction === 'prev' ? addDays(prev, -1) : addDays(prev, 1)
        }
      })
    },
    [currentView]
  )

  // Settings update function
  const updateSettings = useCallback((newSettings: Partial<CalendarSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }, [])

  // Filter update function
  const setFiltersCallback = useCallback((newFilters: Partial<CalendarFilter>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const value: CalendarContextType = {
    currentDate,
    setCurrentDate,
    currentView,
    setCurrentView,
    events: localEvents,
    categories,
    filters,
    setFilters: setFiltersCallback,
    settings,
    updateSettings,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForMonth,
    getFilteredEvents,
    visibleColors,
    toggleColorVisibility,
    isColorVisible,
    searchEvents,
    goToToday,
    navigateDate,
  }

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}

export function useCalendar() {
  const context = useContext(CalendarContext)
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider')
  }
  return context
}
