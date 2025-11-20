-- Create google_calendar_tokens table
CREATE TABLE IF NOT EXISTS public.google_calendar_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL, -- Encrypted
    refresh_token TEXT NOT NULL, -- Encrypted
    expiry_timestamp TIMESTAMPTZ NOT NULL,
    scope TEXT NOT NULL,
    google_user_email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for google_calendar_tokens
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user_id ON public.google_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_expiry ON public.google_calendar_tokens(expiry_timestamp);

-- RLS for google_calendar_tokens
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tokens"
    ON public.google_calendar_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
    ON public.google_calendar_tokens
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
    ON public.google_calendar_tokens
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
    ON public.google_calendar_tokens
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create calendar_sync_mapping table
CREATE TABLE IF NOT EXISTS public.calendar_sync_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    aegis_event_id UUID NOT NULL REFERENCES public.financial_events(id) ON DELETE CASCADE,
    google_event_id TEXT NOT NULL,
    google_calendar_id TEXT DEFAULT 'primary',
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    sync_status TEXT NOT NULL CHECK (sync_status IN ('synced', 'pending', 'error', 'conflict')),
    sync_direction TEXT NOT NULL CHECK (sync_direction IN ('aegis_to_google', 'google_to_aegis', 'bidirectional')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, aegis_event_id),
    UNIQUE(user_id, google_event_id)
);

-- Create indexes for calendar_sync_mapping
CREATE INDEX IF NOT EXISTS idx_calendar_sync_mapping_user_id ON public.calendar_sync_mapping(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_mapping_aegis_event_id ON public.calendar_sync_mapping(aegis_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_mapping_google_event_id ON public.calendar_sync_mapping(google_event_id);

-- RLS for calendar_sync_mapping
ALTER TABLE public.calendar_sync_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync mappings"
    ON public.calendar_sync_mapping
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync mappings"
    ON public.calendar_sync_mapping
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync mappings"
    ON public.calendar_sync_mapping
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync mappings"
    ON public.calendar_sync_mapping
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create calendar_sync_settings table
CREATE TABLE IF NOT EXISTS public.calendar_sync_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    sync_enabled BOOLEAN DEFAULT false,
    sync_direction TEXT CHECK (sync_direction IN ('one_way_to_google', 'one_way_from_google', 'bidirectional')),
    sync_financial_amounts BOOLEAN DEFAULT false,
    sync_categories TEXT[], -- Array of category IDs or names
    last_full_sync_at TIMESTAMPTZ,
    sync_token TEXT, -- Google Calendar sync token for incremental sync
    auto_sync_interval_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for calendar_sync_settings
ALTER TABLE public.calendar_sync_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync settings"
    ON public.calendar_sync_settings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync settings"
    ON public.calendar_sync_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync settings"
    ON public.calendar_sync_settings
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync settings"
    ON public.calendar_sync_settings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create calendar_sync_audit table
CREATE TABLE IF NOT EXISTS public.calendar_sync_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('sync_started', 'sync_completed', 'sync_failed', 'event_created', 'event_updated', 'event_deleted', 'auth_granted', 'auth_revoked')),
    event_id UUID, -- Nullable, as some actions are general
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for calendar_sync_audit
CREATE INDEX IF NOT EXISTS idx_calendar_sync_audit_user_id ON public.calendar_sync_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_audit_created_at ON public.calendar_sync_audit(created_at);

-- RLS for calendar_sync_audit
ALTER TABLE public.calendar_sync_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
    ON public.calendar_sync_audit
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audit logs"
    ON public.calendar_sync_audit
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at_google_calendar_tokens
    BEFORE UPDATE ON public.google_calendar_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_calendar_sync_mapping
    BEFORE UPDATE ON public.calendar_sync_mapping
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_calendar_sync_settings
    BEFORE UPDATE ON public.calendar_sync_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

