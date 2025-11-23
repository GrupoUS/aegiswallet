import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '../lib/trpc';

export function useGoogleCalendarSync() {
  const utils = trpc.useContext();
  const [isSyncing, setIsSyncing] = useState(false);

  // Queries
  const { data: syncStatus, isLoading: isLoadingStatus } =
    trpc.googleCalendar.getSyncStatus.useQuery();
  const { data: settings, isLoading: isLoadingSettings } =
    trpc.googleCalendar.getSyncSettings.useQuery();

  // Mutations
  const updateSettingsMutation = trpc.googleCalendar.updateSyncSettings.useMutation({
    onError: (error: { message: string }) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Configurações atualizadas');
      utils.googleCalendar.getSyncSettings.invalidate();
      utils.googleCalendar.getSyncStatus.invalidate();
    },
  });

  const requestFullSyncMutation = trpc.googleCalendar.requestFullSync.useMutation({
    onError: (error: { message: string }) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    },
    onMutate: () => setIsSyncing(true),
    onSettled: () => setIsSyncing(false),
    onSuccess: (data: { processed?: number }) => {
      toast.success(`Sincronização completa: ${data.processed ?? 0} eventos processados`);
      utils.googleCalendar.getSyncStatus.invalidate();
      utils.googleCalendar.getSyncHistory.invalidate();
    },
  });

  const requestIncrementalSyncMutation = trpc.googleCalendar.requestIncrementalSync.useMutation({
    onError: (error: { message: string }) => {
      toast.error(`Erro na sincronização incremental: ${error.message}`);
    },
    onMutate: () => setIsSyncing(true),
    onSettled: () => setIsSyncing(false),
    onSuccess: (data: { processed: number }) => {
      if (data.processed && data.processed > 0) {
        toast.success(`${data.processed} eventos sincronizados`);
      }
      utils.googleCalendar.getSyncStatus.invalidate();
    },
  });

  const syncEventMutation = trpc.googleCalendar.syncEvent.useMutation({
    onSuccess: () => {
      // Silent success usually, or visual indicator update
      utils.googleCalendar.getSyncStatus.invalidate();
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
