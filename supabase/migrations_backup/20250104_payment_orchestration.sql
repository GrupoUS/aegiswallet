-- Payment Orchestration Engine
-- Story: 03.01 - Motor de Orquestração de Pagamentos
-- Created: 2025-01-04

-- ============================================================================
-- Payment Rules Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payee details
  payee_name TEXT NOT NULL,
  payee_type TEXT CHECK (payee_type IN ('pix', 'boleto', 'ted', 'doc')) DEFAULT 'pix',
  payee_key TEXT, -- PIX key, barcode, or account number
  
  -- Rule configuration
  max_amount DECIMAL(12,2) NOT NULL,
  tolerance_percentage INTEGER DEFAULT 5 CHECK (tolerance_percentage >= 0 AND tolerance_percentage <= 100),
  preferred_time TIME DEFAULT '09:00:00',
  
  -- Autonomy level (50% = always confirm, 75% = confirm if unusual, 95% = auto-execute)
  autonomy_level INTEGER NOT NULL CHECK (autonomy_level IN (50, 75, 95)) DEFAULT 50,
  
  -- Category and metadata
  category TEXT,
  description TEXT,
  metadata JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payment_rules_user_id ON payment_rules(user_id);
CREATE INDEX idx_payment_rules_payee_name ON payment_rules(payee_name);
CREATE INDEX idx_payment_rules_is_active ON payment_rules(is_active);
CREATE INDEX idx_payment_rules_autonomy_level ON payment_rules(autonomy_level);

-- ============================================================================
-- Scheduled Payments Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES payment_rules(id) ON DELETE SET NULL,
  
  -- Payment details
  payee_name TEXT NOT NULL,
  payee_key TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('pix', 'boleto', 'ted', 'doc')) DEFAULT 'pix',
  
  -- Scheduling
  due_date DATE NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL CHECK (status IN (
    'pending',
    'awaiting_approval',
    'approved',
    'executing',
    'executed',
    'failed',
    'cancelled'
  )) DEFAULT 'pending',
  
  -- Execution tracking
  execution_attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error handling
  error_code TEXT,
  error_message TEXT,
  
  -- Approval tracking
  requires_approval BOOLEAN DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  approval_method TEXT, -- 'voice', 'manual', 'automatic'
  
  -- Transaction reference
  transaction_id TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_scheduled_payments_user_id ON scheduled_payments(user_id);
CREATE INDEX idx_scheduled_payments_rule_id ON scheduled_payments(rule_id);
CREATE INDEX idx_scheduled_payments_status ON scheduled_payments(status);
CREATE INDEX idx_scheduled_payments_due_date ON scheduled_payments(due_date);
CREATE INDEX idx_scheduled_payments_scheduled_time ON scheduled_payments(scheduled_time);

-- ============================================================================
-- Payment Execution Logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES scheduled_payments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Execution details
  attempt_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'failed', 'timeout')),
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  
  -- Result
  success BOOLEAN NOT NULL,
  error_code TEXT,
  error_message TEXT,
  response_data JSONB,
  
  -- Security
  digital_signature TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payment_execution_logs_payment_id ON payment_execution_logs(payment_id);
CREATE INDEX idx_payment_execution_logs_user_id ON payment_execution_logs(user_id);
CREATE INDEX idx_payment_execution_logs_status ON payment_execution_logs(status);
CREATE INDEX idx_payment_execution_logs_created_at ON payment_execution_logs(created_at DESC);

-- ============================================================================
-- Payment Notifications Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES scheduled_payments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'pre_payment_24h',
    'pre_payment_1h',
    'approval_required',
    'payment_executed',
    'payment_failed',
    'payment_cancelled'
  )),
  
  -- Delivery
  channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'sms', 'voice')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed')) DEFAULT 'pending',
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Timing
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payment_notifications_payment_id ON payment_notifications(payment_id);
CREATE INDEX idx_payment_notifications_user_id ON payment_notifications(user_id);
CREATE INDEX idx_payment_notifications_status ON payment_notifications(status);
CREATE INDEX idx_payment_notifications_scheduled_at ON payment_notifications(scheduled_at);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE payment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;

-- Payment Rules Policies
CREATE POLICY "Users can view their own payment rules"
  ON payment_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment rules"
  ON payment_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment rules"
  ON payment_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment rules"
  ON payment_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Scheduled Payments Policies
CREATE POLICY "Users can view their own scheduled payments"
  ON scheduled_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled payments"
  ON scheduled_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled payments"
  ON scheduled_payments FOR UPDATE
  USING (auth.uid() = user_id);

-- Payment Execution Logs Policies (Read-only for users)
CREATE POLICY "Users can view their own payment logs"
  ON payment_execution_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Payment Notifications Policies
CREATE POLICY "Users can view their own notifications"
  ON payment_notifications FOR SELECT
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
CREATE TRIGGER update_payment_rules_updated_at
  BEFORE UPDATE ON payment_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_payments_updated_at
  BEFORE UPDATE ON scheduled_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Check if payment needs approval based on autonomy level
