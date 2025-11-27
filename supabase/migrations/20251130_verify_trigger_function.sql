-- Migration: Verify and Re-apply Google Calendar Sync Trigger
-- Description: Ensures the queue_google_calendar_sync() function uses correct column names
-- and compiles successfully. This migration replaces the function to guarantee consistency.

-- =====================================================
-- Re-create the trigger function with verified column names
-- =====================================================

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
  -- Uses correct column names: sync_enabled, sync_direction
  SELECT
    COALESCE(css.sync_enabled, false),
    COALESCE(css.sync_direction, 'bidirectional')
  INTO v_sync_enabled, v_sync_direction
  FROM calendar_sync_settings css
  WHERE css.user_id = v_user_id
  LIMIT 1;

  -- Check if user has tokens stored (indicates connected state)
  -- Connection is determined by existence of row in google_calendar_tokens
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

-- =====================================================
-- Ensure trigger exists on financial_events table
-- =====================================================

DROP TRIGGER IF EXISTS trigger_queue_google_calendar_sync ON financial_events;
CREATE TRIGGER trigger_queue_google_calendar_sync
AFTER INSERT OR UPDATE OR DELETE ON financial_events
FOR EACH ROW
EXECUTE FUNCTION queue_google_calendar_sync();

COMMENT ON FUNCTION queue_google_calendar_sync() IS 'Automatically queue Google Calendar sync when financial events change. Uses sync_enabled and sync_direction columns from calendar_sync_settings, and checks google_calendar_tokens for connection status.';

-- =====================================================
-- Migration Complete
-- =====================================================

