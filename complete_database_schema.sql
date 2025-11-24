-- ========================================
-- AegisWallet - Complete Database Schema
-- ========================================
-- Brazilian Autonomous Financial Assistant
-- ========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "http";

-- ========================================
-- 1. USER MANAGEMENT & AUTHENTICATION
-- ========================================

-- User profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    cpf TEXT UNIQUE, -- Brazilian CPF
    birth_date DATE,
    autonomy_level INTEGER DEFAULT 50 CHECK (autonomy_level >= 50 AND autonomy_level <= 95),
    voice_command_enabled BOOLEAN DEFAULT true,
    language TEXT DEFAULT 'pt-BR',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    currency TEXT DEFAULT 'BRL',
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User preferences and settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'system', -- light, dark, system
    notifications_email BOOLEAN DEFAULT true,
    notifications_push BOOLEAN DEFAULT true,
    notifications_sms BOOLEAN DEFAULT false,
    auto_categorize BOOLEAN DEFAULT true,
    budget_alerts BOOLEAN DEFAULT true,
    voice_feedback BOOLEAN DEFAULT true,
    accessibility_high_contrast BOOLEAN DEFAULT false,
    accessibility_large_text BOOLEAN DEFAULT false,
    accessibility_screen_reader BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- User security settings
CREATE TABLE IF NOT EXISTS user_security (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    biometric_enabled BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    voice_biometric_enabled BOOLEAN DEFAULT false,
    voice_sample_encrypted TEXT,
    session_timeout_minutes INTEGER DEFAULT 30,
    max_failed_attempts INTEGER DEFAULT 5,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- ========================================
-- 2. BANK ACCOUNTS & INTEGRATION
-- ========================================

-- Bank accounts (Belvo integration)
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    belvo_account_id TEXT UNIQUE NOT NULL,
    institution_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    account_type TEXT NOT NULL, -- CHECKING, SAVINGS, INVESTMENT
    account_number TEXT,
    account_mask TEXT NOT NULL,
    account_holder_name TEXT,
    balance DECIMAL(15,2) DEFAULT 0,
    available_balance DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'BRL',
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'pending', -- pending, success, error
    sync_error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Account balance history
CREATE TABLE IF NOT EXISTS account_balance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
    balance DECIMAL(15,2) NOT NULL,
    available_balance DECIMAL(15,2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    source TEXT DEFAULT 'sync' -- sync, manual, correction
);

-- Bank synchronization logs
CREATE TABLE IF NOT EXISTS bank_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL, -- full, incremental, balance_only
    status TEXT NOT NULL, -- started, success, error, partial
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER
);

-- ========================================
-- 3. TRANSACTIONS & FINANCIAL DATA
-- ========================================

-- Transaction categories
CREATE TABLE IF NOT EXISTS transaction_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6B7280',
    icon TEXT DEFAULT 'circle',
    is_system BOOLEAN DEFAULT false, -- System categories vs user-created
    parent_id UUID REFERENCES transaction_categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, name)
);

-- All financial transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    original_amount DECIMAL(15,2), -- Before currency conversion
    currency TEXT DEFAULT 'BRL',
    description TEXT NOT NULL,
    merchant_name TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    posted_date TIMESTAMP WITH TIME ZONE,
    transaction_type TEXT NOT NULL, -- debit, credit, transfer, pix, boleto
    payment_method TEXT, -- debit_card, credit_card, pix, boleto, cash
    status TEXT DEFAULT 'posted', -- pending, posted, failed, cancelled
    is_recurring BOOLEAN DEFAULT false,
    recurring_rule JSONB, -- RRULE for recurring transactions
    tags TEXT[], -- Array of tags for better search
    notes TEXT,
    attachments TEXT[], -- URLs to receipts or documents
    confidence_score DECIMAL(3,2), -- AI categorization confidence
    is_categorized BOOLEAN DEFAULT false,
    is_manual_entry BOOLEAN DEFAULT false,
    external_id TEXT, -- ID from external system (Belvo, etc.)
    external_source TEXT, -- belvo, manual, import
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transaction schedules (future payments)
CREATE TABLE IF NOT EXISTS transaction_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    recipient_name TEXT,
    recipient_account TEXT, -- For transfers
    recipient_pix_key TEXT, -- For PIX transfers
    scheduled_date DATE NOT NULL,
    recurrence_rule TEXT, -- RRULE format
    is_active BOOLEAN DEFAULT true,
    auto_execute BOOLEAN DEFAULT false,
    notification_sent BOOLEAN DEFAULT false,
    executed BOOLEAN DEFAULT false,
    executed_transaction_id UUID REFERENCES transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================================
