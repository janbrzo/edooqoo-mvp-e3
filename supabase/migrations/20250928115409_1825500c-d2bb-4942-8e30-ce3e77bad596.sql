-- Napraw trigger sync_subscription_to_subscriptions żeby obsługiwał _cancelled plan types
CREATE OR REPLACE FUNCTION public.sync_subscription_to_subscriptions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  sub_data JSONB;
  current_period_start_ts TIMESTAMPTZ;
  current_period_end_ts TIMESTAMPTZ;
  monthly_limit_val INTEGER := 0;
  base_plan_type TEXT;
BEGIN
  -- Pobierz dane z event_data
  sub_data := NEW.event_data;
  
  -- Wyodrębnij bazowy plan type (usuń _cancelled suffix dla monthly_limit calculation)
  base_plan_type := CASE 
    WHEN NEW.new_plan_type LIKE '%_cancelled' THEN REPLACE(NEW.new_plan_type, '_cancelled', '')
    ELSE NEW.new_plan_type
  END;
  
  -- Ustaw monthly_limit na podstawie base plan type
  CASE base_plan_type
    WHEN 'Side-Gig' THEN monthly_limit_val := 15;
    WHEN 'Full-Time' THEN monthly_limit_val := 50;
    WHEN 'Full-Time 30' THEN monthly_limit_val := 30;
    WHEN 'Full-Time 60' THEN monthly_limit_val := 60;
    WHEN 'Full-Time 90' THEN monthly_limit_val := 90;
    WHEN 'Full-Time 120' THEN monthly_limit_val := 120;
    ELSE monthly_limit_val := 0;
  END CASE;
  
  -- NAPRAWIONE: Zabezpieczenie przed NULL datami
  IF (sub_data->>'current_period_start') IS NOT NULL AND (sub_data->>'current_period_start')::bigint > 0 THEN
    current_period_start_ts := to_timestamp((sub_data->>'current_period_start')::bigint);
  ELSE 
    current_period_start_ts := NOW();
  END IF;
  
  IF (sub_data->>'current_period_end') IS NOT NULL AND (sub_data->>'current_period_end')::bigint > 0 THEN
    current_period_end_ts := to_timestamp((sub_data->>'current_period_end')::bigint);
  ELSE
    current_period_end_ts := NOW() + INTERVAL '30 days';
  END IF;
  
  -- Dla subscription.created lub subscription.updated
  IF NEW.event_type IN ('customer.subscription.created', 'customer.subscription.updated') THEN
    -- Determinate proper subscription_status and subscription_type
    DECLARE
      final_subscription_status TEXT;
      final_subscription_type TEXT;
    BEGIN
      -- Handle _cancelled plan types for subscription_status
      IF NEW.new_plan_type LIKE '%_cancelled' THEN
        final_subscription_status := 'active_cancelled';
        final_subscription_type := base_plan_type; -- Store base type without _cancelled
      ELSIF NEW.event_type = 'customer.subscription.updated' AND NEW.old_plan_type LIKE '%_cancelled' AND NOT NEW.new_plan_type LIKE '%_cancelled' THEN
        -- This is a renewal - was cancelled, now active
        final_subscription_status := 'active';
        final_subscription_type := NEW.new_plan_type;
      ELSE
        -- Default logic
        final_subscription_status := CASE WHEN (sub_data->>'cancel_at_period_end')::boolean THEN 'active_cancelled' ELSE 'active' END;
        final_subscription_type := NEW.new_plan_type;
      END IF;

      INSERT INTO public.subscriptions (
        teacher_id,
        email,
        stripe_customer_id,
        stripe_subscription_id,
        subscription_type,
        subscription_status,
        monthly_limit,
        current_period_start,
        current_period_end
      ) 
      VALUES (
        NEW.teacher_id,
        NEW.email,
        sub_data->>'customer_id',
        sub_data->>'subscription_id',
        final_subscription_type,
        final_subscription_status,
        CASE WHEN final_subscription_status = 'active_cancelled' THEN 0 ELSE monthly_limit_val END,
        current_period_start_ts,
        current_period_end_ts
      )
      ON CONFLICT (stripe_subscription_id) 
      DO UPDATE SET
        subscription_type = EXCLUDED.subscription_type,
        subscription_status = EXCLUDED.subscription_status,
        monthly_limit = EXCLUDED.monthly_limit,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = NOW();
    END;
      
  -- NAPRAWIONE: Obsługa subscription.deleted z prawidłowym mapowaniem 'Inactive'
  ELSIF NEW.event_type = 'customer.subscription.deleted' THEN
    UPDATE public.subscriptions 
    SET 
      subscription_status = 'cancelled',
      subscription_type = 'Inactive', -- FIXED: 'Inactive' zamiast 'inactive'
      monthly_limit = 0, -- Zero limit for cancelled subscriptions
      updated_at = NOW()
    WHERE stripe_subscription_id = sub_data->>'subscription_id';
  END IF;
  
  RETURN NEW;
END;
$function$;