import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../lib/api-client';
import { supabase } from '@/integrations/supabase/client';

type SyncStatus = {
  googleEmail: string | null;
  isConnected: boolean;
  isEnabled: boolean;
  lastSyncAt: string | null;
};

type SyncSettings = {
  auto_sync_interval_minutes: number;
  created_at: string;
  last_full_sync_at?: string;
  sync_categories: string[] | null;
  sync_direction: 'one_way_to_google' | 'one_way_from_google' | 'bidirectional';
  sync_enabled: boolean;
  sync_financial_amounts: boolean;
  sync_token?: string;
  updated_at: string;
  user_id: string;
};

export function useGoogleCalendarSync() {
  const queryClient = useQueryClient();

  const { data: syncStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['google-calendar', 'sync-status'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: SyncStatus }>('/v1/google-calendar/sync/status');
      return response.data;
    },
  });

  const { data: syncSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['google-calendar', 'sync-settings'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: SyncSettings | null }>(
        '/v1/google-calendar/sync/settings'
      );
      return response.data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (
      settings: Partial<{
        auto_sync_interval_minutes: number;
        sync_categories: string[] | null;
        sync_direction: 'one_way_to_google' | 'one_way_from_google' | 'bidirectional';
        sync_enabled: boolean;
        sync_financial_amounts: boolean;
      }>
    ) => {
      const response = await apiClient.put<{ data: SyncSettings }>(
        '/v1/google-calendar/sync/settings',
        settings
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar', 'sync-settings'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar', 'sync-status'] });
      toast.success('Configurações atualizadas');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar configurações: ${error.message}`);
    },
  });

  const requestFullSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{
        data: { message: string; processed: number; success: boolean };
      }>('/v1/google-calendar/sync/full');
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      // Invalidate calendar events to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    },
  });

  const syncSingleEventMutation = useMutation({
    mutationFn: async (params: { direction: 'to_google' | 'from_google'; eventId: string }) => {
      const response = await apiClient.post<{ data: { eventId: string; success: boolean } }>(
        '/v1/google-calendar/sync/event',
        params
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] }); // Refresh calendar events
      toast.success('Evento sincronizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao sincronizar evento: ${error.message}`);
    },
  });

  const startOAuthFlow = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth?action=start`
      );
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (_error) {
      toast.error('Erro ao iniciar conexão com Google');
    }
  };

  const disconnect = async () => {
    // Call revoke endpoint with user's auth token
    try {
      // Get the current session to include the access token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth?action=revoke`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.status === 401) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        return;
      }

      if (response.ok) {
        toast.success('Conexão com Google Calendar removida');
        // Invalidate all Google Calendar related queries
        queryClient.invalidateQueries({ queryKey: ['google-calendar'] });
      } else {
        throw new Error('Falha ao remover conexão');
      }
    } catch (_error) {
      toast.error('Erro ao remover conexão com Google Calendar');
    }
  };

  // Legacy tRPC compatibility properties
  const isConnected = syncStatus?.isConnected ?? false;
  const settings = syncSettings;
  const isSyncing = requestFullSyncMutation.isPending || syncSingleEventMutation.isPending;

  return {
    syncStatus,
    syncSettings,
    settings,
    isConnected,
    isSyncing,
    isLoading: isLoadingStatus || isLoadingSettings,
    updateSettings: updateSettingsMutation.mutate,
    requestFullSync: requestFullSyncMutation.mutate,
    syncSingleEvent: syncSingleEventMutation.mutateAsync,
    syncEvent: syncSingleEventMutation.mutateAsync,
    startOAuthFlow,
    disconnect,
  };
}
