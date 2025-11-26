-- Align legacy transactions columns (`date`, `type`) with the new schema
-- expected by the application (`transaction_date`, `transaction_type`).
DO $$
DECLARE
    has_legacy_date BOOLEAN;
    has_target_date BOOLEAN;
    has_legacy_type BOOLEAN;
    has_target_type BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'transactions'
          AND column_name = 'date'
    )
    INTO has_legacy_date;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'transactions'
          AND column_name = 'transaction_date'
    )
    INTO has_target_date;

    IF has_legacy_date AND NOT has_target_date THEN
        RAISE NOTICE 'Renaming column public.transactions.date -> transaction_date';
        EXECUTE 'ALTER TABLE public.transactions RENAME COLUMN "date" TO transaction_date';
    ELSIF has_legacy_date AND has_target_date THEN
        RAISE WARNING 'public.transactions already contains both "date" and "transaction_date". Manual intervention required.';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'transactions'
          AND column_name = 'type'
    )
    INTO has_legacy_type;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'transactions'
          AND column_name = 'transaction_type'
    )
    INTO has_target_type;

    IF has_legacy_type AND NOT has_target_type THEN
        RAISE NOTICE 'Renaming column public.transactions.type -> transaction_type';
        EXECUTE 'ALTER TABLE public.transactions RENAME COLUMN "type" TO transaction_type';
    ELSIF has_legacy_type AND has_target_type THEN
        RAISE WARNING 'public.transactions already contains both "type" and "transaction_type". Manual intervention required.';
    END IF;
END $$;

