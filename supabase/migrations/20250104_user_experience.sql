-- User Experience and AI Intelligence Systems
-- Epic 04: User Experience + Epic 05: AI Intelligence
-- Stories: 04.01-04.05 + 05.01-05.05
-- Created: 2025-01-04

-- ============================================================================
-- Voice Conversations Table (Story 04.01)
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Conversation details
  session_id TEXT NOT NULL,
  conversation_context JSONB,
  
  -- Status
  status TEXT CHECK (status IN ('active', 'completed', 'interrupted')) DEFAULT 'active',
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

CREATE INDEX idx_voice_conversations_user_id ON voice_conversations(user_id);
CREATE INDEX idx_voice_conversations_session_id ON voice_conversations(session_id);

-- ============================================================================
-- User Preferences Table (Story 04.02 + 04.05)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Interface preferences
  preferred_interface TEXT CHECK (preferred_interface IN ('voice', 'visual', 'hybrid')) DEFAULT 'voice',
  theme TEXT CHECK (theme IN ('light', 'dark', 'auto')) DEFAULT 'auto',
  language TEXT DEFAULT 'pt-BR',
  
  -- Accessibility
  enable_screen_reader BOOLEAN DEFAULT false,
  enable_high_contrast BOOLEAN DEFAULT false,
  font_size TEXT CHECK (font_size IN ('small', 'medium', 'large', 'xlarge')) DEFAULT 'medium',
  enable_voice_feedback BOOLEAN DEFAULT true,
  
  -- Notifications
  enable_push_notifications BOOLEAN DEFAULT true,
  enable_email_notifications BOOLEAN DEFAULT true,
  enable_sms_notifications BOOLEAN DEFAULT false,
  
  -- Performance
  enable_animations BOOLEAN DEFAULT true,
  data_saver_mode BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================================================
-- AI Suggestions Table (Story 04.04 + 05.02)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Suggestion details
  suggestion_type TEXT CHECK (suggestion_type IN (
    'payment_reminder',
    'budget_alert',
    'savings_opportunity',
    'bill_optimization',
    'spending_insight',
    'investment_suggestion'
  )),
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Action
  action_type TEXT,
  action_data JSONB,
  
  -- Priority and confidence
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- Status
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')) DEFAULT 'pending',
  
  -- User interaction
  viewed_at TIMESTAMP WITH TIME ZONE,
  acted_at TIMESTAMP WITH TIME ZONE,
  
  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX idx_ai_suggestions_status ON ai_suggestions(status);
CREATE INDEX idx_ai_suggestions_priority ON ai_suggestions(priority);

-- ============================================================================
-- Trust Score History Table (Story 05.01)
-- ============================================================================

