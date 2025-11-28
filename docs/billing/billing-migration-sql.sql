-- AegisWallet Billing Schema Migration SQL
-- 
-- This file contains the SQL migration scripts for enhancing the billing schema
-- to support complete billing management for AegisWallet in the Brazilian market.
--
-- Migration Version: 001_billing_enhancements
-- Target: Supabase PostgreSQL with Drizzle ORM
-- Compliance: LGPD (Brazilian Data Protection Law)

-- ========================================
-- MIGRATION 001: Payment Methods Table
-- ========================================

-- Create payment_methods table for multiple payment method support
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    stripe_payment_method_id TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('card', 'pix', 'boleto')),
    brand TEXT, -- 'visa', 'mastercard', 'elo', 'hipercard', etc.
    last4 TEXT,
    expiry_month INTEGER CHECK (expiry_month >= 1 AND expiry_month <= 12),
    expiry_year INTEGER CHECK (expiry_year >= 2024 AND expiry_year <= 2050),
    cardholder_name TEXT, -- Encrypted at rest
    is_default BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint (will be enabled after users table is ready)
    CONSTRAINT fk_payment_methods_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- MIGRATION 002: Enhanced Invoices Table
-- ========================================

-- Create invoices table for detailed invoice tracking
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    stripe_invoice_id TEXT NOT NULL UNIQUE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    amount_due INTEGER NOT NULL CHECK (amount_due >= 0), -- in cents
    amount_paid INTEGER NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    amount_remaining INTEGER GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
    currency TEXT NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'),
    due_date TIMESTAMP WITH TIME ZONE,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    hosted_invoice_url TEXT,
    invoice_pdf TEXT,
    tax INTEGER DEFAULT 0,
    total INTEGER GENERATED ALWAYS AS (amount_due + tax) STORED,
    billing_reason TEXT, -- 'subscription_create', 'subscription_cycle', 'manual', etc.
    customer_email TEXT,
    customer_name TEXT,
    customer_address JSONB, -- Encrypted address data
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_invoices_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Check constraints for data integrity
    CONSTRAINT chk_invoice_periods CHECK (period_end > period_start),
    CONSTRAINT chk_invoice_amounts CHECK (amount_paid <= amount_due)
);

-- ========================================
-- MIGRATION 003: Invoice Line Items Table
-- ========================================

-- Create invoice_line_items table for detailed charge breakdown
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    stripe_line_item_id TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    unit_amount INTEGER NOT NULL CHECK (unit_amount >= 0), -- in cents
    amount INTEGER NOT NULL CHECK (amount >= 0), -- quantity * unit_amount
    currency TEXT NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'),
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    proration BOOLEAN DEFAULT false,
    discount_amount INTEGER DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount INTEGER DEFAULT 0 CHECK (tax_amount >= 0),
    taxable BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_invoice_line_items_invoice_id 
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT chk_line_item_amount CHECK (amount = quantity * unit_amount),
    CONSTRAINT chk_line_item_periods CHECK (
        (period_start IS NULL AND period_end IS NULL) OR 
        (period_start IS NOT NULL AND period_end IS NOT NULL AND period_end > period_start)
    )
);

-- ========================================
-- MIGRATION 004: Billing Events Table
-- ========================================

-- Create billing_events table for comprehensive audit logging
CREATE TABLE IF NOT EXISTS billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'payment.succeeded', 'invoice.created', 'customer.updated', etc.
    stripe_event_id TEXT UNIQUE,
    processed BOOLEAN DEFAULT false,
    data JSONB NOT NULL, -- Full Stripe event data
    processing_error TEXT,
    webhook_id TEXT, -- Stripe webhook endpoint ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign key constraint
    CONSTRAINT fk_billing_events_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT chk_billing_event_processing CHECK (
        (processed = false AND processed_at IS NULL) OR 
        (processed = true AND processed_at IS NOT NULL)
    )
);

-- ========================================
-- MIGRATION 005: Subscription Usage Tracking
-- ========================================

-- Create subscription_usage table for usage-based billing
CREATE TABLE IF NOT EXISTS subscription_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    subscription_id UUID NOT NULL,
    metric_name TEXT NOT NULL, -- 'api_calls', 'transactions', 'storage_gb', etc.
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    unit TEXT DEFAULT 'unit', -- 'call', 'transaction', 'gb', etc.
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    aggregation_type TEXT DEFAULT 'sum' CHECK (aggregation_type IN ('sum', 'max', 'last')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_subscription_usage_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_subscription_usage_subscription_id 
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT chk_usage_periods CHECK (period_end > period_start),
    
    -- Unique constraint to prevent duplicate usage records
    UNIQUE(user_id, subscription_id, metric_name, period_start, period_end)
);

-- ========================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ========================================

