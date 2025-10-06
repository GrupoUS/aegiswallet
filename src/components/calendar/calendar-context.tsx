/**
 * Calendar Context
 * Gerencia estado global do calendário financeiro
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { addDays, setHours, setMinutes, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import type { FinancialEvent, EventColor } from '@/types/financial-events'
import {
  useFinancialEvents,
  useFinancialEventMutations,
  useFinancialEventsRealtime,
} from '@/hooks/useFinancialEvents'

import type {
  CalendarView,
  CalendarCategory,
  CalendarFilter,
  CalendarSettings,
} from '@/components/ui/event-calendar/types'
import { DEFAULT_CALENDAR_CATEGORIES } from '@/components/ui/event-calendar/types'

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
const generateMockEvents = (): FinancialEvent[] => {
  const today = new Date()

  return [
    // Contas a pagar
    {
      id: '1',
      title: 'Energia Elétrica',
      description: 'Conta de luz mensal',
      start: setMinutes(setHours(addDays(today, 3), 9), 0),
      end: setMinutes(setHours(addDays(today, 3), 9), 30),
      type: 'bill',
      amount: -245.67,
      color: 'orange',
      icon: '⚡',
      status: 'pending',
      category: 'utilities',
      recurring: true,
    },
    {
      id: '2',
      title: 'Internet',
      description: 'Pacote fibra 500MB',
      start: setMinutes(setHours(addDays(today, -5), 10), 0),
      end: setMinutes(setHours(addDays(today, -5), 10), 30),
      type: 'bill',
      amount: -99.9,
      color: 'orange',
      icon: '🌐',
      status: 'paid',
      category: 'utilities',
      recurring: true,
    },
    {
      id: '3',
      title: 'Aluguel',
      description: 'Pagamento mensal',
      start: setMinutes(setHours(addDays(today, -10), 8), 0),
      end: setMinutes(setHours(addDays(today, -10), 8), 30),
      type: 'bill',
      amount: -1500.0,
      color: 'orange',
      icon: '🏠',
      status: 'paid',
      category: 'housing',
      recurring: true,
    },
    {
      id: '4',
      title: 'Água',
      description: 'Conta de água',
      start: setMinutes(setHours(addDays(today, 8), 14), 0),
      end: setMinutes(setHours(addDays(today, 8), 14), 30),
      type: 'bill',
      amount: -85.3,
      color: 'orange',
      icon: '💧',
      status: 'pending',
      category: 'utilities',
      recurring: true,
    },
    {
      id: '5',
      title: 'Cartão de Crédito',
      description: 'Fatura do mês',
      start: setMinutes(setHours(addDays(today, 15), 10), 0),
      end: setMinutes(setHours(addDays(today, 15), 10), 30),
      type: 'bill',
      amount: -1250.45,
      color: 'orange',
      icon: '💳',
      status: 'pending',
      category: 'credit',
      recurring: true,
    },

    // Receitas
    {
      id: '6',
      title: 'Salário',
      description: 'Pagamento mensal',
      start: setMinutes(setHours(addDays(today, 5), 9), 0),
      end: setMinutes(setHours(addDays(today, 5), 9), 30),
      type: 'income',
      amount: 3500.0,
      color: 'emerald',
      icon: '💰',
      status: 'scheduled',
      category: 'salary',
      recurring: true,
    },
    {
      id: '7',
      title: 'Freelance',
      description: 'Projeto de consultoria',
      start: setMinutes(setHours(addDays(today, -3), 14), 0),
      end: setMinutes(setHours(addDays(today, -3), 14), 30),
      type: 'income',
      amount: 1200.0,
      color: 'emerald',
      icon: '💼',
      status: 'paid',
      category: 'work',
    },

    // Despesas
    {
      id: '8',
      title: 'Supermercado',
      description: 'Compras mensais',
      start: setMinutes(setHours(today, 18), 0),
      end: setMinutes(setHours(today, 18), 30),
      type: 'expense',
      amount: -345.67,
      color: 'rose',
      icon: '🛒',
      status: 'paid',
      category: 'groceries',
    },
    {
      id: '9',
      title: 'Restaurante',
      description: 'Jantar com amigos',
      start: setMinutes(setHours(addDays(today, -2), 20), 0),
      end: setMinutes(setHours(addDays(today, -2), 22), 0),
      type: 'expense',
      amount: -125.0,
      color: 'rose',
      icon: '🍽️',
      status: 'paid',
      category: 'food',
    },
    {
      id: '10',
      title: 'Gasolina',
      description: 'Abastecimento',
      start: setMinutes(setHours(addDays(today, -7), 8), 30),
      end: setMinutes(setHours(addDays(today, -7), 9), 0),
      type: 'expense',
      amount: -180.0,
      color: 'rose',
      icon: '⛽',
      status: 'paid',
      category: 'transport',
    },

    // Transferências
    {
      id: '11',
      title: 'Transferência Poupança',
      description: 'Investimento mensal',
      start: setMinutes(setHours(addDays(today, 1), 10), 0),
      end: setMinutes(setHours(addDays(today, 1), 10), 15),
      type: 'transfer',
      amount: -500.0,
      color: 'violet',
      icon: '💸',
      status: 'scheduled',
      category: 'savings',
      recurring: true,
    },

    // Agendamentos futuros
    {
      id: '12',
      title: 'Academia',
      description: 'Mensalidade trimestral',
      start: setMinutes(setHours(addDays(today, 20), 9), 0),
      end: setMinutes(setHours(addDays(today, 20), 9), 30),
      type: 'scheduled',
      amount: -150.0,
      color: 'blue',
      icon: '💪',
      status: 'scheduled',
      category: 'health',
      recurring: true,
    },
  ]
}

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

  // State for events (either from Supabase or mock data)
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

  // Initialize with either Supabase data or mock data
  useEffect(() => {
    if (!loading) {
      if (error) {
        // If Supabase fails, use mock data
        console.warn('Using mock data because Supabase error:', error)
        setLocalEvents(generateMockEvents())
      } else if (supabaseEvents.length === 0) {
        // If no events in Supabase, seed with mock data
        console.info('No events found, using mock data')
        setLocalEvents(generateMockEvents())
      } else {
        // Use Supabase data
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
        // Fallback to local state if mutation fails
        console.error('Failed to add event to Supabase, adding locally:', err)
        setLocalEvents((prev) => [...prev, event])
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
        // Fallback to local state if mutation fails
        console.error('Failed to update event in Supabase, updating locally:', err)
        setLocalEvents((prev) =>
          prev.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
        )
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
        // Fallback to local state if mutation fails
        console.error('Failed to delete event from Supabase, deleting locally:', err)
        setLocalEvents((prev) => prev.filter((event) => event.id !== eventId))
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
      filteredEvents = filteredEvents.filter((event) =>
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
        const priority = event.amount && Math.abs(event.amount) > 1000 ? 'high' : 
                        event.amount && Math.abs(event.amount) > 500 ? 'medium' : 'low'
        return filters.priority!.includes(priority)
      })
    }

    return filteredEvents
  }, [localEvents, filters])

  // Search function
  const searchEvents = useCallback((query: string): FinancialEvent[] => {
    if (!query.trim()) return localEvents
    
    const searchLower = query.toLowerCase()
    return localEvents.filter((event) =>
      event.title.toLowerCase().includes(searchLower) ||
      event.description?.toLowerCase().includes(searchLower) ||
      event.category?.toLowerCase().includes(searchLower)
    )
  }, [localEvents])

  // Navigation functions
  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      if (currentView === 'month') {
        return direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
      } else if (currentView === 'week') {
        return direction === 'prev' ? addDays(prev, -7) : addDays(prev, 7)
      } else {
        return direction === 'prev' ? addDays(prev, -1) : addDays(prev, 1)
      }
    })
  }, [currentView])

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
