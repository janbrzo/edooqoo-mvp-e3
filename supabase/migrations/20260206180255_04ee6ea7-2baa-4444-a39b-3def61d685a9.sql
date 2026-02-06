
-- Fix: Add mastery to the event_payload in log_worksheet_answer_to_events trigger
-- This ensures student_events gets mastery value when AI evaluation updates worksheet_student_answers

CREATE OR REPLACE FUNCTION public.log_worksheet_answer_to_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_teacher_id uuid;
  v_source_id text;
BEGIN
  -- Get student_id and teacher_id from worksheet
  SELECT w.student_id, w.user_id INTO v_student_id, v_teacher_id
  FROM worksheets w
  WHERE w.id = NEW.worksheet_id;

  -- Skip if no student assigned
  IF v_student_id IS NULL OR v_teacher_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_source_id := NEW.worksheet_id;

  -- DELETE existing event for this exercise (same student, source, exercise_index)
  DELETE FROM student_events
  WHERE student_id = v_student_id
    AND source_id = v_source_id
    AND event_type = 'learning_activity'
    AND event_source = 'worksheet_answer_saved'
    AND (event_payload->>'exercise_index')::int = NEW.exercise_index;

  -- INSERT new event with latest data
  INSERT INTO student_events (
    student_id,
    teacher_id,
    event_type,
    event_source,
    source_id,
    event_payload,
    element_type,
    is_processed,
    created_at
  ) VALUES (
    v_student_id,
    v_teacher_id,
    'learning_activity',
    'worksheet_answer_saved',
    v_source_id,
    jsonb_build_object(
      'answer_id', NEW.id,
      'exercise_index', NEW.exercise_index,
      'exercise_type', NEW.exercise_type,
      'mastery', NEW.mastery,
      'nano_skill_ratings', COALESCE(NEW.item_evaluations, '[]'::jsonb),
      'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
    ),
    NEW.exercise_type,
    false,
    now()
  );

  RETURN NEW;
END;
$$;
