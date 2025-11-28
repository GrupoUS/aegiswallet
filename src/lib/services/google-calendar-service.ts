/**
 * Google Calendar Service
 *
 * Central service class for Google Calendar integration.
 * Encapsulates core operations for OAuth, sync, and channel management.
 *
 * NOTE: This service requires external Google Calendar API integration.
 * Database operations have been converted from Supabase to API-based calls.
 */

import { apiClient } from '@/lib/api-client';
import type {
	CalendarSyncMapping,
	CalendarSyncSettings,
	ChannelInfo,
	SyncDirectionEnum,
	SyncResult,
} from '@/types/google-calendar';

// Environment configuration interface
interface GoogleCalendarConfig {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	apiBaseUrl: string;
}

// Full sync options
interface FullSyncOptions {
	timeRangeMs?: number; // Default: 30 days
	includePush?: boolean; // Push local events to Google
}

// Incremental sync options
interface IncrementalSyncOptions {
	syncToken?: string;
}

/**
 * GoogleCalendarService
 *
 * Provides a cohesive abstraction for all Google Calendar operations.
 * Used by Hono routes and can be used by future consumers.
 */
export class GoogleCalendarService {
	private config: GoogleCalendarConfig;
	private userId: string;
	private authToken: string;

	constructor(config: GoogleCalendarConfig, userId: string, authToken: string) {
		this.config = config;
		this.userId = userId;
		this.authToken = authToken;
	}

