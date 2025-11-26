-- Consolidate RLS policies to minimize redundant evaluations and wrap auth helpers
-- in SELECT statements per Supabase guidance.

-- Helper macro comment:
-- Every table gets:
--   1. A service_role policy for unrestricted management.
--   2. Authenticated policies for the actions the user is allowed to perform with
--      `(SELECT auth.uid())` wrappers to avoid init plan re-evaluations.

-- AUDIT LOGS ------------------------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage audit logs" ON public.audit_logs;
CREATE POLICY "Service role can manage audit logs"
    ON public.audit_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view their own audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert their own audit logs"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- USER CONSENT ----------------------------------------------------------------
ALTER TABLE public.user_consent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage consent records" ON public.user_consent;
CREATE POLICY "Service role can manage consent records"
    ON public.user_consent
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own consent records" ON public.user_consent;
CREATE POLICY "Users can view their own consent records"
    ON public.user_consent
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own consent records" ON public.user_consent;
CREATE POLICY "Users can update their own consent records"
    ON public.user_consent
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- VOICE FEEDBACK --------------------------------------------------------------
ALTER TABLE public.voice_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage feedback" ON public.voice_feedback;
CREATE POLICY "Service role can manage feedback"
    ON public.voice_feedback
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own feedback" ON public.voice_feedback;
CREATE POLICY "Users can view their own feedback"
    ON public.voice_feedback
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.voice_feedback;
CREATE POLICY "Users can insert their own feedback"
    ON public.voice_feedback
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- VOICE RECORDINGS ------------------------------------------------------------
ALTER TABLE public.voice_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage recordings" ON public.voice_recordings;
CREATE POLICY "Service role can manage recordings"
    ON public.voice_recordings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own recordings" ON public.voice_recordings;
