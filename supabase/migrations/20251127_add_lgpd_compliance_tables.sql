-- ========================================
-- LGPD Compliance Tables Migration
-- AegisWallet - Brazilian Financial Assistant
-- Created: 2025-11-27
-- ========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- 1. LGPD CONSENT MANAGEMENT (Art. 7-9)
-- ========================================

-- Granular user consent tracking
CREATE TABLE IF NOT EXISTS lgpd_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN (
        'data_processing',       -- General data processing
        'financial_data',        -- Financial data access
        'voice_recording',       -- Voice command storage
        'analytics',             -- Usage analytics
        'marketing',             -- Marketing communications
        'third_party_sharing',   -- Sharing with partners
        'open_banking',          -- Open Banking integration
        'biometric'              -- Biometric data (voice)
    )),
    purpose TEXT NOT NULL,
    legal_basis TEXT NOT NULL CHECK (legal_basis IN (
        'consent',               -- User consent (Art. 7, I)
        'contract',              -- Contract execution (Art. 7, V)
        'legal_obligation',      -- Legal compliance (Art. 7, II)
        'legitimate_interest',   -- Legitimate interest (Art. 7, IX)
        'credit_protection'      -- Credit protection (Art. 7, X)
    )),
    granted BOOLEAN NOT NULL DEFAULT false,
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    consent_version TEXT NOT NULL DEFAULT '1.0',
    consent_text_hash TEXT NOT NULL,
    collection_method TEXT NOT NULL CHECK (collection_method IN (
        'explicit_form',
        'voice_command',
        'terms_acceptance',
        'settings_toggle'
    )),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT unique_user_consent UNIQUE (user_id, consent_type, consent_version)
);

COMMENT ON TABLE lgpd_consents IS 'LGPD consent tracking for Brazilian data protection compliance';

-- Consent templates for consistent collection
CREATE TABLE IF NOT EXISTS consent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_type TEXT NOT NULL,
    version TEXT NOT NULL,
    title_pt TEXT NOT NULL,
    description_pt TEXT NOT NULL,
    full_text_pt TEXT NOT NULL,
    is_mandatory BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT unique_template_version UNIQUE (consent_type, version)
);

COMMENT ON TABLE consent_templates IS 'Templates for consent collection in Portuguese';


-- ========================================
-- 2. DATA SUBJECT RIGHTS (LGPD Art. 18)
-- ========================================

-- Data export requests (Right to Portability - Art. 18, V)
CREATE TABLE IF NOT EXISTS data_export_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN (
        'full_export',
        'financial_only',
        'transactions',
        'voice_commands',
        'specific_period'
    )),
    format TEXT NOT NULL CHECK (format IN ('json', 'csv', 'pdf')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'completed',
        'failed',
        'expired',
        'downloaded'
    )),
    date_from DATE,
    date_to DATE,
    file_path TEXT,
    download_url TEXT,
    download_expires_at TIMESTAMPTZ,
    downloaded_at TIMESTAMPTZ,
    file_size_bytes BIGINT,
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    error_message TEXT,
    requested_via TEXT DEFAULT 'app' CHECK (requested_via IN ('app', 'email', 'support')),
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE data_export_requests IS 'LGPD data portability requests tracking';


-- Data deletion requests (Right to Erasure - Art. 18, VI)
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN (
        'full_deletion',
        'anonymization',
        'partial_deletion',
        'consent_withdrawal'
    )),
    scope JSONB NOT NULL DEFAULT '{}',
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'under_review',
        'approved',
        'processing',
        'completed',
        'rejected',
        'cancelled'
    )),
    rejection_reason TEXT,
    legal_hold BOOLEAN DEFAULT false,
    tables_affected JSONB DEFAULT '[]',
    records_deleted INTEGER DEFAULT 0,
    records_anonymized INTEGER DEFAULT 0,
    verification_code TEXT,
    verified_at TIMESTAMPTZ,
    review_deadline TIMESTAMPTZ,
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id),
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE data_deletion_requests IS 'LGPD right to erasure requests tracking';

-- Data retention policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL UNIQUE,
    retention_period INTERVAL NOT NULL,
    deletion_strategy TEXT NOT NULL CHECK (deletion_strategy IN (
        'hard_delete',
        'soft_delete',
        'anonymize',
        'archive'
    )),
    legal_basis TEXT NOT NULL,
    applies_to_inactive_only BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    last_cleanup_at TIMESTAMPTZ,
    next_cleanup_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE data_retention_policies IS 'Configurable data retention policies per table';


-- ========================================
-- 3. OPEN BANKING / FINANCIAL COMPLIANCE (BACEN)
-- ========================================

