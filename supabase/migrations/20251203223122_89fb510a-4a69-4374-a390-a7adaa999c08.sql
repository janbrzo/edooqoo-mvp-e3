-- Update get_homework_by_share_token to increment view_count
CREATE OR REPLACE FUNCTION public.get_homework_by_share_token(p_share_token text)
 RETURNS TABLE(id uuid, title text, created_at timestamp with time zone, deadline timestamp with time zone, selected_exercises jsonb, selected_image jsonb, selected_audio jsonb, audio_url text, student_name text, student_english_level text, teacher_first_name text, teacher_last_name text, teacher_email text, source_worksheet_title text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- First, increment view_count and set viewed_at
  UPDATE public.homework_assignments ha
  SET 
    view_count = COALESCE(ha.view_count, 0) + 1,
    viewed_at = COALESCE(ha.viewed_at, NOW())
  WHERE ha.share_token = p_share_token
    AND (ha.share_expires_at IS NULL OR ha.share_expires_at > NOW());

  -- Then return the data
  RETURN QUERY
  SELECT 
    ha.id,
    ha.title,
    ha.created_at,
    ha.deadline,
    ha.selected_exercises,
    w.selected_image,
    w.selected_audio,
    w.audio_url,
    s.name as student_name,
    s.english_level as student_english_level,
    p.first_name as teacher_first_name,
    p.last_name as teacher_last_name,
    p.email as teacher_email,
    w.title as source_worksheet_title
  FROM homework_assignments ha
  LEFT JOIN students s ON ha.student_id = s.id
  LEFT JOIN profiles p ON ha.teacher_id = p.id
  LEFT JOIN worksheets w ON ha.source_worksheet_id = w.id
  WHERE ha.share_token = p_share_token
    AND (ha.share_expires_at IS NULL OR ha.share_expires_at > NOW());
END;
$function$;

-- Add reviewed_at and reviewed_by columns to homework_assignments for teacher review feature
ALTER TABLE public.homework_assignments 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reviewed_by UUID DEFAULT NULL;