CREATE TABLE IF NOT EXISTS trust_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Score details
  score INTEGER CHECK (score >= 0 AND score <= 100),
  previous_score INTEGER,
  
  -- Factors
  factors JSONB, -- Breakdown of score components
  
  -- Reason for change
  change_reason TEXT,
  change_type TEXT CHECK (change_type IN ('increase', 'decrease', 'no_change')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trust_score_history_user_id ON trust_score_history(user_id);
CREATE INDEX idx_trust_score_history_created_at ON trust_score_history(created_at DESC);

-- ============================================================================
-- AI Decision Logs Table (Story 05.02 + 05.03)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Decision details
  decision_type TEXT NOT NULL,
  decision_outcome TEXT NOT NULL,
  
  -- Input data
  input_data JSONB NOT NULL,
  
  -- Model information
  model_version TEXT,
  confidence_score DECIMAL(3,2),
  
  -- Explanation
  explanation TEXT,
  factors JSONB, -- Key factors in decision
  
  -- Human override
  was_overridden BOOLEAN DEFAULT false,
  override_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_decision_logs_user_id ON ai_decision_logs(user_id);
CREATE INDEX idx_ai_decision_logs_decision_type ON ai_decision_logs(decision_type);
CREATE INDEX idx_ai_decision_logs_created_at ON ai_decision_logs(created_at DESC);

-- ============================================================================
-- User Feedback Table (Story 05.04)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feedback details
  feedback_type TEXT CHECK (feedback_type IN (
    'suggestion_feedback',
    'decision_feedback',
    'feature_request',
    'bug_report',
    'general_feedback'
  )),
  
  -- Reference
  reference_id UUID, -- Can reference suggestions, decisions, etc.
  reference_type TEXT,
  
  -- Feedback content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Sentiment analysis
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  
  -- Status
  status TEXT CHECK (status IN ('pending', 'reviewed', 'implemented', 'rejected')) DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_feedback_type ON user_feedback(feedback_type);
CREATE INDEX idx_user_feedback_status ON user_feedback(status);

-- ============================================================================
-- AI Ethics Audit Table (Story 05.05)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_ethics_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Audit details
  audit_type TEXT CHECK (audit_type IN (
    'bias_check',
    'fairness_review',
    'transparency_audit',
    'privacy_compliance',
    'decision_review'
  )),
  
  -- Scope
  scope TEXT NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  
  -- Results
  status TEXT CHECK (status IN ('passed', 'failed', 'needs_review')) DEFAULT 'needs_review',
  findings JSONB,
  recommendations JSONB,
  
  -- Actions taken
  actions_taken TEXT,
  
  -- Auditor
  auditor_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_ai_ethics_audit_audit_type ON ai_ethics_audit(audit_type);
CREATE INDEX idx_ai_ethics_audit_status ON ai_ethics_audit(status);
CREATE INDEX idx_ai_ethics_audit_created_at ON ai_ethics_audit(created_at DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE voice_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decision_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_ethics_audit ENABLE ROW LEVEL SECURITY;

-- Voice Conversations Policies
CREATE POLICY "Users can manage their own conversations"
  ON voice_conversations FOR ALL
  USING (auth.uid() = user_id);

-- User Preferences Policies
CREATE POLICY "Users can manage their own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- AI Suggestions Policies
CREATE POLICY "Users can view and interact with their suggestions"
  ON ai_suggestions FOR ALL
  USING (auth.uid() = user_id);

-- Trust Score History Policies
CREATE POLICY "Users can view their own trust score history"
  ON trust_score_history FOR SELECT
  USING (auth.uid() = user_id);

-- AI Decision Logs Policies
CREATE POLICY "Users can view their own decision logs"
  ON ai_decision_logs FOR SELECT
  USING (auth.uid() = user_id);

-- User Feedback Policies
CREATE POLICY "Users can manage their own feedback"
  ON user_feedback FOR ALL
  USING (auth.uid() = user_id);

-- AI Ethics Audit Policies (Admin only)
CREATE POLICY "Admins can view ethics audits"
  ON ai_ethics_audit FOR SELECT
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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Calculate trust score based on user behavior
CREATE OR REPLACE FUNCTION calculate_trust_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_base_score INTEGER := 50;
  v_payment_success_rate DECIMAL;
  v_days_active INTEGER;
  v_feedback_count INTEGER;
  v_final_score INTEGER;
BEGIN
  -- Payment success rate (0-30 points)
  SELECT 
    COALESCE(
      COUNT(CASE WHEN status = 'executed' THEN 1 END)::DECIMAL / 
      NULLIF(COUNT(*), 0) * 30,
      0
    )
  INTO v_payment_success_rate
  FROM scheduled_payments
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '30 days';
  
  -- Days active (0-10 points)
  SELECT 
    LEAST(EXTRACT(DAY FROM (NOW() - created_at))::INTEGER / 3, 10)
  INTO v_days_active
  FROM auth.users
  WHERE id = p_user_id;
  
  -- Positive feedback (0-10 points)
  SELECT 
    LEAST(COUNT(*), 10)
  INTO v_feedback_count
  FROM user_feedback
  WHERE user_id = p_user_id
    AND rating >= 4;
  
  v_final_score := v_base_score + 
                   v_payment_success_rate::INTEGER + 
                   COALESCE(v_days_active, 0) + 
                   COALESCE(v_feedback_count, 0);
  
  RETURN LEAST(v_final_score, 100);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Views for Monitoring
-- ============================================================================

-- Active AI suggestions
CREATE OR REPLACE VIEW active_ai_suggestions AS
SELECT
  user_id,
  suggestion_type,
  priority,
  COUNT(*) as suggestion_count
FROM ai_suggestions
WHERE status = 'pending'
  AND (expires_at IS NULL OR expires_at > NOW())
GROUP BY user_id, suggestion_type, priority
ORDER BY 
  CASE priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;

-- User engagement metrics
CREATE OR REPLACE VIEW user_engagement_metrics AS
SELECT
  user_id,
  COUNT(DISTINCT DATE(created_at)) as active_days,
  COUNT(*) as total_interactions,
  MAX(created_at) as last_interaction
FROM voice_conversations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE voice_conversations IS 'Voice conversation sessions with context management';
COMMENT ON TABLE user_preferences IS 'User interface and accessibility preferences';
COMMENT ON TABLE ai_suggestions IS 'AI-generated proactive suggestions for users';
COMMENT ON TABLE trust_score_history IS 'Historical trust score tracking';
COMMENT ON TABLE ai_decision_logs IS 'Audit trail for AI decisions with explanations';
COMMENT ON TABLE user_feedback IS 'User feedback for continuous improvement';
COMMENT ON TABLE ai_ethics_audit IS 'AI ethics and governance audit logs';
