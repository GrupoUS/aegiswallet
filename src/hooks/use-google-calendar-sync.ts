import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { CalendarSyncSettings } from '@/types/google-calendar';

// Response types for API endpoints
interface SyncStatusResponse {
  data: {
    isConnected: boolean;
    isEnabled: boolean;
    lastSyncAt: string | null;
    googleEmail: string | null;
  };
  meta: {
    requestId: string;
    retrievedAt: string;
  };
}

interface SyncSettingsResponse {
  data: CalendarSyncSettings | null;
  meta: {
    requestId: string;
    retrievedAt: string;
  };
}

interface FullSyncResponse {
  data: {
    success: boolean;
    message: string;
    processed: number;
  };
  meta: {
    requestId: string;
    requestedAt: string;
  };
}

interface IncrementalSyncResponse {
  data: {
    success: boolean;
    processed: number;
  };
  meta: {
    requestId: string;
    requestedAt: string;
  };
}

interface SyncEventResponse {
  data: {
    success: boolean;
    eventId: string;
  };
  meta: {
    requestId: string;
    requestedAt: string;
  };
}

interface UpdateSettingsResponse {
  data: CalendarSyncSettings;
  meta: {
    requestId: string;
    updatedAt: string;
  };
}

export function useGoogleCalendarSync() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  // Queries
  const { data: syncStatusData, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['google-calendar', 'sync', 'status'],
    queryFn: async () => {
      const response = await apiClient.get<SyncStatusResponse>('/v1/google-calendar/sync/status');
      return response.data;
    },
  });

  const { data: settingsData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['google-calendar', 'sync', 'settings'],
    queryFn: async () => {
      const response = await apiClient.get<SyncSettingsResponse>(
        '/v1/google-calendar/sync/settings'
      );
      return response.data;
    },
  });

  // Extract the actual data from responses
  const syncStatus = syncStatusData;
  const settings = settingsData;

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: async (input: Partial<CalendarSyncSettings>) => {
      const response = await apiClient.put<UpdateSettingsResponse>(
        '/v1/google-calendar/sync/settings',
        input
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Configurações atualizadas');
      queryClient.invalidateQueries({ queryKey: ['google-calendar', 'sync', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar', 'sync', 'status'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const requestFullSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<FullSyncResponse>('/v1/google-calendar/sync/full');
      return response.data;
    },
    onMutate: () => setIsSyncing(true),
    onSettled: () => setIsSyncing(false),
    onSuccess: (data) => {
      toast.success(`Sincronização completa: ${data.processed ?? 0} eventos processados`);
      queryClient.invalidateQueries({ queryKey: ['google-calendar', 'sync', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar', 'sync', 'history'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    },
  });

  const requestIncrementalSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<IncrementalSyncResponse>(
        '/v1/google-calendar/sync/incremental'
      );
      return response.data;
    },
    onMutate: () => setIsSyncing(true),
    onSettled: () => setIsSyncing(false),
    onSuccess: (data) => {
      if (data.processed && data.processed > 0) {
        toast.success(`${data.processed} eventos sincronizados`);
      }
      queryClient.invalidateQueries({ queryKey: ['google-calendar', 'sync', 'status'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro na sincronização incremental: ${error.message}`);
    },
  });

  const syncEventMutation = useMutation({
    mutationFn: async (input: { eventId: string; direction: 'to_google' | 'from_google' }) => {
      const response = await apiClient.post<SyncEventResponse>(
        '/v1/google-calendar/sync/event',
        input
      );
      return response.data;
    },
    onSuccess: () => {
      // Silent success usually, or visual indicator update
      queryClient.invalidateQueries({ queryKey: ['google-calendar', 'sync', 'status'] });
    },
  });

  // Actions
  const startOAuthFlow = async () => {
    try {
      const { supabase } = await import('../integrations/supabase/client');
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth?action=start`,
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : undefined
      );
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to get auth URL');
      }
    } catch (_error) {
      toast.error('Erro ao iniciar autenticação com Google');
    }
  };

  const syncEvent = async (
    eventId: string,
    direction: 'to_google' | 'from_google' = 'to_google'
  ) => {
    if (!syncStatus?.isConnected || !settings?.sync_enabled) {
      return;
    }
    try {
      await syncEventMutation.mutateAsync({ direction, eventId });
    } catch (_error) {
      toast.error('Falha ao sincronizar evento');
    }
  };

  const syncNow = () => {
    requestFullSyncMutation.mutate();
  };

  const runIncrementalSync = requestIncrementalSyncMutation.mutate;

  // Auto-sync logic
  useEffect(() => {
    if (!settings?.sync_enabled || !settings.auto_sync_interval_minutes) {
      return;
    }

    const intervalMs = settings.auto_sync_interval_minutes * 60 * 1000;
    const intervalId = setInterval(() => {
      // Only sync if tab is visible
      if (document.visibilityState === 'visible') {
        runIncrementalSync();
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [settings?.sync_enabled, settings?.auto_sync_interval_minutes, runIncrementalSync]);

  return {
    isConnected: !!syncStatus?.isConnected,
    isLoading: isLoadingStatus || isLoadingSettings,
    isSyncing,
    requestFullSync: requestFullSyncMutation.mutate,
    requestIncrementalSync: requestIncrementalSyncMutation.mutate,
    settings,
    startOAuthFlow,
    syncNow,
    syncSingleEvent: syncEvent,
    syncStatus,
    updateSettings: updateSettingsMutation.mutate,
  };
}
