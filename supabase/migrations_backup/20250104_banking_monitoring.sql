-- Banking Connector Monitoring and Observability
-- Story: 02.04 - Monitoramento e Observabilidade de Conectores
-- Created: 2025-01-04

-- ============================================================================
-- Banking Incidents Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS banking_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Incident details
  institution_code TEXT NOT NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'connection_failure',
    'authentication_error',
    'timeout',
    'rate_limit',
    'maintenance',
    'data_inconsistency',
    'circuit_breaker_open',
    'other'
  )),
  
  -- Severity and status
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN (
    'open',
    'investigating',
    'identified',
    'monitoring',
    'resolved',
    'closed'
  )) DEFAULT 'open',
  
  -- Timing
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Impact
  affected_users_count INTEGER DEFAULT 0,
  affected_connections_count INTEGER DEFAULT 0,
  
  -- Details
  title TEXT NOT NULL,
  description TEXT,
  error_message TEXT,
  resolution_notes TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_banking_incidents_institution_code ON banking_incidents(institution_code);
CREATE INDEX idx_banking_incidents_status ON banking_incidents(status);
CREATE INDEX idx_banking_incidents_severity ON banking_incidents(severity);
CREATE INDEX idx_banking_incidents_detected_at ON banking_incidents(detected_at DESC);

-- ============================================================================
-- SLA Tracking Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS banking_sla_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Period tracking
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  institution_code TEXT NOT NULL,
  
  -- Availability metrics
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  
  -- Uptime calculation
  uptime_seconds INTEGER DEFAULT 0,
  downtime_seconds INTEGER DEFAULT 0,
  availability_percent DECIMAL(5,2),
  
  -- Latency metrics
  avg_latency_ms INTEGER,
  p95_latency_ms INTEGER,
  p99_latency_ms INTEGER,
  
  -- Incident tracking
  incidents_count INTEGER DEFAULT 0,
  critical_incidents_count INTEGER DEFAULT 0,
  
  -- SLA compliance
  sla_target_percent DECIMAL(5,2) DEFAULT 99.90,
  sla_met BOOLEAN,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_banking_sla_tracking_institution_code ON banking_sla_tracking(institution_code);
CREATE INDEX idx_banking_sla_tracking_period_start ON banking_sla_tracking(period_start DESC);
CREATE INDEX idx_banking_sla_tracking_sla_met ON banking_sla_tracking(sla_met);

-- ============================================================================
-- Chaos Test Results Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS chaos_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Test details
  test_name TEXT NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN (
    'connection_failure',
    'timeout_simulation',
    'rate_limit_test',
    'circuit_breaker_test',
    'data_corruption',
    'network_partition'
  )),
  
  institution_code TEXT NOT NULL,
  
  -- Test execution
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  -- Results
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'error')),
  expected_behavior TEXT,
  actual_behavior TEXT,
  
  -- Metrics
  recovery_time_seconds INTEGER,
  data_loss_detected BOOLEAN DEFAULT false,
  circuit_breaker_activated BOOLEAN DEFAULT false,
  
  -- Details
  test_config JSONB,
  test_results JSONB,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chaos_test_results_institution_code ON chaos_test_results(institution_code);
