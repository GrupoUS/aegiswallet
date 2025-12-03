-- ========================================
-- Add Missing Service Account Bypass Policies
-- ========================================
-- This migration adds service account bypass policies for tables that were missing them

-- Bank Accounts Service Account Policy
DROP POLICY IF EXISTS bank_accounts_service_account ON bank_accounts;
CREATE POLICY bank_accounts_service_account ON bank_accounts
    FOR ALL USING (is_service_account());

-- Transactions Service Account Policy
DROP POLICY IF EXISTS transactions_service_account ON transactions;
CREATE POLICY transactions_service_account ON transactions
    FOR ALL USING (is_service_account());

-- PIX Keys Service Account Policy
DROP POLICY IF EXISTS pix_keys_service_account ON pix_keys;
CREATE POLICY pix_keys_service_account ON pix_keys
    FOR ALL USING (is_service_account());

-- PIX Transactions Service Account Policy
DROP POLICY IF EXISTS pix_transactions_service_account ON pix_transactions;
CREATE POLICY pix_transactions_service_account ON pix_transactions
    FOR ALL USING (is_service_account());

-- Boletos Service Account Policy
DROP POLICY IF EXISTS boletos_service_account ON boletos;
CREATE POLICY boletos_service_account ON boletos
    FOR ALL USING (is_service_account());

-- Contacts Service Account Policy
DROP POLICY IF EXISTS contacts_service_account ON contacts;
CREATE POLICY contacts_service_account ON contacts
    FOR ALL USING (is_service_account());

-- Notifications Service Account Policy
DROP POLICY IF EXISTS notifications_service_account ON notifications;
CREATE POLICY notifications_service_account ON notifications
    FOR ALL USING (is_service_account());

-- Financial Events Service Account Policy
DROP POLICY IF EXISTS financial_events_service_account ON financial_events;
CREATE POLICY financial_events_service_account ON financial_events
    FOR ALL USING (is_service_account());

-- Event Reminders Service Account Policy
DROP POLICY IF EXISTS event_reminders_service_account ON event_reminders;
CREATE POLICY event_reminders_service_account ON event_reminders
    FOR ALL USING (is_service_account());

-- Chat Sessions Service Account Policy
DROP POLICY IF EXISTS chat_sessions_service_account ON chat_sessions;
CREATE POLICY chat_sessions_service_account ON chat_sessions
    FOR ALL USING (is_service_account());

-- Voice Commands Service Account Policy
DROP POLICY IF EXISTS voice_commands_service_account ON voice_commands;
CREATE POLICY voice_commands_service_account ON voice_commands
    FOR ALL USING (is_service_account());

-- AI Insights Service Account Policy
DROP POLICY IF EXISTS ai_insights_service_account ON ai_insights;
CREATE POLICY ai_insights_service_account ON ai_insights
    FOR ALL USING (is_service_account());

-- Organization Members Service Account Policy
DROP POLICY IF EXISTS organization_members_service_account ON organization_members;
CREATE POLICY organization_members_service_account ON organization_members
    FOR ALL USING (is_service_account());

-- Organization Settings Service Account Policy
DROP POLICY IF EXISTS organization_settings_service_account ON organization_settings;
CREATE POLICY organization_settings_service_account ON organization_settings
    FOR ALL USING (is_service_account());