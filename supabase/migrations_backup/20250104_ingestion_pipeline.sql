-- Banking Data Ingestion Pipeline
-- Story: 02.02 - Pipeline Ingestão 24/7
-- Created: 2025-01-04

-- ============================================================================
-- Sync Jobs Table (Job Queue)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES bank_connections(id) ON DELETE CASCADE,
  
  -- Job details
  job_type TEXT NOT NULL CHECK (job_type IN (
    'full_sync',
    'incremental_sync',
    'webhook_trigger',
    'reconciliation'
  )),
  
  -- Status tracking
  status TEXT NOT NULL CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed',
    'retrying'
  )) DEFAULT 'pending',
  
  -- Retry management
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  -- Performance tracking
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  processing_time_ms INTEGER,
  
  -- Error tracking
  error_code TEXT,
  error_message TEXT,
  error_stack TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sync_jobs_user_id ON sync_jobs(user_id);
CREATE INDEX idx_sync_jobs_connection_id ON sync_jobs(connection_id);
CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX idx_sync_jobs_next_retry_at ON sync_jobs(next_retry_at);
CREATE INDEX idx_sync_jobs_created_at ON sync_jobs(created_at DESC);

-- ============================================================================
-- Sync Metrics Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES bank_connections(id) ON DELETE CASCADE,
  institution_code TEXT NOT NULL,
  
  -- Metric details
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'sync_duration',
    'sync_success',
    'sync_failure',
    'records_synced',
    'api_latency',
    'queue_wait_time'
  )),
  
  metric_value NUMERIC NOT NULL,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sync_metrics_connection_id ON sync_metrics(connection_id);
CREATE INDEX idx_sync_metrics_institution_code ON sync_metrics(institution_code);
CREATE INDEX idx_sync_metrics_metric_type ON sync_metrics(metric_type);
CREATE INDEX idx_sync_metrics_created_at ON sync_metrics(created_at DESC);

-- ============================================================================
-- Circuit Breaker State Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS circuit_breaker_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_code TEXT NOT NULL UNIQUE,
  
  -- Circuit breaker state
  state TEXT NOT NULL CHECK (state IN (
    'closed',    -- Normal operation
    'open',      -- Failing, blocking requests
    'half_open'  -- Testing if service recovered
  )) DEFAULT 'closed',
  
  -- Failure tracking
  failure_count INTEGER DEFAULT 0,
  failure_threshold INTEGER DEFAULT 5,
  success_count INTEGER DEFAULT 0,
  success_threshold INTEGER DEFAULT 2,
  
  -- Timing
  last_failure_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  half_open_at TIMESTAMP WITH TIME ZONE,
  timeout_duration_ms INTEGER DEFAULT 60000, -- 1 minute
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_circuit_breaker_state_institution_code ON circuit_breaker_state(institution_code);
CREATE INDEX idx_circuit_breaker_state_state ON circuit_breaker_state(state);

-- ============================================================================
-- Reconciliation Reports Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS reconciliation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Report details
  report_date DATE NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'daily',
    'weekly',
    'monthly',
    'on_demand'
  )),
  
  -- Discrepancy tracking
  total_accounts_checked INTEGER DEFAULT 0,
  discrepancies_found INTEGER DEFAULT 0,
  discrepancies_resolved INTEGER DEFAULT 0,
  discrepancies_pending INTEGER DEFAULT 0,
  
  -- Report data
  report_data JSONB,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed'
  )) DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_reconciliation_reports_user_id ON reconciliation_reports(user_id);
CREATE INDEX idx_reconciliation_reports_report_date ON reconciliation_reports(report_date DESC);
CREATE INDEX idx_reconciliation_reports_status ON reconciliation_reports(status);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_breaker_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_reports ENABLE ROW LEVEL SECURITY;

-- Sync Jobs Policies
CREATE POLICY "Users can view their own sync jobs"
  ON sync_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Sync Metrics Policies (Admin only for detailed metrics)
CREATE POLICY "Admins can view all sync metrics"
  ON sync_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Circuit Breaker State Policies (Admin only)
CREATE POLICY "Admins can view circuit breaker state"
  ON circuit_breaker_state FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Reconciliation Reports Policies
CREATE POLICY "Users can view their own reconciliation reports"
  ON reconciliation_reports FOR SELECT
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
CREATE TRIGGER update_sync_jobs_updated_at
  BEFORE UPDATE ON sync_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuit_breaker_state_updated_at
  BEFORE UPDATE ON circuit_breaker_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Process pending sync jobs (called by cron)
CREATE OR REPLACE FUNCTION process_pending_sync_jobs()
RETURNS void AS $$
BEGIN
  -- Update jobs ready for retry
  UPDATE sync_jobs
  SET status = 'pending'
  WHERE status = 'retrying'
    AND next_retry_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Check circuit breaker timeouts
CREATE OR REPLACE FUNCTION check_circuit_breaker_timeouts()
RETURNS void AS $$
BEGIN
  -- Move from open to half_open after timeout
  UPDATE circuit_breaker_state
  SET state = 'half_open',
      half_open_at = NOW()
  WHERE state = 'open'
    AND opened_at + (timeout_duration_ms || ' milliseconds')::INTERVAL <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Cleanup old sync jobs (run daily)
CREATE OR REPLACE FUNCTION cleanup_old_sync_jobs()
RETURNS void AS $$
BEGIN
  DELETE FROM sync_jobs
  WHERE status IN ('completed', 'failed')
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Views for Monitoring
-- ============================================================================

-- Sync success rate by institution (last 24 hours)
CREATE OR REPLACE VIEW sync_success_rate_24h AS
SELECT
  institution_code,
  COUNT(*) as total_syncs,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_syncs,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_syncs,
  ROUND(
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as success_rate_percent,
  AVG(processing_time_ms) as avg_processing_time_ms
FROM sync_jobs sj
JOIN bank_connections bc ON bc.id = sj.connection_id
WHERE sj.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY institution_code
ORDER BY total_syncs DESC;

-- Circuit breaker status
CREATE OR REPLACE VIEW circuit_breaker_status AS
SELECT
  institution_code,
  state,
  failure_count,
  failure_threshold,
  last_failure_at,
  opened_at,
  CASE 
    WHEN state = 'open' THEN 
      EXTRACT(EPOCH FROM (NOW() - opened_at))::INTEGER
    ELSE NULL
  END as seconds_open
FROM circuit_breaker_state
ORDER BY 
  CASE state
    WHEN 'open' THEN 1
    WHEN 'half_open' THEN 2
    WHEN 'closed' THEN 3
  END,
  institution_code;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE sync_jobs IS 'Job queue for banking data synchronization';
COMMENT ON TABLE sync_metrics IS 'Performance metrics for sync operations';
COMMENT ON TABLE circuit_breaker_state IS 'Circuit breaker state per institution';
COMMENT ON TABLE reconciliation_reports IS 'Daily reconciliation reports';
COMMENT ON VIEW sync_success_rate_24h IS 'Sync success rate by institution (last 24h)';
COMMENT ON VIEW circuit_breaker_status IS 'Current circuit breaker status';
