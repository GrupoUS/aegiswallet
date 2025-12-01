-- Migration: 0017_billing_data_integrity.sql
-- Data integrity constraints and UPSERT support for billing operations
-- Critical for preventing duplicate records and ensuring data consistency

BEGIN;

-- ========================================
-- STATUS VALIDATION CONSTRAINTS
-- ========================================

-- Ensure only valid subscription statuses are used
-- Prevents invalid status values from being inserted
ALTER TABLE subscriptions 
ADD CONSTRAINT chk_subscription_status_valid 
CHECK (status IN ('free', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'));

-- Ensure only valid payment statuses are used  
-- Prevents invalid payment status values from being inserted
ALTER TABLE payment_history 
ADD CONSTRAINT chk_payment_status_valid 
CHECK (status IN ('succeeded', 'failed', 'pending'));

-- ========================================
-- BUSINESS RULE CONSTRAINTS
-- ========================================

-- Ensure billing period consistency
-- Prevents invalid period configurations (start must be before end)
ALTER TABLE subscriptions 
ADD CONSTRAINT chk_subscription_period_consistency 
CHECK (
  (current_period_start IS NULL AND current_period_end IS NULL) OR
  (current_period_start IS NOT NULL AND current_period_end IS NOT NULL AND 
   current_period_start < current_period_end)
);

-- Ensure cancellation logic is consistent
-- A subscription cannot be both active and canceled
ALTER TABLE subscriptions 
ADD CONSTRAINT chk_subscription_cancel_logic 
CHECK (
  (status != 'canceled') OR 
  (status = 'canceled' AND (
    canceled_at IS NOT NULL OR 
    cancel_at_period_end = true
  ))
);

-- Ensure trial logic is consistent
-- Trial end must be after trial start
ALTER TABLE subscriptions 
ADD CONSTRAINT chk_subscription_trial_consistency 
CHECK (
  (trial_start IS NULL AND trial_end IS NULL) OR
  (trial_start IS NOT NULL AND trial_end IS NOT NULL AND 
   trial_start < trial_end)
);

-- ========================================
-- FINANCIAL DATA VALIDATION
-- ========================================

-- Ensure positive payment amounts
-- Prevents negative or zero payment amounts
ALTER TABLE payment_history 
ADD CONSTRAINT chk_payment_amount_positive 
CHECK (amount_cents > 0);

-- Ensure valid BRL currency for payments
-- Enforces BRL currency for all payments
ALTER TABLE payment_history 
ADD CONSTRAINT chk_payment_currency_valid 
CHECK (currency = 'BRL');

-- Ensure subscription plan prices are reasonable
-- Prevents unrealistic plan prices (negative or extremely high)
ALTER TABLE subscription_plans 
ADD CONSTRAINT chk_plan_price_reasonable 
CHECK (price_cents >= 0 AND price_cents <= 10000000); -- Max 100,000 BRL

-- Ensure transaction limits are positive
-- Prevents negative or zero transaction limits
ALTER TABLE subscription_plans 
ADD CONSTRAINT chk_plan_transaction_limits_positive 
CHECK (
  max_bank_accounts > 0 AND 
  max_transactions_per_month > 0
);

-- ========================================
-- UPSERT SUPPORT FUNCTIONS
-- ========================================

-- Function to safely upsert subscription data
-- Handles Stripe webhook upserts with conflict resolution
CREATE OR REPLACE FUNCTION upsert_subscription(
  p_user_id text,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_plan_id text DEFAULT 'free',
  p_status text DEFAULT 'free',
  p_current_period_start timestamptz DEFAULT NULL,
  p_current_period_end timestamptz DEFAULT NULL,
  p_cancel_at_period_end boolean DEFAULT false,
  p_canceled_at timestamptz DEFAULT NULL,
  p_trial_start timestamptz DEFAULT NULL,
  p_trial_end timestamptz DEFAULT NULL
)
RETURNS subscriptions AS $$
DECLARE
  v_subscription subscriptions;
BEGIN
  INSERT INTO subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    canceled_at,
    trial_start,
    trial_end,
    updated_at
  ) VALUES (
    p_user_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_plan_id,
    p_status,
    p_current_period_start,
    p_current_period_end,
    p_cancel_at_period_end,
    p_canceled_at,
    p_trial_start,
    p_trial_end,
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    plan_id = EXCLUDED.plan_id,
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    canceled_at = EXCLUDED.cancel_at_period_end,
    trial_start = EXCLUDED.trial_start,
    trial_end = EXCLUDED.trial_end,
    updated_at = now()
  RETURNING * INTO v_subscription;
  
  RETURN v_subscription;
END;
$$ LANGUAGE plpgsql;

-- Function to safely upsert payment history
-- Handles payment event upserts with conflict resolution
CREATE OR REPLACE FUNCTION upsert_payment_history(
  p_user_id text,
  p_subscription_id uuid,
  p_stripe_payment_intent_id text,
  p_stripe_invoice_id text,
  p_stripe_charge_id text,
  p_amount_cents integer,
  p_currency text DEFAULT 'BRL',
  p_status text,
  p_description text DEFAULT NULL,
  p_receipt_url text DEFAULT NULL,
  p_invoice_pdf text DEFAULT NULL,
  p_failure_code text DEFAULT NULL,
  p_failure_message text DEFAULT NULL
)
RETURNS payment_history AS $$
DECLARE
  v_payment payment_history;
BEGIN
  INSERT INTO payment_history (
    user_id,
    subscription_id,
    stripe_payment_intent_id,
    stripe_invoice_id,
    stripe_charge_id,
    amount_cents,
    currency,
    status,
    description,
    receipt_url,
    invoice_pdf,
    failure_code,
    failure_message
  ) VALUES (
    p_user_id,
    p_subscription_id,
    p_stripe_payment_intent_id,
    p_stripe_invoice_id,
    p_stripe_charge_id,
    p_amount_cents,
    p_currency,
    p_status,
    p_description,
    p_receipt_url,
    p_invoice_pdf,
    p_failure_code,
    p_failure_message
  )
  ON CONFLICT (stripe_payment_intent_id) DO NOTHING
  RETURNING * INTO v_payment;
  
  RETURN v_payment;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- AUDIT AND TRACKING TRIGGERS
-- ========================================

-- Audit function for subscription changes
CREATE OR REPLACE FUNCTION audit_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log subscription changes for compliance
  INSERT INTO compliance_audit_logs (
    user_id,
    event_type,
    resource_type,
    resource_id,
    description,
    new_state,
    previous_state,
    metadata,
    created_at
  ) VALUES (
    NEW.user_id,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'data_accessed'
      WHEN TG_OP = 'UPDATE' THEN 'data_modified'
      WHEN TG_OP = 'DELETE' THEN 'data_modified'
    END,
    'subscription',
    NEW.id,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'New subscription created'
      WHEN TG_OP = 'UPDATE' THEN 'Subscription updated: ' || 
        COALESCE('status: ' || OLD.status || ' → ' || NEW.status, 'details changed')
      WHEN TG_OP = 'DELETE' THEN 'Subscription deleted'
    END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now(),
      'user_agent', current_setting('app.user_agent', true)
    ),
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Audit function for payment changes
CREATE OR REPLACE FUNCTION audit_payment_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log payment changes for financial compliance
  INSERT INTO compliance_audit_logs (
    user_id,
    event_type,
    resource_type,
    resource_id,
    description,
    new_state,
    previous_state,
    metadata,
    created_at
  ) VALUES (
    NEW.user_id,
    'data_accessed',
    'payment_history',
    NEW.id,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'New payment recorded: ' || 
        COALESCE(payment_history_status_label(NEW.status), NEW.status)
      WHEN TG_OP = 'UPDATE' THEN 'Payment updated: ' ||
        COALESCE(payment_history_status_label(NEW.status), NEW.status)
      WHEN TG_OP = 'DELETE' THEN 'Payment record deleted'
    END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'amount_cents', NEW.amount_cents,
      'timestamp', now(),
      'user_agent', current_setting('app.user_agent', true)
    ),
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Helper function for payment status labels
CREATE OR REPLACE FUNCTION payment_history_status_label(status text)
RETURNS text AS $$
BEGIN
  RETURN CASE status
    WHEN 'succeeded' THEN 'Pagamento aprovado'
    WHEN 'failed' THEN 'Pagamento falhou' 
    WHEN 'pending' THEN 'Pagamento pendente'
    ELSE status
  END;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGER DEPLOYMENT
-- ========================================

-- Create triggers for audit logging
DROP TRIGGER IF EXISTS audit_subscriptions_changes ON subscriptions;
CREATE TRIGGER audit_subscriptions_changes
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION audit_subscription_changes();

DROP TRIGGER IF EXISTS audit_payment_changes ON payment_history;
CREATE TRIGGER audit_payment_changes
  AFTER INSERT OR UPDATE OR DELETE ON payment_history
  FOR EACH ROW EXECUTE FUNCTION audit_payment_changes();

-- ========================================
-- UTILITY FUNCTIONS FOR DATA CLEANUP
-- ========================================

-- Function to identify potential duplicate subscriptions
CREATE OR REPLACE FUNCTION find_potential_duplicate_subscriptions()
RETURNS TABLE (
  user_id text,
  duplicate_count integer,
  subscription_ids uuid[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.user_id,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(s.id ORDER BY s.created_at) as subscription_ids
  FROM subscriptions s
  WHERE s.status IN ('active', 'trialing')
  GROUP BY s.user_id
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up orphaned payment records
CREATE OR REPLACE FUNCTION cleanup_orphaned_payments()
RETURNS integer AS $$
DECLARE
  cleaned_count integer;
BEGIN
  -- Remove payment history records for non-existent subscriptions
  DELETE FROM payment_history 
  WHERE subscription_id IS NOT NULL 
    AND subscription_id NOT IN (SELECT id FROM subscriptions);
    
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SECURITY AND PERMISSIONS
-- ========================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION upsert_subscription(text, text, text, text, text, timestamptz, timestamptz, boolean, timestamptz, timestamptz, timestamptz) TO postgres;
GRANT EXECUTE ON FUNCTION upsert_payment_history(text, uuid, text, text, text, integer, text, text, text, text, text, text, text) TO postgres;
GRANT EXECUTE ON FUNCTION audit_subscription_changes() TO postgres;
GRANT EXECUTE ON FUNCTION audit_payment_changes() TO postgres;
GRANT EXECUTE ON FUNCTION payment_history_status_label(text) TO postgres;
GRANT EXECUTE ON FUNCTION find_potential_duplicate_subscriptions() TO postgres;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_payments() TO postgres;

GRANT EXECUTE ON FUNCTION upsert_subscription(text, text, text, text, text, timestamptz, timestamptz, boolean, timestamptz, timestamptz, timestamptz) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION upsert_payment_history(text, uuid, text, text, text, integer, text, text, text, text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION payment_history_status_label(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION find_potential_duplicate_subscriptions() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_payments() TO service_role;

-- ========================================
-- DOCUMENTATION COMMENTS
-- ========================================

COMMENT ON FUNCTION upsert_subscription(text, text, text, text, text, timestamptz, timestamptz, boolean, timestamptz, timestamptz, timestamptz) IS 
'Safely upserts subscription data with conflict resolution for Stripe webhooks';

COMMENT ON FUNCTION upsert_payment_history(text, uuid, text, text, text, integer, text, text, text, text, text, text, text) IS 
'Safely upserts payment history with duplicate prevention for payment webhooks';

COMMENT ON FUNCTION audit_subscription_changes() IS 
'Audit trigger function for subscription changes with LGPD compliance logging';

COMMENT ON FUNCTION audit_payment_changes() IS 
'Audit trigger function for payment changes with financial compliance logging';

COMMENT ON CONSTRAINT chk_subscription_status_valid ON subscriptions IS 
'Ensures only valid subscription statuses are used in the system';

COMMENT ON CONSTRAINT chk_payment_amount_positive ON payment_history IS 
'Prevents invalid negative or zero payment amounts in financial records';

COMMIT;

-- ========================================
-- POST-DEPLOYMENT VALIDATION
-- ========================================

-- Verify constraints were added successfully
DO $$
DECLARE
  constraint_count integer;
  expected_constraints constant integer := 8;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
  WHERE tc.table_name IN ('subscriptions', 'payment_history', 'subscription_plans')
    AND tc.constraint_type = 'CHECK'
    AND tc.table_schema = 'public';
    
  IF constraint_count < expected_constraints THEN
    RAISE EXCEPTION 'Expected at least % data integrity constraints, but found only %', expected_constraints, constraint_count;
  END IF;
  
  RAISE NOTICE 'Successfully created % data integrity constraints', constraint_count;
END $$;
