-- Migration to add missing calendar tables and columns
-- This migration ensures the financial_events and event_reminders tables exist with the correct structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to financial_events if they don't exist
DO $$
BEGIN
    -- Check if the column exists before adding it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='financial_events' 
        AND column_name='completed_at'
    ) THEN
        ALTER TABLE financial_events ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='financial_events' 
        AND column_name='is_income'
    ) THEN
        ALTER TABLE financial_events ADD COLUMN is_income BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='financial_events' 
        AND column_name='due_date'
    ) THEN
        ALTER TABLE financial_events ADD COLUMN due_date DATE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='financial_events' 
        AND column_name='is_recurring'
    ) THEN
        ALTER TABLE financial_events ADD COLUMN is_recurring BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='financial_events' 
        AND column_name='recurrence_rule'
    ) THEN
        ALTER TABLE financial_events ADD COLUMN recurrence_rule TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='financial_events' 
        AND column_name='priority'
    ) THEN
        ALTER TABLE financial_events ADD COLUMN priority TEXT DEFAULT 'normal';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='financial_events' 
        AND column_name='tags'
    ) THEN
        ALTER TABLE financial_events ADD COLUMN tags TEXT[];
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='financial_events' 
        AND column_name='attachments'
    ) THEN
        ALTER TABLE financial_events ADD COLUMN attachments TEXT[];
    END IF;
END $$;

-- Create event_reminders table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES financial_events(id) ON DELETE CASCADE,
    remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    reminder_type TEXT DEFAULT 'notification', -- notification, email, sms, voice
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on event_reminders if not already enabled
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for event_reminders if it doesn't exist
DROP POLICY IF EXISTS "Users can manage own event reminders" ON event_reminders;
CREATE POLICY "Users can manage own event reminders" ON event_reminders
    FOR ALL USING (auth.uid() = (SELECT user_id FROM financial_events WHERE id = event_id));

-- Create indexes for event_reminders
CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id ON event_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_remind_at ON event_reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_event_reminders_is_sent ON event_reminders(is_sent);

-- Create trigger for updated_at on event_reminders
CREATE OR REPLACE FUNCTION update_event_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_event_reminders_updated_at ON event_reminders;
CREATE TRIGGER update_event_reminders_updated_at BEFORE UPDATE ON event_reminders
    FOR EACH ROW EXECUTE FUNCTION update_event_reminders_updated_at();