-- 4. FINANCIAL CALENDAR & EVENTS
-- ========================================

-- Event types for calendar
CREATE TABLE IF NOT EXISTS event_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'calendar',
    is_system BOOLEAN DEFAULT true,
    default_reminder_hours INTEGER DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financial events table
-- Last updated: 2025-11-25
-- Reflects migrations: 20251006115133, 20251007210500, 20251125
CREATE TABLE IF NOT EXISTS financial_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('income', 'expense', 'bill', 'scheduled', 'transfer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'scheduled', 'cancelled', 'completed')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN DEFAULT false,
    color TEXT NOT NULL DEFAULT 'blue',
    icon TEXT,
    is_income BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    parent_event_id UUID REFERENCES financial_events(id) ON DELETE CASCADE,
    location TEXT,
    notes TEXT,
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    priority TEXT DEFAULT 'normal',
    tags TEXT[],
    attachments TEXT[],
    brazilian_event_type TEXT,
    installment_info JSONB,
    merchant_category TEXT,
    metadata JSONB,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Event reminders
CREATE TABLE IF NOT EXISTS event_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES financial_events(id) ON DELETE CASCADE,
    remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    reminder_type TEXT DEFAULT 'notification', -- notification, email, sms, voice
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================================
-- 5. PIX SYSTEM (Enhanced from existing)
-- ========================================

-- PIX keys (enhanced from existing)
CREATE TABLE IF NOT EXISTS pix_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_type TEXT NOT NULL CHECK (key_type IN ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM')),
    key_value TEXT NOT NULL,
    key_name TEXT NOT NULL,
    bank_name TEXT,
    is_favorite BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    verification_status TEXT DEFAULT 'pending', -- pending, verified, rejected
    last_used TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, key_type, key_value)
);

-- PIX transactions (enhanced from existing)
CREATE TABLE IF NOT EXISTS pix_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    end_to_end_id TEXT UNIQUE, -- Official PIX identifier
    pix_key TEXT NOT NULL,
    pix_key_type TEXT NOT NULL CHECK (pix_key_type IN ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM')),
    recipient_name TEXT NOT NULL,
    recipient_document TEXT,
    recipient_bank TEXT,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed')),
    transaction_type TEXT DEFAULT 'sent' CHECK (transaction_type IN ('sent', 'received', 'scheduled')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    qr_code_id UUID REFERENCES pix_qr_codes(id),
    external_id TEXT, -- ID from PIX provider
    error_message TEXT,
    fee_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- PIX QR codes (enhanced from existing)
CREATE TABLE IF NOT EXISTS pix_qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    qr_code_data TEXT NOT NULL,
    pix_copy_paste TEXT NOT NULL,
    amount DECIMAL(15,2),
    description TEXT,
    recipient_name TEXT,
    recipient_pix_key TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_single_use BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================================
-- 6. CONTACTS & RECIPIENTS
-- ========================================

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    cpf TEXT,
    cnpj TEXT,
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, email),
    UNIQUE(user_id, phone)
);

-- Contact payment methods
CREATE TABLE IF NOT EXISTS contact_payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    method_type TEXT NOT NULL CHECK (method_type IN ('PIX', 'BANK_ACCOUNT', 'BOLETO')),
    method_details JSONB NOT NULL, -- Store method-specific data
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================================
-- 7. BOLETOS & PAYMENTS
-- ========================================

