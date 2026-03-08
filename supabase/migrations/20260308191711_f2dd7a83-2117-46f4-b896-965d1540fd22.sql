
-- =====================================================
-- 1. Add audio_answers column to both answer tables
-- =====================================================
ALTER TABLE worksheet_student_answers ADD COLUMN IF NOT EXISTS audio_answers JSONB DEFAULT '{}'::jsonb;
ALTER TABLE homework_student_answers ADD COLUMN IF NOT EXISTS audio_answers JSONB DEFAULT '{}'::jsonb;

-- =====================================================
-- 2. Update save_worksheet_answer to accept audio_answers
-- =====================================================
CREATE OR REPLACE FUNCTION public.save_worksheet_answer(
  p_worksheet_id UUID,
  p_student_email TEXT,
  p_exercise_index INTEGER,
  p_exercise_type TEXT,
  p_answers JSONB,
  p_time_spent_ms INTEGER DEFAULT NULL,
  p_mastery INTEGER DEFAULT NULL,
  p_item_evaluations JSONB DEFAULT NULL,
  p_audio_answers JSONB DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO worksheet_student_answers (
    worksheet_id, student_email, exercise_index, exercise_type,
    answers, started_at, last_saved_at, time_spent_ms, mastery, item_evaluations, audio_answers
  )
  VALUES (
    p_worksheet_id, lower(p_student_email), p_exercise_index, p_exercise_type,
    p_answers, NOW(), NOW(), COALESCE(p_time_spent_ms, 0), p_mastery, p_item_evaluations,
    COALESCE(p_audio_answers, '{}'::jsonb)
  )
  ON CONFLICT (worksheet_id, student_email, exercise_index)
  DO UPDATE SET
    answers = EXCLUDED.answers,
    last_saved_at = NOW(),
    time_spent_ms = COALESCE(EXCLUDED.time_spent_ms, worksheet_student_answers.time_spent_ms),
    mastery = COALESCE(EXCLUDED.mastery, worksheet_student_answers.mastery),
    item_evaluations = COALESCE(EXCLUDED.item_evaluations, worksheet_student_answers.item_evaluations),
    audio_answers = CASE 
      WHEN EXCLUDED.audio_answers IS NOT NULL AND EXCLUDED.audio_answers != '{}'::jsonb 
      THEN EXCLUDED.audio_answers 
      ELSE worksheet_student_answers.audio_answers 
    END,
    eval_trigger = NULL
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- =====================================================
-- 3. Update save_homework_answer to accept audio_answers
-- =====================================================
CREATE OR REPLACE FUNCTION public.save_homework_answer(
  p_homework_id UUID,
  p_student_email TEXT,
  p_exercise_index INTEGER,
  p_exercise_type TEXT,
  p_answers JSONB,
  p_time_spent_ms INTEGER DEFAULT NULL,
  p_mastery INTEGER DEFAULT NULL,
  p_item_evaluations JSONB DEFAULT NULL,
  p_audio_answers JSONB DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_answer_id UUID;
BEGIN
  INSERT INTO public.homework_student_answers (
    homework_id, student_email, exercise_index, exercise_type,
    answers, time_spent_ms, mastery, item_evaluations, audio_answers,
    is_submitted, started_at, last_saved_at
  )
  VALUES (
    p_homework_id, LOWER(TRIM(p_student_email)), p_exercise_index, p_exercise_type,
    p_answers, p_time_spent_ms, p_mastery, p_item_evaluations,
    COALESCE(p_audio_answers, '{}'::jsonb),
    FALSE, NOW(), NOW()
  )
  ON CONFLICT (homework_id, student_email, exercise_index)
  DO UPDATE SET
    answers = EXCLUDED.answers,
    exercise_type = EXCLUDED.exercise_type,
    time_spent_ms = EXCLUDED.time_spent_ms,
    mastery = EXCLUDED.mastery,
    item_evaluations = EXCLUDED.item_evaluations,
    audio_answers = CASE 
      WHEN EXCLUDED.audio_answers IS NOT NULL AND EXCLUDED.audio_answers != '{}'::jsonb 
      THEN EXCLUDED.audio_answers 
      ELSE homework_student_answers.audio_answers 
    END,
    eval_trigger = NULL,
    last_saved_at = NOW()
  RETURNING id INTO v_answer_id;
  
  RETURN v_answer_id;
END;
$$;

-- =====================================================
-- 4. Update get_worksheet_student_answers to return audio_answers
-- =====================================================
DROP FUNCTION IF EXISTS public.get_worksheet_student_answers(uuid, text);
CREATE OR REPLACE FUNCTION public.get_worksheet_student_answers(
  p_worksheet_id UUID,
  p_student_email TEXT
) RETURNS TABLE(
  id uuid,
  exercise_index integer,
  exercise_type text,
  answers jsonb,
  is_completed boolean,
  started_at timestamptz,
  last_saved_at timestamptz,
  completed_at timestamptz,
  item_evaluations jsonb,
  mastery integer,
  audio_answers jsonb
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    wsa.mastery,
    wsa.audio_answers
  FROM worksheet_student_answers wsa
  WHERE wsa.worksheet_id = p_worksheet_id
    AND lower(wsa.student_email) = lower(p_student_email)
  ORDER BY wsa.exercise_index;
END;
$$;

-- =====================================================
-- 5. Update get_student_homework_answers to return audio_answers
-- =====================================================
DROP FUNCTION IF EXISTS public.get_student_homework_answers(uuid, text);
CREATE OR REPLACE FUNCTION public.get_student_homework_answers(
  p_homework_id UUID,
  p_student_email TEXT
) RETURNS TABLE(
  id uuid,
  exercise_index integer,
  exercise_type text,
  answers jsonb,
  is_submitted boolean,
  started_at timestamptz,
  last_saved_at timestamptz,
  submitted_at timestamptz,
  ai_evaluation jsonb,
  item_evaluations jsonb,
  mastery integer,
  audio_answers jsonb
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    hsa.mastery,
    hsa.audio_answers
  FROM homework_student_answers hsa
  JOIN homework_assignments ha ON hsa.homework_id = ha.id
  JOIN students s ON ha.student_id = s.id
  WHERE hsa.homework_id = p_homework_id
    AND lower(hsa.student_email) = lower(p_student_email)
  ORDER BY hsa.exercise_index;
END;
$$;

-- =====================================================
-- 6. Fix worksheet trigger: COALESCE teacher_id/user_id, dual events, exception handler
-- =====================================================
DROP TRIGGER IF EXISTS trg_worksheet_answer_to_events ON worksheet_student_answers;

CREATE OR REPLACE FUNCTION public.log_worksheet_answer_to_events()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_teacher_id uuid;
  v_student_id uuid;
  v_event_type text;
  v_nano_skill_ratings jsonb;
  v_mastery numeric;
  v_source_id uuid;
  v_has_text boolean;
  v_has_audio boolean;
BEGIN
  v_event_type := CASE 
    WHEN NEW.eval_trigger = '10min_inactivity' THEN '10min_AI_evaluation'
    WHEN NEW.eval_trigger = 'create_homework' THEN 'create_hw_AI_evaluation'
    WHEN NEW.eval_trigger = 'submit_homework' THEN 'submit_hw_AI_evaluation'
    ELSE 'student_learning_activity'
  END;

  SELECT COALESCE(w.teacher_id, w.user_id) INTO v_teacher_id
  FROM worksheets w WHERE w.id = NEW.worksheet_id;
  IF v_teacher_id IS NULL THEN RETURN NEW; END IF;

  SELECT s.id INTO v_student_id FROM students s
  WHERE s.student_email = NEW.student_email AND s.teacher_id = v_teacher_id AND s.deleted_at IS NULL LIMIT 1;
  IF v_student_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.item_evaluations IS NOT NULL THEN
    SELECT jsonb_agg(elem - 'feedback') INTO v_nano_skill_ratings
    FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
    WHERE (elem->>'hasValue')::boolean IS NOT FALSE;
  END IF;

  v_mastery := NEW.mastery;
  IF v_mastery IS NULL AND v_nano_skill_ratings IS NOT NULL AND jsonb_array_length(v_nano_skill_ratings) > 0 THEN
    SELECT ROUND(AVG((elem->>'mastery')::numeric)) INTO v_mastery
    FROM jsonb_array_elements(v_nano_skill_ratings) AS elem
    WHERE (elem->>'mastery')::numeric >= 0 AND (elem->>'hasValue')::boolean = true;
  END IF;

  v_source_id := NEW.worksheet_id;
  v_has_text := NEW.answers IS NOT NULL AND NEW.answers != '{}'::jsonb;
  v_has_audio := NEW.audio_answers IS NOT NULL AND NEW.audio_answers != '{}'::jsonb;

  DELETE FROM student_events
  WHERE student_id = v_student_id AND source_id = v_source_id
    AND (event_payload->>'exercise_index')::int = NEW.exercise_index;

  IF v_has_text THEN
    INSERT INTO student_events (student_id, teacher_id, event_type, event_source, source_id, event_payload, skill_ids, element_type, session_id, mastery)
    VALUES (v_student_id, v_teacher_id, v_event_type, 'worksheet', v_source_id,
      jsonb_build_object('answer_id', NEW.id, 'exercise_index', NEW.exercise_index, 'exercise_type', NEW.exercise_type, 'response_type', 'written', 'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1), 'nano_skill_ratings', COALESCE(v_nano_skill_ratings, '[]'::jsonb)),
      ARRAY(SELECT elem->>'name' FROM jsonb_array_elements(COALESCE(v_nano_skill_ratings, '[]'::jsonb)) AS elem WHERE elem->>'name' IS NOT NULL),
      NEW.exercise_type, NULL, v_mastery);
  END IF;

  IF v_has_audio THEN
    INSERT INTO student_events (student_id, teacher_id, event_type, event_source, source_id, event_payload, skill_ids, element_type, session_id, mastery)
    VALUES (v_student_id, v_teacher_id, v_event_type, 'worksheet', v_source_id,
      jsonb_build_object('answer_id', NEW.id, 'exercise_index', NEW.exercise_index, 'exercise_type', NEW.exercise_type, 'response_type', 'audio', 'audio_answers', NEW.audio_answers, 'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1), 'nano_skill_ratings', COALESCE(v_nano_skill_ratings, '[]'::jsonb)),
      ARRAY(SELECT elem->>'name' FROM jsonb_array_elements(COALESCE(v_nano_skill_ratings, '[]'::jsonb)) AS elem WHERE elem->>'name' IS NOT NULL),
      NEW.exercise_type, NULL, v_mastery);
  END IF;

  IF NOT v_has_text AND NOT v_has_audio THEN
    INSERT INTO student_events (student_id, teacher_id, event_type, event_source, source_id, event_payload, skill_ids, element_type, session_id, mastery)
    VALUES (v_student_id, v_teacher_id, v_event_type, 'worksheet', v_source_id,
      jsonb_build_object('answer_id', NEW.id, 'exercise_index', NEW.exercise_index, 'exercise_type', NEW.exercise_type, 'response_type', 'empty', 'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1), 'nano_skill_ratings', COALESCE(v_nano_skill_ratings, '[]'::jsonb)),
      ARRAY(SELECT elem->>'name' FROM jsonb_array_elements(COALESCE(v_nano_skill_ratings, '[]'::jsonb)) AS elem WHERE elem->>'name' IS NOT NULL),
      NEW.exercise_type, NULL, v_mastery);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'log_worksheet_answer_to_events error: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_worksheet_answer_to_events
AFTER INSERT OR UPDATE ON worksheet_student_answers
FOR EACH ROW EXECUTE FUNCTION log_worksheet_answer_to_events();

-- =====================================================
-- 7. Fix homework trigger: dual events + exception handler
-- =====================================================
DROP TRIGGER IF EXISTS trg_homework_answer_to_events ON homework_student_answers;

CREATE OR REPLACE FUNCTION public.log_homework_answer_to_events()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_teacher_id uuid;
  v_student_id uuid;
  v_event_type text;
  v_nano_skill_ratings jsonb;
  v_mastery numeric;
  v_has_text boolean;
  v_has_audio boolean;
BEGIN
  v_event_type := CASE 
    WHEN NEW.eval_trigger = '10min_inactivity' THEN '10min_AI_evaluation'
    WHEN NEW.eval_trigger = 'create_homework' THEN 'create_hw_AI_evaluation'
    WHEN NEW.eval_trigger = 'submit_homework' THEN 'submit_hw_AI_evaluation'
    ELSE 'student_learning_activity'
  END;

  SELECT ha.teacher_id INTO v_teacher_id FROM homework_assignments ha WHERE ha.id = NEW.homework_id;
  IF v_teacher_id IS NULL THEN RETURN NEW; END IF;

  SELECT s.id INTO v_student_id FROM students s
  WHERE s.student_email = NEW.student_email AND s.teacher_id = v_teacher_id AND s.deleted_at IS NULL LIMIT 1;
  IF v_student_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.item_evaluations IS NOT NULL THEN
    SELECT jsonb_agg(elem - 'feedback') INTO v_nano_skill_ratings
    FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
    WHERE (elem->>'hasValue')::boolean IS NOT FALSE;
  END IF;

  v_mastery := NEW.mastery;
  IF v_mastery IS NULL AND v_nano_skill_ratings IS NOT NULL AND jsonb_array_length(v_nano_skill_ratings) > 0 THEN
    SELECT ROUND(AVG((elem->>'mastery')::numeric)) INTO v_mastery
    FROM jsonb_array_elements(v_nano_skill_ratings) AS elem
    WHERE (elem->>'mastery')::numeric >= 0 AND (elem->>'hasValue')::boolean = true;
  END IF;

  v_has_text := NEW.answers IS NOT NULL AND NEW.answers != '{}'::jsonb;
  v_has_audio := NEW.audio_answers IS NOT NULL AND NEW.audio_answers != '{}'::jsonb;

  DELETE FROM student_events
  WHERE student_id = v_student_id AND source_id = NEW.homework_id
    AND (event_payload->>'exercise_index')::int = NEW.exercise_index;

  IF v_has_text THEN
    INSERT INTO student_events (student_id, teacher_id, event_type, event_source, source_id, event_payload, skill_ids, element_type, session_id, mastery)
    VALUES (v_student_id, v_teacher_id, v_event_type, 'homework', NEW.homework_id,
      jsonb_build_object('answer_id', NEW.id, 'exercise_index', NEW.exercise_index, 'exercise_type', NEW.exercise_type, 'response_type', 'written', 'is_submitted', NEW.is_submitted, 'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1), 'nano_skill_ratings', COALESCE(v_nano_skill_ratings, '[]'::jsonb)),
      ARRAY(SELECT elem->>'name' FROM jsonb_array_elements(COALESCE(v_nano_skill_ratings, '[]'::jsonb)) AS elem WHERE elem->>'name' IS NOT NULL),
      NEW.exercise_type, NULL, v_mastery);
  END IF;

  IF v_has_audio THEN
    INSERT INTO student_events (student_id, teacher_id, event_type, event_source, source_id, event_payload, skill_ids, element_type, session_id, mastery)
    VALUES (v_student_id, v_teacher_id, v_event_type, 'homework', NEW.homework_id,
      jsonb_build_object('answer_id', NEW.id, 'exercise_index', NEW.exercise_index, 'exercise_type', NEW.exercise_type, 'response_type', 'audio', 'audio_answers', NEW.audio_answers, 'is_submitted', NEW.is_submitted, 'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1), 'nano_skill_ratings', COALESCE(v_nano_skill_ratings, '[]'::jsonb)),
      ARRAY(SELECT elem->>'name' FROM jsonb_array_elements(COALESCE(v_nano_skill_ratings, '[]'::jsonb)) AS elem WHERE elem->>'name' IS NOT NULL),
      NEW.exercise_type, NULL, v_mastery);
  END IF;

  IF NOT v_has_text AND NOT v_has_audio THEN
    INSERT INTO student_events (student_id, teacher_id, event_type, event_source, source_id, event_payload, skill_ids, element_type, session_id, mastery)
    VALUES (v_student_id, v_teacher_id, v_event_type, 'homework', NEW.homework_id,
      jsonb_build_object('answer_id', NEW.id, 'exercise_index', NEW.exercise_index, 'exercise_type', NEW.exercise_type, 'response_type', 'empty', 'is_submitted', NEW.is_submitted, 'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1), 'nano_skill_ratings', COALESCE(v_nano_skill_ratings, '[]'::jsonb)),
      ARRAY(SELECT elem->>'name' FROM jsonb_array_elements(COALESCE(v_nano_skill_ratings, '[]'::jsonb)) AS elem WHERE elem->>'name' IS NOT NULL),
      NEW.exercise_type, NULL, v_mastery);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'log_homework_answer_to_events error: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_homework_answer_to_events
AFTER INSERT OR UPDATE ON homework_student_answers
FOR EACH ROW EXECUTE FUNCTION log_homework_answer_to_events();

-- =====================================================
-- 8. Backfill mastery for welcome_test MC events
-- =====================================================
UPDATE student_events SET mastery = CASE 
  WHEN event_payload->>'is_correct' = 'true' THEN 100
  WHEN event_payload->>'is_correct' = 'false' THEN 0
  ELSE NULL
END
WHERE event_source = 'welcome_test'
  AND mastery IS NULL
  AND skill_ids IS NOT NULL AND array_length(skill_ids, 1) > 0;

-- =====================================================
-- 9. Clear mastery for profiling events without skills
-- =====================================================
UPDATE student_events SET mastery = NULL
WHERE event_source = 'welcome_test'
  AND (skill_ids IS NULL OR array_length(skill_ids, 1) IS NULL)
  AND event_payload->'nano_skill_ratings' = '[]'::jsonb
  AND mastery IS NOT NULL;

-- =====================================================
-- 10. Fix selected_preferences → usage_context for Q3b
-- =====================================================
UPDATE student_events 
SET event_payload = jsonb_set(
  event_payload, '{detected_traits}',
  (event_payload->'detected_traits') - 'selected_preferences' || 
  jsonb_build_object('usage_context', event_payload->'detected_traits'->>'selected_preferences')
)
WHERE event_source = 'welcome_test' 
  AND event_payload->'detected_traits' ? 'selected_preferences'
  AND event_payload->>'answer_id' = 'wt_q3b';