CREATE POLICY "Users can view their own recordings"
    ON public.voice_recordings
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- USER ACTIVITY ---------------------------------------------------------------
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage activity" ON public.user_activity;
CREATE POLICY "Service role can manage activity"
    ON public.user_activity
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity;
CREATE POLICY "Users can view their own activity"
    ON public.user_activity
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- LEGAL HOLDS -----------------------------------------------------------------
ALTER TABLE public.legal_holds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage legal holds" ON public.legal_holds;
CREATE POLICY "Service role can manage legal holds"
    ON public.legal_holds
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own legal holds" ON public.legal_holds;
CREATE POLICY "Users can view their own legal holds"
    ON public.legal_holds
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- DATA SUBJECT REQUESTS -------------------------------------------------------
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage requests" ON public.data_subject_requests;
CREATE POLICY "Service role can manage requests"
    ON public.data_subject_requests
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own requests" ON public.data_subject_requests;
CREATE POLICY "Users can view their own requests"
    ON public.data_subject_requests
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own requests" ON public.data_subject_requests;
CREATE POLICY "Users can create their own requests"
    ON public.data_subject_requests
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- BIOMETRIC PATTERNS ----------------------------------------------------------
ALTER TABLE public.biometric_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage patterns" ON public.biometric_patterns;
CREATE POLICY "Service role can manage patterns"
    ON public.biometric_patterns
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own patterns" ON public.biometric_patterns;
CREATE POLICY "Users can view their own patterns"
    ON public.biometric_patterns
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- BANK ACCOUNTS ---------------------------------------------------------------
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can view own bank accounts"
    ON public.bank_accounts
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can create own bank accounts"
    ON public.bank_accounts
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can update own bank accounts"
    ON public.bank_accounts
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can delete own bank accounts"
    ON public.bank_accounts
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role can manage bank accounts" ON public.bank_accounts;
CREATE POLICY "Service role can manage bank accounts"
    ON public.bank_accounts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- FINANCIAL ACCOUNTS ---------------------------------------------------------
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own accounts" ON public.financial_accounts;
CREATE POLICY "Users can view own accounts"
    ON public.financial_accounts
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own accounts" ON public.financial_accounts;
CREATE POLICY "Users can insert own accounts"
    ON public.financial_accounts
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own accounts" ON public.financial_accounts;
CREATE POLICY "Users can update own accounts"
    ON public.financial_accounts
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own accounts" ON public.financial_accounts;
CREATE POLICY "Users can delete own accounts"
    ON public.financial_accounts
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role can manage financial accounts" ON public.financial_accounts;
CREATE POLICY "Service role can manage financial accounts"
    ON public.financial_accounts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- FINANCIAL CATEGORIES --------------------------------------------------------
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own categories" ON public.financial_categories;
CREATE POLICY "Users can view own categories"
    ON public.financial_categories
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own categories" ON public.financial_categories;
CREATE POLICY "Users can insert own categories"
    ON public.financial_categories
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own categories" ON public.financial_categories;
CREATE POLICY "Users can update own categories"
    ON public.financial_categories
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own categories" ON public.financial_categories;
CREATE POLICY "Users can delete own categories"
    ON public.financial_categories
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role can manage financial categories" ON public.financial_categories;
CREATE POLICY "Service role can manage financial categories"
    ON public.financial_categories
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- TRANSACTIONS ----------------------------------------------------------------
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
    ON public.transactions
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
CREATE POLICY "Users can create own transactions"
    ON public.transactions
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions"
    ON public.transactions
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Users can delete own transactions"
    ON public.transactions
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role can manage transactions" ON public.transactions;
CREATE POLICY "Service role can manage transactions"
    ON public.transactions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- GOOGLE CALENDAR TOKENS ------------------------------------------------------
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tokens" ON public.google_calendar_tokens;
CREATE POLICY "Users can view their own tokens"
    ON public.google_calendar_tokens
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.google_calendar_tokens;
CREATE POLICY "Users can insert their own tokens"
    ON public.google_calendar_tokens
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own tokens" ON public.google_calendar_tokens;
CREATE POLICY "Users can update their own tokens"
    ON public.google_calendar_tokens
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own tokens" ON public.google_calendar_tokens;
CREATE POLICY "Users can delete their own tokens"
    ON public.google_calendar_tokens
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role can manage google calendar tokens" ON public.google_calendar_tokens;
CREATE POLICY "Service role can manage google calendar tokens"
    ON public.google_calendar_tokens
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- CALENDAR SYNC MAPPING -------------------------------------------------------
ALTER TABLE public.calendar_sync_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sync mappings" ON public.calendar_sync_mapping;
CREATE POLICY "Users can view their own sync mappings"
    ON public.calendar_sync_mapping
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own sync mappings" ON public.calendar_sync_mapping;
CREATE POLICY "Users can insert their own sync mappings"
    ON public.calendar_sync_mapping
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own sync mappings" ON public.calendar_sync_mapping;
CREATE POLICY "Users can update their own sync mappings"
    ON public.calendar_sync_mapping
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own sync mappings" ON public.calendar_sync_mapping;
CREATE POLICY "Users can delete their own sync mappings"
    ON public.calendar_sync_mapping
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role can manage calendar sync mappings" ON public.calendar_sync_mapping;
CREATE POLICY "Service role can manage calendar sync mappings"
    ON public.calendar_sync_mapping
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- CALENDAR SYNC SETTINGS ------------------------------------------------------
ALTER TABLE public.calendar_sync_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sync settings" ON public.calendar_sync_settings;
CREATE POLICY "Users can view their own sync settings"
    ON public.calendar_sync_settings
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own sync settings" ON public.calendar_sync_settings;
CREATE POLICY "Users can insert their own sync settings"
    ON public.calendar_sync_settings
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own sync settings" ON public.calendar_sync_settings;
CREATE POLICY "Users can update their own sync settings"
    ON public.calendar_sync_settings
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own sync settings" ON public.calendar_sync_settings;
CREATE POLICY "Users can delete their own sync settings"
    ON public.calendar_sync_settings
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role can manage calendar sync settings" ON public.calendar_sync_settings;
CREATE POLICY "Service role can manage calendar sync settings"
    ON public.calendar_sync_settings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- CALENDAR SYNC AUDIT ---------------------------------------------------------
ALTER TABLE public.calendar_sync_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.calendar_sync_audit;
CREATE POLICY "Users can view their own audit logs"
    ON public.calendar_sync_audit
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.calendar_sync_audit;
CREATE POLICY "Users can insert their own audit logs"
    ON public.calendar_sync_audit
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role can manage calendar sync audit" ON public.calendar_sync_audit;
CREATE POLICY "Service role can manage calendar sync audit"
    ON public.calendar_sync_audit
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

