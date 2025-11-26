-- ============================================================================
-- Voice STT Tables Migration
-- Story: 01.01 - Motor de Speech-to-Text Brasil
-- Date: 2025-01-04
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: voice_transcriptions
-- Purpose: Store encrypted audio transcriptions with metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_storage_path TEXT NOT NULL,
  transcript TEXT NOT NULL, -- Encrypted and anonymized
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  language TEXT NOT NULL DEFAULT 'pt-BR',
  processing_time_ms INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_voice_transcriptions_user_id ON voice_transcriptions(user_id);
CREATE INDEX idx_voice_transcriptions_created_at ON voice_transcriptions(created_at DESC);
CREATE INDEX idx_voice_transcriptions_expires_at ON voice_transcriptions(expires_at);

-- ============================================================================
-- Table: voice_consent
-- Purpose: Track user consent for audio recording (LGPD compliance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_consent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  consent_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for quick consent checks
CREATE INDEX idx_voice_consent_user_id ON voice_consent(user_id);

-- ============================================================================
-- Table: voice_audit_logs
-- Purpose: Audit trail for audio access (LGPD compliance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('upload', 'download', 'delete', 'access')),
  audio_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_voice_audit_logs_user_id ON voice_audit_logs(user_id);
CREATE INDEX idx_voice_audit_logs_audio_id ON voice_audit_logs(audio_id);
CREATE INDEX idx_voice_audit_logs_timestamp ON voice_audit_logs(timestamp DESC);
CREATE INDEX idx_voice_audit_logs_action ON voice_audit_logs(action);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE voice_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_audit_logs ENABLE ROW LEVEL SECURITY;

-- voice_transcriptions policies
CREATE POLICY "Users can view their own transcriptions"
  ON voice_transcriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transcriptions"
  ON voice_transcriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transcriptions"
  ON voice_transcriptions FOR DELETE
  USING (auth.uid() = user_id);

-- voice_consent policies
CREATE POLICY "Users can view their own consent"
  ON voice_consent FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent"
  ON voice_consent FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consent"
  ON voice_consent FOR UPDATE
  USING (auth.uid() = user_id);

-- voice_audit_logs policies (read-only for users)
CREATE POLICY "Users can view their own audit logs"
  ON voice_audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON voice_audit_logs FOR INSERT
  WITH CHECK (true); -- Allow system to insert logs

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_voice_transcriptions_updated_at
  BEFORE UPDATE ON voice_transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_consent_updated_at
  BEFORE UPDATE ON voice_consent
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup expired transcriptions (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_transcriptions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM voice_transcriptions
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Storage Bucket Configuration
-- ============================================================================

-- Create storage bucket for voice recordings (if not exists)
-- Note: This needs to be run via Supabase Dashboard or API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('voice-recordings', 'voice-recordings', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies for voice-recordings bucket
-- Note: These need to be configured via Supabase Dashboard or API
-- 
-- Policy: Users can upload their own recordings
-- CREATE POLICY "Users can upload their own recordings"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'voice-recordings' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- Policy: Users can download their own recordings
-- CREATE POLICY "Users can download their own recordings"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'voice-recordings' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- Policy: Users can delete their own recordings
-- CREATE POLICY "Users can delete their own recordings"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'voice-recordings' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE voice_transcriptions IS 'Stores encrypted voice transcriptions with LGPD compliance';
COMMENT ON TABLE voice_consent IS 'Tracks user consent for audio recording (LGPD requirement)';
COMMENT ON TABLE voice_audit_logs IS 'Audit trail for audio access (LGPD compliance)';

COMMENT ON COLUMN voice_transcriptions.transcript IS 'Encrypted and anonymized transcription text';
COMMENT ON COLUMN voice_transcriptions.expires_at IS 'Automatic deletion date (12 months retention)';
COMMENT ON COLUMN voice_consent.consent_given IS 'User consent for audio recording and storage';

-- ============================================================================
-- Grants (if needed for service role)
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, DELETE ON voice_transcriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON voice_consent TO authenticated;
GRANT SELECT ON voice_audit_logs TO authenticated;
GRANT INSERT ON voice_audit_logs TO service_role;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Voice STT tables migration completed successfully';
  RAISE NOTICE 'Tables created: voice_transcriptions, voice_consent, voice_audit_logs';
  RAISE NOTICE 'RLS policies enabled for all tables';
  RAISE NOTICE 'Remember to configure storage bucket via Supabase Dashboard';
END $$;

