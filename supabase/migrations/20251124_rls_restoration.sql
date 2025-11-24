-- Re-enable RLS on customer-facing tables and recreate the minimum policies.

-- USERS ----------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
CREATE POLICY "Service role can manage users"
    ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- USER_PREFERENCES -----------------------------------------------------------
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage user preferences" ON public.user_preferences;
CREATE POLICY "Service role can manage user preferences"
    ON public.user_preferences
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage own preferences"
    ON public.user_preferences
    FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- VOICE_CONSENT --------------------------------------------------------------
ALTER TABLE public.voice_consent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage voice consent" ON public.voice_consent;
CREATE POLICY "Service role can manage voice consent"
    ON public.voice_consent
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own voice consent" ON public.voice_consent;
CREATE POLICY "Users can view own voice consent"
    ON public.voice_consent
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own voice consent" ON public.voice_consent;
CREATE POLICY "Users can update own voice consent"
    ON public.voice_consent
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own voice consent" ON public.voice_consent;
CREATE POLICY "Users can insert own voice consent"
    ON public.voice_consent
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- VOICE_AUDIT_LOGS -----------------------------------------------------------
ALTER TABLE public.voice_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage voice audit logs" ON public.voice_audit_logs;
CREATE POLICY "Service role can manage voice audit logs"
    ON public.voice_audit_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own voice audit logs" ON public.voice_audit_logs;
CREATE POLICY "Users can view own voice audit logs"
    ON public.voice_audit_logs
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- FINANCIAL_EVENTS -----------------------------------------------------------
ALTER TABLE public.financial_events ENABLE ROW LEVEL SECURITY;

-- Ensure lookups by user_id stay performant.
CREATE INDEX IF NOT EXISTS idx_financial_events_user_id
    ON public.financial_events (user_id);

DROP POLICY IF EXISTS "Service role can manage financial events" ON public.financial_events;
CREATE POLICY "Service role can manage financial events"
    ON public.financial_events
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own financial events" ON public.financial_events;
CREATE POLICY "Users can view own financial events"
    ON public.financial_events
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own financial events" ON public.financial_events;
CREATE POLICY "Users can insert own financial events"
    ON public.financial_events
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own financial events" ON public.financial_events;
CREATE POLICY "Users can update own financial events"
    ON public.financial_events
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own financial events" ON public.financial_events;
CREATE POLICY "Users can delete own financial events"
    ON public.financial_events
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

