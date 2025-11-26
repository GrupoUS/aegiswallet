-- Banking Connections and Open Banking Integration
-- Story: 02.01 - Conectores Open Banking
-- Created: 2025-01-04

-- ============================================================================
-- Bank Connections Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Institution details
  institution_code TEXT NOT NULL, -- bradesco, itau, bb, caixa, nubank
  institution_name TEXT NOT NULL,
  belvo_link_id TEXT UNIQUE, -- Belvo's link ID
  
  -- Connection status
  status TEXT NOT NULL CHECK (status IN (
    'active',
    'expired',
    'revoked',
    'error',
    'pending'
  )) DEFAULT 'pending',
  
  -- Sync tracking
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency_hours INTEGER DEFAULT 24,
  
  -- Error tracking
  error_code TEXT,
  error_message TEXT,
  error_count INTEGER DEFAULT 0,
  last_error_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bank_connections_user_id ON bank_connections(user_id);
CREATE INDEX idx_bank_connections_institution_code ON bank_connections(institution_code);
CREATE INDEX idx_bank_connections_status ON bank_connections(status);
CREATE INDEX idx_bank_connections_belvo_link_id ON bank_connections(belvo_link_id);
CREATE INDEX idx_bank_connections_next_sync_at ON bank_connections(next_sync_at);

-- Unique constraint: one connection per user per institution
CREATE UNIQUE INDEX idx_bank_connections_user_institution 
  ON bank_connections(user_id, institution_code);

-- ============================================================================
-- Bank Tokens Table (Encrypted Storage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS bank_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES bank_connections(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Encrypted token data
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT,
  encryption_iv TEXT NOT NULL, -- Initialization vector
  encryption_algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  
  -- Token metadata
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE,
  refresh_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Scopes
  scopes TEXT[] DEFAULT ARRAY['accounts:read', 'transactions:read'],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bank_tokens_connection_id ON bank_tokens(connection_id);
CREATE INDEX idx_bank_tokens_user_id ON bank_tokens(user_id);
CREATE INDEX idx_bank_tokens_expires_at ON bank_tokens(expires_at);

-- Unique constraint: one token per connection
CREATE UNIQUE INDEX idx_bank_tokens_connection ON bank_tokens(connection_id);

-- ============================================================================
-- Bank Consent Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS bank_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES bank_connections(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Consent details
  consent_id TEXT, -- External consent ID from bank/Belvo
  scopes TEXT[] NOT NULL,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'granted',
    'expired',
    'revoked',
    'pending_renewal'
  )) DEFAULT 'granted',
  
  -- Expiration (90 days per Open Banking Brasil)
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  renewed_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  
  -- Notifications
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bank_consent_connection_id ON bank_consent(connection_id);
CREATE INDEX idx_bank_consent_user_id ON bank_consent(user_id);
CREATE INDEX idx_bank_consent_status ON bank_consent(status);
CREATE INDEX idx_bank_consent_expires_at ON bank_consent(expires_at);

-- ============================================================================
-- Bank Audit Logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS bank_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES bank_connections(id) ON DELETE SET NULL,
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'connection_created',
    'connection_updated',
    'connection_deleted',
    'token_refreshed',
    'consent_granted',
    'consent_renewed',
    'consent_revoked',
    'sync_started',
    'sync_completed',
    'sync_failed',
    'error_occurred'
  )),
  
  -- Event data
  institution_code TEXT,
  status TEXT,
  error_code TEXT,
  error_message TEXT,
  
  -- Security
  digital_signature TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Retention (12 months)
  retention_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '12 months'),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bank_audit_logs_user_id ON bank_audit_logs(user_id);
CREATE INDEX idx_bank_audit_logs_connection_id ON bank_audit_logs(connection_id);
CREATE INDEX idx_bank_audit_logs_event_type ON bank_audit_logs(event_type);
CREATE INDEX idx_bank_audit_logs_institution_code ON bank_audit_logs(institution_code);
CREATE INDEX idx_bank_audit_logs_created_at ON bank_audit_logs(created_at DESC);
CREATE INDEX idx_bank_audit_logs_retention_until ON bank_audit_logs(retention_until);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_audit_logs ENABLE ROW LEVEL SECURITY;

