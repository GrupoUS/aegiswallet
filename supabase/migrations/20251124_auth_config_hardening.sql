-- Ensure Auth URL configuration and password security flags are enforced via SQL.
DO $$
DECLARE
    instance_id uuid := '00000000-0000-0000-0000-000000000000'::uuid;
    current_config jsonb;
    target_config jsonb;
BEGIN
    SELECT coalesce(nullif(raw_base_config, '')::jsonb, '{}'::jsonb)
    INTO current_config
    FROM auth.instances
    WHERE id = instance_id
    FOR UPDATE;

    IF current_config IS NULL THEN
        RAISE EXCEPTION 'auth.instances entry % is missing. Create it before running this migration.', instance_id;
    END IF;

    target_config := jsonb_set(
        current_config,
        '{SITE_URL}',
        to_jsonb('https://app.aegiswallet.com'::text),
        true
    );

    target_config := jsonb_set(
        target_config,
        '{ADDITIONAL_REDIRECT_URLS}',
        to_jsonb(ARRAY[
            'https://app.aegiswallet.com',
            'https://staging.aegiswallet.com',
            'http://localhost:5173',
            'http://127.0.0.1:5173'
        ]::text[]),
        true
    );

    target_config := jsonb_set(
        target_config,
        '{HIBP_ENABLED}',
        'true'::jsonb,
        true
    );

    UPDATE auth.instances
    SET raw_base_config = target_config::text,
        updated_at = timezone('utc', now())
    WHERE id = instance_id;
END $$;

