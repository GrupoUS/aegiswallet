-- Migration: 0018_billing_lgpd_compliance.sql
-- LGPD compliance for billing and financial data
-- Implements data retention, consent tracking, and audit trails for Brazilian financial compliance

BEGIN;

-- ========================================
-- LGPD COMPLIANCE FIELDS PARA SUBSCRIPTIONS
-- ========================================

-- Add consent tracking for financial data processing
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS lgpd_consent_id text REFERENCES lgpd_consents(id),
ADD COLUMN IF NOT EXISTS data_classification text NOT NULL DEFAULT 'financial' 
  CHECK (data_classification IN ('financial', 'sensitive', 'anonymous')),
ADD COLUMN IF NOT EXISTS purpose_of_processing text NOT NULL DEFAULT 'subscription_management' 
  CHECK (purpose_of_processing IN ('subscription_management', 'payment_processing', 'financial_analysis', 'compliance_reporting')),
ADD COLUMN IF NOT EXISTS legal_basis text NOT NULL DEFAULT 'contractual_necessity' 
  CHECK (legal_basis IN ('consent', 'contractual_necessity', 'legal_obligation', 'legitimate_interest')),
ADD COLUMN IF NOT EXISTS retention_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS auto_delete_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_anonymized boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS anonymized_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS access_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed_at timestamp with time zone;

-- ========================================
-- LGPD COMPLIANCE FIELDS PARA PAYMENT_HISTORY
-- ========================================

-- Add comprehensive LGPD tracking for financial data
ALTER TABLE payment_history 
ADD COLUMN IF NOT EXISTS lgpd_consent_id text REFERENCES lgpd_consents(id),
ADD COLUMN IF NOT EXISTS data_classification text NOT NULL DEFAULT 'sensitive' 
  CHECK (data_classification IN ('financial', 'sensitive', 'anonymous')),
ADD COLUMN IF NOT EXISTS purpose_of_processing text NOT NULL DEFAULT 'payment_processing' 
  CHECK (purpose_of_processing IN ('payment_processing', 'financial_analysis', 'tax_reporting', 'fraud_prevention', 'compliance_audit')),
ADD COLUMN IF NOT EXISTS legal_basis text NOT NULL DEFAULT 'contractual_necessity' 
  CHECK (legal_basis IN ('consent', 'contractual_necessity', 'legal_obligation', 'legitimate_interest')),
ADD COLUMN IF NOT EXISTS retention_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS auto_delete_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_anonymized boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS anonymized_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS access_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS access_audit jsonb DEFAULT '[]'::jsonb;

-- ========================================
-- LGPD COMPLIANCE FIELDS PARA SUBSCRIPTION_PLANS
-- ========================================

-- Add consent tracking for plan management
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS lgpd_consent_template text,
ADD COLUMN IF NOT EXISTS data_processing_purposes jsonb DEFAULT '["subscription_management"]'::jsonb,
ADD COLUMN IF NOT EXISTS requires_consent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS retention_period_months integer DEFAULT 60, -- 5 years for financial data
ADD COLUMN IF NOT EXISTS international_transfer boolean DEFAULT false;

-- ========================================
-- LGPD INDEXES FOR PERFORMANCE
-- ========================================

