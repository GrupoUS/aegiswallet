-- Recreate helper functions with explicit search_path safeguards.

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    INSERT INTO public.users (id, email, full_name, profile_image_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, new_values)
        VALUES (
            NEW.user_id,
            TG_TABLE_NAME || '_created',
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, old_values, new_values)
        VALUES (
            COALESCE(NEW.user_id, OLD.user_id),
            TG_TABLE_NAME || '_updated',
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(OLD),
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, old_values)
        VALUES (
            OLD.user_id,
            TG_TABLE_NAME || '_deleted',
            TG_TABLE_NAME,
            OLD.id,
            row_to_json(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_retention_policies()
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
    expired_recordings RECORD;
    expired_feedback RECORD;
BEGIN
    FOR expired_recordings IN
        SELECT id, user_id
        FROM public.voice_recordings
        WHERE retention_expires_at < timezone('utc', now())
          AND deleted_at IS NULL
    LOOP
        UPDATE public.voice_recordings
        SET deleted_at = timezone('utc', now())
        WHERE id = expired_recordings.id;

        INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
        VALUES (
            expired_recordings.user_id,
            'automatic_data_deletion',
            'voice_recordings',
            expired_recordings.id,
            jsonb_build_object('reason', 'retention_policy_expired')
        );
    END LOOP;

    FOR expired_feedback IN
        UPDATE public.voice_feedback
        SET archived = true
        WHERE created_at < timezone('utc', now()) - interval '2 years'
          AND archived IS NOT TRUE
        RETURNING id, user_id
    LOOP
        INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
        VALUES (
            expired_feedback.user_id,
            'data_archived',
            'voice_feedback',
            expired_feedback.id,
            jsonb_build_object('reason', 'retention_policy_archived')
        );
    END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.schedule_retention_check()
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    PERFORM public.check_retention_policies();
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_financial_summary(user_uuid uuid)
RETURNS TABLE(
    total_balance numeric,
    monthly_income numeric,
    monthly_expenses numeric,
    pending_bills_count integer,
    upcoming_payments_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(
      (
        SELECT SUM(balance)
        FROM public.bank_accounts
        WHERE user_id = user_uuid
      ),
      0
    ) AS total_balance,
    COALESCE(
      (
        SELECT SUM(amount)
        FROM public.transactions
        WHERE user_id = user_uuid
          AND amount > 0
          AND created_at >= date_trunc('month', timezone('utc', CURRENT_DATE))
          AND created_at < date_trunc('month', timezone('utc', CURRENT_DATE)) + INTERVAL '1 month'
      ),
      0
    ) AS monthly_income,
    COALESCE(
      (
        SELECT SUM(ABS(amount))
        FROM public.transactions
        WHERE user_id = user_uuid
          AND amount < 0
          AND created_at >= date_trunc('month', timezone('utc', CURRENT_DATE))
          AND created_at < date_trunc('month', timezone('utc', CURRENT_DATE)) + INTERVAL '1 month'
      ),
      0
    ) AS monthly_expenses,
    COALESCE(
      (
        SELECT COUNT(*)
        FROM public.boletos
        WHERE user_id = user_uuid
          AND status = 'pending'
          AND due_date >= CURRENT_DATE
      ),
      0
    ) AS pending_bills_count,
    COALESCE(
      (
        SELECT COUNT(*)
        FROM public.scheduled_payments
        WHERE user_id = user_uuid
          AND status = 'pending'
          AND due_date >= CURRENT_DATE
          AND due_date <= CURRENT_DATE + INTERVAL '7 days'
      ),
      0
    ) AS upcoming_payments_count;
END;
$function$;