-- Open Banking consents (Resolution BCB n° 32)
CREATE TABLE IF NOT EXISTS open_banking_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    consent_id TEXT NOT NULL UNIQUE,
    permissions TEXT[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
        'awaiting_authorization',
        'authorized',
        'active',
        'rejected',
        'revoked',
        'expired'
    )),
    created_at_institution TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    sharing_purpose TEXT NOT NULL,
    data_categories TEXT[] NOT NULL,
    refresh_token_encrypted TEXT,
    access_token_expires_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    sync_error_count INTEGER DEFAULT 0,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE open_banking_consents IS 'Open Banking consent management per BACEN regulations';


-- Transaction limits (BACEN PIX rules)
CREATE TABLE IF NOT EXISTS transaction_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    limit_type TEXT NOT NULL CHECK (limit_type IN (
        'pix_daytime',
        'pix_nighttime',
        'pix_total_daily',
        'ted_daily',
        'boleto_daily',
        'total_daily',
        'total_monthly'
    )),
    daily_limit DECIMAL(15,2) NOT NULL,
    nightly_limit DECIMAL(15,2),
    monthly_limit DECIMAL(15,2),
    per_transaction_limit DECIMAL(15,2),
    current_daily_used DECIMAL(15,2) DEFAULT 0,
    current_monthly_used DECIMAL(15,2) DEFAULT 0,
    last_reset_daily TIMESTAMPTZ DEFAULT now(),
    last_reset_monthly TIMESTAMPTZ DEFAULT now(),
    is_custom BOOLEAN DEFAULT false,
    requires_approval_above DECIMAL(15,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT unique_user_limit_type UNIQUE (user_id, limit_type)
);

COMMENT ON TABLE transaction_limits IS 'BACEN-compliant transaction limits per user';

-- Financial terms acceptance
CREATE TABLE IF NOT EXISTS terms_acceptance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    terms_type TEXT NOT NULL CHECK (terms_type IN (
        'terms_of_service',
        'privacy_policy',
        'pix_terms',
        'open_banking_terms',
        'investment_disclaimer',
        'voice_assistant_terms'
    )),
    version TEXT NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address INET,
    user_agent TEXT,
    document_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT unique_terms_acceptance UNIQUE (user_id, terms_type, version)
);

COMMENT ON TABLE terms_acceptance IS 'Legal terms and conditions acceptance tracking';


-- ========================================
-- 4. COMPLIANCE AUDIT TRAIL
-- ========================================

-- Compliance-specific audit logs
CREATE TABLE IF NOT EXISTS compliance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'consent_granted',
        'consent_revoked',
        'data_export_requested',
        'data_export_downloaded',
        'data_deletion_requested',
        'data_deletion_completed',
        'data_accessed',
        'data_modified',
        'ob_consent_created',
        'ob_consent_revoked',
        'ob_data_synced',
        'ob_token_refreshed',
        'suspicious_activity',
        'limit_exceeded_attempt',
        'authentication_failed',
        'mfa_bypass_attempt',
        'regulatory_report_generated',
        'anpd_request_received',
        'bacen_notification'
    )),
    resource_type TEXT,
    resource_id UUID,
    action TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    geo_location JSONB,
    session_id TEXT,
    request_id TEXT,
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    requires_review BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE compliance_audit_logs IS 'Comprehensive compliance event audit trail';


-- Regulatory reports
CREATE TABLE IF NOT EXISTS regulatory_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type TEXT NOT NULL CHECK (report_type IN (
        'anpd_incident',
        'bacen_suspicious',
        'coaf_report',
        'monthly_operations',
        'quarterly_compliance'
    )),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft',
        'pending_review',
        'approved',
        'submitted',
        'acknowledged'
    )),
    data JSONB NOT NULL DEFAULT '{}',
    submitted_at TIMESTAMPTZ,
    submitted_by UUID REFERENCES auth.users(id),
    external_reference TEXT,
    acknowledgment_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE regulatory_reports IS 'Regulatory compliance reports for ANPD, BACEN, COAF';

-- ========================================
-- 5. RLS POLICIES
-- ========================================

ALTER TABLE lgpd_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_banking_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_reports ENABLE ROW LEVEL SECURITY;


-- User policies for lgpd_consents
CREATE POLICY "Users manage own consents" ON lgpd_consents
    FOR ALL USING (auth.uid() = user_id);

-- Anyone can read consent templates
CREATE POLICY "Anyone can read consent templates" ON consent_templates
    FOR SELECT USING (is_active = true);

