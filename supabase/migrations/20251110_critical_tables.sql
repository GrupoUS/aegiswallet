-- Critical Tables Migration for AegisWallet
-- Created: 2025-11-10
-- Purpose: Add critical LGPD compliance and audit tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: user_consent
-- Purpose: Store LGPD consent records for each user
CREATE TABLE IF NOT EXISTS user_consent (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL, -- voice_data_processing, biometric_data, audio_recording, etc.
    granted BOOLEAN NOT NULL DEFAULT false,
    consent_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    consent_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- Constraints
    CONSTRAINT user_consent_unique UNIQUE (user_id, consent_type),
    CONSTRAINT user_consent_type_valid CHECK (consent_type IN (
        'voice_data_processing',
        'biometric_data',
        'audio_recording',
        'data_retention',
        'marketing_communications',
        'analytics_data',
        'third_party_sharing'
    ))
);

-- Table: voice_feedback
-- Purpose: Store user feedback on voice recognition accuracy and quality
CREATE TABLE IF NOT EXISTS voice_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID,
    command_text TEXT NOT NULL,
    recognized_text TEXT,
    confidence_score DECIMAL(5,4), -- 0.0000 to 1.0000
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1 to 5 stars
    feedback_text TEXT,
    feedback_type VARCHAR(50) CHECK (feedback_type IN (
        'accuracy',
        'speed',
        'clarity',
        'language',
        'general'
    )),
    audio_file_path TEXT,
    transcription_id UUID,
    was_correct BOOLEAN,
    correction_made TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: audit_logs
-- Purpose: Comprehensive audit logging for compliance and security
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    details JSONB, -- Additional context data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- Constraints
    CONSTRAINT audit_logs_action_valid CHECK (action IN (
        'login', 'logout', 'login_failed',
        'voice_command_processed', 'voice_command_failed',
        'transaction_created', 'transaction_updated', 'transaction_deleted',
        'consent_granted', 'consent_revoked', 'consent_updated',
        'data_exported', 'data_accessed', 'data_deleted', 'data_modified',
        'account_created', 'account_updated', 'account_deleted',
        'security_event', 'admin_action',
        'lgpd_request_created', 'lgpd_request_processed',
        'automatic_data_deletion', 'manual_data_deletion',
        'settings_updated', 'preferences_updated'
    ))
);

-- Table: data_subject_requests (LGPD)
-- Purpose: Track LGPD data subject rights requests
CREATE TABLE IF NOT EXISTS data_subject_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN (
        'access', 'correction', 'deletion', 'portability', 'restriction'
    )),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'rejected', 'cancelled'
    )),
    request_data JSONB,
    response JSONB,
    notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Table: legal_holds
-- Purpose: Track legal holds on user data (prevents deletion)
CREATE TABLE IF NOT EXISTS legal_holds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hold_type VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    case_reference VARCHAR(100),
    active BOOLEAN DEFAULT true,
    placed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    released_by UUID REFERENCES auth.users(id)
);

-- Table: user_activity
-- Purpose: Track user activity for retention policy calculations
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- Constraints
    CONSTRAINT user_activity_type_valid CHECK (activity_type IN (
        'voice_recording',
        'biometric_authentication',
        'transaction_activity',
        'login_activity',
        'data_access',
        'consent_activity'
    ))
);

-- Table: voice_recordings
-- Purpose: Store temporary voice recordings with metadata
CREATE TABLE IF NOT EXISTS voice_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    duration_ms INTEGER,
    format VARCHAR(20) DEFAULT 'webm',
    sample_rate INTEGER,
    channels INTEGER,
    transcription_id UUID,
    processed BOOLEAN DEFAULT false,
    retention_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Table: biometric_patterns
-- Purpose: Store voice biometric patterns for authentication
CREATE TABLE IF NOT EXISTS biometric_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern_data JSONB NOT NULL, -- Encrypted biometric data
    model_version VARCHAR(20),
    confidence_threshold DECIMAL(5,4) DEFAULT 0.8500,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    anonymized_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance

-- user_consent indexes
CREATE INDEX IF NOT EXISTS idx_user_consent_user_granted ON user_consent(user_id, granted);
CREATE INDEX IF NOT EXISTS idx_user_consent_type_date ON user_consent(consent_type, consent_date);
CREATE INDEX IF NOT EXISTS idx_user_consent_updated_at ON user_consent(updated_at);

-- voice_feedback indexes
CREATE INDEX IF NOT EXISTS idx_voice_feedback_user_rating ON voice_feedback(user_id, rating);
CREATE INDEX IF NOT EXISTS idx_voice_feedback_session ON voice_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_feedback_created_at ON voice_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_feedback_type ON voice_feedback(feedback_type);

-- audit_logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- data_subject_requests indexes
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_user_status ON data_subject_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_type ON data_subject_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_created_at ON data_subject_requests(created_at);

-- legal_holds indexes
CREATE INDEX IF NOT EXISTS idx_legal_holds_user_active ON legal_holds(user_id, active);
CREATE INDEX IF NOT EXISTS idx_legal_holds_type ON legal_holds(hold_type);

