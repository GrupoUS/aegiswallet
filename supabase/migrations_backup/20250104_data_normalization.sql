-- Data Normalization and Enrichment
-- Story: 02.03 - Normalização e Enriquecimento de Dados
-- Created: 2025-01-04

-- ============================================================================
-- Normalized Transactions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS normalized_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES bank_connections(id) ON DELETE CASCADE,
  
  -- Original data reference
  original_transaction_id TEXT NOT NULL,
  institution_code TEXT NOT NULL,
  
  -- Normalized transaction data
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  normalized_description TEXT, -- Cleaned description
  
  -- Transaction type (normalized)
  transaction_type TEXT CHECK (transaction_type IN (
    'debit',
    'credit',
    'transfer_in',
    'transfer_out',
    'pix_in',
    'pix_out',
    'ted',
    'doc',
    'boleto',
    'card_purchase',
    'card_refund',
    'fee',
    'interest',
    'other'
  )),
  
  -- Enrichment data
  category TEXT,
  subcategory TEXT,
  merchant_name TEXT,
  merchant_category TEXT,
  is_recurring BOOLEAN DEFAULT false,
  is_internal_transfer BOOLEAN DEFAULT false,
  
  -- Deduplication
  checksum TEXT NOT NULL,
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_of UUID REFERENCES normalized_transactions(id),
  
  -- Metadata
  metadata JSONB,
  enrichment_confidence DECIMAL(3,2), -- 0.00-1.00
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_normalized_transactions_user_id ON normalized_transactions(user_id);
CREATE INDEX idx_normalized_transactions_connection_id ON normalized_transactions(connection_id);
CREATE INDEX idx_normalized_transactions_transaction_date ON normalized_transactions(transaction_date DESC);
CREATE INDEX idx_normalized_transactions_category ON normalized_transactions(category);
CREATE INDEX idx_normalized_transactions_checksum ON normalized_transactions(checksum);
CREATE INDEX idx_normalized_transactions_is_duplicate ON normalized_transactions(is_duplicate);

-- Unique constraint for deduplication
CREATE UNIQUE INDEX idx_normalized_transactions_unique 
  ON normalized_transactions(user_id, checksum) 
  WHERE is_duplicate = false;

-- ============================================================================
-- Merchant Database Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Merchant details
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  
  -- Brazilian specific
  cnpj TEXT,
  business_type TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_merchants_normalized_name ON merchants(normalized_name);
CREATE INDEX idx_merchants_category ON merchants(category);
CREATE UNIQUE INDEX idx_merchants_cnpj ON merchants(cnpj) WHERE cnpj IS NOT NULL;

-- ============================================================================
-- Category Rules Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Rule details
  pattern TEXT NOT NULL,
  pattern_type TEXT CHECK (pattern_type IN ('exact', 'contains', 'regex')),
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Priority and confidence
  priority INTEGER DEFAULT 0,
  confidence DECIMAL(3,2) DEFAULT 0.80,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_category_rules_pattern ON category_rules(pattern);