-- Boletos (Brazilian payment slips)
CREATE TABLE IF NOT EXISTS boletos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    barcode TEXT UNIQUE NOT NULL,
    line_id_digitable TEXT UNIQUE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    beneficiary_name TEXT NOT NULL,
    beneficiary_cnpj TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'scheduled')),
    payment_date TIMESTAMP WITH TIME ZONE,
    paid_amount DECIMAL(15,2),
    paid_with TEXT, -- balance, credit_card, etc.
    transaction_id UUID REFERENCES transactions(id),
    fine_amount DECIMAL(15,2) DEFAULT 0,
    interest_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Boleto payments
CREATE TABLE IF NOT EXISTS boleto_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boleto_id UUID REFERENCES boletos(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    payment_method TEXT NOT NULL,
    transaction_id UUID REFERENCES transactions(id),
    status TEXT DEFAULT 'processing', -- processing, completed, failed
    external_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================================
-- 8. VOICE COMMANDS & AI
-- ========================================

-- Voice commands history
CREATE TABLE IF NOT EXISTS voice_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    command_text TEXT NOT NULL,
    audio_file_url TEXT,
    intent TEXT NOT NULL,
    intent_confidence DECIMAL(3,2),
    entities JSONB, -- Extracted entities from NLP
    response_text TEXT,
    response_audio_url TEXT,
    processing_time_ms INTEGER,
    status TEXT DEFAULT 'processed', -- processed, failed, cancelled
    error_message TEXT,
    context JSONB, -- Previous conversation context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Command intents and patterns
CREATE TABLE IF NOT EXISTS command_intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intent_name TEXT NOT NULL UNIQUE,
    description TEXT,
    example_phrases TEXT[], -- Example phrases for training
    required_entities TEXT[], -- Required entities for this intent
    action_handler TEXT, -- Function to handle this intent
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI insights and recommendations
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL, -- spending_pattern, budget_alert, opportunity, warning
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    recommendation TEXT,
    impact_level TEXT DEFAULT 'medium', -- low, medium, high
    category_id UUID REFERENCES transaction_categories(id),
    data JSONB, -- Supporting data for the insight
    is_read BOOLEAN DEFAULT false,
    is_actioned BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Spending patterns analysis
CREATE TABLE IF NOT EXISTS spending_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES transaction_categories(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type TEXT NOT NULL, -- daily, weekly, monthly, yearly
    total_amount DECIMAL(15,2) NOT NULL,
    transaction_count INTEGER NOT NULL,
    average_transaction DECIMAL(15,2),
    trend_percentage DECIMAL(5,2), -- Percentage change from previous period
    pattern_data JSONB, -- Additional pattern metrics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, category_id, period_start, period_end, period_type)
);

-- Budget categories
CREATE TABLE IF NOT EXISTS budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES transaction_categories(id) ON DELETE CASCADE,
    budget_amount DECIMAL(15,2) NOT NULL,
    period_type TEXT NOT NULL, -- monthly, yearly
    alert_threshold DECIMAL(5,2) DEFAULT 80, -- Percentage threshold for alerts
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, category_id, period_type)
);

-- ========================================
-- 9. NOTIFICATIONS & ALERTS
-- ========================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- info, warning, error, success
    category TEXT, -- transaction, calendar, budget, security, system
    priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    action_text TEXT,
    metadata JSONB, -- Additional data
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Alert rules
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- budget_threshold, large_transaction, unusual_activity
    conditions JSONB NOT NULL, -- Rule conditions
    actions JSONB NOT NULL, -- Actions to take when triggered
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notification delivery logs
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    delivery_method TEXT NOT NULL, -- push, email, sms, voice
    status TEXT NOT NULL, -- sent, delivered, failed, bounced
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    external_id TEXT, -- ID from delivery service
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================================
-- 10. AUDIT & LOGGING
-- ========================================

-- Audit logs for all user actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- login, create_transaction, update_profile, etc.
    resource_type TEXT, -- transaction, account, contact, etc.
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Error logs
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    error_type TEXT NOT NULL, -- validation, api, database, voice_processing
    error_code TEXT,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB, -- Additional context data
    user_agent TEXT,
    ip_address INET,
    session_id TEXT,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    device_type TEXT, -- web, mobile, desktop
    device_id TEXT,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_description ON transactions USING gin(to_tsvector('portuguese', description));

