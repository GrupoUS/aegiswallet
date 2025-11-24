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

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'financial_events'
          AND column_name = 'brazilian_event_type'
    ) THEN
        EXECUTE $$COMMENT ON COLUMN financial_events.brazilian_event_type IS 'Brazil-specific classification (ex.: SALARIO, ALUGUEL) used for fiscal automation';$$;
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

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'financial_events'
          AND column_name = 'installment_info'
    ) THEN
        EXECUTE $$COMMENT ON COLUMN financial_events.installment_info IS 'JSON blob describing installments (totalInstallments, currentInstallment, amountPerInstallment, etc.)';$$;
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

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'financial_events'
          AND column_name = 'merchant_category'
    ) THEN
        EXECUTE $$COMMENT ON COLUMN financial_events.merchant_category IS 'Merchant category code/label used for analytics and classification';$$;
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

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'financial_events'
          AND column_name = 'metadata'
    ) THEN
        EXECUTE $$COMMENT ON COLUMN financial_events.metadata IS 'Flexible metadata for AI confidence, data source, audit trail and other contextual attributes';$$;
    END IF;
END $$;

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
-- ============================================================================
-- 🧭 Migration: 20251125_add_missing_financial_event_columns.sql
-- Purpose: Align financial_events schema with generated Supabase types by
--          adding brazilian-specific classification, installment metadata,
--          merchant category and flexible metadata blobs.
-- ============================================================================

DO $$
BEGIN
    -- Add brazilian_event_type
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'financial_events'
          AND column_name = 'brazilian_event_type'
    ) THEN
        ALTER TABLE financial_events
            ADD COLUMN brazilian_event_type TEXT;
    END IF;

    -- Add installment_info JSONB
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'financial_events'
          AND column_name = 'installment_info'
    ) THEN
        ALTER TABLE financial_events
            ADD COLUMN installment_info JSONB;
    END IF;

    -- Add merchant_category
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'financial_events'
          AND column_name = 'merchant_category'
    ) THEN
        ALTER TABLE financial_events
            ADD COLUMN merchant_category TEXT;
    END IF;

    -- Add metadata JSONB
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'financial_events'
          AND column_name = 'metadata'
    ) THEN
        ALTER TABLE financial_events
            ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- ============================================================================
-- 📚 Column comments
-- ============================================================================
COMMENT ON COLUMN financial_events.brazilian_event_type IS
    'Brazilian-specific classification (e.g., SALARIO, ALUGUEL, BOLETO_PAGAMENTO)';

COMMENT ON COLUMN financial_events.installment_info IS
    'JSONB payload storing installment details (total, current, amounts, next date)';

COMMENT ON COLUMN financial_events.merchant_category IS
    'Merchant category string (aligned with Receita/BR codes) for analytics';

COMMENT ON COLUMN financial_events.metadata IS
    'Flexible metadata blob (AI confidence, data source, audit trail, etc.)';

-- ============================================================================
-- ⚡ Indexes to accelerate queries/filtering
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_financial_events_brazilian_event_type
    ON financial_events (brazilian_event_type);

CREATE INDEX IF NOT EXISTS idx_financial_events_merchant_category
    ON financial_events (merchant_category);

