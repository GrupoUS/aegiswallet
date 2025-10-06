-- =============================================================================
-- 📅 Financial Events Table - Calendar System
-- =============================================================================
-- Migration: 20251006115133_financial_events.sql
-- Purpose: Store financial events for calendar tracking (bills, income, expenses, etc.)

-- =============================================================================
-- 📅 Financial Events Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS financial_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  
  -- Event Details
  title TEXT NOT NULL,
  description TEXT,
  
  -- Financial Information
  amount DECIMAL(15,2) NOT NULL,
  category TEXT,
  
  -- Event Type & Status
  event_type TEXT NOT NULL CHECK (event_type IN ('income', 'expense', 'bill', 'scheduled', 'transfer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'scheduled', 'cancelled')),
  
  -- Date/Time Information
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  
  -- Visual & UX
  color TEXT NOT NULL DEFAULT 'blue' CHECK (color IN ('emerald', 'rose', 'orange', 'blue', 'violet')),
  icon TEXT,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- Store iCal RRULE format for future implementation
  parent_event_id UUID REFERENCES financial_events(id) ON DELETE CASCADE,
  
  -- Additional Info
  location TEXT,
  notes TEXT,
  
  -- Integration
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
  pix_transaction_id UUID REFERENCES pix_transactions(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================================================
-- 🔍 Indexes for Performance
-- =============================================================================
-- Index for user_id + date range queries (most common)
CREATE INDEX IF NOT EXISTS idx_financial_events_user_dates 
  ON financial_events(user_id, start_date, end_date);

-- Index for event type filtering
CREATE INDEX IF NOT EXISTS idx_financial_events_type 
  ON financial_events(event_type);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_financial_events_status 
  ON financial_events(status);

-- Index for recurring events
CREATE INDEX IF NOT EXISTS idx_financial_events_recurring 
  ON financial_events(is_recurring, parent_event_id) 
  WHERE is_recurring = true;

-- Index for linked transactions
CREATE INDEX IF NOT EXISTS idx_financial_events_transaction 
  ON financial_events(transaction_id) 
  WHERE transaction_id IS NOT NULL;

-- =============================================================================
-- 🔔 Updated_at Trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION update_financial_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_financial_events_updated_at
  BEFORE UPDATE ON financial_events
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_events_updated_at();

-- =============================================================================
-- 🔐 Row Level Security (RLS)
-- =============================================================================
-- Enable RLS
ALTER TABLE financial_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own events
CREATE POLICY "Users can view own financial events"
  ON financial_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own events
CREATE POLICY "Users can insert own financial events"
  ON financial_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own events
CREATE POLICY "Users can update own financial events"
  ON financial_events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own events
CREATE POLICY "Users can delete own financial events"
  ON financial_events
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 📊 Useful Views
-- =============================================================================
-- View: Upcoming events (next 30 days)
CREATE OR REPLACE VIEW upcoming_financial_events AS
SELECT 
  fe.*,
  ba.institution_name,
  ba.account_mask
FROM financial_events fe
LEFT JOIN bank_accounts ba ON fe.bank_account_id = ba.id
WHERE fe.start_date >= now()
  AND fe.start_date <= now() + interval '30 days'
  AND fe.status IN ('pending', 'scheduled')
ORDER BY fe.start_date ASC;

-- View: Monthly summary
CREATE OR REPLACE VIEW monthly_financial_summary AS
SELECT 
  user_id,
  DATE_TRUNC('month', start_date) as month,
  SUM(CASE WHEN event_type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN event_type IN ('expense', 'bill') THEN ABS(amount) ELSE 0 END) as total_expenses,
  SUM(CASE WHEN event_type = 'income' THEN amount 
           WHEN event_type IN ('expense', 'bill') THEN -ABS(amount) 
           ELSE 0 END) as net_balance,
  COUNT(*) as event_count
FROM financial_events
WHERE status != 'cancelled'
GROUP BY user_id, DATE_TRUNC('month', start_date);

-- =============================================================================
-- 🌱 Seed Data (Development/Testing Only)
-- =============================================================================
-- Note: In production, this should be removed or moved to a separate seed file

-- Function to create sample events for a user
CREATE OR REPLACE FUNCTION seed_financial_events_for_user(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Sample Bill: Energy
  INSERT INTO financial_events (user_id, title, description, amount, event_type, status, start_date, end_date, color, icon, category, is_recurring)
  VALUES (
    p_user_id,
    'Energia Elétrica',
    'Conta de luz mensal',
    -245.67,
    'bill',
    'pending',
    now() + interval '3 days',
    now() + interval '3 days',
    'orange',
    '⚡',
    'utilities',
    true
  );

  -- Sample Income: Salary
  INSERT INTO financial_events (user_id, title, description, amount, event_type, status, start_date, end_date, color, icon, category, is_recurring)
  VALUES (
    p_user_id,
    'Salário',
    'Pagamento mensal',
    3500.00,
    'income',
    'scheduled',
    now() + interval '5 days',
    now() + interval '5 days',
    'emerald',
    '💰',
    'salary',
    true
  );

  -- Sample Expense: Groceries
  INSERT INTO financial_events (user_id, title, description, amount, event_type, status, start_date, end_date, color, icon, category)
  VALUES (
    p_user_id,
    'Supermercado',
    'Compras mensais',
    -345.67,
    'expense',
    'paid',
    now() - interval '1 day',
    now() - interval '1 day',
    'rose',
    '🛒',
    'groceries'
  );

  -- Sample Transfer
  INSERT INTO financial_events (user_id, title, description, amount, event_type, status, start_date, end_date, color, icon, category, is_recurring)
  VALUES (
    p_user_id,
    'Transferência Poupança',
    'Investimento mensal',
    -500.00,
    'transfer',
    'scheduled',
    now() + interval '1 day',
    now() + interval '1 day',
    'violet',
    '💸',
    'savings',
    true
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 📝 Comments for Documentation
-- =============================================================================
COMMENT ON TABLE financial_events IS 'Stores financial events for calendar tracking including bills, income, expenses, and scheduled payments';
COMMENT ON COLUMN financial_events.event_type IS 'Type of financial event: income, expense, bill, scheduled, or transfer';
COMMENT ON COLUMN financial_events.status IS 'Current status: pending, paid, scheduled, or cancelled';
COMMENT ON COLUMN financial_events.color IS 'UI color for calendar display: emerald (income), rose (expense), orange (bill), blue (scheduled), violet (transfer)';
COMMENT ON COLUMN financial_events.recurrence_rule IS 'iCal RRULE format for recurring events (future implementation)';
COMMENT ON COLUMN financial_events.parent_event_id IS 'Reference to parent event if this is a recurring instance';

-- =============================================================================
-- ✅ Migration Complete
-- =============================================================================
-- Table: financial_events
-- Indexes: 5 performance indexes
-- Triggers: 1 updated_at trigger
-- RLS: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- Views: 2 helper views
-- Functions: 1 seed function for testing
