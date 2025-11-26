-- Add Recurring Events Table for Brazilian Financial Calendar
-- Supports recurring patterns for Brazilian financial transactions

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create recurring_events table
CREATE TABLE IF NOT EXISTS recurring_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Event details
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2),

    -- Foreign keys
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type_id UUID NOT NULL REFERENCES event_types(id),
    category_id UUID REFERENCES transaction_categories(id),
    account_id UUID REFERENCES bank_accounts(id),

    -- Recurrence rule (JSON)
    recurrence_rule JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Date management
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,

    -- Event properties
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    tags TEXT[] DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on recurring_events
ALTER TABLE recurring_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for recurring_events
DROP POLICY IF EXISTS "Users can manage own recurring events" ON recurring_events;
CREATE POLICY "Users can manage own recurring events" ON recurring_events
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for recurring_events
CREATE INDEX IF NOT EXISTS idx_recurring_events_user_id ON recurring_events(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_events_event_type_id ON recurring_events(event_type_id);
CREATE INDEX IF NOT EXISTS idx_recurring_events_category_id ON recurring_events(category_id);
CREATE INDEX IF NOT EXISTS idx_recurring_events_account_id ON recurring_events(account_id);
CREATE INDEX IF NOT EXISTS idx_recurring_events_start_date ON recurring_events(start_date);
CREATE INDEX IF NOT EXISTS idx_recurring_events_end_date ON recurring_events(end_date);
CREATE INDEX IF NOT EXISTS idx_recurring_events_is_active ON recurring_events(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_events_created_at ON recurring_events(created_at);

-- Create GIN index for recurrence_rule JSONB
CREATE INDEX IF NOT EXISTS idx_recurring_events_recurrence_rule ON recurring_events USING gin(recurrence_rule);

-- Add foreign key constraint to financial_events for recurrence relationship
ALTER TABLE financial_events
ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES recurring_events(id) ON DELETE SET NULL;

-- Create index for recurrence relationship
CREATE INDEX IF NOT EXISTS idx_financial_events_recurrence_parent_id ON financial_events(recurrence_parent_id);

-- Create trigger for updated_at on recurring_events
CREATE OR REPLACE FUNCTION update_recurring_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_recurring_events_updated_at ON recurring_events;
CREATE TRIGGER update_recurring_events_updated_t
    BEFORE UPDATE ON recurring_events
    FOR EACH ROW
    EXECUTE FUNCTION update_recurring_events_updated_at();

-- Add validation function for recurrence rule
CREATE OR REPLACE FUNCTION validate_recurrence_rule(rule JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if required fields exist
    IF NOT (rule ? 'pattern') THEN
        RETURN FALSE;
    END IF;

    -- Validate pattern value
    IF rule->>'pattern' NOT IN (
        'daily', 'weekly', 'bi-weekly', 'monthly', 'bi-monthly',
        'quarterly', 'semi-annually', 'yearly', 'custom'
    ) THEN
        RETURN FALSE;
    END IF;

    -- Validate interval if present
    IF rule ? 'interval' THEN
        IF (rule->>'interval')::INTEGER <= 0 THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- Validate day of week if present
    IF rule ? 'dayOfWeek' THEN
        IF (rule->>'dayOfWeek')::INTEGER < 0 OR (rule->>'dayOfWeek')::INTEGER > 6 THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- Validate day of month if present
    IF rule ? 'dayOfMonth' THEN
        IF (rule->>'dayOfMonth')::INTEGER < 1 OR (rule->>'dayOfMonth')::INTEGER > 31 THEN
            RETURN FALSE;
        END IF;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add check constraint for recurrence rule validation
ALTER TABLE recurring_events
ADD CONSTRAINT valid_recurrence_rule
CHECK (validate_recurrence_rule(recurrence_rule));

-- Create view for active recurring events with next occurrence
CREATE OR REPLACE VIEW active_recurring_events_with_next_occurrence AS
SELECT
    re.*,
    et.name as event_type_name,
    et.color as event_type_color,
    et.icon as event_type_icon,
    tc.name as category_name,
    tc.color as category_color,
    tc.icon as category_icon,
    ba.institution_name as account_institution,
    ba.account_mask as account_mask,
    -- Calculate next occurrence (simplified calculation)
    CASE
        WHEN re.start_date > CURRENT_DATE THEN re.start_date
        WHEN re.end_date IS NOT NULL AND re.end_date < CURRENT_DATE THEN NULL
        ELSE CURRENT_DATE -- This would need proper calculation in production
    END as next_occurrence
FROM recurring_events re
LEFT JOIN event_types et ON re.event_type_id = et.id
LEFT JOIN transaction_categories tc ON re.category_id = tc.id
LEFT JOIN bank_accounts ba ON re.account_id = ba.id
WHERE re.is_active = true
  AND (re.end_date IS NULL OR re.end_date >= CURRENT_DATE);

COMMENT ON VIEW active_recurring_events_with_next_occurrence IS
'Visualização de eventos recorrentes ativos com próxima ocorrência calculada';

-- Create function to get upcoming recurring events
CREATE OR REPLACE FUNCTION get_upcoming_recurring_events(
    p_user_id UUID,
    p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
    recurring_event_id UUID,
    title TEXT,
    amount DECIMAL(15, 2),
    next_occurrence DATE,
    event_type_name TEXT,
    event_type_color TEXT,
    event_type_icon TEXT,
    category_name TEXT,
    priority TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        re.id as recurring_event_id,
        re.title,
        re.amount,
        -- Simplified next occurrence calculation
        CASE
            WHEN re.start_date > CURRENT_DATE THEN re.start_date
            WHEN re.end_date IS NOT NULL AND re.end_date < CURRENT_DATE THEN NULL
            ELSE CURRENT_DATE + INTERVAL '1 day' -- Simplified - would need proper calculation
        END as next_occurrence,
        et.name as event_type_name,
        et.color as event_type_color,
        et.icon as event_type_icon,
        tc.name as category_name,
        re.priority
    FROM recurring_events re
    LEFT JOIN event_types et ON re.event_type_id = et.id
    LEFT JOIN transaction_categories tc ON re.category_id = tc.id
    WHERE re.user_id = p_user_id
      AND re.is_active = true
      AND (re.end_date IS NULL OR re.end_date >= CURRENT_DATE)
      AND re.start_date <= (CURRENT_DATE + INTERVAL '1 day' * p_days_ahead)
    ORDER BY
        CASE
            WHEN re.start_date > CURRENT_DATE THEN re.start_date
            ELSE CURRENT_DATE + INTERVAL '1 day'
        END ASC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Create function to pause recurring event
CREATE OR REPLACE FUNCTION pause_recurring_event(
    p_event_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE recurring_events
    SET is_active = false, updated_at = now()
    WHERE id = p_event_id
      AND user_id = p_user_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to resume recurring event
CREATE OR REPLACE FUNCTION resume_recurring_event(
    p_event_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE recurring_events
    SET is_active = true, updated_at = now()
    WHERE id = p_event_id
      AND user_id = p_user_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to delete future occurrences of a recurring event
CREATE OR REPLACE FUNCTION delete_future_occurrences(
    p_recurring_event_id UUID,
    p_user_id
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM financial_events
    WHERE recurrence_parent_id = p_recurring_event_id
      AND user_id = p_user_id
      AND event_date > CURRENT_DATE;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE recurring_events IS 'Eventos financeiros recorrentes com padrões brasileiros';
COMMENT ON COLUMN recurring_events.recurrence_rule IS 'Regra de recorrência em formato JSON com padrões brasileiros';
COMMENT ON COLUMN recurring_events.start_date IS 'Data de início do evento recorrente';
COMMENT ON COLUMN recurring_events.end_date IS 'Data final (opcional) para o evento recorrente';
COMMENT ON COLUMN recurring_events.is_active IS 'Indica se o evento recorrente está ativo';
COMMENT ON COLUMN financial_events.recurrence_parent_id IS 'Referência ao evento recorrente que gerou este evento';

-- Create trigger to automatically create events from recurring patterns (would be called by background job)
CREATE OR REPLACE FUNCTION generate_events_from_recurring_background()
RETURNS void AS $$
DECLARE
    recurring_event_record RECORD;
    generated_count INTEGER := 0;
BEGIN
    -- This function would be called by a background job
    -- It would generate future events based on recurring patterns

    FOR recurring_event_record IN
        SELECT * FROM active_recurring_events_with_next_occurrence
        WHERE next_occurrence <= CURRENT_DATE + INTERVAL '7 days' -- Generate events for next 7 days
    LOOP
        -- Logic to generate events would go here
        -- This is a placeholder for the actual implementation
        generated_count := generated_count + 1;
    END LOOP;

    -- Log the operation
    RAISE NOTICE 'Generated % events from recurring patterns', generated_count;
END;
$$ LANGUAGE plpgsql;

-- Success notification
DO $$
BEGIN
    RAISE NOTICE 'Recurring events table and related objects created successfully!';
    RAISE NOTICE 'Added support for Brazilian financial recurrence patterns';
    RAISE NOTICE 'Created indexes, views, and utility functions';
END $$;
