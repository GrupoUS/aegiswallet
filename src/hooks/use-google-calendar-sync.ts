/**
 * Google Calendar Sync Hook - Complete Implementation
 *
 * React hook for managing Google Calendar synchronization
 * with real-time status updates and error handling.
 *
 * @file src/hooks/use-google-calendar-sync.ts
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api-client';

// ========================================
// TYPES
// ========================================

export interface GoogleCalendarStatus {
	isConnected: boolean;
	isEnabled: boolean;
	googleEmail: string | null;
	lastSyncAt: string | null;
	channelExpiresAt: string | null;
}

export interface GoogleCalendarSettings {
	userId: string;
	syncEnabled: boolean;
	syncDirection: 'one_way_to_google' | 'one_way_from_google' | 'bidirectional';
	syncFinancialAmounts: boolean;
	syncCategories: string[] | null;
	autoSyncIntervalMinutes: number;
	defaultCalendarId: string;
	lgpdConsentGiven: boolean;
	lgpdConsentTimestamp: string | null;
	lastFullSyncAt: string | null;
	lastIncrementalSyncAt: string | null;
	channelExpiryAt: string | null;
}

export interface UpdateSettingsInput {
	syncEnabled?: boolean;
	syncDirection?: 'one_way_to_google' | 'one_way_from_google' | 'bidirectional';
	syncFinancialAmounts?: boolean;
	syncCategories?: string[] | null;
	autoSyncIntervalMinutes?: number;
	defaultCalendarId?: string;
	lgpdConsentGiven?: boolean;
}

export interface SyncResult {
	success: boolean;
	syncedCount: number;
	errors: Array<{ eventId: string; error: string }>;
	nextSyncToken?: string;
}

export interface SyncAuditEntry {
	id: string;
	userId: string;
	action: string;
	eventId: string | null;
	googleEventId: string | null;
	success: boolean;
	errorMessage: string | null;
	details: Record<string, any> | null;
	createdAt: string;
}

export interface SyncConflict {
	id: string;
	userId: string;
	financialEventId: string;
	googleEventId: string;
	syncStatus: 'conflict';
	lastSyncedAt: string;
	errorMessage: string | null;
}

// ========================================
// QUERY KEYS
// ========================================

export const googleCalendarKeys = {
	all: ['google-calendar'] as const,
	status: () => [...googleCalendarKeys.all, 'status'] as const,
	settings: () => [...googleCalendarKeys.all, 'settings'] as const,
	history: (params?: { limit?: number; offset?: number }) =>
		[...googleCalendarKeys.all, 'history', params] as const,
	conflicts: () => [...googleCalendarKeys.all, 'conflicts'] as const,
};

// ========================================
// API FUNCTIONS
// ========================================

async function fetchStatus(): Promise<GoogleCalendarStatus> {
	const response = await api.get<{ data: GoogleCalendarStatus }>(
		'/v1/google-calendar/sync/status',
	);
	return response.data;
}

async function fetchSettings(): Promise<GoogleCalendarSettings | null> {
	const response = await api.get<{ data: GoogleCalendarSettings | null }>(
		'/v1/google-calendar/sync/settings',
	);
	return response.data;
}

async function updateSettings(input: UpdateSettingsInput): Promise<GoogleCalendarSettings> {
	const response = await api.put<{ data: GoogleCalendarSettings }>(
		'/v1/google-calendar/sync/settings',
		input,
	);
	return response.data;
}

async function initiateConnect(): Promise<{ authUrl: string }> {
	const response = await api.get<{ data: { authUrl: string } }>('/v1/google-calendar/connect');
	return response.data;
}

async function disconnect(): Promise<void> {
	await api.post('/v1/google-calendar/disconnect');
}

async function performFullSync(): Promise<SyncResult> {
	const response = await api.post<{ data: SyncResult }>('/v1/google-calendar/sync/full');
	return response.data;
}

async function performIncrementalSync(): Promise<SyncResult> {
	const response = await api.post<{ data: SyncResult }>('/v1/google-calendar/sync/incremental');
	return response.data;
}

async function syncEvent(eventId: string): Promise<{ synced: boolean; eventId: string }> {
	const response = await api.post<{ data: { synced: boolean; eventId: string } }>(
		'/v1/google-calendar/sync/event',
		{ eventId },
	);
	return response.data;
}

async function renewChannel(): Promise<{ renewed: boolean; channelExpiresAt: string }> {
	const response = await api.post<{
		data: { renewed: boolean; channelExpiresAt: string };
	}>('/v1/google-calendar/sync/channel/renew');
	return response.data;
}

async function fetchHistory(params?: {
	limit?: number;
	offset?: number;
}): Promise<SyncAuditEntry[]> {
	const searchParams = new URLSearchParams();
	if (params?.limit) searchParams.set('limit', params.limit.toString());
	if (params?.offset) searchParams.set('offset', params.offset.toString());

	const response = await api.get<{ data: SyncAuditEntry[] }>(
		`/v1/google-calendar/sync/history?${searchParams.toString()}`,
	);
	return response.data;
}

async function fetchConflicts(): Promise<SyncConflict[]> {
	const response = await api.get<{ data: SyncConflict[] }>(
		'/v1/google-calendar/sync/conflicts',
	);
	return response.data;
}

// ========================================
// HOOKS
// ========================================

/**
 * Hook to get Google Calendar connection status
 */