-- PIX transactions indexes
CREATE INDEX IF NOT EXISTS idx_pix_transactions_user ON pix_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_end_to_end ON pix_transactions(end_to_end_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_status ON pix_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_date ON pix_transactions(transaction_date DESC);

-- Financial events indexes
CREATE INDEX IF NOT EXISTS idx_financial_events_user_dates ON financial_events(user_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_financial_events_type ON financial_events(event_type);
CREATE INDEX IF NOT EXISTS idx_financial_events_status ON financial_events(status);
CREATE INDEX IF NOT EXISTS idx_financial_events_recurring ON financial_events(is_recurring, parent_event_id) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_financial_events_brazilian_event_type ON financial_events(brazilian_event_type);
CREATE INDEX IF NOT EXISTS idx_financial_events_merchant_category ON financial_events(merchant_category);
CREATE INDEX IF NOT EXISTS idx_financial_events_transaction ON financial_events(transaction_id) WHERE transaction_id IS NOT NULL;

-- Voice commands indexes
CREATE INDEX IF NOT EXISTS idx_voice_commands_user ON voice_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_intent ON voice_commands(intent);
CREATE INDEX IF NOT EXISTS idx_voice_commands_created ON voice_commands(created_at DESC);

-- Bank accounts indexes
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_sync ON bank_accounts(user_id, last_sync);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_active ON bank_accounts(is_active);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_security_updated_at BEFORE UPDATE ON user_security
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_schedules_updated_at BEFORE UPDATE ON transaction_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_events_updated_at BEFORE UPDATE ON financial_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pix_keys_updated_at BEFORE UPDATE ON pix_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pix_transactions_updated_at BEFORE UPDATE ON pix_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pix_qr_codes_updated_at BEFORE UPDATE ON pix_qr_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_payment_methods_updated_at BEFORE UPDATE ON contact_payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boletos_updated_at BEFORE UPDATE ON boletos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_categories_updated_at BEFORE UPDATE ON transaction_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_categories_updated_at BEFORE UPDATE ON budget_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON alert_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE boleto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- User preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- User security
CREATE POLICY "Users can manage own security settings" ON user_security
    FOR ALL USING (auth.uid() = user_id);

-- Bank accounts
CREATE POLICY "Users can manage own bank accounts" ON bank_accounts
    FOR ALL USING (auth.uid() = user_id);

-- Account balance history
CREATE POLICY "Users can view own balance history" ON account_balance_history
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM bank_accounts WHERE id = account_id));

-- Bank sync logs
CREATE POLICY "Users can view own sync logs" ON bank_sync_logs
    FOR ALL USING (auth.uid() = user_id);

-- Transaction categories
CREATE POLICY "Users can manage own categories" ON transaction_categories
    FOR ALL USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can manage own transactions" ON transactions
    FOR ALL USING (auth.uid() = user_id);

-- Transaction schedules
CREATE POLICY "Users can manage own scheduled transactions" ON transaction_schedules
    FOR ALL USING (auth.uid() = user_id);

-- Financial events
CREATE POLICY "Users can manage own financial events" ON financial_events
    FOR ALL USING (auth.uid() = user_id);

-- Event reminders
CREATE POLICY "Users can manage own event reminders" ON event_reminders
    FOR ALL USING (auth.uid() = (SELECT user_id FROM financial_events WHERE id = event_id));

-- PIX keys
CREATE POLICY "Users can manage own PIX keys" ON pix_keys
    FOR ALL USING (auth.uid() = user_id);

-- PIX transactions
CREATE POLICY "Users can manage own PIX transactions" ON pix_transactions
    FOR ALL USING (auth.uid() = user_id);

-- PIX QR codes
CREATE POLICY "Users can manage own QR codes" ON pix_qr_codes
    FOR ALL USING (auth.uid() = user_id);

-- Contacts
CREATE POLICY "Users can manage own contacts" ON contacts
    FOR ALL USING (auth.uid() = user_id);

-- Contact payment methods
CREATE POLICY "Users can manage own contact payment methods" ON contact_payment_methods
    FOR ALL USING (auth.uid() = (SELECT user_id FROM contacts WHERE id = contact_id));

-- Boletos
CREATE POLICY "Users can manage own boletos" ON boletos
    FOR ALL USING (auth.uid() = user_id);

