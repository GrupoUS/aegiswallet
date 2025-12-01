-- LGPD Compliance Migration for Chat Tables
-- Adds consent tracking, data retention, and audit fields for Brazilian compliance

-- Step 1: Add LGPD compliance tracking to chat_sessions table
ALTER TABLE chat_sessions 
ADD COLUMN lgpd_consent_id text REFERENCES lgpd_consents(id),
ADD COLUMN data_classification text NOT NULL DEFAULT 'personal' CHECK (data_classification IN ('personal', 'sensitive', 'anonymous')),
ADD COLUMN purpose_of_processing text NOT NULL DEFAULT 'financial_assistance',
ADD COLUMN legal_basis text NOT NULL DEFAULT 'consent' CHECK (legal_basis IN ('consent', 'legitimate_interest', 'contractual_necessity', 'legal_obligation', 'vital_interests')),
ADD COLUMN retention_until timestamp with time zone,
ADD COLUMN auto_delete_at timestamp with time zone,
ADD COLUMN is_anonymized boolean default false,
ADD COLUMN anonymized_at timestamp with time zone,
ADD COLUMN access_count integer default 0,
ADD COLUMN last_accessed_at timestamp with time zone;

-- Step 2: Add encryption and PII detection to chat_messages table  
ALTER TABLE chat_messages
ADD COLUMN content_encrypted text,
ADD COLUMN content_hash text, -- SHA-256 hash for integrity verification
ADD COLUMN pii_detected boolean default false,
ADD COLUMN pii_redacted_content text,
ADD COLUMN sensitive_data_level text default 'low' CHECK (sensitive_data_level IN ('low', 'medium', 'high')),
ADD COLUMN retention_until timestamp with time zone,
ADD COLUMN auto_delete_at timestamp with time zone,
ADD COLUMN is_anonymized boolean default false,
ADD COLUMN anonymized_at timestamp with time zone,
ADD COLUMN access_count integer default 0,
ADD COLUMN last_accessed_at timestamp with time zone,
ADD COLUMN processing_purpose text default 'financial_assistance';

-- Step 3: Create indexes for LGPD compliance queries
CREATE INDEX idx_chat_sessions_lgpd_consent ON chat_sessions(lgpd_consent_id);
CREATE INDEX idx_chat_sessions_retention ON chat_sessions(retention_until, auto_delete_at);
CREATE INDEX idx_chat_sessions_user_deletion ON chat_sessions(user_id, is_anonymized);
CREATE INDEX idx_chat_sessions_classification ON chat_sessions(data_classification);
CREATE INDEX idx_chat_sessions_legal_basis ON chat_sessions(legal_basis);

CREATE INDEX idx_chat_messages_retention ON chat_messages(retention_until, auto_delete_at);
CREATE INDEX idx_chat_messages_pii_detection ON chat_messages(pii_detected, sensitive_data_level);
CREATE INDEX idx_chat_messages_user_access ON chat_messages(session_id, access_count);
CREATE INDEX idx_chat_messages_hash ON chat_messages(content_hash);

