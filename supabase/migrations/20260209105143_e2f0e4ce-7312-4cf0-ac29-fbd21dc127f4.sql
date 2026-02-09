
-- ================================================
-- FIX: eval_trigger reset, event_payload structure
-- ================================================

-- 1. Update save_worksheet_answer: add eval_trigger = NULL on student save
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
  SELECT answers INTO v_existing_answers
  FROM worksheet_student_answers
  WHERE worksheet_id = p_worksheet_id
    AND student_email = lower(p_student_email)
    AND exercise_index = p_exercise_index;
  
  INSERT INTO worksheet_student_answers (
    worksheet_id, student_email, exercise_index, exercise_type,
    answers, started_at, last_saved_at, time_spent_ms, mastery, item_evaluations
  )
  VALUES (
    p_worksheet_id, lower(p_student_email), p_exercise_index, p_exercise_type,
    p_answers, NOW(), NOW(), COALESCE(p_time_spent_ms, 0), p_mastery, p_item_evaluations
  )
  ON CONFLICT (worksheet_id, student_email, exercise_index)
  DO UPDATE SET
    answers = EXCLUDED.answers,
    last_saved_at = NOW(),
    time_spent_ms = COALESCE(EXCLUDED.time_spent_ms, worksheet_student_answers.time_spent_ms),
    mastery = COALESCE(EXCLUDED.mastery, worksheet_student_answers.mastery),
    item_evaluations = COALESCE(EXCLUDED.item_evaluations, worksheet_student_answers.item_evaluations),
    eval_trigger = NULL  -- RESET on student save so trigger maps to student_learning_activity
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- 2. Update save_homework_answer: add eval_trigger = NULL on student save
CREATE OR REPLACE FUNCTION public.save_homework_answer(
    p_homework_id UUID,
    p_student_email TEXT,
    p_exercise_index INTEGER,
    p_exercise_type TEXT,
    p_answers JSONB,
    p_time_spent_ms INTEGER DEFAULT 0,
    p_mastery INTEGER DEFAULT NULL,
    p_item_evaluations JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_answer_id UUID;
BEGIN
    INSERT INTO public.homework_student_answers (
        homework_id, student_email, exercise_index, exercise_type,
        answers, time_spent_ms, mastery, item_evaluations,
        is_submitted, started_at, last_saved_at
    )
    VALUES (
        p_homework_id, LOWER(TRIM(p_student_email)), p_exercise_index, p_exercise_type,
        p_answers, p_time_spent_ms, p_mastery, p_item_evaluations,
        FALSE, NOW(), NOW()
    )
    ON CONFLICT (homework_id, student_email, exercise_index)
    DO UPDATE SET
        answers = EXCLUDED.answers,
        exercise_type = EXCLUDED.exercise_type,
        time_spent_ms = EXCLUDED.time_spent_ms,
        mastery = EXCLUDED.mastery,
        item_evaluations = EXCLUDED.item_evaluations,
        eval_trigger = NULL,  -- RESET on student save
        last_saved_at = NOW()
    RETURNING id INTO v_answer_id;
    
    RETURN v_answer_id;
END;
$$;

-- 3. Fix worksheet trigger event_payload: answer_id, time_spent_seconds, no answers blob
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
  v_event_type := CASE 
    WHEN NEW.eval_trigger = '10min_inactivity' THEN '10min_AI_evaluation'
    WHEN NEW.eval_trigger = 'create_homework' THEN 'create_hw_AI_evaluation'
    WHEN NEW.eval_trigger = 'submit_homework' THEN 'submit_hw_AI_evaluation'
    ELSE 'student_learning_activity'
  END;

  SELECT user_id INTO v_teacher_id
  FROM worksheets
  WHERE id = NEW.worksheet_id;
  
  IF v_teacher_id IS NULL THEN RETURN NEW; END IF;

  SELECT s.id INTO v_student_id
  FROM students s
  WHERE s.student_email = NEW.student_email
    AND s.teacher_id = v_teacher_id
    AND s.deleted_at IS NULL
  LIMIT 1;
  
  IF v_student_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.item_evaluations IS NOT NULL THEN
    SELECT jsonb_agg(elem)
    INTO v_nano_skill_ratings
    FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
    WHERE (elem->>'hasValue')::boolean IS NOT FALSE;
  END IF;

  DELETE FROM student_events
  WHERE student_id = v_student_id
    AND source_id = NEW.worksheet_id
    AND (event_payload->>'exercise_index')::int = NEW.exercise_index;

  INSERT INTO student_events (
    student_id, teacher_id, event_type, event_source,
    source_id, event_payload, skill_ids, element_type,
    session_id, mastery
  ) VALUES (
    v_student_id, v_teacher_id, v_event_type, 'worksheet',
    NEW.worksheet_id,
    jsonb_build_object(
      'answer_id', NEW.id,
      'exercise_index', NEW.exercise_index,
      'exercise_type', NEW.exercise_type,
      'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1),
      'nano_skill_ratings', COALESCE(v_nano_skill_ratings, '[]'::jsonb)
    ),
    ARRAY(
      SELECT elem->>'name'
      FROM jsonb_array_elements(COALESCE(v_nano_skill_ratings, '[]'::jsonb)) AS elem
      WHERE elem->>'name' IS NOT NULL
    ),
    NEW.exercise_type, NULL, NEW.mastery
  );

  RETURN NEW;
END;
$$;

-- 4. Fix homework trigger event_payload: answer_id, time_spent_seconds, no answers blob
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
  v_event_type := CASE 
    WHEN NEW.eval_trigger = '10min_inactivity' THEN '10min_AI_evaluation'
    WHEN NEW.eval_trigger = 'create_homework' THEN 'create_hw_AI_evaluation'
    WHEN NEW.eval_trigger = 'submit_homework' THEN 'submit_hw_AI_evaluation'
    ELSE 'student_learning_activity'
  END;

  SELECT ha.teacher_id INTO v_teacher_id
  FROM homework_assignments ha
  WHERE ha.id = NEW.homework_id;
  
  IF v_teacher_id IS NULL THEN RETURN NEW; END IF;

  SELECT s.id INTO v_student_id
  FROM students s
  WHERE s.student_email = NEW.student_email
    AND s.teacher_id = v_teacher_id
    AND s.deleted_at IS NULL
  LIMIT 1;
  
  IF v_student_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.item_evaluations IS NOT NULL THEN
    SELECT jsonb_agg(elem)
    INTO v_nano_skill_ratings
    FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
    WHERE (elem->>'hasValue')::boolean IS NOT FALSE;
  END IF;

  DELETE FROM student_events
  WHERE student_id = v_student_id
    AND source_id = NEW.homework_id
    AND (event_payload->>'exercise_index')::int = NEW.exercise_index;

  INSERT INTO student_events (
    student_id, teacher_id, event_type, event_source,
    source_id, event_payload, skill_ids, element_type,
    session_id, mastery
  ) VALUES (
    v_student_id, v_teacher_id, v_event_type, 'homework',
    NEW.homework_id,
    jsonb_build_object(
      'answer_id', NEW.id,
      'exercise_index', NEW.exercise_index,
      'exercise_type', NEW.exercise_type,
      'is_submitted', NEW.is_submitted,
      'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1),
      'nano_skill_ratings', COALESCE(v_nano_skill_ratings, '[]'::jsonb)
    ),
    ARRAY(
      SELECT elem->>'name'
      FROM jsonb_array_elements(COALESCE(v_nano_skill_ratings, '[]'::jsonb)) AS elem
      WHERE elem->>'name' IS NOT NULL
    ),
    NEW.exercise_type, NULL, NEW.mastery
  );

  RETURN NEW;
END;
$$;
