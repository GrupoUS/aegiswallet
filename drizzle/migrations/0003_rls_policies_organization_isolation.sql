-- RLS Policies and Organization Isolation Migration
-- Implements Row Level Security for multi-tenant data isolation
-- Ensures LGPD compliance at database level

-- ========================================
-- STEP 1: ADD ORGANIZATION_ID TO CRITICAL TABLES
-- ========================================

-- Add organization_id to users table for multi-tenant support
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to bank_accounts table
ALTER TABLE bank_accounts 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to pix_keys table
ALTER TABLE pix_keys 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to transaction_categories table
ALTER TABLE transaction_categories 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to transaction_schedules table
ALTER TABLE transaction_schedules 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to pix_qr_codes table
ALTER TABLE pix_qr_codes 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to pix_transactions table
ALTER TABLE pix_transactions 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to boletos table
ALTER TABLE boletos 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to boleto_payments table
ALTER TABLE boleto_payments 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to contact_payment_methods table
ALTER TABLE contact_payment_methods 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to notification_logs table
ALTER TABLE notification_logs 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to all LGPD tables for compliance isolation
ALTER TABLE lgpd_consents 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

ALTER TABLE lgpd_consent_logs 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

ALTER TABLE lgpd_export_requests 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

ALTER TABLE data_deletion_requests 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

ALTER TABLE data_retention_policies 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

ALTER TABLE transaction_limits 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

ALTER TABLE compliance_audit_logs 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to AI and voice data tables
ALTER TABLE voice_commands 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

ALTER TABLE ai_insights 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to audit tables
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

ALTER TABLE error_logs 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- Add organization_id to financial events and calendars
ALTER TABLE financial_events 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

ALTER TABLE event_types 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

ALTER TABLE event_reminders 
ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'default';

-- ========================================
-- STEP 2: ENABLE ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on all user-related tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security ENABLE ROW LEVEL SECURITY;

-- Enable RLS on financial data tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_sync_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on PIX tables
ALTER TABLE pix_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on boletos tables
ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE boleto_payments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on contacts tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_payment_methods ENABLE ROW LEVEL SECURITY;

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

-- Enable RLS on LGPD compliance tables
ALTER TABLE lgpd_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgpd_consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgpd_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on AI and voice data
ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_intents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on audit tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on calendar and events
ALTER TABLE financial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on billing and subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: CREATE ORGANIZATION CONTEXT FUNCTION
-- ========================================

-- Create function to get current organization context
CREATE OR REPLACE FUNCTION get_current_organization_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_org_id TEXT;
BEGIN
    -- Get organization_id from current user context
    -- This should be set by the application layer using SET app.current_org_id
    user_org_id := current_setting('app.current_org_id', true);
    
    IF user_org_id IS NULL OR user_org_id = '' THEN
        -- If no organization context, return default
        RETURN 'default';
    END IF;
    
    RETURN user_org_id;
END;
$$;

-- ========================================
-- STEP 4: CREATE RLS POLICIES
-- ========================================

-- Users table policies
CREATE POLICY "users_organization_policy" ON users
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "users_own_data_policy" ON users
    FOR ALL
    TO authenticated_users
    USING (clerk_user_id = current_user_id());

-- User preferences and security policies
CREATE POLICY "user_preferences_organization_policy" ON user_preferences
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "user_security_organization_policy" ON user_security
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

-- Financial data policies
CREATE POLICY "transactions_organization_policy" ON transactions
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "transaction_categories_organization_policy" ON transaction_categories
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "transaction_schedules_organization_policy" ON transaction_schedules
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

-- Bank accounts policies
CREATE POLICY "bank_accounts_organization_policy" ON bank_accounts
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "account_balance_history_organization_policy" ON account_balance_history
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

-- PIX policies
CREATE POLICY "pix_keys_organization_policy" ON pix_keys
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "pix_qr_codes_organization_policy" ON pix_qr_codes
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "pix_transactions_organization_policy" ON pix_transactions
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

-- Boletos policies
CREATE POLICY "boletos_organization_policy" ON boletos
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "boleto_payments_organization_policy" ON boleto_payments
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

-- Contacts policies
CREATE POLICY "contacts_organization_policy" ON contacts
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "contact_payment_methods_organization_policy" ON contact_payment_methods
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

-- Notification policies
CREATE POLICY "notifications_organization_policy" ON notifications
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "notification_logs_organization_policy" ON notification_logs
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "alert_rules_organization_policy" ON alert_rules
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

-- LGPD compliance policies
CREATE POLICY "lgpd_consents_organization_policy" ON lgpd_consents
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "lgpd_consent_logs_organization_policy" ON lgpd_consent_logs
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "lgpd_export_requests_organization_policy" ON lgpd_export_requests
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "data_deletion_requests_organization_policy" ON data_deletion_requests
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "data_retention_policies_organization_policy" ON data_retention_policies
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "transaction_limits_organization_policy" ON transaction_limits
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "compliance_audit_logs_organization_policy" ON compliance_audit_logs
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

-- AI and voice data policies
CREATE POLICY "voice_commands_organization_policy" ON voice_commands
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "chat_sessions_organization_policy" ON chat_sessions
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "chat_messages_organization_policy" ON chat_messages
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "ai_insights_organization_policy" ON ai_insights
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "budget_categories_organization_policy" ON budget_categories
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "spending_patterns_organization_policy" ON spending_patterns
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "command_intents_organization_policy" ON command_intents
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

-- Audit policies
CREATE POLICY "audit_logs_organization_policy" ON audit_logs
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "error_logs_organization_policy" ON error_logs
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "user_sessions_organization_policy" ON user_sessions
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

-- Calendar and events policies
CREATE POLICY "financial_events_organization_policy" ON financial_events
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "event_types_organization_policy" ON event_types
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "event_reminders_organization_policy" ON event_reminders
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

