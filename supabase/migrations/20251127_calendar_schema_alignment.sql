-- =============================================================================
-- 📅 Migration: 20251127_calendar_schema_alignment.sql
-- Goal: Ensure calendar/transactions schema matches application expectations.
--   * Provision event_types, event_reminders, transactions tables when missing
--   * Align financial_events with start/end dates and event_type_id FK
--   * Add ownership metadata for reminders
--   * Keep operations idempotent for repeated deploys
-- =============================================================================

SET search_path TO public;

-- ---------------------------------------------------------------------------
-- Event types master data
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'calendar',
    is_system BOOLEAN DEFAULT true,
    default_reminder_hours INTEGER DEFAULT 24,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE event_types IS 'Types of financial events used to color code and apply defaults';
COMMENT ON COLUMN event_types.default_reminder_hours IS 'Number of hours before the event we trigger automatic reminders';

-- ---------------------------------------------------------------------------
-- Transactions table (safeguard for environments missing it)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
    amount NUMERIC(15,2) NOT NULL,
    original_amount NUMERIC(15,2),
    currency TEXT DEFAULT 'BRL',
    description TEXT NOT NULL,
    merchant_name TEXT,
    transaction_date TIMESTAMPTZ NOT NULL,
    posted_date TIMESTAMPTZ,
    transaction_type TEXT NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'posted',
    is_recurring BOOLEAN DEFAULT false,
    recurring_rule JSONB,
    tags TEXT[],
    notes TEXT,
    attachments TEXT[],
    confidence_score NUMERIC(3,2),
    is_categorized BOOLEAN DEFAULT false,
    is_manual_entry BOOLEAN DEFAULT false,
    external_id TEXT,
    external_source TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE transactions IS 'Normalized list of user transactions synced via Open Banking/PIX.';

-- ---------------------------------------------------------------------------
-- Align financial_events columns with application contract
-- ---------------------------------------------------------------------------
ALTER TABLE financial_events
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS event_type_id UUID REFERENCES event_types(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

DO $$
BEGIN
    -- Backfill start_date/end_date using legacy event_date/due_date values
    UPDATE financial_events
    SET
        start_date = COALESCE(start_date, event_date::timestamptz, created_at),
        end_date = COALESCE(end_date, COALESCE(due_date::timestamptz, event_date::timestamptz, created_at));
EXCEPTION
    WHEN undefined_column THEN
        NULL; -- Older environments may not have event_date/due_date yet.
END $$;

ALTER TABLE financial_events
    ALTER COLUMN start_date SET NOT NULL,
    ALTER COLUMN end_date SET NOT NULL;

ALTER TABLE financial_events
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN status SET DEFAULT 'pending';

COMMENT ON COLUMN financial_events.start_date IS 'Start timestamp for the financial event (calendar rendering)';
COMMENT ON COLUMN financial_events.end_date IS 'End timestamp for the financial event (calendar rendering)';
COMMENT ON COLUMN financial_events.event_type_id IS 'FK to event_types that defines display defaults';

CREATE INDEX IF NOT EXISTS financial_events_user_start_idx
    ON financial_events(user_id, start_date);

CREATE INDEX IF NOT EXISTS financial_events_user_event_type_idx
    ON financial_events(user_id, event_type_id);

-- ---------------------------------------------------------------------------
-- Event reminders table consolidation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES financial_events(id) ON DELETE CASCADE,
    reminder_type TEXT DEFAULT 'notification',
    remind_at TIMESTAMPTZ NOT NULL,
    message TEXT,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE event_reminders IS 'Manual or automated reminders associated with financial events.';
COMMENT ON COLUMN event_reminders.user_id IS 'Owner of the reminder, used for RLS and auditing.';

CREATE INDEX IF NOT EXISTS event_reminders_user_event_idx
    ON event_reminders(user_id, event_id);

-- Ensure ownership column exists even if table was created previously without it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'event_reminders'
          AND column_name = 'user_id'
    ) THEN
        ALTER TABLE event_reminders
            ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'event_reminders'
          AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE event_reminders
            ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

UPDATE event_reminders er
SET user_id = fe.user_id
FROM financial_events fe
WHERE er.user_id IS NULL
  AND er.event_id = fe.id;

-- ---------------------------------------------------------------------------
-- RLS reminder policy alignment (owner only)
-- ---------------------------------------------------------------------------
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own reminders" ON event_reminders;

CREATE POLICY "Users manage own reminders"
    ON event_reminders
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- ✅ Migration Complete
-- =============================================================================

