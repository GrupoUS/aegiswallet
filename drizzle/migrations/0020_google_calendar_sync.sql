-- Google Calendar Sync Migration
-- Run this migration to create all necessary tables for Google Calendar integration
--
-- File: drizzle/migrations/0020_google_calendar_sync.sql

-- ========================================
-- ENUMS
-- ========================================

DO $$ BEGIN
  CREATE TYPE sync_direction AS ENUM (
    'one_way_to_google',
    'one_way_from_google',
    'bidirectional'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sync_status AS ENUM (
    'synced',
    'pending',
    'error',
    'conflict'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sync_source AS ENUM (
    'aegis',
    'google',
    'manual'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sync_queue_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sync_queue_direction AS ENUM (
    'to_google',
    'from_google'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sync_audit_action AS ENUM (
    'sync_started',
    'sync_completed',
    'sync_failed',
    'event_created',
    'event_updated',
    'event_deleted',
    'event_synced',
    'channel_renewed',
    'channel_expired',
    'webhook_received',
    'webhook_error',
    'oauth_connected',
    'oauth_disconnected',
    'oauth_refreshed',
    'conflict_resolved',
    'settings_updated'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- GOOGLE CALENDAR TOKENS
-- ========================================

CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- OAuth tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expiry_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,

  -- Google user info
  google_user_email TEXT,
  google_user_id TEXT,

  -- Token metadata
  token_type TEXT DEFAULT 'Bearer',
  is_valid BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  last_refreshed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS google_calendar_tokens_user_id_idx
  ON google_calendar_tokens(user_id);

-- ========================================
-- CALENDAR SYNC SETTINGS
-- ========================================

CREATE TABLE IF NOT EXISTS calendar_sync_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Sync configuration
  sync_enabled BOOLEAN NOT NULL DEFAULT false,
  sync_direction sync_direction NOT NULL DEFAULT 'bidirectional',
  sync_financial_amounts BOOLEAN NOT NULL DEFAULT false,
  sync_categories TEXT[],
  auto_sync_interval_minutes INTEGER NOT NULL DEFAULT 15,

  -- Google incremental sync token
  sync_token TEXT,
  last_full_sync_at TIMESTAMP WITH TIME ZONE,
  last_incremental_sync_at TIMESTAMP WITH TIME ZONE,

  -- Webhook channel configuration
  google_channel_id TEXT,
  google_resource_id TEXT,
  channel_expiry_at TIMESTAMP WITH TIME ZONE,
  webhook_secret TEXT,

  -- Default calendar
  default_calendar_id TEXT DEFAULT 'primary',

  -- LGPD consent tracking
  lgpd_consent_given BOOLEAN NOT NULL DEFAULT false,
  lgpd_consent_timestamp TIMESTAMP WITH TIME ZONE,
  lgpd_consent_version TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ========================================
-- CALENDAR SYNC MAPPINGS
-- ========================================

CREATE TABLE IF NOT EXISTS calendar_sync_mappings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Event references
  financial_event_id TEXT NOT NULL REFERENCES financial_events(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  google_calendar_id TEXT NOT NULL DEFAULT 'primary',

  -- Sync state
  sync_status sync_status NOT NULL DEFAULT 'synced',
  sync_source sync_source NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_modified_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Optimistic locking
  version INTEGER NOT NULL DEFAULT 1,
  google_etag TEXT,

  -- Error tracking
  error_message TEXT,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS calendar_sync_mappings_user_event_idx
  ON calendar_sync_mappings(user_id, financial_event_id);

CREATE UNIQUE INDEX IF NOT EXISTS calendar_sync_mappings_google_event_idx
  ON calendar_sync_mappings(user_id, google_event_id);

-- ========================================
-- CALENDAR SYNC QUEUE
-- ========================================

CREATE TABLE IF NOT EXISTS calendar_sync_queue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- What to sync
  event_id TEXT,
  sync_direction sync_queue_direction NOT NULL,

  -- Queue status
  status sync_queue_status NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,

  -- Error tracking
  error_message TEXT,
  last_attempt_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS calendar_sync_queue_pending_idx
  ON calendar_sync_queue(status, priority DESC, created_at ASC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS calendar_sync_queue_user_idx
  ON calendar_sync_queue(user_id);

-- ========================================
-- CALENDAR SYNC AUDIT
-- ========================================

CREATE TABLE IF NOT EXISTS calendar_sync_audit (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Action details
  action sync_audit_action NOT NULL,
  event_id TEXT,
  google_event_id TEXT,

  -- Result
  success BOOLEAN NOT NULL,
  error_message TEXT,

  -- Details
  details JSONB,

  -- Request metadata
  request_id TEXT,
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS calendar_sync_audit_user_idx
  ON calendar_sync_audit(user_id, created_at DESC);

-- ========================================
-- TRIGGERS FOR updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_google_calendar_tokens_updated_at
    BEFORE UPDATE ON google_calendar_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_calendar_sync_settings_updated_at
    BEFORE UPDATE ON calendar_sync_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_calendar_sync_mappings_updated_at
    BEFORE UPDATE ON calendar_sync_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE google_calendar_tokens IS 'OAuth 2.0 tokens for Google Calendar API access';
COMMENT ON TABLE calendar_sync_settings IS 'Per-user synchronization settings and preferences';
COMMENT ON TABLE calendar_sync_mappings IS 'Mapping between AegisWallet financial events and Google Calendar events';
COMMENT ON TABLE calendar_sync_queue IS 'Async queue for sync operations with retry logic';
COMMENT ON TABLE calendar_sync_audit IS 'Audit log for all sync operations (LGPD compliance)';
