-- ========================================
-- Row Level Security (RLS) Policies
-- AegisWallet - Multi-tenant Data Isolation
-- ========================================

-- Enable RLS on all user-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE boleto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgpd_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgpd_consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_limits ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Helper function to get current user ID
-- ========================================
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Users Table Policies
-- ========================================
DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users
    FOR SELECT USING (id = get_current_user_id());

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users
    FOR UPDATE USING (id = get_current_user_id());

DROP POLICY IF EXISTS users_insert_own ON users;
CREATE POLICY users_insert_own ON users
    FOR INSERT WITH CHECK (id = get_current_user_id());

-- ========================================
-- User Preferences Policies
-- ========================================
DROP POLICY IF EXISTS user_preferences_all ON user_preferences;
CREATE POLICY user_preferences_all ON user_preferences
    FOR ALL USING (user_id = get_current_user_id());

-- ========================================
-- User Security Policies
-- ========================================
DROP POLICY IF EXISTS user_security_all ON user_security;
CREATE POLICY user_security_all ON user_security
    FOR ALL USING (user_id = get_current_user_id());

-- ========================================
-- User Sessions Policies
-- ========================================
DROP POLICY IF EXISTS user_sessions_all ON user_sessions;
CREATE POLICY user_sessions_all ON user_sessions
    FOR ALL USING (user_id = get_current_user_id());

-- ========================================
-- Bank Accounts Policies
-- ========================================
DROP POLICY IF EXISTS bank_accounts_all ON bank_accounts;
CREATE POLICY bank_accounts_all ON bank_accounts
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS bank_sync_logs_all ON bank_sync_logs;
CREATE POLICY bank_sync_logs_all ON bank_sync_logs
    FOR ALL USING (user_id = get_current_user_id());

-- ========================================
-- Transactions Policies
-- ========================================
DROP POLICY IF EXISTS transactions_all ON transactions;
CREATE POLICY transactions_all ON transactions
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS transaction_categories_all ON transaction_categories;
CREATE POLICY transaction_categories_all ON transaction_categories
    FOR ALL USING (user_id = get_current_user_id() OR user_id IS NULL);

DROP POLICY IF EXISTS transaction_schedules_all ON transaction_schedules;
CREATE POLICY transaction_schedules_all ON transaction_schedules
    FOR ALL USING (user_id = get_current_user_id());

-- ========================================
-- PIX Policies
-- ========================================
DROP POLICY IF EXISTS pix_keys_all ON pix_keys;
CREATE POLICY pix_keys_all ON pix_keys
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS pix_transactions_all ON pix_transactions;
CREATE POLICY pix_transactions_all ON pix_transactions
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS pix_qr_codes_all ON pix_qr_codes;
CREATE POLICY pix_qr_codes_all ON pix_qr_codes
    FOR ALL USING (user_id = get_current_user_id());

-- ========================================
-- Boletos Policies
-- ========================================
DROP POLICY IF EXISTS boletos_all ON boletos;
CREATE POLICY boletos_all ON boletos
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS boleto_payments_all ON boleto_payments;
CREATE POLICY boleto_payments_all ON boleto_payments
    FOR ALL USING (
        boleto_id IN (
            SELECT id FROM boletos WHERE user_id = get_current_user_id()
        )
    );

-- ========================================
-- Contacts Policies
-- ========================================
DROP POLICY IF EXISTS contacts_all ON contacts;
CREATE POLICY contacts_all ON contacts
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS contact_payment_methods_all ON contact_payment_methods;
CREATE POLICY contact_payment_methods_all ON contact_payment_methods
    FOR ALL USING (
        contact_id IN (
            SELECT id FROM contacts WHERE user_id = get_current_user_id()
        )
    );

-- ========================================
-- Notifications Policies
-- ========================================
DROP POLICY IF EXISTS notifications_all ON notifications;
CREATE POLICY notifications_all ON notifications
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS notification_logs_all ON notification_logs;
CREATE POLICY notification_logs_all ON notification_logs
    FOR ALL USING (
        notification_id IN (
            SELECT id FROM notifications WHERE user_id = get_current_user_id()
        )
    );

