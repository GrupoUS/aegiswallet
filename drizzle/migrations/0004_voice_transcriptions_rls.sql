-- Add Row Level Security (RLS) policies for voice_transcriptions table
-- This migration completes the RLS coverage for all user-facing tables

-- ========================================
-- Enable RLS on voice_transcriptions table
-- ========================================
ALTER TABLE voice_transcriptions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Create RLS policies for voice_transcriptions
-- ========================================

-- Policy for users to access their own voice transcriptions
DROP POLICY IF EXISTS voice_transcriptions_user_policy ON voice_transcriptions;
CREATE POLICY voice_transcriptions_user_policy ON voice_transcriptions
    FOR ALL USING (user_id = get_current_user_id());

-- Policy for service accounts to bypass RLS for admin operations
DROP POLICY IF EXISTS voice_transcriptions_service_account_policy ON voice_transcriptions;
CREATE POLICY voice_transcriptions_service_account_policy ON voice_transcriptions
    FOR ALL USING (is_service_account());

-- ========================================
-- Add performance index for RLS queries
-- ========================================
CREATE INDEX IF NOT EXISTS idx_voice_transcriptions_user_id ON voice_transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_transcriptions_expires_at ON voice_transcriptions(expires_at);

-- ========================================
-- Add automatic cleanup for expired transcriptions
-- ========================================

-- Function to clean up expired voice transcriptions
CREATE OR REPLACE FUNCTION cleanup_expired_voice_transcriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete transcriptions that have expired
    DELETE FROM voice_transcriptions
    WHERE expires_at < NOW();

    -- Get the count of deleted records
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Log the cleanup operation
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        details,
        created_at
    ) VALUES (
        'system',
        'cleanup_expired_transcriptions',
        'voice_transcriptions',
        json_build_object('deleted_count', deleted_count),
        NOW()
    );

    RETURN deleted_count;
END;
$$;

-- Create a comment to document the cleanup function
COMMENT ON FUNCTION cleanup_expired_voice_transcriptions() IS 'Automatically removes expired voice transcription records for privacy compliance';

-- ========================================
-- RLS Coverage Verification
-- ========================================

-- This completes RLS policy coverage for all user-facing tables:
-- ✅ users, user_preferences, user_security, user_sessions
-- ✅ bank_accounts, bank_sync_logs, transactions, transaction_categories, transaction_schedules
-- ✅ pix_keys, pix_transactions, pix_qr_codes
-- ✅ boletos, boleto_payments
-- ✅ contacts, contact_payment_methods
-- ✅ notifications, notification_logs, alert_rules
-- ✅ financial_events, event_reminders, event_types
-- ✅ chat_sessions, chat_messages
-- ✅ voice_commands, voice_transcriptions (NEW)
-- ✅ ai_insights, spending_patterns, budget_categories
-- ✅ lgpd_consents, lgpd_consent_logs, data_deletion_requests, data_export_requests
-- ✅ audit_logs, error_logs, transaction_limits
-- ✅ compliance_audit_logs, legal_holds, consent_templates
-- ✅ subscriptions, subscription_plans, payment_history
