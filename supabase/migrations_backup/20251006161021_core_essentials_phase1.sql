-- ========================================
-- AegisWallet - Phase 1 Core Essentials Migration
-- ========================================
-- This migration includes the essential tables needed for MVP
-- ========================================

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- ========================================
-- 3. TRANSACTIONS & CATEGORIES
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

-- Financial events (bills, payments, income)
CREATE TABLE IF NOT EXISTS financial_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type_id UUID REFERENCES event_types(id),
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(15,2),
    is_income BOOLEAN DEFAULT false,
    account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
    event_date DATE NOT NULL,
    due_date DATE,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT, -- RRULE format
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    transaction_id UUID REFERENCES transactions(id),
    priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
    tags TEXT[],
    attachments TEXT[],
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
-- 5. BASIC CONTACTS
-- ========================================

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    cpf TEXT,
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, email),
    UNIQUE(user_id, phone)
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

-- Bank accounts indexes
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_sync ON bank_accounts(user_id, last_sync);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_active ON bank_accounts(is_active);

-- Financial events indexes
CREATE INDEX IF NOT EXISTS idx_financial_events_user_date ON financial_events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_financial_events_type ON financial_events(event_type_id);
CREATE INDEX IF NOT EXISTS idx_financial_events_completed ON financial_events(is_completed);

-- Transaction categories indexes
CREATE INDEX IF NOT EXISTS idx_transaction_categories_user ON transaction_categories(user_id);

-- Transaction schedules indexes
CREATE INDEX IF NOT EXISTS idx_transaction_schedules_user ON transaction_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_schedules_date ON transaction_schedules(scheduled_date);

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_favorite ON contacts(is_favorite);

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

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_schedules_updated_at BEFORE UPDATE ON transaction_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_events_updated_at BEFORE UPDATE ON financial_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_categories_updated_at BEFORE UPDATE ON transaction_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- User preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Bank accounts
CREATE POLICY "Users can manage own bank accounts" ON bank_accounts
    FOR ALL USING (auth.uid() = user_id);

-- Account balance history
CREATE POLICY "Users can view own balance history" ON account_balance_history
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM bank_accounts WHERE id = account_id));

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

-- Contacts
CREATE POLICY "Users can manage own contacts" ON contacts
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
        'pending_schedules', COALESCE((SELECT COUNT(*) FROM transaction_schedules WHERE user_id = p_user_id AND scheduled_date >= CURRENT_DATE AND executed = false), 0),
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
    COALESCE(pending_schedules.count, 0) as pending_schedules_count,
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
    FROM transaction_schedules 
    WHERE executed = false 
    AND scheduled_date >= CURRENT_DATE
    GROUP BY user_id
) pending_schedules ON u.id = pending_schedules.user_id
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

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE users IS 'User profiles extending auth.users with Brazilian-specific fields';
COMMENT ON TABLE user_preferences IS 'User preferences for UI, notifications, and accessibility';
COMMENT ON TABLE bank_accounts IS 'Bank accounts integrated via Belvo API';
COMMENT ON TABLE account_balance_history IS 'Historical balance snapshots for analytics';
COMMENT ON TABLE transactions IS 'All financial transactions including debits, credits, transfers';
COMMENT ON TABLE transaction_categories IS 'User-defined and system transaction categories';
COMMENT ON TABLE transaction_schedules IS 'Scheduled future payments and transfers';
COMMENT ON TABLE financial_events IS 'Calendar events for bills, payments, and income';
COMMENT ON TABLE event_types IS 'Types of financial events for calendar';
COMMENT ON TABLE event_reminders IS 'Reminders for financial events';
COMMENT ON TABLE contacts IS 'Contact directory for payments and transfers';

COMMENT ON VIEW user_financial_dashboard IS 'Comprehensive dashboard view for user financial overview';
