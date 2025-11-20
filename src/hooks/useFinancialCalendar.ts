import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { trpc } from '@/lib/trpc';

/**
 * Hook para gerenciar eventos financeiros
 */
export function useFinancialEvents(filters?: {
  startDate?: string;
  endDate?: string;
  typeId?: string;
  isCompleted?: boolean;
  categoryId?: string;
}) {
  const utils = trpc.useUtils();

  const {
    data: events,
    isLoading,
    error,
    refetch,
  } = trpc.calendar.getEvents.useQuery(filters || {});

  const { mutate: createEvent, isPending: isCreating } = trpc.calendar.create.useMutation({
    onSuccess: () => {
      utils.calendar.getEvents.invalidate();
      toast.success('Evento financeiro criado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar evento financeiro');
    },
  });

  const { mutate: updateEvent, isPending: isUpdating } = trpc.calendar.update.useMutation({
    onSuccess: () => {
      utils.calendar.getEvents.invalidate();
      toast.success('Evento financeiro atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar evento financeiro');
    },
  });

  const { mutate: deleteEvent, isPending: isDeleting } = trpc.calendar.delete.useMutation({
    onSuccess: () => {
      utils.calendar.getEvents.invalidate();
      toast.success('Evento financeiro removido com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao remover evento financeiro');
    },
  });

  // Real-time subscription para eventos financeiros
  useEffect(() => {
    if (!events?.length) return;

    const channel = supabase
      .channel('financial_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_events',
        },
        (_payload) => {
          utils.calendar.getEvents.invalidate();
          utils.calendar.getUpcomingEvents.invalidate();
          utils.calendar.getOverdueEvents.invalidate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [events?.length, utils.calendar]);

  return {
    events: events || [],
    isLoading,
    error,
    refetch,
    createEvent,
    updateEvent,
    deleteEvent,
    isCreating,
    isUpdating,
    isDeleting,
  };
}

/**
 * Hook para obter evento financeiro específico
 */
export function useFinancialEvent(eventId: string) {
  const {
    data: event,
    isLoading,
    error,
  } = trpc.calendar.getEventById.useQuery({ id: eventId }, { enabled: !!eventId });

  return {
    event,
    isLoading,
    error,
  };
}

/**
 * Hook para obter tipos de eventos
 */
export function useEventTypes() {
  const { data: eventTypes, isLoading, error } = trpc.calendar.getEventTypes.useQuery();

  return {
    eventTypes: eventTypes || [],
    isLoading,
    error,
  };
}

/**
 * Hook para eventos próximos (próximos 30 dias)
 */
export function useUpcomingEvents() {
  const utils = trpc.useUtils();
  const { data: upcomingEvents, isLoading, error } = trpc.calendar.getUpcomingEvents.useQuery();

  // Real-time subscription para eventos próximos
  useEffect(() => {
    const channel = supabase
      .channel('upcoming_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_events',
          filter: `event_date=gte.${new Date().toISOString()}`,
        },
        () => {
          utils.calendar.getUpcomingEvents.invalidate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [utils.calendar]);

  return {
    upcomingEvents: upcomingEvents || [],
    isLoading,
    error,
  };
}

/**
 * Hook para eventos atrasados
 */
export function useOverdueEvents() {
  const utils = trpc.useUtils();
  const { data: overdueEvents, isLoading, error } = trpc.calendar.getOverdueEvents.useQuery();

  // Real-time subscription para eventos atrasados
  useEffect(() => {
    const channel = supabase
      .channel('overdue_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_events',
          filter: `due_date=lt.${new Date().toISOString()}`,
        },
        () => {
          utils.calendar.getOverdueEvents.invalidate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [utils.calendar]);

  return {
    overdueEvents: overdueEvents || [],
    isLoading,
    error,
  };
}

/**
 * Hook para lembretes de eventos
 */
export function useEventReminders(_eventId: string) {
  const { mutate: createReminder, isPending: isCreatingReminder } =
    trpc.calendar.createReminder.useMutation({
      onSuccess: () => {
        toast.success('Lembrete criado com sucesso!');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao criar lembrete');
      },
    });

  const { mutate: markReminderSent, isPending: isMarkingSent } =
    trpc.calendar.markReminderSent.useMutation({
      onSuccess: () => {},
      onError: (_error) => {},
    });

  return {
    createReminder,
    markReminderSent,
    isCreatingReminder,
    isMarkingSent,
  };
}

/**
 * Hook para estatísticas do calendário
 */
export function useCalendarStats() {
  const { upcomingEvents } = useUpcomingEvents();
  const { overdueEvents } = useOverdueEvents();
  const { events } = useFinancialEvents();

  const stats = useMemo(() => {
    const today = new Date();
    const thisMonth =
      events?.filter((event) => {
        const eventDate = new Date(event.event_date);
        return (
          eventDate.getMonth() === today.getMonth() &&
          eventDate.getFullYear() === today.getFullYear()
        );
      }) || [];

    const completedThisMonth = thisMonth.filter((event) => event.is_completed).length;
    const totalThisMonth = thisMonth.length;
    const completionRate = totalThisMonth > 0 ? (completedThisMonth / totalThisMonth) * 100 : 0;

    return {
      upcomingEvents: upcomingEvents.length,
      overdueEvents: overdueEvents.length,
      totalEvents: events?.length || 0,
      eventsThisMonth: totalThisMonth,
      completedThisMonth,
      completionRate,
      urgentEvents: upcomingEvents.filter(
        (event) => event.priority === 'high' || event.priority === 'medium'
      ).length,
      highPriorityEvents: upcomingEvents.filter((event) => event.priority === 'high').length,
    };
  }, [upcomingEvents, overdueEvents, events]);

  return stats;
}

/**
 * Hook para eventos do dia específico
 */
export function useDayEvents(date: string) {
  const {
    data: dayEvents,
    isLoading,
    error,
  } = trpc.calendar.getEvents.useQuery(
    {
      startDate: date,
      endDate: date,
    },
    {
      enabled: !!date,
    }
  );

  return {
    dayEvents: dayEvents || [],
    isLoading,
    error,
  };
}

/**
 * Hook para eventos do mês específico
 */
export function useMonthEvents(year: number, month: number) {
  const startDate = new Date(year, month, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const {
    data: monthEvents,
    isLoading,
    error,
  } = trpc.calendar.getEvents.useQuery(
    {
      startDate,
      endDate,
    },
    {
      enabled: !!year && month >= 0 && month <= 11,
    }
  );

  return {
    monthEvents: monthEvents || [],
    isLoading,
    error,
  };
}

/**
 * Hook para busca rápida de eventos
 */
export function useEventSearch(query: string) {
  const {
    data: searchResults,
    isLoading,
    error,
  } = trpc.calendar.getEvents.useQuery(
    {
      startDate: new Date(0).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
    {
      enabled: !!query && query.length >= 2,
      select: (data) => {
        if (!query) return data;
        return (
          data?.filter(
            (event) =>
              event.title.toLowerCase().includes(query.toLowerCase()) ||
              event.description?.toLowerCase().includes(query.toLowerCase())
          ) || []
        );
      },
    }
  );

  return {
    searchResults: searchResults || [],
    isLoading,
    error,
  };
}
