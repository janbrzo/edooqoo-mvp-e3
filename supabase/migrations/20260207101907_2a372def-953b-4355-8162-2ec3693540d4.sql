
-- Fix: Change v_source_id from text to uuid to prevent "operator does not exist: uuid = text" error
CREATE OR REPLACE FUNCTION public.log_worksheet_answer_to_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_teacher_id uuid;
  v_source_id uuid;
  v_session_id text;
BEGIN
  -- Get student_id and teacher_id from the worksheet
  SELECT w.student_id, w.user_id
  INTO v_student_id, v_teacher_id
  FROM worksheets w
  WHERE w.id = NEW.worksheet_id;

  -- Skip if no student linked
  IF v_student_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Build source_id from worksheet_id
  v_source_id := NEW.worksheet_id;

  -- Session ID based on worksheet + exercise
  v_session_id := NEW.worksheet_id || '_ex' || NEW.exercise_index;

  -- Delete existing event for this source (prevents duplicates)
  DELETE FROM student_events
  WHERE source_id = v_source_id
    AND student_id = v_student_id
    AND event_type = 'learning_activity'
    AND event_source = 'worksheet_answer_saved'
    AND (event_payload->>'exercise_index')::int = NEW.exercise_index;

  -- Insert new event
  INSERT INTO student_events (
    student_id,
    teacher_id,
    event_type,
    event_source,
    event_payload,
    source_id,
    session_id,
    element_type,
    mastery,
    created_at
  ) VALUES (
    v_student_id,
    v_teacher_id,
    'learning_activity',
    'worksheet_answer_saved',
    jsonb_build_object(
      'answer_id', NEW.id,
      'exercise_index', NEW.exercise_index,
      'exercise_type', NEW.exercise_type,
      'mastery', NEW.mastery,
      'nano_skill_ratings', COALESCE(NEW.item_evaluations, '[]'::jsonb),
      'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
    ),
    v_source_id,
    v_session_id,
    NEW.exercise_type,
    NEW.mastery,
    NOW()
  );

  RETURN NEW;
END;
$$;