-- ========================================
-- Financial Events Policies
-- ========================================
DROP POLICY IF EXISTS financial_events_all ON financial_events;
CREATE POLICY financial_events_all ON financial_events
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS event_reminders_all ON event_reminders;
CREATE POLICY event_reminders_all ON event_reminders
    FOR ALL USING (user_id = get_current_user_id());

-- ========================================
-- Chat & AI Policies
-- ========================================
DROP POLICY IF EXISTS chat_sessions_all ON chat_sessions;
CREATE POLICY chat_sessions_all ON chat_sessions
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS chat_messages_all ON chat_messages;
CREATE POLICY chat_messages_all ON chat_messages
    FOR ALL USING (
        session_id IN (
            SELECT id FROM chat_sessions WHERE user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS voice_commands_all ON voice_commands;
CREATE POLICY voice_commands_all ON voice_commands
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS ai_insights_all ON ai_insights;
CREATE POLICY ai_insights_all ON ai_insights
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS spending_patterns_all ON spending_patterns;
CREATE POLICY spending_patterns_all ON spending_patterns
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS budget_categories_all ON budget_categories;
CREATE POLICY budget_categories_all ON budget_categories
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS alert_rules_all ON alert_rules;
CREATE POLICY alert_rules_all ON alert_rules
    FOR ALL USING (user_id = get_current_user_id());

-- ========================================
-- LGPD Compliance Policies
-- ========================================
DROP POLICY IF EXISTS lgpd_consents_all ON lgpd_consents;
CREATE POLICY lgpd_consents_all ON lgpd_consents
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS lgpd_consent_logs_all ON lgpd_consent_logs;
CREATE POLICY lgpd_consent_logs_all ON lgpd_consent_logs
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS data_deletion_requests_all ON data_deletion_requests;
CREATE POLICY data_deletion_requests_all ON data_deletion_requests
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS data_export_requests_all ON data_export_requests;
CREATE POLICY data_export_requests_all ON data_export_requests
    FOR ALL USING (user_id = get_current_user_id());

-- ========================================
-- Audit & Logs Policies
-- ========================================
DROP POLICY IF EXISTS audit_logs_all ON audit_logs;
CREATE POLICY audit_logs_all ON audit_logs
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS error_logs_all ON error_logs;
CREATE POLICY error_logs_all ON error_logs
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS transaction_limits_all ON transaction_limits;
CREATE POLICY transaction_limits_all ON transaction_limits
    FOR ALL USING (user_id = get_current_user_id());

-- ========================================
-- Service Account Bypass (for admin operations)
-- ========================================
-- These policies allow service accounts to bypass RLS
-- when app.is_service_account is set to 'true'

CREATE OR REPLACE FUNCTION is_service_account()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(current_setting('app.is_service_account', true), 'false') = 'true';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add service account bypass to critical tables
DROP POLICY IF EXISTS users_service_account ON users;
CREATE POLICY users_service_account ON users
    FOR ALL USING (is_service_account());

DROP POLICY IF EXISTS audit_logs_service_account ON audit_logs;
CREATE POLICY audit_logs_service_account ON audit_logs
    FOR ALL USING (is_service_account());

DROP POLICY IF EXISTS compliance_audit_logs_service_account ON compliance_audit_logs;
CREATE POLICY compliance_audit_logs_service_account ON compliance_audit_logs
    FOR ALL USING (is_service_account());

-- ========================================
-- Performance Indexes for RLS
-- ========================================
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_keys_user_id ON pix_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_user_id ON pix_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_boletos_user_id ON boletos(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_events_user_id ON financial_events(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_user_id ON voice_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_lgpd_consents_user_id ON lgpd_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION get_current_user_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_service_account() TO PUBLIC;