-- Bank Connections Policies
CREATE POLICY "Users can view their own connections"
  ON bank_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections"
  ON bank_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
  ON bank_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections"
  ON bank_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Bank Tokens Policies (Read-only for users, system manages)
CREATE POLICY "Users can view their own tokens"
  ON bank_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert/update tokens (no user policy for INSERT/UPDATE)

-- Bank Consent Policies
CREATE POLICY "Users can view their own consent"
  ON bank_consent FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own consent"
  ON bank_consent FOR UPDATE
  USING (auth.uid() = user_id);

-- Bank Audit Logs Policies (Read-only for users)
CREATE POLICY "Users can view their own audit logs"
  ON bank_audit_logs FOR SELECT
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
CREATE TRIGGER update_bank_connections_updated_at
  BEFORE UPDATE ON bank_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_tokens_updated_at
  BEFORE UPDATE ON bank_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_consent_updated_at
  BEFORE UPDATE ON bank_consent
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Cleanup expired tokens (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM bank_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days'; -- Keep for 7 days after expiration
END;
$$ LANGUAGE plpgsql;

-- Check expiring consents (run daily)
CREATE OR REPLACE FUNCTION check_expiring_consents()
RETURNS TABLE(
  user_id UUID,
  connection_id UUID,
  institution_name TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  days_until_expiration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bc.user_id,
    bc.id as connection_id,
    bc.institution_name,
    bco.expires_at,
    EXTRACT(DAY FROM (bco.expires_at - NOW()))::INTEGER as days_until_expiration
  FROM bank_consent bco
  JOIN bank_connections bc ON bc.id = bco.connection_id
  WHERE bco.status = 'granted'
    AND bco.expires_at <= NOW() + INTERVAL '7 days'
    AND bco.notification_sent_at IS NULL
  ORDER BY bco.expires_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old audit logs (run daily)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM bank_audit_logs
  WHERE retention_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Views for Monitoring
-- ============================================================================

-- Connection health by institution
CREATE OR REPLACE VIEW connection_health_by_institution AS
SELECT
  institution_code,
  institution_name,
  COUNT(*) as total_connections,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_connections,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as error_connections,
  COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_connections,
  ROUND(
    COUNT(CASE WHEN status = 'active' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as success_rate_percent,
  AVG(error_count) as avg_error_count,
  MAX(last_sync_at) as last_successful_sync
FROM bank_connections
GROUP BY institution_code, institution_name
ORDER BY total_connections DESC;

-- Expiring consents (next 7 days)
CREATE OR REPLACE VIEW expiring_consents AS
SELECT
  bc.user_id,
  bc.id as connection_id,
  bc.institution_code,
  bc.institution_name,
  bco.expires_at,
  EXTRACT(DAY FROM (bco.expires_at - NOW()))::INTEGER as days_until_expiration,
  bco.notification_sent_at IS NOT NULL as notification_sent
FROM bank_consent bco
JOIN bank_connections bc ON bc.id = bco.connection_id
WHERE bco.status = 'granted'
  AND bco.expires_at <= NOW() + INTERVAL '7 days'
ORDER BY bco.expires_at ASC;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE bank_connections IS 'User bank connections via Open Banking (Belvo)';
COMMENT ON TABLE bank_tokens IS 'Encrypted OAuth tokens for bank access';
COMMENT ON TABLE bank_consent IS 'User consent grants for Open Banking access (90-day expiration)';
COMMENT ON TABLE bank_audit_logs IS 'Audit trail for banking operations (12-month retention)';
COMMENT ON VIEW connection_health_by_institution IS 'Connection success rate by bank';
COMMENT ON VIEW expiring_consents IS 'Consents expiring in next 7 days';
