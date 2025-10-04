-- Security Confirmations and Audit Tables
-- Story: 01.04 - Segurança e Confirmação por Voz
-- Created: 2025-01-04

-- ============================================================================
-- Security Confirmations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID,
  
  -- Confirmation details
  confirmation_type TEXT NOT NULL CHECK (confirmation_type IN (
    'voice',
    'biometric',
    'pin',
    'sms',
    'push'
  )),
  
  -- Voice confirmation data
  voice_pattern_hash TEXT,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  transcription_hash TEXT,
  audio_storage_path TEXT, -- Encrypted audio path
  
  -- Status tracking
  status TEXT NOT NULL CHECK (status IN (
    'pending',
    'confirmed',
    'rejected',
    'expired',
    'cancelled'
  )) DEFAULT 'pending',
  
  -- Metadata
  metadata JSONB,
  attempts_count INTEGER DEFAULT 0,
  
  -- Timestamps
  expires_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_security_confirmations_user_id ON security_confirmations(user_id);
CREATE INDEX idx_security_confirmations_transaction_id ON security_confirmations(transaction_id);
CREATE INDEX idx_security_confirmations_status ON security_confirmations(status);
CREATE INDEX idx_security_confirmations_expires_at ON security_confirmations(expires_at);
CREATE INDEX idx_security_confirmations_created_at ON security_confirmations(created_at DESC);

-- ============================================================================
-- User Voice Patterns Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_voice_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Voice pattern data (hashed, not raw audio)
  pattern_hash TEXT NOT NULL,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.85 CHECK (confidence_threshold >= 0 AND confidence_threshold <= 1),
  
  -- Pattern quality
  sample_count INTEGER DEFAULT 1,
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
  
  -- Timestamps
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_voice_patterns_user_id ON user_voice_patterns(user_id);

-- ============================================================================
-- Security Audit Logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Action details
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  
  -- Result and risk
  result TEXT NOT NULL CHECK (result IN ('success', 'failure', 'suspicious', 'blocked')),
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  
  -- Security data
  digital_signature TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Retention
  retention_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '12 months'),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX idx_security_audit_logs_action ON security_audit_logs(action);
CREATE INDEX idx_security_audit_logs_result ON security_audit_logs(result);
CREATE INDEX idx_security_audit_logs_risk_score ON security_audit_logs(risk_score);
CREATE INDEX idx_security_audit_logs_created_at ON security_audit_logs(created_at DESC);
CREATE INDEX idx_security_audit_logs_retention_until ON security_audit_logs(retention_until);

-- ============================================================================
-- Confirmation Attempts Table (Rate Limiting)
-- ============================================================================

CREATE TABLE IF NOT EXISTS confirmation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID,
  
  -- Attempt details
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('voice', 'biometric', 'pin', 'sms')),
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  
  -- Rate limiting
  ip_address INET,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_confirmation_attempts_user_id ON confirmation_attempts(user_id);
CREATE INDEX idx_confirmation_attempts_transaction_id ON confirmation_attempts(transaction_id);
CREATE INDEX idx_confirmation_attempts_created_at ON confirmation_attempts(created_at DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE security_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_voice_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmation_attempts ENABLE ROW LEVEL SECURITY;

-- Security Confirmations Policies
CREATE POLICY "Users can view their own confirmations"
  ON security_confirmations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own confirmations"
  ON security_confirmations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own confirmations"
  ON security_confirmations FOR UPDATE
  USING (auth.uid() = user_id);

-- User Voice Patterns Policies
CREATE POLICY "Users can view their own voice patterns"
  ON user_voice_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice patterns"
  ON user_voice_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice patterns"
  ON user_voice_patterns FOR UPDATE
  USING (auth.uid() = user_id);

-- Security Audit Logs Policies (Read-only for users)
CREATE POLICY "Users can view their own audit logs"
  ON security_audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert audit logs (no user policy for INSERT)

-- Confirmation Attempts Policies
CREATE POLICY "Users can view their own attempts"
  ON confirmation_attempts FOR SELECT
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
CREATE TRIGGER update_security_confirmations_updated_at
  BEFORE UPDATE ON security_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Cleanup expired confirmations (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_confirmations()
RETURNS void AS $$
BEGIN
  UPDATE security_confirmations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Cleanup old audit logs (run daily)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM security_audit_logs
  WHERE retention_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- Check rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_attempt_type TEXT,
  p_time_window_minutes INTEGER DEFAULT 5,
  p_max_attempts INTEGER DEFAULT 3
)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO attempt_count
  FROM confirmation_attempts
  WHERE user_id = p_user_id
    AND attempt_type = p_attempt_type
    AND created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
  
  RETURN attempt_count < p_max_attempts;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Views for Analytics
-- ============================================================================

-- Confirmation success rate by type
CREATE OR REPLACE VIEW confirmation_success_rate AS
SELECT
  confirmation_type,
  COUNT(*) as total_confirmations,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
  COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
  ROUND(
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as success_rate_percent
FROM security_confirmations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY confirmation_type;

-- Security risk summary
CREATE OR REPLACE VIEW security_risk_summary AS
SELECT
  user_id,
  COUNT(*) as total_events,
  COUNT(CASE WHEN result = 'suspicious' THEN 1 END) as suspicious_events,
  COUNT(CASE WHEN result = 'blocked' THEN 1 END) as blocked_events,
  AVG(risk_score) as avg_risk_score,
  MAX(risk_score) as max_risk_score,
  MAX(created_at) as last_event_at
FROM security_audit_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id
HAVING COUNT(CASE WHEN result IN ('suspicious', 'blocked') THEN 1 END) > 0;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE security_confirmations IS 'Secure confirmations for financial transactions with voice and biometric authentication';
COMMENT ON TABLE user_voice_patterns IS 'User voice pattern hashes for voice recognition (LGPD compliant)';
COMMENT ON TABLE security_audit_logs IS 'Digitally signed audit logs with 12-month retention';
COMMENT ON TABLE confirmation_attempts IS 'Rate limiting and attempt tracking for confirmations';
COMMENT ON VIEW confirmation_success_rate IS 'Success rate by confirmation type (last 30 days)';
COMMENT ON VIEW security_risk_summary IS 'Security risk summary by user (last 30 days)';
