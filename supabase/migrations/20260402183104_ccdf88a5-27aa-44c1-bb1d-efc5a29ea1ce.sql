
-- Function to find student by email (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.find_student_by_email(p_teacher_id UUID, p_email TEXT)
RETURNS TABLE(id UUID, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name
  FROM public.students s
  WHERE s.teacher_id = p_teacher_id
    AND lower(s.student_email) = lower(trim(p_email))
    AND s.deleted_at IS NULL
  LIMIT 1;
END;
$$;

-- Add default meeting link column to calendar_settings
ALTER TABLE public.calendar_settings
ADD COLUMN IF NOT EXISTS default_meeting_link TEXT;
