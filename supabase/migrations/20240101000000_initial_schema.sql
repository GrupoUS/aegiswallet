-- =============================================================================
-- 🚀 AegisWallet - Initial Database Schema
-- =============================================================================
-- Migration: 20240101000000_initial_schema.sql
-- Based on: docs/architecture.md

-- =============================================================================
-- 🔐 Users Table (extends auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  autonomy_level INTEGER DEFAULT 50 CHECK (autonomy_level >= 50 AND autonomy_level <= 95),
  voice_command_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================================================
-- 🏦 Bank Accounts Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  belvo_account_id TEXT UNIQUE NOT NULL,
  institution_id TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  account_mask TEXT NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================================================
-- 💳 Transactions Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_categorized BOOLEAN DEFAULT false,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================================================
-- 🎤 Voice Commands Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS voice_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  intent TEXT NOT NULL,
  confidence DECIMAL(3,2),
  response TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================================================
-- 💰 PIX Transactions Table (Future Implementation)
-- =============================================================================
CREATE TABLE IF NOT EXISTS pix_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  key TEXT NOT NULL,
  key_type TEXT NOT NULL CHECK (key_type IN ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM')),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  recipient_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  transaction_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================================================
-- 📋 Bills/Boletos Table (Future Implementation)
-- =============================================================================
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  barcode TEXT UNIQUE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================================================
-- 📊 Categories Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT 'circle',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================================================
-- 🔍 Indexes for Performance
-- =============================================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_autonomy_level ON users(autonomy_level);

-- Bank Accounts
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_active ON bank_accounts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_sync ON bank_accounts(user_id, last_sync);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_bank_account ON transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_amount_range ON transactions(amount, transaction_date);

-- Voice Commands
CREATE INDEX IF NOT EXISTS idx_voice_commands_user_date ON voice_commands(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_commands_confidence ON voice_commands(user_id, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_voice_commands_intent ON voice_commands(intent);

-- PIX Transactions
CREATE INDEX IF NOT EXISTS idx_pix_transactions_user_date ON pix_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_status ON pix_transactions(status);

-- Bills
CREATE INDEX IF NOT EXISTS idx_bills_user_due_date ON bills(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_system ON categories(is_system);

-- =============================================================================
-- 🕐 Updated At Triggers
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pix_transactions_updated_at BEFORE UPDATE ON pix_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 🔒 Default Categories Insertion
-- =============================================================================
INSERT INTO categories (name, color, icon, is_system) VALUES
  ('Alimentação', '#EF4444', 'utensils', true),
  ('Transporte', '#F59E0B', 'car', true),
  ('Moradia', '#10B981', 'home', true),
  ('Saúde', '#8B5CF6', 'heart', true),
  ('Educação', '#3B82F6', 'book', true),
  ('Lazer', '#EC4899', 'gamepad-2', true),
  ('Compras', '#6366F1', 'shopping-cart', true),
  ('Serviços', '#14B8A6', 'wrench', true),
  ('Investimentos', '#059669', 'trending-up', true),
  ('Outros', '#6B7280', 'circle', true)
ON CONFLICT DO NOTHING;