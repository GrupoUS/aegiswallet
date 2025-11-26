-- Migration: Fix Calendar Sync Mapping Column Name
-- Description: Rename aegis_event_id to financial_event_id for consistency with edge functions

-- Drop the existing unique constraint first
ALTER TABLE calendar_sync_mapping
DROP CONSTRAINT IF EXISTS calendar_sync_mapping_user_id_aegis_event_id_key;

-- Rename the column
ALTER TABLE calendar_sync_mapping
RENAME COLUMN aegis_event_id TO financial_event_id;

-- Recreate the unique constraint with new column name
ALTER TABLE calendar_sync_mapping
ADD CONSTRAINT calendar_sync_mapping_user_id_financial_event_id_key
UNIQUE (user_id, financial_event_id);

-- Update indexes if they exist
DROP INDEX IF EXISTS idx_calendar_sync_mapping_aegis_id;
CREATE INDEX IF NOT EXISTS idx_calendar_sync_mapping_financial_event_id
ON calendar_sync_mapping(financial_event_id);

COMMENT ON COLUMN calendar_sync_mapping.financial_event_id IS 'Reference to financial_events table';