-- Boleto payments
CREATE POLICY "Users can manage own boleto payments" ON boleto_payments
    FOR ALL USING (auth.uid() = (SELECT user_id FROM boletos WHERE id = boleto_id));

-- Voice commands
CREATE POLICY "Users can manage own voice commands" ON voice_commands
    FOR ALL USING (auth.uid() = user_id);

-- AI insights
CREATE POLICY "Users can view own insights" ON ai_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own insights status" ON ai_insights
    FOR UPDATE USING (auth.uid() = user_id);

-- Spending patterns
CREATE POLICY "Users can view own spending patterns" ON spending_patterns
    FOR SELECT USING (auth.uid() = user_id);

-- Budget categories
CREATE POLICY "Users can manage own budget categories" ON budget_categories
    FOR ALL USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can manage own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- Alert rules
CREATE POLICY "Users can manage own alert rules" ON alert_rules
    FOR ALL USING (auth.uid() = user_id);

-- Audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Error logs
CREATE POLICY "Users can view own error logs" ON error_logs
    FOR SELECT USING (auth.uid() = user_id);

-- User sessions
CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL USING (auth.uid() = user_id);

-- ========================================
-- INITIAL DATA
-- ========================================

-- Insert default event types
INSERT INTO event_types (name, description, color, icon) VALUES
    ('bill_payment', 'Pagamento de contas', '#EF4444', 'file-text'),
    ('income', 'Recebimento de renda', '#10B981', 'trending-up'),
    ('transfer', 'Transferência', '#3B82F6', 'send'),
    ('investment', 'Investimento', '#8B5CF6', 'bar-chart'),
    ('loan', 'Empréstimo', '#F59E0B', 'credit-card'),
    ('subscription', 'Assinatura', '#EC4899', 'refresh-cw')
ON CONFLICT (name) DO NOTHING;

-- Insert default command intents
INSERT INTO command_intents (intent_name, description, example_phrases, required_entities, action_handler) VALUES
    ('balance_query', 'Consulta de saldo', ['Como está meu saldo', 'Qual meu saldo', 'Quanto tenho na conta'], '{}', 'handleBalanceQuery'),
    ('payment_query', 'Consulta de pagamentos', ['Tem algum boleto para pagar', 'Quais contas devo pagar', 'Pagamentos programados'], '{}', 'handlePaymentQuery'),
    ('income_query', 'Consulta de recebimentos', ['Tem dinheiro para entrar', 'Recebimentos programados', 'Quanto vou receber'], '{}', 'handleIncomeQuery'),
    ('expense_analysis', 'Análise de gastos', ['Quanto gastei este mês', 'Minhas despesas', 'Para onde foi meu dinheiro'], '{}', 'handleExpenseAnalysis'),
    ('transfer_request', 'Solicitação de transferência', ['Faz uma transferência', 'Envia dinheiro para', 'Paga para fulano'], '{recipient, amount}', 'handleTransferRequest'),
    ('schedule_payment', 'Agendamento de pagamento', ['Paga essa conta', 'Agenda pagamento', 'Programa boleto'], '{description, amount, due_date}', 'handleSchedulePayment')
ON CONFLICT (intent_name) DO NOTHING;

-- ========================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ========================================

