-- Migration to verify RLS policies for data isolation
-- Created at: 2025-12-01

-- Function to check if RLS is enabled on a table
CREATE OR REPLACE FUNCTION check_rls_enabled(table_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
        AND c.relname = table_name
        AND c.relrowsecurity = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a table has policies
CREATE OR REPLACE FUNCTION check_table_policies(table_name text)
RETURNS TABLE (
    policy_name text,
    cmd text,
    roles name[],
    qual text,
    with_check text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.polname::text,
        p.polcmd::text,
        p.polroles,
        pg_get_expr(p.polqual, p.polrelid)::text,
        pg_get_expr(p.polwithcheck, p.polrelid)::text
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname = table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify RLS on critical tables
DO $$
DECLARE
    tables text[] := ARRAY['users', 'financial_events', 'bank_accounts', 'contacts', 'goals', 'budgets'];
    t text;
    rls_enabled boolean;
BEGIN
    RAISE NOTICE 'Verifying RLS policies...';

    FOREACH t IN ARRAY tables LOOP
        rls_enabled := check_rls_enabled(t);
        IF NOT rls_enabled THEN
            RAISE WARNING 'RLS is NOT enabled on table %', t;
        ELSE
            RAISE NOTICE 'RLS is enabled on table %', t;
        END IF;
    END LOOP;
END $$;