-- Billing policies
CREATE POLICY "subscriptions_organization_policy" ON subscriptions
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

CREATE POLICY "payment_history_organization_policy" ON payment_history
    FOR ALL
    TO authenticated_users
    USING (organization_id = get_current_organization_id());

-- ========================================
-- STEP 5: CREATE INDEXES FOR RLS PERFORMANCE
-- ========================================

-- Organization indexes for all critical tables
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_organization_id ON transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_organization_id ON bank_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_pix_keys_organization_id ON pix_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_pix_keys_user_id ON pix_keys(user_id);

CREATE INDEX IF NOT EXISTS idx_pix_transactions_organization_id ON pix_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_user_id ON pix_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_date ON pix_transactions(transaction_date);

CREATE INDEX IF NOT EXISTS idx_boletos_organization_id ON boletos(organization_id);
CREATE INDEX IF NOT EXISTS idx_boletos_user_id ON boletos(user_id);

CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

CREATE INDEX IF NOT EXISTS idx_lgpd_consents_organization_id ON lgpd_consents(organization_id);
CREATE INDEX IF NOT EXISTS idx_lgpd_consents_user_id ON lgpd_consents(user_id);

CREATE INDEX IF NOT EXISTS idx_compliance_audit_logs_organization_id ON compliance_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_logs_user_id ON compliance_audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_voice_commands_organization_id ON voice_commands(organization_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_user_id ON voice_commands(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_organization_id ON chat_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- ========================================
-- STEP 6: CREATE AUDIT TRIGGERS
-- ========================================

-- Function to audit data changes
CREATE OR REPLACE FUNCTION audit_data_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert into audit_logs for all DML operations
    INSERT INTO audit_logs (
        user_id,
        organization_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        created_at
    ) VALUES (
        COALESCE(current_user_id(), 'system'),
        get_current_organization_id(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create audit triggers on critical tables
CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_data_changes();

CREATE TRIGGER audit_transactions_changes
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit_data_changes();

CREATE TRIGGER audit_bank_accounts_changes
    AFTER INSERT OR UPDATE OR DELETE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION audit_data_changes();

CREATE TRIGGER audit_pix_transactions_changes
    AFTER INSERT OR UPDATE OR DELETE ON pix_transactions
    FOR EACH ROW EXECUTE FUNCTION audit_data_changes();

CREATE TRIGGER audit_boletos_changes
    AFTER INSERT OR UPDATE OR DELETE ON boletos
    FOR EACH ROW EXECUTE FUNCTION audit_data_changes();

CREATE TRIGGER audit_lgpd_consents_changes
    AFTER INSERT OR UPDATE OR DELETE ON lgpd_consents
    FOR EACH ROW EXECUTE FUNCTION audit_data_changes();

CREATE TRIGGER audit_data_deletion_requests_changes
    AFTER INSERT OR UPDATE OR DELETE ON data_deletion_requests
    FOR EACH ROW EXECUTE FUNCTION audit_data_changes();

-- ========================================
-- STEP 7: CREATE VALIDATION CONSTRAINTS
-- ========================================

-- Ensure organization_id is never null in critical tables
ALTER TABLE users ADD CONSTRAINT chk_users_org_not_null CHECK (organization_id IS NOT NULL);
ALTER TABLE transactions ADD CONSTRAINT chk_transactions_org_not_null CHECK (organization_id IS NOT NULL);
ALTER TABLE bank_accounts ADD CONSTRAINT chk_bank_accounts_org_not_null CHECK (organization_id IS NOT NULL);
ALTER TABLE pix_keys ADD CONSTRAINT chk_pix_keys_org_not_null CHECK (organization_id IS NOT NULL);
ALTER TABLE pix_transactions ADD CONSTRAINT chk_pix_transactions_org_not_null CHECK (organization_id IS NOT NULL);

-- ========================================
-- STEP 8: CREATE ROLE FOR AUTHENTICATED USERS
-- ========================================

-- Create role for authenticated users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated_users') THEN
        CREATE ROLE authenticated_users;
    END IF;
END
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated_users;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated_users;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO authenticated_users;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO authenticated_users;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO authenticated_users;

-- Ensure future tables also have permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated_users;

-- ========================================
-- STEP 9: CREATE TESTING FUNCTIONS
-- ========================================

-- Function to test RLS policies
CREATE OR REPLACE FUNCTION test_rls_isolation(test_org_id TEXT)
RETURNS TABLE(table_name TEXT, accessible_rows BIGINT, expected_org_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Set test organization context
    EXECUTE format('SET LOCAL app.current_org_id = %L', test_org_id);
    
    -- Test various tables
    RETURN QUERY
    SELECT 'users'::TEXT, COUNT(*)::BIGINT, test_org_id FROM users
    UNION ALL
    SELECT 'transactions'::TEXT, COUNT(*)::BIGINT, test_org_id FROM transactions
    UNION ALL
    SELECT 'bank_accounts'::TEXT, COUNT(*)::BIGINT, test_org_id FROM bank_accounts
    UNION ALL
    SELECT 'pix_transactions'::TEXT, COUNT(*)::BIGINT, test_org_id FROM pix_transactions
    UNION ALL
    SELECT 'lgpd_consents'::TEXT, COUNT(*)::BIGINT, test_org_id FROM lgpd_consents;
END;
$$;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- This migration implements:
-- 1. Organization-based multi-tenancy with organization_id columns
-- 2. Row Level Security policies for data isolation
-- 3. Performance-optimized indexes for RLS queries
-- 4. Comprehensive audit trails for compliance
-- 5. LGPD-compliant data segregation
-- 6. Production-ready security constraints
