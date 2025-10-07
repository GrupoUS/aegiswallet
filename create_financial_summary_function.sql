-- Execute this SQL in the Supabase SQL Editor to create the function
-- This function returns a financial summary for a user within a specified period

CREATE OR REPLACE FUNCTION get_financial_summary(p_user_id UUID, p_period_start DATE, p_period_end DATE)
RETURNS JSONB AS $$
DECLARE
    v_summary JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_income', COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
        'total_expenses', COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0),
        'net_balance', COALESCE(SUM(amount), 0),
        'transaction_count', COUNT(*),
        'account_balance', COALESCE((SELECT SUM(balance) FROM bank_accounts WHERE user_id = p_user_id AND is_active = true), 0),
        'pending_schedules', COALESCE((SELECT COUNT(*) FROM transaction_schedules WHERE user_id = p_user_id AND scheduled_date >= CURRENT_DATE AND executed = false), 0),
        'upcoming_events', COALESCE((SELECT COUNT(*) FROM financial_events WHERE user_id = p_user_id AND event_date BETWEEN CURRENT_DATE AND p_period_end AND is_completed = false), 0)
    ) INTO v_summary
    FROM transactions
    WHERE user_id = p_user_id 
    AND transaction_date BETWEEN p_period_start AND p_period_end;
    
    RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;