export function useGoogleCalendarStatus() {
	return useQuery({
		queryKey: googleCalendarKeys.status(),
		queryFn: fetchStatus,
		staleTime: 30 * 1000, // 30 seconds
		refetchOnWindowFocus: true,
	});
}

/**
 * Hook to get Google Calendar sync settings
 */
export function useGoogleCalendarSettings() {
	return useQuery({
		queryKey: googleCalendarKeys.settings(),
		queryFn: fetchSettings,
		staleTime: 60 * 1000, // 1 minute
	});
}

/**
 * Hook to update sync settings
 */
export function useUpdateGoogleCalendarSettings() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateSettings,
		onSuccess: (data) => {
			queryClient.setQueryData(googleCalendarKeys.settings(), data);
			queryClient.invalidateQueries({ queryKey: googleCalendarKeys.status() });
			toast.success('Configurações atualizadas');
		},
		onError: (error: any) => {
			const message =
				error?.response?.data?.message || 'Erro ao atualizar configurações';
			toast.error(message);
		},
	});
}

/**
 * Hook to connect to Google Calendar
 */
export function useConnectGoogleCalendar() {
	return useMutation({
		mutationFn: initiateConnect,
		onSuccess: (data) => {
			// Redirect to Google OAuth
			window.location.href = data.authUrl;
		},
		onError: (error: any) => {
			const message =
				error?.response?.data?.message || 'Erro ao conectar com Google Calendar';
			toast.error(message);
		},
	});
}

/**
 * Hook to disconnect from Google Calendar
 */
export function useDisconnectGoogleCalendar() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: disconnect,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: googleCalendarKeys.all });
			toast.success('Google Calendar desconectado');
		},
		onError: (error: any) => {
			const message =
				error?.response?.data?.message || 'Erro ao desconectar do Google Calendar';
			toast.error(message);
		},
	});
}

/**
 * Hook to perform full sync
 */
export function useFullSync() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: performFullSync,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: googleCalendarKeys.status() });
			queryClient.invalidateQueries({ queryKey: ['financial-events'] });

			if (data.success) {
				toast.success(`Sincronização completa: ${data.syncedCount} eventos`);
			} else {
				toast.warning(`Sincronização parcial: ${data.errors.length} erros`);
			}
		},
		onError: (error: any) => {
			const message =
				error?.response?.data?.message || 'Erro na sincronização completa';
			toast.error(message);
		},
	});
}

/**
 * Hook to perform incremental sync
 */
export function useIncrementalSync() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: performIncrementalSync,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: googleCalendarKeys.status() });
			queryClient.invalidateQueries({ queryKey: ['financial-events'] });

			if (data.syncedCount > 0) {
				toast.success(`${data.syncedCount} eventos sincronizados`);
			}
		},
		onError: (error: any) => {
			const message =
				error?.response?.data?.message || 'Erro na sincronização';
			toast.error(message);
		},
	});
}

/**
 * Hook to sync a single event
 */