-- Function to get user's financial summary
CREATE OR REPLACE FUNCTION get_financial_summary(p_user_id UUID, p_period_start DATE, p_period_end DATE)
RETURNS JSONB AS $$
DECLARE
    v_summary JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_income', COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
        'total_expenses', COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0),
        'net_balance', COALESCE(SUM(amount), 0),
        'transaction_count', COUNT(*),
        'account_balance', COALESCE((SELECT SUM(balance) FROM bank_accounts WHERE user_id = p_user_id AND is_active = true), 0),
        'pending_bills', COALESCE((SELECT COUNT(*) FROM boletos WHERE user_id = p_user_id AND status = 'pending' AND due_date >= CURRENT_DATE), 0),
        'upcoming_events', COALESCE((SELECT COUNT(*) FROM financial_events WHERE user_id = p_user_id AND event_date BETWEEN CURRENT_DATE AND p_period_end AND is_completed = false), 0)
    ) INTO v_summary
    FROM transactions
    WHERE user_id = p_user_id
    AND transaction_date BETWEEN p_period_start AND p_period_end;

    RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update account balance from transaction
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update account balance when transaction is posted
    IF TG_OP = 'INSERT' AND NEW.status = 'posted' AND NEW.account_id IS NOT NULL THEN
        UPDATE bank_accounts
        SET balance = balance + NEW.amount,
            updated_at = now()
        WHERE id = NEW.account_id;
    END IF;

    -- If transaction status changes, adjust balance
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        IF OLD.status = 'posted' AND NEW.status != 'posted' AND NEW.account_id IS NOT NULL THEN
            -- Remove from balance
            UPDATE bank_accounts
            SET balance = balance - OLD.amount,
                updated_at = now()
            WHERE id = NEW.account_id;
        ELSIF OLD.status != 'posted' AND NEW.status = 'posted' AND NEW.account_id IS NOT NULL THEN
            -- Add to balance
            UPDATE bank_accounts
            SET balance = balance + NEW.amount,
                updated_at = now()
            WHERE id = NEW.account_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for balance updates
CREATE TRIGGER update_account_balance_trigger
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Function to generate spending insights
CREATE OR REPLACE FUNCTION generate_spending_insights(p_user_id UUID, p_period_start DATE, p_period_end DATE)
RETURNS TABLE(category_id UUID, category_name TEXT, total_spent DECIMAL, transaction_count INTEGER, percentage_change DECIMAL) AS $$
BEGIN
    RETURN QUERY
    WITH current_period AS (
        SELECT
            tc.id as category_id,
            tc.name as category_name,
            COALESCE(SUM(ABS(t.amount)), 0) as total_spent,
            COUNT(*) as transaction_count
        FROM transactions t
        JOIN transaction_categories tc ON t.category_id = tc.id
        WHERE t.user_id = p_user_id
        AND t.amount < 0 -- Expenses only
        AND t.transaction_date BETWEEN p_period_start AND p_period_end
        AND t.status = 'posted'
        GROUP BY tc.id, tc.name
    ),
    previous_period AS (
        SELECT
            tc.id as category_id,
            COALESCE(SUM(ABS(t.amount)), 0) as total_spent
        FROM transactions t
        JOIN transaction_categories tc ON t.category_id = tc.id
        WHERE t.user_id = p_user_id
        AND t.amount < 0 -- Expenses only
        AND t.transaction_date BETWEEN (p_period_start - INTERVAL '1 month') AND (p_period_end - INTERVAL '1 month')
        AND t.status = 'posted'
        GROUP BY tc.id
    )
    SELECT
        cp.category_id,
        cp.category_name,
        cp.total_spent,
        cp.transaction_count,
        CASE
            WHEN pp.total_spent = 0 THEN 0
            ELSE ROUND(((cp.total_spent - pp.total_spent) / pp.total_spent) * 100, 2)
        END as percentage_change
    FROM current_period cp
    LEFT JOIN previous_period pp ON cp.category_id = pp.category_id
    ORDER BY cp.total_spent DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- View for user's financial dashboard
CREATE OR REPLACE VIEW user_financial_dashboard AS
SELECT
    u.id as user_id,
    u.full_name,
    u.email,
    COALESCE(account_summary.total_balance, 0) as total_balance,
    COALESCE(account_summary.account_count, 0) as account_count,
    COALESCE(transaction_summary.monthly_income, 0) as monthly_income,
    COALESCE(transaction_summary.monthly_expenses, 0) as monthly_expenses,
    COALESCE(pending_bills.count, 0) as pending_bills_count,
    COALESCE(upcoming_events.count, 0) as upcoming_events_count,
    u.last_login
