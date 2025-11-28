/**
 * Google Calendar Sync Hook
 * 
 * NOTE: Google Calendar sync functionality was implemented using Supabase Edge Functions.
 * After migration to Neon/Clerk, this feature needs to be re-architected.
 * 
 * Current status: DEPRECATED - Returns stub data
 * TODO: Implement using Vercel Functions or similar serverless platform
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

	// Stub sync status - not connected
	const { data: syncStatus, isLoading: isLoadingStatus } = useQuery({
		queryKey: ['google-calendar', 'sync-status'],
		queryFn: async (): Promise<SyncStatus> => {
			// Return disconnected status until feature is re-implemented
			return {
				googleEmail: null,
				isConnected: false,
				isEnabled: false,
				lastSyncAt: null,
			};
		},
	});

	const { data: syncSettings, isLoading: isLoadingSettings } = useQuery({
		queryKey: ['google-calendar', 'sync-settings'],
		queryFn: async (): Promise<SyncSettings | null> => {
			// Return null until feature is re-implemented
			return null;
		},
	});

	const updateSettingsMutation = useMutation({
		mutationFn: async (_settings: Partial<{
			auto_sync_interval_minutes: number;
			sync_categories: string[] | null;
			sync_direction: 'one_way_to_google' | 'one_way_from_google' | 'bidirectional';
			sync_enabled: boolean;
			sync_financial_amounts: boolean;
		}>): Promise<SyncSettings> => {
			throw new Error('Sincronização com Google Calendar temporariamente indisponível');
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const requestFullSyncMutation = useMutation({
		mutationFn: async () => {
			throw new Error('Sincronização com Google Calendar temporariamente indisponível');
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const syncSingleEventMutation = useMutation({
		mutationFn: async (_params: {
			direction: 'to_google' | 'from_google';
			eventId: string;
		}) => {
			throw new Error('Sincronização com Google Calendar temporariamente indisponível');
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});


	const startOAuthFlow = async () => {
		toast.error('Conexão com Google Calendar temporariamente indisponível');
	};

	const disconnect = async () => {
		toast.info('Não há conexão ativa com Google Calendar');
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
