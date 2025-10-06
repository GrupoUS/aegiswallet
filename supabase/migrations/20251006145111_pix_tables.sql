-- PIX Tables Migration
-- Create tables for PIX functionality: keys, transactions, and QR codes

-- =====================================================
-- 1. PIX Keys Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pix_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key_type TEXT NOT NULL CHECK (key_type IN ('email', 'cpf', 'cnpj', 'phone', 'random')),
    key_value TEXT NOT NULL,
    label TEXT,
    is_favorite BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, key_value),
    CONSTRAINT valid_key_format CHECK (
        CASE key_type
            WHEN 'email' THEN key_value ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
            WHEN 'cpf' THEN length(regexp_replace(key_value, '[^0-9]', '', 'g')) = 11
            WHEN 'cnpj' THEN length(regexp_replace(key_value, '[^0-9]', '', 'g')) = 14
            WHEN 'phone' THEN length(regexp_replace(key_value, '[^0-9]', '', 'g')) BETWEEN 11 AND 13
            WHEN 'random' THEN key_value ~ '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
            ELSE true
        END
    )
);

-- Index for faster queries
CREATE INDEX idx_pix_keys_user_id ON public.pix_keys(user_id);
CREATE INDEX idx_pix_keys_favorites ON public.pix_keys(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_pix_keys_active ON public.pix_keys(user_id, is_active) WHERE is_active = true;

-- =====================================================
-- 2. PIX Transactions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pix_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sent', 'received', 'scheduled')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    pix_key TEXT NOT NULL,
    pix_key_type TEXT NOT NULL CHECK (pix_key_type IN ('email', 'cpf', 'cnpj', 'phone', 'random')),
    recipient_name TEXT,
    recipient_document TEXT,
    transaction_id TEXT,
    end_to_end_id TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_scheduled_date CHECK (
        (transaction_type = 'scheduled' AND scheduled_date IS NOT NULL AND scheduled_date > NOW()) OR
        (transaction_type != 'scheduled')
    ),
    CONSTRAINT valid_completed_at CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed')
    )
);

-- Indexes for performance
CREATE INDEX idx_pix_transactions_user_id ON public.pix_transactions(user_id);
CREATE INDEX idx_pix_transactions_type ON public.pix_transactions(user_id, transaction_type);
CREATE INDEX idx_pix_transactions_status ON public.pix_transactions(user_id, status);
CREATE INDEX idx_pix_transactions_date ON public.pix_transactions(user_id, created_at DESC);
CREATE INDEX idx_pix_transactions_scheduled ON public.pix_transactions(scheduled_date) WHERE status = 'pending' AND transaction_type = 'scheduled';
CREATE INDEX idx_pix_transactions_search ON public.pix_transactions USING gin(to_tsvector('portuguese', coalesce(description, '') || ' ' || coalesce(recipient_name, '') || ' ' || coalesce(pix_key, '')));

-- =====================================================
-- 3. PIX QR Codes Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pix_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pix_key TEXT NOT NULL,
    amount DECIMAL(15, 2),
    description TEXT,
    qr_code_data TEXT NOT NULL,
    qr_code_image TEXT, -- Base64 or URL to image
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    times_used INTEGER DEFAULT 0,
    max_uses INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_amount CHECK (amount IS NULL OR amount > 0),
    CONSTRAINT valid_expiration CHECK (expires_at IS NULL OR expires_at > NOW()),
    CONSTRAINT valid_max_uses CHECK (max_uses IS NULL OR max_uses > 0)
);

