-- Voice Feedback and Metrics Tables
-- Story: 01.03 - Respostas Multimodais
-- Created: 2025-01-04

-- ============================================================================
-- Voice Feedback Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Command information
  command_type TEXT NOT NULL CHECK (command_type IN (
    'check_balance',
    'check_budget',
    'pay_bill',
    'check_income',
    'financial_projection',
    'transfer_money',
    'unknown'
  )),
  command_text TEXT,
  
  -- Feedback
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  
  -- Performance metrics
  response_time_ms INTEGER,
  tts_used BOOLEAN DEFAULT false,
  tts_success BOOLEAN,
  
  -- Accessibility
  accessibility_mode TEXT CHECK (accessibility_mode IN (
    'standard',
    'text_only',
    'high_contrast',
    'large_text',
    'screen_reader'
  )),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_voice_feedback_user_id ON voice_feedback(user_id);
CREATE INDEX idx_voice_feedback_command_type ON voice_feedback(command_type);
CREATE INDEX idx_voice_feedback_rating ON voice_feedback(rating);
CREATE INDEX idx_voice_feedback_created_at ON voice_feedback(created_at DESC);

-- ============================================================================
-- Voice Response Metrics Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_response_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Command information
  command_type TEXT NOT NULL,
  intent_confidence DECIMAL(3, 2),
  
  -- Performance metrics
  nlu_time_ms INTEGER,
  data_fetch_time_ms INTEGER,
  formatting_time_ms INTEGER,
  tts_time_ms INTEGER,
  render_time_ms INTEGER,
  total_time_ms INTEGER,
  
  -- Success indicators
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- TTS information
  tts_provider TEXT CHECK (tts_provider IN ('web-speech', 'openai')),
  tts_fallback_used BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_voice_metrics_user_id ON voice_response_metrics(user_id);
CREATE INDEX idx_voice_metrics_command_type ON voice_response_metrics(command_type);
CREATE INDEX idx_voice_metrics_total_time ON voice_response_metrics(total_time_ms);
CREATE INDEX idx_voice_metrics_created_at ON voice_response_metrics(created_at DESC);

-- ============================================================================
-- User Accessibility Preferences Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_accessibility_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- TTS preferences
  tts_enabled BOOLEAN DEFAULT true,
  tts_provider TEXT DEFAULT 'web-speech',
  tts_rate DECIMAL(2, 1) DEFAULT 1.0 CHECK (tts_rate >= 0.1 AND tts_rate <= 10.0),
  tts_pitch DECIMAL(2, 1) DEFAULT 1.0 CHECK (tts_pitch >= 0.0 AND tts_pitch <= 2.0),
  tts_volume DECIMAL(2, 1) DEFAULT 1.0 CHECK (tts_volume >= 0.0 AND tts_volume <= 1.0),
  
  -- Display preferences
  text_only_mode BOOLEAN DEFAULT false,
  high_contrast_mode BOOLEAN DEFAULT false,
  large_text_mode BOOLEAN DEFAULT false,
  font_size_multiplier DECIMAL(2, 1) DEFAULT 1.0 CHECK (font_size_multiplier >= 0.8 AND font_size_multiplier <= 2.0),
  
  -- Interaction preferences
  auto_play_responses BOOLEAN DEFAULT true,
  show_transcripts BOOLEAN DEFAULT true,
  vibration_feedback BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE voice_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_response_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accessibility_preferences ENABLE ROW LEVEL SECURITY;

-- Voice Feedback Policies
CREATE POLICY "Users can view their own feedback"
  ON voice_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON voice_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON voice_feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- Voice Response Metrics Policies
CREATE POLICY "Users can view their own metrics"
  ON voice_response_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
  ON voice_response_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User Accessibility Preferences Policies
CREATE POLICY "Users can view their own preferences"
  ON user_accessibility_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_accessibility_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_accessibility_preferences FOR UPDATE
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
CREATE TRIGGER update_voice_feedback_updated_at
  BEFORE UPDATE ON voice_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_accessibility_preferences_updated_at
  BEFORE UPDATE ON user_accessibility_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for Analytics
-- ============================================================================

-- Average satisfaction by command type
CREATE OR REPLACE VIEW voice_feedback_summary AS
SELECT
  command_type,
  COUNT(*) as total_feedback,
  AVG(rating) as avg_rating,
  COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_feedback,
  COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_feedback,
  AVG(response_time_ms) as avg_response_time_ms,
  COUNT(CASE WHEN tts_used THEN 1 END) as tts_usage_count
FROM voice_feedback
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY command_type;

-- Performance metrics summary
CREATE OR REPLACE VIEW voice_performance_summary AS
SELECT
  command_type,
  COUNT(*) as total_requests,
  AVG(total_time_ms) as avg_total_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_time_ms) as p95_total_time_ms,
  AVG(nlu_time_ms) as avg_nlu_time_ms,
  AVG(tts_time_ms) as avg_tts_time_ms,
  COUNT(CASE WHEN success THEN 1 END) as success_count,
  COUNT(CASE WHEN NOT success THEN 1 END) as error_count
FROM voice_response_metrics
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY command_type;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE voice_feedback IS 'User feedback and ratings for voice responses';
COMMENT ON TABLE voice_response_metrics IS 'Performance metrics for voice command processing';
COMMENT ON TABLE user_accessibility_preferences IS 'User accessibility and TTS preferences';
COMMENT ON VIEW voice_feedback_summary IS 'Summary of user feedback by command type (last 30 days)';
COMMENT ON VIEW voice_performance_summary IS 'Performance metrics summary by command type (last 30 days)';
