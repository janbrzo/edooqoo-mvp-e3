-- Update get_student_homework_answers to return ai_evaluation, item_evaluations, mastery
-- PROBLEM 3.2 FIX: AI Evaluation persists after page refresh
DROP FUNCTION IF EXISTS public.get_student_homework_answers(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.get_student_homework_answers(
  p_homework_id UUID,
  p_student_email TEXT
)
RETURNS TABLE(
  id UUID,
  exercise_index INTEGER,
  exercise_type TEXT,
  answers JSONB,
  is_submitted BOOLEAN,
  started_at TIMESTAMPTZ,
  last_saved_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  ai_evaluation JSONB,
  item_evaluations JSONB,
  mastery INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hsa.id,
    hsa.exercise_index,
    hsa.exercise_type,
    hsa.answers,
    hsa.is_submitted,
    hsa.started_at,
    hsa.last_saved_at,
    hsa.submitted_at,
    hsa.ai_evaluation,
    hsa.item_evaluations,
    hsa.mastery
  FROM homework_student_answers hsa
  JOIN homework_assignments ha ON hsa.homework_id = ha.id
  JOIN students s ON ha.student_id = s.id
  WHERE hsa.homework_id = p_homework_id
    AND lower(hsa.student_email) = lower(p_student_email)
  ORDER BY hsa.exercise_index;
END;
$$;

-- Update get_worksheet_student_answers to return item_evaluations, mastery
DROP FUNCTION IF EXISTS public.get_worksheet_student_answers(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.get_worksheet_student_answers(
  p_worksheet_id UUID,
  p_student_email TEXT
)
RETURNS TABLE(
  id UUID,
  exercise_index INTEGER,
  exercise_type TEXT,
  answers JSONB,
  is_completed BOOLEAN,
  started_at TIMESTAMPTZ,
  last_saved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  item_evaluations JSONB,
  mastery INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wsa.id,
    wsa.exercise_index,
    wsa.exercise_type,
    wsa.answers,
    wsa.is_completed,
    wsa.started_at,
    wsa.last_saved_at,
    wsa.completed_at,
    wsa.item_evaluations,
    wsa.mastery
  FROM worksheet_student_answers wsa
  WHERE wsa.worksheet_id = p_worksheet_id
    AND lower(wsa.student_email) = lower(p_student_email)
  ORDER BY wsa.exercise_index;
END;
$$;