-- Step 4: Create chat consent tracking table
CREATE TABLE chat_consent_logs (
  id text PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id text REFERENCES chat_sessions(id) ON DELETE SET NULL,
  consent_type text NOT NULL CHECK (consent_type IN ('chat_processing', 'voice_recording', 'ai_training', 'data_analysis')),
  granted boolean NOT NULL,
  consent_version text NOT NULL DEFAULT '1.0',
  consent_text_hash text NOT NULL, -- Hash of consent text for integrity
  ip_address inet,
  user_agent text,
  granted_at timestamp with time zone DEFAULT now(),
  revoked_at timestamp with time zone,
  legal_basis text NOT NULL DEFAULT 'consent',
  purpose_of_processing text NOT NULL,
  data_retention_period_months integer NOT NULL DEFAULT 12,
  automated_decision_making boolean default false,
  international_transfer boolean default false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 5: Create consent logs indexes
CREATE INDEX idx_chat_consent_logs_user ON chat_consent_logs(user_id);
CREATE INDEX idx_chat_consent_logs_session ON chat_consent_logs(session_id);
CREATE INDEX idx_chat_consent_logs_type ON chat_consent_logs(consent_type);
CREATE INDEX idx_chat_consent_logs_granted_at ON chat_consent_logs(granted_at);

-- Step 6: Add triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_consent_logs_updated_at
    BEFORE UPDATE ON chat_consent_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Create data retention policy function
CREATE OR REPLACE FUNCTION set_chat_retention_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Set retention dates based on data classification
    CASE NEW.data_classification
        WHEN 'anonymous' THEN
            NEW.retention_until = now() + interval '6 months';
        WHEN 'personal' THEN
            NEW.retention_until = now() + interval '12 months';
        WHEN 'sensitive' THEN
            NEW.retention_until = now() + interval '9 months';
    END CASE;
    
    NEW.auto_delete_at = NEW.retention_until + interval '30 days';
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Add retention triggers
CREATE TRIGGER set_chat_sessions_retention
    BEFORE INSERT OR UPDATE ON chat_sessions
    FOR EACH ROW
    WHEN (NEW.retention_until IS NULL)
    EXECUTE FUNCTION set_chat_retention_dates();

-- Step 9: Insert chat-specific consent templates
INSERT INTO consent_templates (
    consent_type, 
    title_pt, 
    description_pt, 
    full_text_pt, 
    is_mandatory, 
    legal_basis,
    data_retention_months
) VALUES 
(
    'chat_data_processing',
    'Processamento de Dados de Chat',
    'Permissão para processar suas conversas com assistente de IA',
    'Autorizo o processamento de minhas conversas com o assistente de IA do AegisWallet para fins de análise financeira personalizada e melhoria dos serviços. Entendo que meus dados serão criptografados, armazenados com segurança e poderão ser excluídos a qualquer momento conforme previsto na Lei Geral de Proteção de Dados (LGPD).',
    true,
    'consent',
    12
),
(
    'voice_recording_chat',
    'Gravação de Voz para Chat',
    'Permissão para gravar comandos de voz no assistente',
    'Autorizo a gravação e processamento de minhas interações por voz com o assistente do AegisWallet. Entendo que os dados de voz serão convertidos em texto, processados para fornecer respostas e armazenados de forma criptografada.',
    false,
    'consent',
    6
);

-- Step 10: Update existing sessions with default retention dates
UPDATE chat_sessions 
SET 
    retention_until = created_at + interval '12 months',
    auto_delete_at = created_at + interval '12 months 30 days',
    purpose_of_processing = 'financial_assistance',
    legal_basis = 'consent',
    data_classification = 'personal'
WHERE retention_until IS NULL;

-- Step 11: Create comment documentation
COMMENT ON TABLE chat_sessions IS 'Tabela de sessões de chat com conformidade LGPD';
COMMENT ON TABLE chat_messages IS 'Tabela de mensagens de chat com criptografia e detecção de PII';
COMMENT ON TABLE chat_consent_logs IS 'Logs de consentimento específicos para funcionalidades de chat';

COMMENT ON COLUMN chat_sessions.lgpd_consent_id IS 'Referência ao consentimento LGPD para processamento de dados';
COMMENT ON COLUMN chat_sessions.data_classification IS 'Classificação dos dados: personal, sensitive, anonymous';
COMMENT ON COLUMN chat_sessions.retention_until IS 'Data limite para retenção dos dados conforme política';
COMMENT ON COLUMN chat_sessions.auto_delete_at IS 'Data automática para exclusão/anonimização';

COMMENT ON COLUMN chat_messages.content_encrypted IS 'Conteúdo criptografado da mensagem (AES-256)';
COMMENT ON COLUMN chat_messages.content_hash IS 'Hash SHA-256 para verificação de integridade';
COMMENT ON COLUMN chat_messages.pii_detected IS 'Indica se PII (Informações Pessoalmente Identificáveis) foi detectado';
COMMENT ON COLUMN chat_messages.pii_redacted_content IS 'Conteúdo com PII mascarado/removido';
COMMENT ON COLUMN chat_messages.sensitive_data_level IS 'Nível de sensibilidade: low, medium, high';