-- User policies for data_export_requests
CREATE POLICY "Users manage own export requests" ON data_export_requests
    FOR ALL USING (auth.uid() = user_id);

-- User policies for data_deletion_requests
CREATE POLICY "Users view own deletion requests" ON data_deletion_requests
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can create deletion requests" ON data_deletion_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role policies for data_deletion_requests
CREATE POLICY "Service role manages deletion requests" ON data_deletion_requests
    FOR ALL TO service_role USING (true);

-- User policies for open_banking_consents
CREATE POLICY "Users manage own OB consents" ON open_banking_consents
    FOR ALL USING (auth.uid() = user_id);

-- User policies for transaction_limits
CREATE POLICY "Users view own limits" ON transaction_limits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own limits" ON transaction_limits
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage limits
CREATE POLICY "Service role manages limits" ON transaction_limits
    FOR ALL TO service_role USING (true);


-- User policies for terms_acceptance
CREATE POLICY "Users manage own terms" ON terms_acceptance
    FOR ALL USING (auth.uid() = user_id);

-- User policies for compliance_audit_logs
CREATE POLICY "Users view own compliance logs" ON compliance_audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert compliance logs
CREATE POLICY "Service role inserts compliance logs" ON compliance_audit_logs
    FOR INSERT TO service_role WITH CHECK (true);

-- Retention policies are read-only for users
CREATE POLICY "Users can read retention policies" ON data_retention_policies
    FOR SELECT USING (true);

-- Service role manages retention policies
CREATE POLICY "Service role manages retention policies" ON data_retention_policies
    FOR ALL TO service_role USING (true);

-- Regulatory reports are admin-only (service role)
CREATE POLICY "Service role manages regulatory reports" ON regulatory_reports
    FOR ALL TO service_role USING (true);

-- ========================================
-- 6. INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX idx_lgpd_consents_user ON lgpd_consents(user_id);
CREATE INDEX idx_lgpd_consents_type ON lgpd_consents(consent_type, granted);
CREATE INDEX idx_lgpd_consents_active ON lgpd_consents(user_id, granted) WHERE granted = true AND revoked_at IS NULL;

CREATE INDEX idx_data_export_status ON data_export_requests(user_id, status);
CREATE INDEX idx_data_export_pending ON data_export_requests(status, created_at) WHERE status = 'pending';

CREATE INDEX idx_data_deletion_status ON data_deletion_requests(status, review_deadline);
CREATE INDEX idx_data_deletion_user ON data_deletion_requests(user_id, status);

CREATE INDEX idx_ob_consents_user ON open_banking_consents(user_id, status);
CREATE INDEX idx_ob_consents_expiry ON open_banking_consents(expires_at) WHERE status = 'active';

CREATE INDEX idx_tx_limits_user ON transaction_limits(user_id, limit_type);
CREATE INDEX idx_tx_limits_reset ON transaction_limits(last_reset_daily) WHERE is_active = true;

CREATE INDEX idx_terms_user ON terms_acceptance(user_id, terms_type);

CREATE INDEX idx_compliance_logs_user ON compliance_audit_logs(user_id, created_at DESC);
CREATE INDEX idx_compliance_logs_event ON compliance_audit_logs(event_type, created_at DESC);
CREATE INDEX idx_compliance_logs_review ON compliance_audit_logs(requires_review) WHERE requires_review = true;

CREATE INDEX idx_regulatory_reports_period ON regulatory_reports(report_type, period_start, period_end);
CREATE INDEX idx_regulatory_reports_status ON regulatory_reports(status) WHERE status != 'acknowledged';


-- ========================================
-- 7. COMPLIANCE FUNCTIONS
-- ========================================

