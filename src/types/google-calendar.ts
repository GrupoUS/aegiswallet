import type { CalendarFinancialEvent } from './financial-events';

// ========================================
// Core Types
// ========================================

export type SyncSource = 'aegis' | 'google' | 'manual';
export type ResourceState = 'sync' | 'exists' | 'not_exists';
export type SyncQueueStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface GoogleCalendarToken {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expiry_timestamp: string;
  scope: string;
  google_user_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  extendedProperties?: {
    private?: {
      aegis_id?: string;
      aegis_category?: string;
      aegis_amount?: string;
      aegis_type?: string;
    };
  };
}

export interface CalendarSyncMapping {
  id: string;
  user_id: string;
  financial_event_id: string; // Updated from aegis_event_id
  google_event_id: string;
  google_calendar_id: string;
  last_synced_at: string;
  sync_status: SyncStatusEnum;
  sync_direction: SyncDirectionEnum;
  sync_source: SyncSource; // NEW: Track origin of change
  last_modified_at: string; // NEW: For conflict resolution
  version: number; // NEW: Optimistic locking
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarSyncSettings {
  user_id: string;
  sync_enabled: boolean;
  sync_direction: SyncDirectionEnum;
  sync_financial_amounts: boolean;
  sync_categories: string[] | null;
  last_full_sync_at: string | null;
  sync_token: string | null;
  auto_sync_interval_minutes: number;
  google_channel_id: string | null; // Webhook channel ID
  google_resource_id: string | null; // Google resource ID
  channel_expiry_at: string | null; // Channel expiration
  webhook_secret: string | null; // Webhook verification token
  created_at: string;
  updated_at: string;
}

export interface CalendarSyncAudit {
  id: string;
  user_id: string;
  action: SyncActionEnum;
  event_id?: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export type SyncStatusEnum = 'synced' | 'pending' | 'error' | 'conflict';
export type SyncDirectionEnum =
  | 'one_way_to_google'
  | 'one_way_from_google'
  | 'bidirectional'
  | 'aegis_to_google'
  | 'google_to_aegis'; // Combined for settings and mapping
export type SyncActionEnum =
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'event_created'
  | 'event_updated'
  | 'event_deleted'
  | 'event_synced'
  | 'channel_renewed'
  | 'webhook_triggered'
  | 'webhook_error';

// ========================================
// New Types for Bi-Directional Sync
// ========================================

export interface ChannelInfo {
  channel_id: string;
  resource_id: string;
  expiry_at: string;
  webhook_url: string;
}

export interface SyncResult {
  success: boolean;
  processed?: number;
  errors?: number;
  conflicts?: ConflictInfo[];
  skipped?: boolean;
  reason?: string;
  created?: boolean;
  updated?: boolean;
  deleted?: boolean;
  event_id?: string;
  google_id?: string;
}

export interface ConflictInfo {
  event_id: string;
  google_event_id: string;
  local_version: number;
  remote_version: string;
  local_modified: string;
  remote_modified: string;
  resolution: 'local_wins' | 'remote_wins' | 'manual_required';
}

export interface WebhookHeaders {
  'X-Goog-Channel-ID': string;
  'X-Goog-Channel-Token': string;
  'X-Goog-Resource-ID': string;
  'X-Goog-Resource-State': ResourceState;
  'X-Goog-Resource-URI': string;
}

export interface WebhookPayload {
  channel_id: string;
  resource_id: string;
  resource_state: ResourceState;
  resource_uri: string;
}

export interface SyncQueueItem {
  id: string;
  user_id: string;
  event_id: string | null;
  sync_direction: 'to_google' | 'from_google';
  status: SyncQueueStatus;
  retry_count: number;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

// ========================================
// Mapping Functions
// ========================================

export const mapFinancialEventToGoogle = (
  event: CalendarFinancialEvent,
  settings: CalendarSyncSettings
): Partial<GoogleCalendarEvent> => {
  return {
    summary: event.title,
    description: settings.sync_financial_amounts
      ? `${event.description || ''}\nValue: ${event.amount}`
      : event.description,
    start: { dateTime: event.start.toISOString() },
    end: { dateTime: event.end.toISOString() },
    extendedProperties: {
      private: {
        aegis_id: event.id,
        aegis_category: event.category as string,
      },
    },
  };
};

export const mapGoogleEventToFinancial = (
  googleEvent: GoogleCalendarEvent,
  settings: CalendarSyncSettings
): Partial<CalendarFinancialEvent> => {
  const financialEvent: Partial<CalendarFinancialEvent> = {
    title: googleEvent.summary || 'Untitled Event',
    description: googleEvent.description || '',
    start: new Date(googleEvent.start.dateTime),
    end: new Date(googleEvent.end.dateTime),
  };

  // Parse amount from description if sync_financial_amounts is enabled
  if (settings.sync_financial_amounts && googleEvent.description) {
    const amountMatch = googleEvent.description.match(/Value:\s*([0-9.,]+)/);
    if (amountMatch) {
      financialEvent.amount = parseFloat(amountMatch[1].replace(',', ''));
    }
  }

  // Extract category from extended properties
  if (googleEvent.extendedProperties?.private?.aegis_category) {
    financialEvent.category = googleEvent.extendedProperties.private.aegis_category;
  }

  return financialEvent;
};

// Timezone handling utilities
export const convertToUserTimezone = (date: Date, timezone: string): Date => {
  // Simple implementation - in production, use a library like date-fns-tz
  return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
};

export const convertFromUserTimezone = (date: Date, timezone: string): Date => {
  // Simple implementation - in production, use a library like date-fns-tz
  return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
};
