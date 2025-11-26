-- Add Brazilian Financial Event Types for AegisWallet
-- Specialized event types for Brazilian financial system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Brazilian Financial Event Types
INSERT INTO event_types (id, name, description, color, icon, created_at, updated_at) VALUES
-- Boletos e Contas
('boleto-payment', 'Boleto', 'Pagamento de boleto bancário', '#dc2626', 'file-text', NOW(), NOW()),
('utility-bill', 'Conta de Utilidade', 'Água, luz, gás, telefone', '#ea580c', 'zap', NOW(), NOW()),
('rent-payment', 'Aluguel', 'Pagamento de aluguel residencial/comercial', '#7c3aed', 'home', NOW(), NOW()),
('condominium', 'Condomínio', 'Taxa de condomínio', '#8b5cf6', 'building', NOW(), NOW()),
('internet-phone', 'Internet/Telefone', 'Internet, TV a cabo, telefone', '#0ea5e9', 'wifi', NOW(), NOW()),

-- PIX e Transferências
('pix-transfer', 'PIX', 'Transferência PIX instantânea', '#10b981', 'send', NOW(), NOW()),
('ted-transfer', 'TED', 'Transferência TED mesmo dia', '#06b6d4', 'arrow-right-circle', NOW(), NOW()),
('doc-transfer', 'DOC', 'Transferência DOC dia seguinte', '#6366f1', 'arrow-right', NOW(), NOW()),

-- Cartão de Crédito
('credit-card-bill', 'Fatura Cartão', 'Fatura de cartão de crédito', '#f59e0b', 'credit-card', NOW(), NOW()),
('credit-card-payment', 'Pag. Cartão', 'Pagamento de fatura de cartão', '#f97316', 'dollar-sign', NOW(), NOW()),

-- Investimentos
('investment-maturity', 'Vencimento', 'Vencimento de investimento', '#059669', 'trending-up', NOW(), NOW()),
('savings-goal', 'Meta de Poupança', 'Depósito para meta de poupança', '#84cc16', 'piggy-bank', NOW(), NOW()),
('fixed-income', 'Renda Fixa', 'Aplicação em renda fixa', '#16a34a', 'bar-chart', NOW(), NOW()),

-- Impostos
('income-tax', 'Imposto de Renda', 'Pagamento de imposto de renda', '#dc2626', 'file-text', NOW(), NOW()),
('property-tax', 'IPTU/ITBI', 'Imposto territorial/transferência', '#b91c1c', 'home', NOW(), NOW()),
('service-tax', 'ISS/PIS/COFINS', 'Impostos sobre serviços', '#ef4444', 'receipt', NOW(), NOW()),

-- Salário e Recebimentos
('salary', 'Salário', 'Recebimento de salário', '#22c55e', 'briefcase', NOW(), NOW()),
('freelance-payment', 'Freelancer', 'Pagamento de trabalho freelancer', '#14b8a6', 'laptop', NOW(), NOW()),
('dividend-payment', 'Dividendos', 'Recebimento de dividendos', '#0891b2', 'trending-up', NOW(), NOW()),

