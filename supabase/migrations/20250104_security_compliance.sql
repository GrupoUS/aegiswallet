-- Security and Compliance for Open Banking
-- Story: 02.05 - Segurança e Compliance Open Banking
-- Created: 2025-01-04

-- ============================================================================
-- Data Classification Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_classification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Data details
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  
  -- Classification
  classification_level TEXT NOT NULL CHECK (classification_level IN (
    'public',
    'internal',
    'confidential',
    'restricted'
  )),
  
  -- Data type
  data_type TEXT NOT NULL CHECK (data_type IN (
    'personal_data',
    'sensitive_personal_data',
    'financial_data',
    'authentication_data',
    'metadata'
  )),
  
  -- LGPD compliance
  requires_consent BOOLEAN DEFAULT true,
  retention_days INTEGER NOT NULL,
  can_be_anonymized BOOLEAN DEFAULT false,
  
  -- Metadata
  description TEXT,
  legal_basis TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_data_classification_table_name ON data_classification(table_name);
CREATE INDEX idx_data_classification_level ON data_classification(classification_level);
CREATE UNIQUE INDEX idx_data_classification_unique ON data_classification(table_name, column_name);

-- ============================================================================
-- Access Control Audit Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS access_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User details
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  
  -- Access details
  action TEXT NOT NULL CHECK (action IN (
    'read',
    'create',
    'update',
    'delete',
    'export',
    'share'
  )),
  
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  
  -- Security
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  
  -- Result
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- Digital signature
  digital_signature TEXT NOT NULL,
  signature_algorithm TEXT DEFAULT 'HMAC-SHA256',
  
  -- Retention (12 months)
  retention_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '12 months'),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_access_audit_logs_user_id ON access_audit_logs(user_id);
CREATE INDEX idx_access_audit_logs_action ON access_audit_logs(action);
CREATE INDEX idx_access_audit_logs_resource_type ON access_audit_logs(resource_type);
CREATE INDEX idx_access_audit_logs_created_at ON access_audit_logs(created_at DESC);
CREATE INDEX idx_access_audit_logs_retention_until ON access_audit_logs(retention_until);

-- ============================================================================
-- Consent Management Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Consent details
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'data_collection',
    'data_processing',
    'data_sharing',
    'marketing',
    'analytics',
    'open_banking'
  )),
  
  -- Consent status
  status TEXT NOT NULL CHECK (status IN (
    'granted',
    'revoked',
    'expired'
  )) DEFAULT 'granted',
  
  -- Scope
  scope TEXT[] NOT NULL,
  purpose TEXT NOT NULL,
  
  -- Timing
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  consent_version TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_consent_type ON user_consents(consent_type);
CREATE INDEX idx_user_consents_status ON user_consents(status);
CREATE INDEX idx_user_consents_expires_at ON user_consents(expires_at);

-- ============================================================================
-- Security Incidents Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Incident details
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'unauthorized_access',
    'data_breach',
    'suspicious_activity',
    'failed_authentication',
    'privilege_escalation',
    'data_exfiltration'
  )),
  
  -- Severity
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'detected',
    'investigating',
    'contained',
    'resolved',
    'false_positive'
  )) DEFAULT 'detected',
  
  -- Affected resources
  affected_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  affected_resource_type TEXT,
  affected_resource_id TEXT,
  
  -- Detection
  detected_by TEXT, -- 'system', 'user', 'admin'
  detection_method TEXT,
  
  -- Timing
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contained_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Details
  description TEXT NOT NULL,
  impact_assessment TEXT,
  remediation_actions TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_security_incidents_incident_type ON security_incidents(incident_type);
