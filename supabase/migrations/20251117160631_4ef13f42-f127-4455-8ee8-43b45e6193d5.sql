-- Update get_homework_by_share_token RPC to include media fields
-- This fixes Lesson Media section not displaying images/audio in homework

DROP FUNCTION IF EXISTS get_homework_by_share_token(text);

CREATE OR REPLACE FUNCTION get_homework_by_share_token(p_share_token TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  created_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  selected_exercises JSONB,
  selected_image JSONB,
  selected_audio JSONB,
  audio_url TEXT,
  student_name TEXT,
  student_english_level TEXT,
  teacher_first_name TEXT,
  teacher_last_name TEXT,
  teacher_email TEXT,
  source_worksheet_title TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
$$;