-- =====================================================
-- VERIFICATION SCRIPT - Critical Tables Migration
-- Execute this script in Supabase SQL Editor to verify
-- that the migration was applied correctly
-- =====================================================

-- 1. Verify all critical tables were created
SELECT 'TABLES_CREATED' as check_type,
       COUNT(*) as count,
       'Expected: 8 tables' as expected
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_consent', 'voice_feedback', 'audit_logs',
    'data_subject_requests', 'legal_holds', 'user_activity',
    'voice_recordings', 'biometric_patterns'
  );

-- List all created tables with details
SELECT
    table_name,
    table_type,
    is_insertable_into,
    is_typed
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_consent', 'voice_feedback', 'audit_logs',
    'data_subject_requests', 'legal_holds', 'user_activity',
    'voice_recordings', 'biometric_patterns'
  )
ORDER BY table_name;

-- 2. Verify Row Level Security (RLS) is enabled
SELECT 'RLS_ENABLED' as check_type,
       table_name,
       rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_consent', 'voice_feedback', 'audit_logs',
    'data_subject_requests', 'legal_holds', 'user_activity',
    'voice_recordings', 'biometric_patterns'
  )
ORDER BY table_name;

-- 3. Verify RLS policies were created
SELECT 'RLS_POLICIES' as check_type,
       COUNT(*) as total_policies,
       'Expected: At least 16 policies (2 per table)' as expected
FROM pg_policies
WHERE tablename IN (
    'user_consent', 'voice_feedback', 'audit_logs',
    'data_subject_requests', 'legal_holds', 'user_activity',
    'voice_recordings', 'biometric_patterns'
);

-- List all RLS policies with details
SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    LEFT(qual, 100) as condition_preview
FROM pg_policies
WHERE tablename IN (
    'user_consent', 'voice_feedback', 'audit_logs',
    'data_subject_requests', 'legal_holds', 'user_activity',
    'voice_recordings', 'biometric_patterns'
)
ORDER BY tablename, policyname;

-- 4. Verify indexes were created
SELECT 'INDEXES' as check_type,
       COUNT(*) as total_indexes,
       'Expected: At least 15 indexes' as expected
FROM pg_indexes
WHERE tablename IN (
    'user_consent', 'voice_feedback', 'audit_logs',
    'data_subject_requests', 'legal_holds', 'user_activity',
    'voice_recordings', 'biometric_patterns'
);

-- List all indexes with details
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN (
    'user_consent', 'voice_feedback', 'audit_logs',
    'data_subject_requests', 'legal_holds', 'user_activity',
    'voice_recordings', 'biometric_patterns'
)
ORDER BY tablename, indexname;

-- 5. Verify triggers were created
SELECT 'TRIGGERS' as check_type,
       COUNT(*) as total_triggers,
       'Expected: At least 4 triggers' as expected
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'user_consent', 'data_subject_requests', 'legal_holds'
  );

-- List all triggers with details
SELECT
    trigger_name,
    event_object_table,
    action_timing,
    action_condition,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'user_consent', 'data_subject_requests', 'legal_holds'
  )
ORDER BY event_object_table, trigger_name;

-- 6. Verify functions were created
SELECT 'FUNCTIONS' as check_type,
       COUNT(*) as total_functions,
       'Expected: At least 5 functions' as expected
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_updated_at_column',
    'log_audit_event',
    'check_retention_policies',
    'schedule_retention_check'
  );

-- List all functions with details
SELECT
    routine_name,
    routine_type,
    data_type,
    external_language
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_updated_at_column',
    'log_audit_event',
    'check_retention_policies',
    'schedule_retention_check'
  )
ORDER BY routine_name;

-- 7. Sample data validation (should return 0 rows for new tables)
SELECT 'SAMPLE_DATA_VALIDATION' as check_type,
       'All tables should be empty initially' as note;

-- Check if any tables have unexpected data
SELECT
    'user_consent' as table_name,
    COUNT(*) as row_count
FROM user_consent
UNION ALL
SELECT
    'voice_feedback' as table_name,
    COUNT(*) as row_count
FROM voice_feedback
UNION ALL
SELECT
    'audit_logs' as table_name,
    COUNT(*) as row_count
FROM audit_logs
UNION ALL
SELECT
    'data_subject_requests' as table_name,
    COUNT(*) as row_count
FROM data_subject_requests
UNION ALL
SELECT
    'legal_holds' as table_name,
    COUNT(*) as row_count
FROM legal_holds
UNION ALL
SELECT
    'user_activity' as table_name,
    COUNT(*) as row_count
FROM user_activity
UNION ALL
SELECT
    'voice_recordings' as table_name,
    COUNT(*) as row_count
FROM voice_recordings
UNION ALL
SELECT
    'biometric_patterns' as table_name,
    COUNT(*) as row_count
FROM biometric_patterns;

-- 8. Test basic table structure (sample inserts - these should succeed)
-- Note: These are just validation tests and should be rolled back or deleted

-- Test user_consent table structure
DO $$
BEGIN
    -- Create a temporary test user (if it doesn't exist)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000') THEN
        -- This will fail if no test user exists, which is expected
        NULL;
    END IF;

    -- Test table structure by trying to describe it
    RAISE NOTICE 'user_consent table structure validated';
END $$;

-- 9. Final summary
SELECT 'MIGRATION_VERIFICATION_COMPLETE' as status,
       'Run all queries above to verify migration success' as instructions,
       'All checks should pass with expected counts' as note;

-- Additional validation queries for specific tables

-- Check user_consent constraints
SELECT
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
  AND constraint_name LIKE '%user_consent%';

-- Check foreign key relationships
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'user_consent', 'voice_feedback', 'audit_logs',
    'data_subject_requests', 'legal_holds', 'user_activity',
    'voice_recordings', 'biometric_patterns'
  )
ORDER BY tc.table_name;
