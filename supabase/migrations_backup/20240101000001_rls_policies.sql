-- =============================================================================
-- 🔐 Row Level Security (RLS) Policies
-- =============================================================================
-- Migration: 20240101000001_rls_policies.sql
-- LGPD Compliance & Data Isolation

-- =============================================================================
-- Enable RLS on All Tables
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 👤 Users Table Policies
-- =============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================================================
-- 🏦 Bank Accounts Policies
-- =============================================================================

-- Users can view their own bank accounts
CREATE POLICY "Users can view own bank accounts" ON bank_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create bank accounts for themselves
CREATE POLICY "Users can create own bank accounts" ON bank_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own bank accounts
CREATE POLICY "Users can update own bank accounts" ON bank_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own bank accounts
CREATE POLICY "Users can delete own bank accounts" ON bank_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 💳 Transactions Policies
-- =============================================================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create transactions for themselves
CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own transactions
CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- 🎤 Voice Commands Policies
-- =============================================================================

-- Users can view their own voice commands
CREATE POLICY "Users can view own voice commands" ON voice_commands
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create voice commands for themselves
CREATE POLICY "Users can create own voice commands" ON voice_commands
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 💰 PIX Transactions Policies
-- =============================================================================

-- Users can view their own PIX transactions
CREATE POLICY "Users can view own pix transactions" ON pix_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create PIX transactions for themselves
CREATE POLICY "Users can create own pix transactions" ON pix_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own PIX transactions (status updates)
CREATE POLICY "Users can update own pix transactions" ON pix_transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- 📋 Bills Policies
-- =============================================================================

-- Users can view their own bills
CREATE POLICY "Users can view own bills" ON bills
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create bills for themselves
CREATE POLICY "Users can create own bills" ON bills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own bills
CREATE POLICY "Users can update own bills" ON bills
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own bills
CREATE POLICY "Users can delete own bills" ON bills
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 📊 Categories Policies (Read-only for Users)
-- =============================================================================

-- All authenticated users can view categories
CREATE POLICY "All authenticated users can view categories" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================================================
-- 🔐 Security Functions and Helpers
-- =============================================================================

-- Function to check if user owns a specific bank account
CREATE OR REPLACE FUNCTION user_owns_bank_account(bank_account_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bank_accounts 
    WHERE id = bank_account_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns a specific transaction
CREATE OR REPLACE FUNCTION user_owns_transaction(transaction_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM transactions 
    WHERE id = transaction_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current autonomy level
CREATE OR REPLACE FUNCTION get_user_autonomy_level()
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT autonomy_level FROM users WHERE id = auth.uid()),
    50 -- Default autonomy level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 📈 Audit Trail Functions
-- =============================================================================

-- Function to log sensitive operations
CREATE OR REPLACE FUNCTION log_sensitive_operation(
  operation_type TEXT,
  table_name TEXT,
  record_id UUID,
  details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (user_id, operation_type, table_name, record_id, details, created_at)
  VALUES (auth.uid(), operation_type, table_name, record_id, details, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  operation_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs policy - users can only see their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Admin function to create audit logs (service role only)
CREATE POLICY "Service role can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- =============================================================================
-- 🔍 Data Retention Policies (LGPD Compliance)
-- =============================================================================

-- Function to delete old voice commands (1 year retention)
CREATE OR REPLACE FUNCTION cleanup_old_voice_commands()
RETURNS VOID AS $$
BEGIN
  DELETE FROM voice_commands 
  WHERE created_at < now() - interval '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete old audit logs (2 years retention)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS VOID AS $$
BEGIN
  DELETE FROM audit_logs 
  WHERE created_at < now() - interval '2 years';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;