	/**
	 * Generate OAuth URL for Google Calendar authorization
	 */
	async getAuthUrl(): Promise<string> {
		const scope =
			'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email';
		const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.config.clientId}&redirect_uri=${encodeURIComponent(this.config.redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
		return authUrl;
	}

	/**
	 * Handle OAuth callback and store tokens
	 */
	async handleCallback(
		code: string,
	): Promise<{ success: boolean; email?: string }> {
		const response = await this.invokeEdgeFunction('google-calendar-auth', {
			action: 'callback',
			code,
		});

		return response as { success: boolean; email?: string };
	}

	/**
	 * Sync a single event to Google Calendar
	 */
	async syncEventToGoogle(eventId: string): Promise<SyncResult> {
		const response = await this.invokeEdgeFunction('google-calendar-sync', {
			action: 'sync_to_google',
			event_id: eventId,
		});

		return {
			success: (response.success as boolean) ?? false,
			skipped: response.skipped as boolean | undefined,
			reason: response.reason as string | undefined,
			google_id: response.google_id as string | undefined,
			deleted: response.deleted as boolean | undefined,
		};
	}

	/**
	 * Sync a single event from Google Calendar
	 */
	async syncEventFromGoogle(googleEventId: string): Promise<SyncResult> {
		const response = await this.invokeEdgeFunction('google-calendar-sync', {
			action: 'sync_from_google',
			google_event_id: googleEventId,
		});

		return {
			success: (response.success as boolean) ?? false,
			skipped: response.skipped as boolean | undefined,
			reason: response.reason as string | undefined,
			event_id: response.event_id as string | undefined,
			created: response.created as boolean | undefined,
			updated: response.updated as boolean | undefined,
			deleted: response.deleted as boolean | undefined,
		};
	}

	/**
	 * Perform a full synchronization
	 */
	async fullSync(options?: FullSyncOptions): Promise<SyncResult> {
		const response = await this.invokeEdgeFunction('google-calendar-sync', {
			action: 'full_sync',
			time_range_ms: options?.timeRangeMs,
			include_push: options?.includePush,
		});

		return {
			success: (response.success as boolean) ?? false,
			processed: response.processed as number | undefined,
			errors: response.errors as number | undefined,
		};
	}

	/**
	 * Perform an incremental synchronization using sync token
	 */
	async incrementalSync(options?: IncrementalSyncOptions): Promise<SyncResult> {
		const response = await this.invokeEdgeFunction('google-calendar-sync', {
			action: 'incremental_sync',
			sync_token: options?.syncToken,
		});

		return {
			success: (response.success as boolean) ?? false,
			processed: response.processed as number | undefined,
			errors: response.errors as number | undefined,
		};
	}

	/**
	 * Get current sync settings for the user
	 */
	async getSyncSettings(): Promise<CalendarSyncSettings | null> {
		try {
			const response = await apiClient.get<CalendarSyncSettings | null>(
				'/v1/google-calendar/sync-settings',
				{ params: { user_id: this.userId } },
			);
			return response;
		} catch (error) {
			// Return null if settings not found
			return null;
		}
	}

	/**
	 * Update sync settings
	 */
	async updateSyncSettings(
		settings: Partial<{
			sync_enabled: boolean;
			sync_direction: SyncDirectionEnum;
			sync_financial_amounts: boolean;
			sync_categories: string[] | null;
			auto_sync_interval_minutes: number;
		}>,
	): Promise<CalendarSyncSettings> {
		const response = await apiClient.post<CalendarSyncSettings>(
			'/v1/google-calendar/sync-settings',
			{
				user_id: this.userId,
				sync_enabled: settings.sync_enabled ?? false,
				sync_direction: settings.sync_direction ?? 'one_way_to_google',
				sync_financial_amounts: settings.sync_financial_amounts ?? false,
				sync_categories: settings.sync_categories ?? null,
				auto_sync_interval_minutes: settings.auto_sync_interval_minutes ?? 15,
			},
		);

		return response;
	}

	/**
	 * Renew an expiring webhook channel
	 */
	async renewChannel(): Promise<ChannelInfo> {
		const response = await this.invokeEdgeFunction('google-calendar-auth', {
			action: 'renew_channel',
		});

		return {
			channel_id: response.channel_id as string,
			resource_id: response.resource_id as string,
			expiry_at: response.expiry_at as string,
			webhook_url: `${this.config.apiBaseUrl}/api/v1/google-calendar/webhook`,
		};
	}

	/**
	 * Disconnect Google Calendar (revoke tokens)
	 */
	async disconnect(): Promise<{ success: boolean }> {
		const response = await this.invokeEdgeFunction('google-calendar-auth', {
			action: 'revoke',
		});

		return { success: (response.success as boolean) ?? false };
	}

	/**
	 * Get sync mappings for the user
	 */
	async getMappings(): Promise<CalendarSyncMapping[]> {
		try {
			const response = await apiClient.get<CalendarSyncMapping[]>(
				'/v1/google-calendar/mappings',
				{ params: { user_id: this.userId } },
			);
			return response ?? [];
		} catch (error) {
			throw new Error(
				`Failed to get mappings: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	/**
	 * Get mapping for a specific financial event
	 */
	async getMappingByEventId(
		eventId: string,
	): Promise<CalendarSyncMapping | null> {
		try {
			const response = await apiClient.get<CalendarSyncMapping | null>(
				'/v1/google-calendar/mappings/by-event',
				{ params: { user_id: this.userId, event_id: eventId } },
			);
			return response;
		} catch (_error) {
			return null;
		}
	}

	/**
	 * Get mapping for a specific Google event
	 */
	async getMappingByGoogleEventId(
		googleEventId: string,
	): Promise<CalendarSyncMapping | null> {
		try {
			const response = await apiClient.get<CalendarSyncMapping | null>(
				'/v1/google-calendar/mappings/by-google-event',
				{ params: { user_id: this.userId, google_event_id: googleEventId } },
			);
			return response;
		} catch (_error) {
			return null;
		}
	}

	/**
	 * Resolve conflict between local and Google event
	 * Uses "Last Write Wins" strategy based on timestamps
	 */
	resolveConflict(
		localModifiedAt: Date,
		googleModifiedAt: Date,
	): 'local_wins' | 'remote_wins' {
		return googleModifiedAt > localModifiedAt ? 'remote_wins' : 'local_wins';
	}

	/**
	 * Check if sync should be skipped (loop prevention)
	 * Skip if change originated from destination within last 5 seconds
	 */
	async shouldSkipSync(
		eventId: string,
		direction: 'to_google' | 'from_google',
	): Promise<boolean> {
		const mapping = await this.getMappingByEventId(eventId);

		if (!mapping) return false;

		const expectedSource = direction === 'to_google' ? 'google' : 'aegis';
		const lastModified = new Date(mapping.last_modified_at);
		const fiveSecondsAgo = new Date(Date.now() - 5000);

		return (
			mapping.sync_source === expectedSource && lastModified > fiveSecondsAgo
		);
	}

	/**
	 * Get connection status
	 */
	async getConnectionStatus(): Promise<{
		isConnected: boolean;
		isEnabled: boolean;
		googleEmail: string | null;
		lastSyncAt: string | null;
	}> {
		try {
			const response = await apiClient.get<{
				isConnected: boolean;
				isEnabled: boolean;
				googleEmail: string | null;
				lastSyncAt: string | null;
			}>('/v1/google-calendar/status', { params: { user_id: this.userId } });

			return response;
		} catch (_error) {
			return {
				isConnected: false,
				isEnabled: false,
				googleEmail: null,
				lastSyncAt: null,
			};
		}
	}

	/**
	 * Helper to invoke Edge Functions via API
	 */
	private async invokeEdgeFunction(
		functionName: string,
		body: Record<string, unknown>,
	): Promise<Record<string, unknown>> {
		try {
			const response = await apiClient.post<Record<string, unknown>>(
				`/v1/functions/${functionName}`,
				body,
			);

			return response;
		} catch (error) {
			throw new Error(
				`Edge Function ${functionName} error: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}
}

/**
 * Factory function to create GoogleCalendarService instance
 */
export function createGoogleCalendarService(
	userId: string,
	authToken: string,
): GoogleCalendarService {
	const config: GoogleCalendarConfig = {
		clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
		clientSecret: '', // Not needed on client side
		redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI ?? '',
		apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
	};

	return new GoogleCalendarService(config, userId, authToken);
}

export default GoogleCalendarService;
