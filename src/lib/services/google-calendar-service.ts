/**
 * Google Calendar Service
 *
 * Central service class for Google Calendar integration.
 * Encapsulates core operations for OAuth, sync, and channel management.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CalendarSyncMapping,
  CalendarSyncSettings,
  SyncResult,
  ChannelInfo,
  SyncDirectionEnum,
} from '@/types/google-calendar';

// Environment configuration interface
interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  supabaseUrl: string;
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
  private supabase: SupabaseClient;
  private config: GoogleCalendarConfig;
  private userId: string;
  private authToken: string;

  constructor(
    supabase: SupabaseClient,
    config: GoogleCalendarConfig,
    userId: string,
    authToken: string
  ) {
    this.supabase = supabase;
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
  async handleCallback(code: string): Promise<{ success: boolean; email?: string }> {
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
    const { data, error } = await this.supabase
      .from('calendar_sync_settings')
      .select('*')
      .eq('user_id', this.userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get sync settings: ${error.message}`);
    }

    return data;
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
    }>
  ): Promise<CalendarSyncSettings> {
    const { data: existing } = await this.supabase
      .from('calendar_sync_settings')
      .select('user_id')
      .eq('user_id', this.userId)
      .maybeSingle();

    const updateData = {
      ...settings,
      updated_at: new Date().toISOString(),
    };

    let result: CalendarSyncSettings;
    if (existing) {
      const { data, error } = await this.supabase
        .from('calendar_sync_settings')
        .update(updateData)
        .eq('user_id', this.userId)
        .select()
        .single();

      if (error) throw new Error(`Failed to update settings: ${error.message}`);
      result = data;
    } else {
      const { data, error } = await this.supabase
        .from('calendar_sync_settings')
        .insert({
          user_id: this.userId,
          sync_enabled: settings.sync_enabled ?? false,
          sync_direction: settings.sync_direction ?? 'one_way_to_google',
          sync_financial_amounts: settings.sync_financial_amounts ?? false,
          sync_categories: settings.sync_categories ?? null,
          auto_sync_interval_minutes: settings.auto_sync_interval_minutes ?? 15,
          ...updateData,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create settings: ${error.message}`);
      result = data;
    }

    return result;
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
      webhook_url: `${this.config.supabaseUrl}/functions/v1/google-calendar-webhook`,
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
    const { data, error } = await this.supabase
      .from('calendar_sync_mapping')
      .select('*')
      .eq('user_id', this.userId);

    if (error) {
      throw new Error(`Failed to get mappings: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Get mapping for a specific financial event
   */
  async getMappingByEventId(eventId: string): Promise<CalendarSyncMapping | null> {
    const { data, error } = await this.supabase
      .from('calendar_sync_mapping')
      .select('*')
      .eq('user_id', this.userId)
      .eq('financial_event_id', eventId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get mapping: ${error.message}`);
    }

    return data;
  }

  /**
   * Get mapping for a specific Google event
   */
  async getMappingByGoogleEventId(googleEventId: string): Promise<CalendarSyncMapping | null> {
    const { data, error } = await this.supabase
      .from('calendar_sync_mapping')
      .select('*')
      .eq('user_id', this.userId)
      .eq('google_event_id', googleEventId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get mapping: ${error.message}`);
    }

    return data;
  }

  /**
   * Resolve conflict between local and Google event
   * Uses "Last Write Wins" strategy based on timestamps
   */
  resolveConflict(
    localModifiedAt: Date,
    googleModifiedAt: Date
  ): 'local_wins' | 'remote_wins' {
    return googleModifiedAt > localModifiedAt ? 'remote_wins' : 'local_wins';
  }

  /**
   * Check if sync should be skipped (loop prevention)
   * Skip if change originated from destination within last 5 seconds
   */
  async shouldSkipSync(
    eventId: string,
    direction: 'to_google' | 'from_google'
  ): Promise<boolean> {
    const mapping = await this.getMappingByEventId(eventId);

    if (!mapping) return false;

    const expectedSource = direction === 'to_google' ? 'google' : 'aegis';
    const lastModified = new Date(mapping.last_modified_at);
    const fiveSecondsAgo = new Date(Date.now() - 5000);

    return mapping.sync_source === expectedSource && lastModified > fiveSecondsAgo;
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
    // Check tokens
    const { data: tokens } = await this.supabase
      .from('google_calendar_tokens')
      .select('google_user_email')
      .eq('user_id', this.userId)
      .maybeSingle();

    // Get settings
    const { data: settings } = await this.supabase
      .from('calendar_sync_settings')
      .select('sync_enabled, last_full_sync_at')
      .eq('user_id', this.userId)
      .maybeSingle();

    return {
      isConnected: !!tokens,
      isEnabled: settings?.sync_enabled ?? false,
      googleEmail: tokens?.google_user_email ?? null,
      lastSyncAt: settings?.last_full_sync_at ?? null,
    };
  }

  /**
   * Helper to invoke Edge Functions
   */
  private async invokeEdgeFunction(
    functionName: string,
    body: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await this.supabase.functions.invoke(functionName, {
      body,
      headers: {
        Authorization: `Bearer ${this.authToken}`,
      },
    });

    if (error) {
      throw new Error(`Edge Function ${functionName} error: ${error.message}`);
    }

    return data;
  }
}

/**
 * Factory function to create GoogleCalendarService instance
 */
export function createGoogleCalendarService(
  supabase: SupabaseClient,
  userId: string,
  authToken: string
): GoogleCalendarService {
  const config: GoogleCalendarConfig = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
    clientSecret: '', // Not needed on client side
    redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI ?? '',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  };

  return new GoogleCalendarService(supabase, config, userId, authToken);
}

export default GoogleCalendarService;