-- Outros eventos financeiros
('loan-payment', 'Empréstimo', 'Pagamento de parcela de empréstimo', '#a855f7', 'dollar-sign', NOW(), NOW()),
('insurance-payment', 'Seguro', 'Pagamento de seguro', '#ec4899', 'shield', NOW(), NOW()),
('subscription', 'Assinatura', 'Pagamento de assinatura mensal', '#f43f5e', 'repeat', NOW(), NOW()),
('health-plan', 'Plano de Saúde', 'Pagamento de plano de saúde', '#06b6d4', 'heart', NOW(), NOW()),
('education', 'Educação', 'Pagamento de mensalidade escolar', '#3b82f6', 'book-open', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_types_name ON event_types(name);
CREATE INDEX IF NOT EXISTS idx_event_types_category ON event_types(name) WHERE name IN ('Boleto', 'PIX', 'Fatura Cartão', 'Salário');

-- Add comments for documentation
COMMENT ON TABLE event_types IS 'Tipos de eventos financeiros para o sistema brasileiro';
COMMENT ON COLUMN event_types.name IS 'Nome do tipo de evento financeiro';
COMMENT ON COLUMN event_types.description IS 'Descrição detalhada do tipo de evento';
COMMENT ON COLUMN event_types.color IS 'Cor para exibição no calendário';
COMMENT ON COLUMN event_types.icon IS 'Ícone para exibição no calendário';

-- Create default categories for Brazilian financial system
INSERT INTO transaction_categories (id, name, description, color, icon, created_at, updated_at) VALUES
-- Despesas
('housing', 'Moradia', 'Aluguel, condomínio, IPTU', '#7c3aed', 'home', NOW(), NOW()),
('utilities', 'Utilidades', 'Água, luz, gás, internet', '#ea580c', 'zap', NOW(), NOW()),
('food', 'Alimentação', 'Supermercado, restaurantes', '#dc2626', 'utensils', NOW(), NOW()),
('transport', 'Transporte', 'Combustível, transporte público', '#f59e0b', 'car', NOW(), NOW()),
('health', 'Saúde', 'Plano de saúde, medicamentos', '#ec4899', 'heart', NOW(), NOW()),
('education', 'Educação', 'Mensalidades, cursos, livros', '#3b82f6', 'book-open', NOW(), NOW()),
('shopping', 'Compras', 'Roupas, eletrônicos, variedades', '#8b5cf6', 'shopping-bag', NOW(), NOW()),
('entertainment', 'Lazer', 'Cinema, shows, viagens', '#06b6d4', 'film', NOW(), NOW()),
('insurance', 'Seguros', 'Seguros diversos', '#14b8a6', 'shield', NOW(), NOW()),
('debt', 'Dívidas', 'Parcelas, juros, empréstimos', '#ef4444', 'credit-card', NOW(), NOW()),
('taxes', 'Impostos', 'Impostos e taxas governamentais', '#b91c1c', 'file-text', NOW(), NOW()),
('other-expenses', 'Outras Despesas', 'Despesas não categorizadas', '#6b7280', 'more-horizontal', NOW(), NOW()),

-- Receitas
('salary', 'Salário', 'Salário e ordenados', '#22c55e', 'briefcase', NOW(), NOW()),
('freelance', 'Freelancer', 'Trabalhos autônomos', '#14b8a6', 'laptop', NOW(), NOW()),
('investments', 'Investimentos', 'Rendimentos, dividendos', '#059669', 'trending-up', NOW(), NOW()),
('business', 'Negócios', 'Rendas de negócio próprio', '#16a34a', 'briefcase', NOW(), NOW()),
('rental-income', 'Aluguéis', 'Recebimento de aluguéis', '#84cc16', 'home', NOW(), NOW()),
('other-income', 'Outras Receitas', 'Receitas não categorizadas', '#10b981', 'plus-circle', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- Create indexes for transaction categories
CREATE INDEX IF NOT EXISTS idx_transaction_categories_name ON transaction_categories(name);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_type ON transaction_categories(name)
WHERE name IN ('Salário', 'Freelancer', 'Investimentos', 'Moradia', 'Alimentação');

-- Add comments for transaction categories
COMMENT ON TABLE transaction_categories IS 'Categorias de transações para o sistema financeiro brasileiro';
COMMENT ON COLUMN transaction_categories.name IS 'Nome da categoria de transação';
COMMENT ON COLUMN transaction_categories.description IS 'Descrição detalhada da categoria';
COMMENT ON COLUMN transaction_categories.color IS 'Cor para exibição';
COMMENT ON COLUMN transaction_categories.icon IS 'Ícone para exibição';

-- Create view for common Brazilian financial event types with categories
CREATE OR REPLACE VIEW brazilian_financial_events AS
SELECT
    et.id as event_type_id,
    et.name as event_type_name,
    et.description as event_type_description,
    et.color as event_type_color,
    et.icon as event_type_icon,
    CASE
        WHEN et.name IN ('Boleto', 'Conta de Utilidade', 'Aluguel', 'Condomínio', 'Internet/Telefone',
                      'Fatura Cartão', 'Pag. Cartão', 'Empréstimo', 'Seguro', 'Assinatura',
                      'Plano de Saúde', 'Educação', 'Imposto de Renda', 'IPTU/ITBI', 'ISS/PIS/COFINS')
        THEN 'expense'
        WHEN et.name IN ('Salário', 'Freelancer', 'Dividendos', 'Vencimento', 'Meta de Poupança')
        THEN 'income'
        ELSE 'neutral'
    END as financial_nature,
    CASE
        WHEN et.name IN ('PIX', 'TED Transfer', 'DOC Transfer') THEN 'transfer'
        WHEN et.name IN ('Boleto', 'Fatura Cartão', 'Aluguel', 'Condomínio') THEN 'payment'
        WHEN et.name IN ('Salário', 'Freelancer', 'Dividendos') THEN 'receipt'
        WHEN et.name IN ('Vencimento', 'Meta de Poupança', 'Renda Fixa') THEN 'investment'
        ELSE 'general'
    END as event_group
FROM event_types et
WHERE et.name IN (
    'Boleto', 'Conta de Utilidade', 'Aluguel', 'Condomínio', 'Internet/Telefone',
    'PIX Transfer', 'TED Transfer', 'DOC Transfer', 'Fatura Cartão', 'Pag. Cartão',
    'Vencimento', 'Meta de Poupança', 'Renda Fixa', 'Imposto de Renda', 'IPTU/ITBI',
    'ISS/PIS/COFINS', 'Salário', 'Freelancer', 'Dividendos'
);

COMMENT ON VIEW brazilian_financial_events IS 'Visualização dos tipos de eventos financeiros brasileiros mais comuns';

-- Create function to get default reminder schedule for Brazilian event types
CREATE OR REPLACE FUNCTION get_default_reminder_schedule(event_type_name TEXT)
RETURNS INTEGER[] AS $$
DECLARE
    schedule INTEGER[];
BEGIN
    CASE event_type_name
        WHEN 'Boleto' THEN
            schedule := ARRAY[7, 3, 1];  -- 7, 3 e 1 dia antes
        WHEN 'PIX Transfer' THEN
            schedule := ARRAY[2, 1];     -- 2 e 1 dia antes
        WHEN 'Fatura Cartão' THEN
            schedule := ARRAY[5, 3, 1];  -- 5, 3 e 1 dia antes
        WHEN 'Aluguel' THEN
            schedule := ARRAY[15, 7, 3, 1];  -- 15, 7, 3 e 1 dia antes
        WHEN 'Condomínio' THEN
            schedule := ARRAY[10, 5, 1]; -- 10, 5 e 1 dia antes
        WHEN 'Imposto de Renda' THEN
            schedule := ARRAY[60, 30, 15, 7, 3, 1]; -- 60, 30, 15, 7, 3 e 1 dia antes
        WHEN 'Salário' THEN
            schedule := ARRAY[2, 1];     -- 2 e 1 dia antes
        WHEN 'Vencimento' THEN
            schedule := ARRAY[3, 1];     -- 3 e 1 dia antes
        ELSE
            schedule := ARRAY[7, 3, 1];  -- Padrão: 7, 3 e 1 dia antes
    END CASE;

    RETURN schedule;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_default_reminder_schedule(TEXT) IS 'Retorna agenda padrão de lembretes para tipos de eventos financeiros brasileiros';

-- Success notification
DO $$
BEGIN
    RAISE NOTICE 'Brazilian financial event types and categories added successfully!';
    RAISE NOTICE 'Added % event types and % transaction categories',
        (SELECT COUNT(*) FROM event_types WHERE name IN (
            'Boleto', 'Conta de Utilidade', 'Aluguel', 'Condomínio', 'Internet/Telefone',
            'PIX Transfer', 'TED Transfer', 'DOC Transfer', 'Fatura Cartão', 'Pag. Cartão',
            'Vencimento', 'Meta de Poupança', 'Renda Fixa', 'Imposto de Renda', 'IPTU/ITBI',
            'ISS/PIS/COFINS', 'Salário', 'Freelancer', 'Dividendos'
        )),
        (SELECT COUNT(*) FROM transaction_categories WHERE name IN (
            'Moradia', 'Utilidades', 'Alimentação', 'Transporte', 'Saúde', 'Educação',
            'Compras', 'Lazer', 'Seguros', 'Dívidas', 'Impostos', 'Salário', 'Freelancer',
            'Investimentos', 'Negócios', 'Aluguéis'
        ));
END $$;
