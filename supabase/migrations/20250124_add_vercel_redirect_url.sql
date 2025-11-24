-- Add Vercel production URL to allowed redirect URLs for OAuth
-- This fixes the Google OAuth redirect issue where users were not being redirected back to the app
DO $$
DECLARE
    instance_id uuid := '00000000-0000-0000-0000-000000000000'::uuid;
    current_config jsonb;
    target_config jsonb;
    current_urls text[];
    new_urls text[];
    vercel_url text := 'https://aegiswallet.vercel.app';
BEGIN
    SELECT coalesce(nullif(raw_base_config, '')::jsonb, '{}'::jsonb)
    INTO current_config
    FROM auth.instances
    WHERE id = instance_id
    FOR UPDATE;

    IF current_config IS NULL THEN
        RAISE EXCEPTION 'auth.instances entry % is missing. Create it before running this migration.', instance_id;
    END IF;

    -- Get current redirect URLs array
    current_urls := COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(current_config->'ADDITIONAL_REDIRECT_URLS')),
        ARRAY[]::text[]
    );

    -- Add Vercel URL if not already present
    IF NOT (vercel_url = ANY(current_urls)) THEN
        new_urls := current_urls || vercel_url;

        target_config := jsonb_set(
            current_config,
            '{ADDITIONAL_REDIRECT_URLS}',
            to_jsonb(new_urls),
            true
        );

        UPDATE auth.instances
        SET raw_base_config = target_config::text,
            updated_at = timezone('utc', now())
        WHERE id = instance_id;

        RAISE NOTICE 'Added % to ADDITIONAL_REDIRECT_URLS', vercel_url;
    ELSE
        RAISE NOTICE 'URL % already exists in ADDITIONAL_REDIRECT_URLS', vercel_url;
    END IF;
END $$;

