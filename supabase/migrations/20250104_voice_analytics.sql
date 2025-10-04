-- Voice Analytics and Monitoring Tables
-- Story: 01.05 - Observabilidade e Treinamento Contínuo
-- Created: 2025-01-04

-- ============================================================================
-- Voice Metrics Table (Enhanced)
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  
  -- Command details
  command_type TEXT NOT NULL,
  intent_type TEXT,
  transcript TEXT,
  
  -- Performance metrics
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  processing_time_ms INTEGER,
  stt_time_ms INTEGER,
  nlu_time_ms INTEGER,
  response_time_ms INTEGER,
  
  -- Result tracking
  success BOOLEAN NOT NULL,
  error_type TEXT,
  error_message TEXT,
  
  -- Context
  user_region TEXT,
  device_type TEXT,
  browser TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_voice_metrics_user_id ON voice_metrics(user_id);
CREATE INDEX idx_voice_metrics_session_id ON voice_metrics(session_id);
CREATE INDEX idx_voice_metrics_command_type ON voice_metrics(command_type);
CREATE INDEX idx_voice_metrics_success ON voice_metrics(success);
CREATE INDEX idx_voice_metrics_created_at ON voice_metrics(created_at DESC);
CREATE INDEX idx_voice_metrics_user_region ON voice_metrics(user_region);

-- ============================================================================
-- Voice Alerts Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Alert configuration
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'accuracy_drop',
    'high_latency',
    'high_error_rate',
    'metric_degradation',
    'provider_failure'
  )),
  
  -- Threshold configuration
  metric_name TEXT NOT NULL,
  threshold_value DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Severity and channels
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  notification_channels TEXT[] DEFAULT ARRAY['in_app'],
  
  -- Alert state
  status TEXT NOT NULL CHECK (status IN ('active', 'triggered', 'resolved', 'disabled')) DEFAULT 'active',
  triggered_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Alert details
  current_value DECIMAL(10,2),
  message TEXT,
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_voice_alerts_alert_type ON voice_alerts(alert_type);
CREATE INDEX idx_voice_alerts_status ON voice_alerts(status);
CREATE INDEX idx_voice_alerts_severity ON voice_alerts(severity);
CREATE INDEX idx_voice_alerts_triggered_at ON voice_alerts(triggered_at DESC);

-- ============================================================================
-- Voice Reports Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Report details
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'custom')),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Aggregated metrics
  total_commands INTEGER,
  successful_commands INTEGER,
  failed_commands INTEGER,
  avg_accuracy DECIMAL(5,4),
  avg_latency_ms INTEGER,
  p95_latency_ms INTEGER,
  p99_latency_ms INTEGER,
  avg_satisfaction DECIMAL(3,2),
  nps_score INTEGER,
  
  -- Report content
  report_data JSONB,
  report_html TEXT,
  report_pdf_url TEXT,
  
  -- Distribution
  recipients TEXT[],
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('generating', 'ready', 'sent', 'failed')) DEFAULT 'generating',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_voice_reports_report_type ON voice_reports(report_type);
CREATE INDEX idx_voice_reports_period_start ON voice_reports(period_start DESC);
CREATE INDEX idx_voice_reports_status ON voice_reports(status);
CREATE INDEX idx_voice_reports_created_at ON voice_reports(created_at DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE voice_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_reports ENABLE ROW LEVEL SECURITY;

-- Voice Metrics Policies
CREATE POLICY "Users can view their own metrics"
  ON voice_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
  ON voice_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Voice Alerts Policies (Admin only)
CREATE POLICY "Admins can view all alerts"
  ON voice_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage alerts"
  ON voice_alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Voice Reports Policies (Admin only)
CREATE POLICY "Admins can view all reports"
  ON voice_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- Analytics Views
-- ============================================================================

-- Accuracy by command type (last 7 days)
CREATE OR REPLACE VIEW accuracy_by_command AS
SELECT
  command_type,
  COUNT(*) as total_commands,
  COUNT(CASE WHEN success THEN 1 END) as successful_commands,
  ROUND(
    COUNT(CASE WHEN success THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as accuracy_percent,
  AVG(confidence_score) as avg_confidence
FROM voice_metrics
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY command_type
ORDER BY total_commands DESC;

-- Latency percentiles (last 7 days)
CREATE OR REPLACE VIEW latency_percentiles AS
SELECT
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY processing_time_ms) as p50_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time_ms) as p95_latency_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY processing_time_ms) as p99_latency_ms,
  AVG(processing_time_ms) as avg_latency_ms,
  MAX(processing_time_ms) as max_latency_ms
FROM voice_metrics
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND success = true;

