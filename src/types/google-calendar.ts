import type { CalendarFinancialEvent } from './financial-events';

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
  aegis_event_id: string;
  google_event_id: string;
  google_calendar_id: string;
  last_synced_at: string;
  sync_status: SyncStatusEnum;
  sync_direction: SyncDirectionEnum;
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
  | 'event_deleted';

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
