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
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar evento financeiro');
    },
    onSuccess: () => {
      utils.calendar.getEvents.invalidate();
      toast.success('Evento financeiro criado com sucesso!');
    },
  });

  const { mutate: updateEvent, isPending: isUpdating } = trpc.calendar.update.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar evento financeiro');
    },
    onSuccess: () => {
      utils.calendar.getEvents.invalidate();
      toast.success('Evento financeiro atualizado com sucesso!');
    },
  });

  const { mutate: deleteEvent, isPending: isDeleting } = trpc.calendar.delete.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Erro ao remover evento financeiro');
    },
    onSuccess: () => {
      utils.calendar.getEvents.invalidate();
      toast.success('Evento financeiro removido com sucesso!');
    },
  });

  // Real-time subscription para eventos financeiros
  useEffect(() => {
    if (!events?.length) {
      return;
    }

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
    createEvent,
    deleteEvent,
    error,
    events: events || [],
    isCreating,
    isDeleting,
    isLoading,
    isUpdating,
    refetch,
    updateEvent,
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
    error,
    event,
    isLoading,
  };
}

/**
 * Hook para obter tipos de eventos
 */
export function useEventTypes() {
  const { data: eventTypes, isLoading, error } = trpc.calendar.getEventTypes.useQuery();

  return {
    error,
    eventTypes: eventTypes || [],
    isLoading,
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
          filter: `event_date=gte.${new Date().toISOString()}`,
          schema: 'public',
          table: 'financial_events',
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
    error,
    isLoading,
    upcomingEvents: upcomingEvents || [],
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
          filter: `due_date=lt.${new Date().toISOString()}`,
          schema: 'public',
          table: 'financial_events',
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
    error,
    isLoading,
    overdueEvents: overdueEvents || [],
  };
}

/**
 * Hook para lembretes de eventos
 */
export function useEventReminders(_eventId: string) {
  const { mutate: createReminder, isPending: isCreatingReminder } =
    trpc.calendar.createReminder.useMutation({
      onError: (error) => {
        toast.error(error.message || 'Erro ao criar lembrete');
      },
      onSuccess: () => {
        toast.success('Lembrete criado com sucesso!');
      },
    });

  const { mutate: markReminderSent, isPending: isMarkingSent } =
    trpc.calendar.markReminderSent.useMutation({
      onError: (_error) => {},
      onSuccess: () => {},
    });

  return {
    createReminder,
    isCreatingReminder,
    isMarkingSent,
    markReminderSent,
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
      completedThisMonth,
      completionRate,
      eventsThisMonth: totalThisMonth,
      highPriorityEvents: upcomingEvents.filter((event) => event.priority === 'high').length,
      overdueEvents: overdueEvents.length,
      totalEvents: events?.length || 0,
      upcomingEvents: upcomingEvents.length,
      urgentEvents: upcomingEvents.filter(
        (event) => event.priority === 'high' || event.priority === 'medium'
      ).length,
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
      endDate: date,
      startDate: date,
    },
    {
      enabled: !!date,
    }
  );

  return {
    dayEvents: dayEvents || [],
    error,
    isLoading,
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
      endDate,
      startDate,
    },
    {
      enabled: !!year && month >= 0 && month <= 11,
    }
  );

  return {
    error,
    isLoading,
    monthEvents: monthEvents || [],
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
      endDate: new Date().toISOString().split('T')[0],
      startDate: new Date(0).toISOString().split('T')[0],
    },
    {
      enabled: !!query && query.length >= 2,
      select: (data) => {
        if (!query) {
          return data;
        }
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
    error,
    isLoading,
    searchResults: searchResults || [],
  };
}