CREATE OR REPLACE FUNCTION check_payment_approval_required(
  p_rule_id UUID,
  p_amount DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_rule RECORD;
  v_max_allowed DECIMAL;
BEGIN
  SELECT * INTO v_rule FROM payment_rules WHERE id = p_rule_id;
  
  IF NOT FOUND THEN
    RETURN true; -- Require approval if no rule found
  END IF;
  
  -- Calculate max allowed amount with tolerance
  v_max_allowed := v_rule.max_amount * (1 + v_rule.tolerance_percentage / 100.0);
  
  -- Autonomy level 95%: auto-approve if within limits
  IF v_rule.autonomy_level = 95 AND p_amount <= v_max_allowed THEN
    RETURN false;
  END IF;
  
  -- Autonomy level 75%: auto-approve if within strict limits
  IF v_rule.autonomy_level = 75 AND p_amount <= v_rule.max_amount THEN
    RETURN false;
  END IF;
  
  -- Autonomy level 50%: always require approval
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Get payments ready for execution (run every minute)
CREATE OR REPLACE FUNCTION get_payments_ready_for_execution()
RETURNS TABLE(
  payment_id UUID,
  user_id UUID,
  payee_name TEXT,
  amount DECIMAL,
  payment_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id as payment_id,
    sp.user_id,
    sp.payee_name,
    sp.amount,
    sp.payment_type
  FROM scheduled_payments sp
  WHERE sp.status IN ('approved', 'pending')
    AND sp.scheduled_time <= NOW()
    AND sp.execution_attempts < sp.max_attempts
  ORDER BY sp.scheduled_time ASC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Create notification for payment
CREATE OR REPLACE FUNCTION create_payment_notification(
  p_payment_id UUID,
  p_notification_type TEXT,
  p_channel TEXT DEFAULT 'push'
)
RETURNS void AS $$
DECLARE
  v_payment RECORD;
  v_title TEXT;
  v_message TEXT;
  v_scheduled_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT * INTO v_payment FROM scheduled_payments WHERE id = p_payment_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Generate notification content
  CASE p_notification_type
    WHEN 'pre_payment_24h' THEN
      v_title := 'Pagamento Agendado Amanhã';
      v_message := format('Pagamento de R$ %s para %s será executado amanhã às %s',
        v_payment.amount, v_payment.payee_name, 
        to_char(v_payment.scheduled_time, 'HH24:MI'));
      v_scheduled_at := v_payment.scheduled_time - INTERVAL '24 hours';
    
    WHEN 'pre_payment_1h' THEN
      v_title := 'Pagamento em 1 Hora';
      v_message := format('Pagamento de R$ %s para %s será executado em 1 hora',
        v_payment.amount, v_payment.payee_name);
      v_scheduled_at := v_payment.scheduled_time - INTERVAL '1 hour';
    
    WHEN 'approval_required' THEN
      v_title := 'Aprovação Necessária';
      v_message := format('Pagamento de R$ %s para %s requer sua aprovação',
        v_payment.amount, v_payment.payee_name);
      v_scheduled_at := NOW();
    
    WHEN 'payment_executed' THEN
      v_title := 'Pagamento Realizado';
      v_message := format('Pagamento de R$ %s para %s foi executado com sucesso',
        v_payment.amount, v_payment.payee_name);
      v_scheduled_at := NOW();
    
    WHEN 'payment_failed' THEN
      v_title := 'Falha no Pagamento';
      v_message := format('Pagamento de R$ %s para %s falhou. Verifique sua conta.',
        v_payment.amount, v_payment.payee_name);
      v_scheduled_at := NOW();
    
    ELSE
      RETURN;
  END CASE;
  
  INSERT INTO payment_notifications (
    payment_id,
    user_id,
    notification_type,
    channel,
    title,
    message,
    scheduled_at
  ) VALUES (
    p_payment_id,
    v_payment.user_id,
    p_notification_type,
    p_channel,
    v_title,
    v_message,
    v_scheduled_at
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Views for Monitoring
-- ============================================================================

-- Payment success rate
CREATE OR REPLACE VIEW payment_success_rate AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_payments,
  COUNT(CASE WHEN status = 'executed' THEN 1 END) as successful_payments,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
  ROUND(
    COUNT(CASE WHEN status = 'executed' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as success_rate_percent
FROM scheduled_payments
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Pending approvals
CREATE OR REPLACE VIEW pending_approvals AS
SELECT
  sp.id,
  sp.user_id,
  sp.payee_name,
  sp.amount,
  sp.due_date,
  sp.scheduled_time,
  EXTRACT(EPOCH FROM (sp.scheduled_time - NOW()))::INTEGER as seconds_until_due
FROM scheduled_payments sp
WHERE sp.status = 'awaiting_approval'
  AND sp.scheduled_time > NOW()
ORDER BY sp.scheduled_time ASC;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE payment_rules IS 'User-defined rules for automatic payment execution';
COMMENT ON TABLE scheduled_payments IS 'Scheduled payments with autonomy-based approval workflow';
COMMENT ON TABLE payment_execution_logs IS 'Immutable execution logs for audit and compliance';
COMMENT ON TABLE payment_notifications IS 'Proactive notifications for payment lifecycle';
COMMENT ON VIEW payment_success_rate IS 'Payment success rate by day (last 30 days)';
COMMENT ON VIEW pending_approvals IS 'Payments awaiting user approval';
