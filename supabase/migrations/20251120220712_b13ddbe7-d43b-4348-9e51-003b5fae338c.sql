-- ================================================
-- Fix updated_at trigger to use pure UTC timestamps
-- ================================================
-- This migration fixes the issue where updated_at was storing UTC+1 instead of pure UTC
-- by removing the timezone conversion in the update_updated_at_column() function

-- Drop and recreate the function to use pure UTC (now() without timezone conversion)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Use now() directly for pure UTC timestamp
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- No need to modify triggers - they automatically use the updated function
-- Triggers using this function:
-- - update_homework_assignments_updated_at (on homework_assignments)
-- - update_students_updated_at (on students)
-- - update_subscriptions_updated_at (on subscriptions)

-- Add comment for documentation
COMMENT ON FUNCTION public.update_updated_at_column() IS 
'Automatically sets updated_at to current UTC timestamp (now()) on row updates. Used by triggers on homework_assignments, students, and subscriptions tables.';