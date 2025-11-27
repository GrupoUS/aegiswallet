-- Tabela de confirmações de deleção
CREATE TABLE IF NOT EXISTS delete_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID UNIQUE NOT NULL,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para limpeza de tokens expirados
CREATE INDEX IF NOT EXISTS idx_delete_confirmations_expires
  ON delete_confirmations(expires_at);

-- RLS
ALTER TABLE delete_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own confirmations"
  ON delete_confirmations
  FOR ALL
  USING (user_id = auth.uid());

-- Tabela de audit logs de AI
CREATE TABLE IF NOT EXISTS ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('chat', 'tool_call')),
  tool_name TEXT,
  input_summary TEXT,
  output_summary TEXT,
  tokens_used INTEGER,
  latency_ms INTEGER,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'blocked', 'error')),
  error_message TEXT,
  affected_tables TEXT[],
  affected_record_ids TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para queries de auditoria
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_user_date
  ON ai_audit_logs(user_id, created_at DESC);

-- RLS (admins podem ver tudo, usuários só os próprios)
ALTER TABLE ai_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON ai_audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Função para limpar tokens expirados (executar via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_confirmations()
RETURNS void AS $$
BEGIN
  DELETE FROM delete_confirmations WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
