-- =============================================================================
-- 🧮 Migration: 20251125_add_missing_financial_event_columns.sql
-- Purpose: Align financial_events table with application types by adding
--          brazilian_event_type, installment_info, merchant_category, metadata.
--          Includes safety checks, comments and helpful indexes.
-- =============================================================================

SET search_path TO public;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'financial_events'
          AND column_name = 'brazilian_event_type'
    ) THEN
        ALTER TABLE financial_events
        ADD COLUMN brazilian_event_type TEXT;
    END IF;

END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'financial_events'
          AND column_name = 'installment_info'
    ) THEN
        ALTER TABLE financial_events
        ADD COLUMN installment_info JSONB;
    END IF;

END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'financial_events'
          AND column_name = 'merchant_category'
    ) THEN
        ALTER TABLE financial_events
        ADD COLUMN merchant_category TEXT;
    END IF;

END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'financial_events'
          AND column_name = 'metadata'
    ) THEN
        ALTER TABLE financial_events
        ADD COLUMN metadata JSONB;
    END IF;

END $$;

COMMENT ON COLUMN financial_events.brazilian_event_type IS
    'Brazil-specific classification (ex.: SALARIO, ALUGUEL) used for fiscal automation';

COMMENT ON COLUMN financial_events.installment_info IS
    'JSON blob describing installments (totalInstallments, currentInstallment, amountPerInstallment, etc.)';

COMMENT ON COLUMN financial_events.merchant_category IS
    'Merchant category code/label used for analytics and classification';

COMMENT ON COLUMN financial_events.metadata IS
    'Flexible metadata for AI confidence, data source, audit trail and other contextual attributes';

-- =============================================================================
-- 📈 Helpful Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_financial_events_brazilian_event_type
    ON financial_events(brazilian_event_type);

CREATE INDEX IF NOT EXISTS idx_financial_events_merchant_category
    ON financial_events(merchant_category);

-- =============================================================================
-- ✅ Migration Complete
-- =============================================================================
