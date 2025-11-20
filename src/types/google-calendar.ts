import type { FinancialEvent } from './financial-events';

export interface GoogleCalendarToken {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expiry_timestamp: string;
  scope: string;
  google_user_email: string;
  created_at: string;
  updated_at: string;
}

export type SyncStatus = 'synced' | 'pending' | 'error' | 'conflict';
export type SyncDirection = 'aegis_to_google' | 'google_to_aegis' | 'bidirectional';
export type SyncSettingDirection = 'one_way_to_google' | 'one_way_from_google' | 'bidirectional';

export interface CalendarSyncMapping {
  id: string;
  user_id: string;
  aegis_event_id: string;
  google_event_id: string;
  google_calendar_id: string;
  last_synced_at: string;
  sync_status: SyncStatus;
  sync_direction: SyncDirection;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarSyncSettings {
  user_id: string;
  sync_enabled: boolean;
  sync_direction: SyncSettingDirection;
  sync_financial_amounts: boolean;
  sync_categories: string[] | null;
  last_full_sync_at: string | null;
  sync_token: string | null;
  auto_sync_interval_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarSyncAudit {
  id: string;
  user_id: string;
  action:
    | 'sync_started'
    | 'sync_completed'
    | 'sync_failed'
    | 'event_created'
    | 'event_updated'
    | 'event_deleted'
    | 'auth_granted'
    | 'auth_revoked';
  event_id?: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface GoogleEventDateTime {
  date?: string;
  dateTime?: string;
  timeZone?: string;
}

export interface GoogleEventExtendedProperties {
  private: {
    aegis_event_id?: string;
    aegis_type?: string;
    aegis_amount?: string;
    aegis_category?: string;
  };
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: GoogleEventDateTime;
  end: GoogleEventDateTime;
  extendedProperties?: GoogleEventExtendedProperties;
  status?: string;
  htmlLink?: string;
}

// Helper functions

export function isSyncEnabled(settings?: CalendarSyncSettings): boolean {
  return !!settings?.sync_enabled;
}

export function shouldSyncEvent(event: FinancialEvent, settings: CalendarSyncSettings): boolean {
  if (!settings.sync_enabled) return false;
  if (settings.sync_categories && settings.sync_categories.length > 0) {
    if (!event.category || !settings.sync_categories.includes(event.category)) {
      return false;
    }
  }
  return true;
}