-- User satisfaction trends (last 30 days)
CREATE OR REPLACE VIEW user_satisfaction_trends AS
SELECT
  DATE_TRUNC('day', vf.created_at) as date,
  COUNT(*) as feedback_count,
  AVG(vf.rating) as avg_rating,
  COUNT(CASE WHEN vf.rating >= 4 THEN 1 END) as positive_count,
  COUNT(CASE WHEN vf.rating <= 2 THEN 1 END) as negative_count,
  ROUND(
    (COUNT(CASE WHEN vf.rating >= 4 THEN 1 END)::DECIMAL - 
     COUNT(CASE WHEN vf.rating <= 2 THEN 1 END)::DECIMAL) / 
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as nps_score
FROM voice_feedback vf
WHERE vf.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', vf.created_at)
ORDER BY date DESC;

-- Error rate by type (last 7 days)
CREATE OR REPLACE VIEW error_rate_by_type AS
SELECT
  error_type,
  COUNT(*) as error_count,
  ROUND(
    COUNT(*)::DECIMAL / 
    (SELECT COUNT(*) FROM voice_metrics WHERE created_at >= NOW() - INTERVAL '7 days')::DECIMAL * 100,
    2
  ) as error_rate_percent
FROM voice_metrics
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND success = false
  AND error_type IS NOT NULL
GROUP BY error_type
ORDER BY error_count DESC;

-- Regional performance (last 7 days)
CREATE OR REPLACE VIEW regional_performance AS
SELECT
  user_region,
  COUNT(*) as total_commands,
  COUNT(CASE WHEN success THEN 1 END) as successful_commands,
  ROUND(
    COUNT(CASE WHEN success THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as accuracy_percent,
  AVG(processing_time_ms) as avg_latency_ms,
  AVG(confidence_score) as avg_confidence
FROM voice_metrics
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND user_region IS NOT NULL
GROUP BY user_region
ORDER BY total_commands DESC;

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
CREATE TRIGGER update_voice_alerts_updated_at
  BEFORE UPDATE ON voice_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_reports_updated_at
  BEFORE UPDATE ON voice_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Check alert thresholds (called by cron job)
CREATE OR REPLACE FUNCTION check_alert_thresholds()
RETURNS void AS $$
DECLARE
  alert_record RECORD;
  current_metric_value DECIMAL(10,2);
BEGIN
  -- Loop through active alerts
  FOR alert_record IN
    SELECT * FROM voice_alerts
    WHERE status = 'active'
  LOOP
    -- Calculate current metric value based on alert type
    CASE alert_record.alert_type
      WHEN 'accuracy_drop' THEN
        SELECT ROUND(
          COUNT(CASE WHEN success THEN 1 END)::DECIMAL / 
          NULLIF(COUNT(*), 0) * 100,
          2
        ) INTO current_metric_value
        FROM voice_metrics
        WHERE created_at >= NOW() - (alert_record.duration_minutes || ' minutes')::INTERVAL;
        
      WHEN 'high_latency' THEN
        SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time_ms)
        INTO current_metric_value
        FROM voice_metrics
        WHERE created_at >= NOW() - (alert_record.duration_minutes || ' minutes')::INTERVAL
          AND success = true;
        
      WHEN 'high_error_rate' THEN
        SELECT ROUND(
          COUNT(CASE WHEN NOT success THEN 1 END)::DECIMAL / 
          NULLIF(COUNT(*), 0) * 100,
          2
        ) INTO current_metric_value
        FROM voice_metrics
        WHERE created_at >= NOW() - (alert_record.duration_minutes || ' minutes')::INTERVAL;
    END CASE;
    
    -- Check if threshold is violated
    IF current_metric_value IS NOT NULL THEN
      IF (alert_record.alert_type IN ('accuracy_drop') AND current_metric_value < alert_record.threshold_value) OR
         (alert_record.alert_type IN ('high_latency', 'high_error_rate') AND current_metric_value > alert_record.threshold_value) THEN
        -- Trigger alert
        UPDATE voice_alerts
        SET status = 'triggered',
            triggered_at = NOW(),
            current_value = current_metric_value,
            message = 'Threshold violated: ' || current_metric_value || ' vs ' || alert_record.threshold_value
        WHERE id = alert_record.id;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE voice_metrics IS 'Comprehensive voice command metrics for monitoring and analytics';
COMMENT ON TABLE voice_alerts IS 'Alert configuration and tracking for voice system monitoring';
COMMENT ON TABLE voice_reports IS 'Weekly/monthly performance reports for stakeholders';
COMMENT ON VIEW accuracy_by_command IS 'Accuracy metrics by command type (last 7 days)';
COMMENT ON VIEW latency_percentiles IS 'Latency percentiles for performance monitoring (last 7 days)';
COMMENT ON VIEW user_satisfaction_trends IS 'User satisfaction and NPS trends (last 30 days)';
COMMENT ON VIEW error_rate_by_type IS 'Error rate breakdown by type (last 7 days)';
COMMENT ON VIEW regional_performance IS 'Performance metrics by region (last 7 days)';