export function useSyncEvent() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: syncEvent,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: googleCalendarKeys.status() });
			toast.success('Evento sincronizado');
		},
		onError: (error: any) => {
			const message =
				error?.response?.data?.message || 'Erro ao sincronizar evento';
			toast.error(message);
		},
	});
}

/**
 * Hook to renew webhook channel
 */
export function useRenewChannel() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: renewChannel,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: googleCalendarKeys.status() });
			toast.success('Canal de notificações renovado');
		},
		onError: (error: any) => {
			const message =
				error?.response?.data?.message || 'Erro ao renovar canal';
			toast.error(message);
		},
	});
}

/**
 * Hook to get sync history
 */
export function useGoogleCalendarHistory(params?: { limit?: number; offset?: number }) {
	return useQuery({
		queryKey: googleCalendarKeys.history(params),
		queryFn: () => fetchHistory(params),
		staleTime: 60 * 1000, // 1 minute
	});
}

/**
 * Hook to get sync conflicts
 */
export function useGoogleCalendarConflicts() {
	return useQuery({
		queryKey: googleCalendarKeys.conflicts(),
		queryFn: fetchConflicts,
		staleTime: 30 * 1000, // 30 seconds
	});
}

// ========================================
// COMBINED HOOK
// ========================================

/**
 * Combined hook for Google Calendar sync functionality
 * Provides all necessary state and actions in one place
 */
export function useGoogleCalendarSync() {
	const statusQuery = useGoogleCalendarStatus();
	const settingsQuery = useGoogleCalendarSettings();
	const conflictsQuery = useGoogleCalendarConflicts();

	const connectMutation = useConnectGoogleCalendar();
	const disconnectMutation = useDisconnectGoogleCalendar();
	const updateSettingsMutation = useUpdateGoogleCalendarSettings();
	const fullSyncMutation = useFullSync();
	const incrementalSyncMutation = useIncrementalSync();
	const syncEventMutation = useSyncEvent();
	const renewChannelMutation = useRenewChannel();

	// Computed values
	const isConnected = statusQuery.data?.isConnected ?? false;
	const isEnabled = statusQuery.data?.isEnabled ?? false;
	const isSyncing =
		fullSyncMutation.isPending || incrementalSyncMutation.isPending;
	const hasConflicts = (conflictsQuery.data?.length ?? 0) > 0;

	// Channel expiry warning (< 24 hours)
	const channelExpiresAt = statusQuery.data?.channelExpiresAt;
	const isChannelExpiringSoon = channelExpiresAt
		? new Date(channelExpiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000
		: false;

	return {
		// State
		status: statusQuery.data,
		settings: settingsQuery.data,
		conflicts: conflictsQuery.data,

		// Loading states
		isLoading: statusQuery.isLoading || settingsQuery.isLoading,
		isRefetching: statusQuery.isRefetching,
		isSyncing,

		// Computed
		isConnected,
		isEnabled,
		hasConflicts,
		isChannelExpiringSoon,

		// Errors
		error: statusQuery.error || settingsQuery.error,

		// Actions
		connect: connectMutation.mutate,
		disconnect: disconnectMutation.mutate,
		updateSettings: updateSettingsMutation.mutate,
		fullSync: fullSyncMutation.mutate,
		incrementalSync: incrementalSyncMutation.mutate,
		syncEvent: syncEventMutation.mutate,
		renewChannel: renewChannelMutation.mutate,

		// Mutation states for UI
		isConnecting: connectMutation.isPending,
		isDisconnecting: disconnectMutation.isPending,
		isUpdatingSettings: updateSettingsMutation.isPending,

		// Refetch
		refetch: () => {
			statusQuery.refetch();
			settingsQuery.refetch();
		},
	};
}

// ========================================
// AUTO-SYNC HOOK
// ========================================

/**
 * Hook that triggers automatic sync when financial events change
 * Use this in components that modify financial events
 */
export function useAutoSyncToGoogle() {
	const { isEnabled, syncEvent } = useGoogleCalendarSync();

	const triggerSync = (eventId: string) => {
		if (isEnabled) {
			// Delay sync slightly to allow local DB to update
			setTimeout(() => {
				syncEvent(eventId);
			}, 500);
		}
	};

	return { triggerSync, isEnabled };
}
