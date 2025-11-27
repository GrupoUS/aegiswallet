-- Migration: Fix Calendar Sync Mapping Column Name
-- Description: Rename aegis_event_id to financial_event_id for consistency with edge functions
-- Note: This migration is idempotent - safe to run multiple times

-- Drop the existing unique constraint first (if exists)
ALTER TABLE calendar_sync_mapping
DROP CONSTRAINT IF EXISTS calendar_sync_mapping_user_id_aegis_event_id_key;

-- Rename the column only if it exists with the old name
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_sync_mapping' 
        AND column_name = 'aegis_event_id'
    ) THEN
        ALTER TABLE calendar_sync_mapping
        RENAME COLUMN aegis_event_id TO financial_event_id;
    END IF;
END $$;

-- Recreate the unique constraint with new column name (drop first if exists)
ALTER TABLE calendar_sync_mapping
DROP CONSTRAINT IF EXISTS calendar_sync_mapping_user_id_financial_event_id_key;

ALTER TABLE calendar_sync_mapping
ADD CONSTRAINT calendar_sync_mapping_user_id_financial_event_id_key
UNIQUE (user_id, financial_event_id);

-- Update indexes if they exist
DROP INDEX IF EXISTS idx_calendar_sync_mapping_aegis_id;
DROP INDEX IF EXISTS idx_calendar_sync_mapping_financial_event_id;
CREATE INDEX IF NOT EXISTS idx_calendar_sync_mapping_financial_event_id
ON calendar_sync_mapping(financial_event_id);

COMMENT ON COLUMN calendar_sync_mapping.financial_event_id IS 'Reference to financial_events table';