CREATE INDEX idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX idx_security_incidents_status ON security_incidents(status);
CREATE INDEX idx_security_incidents_detected_at ON security_incidents(detected_at DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE data_classification ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;

-- Data Classification Policies (Admin only)
CREATE POLICY "Admins can view data classification"
  ON data_classification FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Access Audit Logs Policies (Users can view their own, admins can view all)
CREATE POLICY "Users can view their own access logs"
  ON access_audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all access logs"
  ON access_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- User Consents Policies
CREATE POLICY "Users can view their own consents"
  ON user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents"
  ON user_consents FOR UPDATE
  USING (auth.uid() = user_id);

-- Security Incidents Policies (Admin only)
CREATE POLICY "Admins can view all security incidents"
  ON security_incidents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

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
CREATE TRIGGER update_data_classification_updated_at
  BEFORE UPDATE ON data_classification
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON user_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_incidents_updated_at
  BEFORE UPDATE ON security_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Generate digital signature for audit log
CREATE OR REPLACE FUNCTION generate_audit_signature(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS TEXT AS $$
DECLARE
  v_secret TEXT := 'audit-secret-key-change-in-production';
  v_data TEXT;
BEGIN
  v_data := p_user_id::TEXT || p_action || p_resource_type || 
            COALESCE(p_resource_id, '') || p_timestamp::TEXT;
  
  RETURN encode(
    hmac(v_data::bytea, v_secret::bytea, 'sha256'),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Check if user has valid consent
CREATE OR REPLACE FUNCTION has_valid_consent(
  p_user_id UUID,
  p_consent_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_consents
    WHERE user_id = p_user_id
      AND consent_type = p_consent_type
      AND status = 'granted'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired audit logs (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM access_audit_logs
  WHERE retention_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Views for Compliance Reporting
-- ============================================================================

-- Data inventory for LGPD compliance
CREATE OR REPLACE VIEW data_inventory AS
SELECT
  table_name,
  column_name,
  classification_level,
  data_type,
  requires_consent,
  retention_days,
  legal_basis
FROM data_classification
ORDER BY 
  CASE classification_level
    WHEN 'restricted' THEN 1
    WHEN 'confidential' THEN 2
    WHEN 'internal' THEN 3
    WHEN 'public' THEN 4
  END,
  table_name,
  column_name;

-- Active consents summary
CREATE OR REPLACE VIEW active_consents_summary AS
SELECT
  consent_type,
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'granted' THEN 1 END) as granted_count,
  COUNT(CASE WHEN status = 'revoked' THEN 1 END) as revoked_count,
  COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count
FROM user_consents
GROUP BY consent_type
ORDER BY total_users DESC;

-- Security incidents summary
CREATE OR REPLACE VIEW security_incidents_summary AS
SELECT
  incident_type,
  severity,
  COUNT(*) as incident_count,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
  AVG(EXTRACT(EPOCH FROM (resolved_at - detected_at)) / 60)::INTEGER as avg_resolution_minutes
FROM security_incidents
WHERE detected_at >= NOW() - INTERVAL '30 days'
GROUP BY incident_type, severity
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  incident_count DESC;

-- ============================================================================
-- Seed Data: Data Classification
-- ============================================================================

INSERT INTO data_classification (table_name, column_name, classification_level, data_type, requires_consent, retention_days, can_be_anonymized, description, legal_basis) VALUES
-- User data
('auth.users', 'email', 'confidential', 'personal_data', true, 2555, false, 'User email address', 'Legitimate interest'),
('auth.users', 'phone', 'confidential', 'personal_data', true, 2555, true, 'User phone number', 'Consent'),

-- Banking data
('bank_connections', 'institution_code', 'internal', 'financial_data', true, 2555, false, 'Bank institution identifier', 'Consent'),
('bank_tokens', 'encrypted_access_token', 'restricted', 'authentication_data', true, 90, false, 'Encrypted OAuth token', 'Consent'),
('normalized_transactions', 'amount', 'confidential', 'financial_data', true, 2555, true, 'Transaction amount', 'Consent'),
('normalized_transactions', 'description', 'confidential', 'financial_data', true, 2555, true, 'Transaction description', 'Consent'),

-- Audit logs
('bank_audit_logs', 'user_id', 'internal', 'metadata', false, 365, false, 'User identifier for audit', 'Legitimate interest'),
('access_audit_logs', 'ip_address', 'internal', 'metadata', false, 365, true, 'User IP address', 'Legitimate interest')

ON CONFLICT (table_name, column_name) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE data_classification IS 'LGPD data classification and retention policies';
COMMENT ON TABLE access_audit_logs IS 'Immutable audit logs with digital signatures (12-month retention)';
COMMENT ON TABLE user_consents IS 'User consent management for LGPD compliance';
COMMENT ON TABLE security_incidents IS 'Security incident tracking and response';
COMMENT ON VIEW data_inventory IS 'Complete data inventory for LGPD compliance reporting';
COMMENT ON VIEW active_consents_summary IS 'Summary of active user consents';
COMMENT ON VIEW security_incidents_summary IS 'Security incidents summary (last 30 days)';
