-- Napraw trigger sync_subscription_to_subscriptions żeby poprawnie obsługiwał NULL daty
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
BEGIN
  -- Pobierz dane z event_data
  sub_data := NEW.event_data;
  
  -- Ustaw monthly_limit na podstawie plan type
  CASE NEW.new_plan_type
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
    current_period_start_ts := NOW(); -- Fallback do teraz
  END IF;
  
  IF (sub_data->>'current_period_end') IS NOT NULL AND (sub_data->>'current_period_end')::bigint > 0 THEN
    current_period_end_ts := to_timestamp((sub_data->>'current_period_end')::bigint);
  ELSE
    current_period_end_ts := NOW() + INTERVAL '30 days'; -- Fallback do 30 dni
  END IF;
  
  -- Dla subscription.created lub subscription.updated
  IF NEW.event_type IN ('customer.subscription.created', 'customer.subscription.updated') THEN
    -- Upsert do tabeli subscriptions
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
      NEW.new_plan_type,
      CASE WHEN (sub_data->>'cancel_at_period_end')::boolean THEN 'active_cancelled' ELSE 'active' END,
      monthly_limit_val,
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
      
  -- DODANE: Obsługa subscription.deleted
  ELSIF NEW.event_type = 'customer.subscription.deleted' THEN
    UPDATE public.subscriptions 
    SET 
      subscription_status = 'cancelled',
      subscription_type = 'inactive',
      updated_at = NOW()
    WHERE stripe_subscription_id = sub_data->>'subscription_id';
  END IF;
  
  RETURN NEW;
END;
$function$;