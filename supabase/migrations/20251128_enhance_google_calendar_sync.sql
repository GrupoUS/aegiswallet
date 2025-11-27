-- Migration: Enhance Google Calendar Sync for Bi-Directional Sync
-- Description: Add loop prevention, channel management, and sync queue infrastructure

-- =====================================================
-- 1. Add Loop Prevention Fields to calendar_sync_mapping
-- =====================================================

ALTER TABLE calendar_sync_mapping
ADD COLUMN IF NOT EXISTS sync_source TEXT CHECK (sync_source IN ('aegis', 'google', 'manual')) DEFAULT 'aegis',
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

COMMENT ON COLUMN calendar_sync_mapping.sync_source IS 'Track where the change originated to prevent sync loops';
COMMENT ON COLUMN calendar_sync_mapping.last_modified_at IS 'Timestamp for conflict resolution';
COMMENT ON COLUMN calendar_sync_mapping.version IS 'Optimistic locking version number';

-- =====================================================
-- 2. Add Channel Management Fields to calendar_sync_settings
-- =====================================================

ALTER TABLE calendar_sync_settings
ADD COLUMN IF NOT EXISTS google_channel_id TEXT,
ADD COLUMN IF NOT EXISTS google_resource_id TEXT,
ADD COLUMN IF NOT EXISTS channel_expiry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

COMMENT ON COLUMN calendar_sync_settings.google_channel_id IS 'Active webhook channel ID from Google';
COMMENT ON COLUMN calendar_sync_settings.google_resource_id IS 'Google resource ID for the channel';
COMMENT ON COLUMN calendar_sync_settings.channel_expiry_at IS 'When the webhook channel expires (7 days from registration)';
COMMENT ON COLUMN calendar_sync_settings.webhook_secret IS 'Secret token for webhook verification';

-- =====================================================
-- 3. Create Sync Queue Table for Async Processing
-- =====================================================

CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES financial_events(id) ON DELETE CASCADE,
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('to_google', 'from_google')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

COMMENT ON TABLE sync_queue IS 'Queue for asynchronous Google Calendar sync operations';
COMMENT ON COLUMN sync_queue.sync_direction IS 'Direction of sync: to_google or from_google';
COMMENT ON COLUMN sync_queue.status IS 'Current status of the sync operation';
COMMENT ON COLUMN sync_queue.retry_count IS 'Number of retry attempts';

-- =====================================================
-- 4. Create Indexes for Performance
-- =====================================================

-- Index for sync queue processing
CREATE INDEX IF NOT EXISTS idx_sync_queue_user_status_created
ON sync_queue(user_id, status, created_at)
WHERE status IN ('pending', 'processing');

-- Index for channel renewal queries
CREATE INDEX IF NOT EXISTS idx_calendar_sync_settings_channel_expiry
ON calendar_sync_settings(channel_expiry_at)
WHERE channel_expiry_at IS NOT NULL;

-- Index for sync mapping queries
CREATE INDEX IF NOT EXISTS idx_calendar_sync_mapping_sync_source
ON calendar_sync_mapping(sync_source, last_modified_at);

-- Index for event_id lookups in sync queue
CREATE INDEX IF NOT EXISTS idx_sync_queue_event_id
ON sync_queue(event_id)
WHERE event_id IS NOT NULL;

-- =====================================================
-- 5. Add RLS Policies for sync_queue
-- =====================================================

ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sync queue items
CREATE POLICY "Users can view own sync queue items"
ON sync_queue
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own sync queue items
CREATE POLICY "Users can insert own sync queue items"
ON sync_queue
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can manage all sync queue items
CREATE POLICY "Service role can manage all sync queue items"
ON sync_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- 6. Create Database Trigger for Automatic Outbound Sync
-- =====================================================

-- Function to queue Google Calendar sync on financial_events changes
CREATE OR REPLACE FUNCTION queue_google_calendar_sync()
RETURNS TRIGGER AS $$
DECLARE
  v_sync_enabled BOOLEAN;
  v_is_connected BOOLEAN;
  v_sync_direction TEXT;
  v_user_id UUID;
BEGIN
  -- Determine the user_id based on operation type
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  -- Check if user has Google Calendar sync enabled
  SELECT
    COALESCE(css.sync_enabled, false),
    COALESCE(css.sync_direction, 'bidirectional')
  INTO v_sync_enabled, v_sync_direction
  FROM calendar_sync_settings css
  WHERE css.user_id = v_user_id
  LIMIT 1;

  -- Check if user has tokens stored (indicates connected state)
  SELECT EXISTS(
    SELECT 1 FROM google_calendar_tokens gct
    WHERE gct.user_id = v_user_id
  ) INTO v_is_connected;

  -- Only queue if sync is enabled, connected, and direction allows outbound sync
  IF v_sync_enabled AND v_is_connected AND v_sync_direction IN ('bidirectional', 'one_way_to_google') THEN
    -- Skip if this change originated from Google (to prevent loops)
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
      -- Check if the event was just synced from Google
      IF EXISTS (
        SELECT 1 FROM calendar_sync_mapping
        WHERE financial_event_id = NEW.id
        AND sync_source = 'google'
        AND last_modified_at > NOW() - INTERVAL '5 seconds'
      ) THEN
        RETURN NEW;
      END IF;
    END IF;

    -- Queue the sync operation
    IF TG_OP = 'DELETE' THEN
      INSERT INTO sync_queue (user_id, event_id, sync_direction, status)
      VALUES (OLD.user_id, OLD.id, 'to_google', 'pending');
      RETURN OLD;
    ELSE
      INSERT INTO sync_queue (user_id, event_id, sync_direction, status)
      VALUES (NEW.user_id, NEW.id, 'to_google', 'pending');
      RETURN NEW;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on financial_events table
DROP TRIGGER IF EXISTS trigger_queue_google_calendar_sync ON financial_events;
CREATE TRIGGER trigger_queue_google_calendar_sync
AFTER INSERT OR UPDATE OR DELETE ON financial_events
FOR EACH ROW
EXECUTE FUNCTION queue_google_calendar_sync();

COMMENT ON FUNCTION queue_google_calendar_sync() IS 'Automatically queue Google Calendar sync when financial events change';

-- =====================================================
-- 7. Update calendar_sync_mapping trigger for timestamps
-- =====================================================

-- Function to update last_modified_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_sync_mapping_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS trigger_update_calendar_sync_mapping_timestamp ON calendar_sync_mapping;
CREATE TRIGGER trigger_update_calendar_sync_mapping_timestamp
BEFORE UPDATE ON calendar_sync_mapping
FOR EACH ROW
EXECUTE FUNCTION update_calendar_sync_mapping_timestamp();

-- =====================================================
-- 8. Add Cleanup Function for Old Sync Queue Items
-- =====================================================

-- Function to clean up old completed/failed sync queue items
CREATE OR REPLACE FUNCTION cleanup_old_sync_queue_items()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sync_queue
  WHERE status IN ('completed', 'failed')
  AND processed_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_sync_queue_items() IS 'Clean up sync queue items older than 7 days';

-- =====================================================
-- Migration Complete
-- =====================================================
