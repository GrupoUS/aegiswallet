-- Security Authentication Tables Migration
-- Enhanced biometric authentication with PIN, OTP, session management and fraud detection

-- User PINs table for secure PIN storage
CREATE TABLE IF NOT EXISTS user_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Authentication attempts tracking for rate limiting and lockout
CREATE TABLE IF NOT EXISTS auth_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('platform', 'pin', 'sms', 'push')),
  failed_attempts INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT FALSE,
  lockout_until TIMESTAMP WITH TIME ZONE,
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, method)
);

-- OTP codes for SMS authentication
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_otp_user_phone (user_id, phone_number),
  INDEX idx_otp_code (otp_code),
  INDEX idx_otp_expires (expires_at)
);

-- Push authentication requests
CREATE TABLE IF NOT EXISTS push_auth_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_push_token (push_token),
  INDEX idx_push_user_status (user_id, status)
);

-- Authentication sessions
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  method TEXT NOT NULL CHECK (method IN ('platform', 'pin', 'sms', 'push')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_session_token (session_token),
  INDEX idx_session_user (user_id),
  INDEX idx_session_expires (expires_at)
);

-- Biometric credentials
CREATE TABLE IF NOT EXISTS biometric_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL,
  credential_type TEXT NOT NULL DEFAULT 'public-key',
  public_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, credential_id),
  INDEX idx_biometric_user (user_id)
);

-- Enhanced security events table
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'auth_success', 'auth_failure', 'pin_lockout', 'account_locked',
    'suspicious_activity', 'fraud_detected', 'session_expired',
    'otp_sent', 'otp_verified', 'push_sent', 'biometric_enrolled'
  )),
  method TEXT CHECK (method IN ('platform', 'pin', 'sms', 'push')),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  risk_score DECIMAL(3,2) DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_security_user (user_id),
  INDEX idx_security_event_type (event_type),
  INDEX idx_security_created (created_at),
  INDEX idx_security_risk_score (risk_score)
);

-- Fraud detection rules
CREATE TABLE IF NOT EXISTS fraud_detection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('location_anomaly', 'device_anomaly', 'behavior_anomaly', 'frequency_anomaly')),
  threshold DECIMAL(3,2) NOT NULL CHECK (threshold >= 0 AND threshold <= 1),
  enabled BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User security preferences
CREATE TABLE IF NOT EXISTS user_security_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  require_biometric BOOLEAN DEFAULT FALSE,
  require_otp_for_sensitive_operations BOOLEAN DEFAULT TRUE,
  session_timeout_minutes INTEGER DEFAULT 30,
  max_failed_attempts INTEGER DEFAULT 5,
  lockout_duration_minutes INTEGER DEFAULT 15,
  enable_push_notifications BOOLEAN DEFAULT TRUE,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Security alerts for suspicious activities
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('suspicious_login', 'brute_force_attempt', 'unusual_location', 'multiple_devices')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_alerts_user (user_id),
  INDEX idx_alerts_severity (severity),
  INDEX idx_alerts_unresolved (is_resolved, created_at)
);

-- Row Level Security (RLS) policies

-- User PINs - only users can access their own PINs
ALTER TABLE user_pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own PINs" ON user_pins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own PINs" ON user_pins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own PINs" ON user_pins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own PINs" ON user_pins FOR DELETE USING (auth.uid() = user_id);

-- Auth attempts - users can view their own attempts
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own auth attempts" ON auth_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can update auth attempts" ON auth_attempts FOR UPDATE USING (true);
CREATE POLICY "System can insert auth attempts" ON auth_attempts FOR INSERT WITH CHECK (true);

-- OTP codes - users can view/manage their own OTPs
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own OTP codes" ON otp_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage OTP codes" ON otp_codes FOR ALL USING (true);

-- Push auth requests - users can view their own requests
ALTER TABLE push_auth_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own push requests" ON push_auth_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage push requests" ON push_auth_requests FOR ALL USING (true);

-- Auth sessions - users can view/manage their own sessions
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sessions" ON auth_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can revoke their own sessions" ON auth_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can manage sessions" ON auth_sessions FOR ALL USING (true);

-- Biometric credentials - users can manage their own credentials
ALTER TABLE biometric_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own biometric credentials" ON biometric_credentials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own biometric credentials" ON biometric_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own biometric credentials" ON biometric_credentials FOR DELETE USING (auth.uid() = user_id);

-- Security events - users can view their own security events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own security events" ON security_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert security events" ON security_events FOR INSERT WITH CHECK (true);

