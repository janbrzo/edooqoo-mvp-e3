-- Fix consume_token to properly decrement available_tokens
-- This ensures tokens are consumed correctly

CREATE OR REPLACE FUNCTION public.consume_token(p_teacher_id uuid, p_worksheet_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_available INTEGER;
  tokens_frozen BOOLEAN;
  monthly_limit INTEGER;
  monthly_used INTEGER;
  total_created INTEGER;
  sub_type TEXT;
  sub_status TEXT;
  teacher_email_var TEXT;
  should_count_monthly BOOLEAN := FALSE;
  
  -- FREE DEMO WEEK dates (UTC+0) - PAST DATES (PROMOTION ENDED)
  free_week_start TIMESTAMP WITH TIME ZONE := '2024-01-01 00:00:00+00'::timestamptz;
  free_week_end TIMESTAMP WITH TIME ZONE := '2024-01-07 23:59:59+00'::timestamptz;
  
  current_time TIMESTAMP WITH TIME ZONE := NOW();
  is_free_week BOOLEAN;
BEGIN
  -- Check if we're in FREE DEMO WEEK
  is_free_week := current_time >= free_week_start AND current_time <= free_week_end;
  
  -- Log the FREE DEMO WEEK check
  RAISE NOTICE 'FREE DEMO WEEK CHECK: current_time=%, start=%, end=%, is_free_week=%', 
    current_time, free_week_start, free_week_end, is_free_week;

  -- Load current profile state + email
  SELECT 
    COALESCE(available_tokens, 0), 
    COALESCE(is_tokens_frozen, FALSE),
    COALESCE(monthly_worksheet_limit, 0),
    COALESCE(monthly_worksheets_used, 0),
    COALESCE(total_worksheets_created, 0),
    subscription_type,
    subscription_status,
    email
  INTO current_available, tokens_frozen, monthly_limit, monthly_used, total_created, sub_type, sub_status, teacher_email_var
  FROM public.profiles 
  WHERE id = p_teacher_id;

  -- Log current state for debugging
  RAISE NOTICE 'Token consumption attempt: user=%, available=%, monthly_limit=%, monthly_used=%, frozen=%', 
    p_teacher_id, current_available, monthly_limit, monthly_used, tokens_frozen;

  -- FREE DEMO WEEK: Skip token consumption, just log and count worksheets
  IF is_free_week THEN
    should_count_monthly := (COALESCE(sub_status, '') IN ('active','active_cancelled'))
                            OR (COALESCE(sub_type, '') <> 'Free Demo')
                            OR (total_created >= 2);

    UPDATE public.profiles 
    SET 
      total_worksheets_created = COALESCE(total_worksheets_created, 0) + 1,
      monthly_worksheets_used = monthly_worksheets_used + CASE WHEN should_count_monthly THEN 1 ELSE 0 END
    WHERE id = p_teacher_id;
    
    INSERT INTO public.token_transactions (teacher_id, teacher_email, transaction_type, amount, description, reference_id)
    VALUES (p_teacher_id, teacher_email_var, 'usage', 0, 'FREE DEMO WEEK usage - no tokens consumed', p_worksheet_id);
    
    RAISE NOTICE 'FREE DEMO WEEK: Worksheet generated without consuming tokens for teacher %', p_teacher_id;
    RETURN TRUE;
  END IF;

  -- Normal operation (outside FREE DEMO WEEK)
  -- Block if tokens are frozen
  IF tokens_frozen = TRUE THEN
    RAISE NOTICE 'Token consumption blocked: tokens are frozen for user %', p_teacher_id;
    RETURN FALSE;
  END IF;

  -- PRIORITY 1: monthly limit
  IF monthly_limit > 0 AND monthly_used < monthly_limit THEN
    UPDATE public.profiles 
    SET 
      monthly_worksheets_used = monthly_worksheets_used + 1,
      total_worksheets_created = COALESCE(total_worksheets_created, 0) + 1,
      total_tokens_consumed = COALESCE(total_tokens_consumed, 0) + 1
    WHERE id = p_teacher_id;

    INSERT INTO public.token_transactions (teacher_id, teacher_email, transaction_type, amount, description, reference_id)
    VALUES (p_teacher_id, teacher_email_var, 'usage', 0, 'Worksheet generation (from monthly limit)', p_worksheet_id);

    RAISE NOTICE 'Token consumed from monthly limit for user %', p_teacher_id;
    RETURN TRUE;
  END IF;

  -- PRIORITY 2: available tokens (purchased/subscription/demo)
  IF current_available > 0 THEN
    should_count_monthly := (COALESCE(sub_status, '') IN ('active','active_cancelled'))
                            OR (COALESCE(sub_type, '') <> 'Free Demo')
                            OR (total_created >= 2);

    -- CRITICAL FIX: Directly decrement available_tokens AND increment consumed
    UPDATE public.profiles 
    SET 
      available_tokens = available_tokens - 1,
      total_tokens_consumed = COALESCE(total_tokens_consumed, 0) + 1,
      total_worksheets_created = COALESCE(total_worksheets_created, 0) + 1,
      monthly_worksheets_used = monthly_worksheets_used + CASE WHEN should_count_monthly THEN 1 ELSE 0 END
    WHERE id = p_teacher_id;
    
    INSERT INTO public.token_transactions (teacher_id, teacher_email, transaction_type, amount, description, reference_id)
    VALUES (p_teacher_id, teacher_email_var, 'usage', -1, 'Worksheet generation (from available tokens)', p_worksheet_id);
    
    RAISE NOTICE 'Token consumed from available tokens for user %', p_teacher_id;
    RETURN TRUE;
  END IF;

  -- No available options
  RAISE NOTICE 'Token consumption failed: no tokens available for user %', p_teacher_id;
  RETURN FALSE;
END;
$function$;