CREATE INDEX idx_category_rules_category ON category_rules(category);
CREATE INDEX idx_category_rules_is_active ON category_rules(is_active);
CREATE INDEX idx_category_rules_priority ON category_rules(priority DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE normalized_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_rules ENABLE ROW LEVEL SECURITY;

-- Normalized Transactions Policies
CREATE POLICY "Users can view their own transactions"
  ON normalized_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON normalized_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON normalized_transactions FOR UPDATE
  USING (auth.uid() = user_id);

-- Merchants Policies (Read-only for all users)
CREATE POLICY "All users can view merchants"
  ON merchants FOR SELECT
  USING (true);

-- Category Rules Policies (Read-only for all users)
CREATE POLICY "All users can view category rules"
  ON category_rules FOR SELECT
  USING (is_active = true);

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
CREATE TRIGGER update_normalized_transactions_updated_at
  BEFORE UPDATE ON normalized_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_rules_updated_at
  BEFORE UPDATE ON category_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Generate checksum for transaction
CREATE OR REPLACE FUNCTION generate_transaction_checksum(
  p_amount DECIMAL,
  p_date DATE,
  p_description TEXT,
  p_institution_code TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN md5(
    p_amount::TEXT || 
    p_date::TEXT || 
    LOWER(TRIM(p_description)) || 
    p_institution_code
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Normalize description (remove special chars, extra spaces)
CREATE OR REPLACE FUNCTION normalize_description(p_description TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN TRIM(REGEXP_REPLACE(
    REGEXP_REPLACE(
      LOWER(p_description),
      '[^a-z0-9\s]', '', 'g'
    ),
    '\s+', ' ', 'g'
  ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- Views for Analytics
-- ============================================================================

-- Transaction summary by category
CREATE OR REPLACE VIEW transaction_summary_by_category AS
SELECT
  user_id,
  category,
  subcategory,
  COUNT(*) as transaction_count,
  SUM(CASE WHEN transaction_type IN ('debit', 'transfer_out', 'pix_out') THEN amount ELSE 0 END) as total_expenses,
  SUM(CASE WHEN transaction_type IN ('credit', 'transfer_in', 'pix_in') THEN amount ELSE 0 END) as total_income,
  AVG(amount) as avg_amount,
  DATE_TRUNC('month', transaction_date) as month
FROM normalized_transactions
WHERE is_duplicate = false
GROUP BY user_id, category, subcategory, DATE_TRUNC('month', transaction_date)
ORDER BY month DESC, total_expenses DESC;

-- Deduplication statistics
CREATE OR REPLACE VIEW deduplication_stats AS
SELECT
  user_id,
  institution_code,
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN is_duplicate THEN 1 END) as duplicate_count,
  ROUND(
    COUNT(CASE WHEN is_duplicate THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as duplicate_rate_percent
FROM normalized_transactions
GROUP BY user_id, institution_code
ORDER BY duplicate_count DESC;

-- ============================================================================
-- Seed Data: Brazilian Category Rules
-- ============================================================================

INSERT INTO category_rules (pattern, pattern_type, category, subcategory, priority, confidence) VALUES
-- Food & Dining
('ifood', 'contains', 'Alimentação', 'Delivery', 100, 0.95),
('rappi', 'contains', 'Alimentação', 'Delivery', 100, 0.95),
('uber eats', 'contains', 'Alimentação', 'Delivery', 100, 0.95),
('restaurante', 'contains', 'Alimentação', 'Restaurante', 90, 0.90),
('padaria', 'contains', 'Alimentação', 'Padaria', 90, 0.90),
('supermercado', 'contains', 'Alimentação', 'Supermercado', 90, 0.90),
('mercado', 'contains', 'Alimentação', 'Supermercado', 80, 0.85),

-- Transportation
('uber', 'contains', 'Transporte', 'Aplicativo', 100, 0.95),
('99', 'contains', 'Transporte', 'Aplicativo', 100, 0.95),
('posto', 'contains', 'Transporte', 'Combustível', 90, 0.90),
('gasolina', 'contains', 'Transporte', 'Combustível', 90, 0.90),
('estacionamento', 'contains', 'Transporte', 'Estacionamento', 90, 0.90),

-- Utilities
('energia', 'contains', 'Contas', 'Energia', 100, 0.95),
('agua', 'contains', 'Contas', 'Água', 100, 0.95),
('internet', 'contains', 'Contas', 'Internet', 100, 0.95),
('telefone', 'contains', 'Contas', 'Telefone', 100, 0.95),
('celular', 'contains', 'Contas', 'Telefone', 100, 0.95),

-- Entertainment
('netflix', 'contains', 'Entretenimento', 'Streaming', 100, 0.95),
('spotify', 'contains', 'Entretenimento', 'Streaming', 100, 0.95),
('amazon prime', 'contains', 'Entretenimento', 'Streaming', 100, 0.95),
('cinema', 'contains', 'Entretenimento', 'Cinema', 90, 0.90),

-- Health
('farmacia', 'contains', 'Saúde', 'Farmácia', 100, 0.95),
('drogaria', 'contains', 'Saúde', 'Farmácia', 100, 0.95),
('hospital', 'contains', 'Saúde', 'Hospital', 100, 0.95),
('clinica', 'contains', 'Saúde', 'Clínica', 100, 0.95),

-- Shopping
('amazon', 'contains', 'Compras', 'Online', 100, 0.95),
('mercado livre', 'contains', 'Compras', 'Online', 100, 0.95),
('magazine luiza', 'contains', 'Compras', 'Varejo', 90, 0.90),
('casas bahia', 'contains', 'Compras', 'Varejo', 90, 0.90)

ON CONFLICT DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE normalized_transactions IS 'Normalized and enriched banking transactions';
COMMENT ON TABLE merchants IS 'Brazilian merchant database for transaction enrichment';
COMMENT ON TABLE category_rules IS 'Pattern-based rules for automatic categorization';
COMMENT ON VIEW transaction_summary_by_category IS 'Transaction summary by category and month';
COMMENT ON VIEW deduplication_stats IS 'Deduplication statistics by institution';
