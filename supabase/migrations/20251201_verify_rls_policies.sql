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

-- Verify RLS on critical tables with policy predicate validation
DO $$
DECLARE
    tables text[] := ARRAY['users', 'financial_events', 'bank_accounts', 'contacts', 'goals', 'budgets'];
    -- Required commands that each critical table must have policies for
    required_commands text[] := ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
    t text;
    cmd text;
    rls_enabled boolean;
    policy_count integer;
    has_auth_uid_policy boolean;
    policy_record record;
BEGIN
    RAISE NOTICE 'Verifying RLS policies with auth.uid() predicates...';

    FOREACH t IN ARRAY tables LOOP
        -- Step 1: Verify RLS is enabled
        rls_enabled := check_rls_enabled(t);
        IF NOT rls_enabled THEN
            RAISE EXCEPTION 'RLS is NOT enabled on table %. Enable RLS with: ALTER TABLE % ENABLE ROW LEVEL SECURITY;', t, t;
        END IF;
        RAISE NOTICE 'RLS is enabled on table %', t;

        -- Step 2: Verify at least one policy exists
        SELECT COUNT(*) INTO policy_count
        FROM check_table_policies(t);

        IF policy_count = 0 THEN
            RAISE EXCEPTION 'Table % has RLS enabled but NO policies defined. Create policies with auth.uid() predicates.', t;
        END IF;
        RAISE NOTICE 'Table % has % policies defined', t, policy_count;

        -- Step 3: Verify each required command has at least one policy with auth.uid() predicate
        FOREACH cmd IN ARRAY required_commands LOOP
            has_auth_uid_policy := false;

            FOR policy_record IN SELECT * FROM check_table_policies(t) LOOP
                -- Check if policy applies to this command ('*' means all commands, 'r'=SELECT, 'a'=INSERT, 'w'=UPDATE, 'd'=DELETE)
                IF (policy_record.cmd = '*') OR
                   (cmd = 'SELECT' AND policy_record.cmd = 'r') OR
                   (cmd = 'INSERT' AND policy_record.cmd = 'a') OR
                   (cmd = 'UPDATE' AND policy_record.cmd = 'w') OR
                   (cmd = 'DELETE' AND policy_record.cmd = 'd') THEN
                    -- Check if policy references auth.uid() in qual or with_check
                    IF (policy_record.qual IS NOT NULL AND policy_record.qual LIKE '%auth.uid()%') OR
                       (policy_record.with_check IS NOT NULL AND policy_record.with_check LIKE '%auth.uid()%') THEN
                        has_auth_uid_policy := true;
                        RAISE NOTICE 'Table % has policy "%" for % with auth.uid() predicate', t, policy_record.policy_name, cmd;
                        EXIT; -- Found valid policy for this command
                    END IF;
                END IF;
            END LOOP;

            IF NOT has_auth_uid_policy THEN
                RAISE EXCEPTION 'Table % lacks a policy with auth.uid() predicate for % command. Data isolation is not enforced for this operation.', t, cmd;
            END IF;
        END LOOP;

        RAISE NOTICE 'Table % passed all RLS policy checks ✓', t;
    END LOOP;

    RAISE NOTICE 'All critical tables have proper RLS policies with auth.uid() predicates ✓';
END $$;