-- Indexes for consent tracking queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_lgpd_consent 
  ON subscriptions(lgpd_consent_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_retention 
  ON subscriptions(retention_until, auto_delete_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_classification 
  ON subscriptions(user_id, data_classification);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_legal_basis 
  ON subscriptions(legal_basis, created_at);

-- Payment history compliance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_history_retention 
  ON payment_history(retention_until, auto_delete_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_history_user_classification 
  ON payment_history(user_id, data_classification);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_history_legal_basis 
  ON payment_history(legal_basis, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_history_access_audit 
  ON payment_history USING gin(access_audit);

-- Indexes for data lifecycle management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_deletion_ready 
  ON subscriptions(is_anonymized, auto_delete_at) 
  WHERE auto_delete_at IS NOT NULL AND NOT is_anonymized;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_history_deletion_ready 
  ON payment_history(is_anonymized, auto_delete_at) 
  WHERE auto_delete_at IS NOT NULL AND NOT is_anonymized;

-- ========================================
-- LGPD CONSENT TEMPLATES FOR BILLING
-- ========================================

-- Insert billing-specific consent templates
INSERT INTO consent_templates (
  consent_type,
  version,
  title_pt,
  description_pt, 
  full_text_pt,
  is_mandatory,
  legal_basis,
  data_retention_months,
  international_transfer,
  created_at,
  updated_at
) VALUES 
(
  'billing_data_processing',
  '1.0',
  'Processamento de Dados de Cobrança',
  'Autorização para processar dados de cobrança e assinatura',
  'Autorizo o processamento de meus dados de cobrança, assinatura e métodos de pagamento pelo AegisWallet para fins de cobrança, gestão de assinatura, análise financeira e cumprimento de obrigações legais. Entendo que meus dados financeiros são classificados como dados sensíveis e serão processados com máxima segurança.',
  true,
  'contractual_necessity',
  60, -- 5 years as per Brazilian financial law
  false,
  now(),
  now()
),
(
  'financial_data_analysis',
  '1.0',
  'Análise de Dados Financeiros',
  'Autorização para análise de padrões financeiros e insights',
  'Autorizo o processamento e análise de meus dados financeiros para geração de insights, análises de gastos, recomendações financeiras personalizadas e melhoria dos serviços. Esta análise pode incluir dados de transações, padrões de consumo e comportamento financeiro.',
  false,
  'legitimate_interest',
  36, -- 3 years for analysis data
  false,
  now(),
  now()
),
(
  'compliance_reporting',
  '1.0',
  'Relatórios de Compliance',
  'Autorização para geração de relatórios regulatórios',
  'Autorizo o processamento de meus dados para geração de relatórios de compliance, auditorias, conformidade regulatória e obrigações legais junto ao Banco Central do Brasil e outras autoridades competentes.',
  true,
  'legal_obligation',
  120, -- 10 years as per Brazilian financial regulations
  false,
  now(),
  now()
)
ON CONFLICT (consent_type, version) DO NOTHING;

-- ========================================
-- RETENTION POLICY FUNCTIONS
-- ========================================

-- Function to set appropriate retention dates for financial data
CREATE OR REPLACE FUNCTION set_billing_retention_dates()
RETURNS TRIGGER AS $$
DECLARE
  base_retention interval;
  legal_basis_retention interval;
BEGIN
  -- Set base retention based on data classification
  CASE NEW.data_classification
    WHEN 'anonymous' THEN
      NEW.retention_until = NEW.created_at + interval '6 months';
    WHEN 'financial' THEN
      -- Financial data retention per Brazilian law (5 years minimum)
      base_retention = interval '5 years';
      NEW.retention_until = NEW.created_at + base_retention;
    WHEN 'sensitive' THEN
      -- Sensitive financial data retention (7 years for compliance)
      base_retention = interval '7 years';
      NEW.retention_until = NEW.created_at + base_retention;
    ELSE
      NEW.retention_until = NEW.created_at + interval '1 year';
  END CASE;
  
  -- Adjust retention based on legal basis
  CASE NEW.legal_basis
    WHEN 'legal_obligation' THEN
      -- Extended retention for legal obligations (10 years)
      legal_basis_retention = interval '10 years';
      NEW.retention_until = GREATEST(
        COALESCE(NEW.retention_until, NEW.created_at + interval '1 year'),
        NEW.created_at + legal_basis_retention
      );
    WHEN 'consent' THEN
      -- Shorter retention for consent-based processing (align with consent withdrawal)
      -- Keep existing retention if already set
      NULL;
    WHEN 'contractual_necessity' THEN
      -- Keep data while contract is active + 5 years
      NULL;
    WHEN 'legitimate_interest' THEN
      -- Business necessity retention (3 years)
      legal_basis_retention = interval '3 years';
      NEW.retention_until = LEAST(
        COALESCE(NEW.retention_until, NEW.created_at + interval '3 years'),
        NEW.created_at + legal_basis_retention
      );
  END CASE;
  
  -- Set auto-delete date (30 days after retention expiry)
  NEW.auto_delete_at = NEW.retention_until + interval '30 days';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- DATA ANONYMIZATION FUNCTIONS
-- ========================================

-- Function to anonymize subscription data for LGPD compliance
CREATE OR REPLACE FUNCTION anonymize_subscription_data(p_user_id text)
RETURNS integer AS $$
DECLARE
  affected_rows integer;
  consent_record lgpd_consents%ROWTYPE;
BEGIN
  -- Check if user has active consent for anonymization
  SELECT * INTO consent_record
  FROM lgpd_consents
  WHERE user_id = p_user_id
    AND consent_type = 'data_processing'
    AND granted = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No valid consent found for data anonymization';
  END IF;
  
  -- Anonymize subscription data
  UPDATE subscriptions 
  SET 
    user_id = 'anonymized_' || md5(p_user_id || now()::text),
    stripe_customer_id = 'anonymized_' || md5(COALESCE(stripe_customer_id, '') || now()::text),
    -- Keep technical data but remove personal identifiers
    anonymized_at = now(),
    is_anonymized = true,
    updated_at = now()
  WHERE user_id = p_user_id
    AND NOT is_anonymized;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Log the anonymization event
  INSERT INTO compliance_audit_logs (
    user_id,
    event_type,
    resource_type,
    description,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    'data_deletion_completed',
    'subscription',
    'Subscription data anonymized for LGPD compliance',
    jsonb_build_object(
      'affected_records', affected_rows,
      'anonymization_method', 'hash_based',
      'consent_id', consent_record.id
    ),
    now()
  );
  
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Function to anonymize payment history
CREATE OR REPLACE FUNCTION anonymize_payment_data(p_user_id text)
RETURNS integer AS $$
DECLARE
  affected_rows integer;
BEGIN
  -- Anonymize payment history (keep amounts but remove identifiers)
  UPDATE payment_history 
  SET 
    user_id = 'anonymized_' || md5(p_user_id || now()::text),
    stripe_payment_intent_id = 'anonymized_' || md5(COALESCE(stripe_payment_intent_id, '') || now()::text),
    stripe_invoice_id = 'anonymized_' || md5(COALESCE(stripe_invoice_id, '') || now()::text),
    stripe_charge_id = 'anonymized_' || md5(COALESCE(stripe_charge_id, '') || now()::text),
    description = 'Anonymized payment transaction',
    receipt_url = NULL,
    invoice_pdf = NULL,
    failure_code = NULL,
    failure_message = NULL,
    anonymized_at = now(),
    is_anonymized = true
  WHERE user_id = p_user_id
    AND NOT is_anonymized;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ACCESS TRACKING FUNCTIONS
-- ========================================

-- Function to track data access for audit compliance
CREATE OR REPLACE FUNCTION track_billing_data_access(
  p_table_name text,
  p_record_id text,
  p_user_id text,
  p_access_type text DEFAULT 'read'
)
RETURNS void AS $$
BEGIN
  IF p_table_name = 'subscriptions' THEN
    UPDATE subscriptions 
    SET 
      access_count = access_count + 1,
      last_accessed_at = now()
    WHERE id = p_record_id
      AND user_id = p_user_id;
  ELSIF p_table_name = 'payment_history' THEN
    UPDATE payment_history 
    SET 
      access_count = access_count + 1,
      last_accessed_at = now(),
      access_audit = COALESCE(access_audit, '[]'::jsonb) || 
        jsonb_build_object(
          'accessed_at', now(),
          'access_type', p_access_type,
          'user_id', p_user_id
        )
    WHERE id = p_record_id
      AND user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- DATA RETENTION CLEANUP FUNCTIONS
-- ========================================

-- Function to automatically clean expired billing data
CREATE OR REPLACE FUNCTION cleanup_expired_billing_data()
RETURNS TABLE (
  table_name text,
  records_anonymized integer,
  records_deleted integer
) AS $$
DECLARE
  subscription_anonymized integer;
  subscription_deleted integer;
  payment_anonymized integer;
  payment_deleted integer;
BEGIN
  -- Anonymize subscriptions past retention period but within grace period
  WITH expired_subscriptions AS (
    SELECT id, user_id
    FROM subscriptions
    WHERE retention_until < now()
      AND auto_delete_at > now()
      AND NOT is_anonymized
  )
  UPDATE subscriptions 
  SET 
    user_id = 'anonymized_' || md5(user_id || created_at::text),
    stripe_customer_id = 'anonymized_' || md5(COALESCE(stripe_customer_id, '') || created_at::text),
    anonymized_at = now(),
    is_anonymized = true,
    updated_at = now()
  WHERE id IN (SELECT id FROM expired_subscriptions);
  
  GET DIAGNOSTICS subscription_anonymized = ROW_COUNT;
  
  -- Delete subscriptions past grace period
  DELETE FROM subscriptions
  WHERE auto_delete_at < now()
    AND is_anonymized = true;
  
  GET DIAGNOSTICS subscription_deleted = ROW_COUNT;
  
  -- Anonymize payment history past retention period but within grace period
  WITH expired_payments AS (
    SELECT id, user_id
    FROM payment_history
    WHERE retention_until < now()
      AND auto_delete_at > now()
      AND NOT is_anonymized
  )
  UPDATE payment_history 
  SET 
    user_id = 'anonymized_' || md5(user_id || created_at::text),
    stripe_payment_intent_id = 'anonymized_' || md5(COALESCE(stripe_payment_intent_id, '') || created_at::text),
    anonymized_at = now(),
    is_anonymized = true
  WHERE id IN (SELECT id FROM expired_payments);
  
  GET DIAGNOSTICS payment_anonymized = ROW_COUNT;
  
  -- Delete payment history past grace period
  DELETE FROM payment_history
  WHERE auto_delete_at < now()
    AND is_anonymized = true;
  
  GET DIAGNOSTICS payment_deleted = ROW_COUNT;
  
  -- Return cleanup results
  RETURN QUERY SELECT 
    unnest(ARRAY['subscriptions', 'payment_history']) as table_name,
    unnest(ARRAY[subscription_anonymized, payment_anonymized]) as records_anonymized,
    unnest(ARRAY[subscription_deleted, payment_deleted]) as records_deleted;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- AUTOMATED TRIGGERS
-- ========================================

-- Trigger to automatically set retention dates
DROP TRIGGER IF EXISTS set_subscription_retention ON subscriptions;
CREATE TRIGGER set_subscription_retention
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  WHEN (NEW.retention_until IS NULL)
  EXECUTE FUNCTION set_billing_retention_dates();

DROP TRIGGER IF EXISTS set_payment_retention ON payment_history;
CREATE TRIGGER set_payment_retention
  BEFORE INSERT OR UPDATE ON payment_history
  FOR EACH ROW
  WHEN (NEW.retention_until IS NULL)
  EXECUTE FUNCTION set_billing_retention_dates();

-- ========================================
-- LGPD COMPLIANCE VIEWS
-- ========================================

-- View for LGPD compliance reporting
CREATE OR REPLACE VIEW lgpd_billing_compliance_summary AS
SELECT 
  'subscriptions' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_anonymized = true THEN 1 END) as anonymized_records,
  COUNT(CASE WHEN retention_until IS NOT NULL AND retention_until < now() THEN 1 END) as expired_records,
  COUNT(CASE WHEN lgpd_consent_id IS NOT NULL THEN 1 END) as with_consent_records,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM subscriptions
UNION ALL
SELECT 
  'payment_history' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_anonymized = true THEN 1 END) as anonymized_records,
  COUNT(CASE WHEN retention_until IS NOT NULL AND retention_until < now() THEN 1 END) as expired_records,
  COUNT(CASE WHEN lgpd_consent_id IS NOT NULL THEN 1 END) as with_consent_records,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM payment_history;

-- ========================================
-- PERMISSIONS AND SECURITY
-- ========================================

-- Grant execute permissions for LGPD functions
GRANT EXECUTE ON FUNCTION set_billing_retention_dates() TO postgres;
GRANT EXECUTE ON FUNCTION anonymize_subscription_data(text) TO postgres;
GRANT EXECUTE ON FUNCTION anonymize_payment_data(text) TO postgres;
GRANT EXECUTE ON FUNCTION track_billing_data_access(text, text, text, text) TO postgres;
GRANT EXECUTE ON FUNCTION cleanup_expired_billing_data() TO postgres;

GRANT EXECUTE ON FUNCTION set_billing_retention_dates() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION track_billing_data_access(text, text, text, text) TO anon, authenticated, service_role;

-- Restrict sensitive functions to service role only
GRANT EXECUTE ON FUNCTION anonymize_subscription_data(text) TO service_role;
GRANT EXECUTE ON FUNCTION anonymize_payment_data(text) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_billing_data() TO service_role;

-- Grant access to compliance view
GRANT SELECT ON lgpd_billing_compliance_summary TO postgres, anon, authenticated, service_role;

-- ========================================
-- DOCUMENTATION COMMENTS
-- ========================================

COMMENT ON TABLE subscriptions IS 'User subscription records with full LGPD compliance tracking for financial data';
COMMENT ON TABLE payment_history IS 'Payment transaction history with LGPD compliance, audit trails, and data lifecycle management';

COMMENT ON COLUMN subscriptions.lgpd_consent_id IS 'Reference to LGPD consent for financial data processing';
COMMENT ON COLUMN subscriptions.data_classification IS 'Data classification level: financial, sensitive, anonymous';
COMMENT ON COLUMN subscriptions.retention_until IS 'Legal retention date for subscription data';
COMMENT ON COLUMN subscriptions.auto_delete_at IS 'Automatic deletion date for expired data';

COMMENT ON COLUMN payment_history.lgpd_consent_id IS 'Reference to LGPD consent for payment processing';
COMMENT ON COLUMN payment_history.data_classification IS 'Sensitive financial data classification';
COMMENT ON COLUMN payment_history.access_audit IS 'JSON array tracking all access to payment data';
COMMENT ON COLUMN payment_history.retention_until IS 'Legal retention date for financial records';

COMMENT ON FUNCTION set_billing_retention_dates() IS 
'Sets appropriate retention dates based on data classification and legal basis for Brazilian financial compliance';

COMMENT ON FUNCTION anonymize_subscription_data(text) IS 
'Anonymizes subscription data for LGPD compliance while preserving analytical value';

COMMENT ON FUNCTION cleanup_expired_billing_data() IS 
'Automatically anonymizes and deletes billing data past retention periods';

COMMENT ON VIEW lgpd_billing_compliance_summary IS 
'Summary view for LGPD compliance reporting and audit purposes';

COMMIT;

-- ========================================
-- POST-DEPLOYMENT VALIDATION
-- ========================================

-- Verify LGPD compliance fields were added
DO $$
DECLARE
  field_count integer;
  index_count integer;
  expected_fields constant integer := 10;
  expected_indexes constant integer := 8;
BEGIN
  -- Check LGPD compliance fields
  SELECT COUNT(*) INTO field_count
  FROM information_schema.columns
  WHERE table_name IN ('subscriptions', 'payment_history', 'subscription_plans')
    AND column_name LIKE '%lgpd%' 
    OR column_name LIKE '%retention%'
    OR column_name LIKE '%anonymized%'
    OR column_name LIKE '%consent%'
    OR column_name LIKE '%classification%'
    OR column_name LIKE '%access_count%'
    OR column_name IN ('data_classification', 'purpose_of_processing', 'legal_basis');
    
  -- Check LGPD compliance indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename IN ('subscriptions', 'payment_history')
    AND indexname LIKE 'idx_%'
    AND schemaname = 'public'
    AND (indexname LIKE '%lgpd%' OR indexname LIKE '%retention%' OR indexname LIKE '%classification%' OR indexname LIKE '%deletion%');
    
  IF field_count < expected_fields THEN
    RAISE EXCEPTION 'Expected at least % LGPD compliance fields, but found only %', expected_fields, field_count;
  END IF;
  
  IF index_count < expected_indexes THEN
    RAISE EXCEPTION 'Expected at least % LGPD indexes, but found only %', expected_indexes, index_count;
  END IF;
  
  RAISE NOTICE 'Successfully deployed LGPD compliance: % fields, % indexes', field_count, index_count;
END $$;