-- user_activity indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_user_type ON user_activity(user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_last_activity ON user_activity(last_activity);

-- voice_recordings indexes
CREATE INDEX IF NOT EXISTS idx_voice_recordings_user_session ON voice_recordings(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_retention ON voice_recordings(retention_expires_at);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_created_at ON voice_recordings(created_at);

-- biometric_patterns indexes
CREATE INDEX IF NOT EXISTS idx_biometric_patterns_user_active ON biometric_patterns(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_biometric_patterns_last_used ON biometric_patterns(last_used_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE user_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_patterns ENABLE ROW LEVEL SECURITY;

-- user_consent RLS policies
CREATE POLICY "Users can view their own consent records" ON user_consent
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own consent records" ON user_consent
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage consent records" ON user_consent
    FOR ALL USING (auth.role() = 'service_role');

-- voice_feedback RLS policies
CREATE POLICY "Users can view their own feedback" ON voice_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" ON voice_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage feedback" ON voice_feedback
    FOR ALL USING (auth.role() = 'service_role');

-- audit_logs RLS policies
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage audit logs" ON audit_logs
    FOR ALL USING (auth.role() = 'service_role');

-- data_subject_requests RLS policies
CREATE POLICY "Users can view their own requests" ON data_subject_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests" ON data_subject_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage requests" ON data_subject_requests
    FOR ALL USING (auth.role() = 'service_role');

-- legal_holds RLS policies
CREATE POLICY "Users can view their own legal holds" ON legal_holds
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage legal holds" ON legal_holds
    FOR ALL USING (auth.role() = 'service_role');

-- user_activity RLS policies
CREATE POLICY "Users can view their own activity" ON user_activity
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage activity" ON user_activity
    FOR ALL USING (auth.role() = 'service_role');

-- voice_recordings RLS policies
CREATE POLICY "Users can view their own recordings" ON voice_recordings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage recordings" ON voice_recordings
    FOR ALL USING (auth.role() = 'service_role');

-- biometric_patterns RLS policies
CREATE POLICY "Users can view their own patterns" ON biometric_patterns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage patterns" ON biometric_patterns
    FOR ALL USING (auth.role() = 'service_role');

-- Functions and triggers for automatic timestamp updates

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_consent_updated_at BEFORE UPDATE ON user_consent
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_biometric_patterns_updated_at BEFORE UPDATE ON biometric_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
        VALUES (
            NEW.user_id,
            TG_TABLE_NAME || '_created',
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values)
        VALUES (
            COALESCE(NEW.user_id, OLD.user_id),
            TG_TABLE_NAME || '_updated',
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(OLD),
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values)
        VALUES (
            OLD.user_id,
            TG_TABLE_NAME || '_deleted',
            TG_TABLE_NAME,
            OLD.id,
            row_to_json(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for sensitive tables
CREATE TRIGGER audit_user_consent AFTER INSERT OR UPDATE OR DELETE ON user_consent
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_data_subject_requests AFTER INSERT OR UPDATE OR DELETE ON data_subject_requests
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_legal_holds AFTER INSERT OR UPDATE OR DELETE ON legal_holds
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Function to check retention policy and schedule deletions
CREATE OR REPLACE FUNCTION check_retention_policies()
RETURNS void AS $$
DECLARE
    expired_recordings RECORD;
    expired_feedback RECORD;
BEGIN
    -- Delete expired voice recordings
    FOR expired_recordings IN
        SELECT id, user_id
        FROM voice_recordings
        WHERE retention_expires_at < now()
        AND deleted_at IS NULL
    LOOP
        UPDATE voice_recordings
        SET deleted_at = now()
        WHERE id = expired_recordings.id;

        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
        VALUES (
            expired_recordings.user_id,
            'automatic_data_deletion',
            'voice_recordings',
            expired_recordings.id,
            jsonb_build_object('reason', 'retention_policy_expired')
        );
    END LOOP;

    -- Archive old feedback (keep longer but mark as archived)
    FOR expired_feedback IN
        UPDATE voice_feedback
        SET archived = true
        WHERE created_at < now() - interval '2 years'
        AND archived IS NOT TRUE
        RETURNING id, user_id
    LOOP
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
        VALUES (
            expired_feedback.user_id,
            'data_archived',
            'voice_feedback',
            expired_feedback.id,
            jsonb_build_object('reason', 'retention_policy_archived')
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to be called periodically for retention policy enforcement
CREATE OR REPLACE FUNCTION schedule_retention_check()
RETURNS void AS $$
BEGIN
    PERFORM check_retention_policies();
END;
$$ LANGUAGE plpgsql;

-- Add comments to tables
COMMENT ON TABLE user_consent IS 'Stores LGPD consent records for each user with version tracking';
COMMENT ON TABLE voice_feedback IS 'User feedback on voice recognition quality and accuracy';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance and security monitoring';
COMMENT ON TABLE data_subject_requests IS 'LGPD data subject rights requests (access, deletion, etc.)';
COMMENT ON TABLE legal_holds IS 'Legal holds that prevent data deletion for legal reasons';
COMMENT ON TABLE user_activity IS 'User activity tracking for retention policy calculations';
COMMENT ON TABLE voice_recordings IS 'Temporary voice recordings with retention policies';
COMMENT ON TABLE biometric_patterns IS 'Encrypted voice biometric patterns for authentication';
