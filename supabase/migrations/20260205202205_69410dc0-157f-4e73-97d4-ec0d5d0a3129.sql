-- Add last_ai_eval_at column to worksheet_student_answers for tracking AI evaluation timing
ALTER TABLE worksheet_student_answers 
ADD COLUMN IF NOT EXISTS last_ai_eval_at TIMESTAMPTZ;

-- Create index for efficient querying of pending evaluations
CREATE INDEX IF NOT EXISTS idx_worksheet_student_answers_ai_eval 
ON worksheet_student_answers(worksheet_id, student_email, last_saved_at, last_ai_eval_at);

-- Comment explaining the column purpose
COMMENT ON COLUMN worksheet_student_answers.last_ai_eval_at IS 'Timestamp of last AI evaluation. AI eval runs only when last_saved_at > last_ai_eval_at';

-- Update RPC function for save_worksheet_answer to handle last_ai_eval_at reset on new answers
CREATE OR REPLACE FUNCTION public.save_worksheet_answer(
  p_worksheet_id UUID,
  p_student_email TEXT,
  p_exercise_index INTEGER,
  p_exercise_type TEXT,
  p_answers JSONB,
  p_time_spent_ms INTEGER DEFAULT NULL,
  p_mastery INTEGER DEFAULT NULL,
  p_item_evaluations JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_existing_answers JSONB;
BEGIN
  -- Get existing answers to check if content changed
  SELECT answers INTO v_existing_answers
  FROM worksheet_student_answers
  WHERE worksheet_id = p_worksheet_id
    AND student_email = lower(p_student_email)
    AND exercise_index = p_exercise_index;
  
  INSERT INTO worksheet_student_answers (
    worksheet_id,
    student_email,
    exercise_index,
    exercise_type,
    answers,
    started_at,
    last_saved_at,
    time_spent_ms,
    mastery,
    item_evaluations
  )
  VALUES (
    p_worksheet_id,
    lower(p_student_email),
    p_exercise_index,
    p_exercise_type,
    p_answers,
    NOW(),
    NOW(),
    COALESCE(p_time_spent_ms, 0),
    p_mastery,
    p_item_evaluations
  )
  ON CONFLICT (worksheet_id, student_email, exercise_index)
  DO UPDATE SET
    answers = EXCLUDED.answers,
    last_saved_at = NOW(),
    time_spent_ms = COALESCE(EXCLUDED.time_spent_ms, worksheet_student_answers.time_spent_ms),
    mastery = COALESCE(EXCLUDED.mastery, worksheet_student_answers.mastery),
    item_evaluations = COALESCE(EXCLUDED.item_evaluations, worksheet_student_answers.item_evaluations)
    -- Note: last_ai_eval_at is NOT reset here - it will be set by process-pending-ai-evaluations
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Create function to check if AI evaluation is needed
CREATE OR REPLACE FUNCTION public.needs_ai_evaluation(
  p_worksheet_id UUID,
  p_student_email TEXT,
  p_exercise_index INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_saved TIMESTAMPTZ;
  v_last_ai_eval TIMESTAMPTZ;
BEGIN
  SELECT last_saved_at, last_ai_eval_at
  INTO v_last_saved, v_last_ai_eval
  FROM worksheet_student_answers
  WHERE worksheet_id = p_worksheet_id
    AND student_email = lower(p_student_email)
    AND exercise_index = p_exercise_index;
  
  IF v_last_saved IS NULL THEN
    RETURN FALSE; -- No answers saved
  END IF;
  
  IF v_last_ai_eval IS NULL THEN
    RETURN TRUE; -- Never evaluated
  END IF;
  
  RETURN v_last_saved > v_last_ai_eval;
END;
$$;

-- Create function to mark AI evaluation as done
CREATE OR REPLACE FUNCTION public.mark_ai_evaluation_done(
  p_worksheet_id UUID,
  p_student_email TEXT,
  p_exercise_index INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE worksheet_student_answers
  SET last_ai_eval_at = NOW()
  WHERE worksheet_id = p_worksheet_id
    AND student_email = lower(p_student_email)
    AND exercise_index = p_exercise_index;
END;
$$;