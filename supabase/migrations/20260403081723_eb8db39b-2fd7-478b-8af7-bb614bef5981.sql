-- SECURITY DEFINER function to get per-student meeting link (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_student_meeting_link(p_teacher_id UUID, p_student_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_link TEXT;
BEGIN
  SELECT default_meeting_link INTO v_link
  FROM calendar_student_settings
  WHERE teacher_id = p_teacher_id AND student_id = p_student_id;
  RETURN v_link;
END;
$$;