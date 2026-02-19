
-- ================================================
-- DSLM Layer A Cleanup & Mastery Auto-Calculation
-- Round 11: Fix all FAIL items on readiness checklist
-- ================================================

-- =============================================
-- STEP 1: DATA CLEANUP
-- =============================================

-- 1a. Delete trash welcome_test events with NULL answer_id (old trigger format)
DELETE FROM student_events
WHERE event_source = 'welcome_test'
AND event_payload->>'answer_id' IS NULL;

-- 1b. Delete 20 legacy events with event_source='test' (old placement tests)
DELETE FROM student_events WHERE event_source = 'test';

-- =============================================
-- STEP 2: BACKFILL FLASHCARD MASTERY (55 old events)
-- =============================================

-- Fix column mastery for old flashcard events with inflated mastery
UPDATE student_events
SET mastery = CASE
  WHEN (event_payload->>'repetition')::int >= 4 
    AND (event_payload->>'interval_days')::int >= 21 THEN 100
  WHEN (event_payload->>'repetition')::int >= 3 
    AND (event_payload->>'interval_days')::int >= 6 THEN 90
  WHEN (event_payload->>'repetition')::int = 2 THEN 70
  WHEN (event_payload->>'repetition')::int = 1 THEN 50
  WHEN (event_payload->>'repetition')::int = 0 THEN 0
  ELSE 60
END
WHERE event_source = 'flashcard' 
AND mastery = 100
AND (event_payload->>'repetition')::int < 4;

-- Sync payload.mastery with corrected column mastery
UPDATE student_events
SET event_payload = jsonb_set(event_payload, '{mastery}', to_jsonb(mastery))
WHERE event_source = 'flashcard'
AND mastery IS NOT NULL
AND (event_payload->>'mastery')::numeric IS DISTINCT FROM mastery;

-- =============================================
-- STEP 3: BACKFILL MASTERY FROM nano_skill_ratings
-- For worksheet and homework events with NULL mastery
-- =============================================

UPDATE student_events
SET mastery = sub.avg_mastery
FROM (
  SELECT se.id,
    ROUND(AVG((elem->>'mastery')::numeric)) AS avg_mastery
  FROM student_events se,
    LATERAL jsonb_array_elements(se.event_payload->'nano_skill_ratings') AS elem
  WHERE se.mastery IS NULL
    AND se.event_source IN ('worksheet', 'homework')
    AND jsonb_array_length(COALESCE(se.event_payload->'nano_skill_ratings', '[]'::jsonb)) > 0
    AND (elem->>'mastery')::numeric >= 0
    AND (elem->>'hasValue')::boolean = true
  GROUP BY se.id
) sub
WHERE student_events.id = sub.id;

-- =============================================
-- STEP 4: UPDATE TRIGGERS - Auto-calculate mastery from NSR
-- =============================================

-- Worksheet trigger: auto-calculate mastery if NEW.mastery IS NULL
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
  v_mastery numeric;
  v_source_id uuid;
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

  -- Strip 'feedback' key from each element for DSLM consistency
  IF NEW.item_evaluations IS NOT NULL THEN
    SELECT jsonb_agg(elem - 'feedback')
    INTO v_nano_skill_ratings
    FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
    WHERE (elem->>'hasValue')::boolean IS NOT FALSE;
  END IF;

  -- Auto-calculate mastery from nano_skill_ratings if not provided
  v_mastery := NEW.mastery;
  IF v_mastery IS NULL AND v_nano_skill_ratings IS NOT NULL AND jsonb_array_length(v_nano_skill_ratings) > 0 THEN
    SELECT ROUND(AVG((elem->>'mastery')::numeric))
    INTO v_mastery
    FROM jsonb_array_elements(v_nano_skill_ratings) AS elem
    WHERE (elem->>'mastery')::numeric >= 0
      AND (elem->>'hasValue')::boolean = true;
  END IF;

  v_source_id := NEW.worksheet_id;

  DELETE FROM student_events
  WHERE student_id = v_student_id
    AND source_id = v_source_id
    AND (event_payload->>'exercise_index')::int = NEW.exercise_index;

  INSERT INTO student_events (
    student_id, teacher_id, event_type, event_source,
    source_id, event_payload, skill_ids, element_type,
    session_id, mastery
  ) VALUES (
    v_student_id, v_teacher_id, v_event_type, 'worksheet',
    v_source_id,
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
    NEW.exercise_type, NULL, v_mastery
  );

  RETURN NEW;
END;
$$;

-- Homework trigger: auto-calculate mastery if NEW.mastery IS NULL
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
  v_mastery numeric;
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

  -- Strip 'feedback' key from each element for DSLM consistency
  IF NEW.item_evaluations IS NOT NULL THEN
    SELECT jsonb_agg(elem - 'feedback')
    INTO v_nano_skill_ratings
    FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
    WHERE (elem->>'hasValue')::boolean IS NOT FALSE;
  END IF;

  -- Auto-calculate mastery from nano_skill_ratings if not provided
  v_mastery := NEW.mastery;
  IF v_mastery IS NULL AND v_nano_skill_ratings IS NOT NULL AND jsonb_array_length(v_nano_skill_ratings) > 0 THEN
    SELECT ROUND(AVG((elem->>'mastery')::numeric))
    INTO v_mastery
    FROM jsonb_array_elements(v_nano_skill_ratings) AS elem
    WHERE (elem->>'mastery')::numeric >= 0
      AND (elem->>'hasValue')::boolean = true;
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
    NEW.exercise_type, NULL, v_mastery
  );

  RETURN NEW;
END;
$$;