-- User security preferences - users can manage their own preferences
ALTER TABLE user_security_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own security preferences" ON user_security_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own security preferences" ON user_security_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own security preferences" ON user_security_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Security alerts - users can view their own alerts
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own security alerts" ON security_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage security alerts" ON security_alerts FOR ALL USING (true);

-- Insert default fraud detection rules
INSERT INTO fraud_detection_rules (rule_type, threshold, enabled, description) VALUES
('frequency_anomaly', 0.7, true, 'Detects unusual frequency of authentication attempts'),
('location_anomaly', 0.8, true, 'Detects authentication from unusual locations'),
('device_anomaly', 0.7, true, 'Detects authentication from new devices'),
('behavior_anomaly', 0.6, true, 'Detects unusual authentication patterns')
ON CONFLICT DO NOTHING;

-- Create a function to clean up expired sessions and OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_security_data()
RETURNS void AS $$
BEGIN
  -- Mark expired sessions as inactive
  UPDATE auth_sessions
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;

  -- Mark expired OTPs as used
  UPDATE otp_codes
  SET is_used = true
  WHERE expires_at < NOW() AND is_used = false;

  -- Expire pending push requests
  UPDATE push_auth_requests
  SET status = 'expired'
  WHERE expires_at < NOW() AND status = 'pending';

  -- Log session expiry events for active sessions that expired
  INSERT INTO security_events (user_id, event_type, method, metadata, created_at)
  SELECT
    user_id,
    'session_expired',
    method,
    json_build_object('expired_at', expires_at),
    expires_at
  FROM auth_sessions
  WHERE expires_at < NOW()
    AND is_active = false
    AND NOT EXISTS (
      SELECT 1 FROM security_events se
      WHERE se.user_id = auth_sessions.user_id
        AND se.event_type = 'session_expired'
        AND se.created_at >= auth_sessions.expires_at - INTERVAL '1 hour'
    );
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically log security events
CREATE OR REPLACE FUNCTION log_security_event_trigger()
RETURNS trigger AS $$
BEGIN
  -- Log suspicious activities based on failed attempts
  IF TG_TABLE_NAME = 'auth_attempts' AND NEW.failed_attempts >= 3 THEN
    INSERT INTO security_events (user_id, event_type, method, metadata, risk_score, created_at)
    VALUES (
      NEW.user_id,
      CASE
        WHEN NEW.failed_attempts >= 5 THEN 'account_locked'
        ELSE 'suspicious_activity'
      END,
      NEW.method,
      json_build_object('failed_attempts', NEW.failed_attempts, 'is_locked', NEW.is_locked),
      LEAST(NEW.failed_attempts::DECIMAL / 10, 1.0),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auth_attempts
CREATE TRIGGER auth_attempts_security_trigger
  AFTER UPDATE ON auth_attempts
  FOR EACH ROW
  EXECUTE FUNCTION log_security_event_trigger();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_pins_user_id ON user_pins(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_user_method ON auth_attempts(user_id, method);
CREATE INDEX IF NOT EXISTS idx_security_events_user_type ON security_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_unread ON security_alerts(user_id, is_read);

-- Create view for user security summary
CREATE OR REPLACE VIEW user_security_summary AS
SELECT
  u.id as user_id,
  CASE WHEN up.id IS NOT NULL THEN true ELSE false END as has_pin,
  CASE WHEN bc.id IS NOT NULL THEN true ELSE false END as has_biometric,
  CASE WHEN aa.is_locked THEN true ELSE false END as is_locked,
  aa.lockout_until,
  aa.failed_attempts,
  usp.session_timeout_minutes,
  usp.require_otp_for_sensitive_operations,
  COUNT(DISTINCT CASE WHEN se.event_type = 'auth_failure' AND se.created_at > NOW() - INTERVAL '24 hours' THEN se.id END) as recent_failures,
  COUNT(DISTINCT CASE WHEN sa.id IS NOT NULL AND sa.is_read = false THEN sa.id END) as unread_alerts
FROM auth.users u
LEFT JOIN user_pins up ON u.id = up.user_id
LEFT JOIN biometric_credentials bc ON u.id = bc.user_id
LEFT JOIN auth_attempts aa ON u.id = aa.user_id AND aa.method = 'pin'
LEFT JOIN user_security_preferences usp ON u.id = usp.user_id
LEFT JOIN security_events se ON u.id = se.user_id
LEFT JOIN security_alerts sa ON u.id = sa.user_id
GROUP BY u.id, up.id, bc.id, aa.id, usp.session_timeout_minutes, usp.require_otp_for_sensitive_operations;