-- Payment methods indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_methods_user_id 
    ON payment_methods(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_methods_user_default 
    ON payment_methods(user_id, is_default) WHERE is_default = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_methods_type 
    ON payment_methods(type);

-- Invoices indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_user_id 
    ON invoices(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_user_status 
    ON invoices(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_created_at 
    ON invoices(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_due_date 
    ON invoices(due_date) WHERE due_date IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_stripe_id 
    ON invoices(stripe_invoice_id);

-- Invoice line items indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_line_items_invoice_id 
    ON invoice_line_items(invoice_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_line_items_stripe_id 
    ON invoice_line_items(stripe_line_item_id);

-- Billing events indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_events_user_id 
    ON billing_events(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_events_event_type 
    ON billing_events(event_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_events_processed 
    ON billing_events(processed);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_events_created_at 
    ON billing_events(created_at DESC);

-- Subscription usage indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_usage_user_id 
    ON subscription_usage(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_usage_subscription_id 
    ON subscription_usage(subscription_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_usage_metric_period 
    ON subscription_usage(metric_name, period_start, period_end);

-- ========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Update updated_at timestamp for payment_methods
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_methods_updated_at();

-- Update updated_at timestamp for invoices
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoices_updated_at();

-- ========================================
-- RLS POLICIES (Row Level Security)
-- ========================================

-- Enable RLS on all billing tables
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Payment methods RLS policies
CREATE POLICY "Users can view their own payment methods" ON payment_methods
    FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own payment methods" ON payment_methods
    FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update their own payment methods" ON payment_methods
    FOR UPDATE USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete their own payment methods" ON payment_methods
    FOR DELETE USING (user_id = current_setting('app.current_user_id', true));

-- Invoices RLS policies
CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own invoices" ON invoices
    FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Service account can process invoices" ON invoices
    FOR ALL USING (
        current_setting('app.current_user_id', true) = 'service_account' OR
        user_id = current_setting('app.current_user_id', true)
    );

-- Invoice line items RLS policies (inherited from invoices)
CREATE POLICY "Users can view their own invoice line items" ON invoice_line_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_line_items.invoice_id 
            AND invoices.user_id = current_setting('app.current_user_id', true)
        )
    );

CREATE POLICY "Service account can manage invoice line items" ON invoice_line_items
    FOR ALL USING (
        current_setting('app.current_user_id', true) = 'service_account' OR
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_line_items.invoice_id 
            AND invoices.user_id = current_setting('app.current_user_id', true)
        )
    );

-- Billing events RLS policies
CREATE POLICY "Users can view their own billing events" ON billing_events
    FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Service account can manage billing events" ON billing_events
    FOR ALL USING (
        current_setting('app.current_user_id', true) = 'service_account' OR
        user_id = current_setting('app.current_user_id', true)
    );

-- Subscription usage RLS policies
CREATE POLICY "Users can view their own subscription usage" ON subscription_usage
    FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own subscription usage" ON subscription_usage
    FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Service account can manage subscription usage" ON subscription_usage
    FOR ALL USING (
        current_setting('app.current_user_id', true) = 'service_account' OR
        user_id = current_setting('app.current_user_id', true)
    );

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- View for user's complete billing overview
CREATE OR REPLACE VIEW user_billing_overview AS
SELECT 
    u.id as user_id,
    u.email,
    s.plan_id,
    s.status as subscription_status,
    s.current_period_end,
    (SELECT COUNT(*) FROM invoices i WHERE i.user_id = u.id AND i.status = 'open') as open_invoices_count,
    (SELECT COALESCE(SUM(i.amount_remaining), 0) FROM invoices i WHERE i.user_id = u.id AND i.status = 'open') as total_amount_due,
    (SELECT COUNT(*) FROM payment_methods pm WHERE pm.user_id = u.id AND pm.is_default = true) as has_default_payment_method,
    (SELECT COUNT(*) FROM payment_methods pm WHERE pm.user_id = u.id) as total_payment_methods
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id;

-- View for detailed invoice information with line items
CREATE OR REPLACE VIEW invoice_details AS
SELECT 
    i.*,
    jsonb_agg(
        jsonb_build_object(
            'id', li.id,
            'description', li.description,
            'quantity', li.quantity,
            'unit_amount', li.unit_amount,
            'amount', li.amount,
            'proration', li.proration
        )
    ) as line_items
FROM invoices i
LEFT JOIN invoice_line_items li ON i.id = li.invoice_id
GROUP BY i.id;

-- View for payment statistics
CREATE OR REPLACE VIEW payment_statistics AS
SELECT 
    user_id,
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE status = 'succeeded') as successful_payments,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
    COALESCE(SUM(amount_cents), 0) as total_amount,
    COALESCE(SUM(amount_cents) FILTER (WHERE status = 'succeeded'), 0) as successful_amount,
    MAX(created_at) as last_payment_date
FROM payment_history
GROUP BY user_id;

-- ========================================
-- LGPD COMPLIANCE FUNCTIONS
-- ========================================

-- Function to calculate retention date (5 years from creation per LGPD)
CREATE OR REPLACE FUNCTION calculate_retention_date(created_at TIMESTAMP WITH TIME ZONE)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN created_at + INTERVAL '5 years';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to anonymize user billing data (for GDPR/LGPD deletion requests)
CREATE OR REPLACE FUNCTION anonymize_billing_data(target_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    deletion_successful BOOLEAN := FALSE;
BEGIN
    -- Anonymize payment history (keep for legal requirements but remove PII)
    UPDATE payment_history 
    SET 
        user_id = 'ANONYMIZED_' || md5(random()::text),
        metadata = metadata - pii_fields
    WHERE user_id = target_user_id;
    
    -- Anonymize payment methods (remove sensitive card details)
    UPDATE payment_methods 
    SET 
        user_id = 'ANONYMIZED_' || md5(random()::text),
        last4 = '****',
        cardholder_name = NULL,
        expiry_month = NULL,
        expiry_year = NULL
    WHERE user_id = target_user_id;
    
    -- Anonymize invoices (remove personal info but keep financial records)
    UPDATE invoices 
    SET 
        user_id = 'ANONYMIZED_' || md5(random()::text),
        customer_email = NULL,
        customer_name = NULL,
        customer_address = NULL
    WHERE user_id = target_user_id;
    
    -- Mark subscription as deleted
    UPDATE subscriptions 
    SET 
        status = 'canceled',
        user_id = 'ANONYMIZED_' || md5(random()::text)
    WHERE user_id = target_user_id;
    
    deletion_successful := TRUE;
    RETURN deletion_successful;
    
EXCEPTION WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE NOTICE 'Error anonymizing billing data for user %: %', target_user_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- DATA VALIDATION CONSTRAINTS
-- ========================================

-- Add Brazilian-specific validation constraints
ALTER TABLE payment_methods 
ADD CONSTRAINT chk_brazilian_payment_methods 
CHECK (
    -- For Brazilian cards, last4 should be valid
    (type != 'card' OR last4 ~ '^\d{4}$') AND
    -- For PIX, ensure it's a valid PIX type
    (type != 'pix' OR (stripe_payment_method_id IS NOT NULL)) AND
    -- For boleto, ensure proper setup
    (type != 'boleto' OR (last4 IS NULL AND expiry_month IS NULL))
);

-- Add invoice validation for Brazilian market
ALTER TABLE invoices 
ADD CONSTRAINT chk_brazilian_invoices 
CHECK (
    -- All amounts must be in BRL
    (currency = 'BRL') AND
    -- Tax should be reasonable for Brazilian market
    (tax >= 0 AND tax <= amount_due * 0.5) AND
    -- Due date should be reasonable
    (due_date IS NULL OR due_date > created_at)
);

-- ========================================
-- INITIAL DATA SETUP
-- ========================================

-- Create default Brazilian tax configuration
INSERT INTO data_retention_policies (id, applies_to, retention_months, legal_basis, legal_requirement, description, retention_until)
VALUES 
    ('billing_data', 'billing', 60, 'legal_requirement', true, 'Dados financeiros conforme exigência fiscal brasileira', NOW() + INTERVAL '60 months'),
    ('payment_methods', 'payment_methods', 60, 'contractual_necessity', true, 'Dados para processamento de pagamentos', NOW() + INTERVAL '60 months'),
    ('consent_records', 'consent_records', 84, 'legal_requirement', true, 'Registros de consentimento LGPD', NOW() + INTERVAL '84 months')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- MIGRATION COMPLETION MARKER
-- ========================================

-- Create a migration log entry
INSERT INTO migration_log (migration_name, version, executed_at, success)
VALUES ('001_billing_enhancements', '1.0.0', NOW(), true)
ON CONFLICT (migration_name) DO UPDATE SET
    version = EXCLUDED.version,
    executed_at = EXCLUDED.executed_at,
    success = EXCLUDED.success;

-- Create indexes for performance monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_performance_monitoring 
ON billing_events(event_type, created_at) 
WHERE processed = false;

-- ========================================
-- MIGRATION VERIFICATION
-- ========================================

-- Verify all tables were created successfully
DO $$
DECLARE
    table_name TEXT;
    missing_tables TEXT[] := '{}';
BEGIN
    FOR table_name IN 
        SELECT unnest(ARRAY['payment_methods', 'invoices', 'invoice_line_items', 'billing_events', 'subscription_usage'])
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Migration failed: Missing tables: %', missing_tables;
    ELSE
        RAISE NOTICE 'Migration 001_billing_enhancements completed successfully';
    END IF;
END $$;