-- Indexes
CREATE INDEX idx_pix_qr_codes_user_id ON public.pix_qr_codes(user_id);
CREATE INDEX idx_pix_qr_codes_active ON public.pix_qr_codes(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_pix_qr_codes_expires ON public.pix_qr_codes(expires_at) WHERE is_active = true AND expires_at IS NOT NULL;

-- =====================================================
-- 4. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE public.pix_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_qr_codes ENABLE ROW LEVEL SECURITY;

-- PIX Keys Policies
CREATE POLICY "Users can view their own PIX keys"
    ON public.pix_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PIX keys"
    ON public.pix_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PIX keys"
    ON public.pix_keys FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PIX keys"
    ON public.pix_keys FOR DELETE
    USING (auth.uid() = user_id);

-- PIX Transactions Policies
CREATE POLICY "Users can view their own PIX transactions"
    ON public.pix_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PIX transactions"
    ON public.pix_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PIX transactions"
    ON public.pix_transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- PIX QR Codes Policies
CREATE POLICY "Users can view their own PIX QR codes"
    ON public.pix_qr_codes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PIX QR codes"
    ON public.pix_qr_codes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PIX QR codes"
    ON public.pix_qr_codes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PIX QR codes"
    ON public.pix_qr_codes FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 5. Triggers for updated_at
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER set_updated_at_pix_keys
    BEFORE UPDATE ON public.pix_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_pix_transactions
    BEFORE UPDATE ON public.pix_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_pix_qr_codes
    BEFORE UPDATE ON public.pix_qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 6. Realtime Publication
-- =====================================================

-- Enable realtime for PIX tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.pix_keys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pix_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pix_qr_codes;

-- =====================================================
-- 7. Helper Functions
-- =====================================================

-- Function to get user's PIX statistics
CREATE OR REPLACE FUNCTION public.get_pix_stats(
    p_user_id UUID,
    p_period TEXT DEFAULT '30d'
)
RETURNS TABLE (
    total_sent DECIMAL,
    total_received DECIMAL,
    transaction_count BIGINT,
    average_transaction DECIMAL,
    largest_transaction DECIMAL
) AS $$
DECLARE
    v_start_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate start date based on period
    v_start_date := CASE p_period
        WHEN '24h' THEN NOW() - INTERVAL '24 hours'
        WHEN '7d' THEN NOW() - INTERVAL '7 days'
        WHEN '30d' THEN NOW() - INTERVAL '30 days'
        WHEN '1y' THEN NOW() - INTERVAL '1 year'
        ELSE NOW() - INTERVAL '30 days'
    END;

    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN transaction_type = 'sent' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_sent,
        COALESCE(SUM(CASE WHEN transaction_type = 'received' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_received,
        COUNT(*) FILTER (WHERE status = 'completed') as transaction_count,
        COALESCE(AVG(amount) FILTER (WHERE status = 'completed'), 0) as average_transaction,
        COALESCE(MAX(amount) FILTER (WHERE status = 'completed'), 0) as largest_transaction
    FROM public.pix_transactions
    WHERE user_id = p_user_id
        AND created_at >= v_start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if QR code is still valid
CREATE OR REPLACE FUNCTION public.is_qr_code_valid(p_qr_code_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_qr_code public.pix_qr_codes;
BEGIN
    SELECT * INTO v_qr_code
    FROM public.pix_qr_codes
    WHERE id = p_qr_code_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Check if active
    IF NOT v_qr_code.is_active THEN
        RETURN false;
    END IF;

    -- Check expiration
    IF v_qr_code.expires_at IS NOT NULL AND v_qr_code.expires_at < NOW() THEN
        -- Auto-deactivate expired QR codes
        UPDATE public.pix_qr_codes
        SET is_active = false
        WHERE id = p_qr_code_id;
        RETURN false;
    END IF;

    -- Check max uses
    IF v_qr_code.max_uses IS NOT NULL AND v_qr_code.times_used >= v_qr_code.max_uses THEN
        -- Auto-deactivate QR codes that reached max uses
        UPDATE public.pix_qr_codes
        SET is_active = false
        WHERE id = p_qr_code_id;
        RETURN false;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. Comments for Documentation
-- =====================================================

COMMENT ON TABLE public.pix_keys IS 'Stores user PIX keys (email, CPF, phone, etc.)';
COMMENT ON TABLE public.pix_transactions IS 'Stores all PIX transactions (sent, received, scheduled)';
COMMENT ON TABLE public.pix_qr_codes IS 'Stores generated PIX QR codes for receiving payments';

COMMENT ON COLUMN public.pix_transactions.end_to_end_id IS 'Unique identifier from Brazilian PIX system';
COMMENT ON COLUMN public.pix_transactions.metadata IS 'Additional transaction metadata in JSON format';
COMMENT ON COLUMN public.pix_qr_codes.qr_code_data IS 'PIX QR code string (BR Code)';
