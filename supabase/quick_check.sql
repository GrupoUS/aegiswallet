-- =====================================================
-- QUICK VERIFICATION - Critical Tables Migration
-- Execute this in Supabase SQL Editor for fast validation
-- =====================================================

-- 1. Check if all 8 critical tables were created
SELECT
    'TABLES CREATED' as status,
    COUNT(*) as created_tables,
    CASE
        WHEN COUNT(*) = 8 THEN '✅ SUCCESS: All tables created'
        ELSE '❌ ERROR: Missing tables'
    END as result
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_consent', 'voice_feedback', 'audit_logs',
    'data_subject_requests', 'legal_holds', 'user_activity',
    'voice_recordings', 'biometric_patterns'
  );

-- 2. List created tables
SELECT
    table_name,
    '✅ CREATED' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_consent', 'voice_feedback', 'audit_logs',
    'data_subject_requests', 'legal_holds', 'user_activity',
    'voice_recordings', 'biometric_patterns'
  )
ORDER BY table_name;

-- 3. Check RLS enabled
SELECT
    'RLS STATUS' as check_type,
    tablename as table_name,
    CASE
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_consent', 'voice_feedback', 'audit_logs',
    'data_subject_requests', 'legal_holds', 'user_activity',
    'voice_recordings', 'biometric_patterns'
  )
ORDER BY tablename;

-- 4. Check RLS policies count
SELECT
    'RLS POLICIES' as status,
    COUNT(*) as total_policies,
    CASE
        WHEN COUNT(*) >= 16 THEN '✅ SUFFICIENT'
        ELSE '❌ INSUFFICIENT'
    END as policy_status
FROM pg_policies
WHERE tablename IN (
    'user_consent', 'voice_feedback', 'audit_logs',
    'data_subject_requests', 'legal_holds', 'user_activity',
    'voice_recordings', 'biometric_patterns'
  );

-- 5. Check indexes count
SELECT
    'INDEXES' as status,
    COUNT(*) as total_indexes,
    CASE
        WHEN COUNT(*) >= 15 THEN '✅ SUFFICIENT'
        ELSE '❌ INSUFFICIENT'
    END as index_status
FROM pg_indexes
WHERE tablename IN (
    'user_consent', 'voice_feedback', 'audit_logs',
    'data_subject_requests', 'legal_holds', 'user_activity',
    'voice_recordings', 'biometric_patterns'
  );

-- 6. Check triggers
SELECT
    'TRIGGERS' as status,
    COUNT(*) as total_triggers,
    CASE
        WHEN COUNT(*) >= 4 THEN '✅ SUFFICIENT'
        ELSE '❌ INSUFFICIENT'
    END as trigger_status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'user_consent', 'data_subject_requests', 'legal_holds'
  );

-- 7. Summary
SELECT
    'MIGRATION SUMMARY' as check_type,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_consent', 'voice_feedback', 'audit_logs', 'data_subject_requests', 'legal_holds', 'user_activity', 'voice_recordings', 'biometric_patterns')) as tables_created,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('user_consent', 'voice_feedback', 'audit_logs', 'data_subject_requests', 'legal_holds', 'user_activity', 'voice_recordings', 'biometric_patterns')) as rls_policies,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('user_consent', 'voice_feedback', 'audit_logs', 'data_subject_requests', 'legal_holds', 'user_activity', 'voice_recordings', 'biometric_patterns')) as indexes,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public' AND event_object_table IN ('user_consent', 'data_subject_requests', 'legal_holds')) as triggers,
    CASE
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_consent', 'voice_feedback', 'audit_logs', 'data_subject_requests', 'legal_holds', 'user_activity', 'voice_recordings', 'biometric_patterns')) = 8
             AND (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('user_consent', 'voice_feedback', 'audit_logs', 'data_subject_requests', 'legal_holds', 'user_activity', 'voice_recordings', 'biometric_patterns')) >= 16 THEN '✅ MIGRATION SUCCESSFUL'
        ELSE '❌ MIGRATION ISSUES DETECTED'
    END as overall_status;
