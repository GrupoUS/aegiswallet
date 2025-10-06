-- Boleto and PIX Payment Systems
-- Stories: 03.02 (Boletos) + 03.03 (PIX)
-- Created: 2025-01-04

-- ============================================================================
-- Boletos Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS boletos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Boleto details
  barcode TEXT NOT NULL UNIQUE,
  digitable_line TEXT,
  payee_name TEXT NOT NULL,
  payee_document TEXT, -- CNPJ/CPF
  
  -- Payment details
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  interest_amount DECIMAL(12,2) DEFAULT 0,
  fine_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'pending',
    'scheduled',
    'paid',
    'expired',
    'cancelled'
  )) DEFAULT 'pending',
  
  -- Capture method
  capture_method TEXT CHECK (capture_method IN ('ocr', 'barcode', 'manual', 'voice')),
  
  -- Payment tracking
  scheduled_payment_id UUID REFERENCES scheduled_payments(id),
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_confirmation TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_boletos_user_id ON boletos(user_id);
CREATE INDEX idx_boletos_barcode ON boletos(barcode);
CREATE INDEX idx_boletos_status ON boletos(status);
CREATE INDEX idx_boletos_due_date ON boletos(due_date);

-- ============================================================================
-- PIX Transfers Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS pix_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- PIX key details
  pix_key TEXT NOT NULL,
  pix_key_type TEXT CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  
  -- Recipient details
  recipient_name TEXT NOT NULL,
  recipient_document TEXT,
  recipient_bank TEXT,
  
  -- Transfer details
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'pending',
    'awaiting_confirmation',
    'confirmed',
    'processing',
    'completed',
    'failed',
    'cancelled'
  )) DEFAULT 'pending',
  
  -- Initiation method
  initiation_method TEXT CHECK (initiation_method IN ('voice', 'manual', 'scheduled')),
  
  -- Security confirmation
  requires_confirmation BOOLEAN DEFAULT true,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmation_method TEXT, -- 'voice', 'biometric', 'pin'
  
  -- Execution
  executed_at TIMESTAMP WITH TIME ZONE,
  transaction_id TEXT,
  end_to_end_id TEXT, -- PIX E2E ID
  
  -- Error tracking
  error_code TEXT,
  error_message TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pix_transfers_user_id ON pix_transfers(user_id);
CREATE INDEX idx_pix_transfers_pix_key ON pix_transfers(pix_key);
CREATE INDEX idx_pix_transfers_status ON pix_transfers(status);
CREATE INDEX idx_pix_transfers_created_at ON pix_transfers(created_at DESC);

-- ============================================================================
-- Autonomy Settings Table (Story 03.04)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_autonomy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Global autonomy level
  global_autonomy_level INTEGER CHECK (global_autonomy_level IN (50, 75, 95)) DEFAULT 50,
  
  -- Category-specific overrides
  payment_autonomy_level INTEGER CHECK (payment_autonomy_level IN (50, 75, 95)),
  transfer_autonomy_level INTEGER CHECK (transfer_autonomy_level IN (50, 75, 95)),
  
  -- Limits
  daily_payment_limit DECIMAL(12,2) DEFAULT 1000.00,
  single_payment_limit DECIMAL(12,2) DEFAULT 500.00,
  
  -- Preferences
  require_voice_confirmation BOOLEAN DEFAULT true,
  require_biometric_confirmation BOOLEAN DEFAULT false,
  notification_preferences JSONB,
  
  -- Trust score (calculated)
  trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE UNIQUE INDEX idx_user_autonomy_settings_user_id ON user_autonomy_settings(user_id);

