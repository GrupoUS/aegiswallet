-- Migration: Financial Goals and AI Views
-- Description: Creates the financial_goals table with RLS policies and optional AI aggregation views

-- ========================================
-- FINANCIAL GOALS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS "financial_goals" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,

    -- Goal details
    "name" text NOT NULL,
    "description" text,

    -- Financial targets
    "target_amount" decimal(15, 2) NOT NULL,
    "current_amount" decimal(15, 2) DEFAULT 0,

    -- Timeline
    "target_date" timestamp with time zone,

    -- Categorization
    "category" text,
    "priority" text DEFAULT '3',

    -- Status flags
    "is_active" boolean DEFAULT true,
    "is_completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,

    -- Timestamps
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS "idx_financial_goals_user_id" ON "financial_goals"("user_id");
CREATE INDEX IF NOT EXISTS "idx_financial_goals_user_active" ON "financial_goals"("user_id", "is_active") WHERE "is_active" = true;
CREATE INDEX IF NOT EXISTS "idx_financial_goals_target_date" ON "financial_goals"("user_id", "target_date") WHERE "target_date" IS NOT NULL;

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

ALTER TABLE "financial_goals" ENABLE ROW LEVEL SECURITY;

-- Users can only see their own goals
CREATE POLICY "Users can view own financial goals"
    ON "financial_goals"
    FOR SELECT
    USING (user_id = auth.uid()::text);

-- Users can insert their own goals
CREATE POLICY "Users can insert own financial goals"
    ON "financial_goals"
    FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);

-- Users can update their own goals
CREATE POLICY "Users can update own financial goals"
    ON "financial_goals"
    FOR UPDATE
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- Users can delete their own goals
CREATE POLICY "Users can delete own financial goals"
    ON "financial_goals"
    FOR DELETE
    USING (user_id = auth.uid()::text);

-- Service role bypass for backend operations
CREATE POLICY "Service role has full access to financial goals"
    ON "financial_goals"
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ========================================
-- AI AGGREGATION VIEWS
-- Views for efficient AI context retrieval
-- ========================================

-- View: User Financial Summary
-- Aggregates account balances and key metrics
CREATE OR REPLACE VIEW "v_user_financial_summary" AS
SELECT
    u.id as user_id,
    u.full_name,
    COALESCE(SUM(ba.balance) FILTER (WHERE ba.is_active = true), 0) as total_balance,
    COALESCE(SUM(ba.available_balance) FILTER (WHERE ba.is_active = true), 0) as available_balance,
    COALESCE(SUM(ba.balance) FILTER (WHERE ba.account_type = 'checking' AND ba.is_active = true), 0) as checking_balance,
    COALESCE(SUM(ba.balance) FILTER (WHERE ba.account_type = 'savings' AND ba.is_active = true), 0) as savings_balance,
    COALESCE(SUM(ba.balance) FILTER (WHERE ba.account_type = 'credit' AND ba.is_active = true), 0) as credit_balance,
    COALESCE(SUM(ba.balance) FILTER (WHERE ba.account_type = 'investment' AND ba.is_active = true), 0) as investment_balance
FROM "users" u
LEFT JOIN "bank_accounts" ba ON ba.user_id = u.id
GROUP BY u.id, u.full_name;

-- View: Monthly Spending by Category
-- Current month's spending aggregated by category
CREATE OR REPLACE VIEW "v_monthly_spending_by_category" AS
SELECT
    t.user_id,
    t.category_id,
    COALESCE(tc.name, 'Sem categoria') as category_name,
    ABS(SUM(t.amount::numeric)) as total_spent,
    COUNT(*) as transaction_count,
    ABS(AVG(t.amount::numeric)) as average_transaction
FROM "transactions" t
LEFT JOIN "transaction_categories" tc ON tc.id = t.category_id
WHERE
    t.transaction_date >= date_trunc('month', CURRENT_DATE)
    AND t.transaction_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
    AND t.amount::numeric < 0
GROUP BY t.user_id, t.category_id, tc.name;

-- View: Budget Status
-- Current budget utilization for active budgets
CREATE OR REPLACE VIEW "v_budget_status" AS
SELECT
    bc.user_id,
    bc.category_id,
    COALESCE(tc.name, 'Orçamento') as category_name,
    bc.budget_amount::numeric as monthly_limit,
    COALESCE(ms.total_spent, 0) as current_spent,
    bc.budget_amount::numeric - COALESCE(ms.total_spent, 0) as remaining,
    CASE
        WHEN bc.budget_amount::numeric > 0
        THEN (COALESCE(ms.total_spent, 0) / bc.budget_amount::numeric) * 100
        ELSE 0
    END as usage_percent
FROM "budget_categories" bc
LEFT JOIN "transaction_categories" tc ON tc.id = bc.category_id
LEFT JOIN "v_monthly_spending_by_category" ms ON ms.user_id = bc.user_id AND ms.category_id = bc.category_id
WHERE bc.is_active = true;

-- View: Goals Progress
-- Progress tracking for active financial goals
CREATE OR REPLACE VIEW "v_goals_progress" AS
SELECT
    fg.id,
    fg.user_id,
    fg.name,
    fg.target_amount::numeric as target_amount,
    COALESCE(fg.current_amount::numeric, 0) as current_amount,
    CASE
        WHEN fg.target_amount::numeric > 0
        THEN (COALESCE(fg.current_amount::numeric, 0) / fg.target_amount::numeric) * 100
        ELSE 0
    END as progress_percent,
    fg.target_date,
    CASE
        WHEN fg.is_completed = true THEN 'completed'
        WHEN fg.target_date IS NOT NULL AND fg.target_date < CURRENT_TIMESTAMP THEN 'overdue'
        WHEN fg.target_date IS NOT NULL AND fg.target_date < CURRENT_TIMESTAMP + INTERVAL '30 days' THEN 'urgent'
        ELSE 'on_track'
    END as status,
    CASE
        WHEN fg.target_date IS NOT NULL
        THEN GREATEST(0, EXTRACT(DAY FROM fg.target_date - CURRENT_TIMESTAMP))
        ELSE NULL
    END as days_remaining,
    fg.category,
    fg.priority,
    fg.is_active
FROM "financial_goals" fg
WHERE fg.is_active = true;

-- ========================================
-- GRANTS
-- Views inherit RLS from underlying tables
-- ========================================

GRANT SELECT ON "v_user_financial_summary" TO authenticated;
GRANT SELECT ON "v_monthly_spending_by_category" TO authenticated;
GRANT SELECT ON "v_budget_status" TO authenticated;
GRANT SELECT ON "v_goals_progress" TO authenticated;
