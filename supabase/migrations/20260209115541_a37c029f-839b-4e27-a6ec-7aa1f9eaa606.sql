-- Drop and recreate get_worksheet_live_answers to return item_evaluations and mastery
DROP FUNCTION IF EXISTS public.get_worksheet_live_answers(uuid);

CREATE FUNCTION public.get_worksheet_live_answers(p_worksheet_id uuid)
RETURNS TABLE(
  id uuid,
  student_email text,
  exercise_index integer,
  exercise_type text,
  answers jsonb,
  last_saved_at timestamptz,
  item_evaluations jsonb,
  mastery integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wsa.id,
    wsa.student_email,
    wsa.exercise_index,
    wsa.exercise_type,
    wsa.answers,
    wsa.last_saved_at,
    wsa.item_evaluations,
    wsa.mastery
  FROM worksheet_student_answers wsa
  WHERE wsa.worksheet_id = p_worksheet_id
  ORDER BY wsa.exercise_index;
END;
$$;