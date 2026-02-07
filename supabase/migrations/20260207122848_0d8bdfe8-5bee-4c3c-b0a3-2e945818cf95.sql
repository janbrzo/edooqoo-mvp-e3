
-- 1. Add eval_trigger column to both answer tables
ALTER TABLE public.worksheet_student_answers ADD COLUMN IF NOT EXISTS eval_trigger text DEFAULT NULL;
ALTER TABLE public.homework_student_answers ADD COLUMN IF NOT EXISTS eval_trigger text DEFAULT NULL;

-- 2. Update worksheet trigger to use eval_trigger for event_type mapping
CREATE OR REPLACE FUNCTION public.log_worksheet_answer_to_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_id uuid;
  v_student_id uuid;
  v_event_type text;
  v_nano_skill_ratings jsonb;
BEGIN
  -- Determine event_type based on eval_trigger
  v_event_type := CASE 
    WHEN NEW.eval_trigger = '10min_inactivity' THEN '10min_AI_evaluation'
    WHEN NEW.eval_trigger = 'close_tab' THEN 'close_tab_AI_evaluation'
    WHEN NEW.eval_trigger = 'create_homework' THEN 'create_hw_AI_evaluation'
    WHEN NEW.eval_trigger = 'submit_homework' THEN 'submit_hw_AI_evaluation'
    ELSE 'student_learning_activity'
  END;

  -- Get teacher_id from worksheet
  SELECT user_id INTO v_teacher_id
  FROM worksheets
  WHERE id = NEW.worksheet_id;
  
  IF v_teacher_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get student_id from students table by email
  SELECT s.id INTO v_student_id
  FROM students s
  WHERE s.student_email = NEW.student_email
    AND s.teacher_id = v_teacher_id
    AND s.deleted_at IS NULL
  LIMIT 1;
  
  IF v_student_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Build nano_skill_ratings from item_evaluations (filter out items without student answers)
  IF NEW.item_evaluations IS NOT NULL THEN
    SELECT jsonb_agg(elem)
    INTO v_nano_skill_ratings
    FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
    WHERE (elem->>'hasValue')::boolean IS NOT FALSE;
  END IF;

  -- DELETE existing event for this exercise (upsert pattern)
  DELETE FROM student_events
  WHERE student_id = v_student_id
    AND source_id = NEW.worksheet_id
    AND event_type = v_event_type
    AND (event_payload->>'exercise_index')::int = NEW.exercise_index;

  -- INSERT new event
  INSERT INTO student_events (
    student_id, teacher_id, event_type, event_source,
    source_id, event_payload, skill_ids, element_type,
    session_id, mastery
  ) VALUES (
    v_student_id,
    v_teacher_id,
    v_event_type,
    'worksheet',
    NEW.worksheet_id,
    jsonb_build_object(
      'exercise_index', NEW.exercise_index,
      'exercise_type', NEW.exercise_type,
      'answers', NEW.answers,
      'time_spent_ms', COALESCE(NEW.time_spent_ms, 0),
      'nano_skill_ratings', COALESCE(v_nano_skill_ratings, '[]'::jsonb)
    ),
    ARRAY(
      SELECT elem->>'name'
      FROM jsonb_array_elements(COALESCE(v_nano_skill_ratings, '[]'::jsonb)) AS elem
      WHERE elem->>'name' IS NOT NULL
    ),
    NEW.exercise_type,
    NULL,
    NEW.mastery
  );

  RETURN NEW;
END;
$$;

-- 3. Update homework trigger to use eval_trigger for event_type mapping
CREATE OR REPLACE FUNCTION public.log_homework_answer_to_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_id uuid;
  v_student_id uuid;
  v_event_type text;
  v_nano_skill_ratings jsonb;
BEGIN
  -- Determine event_type based on eval_trigger
  v_event_type := CASE 
    WHEN NEW.eval_trigger = '10min_inactivity' THEN '10min_AI_evaluation'
    WHEN NEW.eval_trigger = 'close_tab' THEN 'close_tab_AI_evaluation'
    WHEN NEW.eval_trigger = 'create_homework' THEN 'create_hw_AI_evaluation'
    WHEN NEW.eval_trigger = 'submit_homework' THEN 'submit_hw_AI_evaluation'
    ELSE 'student_learning_activity'
  END;

  -- Get teacher_id from homework_assignments
  SELECT ha.teacher_id INTO v_teacher_id
  FROM homework_assignments ha
  WHERE ha.id = NEW.homework_id;
  
  IF v_teacher_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get student_id from students table by email
  SELECT s.id INTO v_student_id
  FROM students s
  WHERE s.student_email = NEW.student_email
    AND s.teacher_id = v_teacher_id
    AND s.deleted_at IS NULL
  LIMIT 1;
  
  IF v_student_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Build nano_skill_ratings from item_evaluations (filter out items without student answers)
  IF NEW.item_evaluations IS NOT NULL THEN
    SELECT jsonb_agg(elem)
    INTO v_nano_skill_ratings
    FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
    WHERE (elem->>'hasValue')::boolean IS NOT FALSE;
  END IF;

  -- DELETE existing event for this exercise (upsert pattern)
  DELETE FROM student_events
  WHERE student_id = v_student_id
    AND source_id = NEW.homework_id
    AND event_type = v_event_type
    AND (event_payload->>'exercise_index')::int = NEW.exercise_index;

  -- INSERT new event
  INSERT INTO student_events (
    student_id, teacher_id, event_type, event_source,
    source_id, event_payload, skill_ids, element_type,
    session_id, mastery
  ) VALUES (
    v_student_id,
    v_teacher_id,
    v_event_type,
    'homework',
    NEW.homework_id,
    jsonb_build_object(
      'exercise_index', NEW.exercise_index,
      'exercise_type', NEW.exercise_type,
      'answers', NEW.answers,
      'is_submitted', NEW.is_submitted,
      'time_spent_ms', COALESCE(NEW.time_spent_ms, 0),
      'nano_skill_ratings', COALESCE(v_nano_skill_ratings, '[]'::jsonb)
    ),
    ARRAY(
      SELECT elem->>'name'
      FROM jsonb_array_elements(COALESCE(v_nano_skill_ratings, '[]'::jsonb)) AS elem
      WHERE elem->>'name' IS NOT NULL
    ),
    NEW.exercise_type,
    NULL,
    NEW.mastery
  );

  RETURN NEW;
END;
$$;
