-- Migration: Import Deduplication Index
-- Purpose: Add composite unique index to prevent duplicate transaction imports
-- This index identifies a transaction by user, account, date, amount, and description hash

-- Create a function to generate description hash for deduplication
-- Normalizes the description (lowercase, trimmed, basic normalization)
CREATE OR REPLACE FUNCTION normalize_description_hash(description TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN MD5(
        LOWER(
            TRIM(
                REGEXP_REPLACE(
                    COALESCE(description, ''),
                    '\s+',
                    ' ',
                    'g'
                )
            )
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create unique index for deduplication
-- Uses a partial index for imported transactions only (source = 'IMPORT')
-- This prevents duplicate imports without affecting manual transactions
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_import_dedup
ON transactions (
    user_id,
    account_id,
    DATE(transaction_date),
    amount,
    normalize_description_hash(description)
)
WHERE external_source = 'IMPORT' OR external_source IS NULL;

-- Add comment explaining the index
COMMENT ON INDEX idx_transactions_import_dedup IS
'Prevents duplicate transaction imports by enforcing uniqueness on user, account, date, amount, and normalized description hash. Only applies to imported transactions.';