-- ============================================================================
-- Payment Failures Table (Story 03.05)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference
  payment_id UUID, -- Can reference scheduled_payments, pix_transfers, or boletos
  payment_type TEXT CHECK (payment_type IN ('scheduled', 'pix', 'boleto')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Failure details
  failure_type TEXT CHECK (failure_type IN (
    'insufficient_funds',
    'invalid_account',
    'timeout',
    'network_error',
    'authentication_error',
    'validation_error',
    'limit_exceeded',
    'other'
  )),
  
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  
  -- Context
  amount DECIMAL(12,2),
  payee_name TEXT,
  
  -- Resolution
  resolution_status TEXT CHECK (resolution_status IN (
    'pending',
    'retrying',
    'resolved',
    'manual_intervention_required',
    'cancelled'
  )) DEFAULT 'pending',
  
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payment_failures_payment_id ON payment_failures(payment_id);
CREATE INDEX idx_payment_failures_user_id ON payment_failures(user_id);
CREATE INDEX idx_payment_failures_resolution_status ON payment_failures(resolution_status);
CREATE INDEX idx_payment_failures_created_at ON payment_failures(created_at DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_autonomy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_failures ENABLE ROW LEVEL SECURITY;

-- Boletos Policies
CREATE POLICY "Users can manage their own boletos"
  ON boletos FOR ALL
  USING (auth.uid() = user_id);

-- PIX Transfers Policies
CREATE POLICY "Users can manage their own PIX transfers"
  ON pix_transfers FOR ALL
  USING (auth.uid() = user_id);

-- Autonomy Settings Policies
CREATE POLICY "Users can manage their own autonomy settings"
  ON user_autonomy_settings FOR ALL
  USING (auth.uid() = user_id);

-- Payment Failures Policies
CREATE POLICY "Users can view their own payment failures"
  ON payment_failures FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- Functions
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_boletos_updated_at
  BEFORE UPDATE ON boletos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pix_transfers_updated_at
  BEFORE UPDATE ON pix_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_autonomy_settings_updated_at
  BEFORE UPDATE ON user_autonomy_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_failures_updated_at
  BEFORE UPDATE ON payment_failures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Validate boleto barcode (simplified)
CREATE OR REPLACE FUNCTION validate_boleto_barcode(p_barcode TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Basic validation: 44 or 47 digits
  RETURN p_barcode ~ '^[0-9]{44,47}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate boleto total amount with fees
CREATE OR REPLACE FUNCTION calculate_boleto_total(
  p_amount DECIMAL,
  p_due_date DATE,
  p_discount DECIMAL DEFAULT 0,
  p_interest_rate DECIMAL DEFAULT 0,
  p_fine_rate DECIMAL DEFAULT 0
)
RETURNS DECIMAL AS $$
DECLARE
  v_days_late INTEGER;
  v_interest DECIMAL := 0;
  v_fine DECIMAL := 0;
BEGIN
  v_days_late := GREATEST(0, CURRENT_DATE - p_due_date);
  
  IF v_days_late > 0 THEN
    v_interest := p_amount * (p_interest_rate / 100) * v_days_late;
    v_fine := p_amount * (p_fine_rate / 100);
  END IF;
  
  RETURN p_amount - p_discount + v_interest + v_fine;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Check if user can execute payment based on autonomy settings
CREATE OR REPLACE FUNCTION can_execute_payment(
  p_user_id UUID,
  p_amount DECIMAL,
  p_payment_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_settings RECORD;
BEGIN
  SELECT * INTO v_settings FROM user_autonomy_settings WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false; -- Require setup
  END IF;
  
  -- Check single payment limit
  IF p_amount > v_settings.single_payment_limit THEN
    RETURN false;
  END IF;
  
  -- Check daily limit (simplified - should check actual daily total)
  IF p_amount > v_settings.daily_payment_limit THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Views for Monitoring
-- ============================================================================

-- Pending boletos
CREATE OR REPLACE VIEW pending_boletos AS
SELECT
  b.id,
  b.user_id,
  b.payee_name,
  b.amount,
  b.due_date,
  EXTRACT(DAY FROM (b.due_date - CURRENT_DATE))::INTEGER as days_until_due,
  b.status
FROM boletos b
WHERE b.status IN ('pending', 'scheduled')
  AND b.due_date >= CURRENT_DATE
ORDER BY b.due_date ASC;

-- PIX transfer statistics
CREATE OR REPLACE VIEW pix_transfer_stats AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_transfers,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transfers,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transfers,
  SUM(amount) as total_amount,
  AVG(EXTRACT(EPOCH FROM (executed_at - created_at)))::INTEGER as avg_execution_seconds
FROM pix_transfers
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Payment failure summary
CREATE OR REPLACE VIEW payment_failure_summary AS
SELECT
  failure_type,
  payment_type,
  COUNT(*) as failure_count,
  COUNT(CASE WHEN resolution_status = 'resolved' THEN 1 END) as resolved_count,
  ROUND(
    COUNT(CASE WHEN resolution_status = 'resolved' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as resolution_rate_percent
FROM payment_failures
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY failure_type, payment_type
ORDER BY failure_count DESC;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE boletos IS 'Brazilian boleto payment slips with OCR/barcode capture';
COMMENT ON TABLE pix_transfers IS 'PIX instant transfers with voice activation support';
COMMENT ON TABLE user_autonomy_settings IS 'User autonomy preferences and trust levels';
COMMENT ON TABLE payment_failures IS 'Payment failure tracking and resolution';
COMMENT ON VIEW pending_boletos IS 'Boletos pending payment';
COMMENT ON VIEW pix_transfer_stats IS 'PIX transfer statistics (last 30 days)';
COMMENT ON VIEW payment_failure_summary IS 'Payment failure summary by type (last 30 days)';