CREATE INDEX idx_chaos_test_results_test_type ON chaos_test_results(test_type);
CREATE INDEX idx_chaos_test_results_status ON chaos_test_results(status);
CREATE INDEX idx_chaos_test_results_started_at ON chaos_test_results(started_at DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE banking_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE banking_sla_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE chaos_test_results ENABLE ROW LEVEL SECURITY;

-- Banking Incidents Policies (Admin only)
CREATE POLICY "Admins can view all incidents"
  ON banking_incidents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage incidents"
  ON banking_incidents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- SLA Tracking Policies (Admin only)
CREATE POLICY "Admins can view SLA tracking"
  ON banking_sla_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Chaos Test Results Policies (Admin only)
CREATE POLICY "Admins can view chaos test results"
  ON chaos_test_results FOR SELECT
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

-- Trigger
CREATE TRIGGER update_banking_incidents_updated_at
  BEFORE UPDATE ON banking_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Calculate SLA metrics for period
CREATE OR REPLACE FUNCTION calculate_sla_metrics(
  p_institution_code TEXT,
  p_period_start TIMESTAMP WITH TIME ZONE,
  p_period_end TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(
  total_requests BIGINT,
  successful_requests BIGINT,
  failed_requests BIGINT,
  availability_percent DECIMAL(5,2),
  avg_latency_ms INTEGER,
  p95_latency_ms INTEGER,
  sla_met BOOLEAN
) AS $$
DECLARE
  v_sla_target DECIMAL(5,2) := 99.90;
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_requests,
    COUNT(CASE WHEN sj.status = 'completed' THEN 1 END)::BIGINT as successful_requests,
    COUNT(CASE WHEN sj.status = 'failed' THEN 1 END)::BIGINT as failed_requests,
    ROUND(
      COUNT(CASE WHEN sj.status = 'completed' THEN 1 END)::DECIMAL / 
      NULLIF(COUNT(*), 0) * 100,
      2
    ) as availability_percent,
    AVG(sj.processing_time_ms)::INTEGER as avg_latency_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY sj.processing_time_ms)::INTEGER as p95_latency_ms,
    (COUNT(CASE WHEN sj.status = 'completed' THEN 1 END)::DECIMAL / 
     NULLIF(COUNT(*), 0) * 100) >= v_sla_target as sla_met
  FROM sync_jobs sj
  JOIN bank_connections bc ON bc.id = sj.connection_id
  WHERE bc.institution_code = p_institution_code
    AND sj.created_at >= p_period_start
    AND sj.created_at < p_period_end;
END;
$$ LANGUAGE plpgsql;

-- Auto-detect incidents from metrics
CREATE OR REPLACE FUNCTION detect_incidents()
RETURNS void AS $$
DECLARE
  v_institution RECORD;
  v_error_rate DECIMAL(5,2);
  v_avg_latency INTEGER;
BEGIN
  -- Check each institution for anomalies
  FOR v_institution IN
    SELECT DISTINCT institution_code
    FROM bank_connections
    WHERE status = 'active'
  LOOP
    -- Calculate error rate (last 15 minutes)
    SELECT
      ROUND(
        COUNT(CASE WHEN status = 'failed' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100,
        2
      ),
      AVG(processing_time_ms)::INTEGER
    INTO v_error_rate, v_avg_latency
    FROM sync_jobs sj
    JOIN bank_connections bc ON bc.id = sj.connection_id
    WHERE bc.institution_code = v_institution.institution_code
      AND sj.created_at >= NOW() - INTERVAL '15 minutes';
    
    -- Create incident if error rate > 10%
    IF v_error_rate > 10 THEN
      INSERT INTO banking_incidents (
        institution_code,
        incident_type,
        severity,
        title,
        description
      ) VALUES (
        v_institution.institution_code,
        'connection_failure',
        CASE 
          WHEN v_error_rate > 50 THEN 'critical'
          WHEN v_error_rate > 25 THEN 'high'
          ELSE 'medium'
        END,
        'High error rate detected',
        'Error rate: ' || v_error_rate || '% in last 15 minutes'
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Create incident if latency > 5s
    IF v_avg_latency > 5000 THEN
      INSERT INTO banking_incidents (
        institution_code,
        incident_type,
        severity,
        title,
        description
      ) VALUES (
        v_institution.institution_code,
        'timeout',
        'high',
        'High latency detected',
        'Average latency: ' || v_avg_latency || 'ms in last 15 minutes'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Views for Monitoring
-- ============================================================================

-- Current incidents dashboard
CREATE OR REPLACE VIEW current_incidents AS
SELECT
  id,
  institution_code,
  incident_type,
  severity,
  status,
  title,
  detected_at,
  EXTRACT(EPOCH FROM (NOW() - detected_at))::INTEGER as seconds_open,
  affected_users_count,
  affected_connections_count
FROM banking_incidents
WHERE status NOT IN ('resolved', 'closed')
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  detected_at DESC;

-- SLA compliance by institution
CREATE OR REPLACE VIEW sla_compliance_summary AS
SELECT
  institution_code,
  COUNT(*) as total_periods,
  COUNT(CASE WHEN sla_met THEN 1 END) as periods_met,
  ROUND(
    COUNT(CASE WHEN sla_met THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as compliance_rate_percent,
  AVG(availability_percent) as avg_availability_percent,
  MIN(availability_percent) as min_availability_percent
FROM banking_sla_tracking
WHERE period_start >= NOW() - INTERVAL '30 days'
GROUP BY institution_code
ORDER BY compliance_rate_percent DESC;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE banking_incidents IS 'Incident tracking for banking connector issues';
COMMENT ON TABLE banking_sla_tracking IS 'SLA metrics tracking per institution';
COMMENT ON TABLE chaos_test_results IS 'Results from chaos engineering tests';
COMMENT ON VIEW current_incidents IS 'Currently open incidents dashboard';
COMMENT ON VIEW sla_compliance_summary IS 'SLA compliance summary by institution (last 30 days)';