-- Function to check if user has required consents
CREATE OR REPLACE FUNCTION check_required_consents(p_user_id UUID, p_required_consents TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
    v_missing INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_missing
    FROM unnest(p_required_consents) AS required_consent
    WHERE NOT EXISTS (
        SELECT 1 FROM lgpd_consents
        WHERE user_id = p_user_id
        AND consent_type = required_consent
        AND granted = true
        AND (expires_at IS NULL OR expires_at > now())
        AND revoked_at IS NULL
    );
    
    RETURN v_missing = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_required_consents IS 'Check if user has all required LGPD consents';

-- Function to reset daily transaction limits
CREATE OR REPLACE FUNCTION reset_daily_limits()
RETURNS INTEGER AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    UPDATE transaction_limits
    SET current_daily_used = 0,
        last_reset_daily = now(),
        updated_at = now()
    WHERE last_reset_daily < CURRENT_DATE
    AND is_active = true;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reset_daily_limits IS 'Reset daily transaction limit counters';

-- Function to reset monthly transaction limits
CREATE OR REPLACE FUNCTION reset_monthly_limits()
RETURNS INTEGER AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    UPDATE transaction_limits
    SET current_monthly_used = 0,
        last_reset_monthly = now(),
        updated_at = now()
    WHERE date_trunc('month', last_reset_monthly) < date_trunc('month', CURRENT_DATE)
    AND is_active = true;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reset_monthly_limits IS 'Reset monthly transaction limit counters';


-- Function to log compliance events
CREATE OR REPLACE FUNCTION log_compliance_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_resource_type TEXT,
    p_resource_id UUID,
    p_action TEXT,
    p_context JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO compliance_audit_logs (
        user_id, event_type, resource_type, resource_id, action, context
    ) VALUES (
        p_user_id, p_event_type, p_resource_type, p_resource_id, p_action, p_context
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_compliance_event IS 'Log a compliance event to the audit trail';

-- Function to check transaction limit
CREATE OR REPLACE FUNCTION check_transaction_limit(
    p_user_id UUID,
    p_limit_type TEXT,
    p_amount DECIMAL(15,2)
)
RETURNS JSONB AS $$
DECLARE
    v_limit RECORD;
    v_result JSONB;
BEGIN
    SELECT * INTO v_limit
    FROM transaction_limits
    WHERE user_id = p_user_id
    AND limit_type = p_limit_type
    AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'reason', 'No limit configured'
        );
    END IF;
    
    -- Check per-transaction limit
    IF v_limit.per_transaction_limit IS NOT NULL AND p_amount > v_limit.per_transaction_limit THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'Exceeds per-transaction limit',
            'limit', v_limit.per_transaction_limit,
            'requested', p_amount
        );
    END IF;
    
    -- Check daily limit
    IF v_limit.daily_limit IS NOT NULL AND (v_limit.current_daily_used + p_amount) > v_limit.daily_limit THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'Exceeds daily limit',
            'limit', v_limit.daily_limit,
            'used', v_limit.current_daily_used,
            'requested', p_amount,
            'remaining', v_limit.daily_limit - v_limit.current_daily_used
        );
    END IF;
    
    -- Check requires approval
    IF v_limit.requires_approval_above IS NOT NULL AND p_amount > v_limit.requires_approval_above THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'requires_approval', true,
            'reason', 'Amount requires additional approval',
            'approval_threshold', v_limit.requires_approval_above
        );
    END IF;
    
    RETURN jsonb_build_object(
        'allowed', true,
        'remaining_daily', v_limit.daily_limit - v_limit.current_daily_used - p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_transaction_limit IS 'Check if a transaction is within user limits';


-- Function to update transaction limit usage
CREATE OR REPLACE FUNCTION update_limit_usage(
    p_user_id UUID,
    p_limit_type TEXT,
    p_amount DECIMAL(15,2)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE transaction_limits
    SET current_daily_used = current_daily_used + p_amount,
        current_monthly_used = current_monthly_used + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id
    AND limit_type = p_limit_type
    AND is_active = true;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_limit_usage IS 'Update transaction limit usage after a transaction';

-- Trigger for consent changes audit
CREATE OR REPLACE FUNCTION audit_consent_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.granted = true THEN
        PERFORM log_compliance_event(
            NEW.user_id,
            'consent_granted',
            'lgpd_consents',
            NEW.id,
            'User granted ' || NEW.consent_type || ' consent',
            jsonb_build_object('consent_type', NEW.consent_type, 'legal_basis', NEW.legal_basis)
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.granted = true AND NEW.revoked_at IS NOT NULL THEN
        PERFORM log_compliance_event(
            NEW.user_id,
            'consent_revoked',
            'lgpd_consents',
            NEW.id,
            'User revoked ' || NEW.consent_type || ' consent',
            jsonb_build_object('consent_type', NEW.consent_type)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_consent_changes
AFTER INSERT OR UPDATE ON lgpd_consents
FOR EACH ROW EXECUTE FUNCTION audit_consent_changes();

-- Trigger for updated_at columns
CREATE TRIGGER update_lgpd_consents_updated_at
    BEFORE UPDATE ON lgpd_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consent_templates_updated_at
    BEFORE UPDATE ON consent_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_export_requests_updated_at
    BEFORE UPDATE ON data_export_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_deletion_requests_updated_at
    BEFORE UPDATE ON data_deletion_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at
    BEFORE UPDATE ON data_retention_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_open_banking_consents_updated_at
    BEFORE UPDATE ON open_banking_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_limits_updated_at
    BEFORE UPDATE ON transaction_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regulatory_reports_updated_at
    BEFORE UPDATE ON regulatory_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ========================================
-- 8. SEED DATA
-- ========================================

-- Insert default consent templates (Portuguese)
INSERT INTO consent_templates (consent_type, version, title_pt, description_pt, full_text_pt, is_mandatory, is_active) VALUES
('data_processing', '1.0', 
 'Processamento de Dados Pessoais',
 'Autorizo o processamento dos meus dados pessoais para funcionamento do serviço.',
 'Nos termos da Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), autorizo o AegisWallet a coletar, armazenar e processar meus dados pessoais necessários para a prestação dos serviços de gestão financeira. Os dados serão tratados com segurança e confidencialidade, sendo utilizados exclusivamente para as finalidades descritas na Política de Privacidade.',
 true, true),

('financial_data', '1.0',
 'Acesso a Dados Financeiros',
 'Autorizo o acesso aos meus dados financeiros para sincronização bancária.',
 'Autorizo o AegisWallet a acessar, coletar e processar informações sobre minhas contas bancárias, transações, saldos e movimentações financeiras através da integração Open Banking, conforme regulamentação do Banco Central do Brasil. Estes dados serão utilizados exclusivamente para fornecer insights financeiros personalizados e automatizar a gestão das minhas finanças.',
 true, true),

('voice_recording', '1.0',
 'Gravação de Comandos de Voz',
 'Autorizo o armazenamento temporário de comandos de voz para processamento.',
 'Autorizo o AegisWallet a capturar e processar meus comandos de voz para execução de operações financeiras. As gravações de áudio serão armazenadas temporariamente (máximo 30 dias) apenas para fins de processamento e melhoria do serviço, sendo posteriormente excluídas automaticamente. Nenhum dado biométrico de voz será utilizado para identificação pessoal.',
 false, true),

('analytics', '1.0',
 'Análise de Uso',
 'Autorizo a coleta de dados anônimos de uso para melhoria do serviço.',
 'Autorizo o AegisWallet a coletar dados anonimizados sobre meu padrão de uso do aplicativo, incluindo funcionalidades acessadas, frequência de uso e interações. Estes dados serão utilizados exclusivamente para análises estatísticas e melhoria contínua do serviço, não sendo possível a identificação individual do usuário.',
 false, true),

('open_banking', '1.0',
 'Integração Open Banking',
 'Autorizo a conexão com minhas contas bancárias via Open Banking.',
 'Em conformidade com a Resolução Conjunta nº 1/2020 do Banco Central do Brasil, autorizo o AegisWallet a conectar-se às minhas contas bancárias através do ecossistema Open Banking Brasil. Esta autorização permite o compartilhamento de dados cadastrais, transacionais e de saldos entre as instituições participantes, sempre respeitando meus direitos como titular dos dados.',
 false, true),

('biometric', '1.0',
 'Dados Biométricos de Voz',
 'Autorizo o uso de reconhecimento de voz para autenticação.',
 'Autorizo o AegisWallet a coletar e processar características biométricas da minha voz para fins de autenticação e confirmação de operações financeiras. O padrão biométrico será armazenado de forma criptografada e utilizado exclusivamente para verificação de identidade, podendo ser revogado a qualquer momento através das configurações do aplicativo.',
 false, true)
ON CONFLICT (consent_type, version) DO NOTHING;


-- Insert default data retention policies
INSERT INTO data_retention_policies (table_name, retention_period, deletion_strategy, legal_basis, applies_to_inactive_only, is_active) VALUES
('voice_commands', '90 days', 'hard_delete', 'LGPD Art. 16 - Dados devem ser eliminados após atingir finalidade', true, true),
('audit_logs', '5 years', 'archive', 'Resolução BCB - Obrigação de manter registros de auditoria', false, true),
('transactions', '10 years', 'anonymize', 'CTN Art. 173 - Prazo decadencial tributário', false, true),
('error_logs', '30 days', 'hard_delete', 'Sem obrigação legal de retenção', true, true),
('notifications', '1 year', 'hard_delete', 'Sem obrigação legal de retenção', true, true),
('pix_transactions', '5 years', 'anonymize', 'Resolução BCB nº 1 - Registros de transações PIX', false, true),
('bank_sync_logs', '1 year', 'hard_delete', 'Logs operacionais sem obrigação legal', true, true),
('lgpd_consents', '2 years', 'archive', 'LGPD Art. 8 - Comprovação de consentimento', false, true),
('compliance_audit_logs', '10 years', 'archive', 'LGPD Art. 37 - Registro das operações de tratamento', false, true)
ON CONFLICT (table_name) DO NOTHING;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