FROM users u
LEFT JOIN (
    SELECT
        user_id,
        SUM(balance) as total_balance,
        COUNT(*) as account_count
    FROM bank_accounts
    WHERE is_active = true
    GROUP BY user_id
) account_summary ON u.id = account_summary.user_id
LEFT JOIN (
    SELECT
        user_id,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as monthly_income,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as monthly_expenses
    FROM transactions
    WHERE transaction_date >= date_trunc('month', CURRENT_DATE)
    AND status = 'posted'
    GROUP BY user_id
) transaction_summary ON u.id = transaction_summary.user_id
LEFT JOIN (
    SELECT
        user_id,
        COUNT(*) as count
    FROM boletos
    WHERE status = 'pending'
    AND due_date >= CURRENT_DATE
    GROUP BY user_id
) pending_bills ON u.id = pending_bills.user_id
LEFT JOIN (
    SELECT
        user_id,
        COUNT(*) as count
    FROM financial_events
    WHERE event_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
    AND is_completed = false
    GROUP BY user_id
) upcoming_events ON u.id = upcoming_events.user_id
WHERE u.is_active = true;

-- View for transaction analytics
CREATE OR REPLACE VIEW transaction_analytics AS
SELECT
    t.user_id,
    tc.name as category_name,
    DATE_TRUNC('month', t.transaction_date) as month,
    SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as income,
    SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as expenses,
    COUNT(*) as transaction_count,
    AVG(ABS(t.amount)) as avg_transaction_amount
FROM transactions t
LEFT JOIN transaction_categories tc ON t.category_id = tc.id
WHERE t.status = 'posted'
GROUP BY t.user_id, tc.name, DATE_TRUNC('month', t.transaction_date);

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON DATABASE postgres IS 'AegisWallet - Brazilian Autonomous Financial Assistant Database';

COMMENT ON TABLE users IS 'User profiles extending auth.users with Brazilian-specific fields';
COMMENT ON TABLE user_preferences IS 'User preferences for UI, notifications, and accessibility';
COMMENT ON TABLE user_security IS 'Security settings including biometrics and 2FA';

COMMENT ON TABLE bank_accounts IS 'Bank accounts integrated via Belvo API';
COMMENT ON TABLE account_balance_history IS 'Historical balance snapshots for analytics';
COMMENT ON TABLE bank_sync_logs IS 'Synchronization logs for bank account integrations';

COMMENT ON TABLE transactions IS 'All financial transactions including debits, credits, transfers';
COMMENT ON TABLE transaction_categories IS 'User-defined and system transaction categories';
COMMENT ON TABLE transaction_schedules IS 'Scheduled future payments and transfers';

COMMENT ON TABLE financial_events IS 'Calendar events for bills, payments, and income';
COMMENT ON TABLE event_types IS 'Types of financial events for calendar';
COMMENT ON TABLE event_reminders IS 'Reminders for financial events';

COMMENT ON TABLE pix_keys IS 'PIX keys for instant Brazilian payments';
COMMENT ON TABLE pix_transactions IS 'PIX transaction records with full status tracking';
COMMENT ON TABLE pix_qr_codes IS 'Generated QR codes for receiving PIX payments';

COMMENT ON TABLE contacts IS 'Contact directory for payments and transfers';
COMMENT ON TABLE contact_payment_methods IS 'Payment methods associated with contacts';

COMMENT ON TABLE boletos IS 'Brazilian payment slips (boletos)';
COMMENT ON TABLE boleto_payments IS 'Payment records for boletos';

COMMENT ON TABLE voice_commands IS 'Voice command history for AI training and analytics';
COMMENT ON TABLE command_intents IS 'Intent patterns for voice command processing';
COMMENT ON TABLE ai_insights IS 'AI-generated financial insights and recommendations';
COMMENT ON TABLE spending_patterns IS 'Analytical spending patterns by category and period';
COMMENT ON TABLE budget_categories IS 'Budget limits and alerts by category';

COMMENT ON TABLE notifications IS 'User notifications and alerts';
COMMENT ON TABLE alert_rules IS 'Custom alert rules for automated monitoring';
COMMENT ON TABLE notification_logs IS 'Delivery logs for notifications';

COMMENT ON TABLE audit_logs IS 'Audit trail for all user actions';
COMMENT ON TABLE error_logs IS 'Error tracking and debugging logs';
COMMENT ON TABLE user_sessions IS 'User session tracking for security';

COMMENT ON VIEW user_financial_dashboard IS 'Comprehensive dashboard view for user financial overview';
COMMENT ON VIEW transaction_analytics IS 'Analytics view for transaction patterns and trends';
