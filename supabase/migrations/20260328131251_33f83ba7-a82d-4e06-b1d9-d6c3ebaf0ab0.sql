
-- Split nano_skill_ratings in worksheet and homework triggers by response_type
-- Written events get only ratings for non-audio questions
-- Audio events get only ratings for audio questions

DROP TRIGGER IF EXISTS trg_worksheet_answer_to_events ON worksheet_student_answers;

CREATE OR REPLACE FUNCTION public.log_worksheet_answer_to_events()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_teacher_id uuid;
  v_student_id uuid;
  v_event_type text;
  v_all_ratings jsonb;
  v_written_ratings jsonb;
  v_audio_ratings jsonb;
  v_written_mastery numeric;
  v_audio_mastery numeric;
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

  v_source_id := NEW.worksheet_id;
  v_has_text := NEW.answers IS NOT NULL AND NEW.answers != '{}'::jsonb;
  v_has_audio := NEW.audio_answers IS NOT NULL AND NEW.audio_answers != '{}'::jsonb;

  -- Build separate ratings for written vs audio questions
  IF NEW.item_evaluations IS NOT NULL THEN
    IF v_has_audio THEN
      -- Written: ratings for questions NOT in audio_answers
      SELECT jsonb_agg(elem - 'feedback') INTO v_written_ratings
      FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
      WHERE (elem->>'hasValue')::boolean IS NOT FALSE
        AND NOT (NEW.audio_answers ? (elem->>'question_index'));

      -- Audio: ratings for questions IN audio_answers
      SELECT jsonb_agg(elem - 'feedback') INTO v_audio_ratings
      FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
      WHERE (elem->>'hasValue')::boolean IS NOT FALSE
        AND (NEW.audio_answers ? (elem->>'question_index'));
    ELSE
      -- No audio, all ratings go to written
      SELECT jsonb_agg(elem - 'feedback') INTO v_written_ratings
      FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
      WHERE (elem->>'hasValue')::boolean IS NOT FALSE;
    END IF;
  END IF;

  -- Calculate mastery per response type
  v_written_mastery := NEW.mastery;
  v_audio_mastery := NEW.mastery;

  IF v_written_ratings IS NOT NULL AND jsonb_array_length(v_written_ratings) > 0 THEN
    SELECT ROUND(AVG((elem->>'mastery')::numeric)) INTO v_written_mastery
    FROM jsonb_array_elements(v_written_ratings) AS elem
    WHERE (elem->>'mastery')::numeric >= 0 AND (elem->>'hasValue')::boolean = true;
  END IF;

  IF v_audio_ratings IS NOT NULL AND jsonb_array_length(v_audio_ratings) > 0 THEN
    SELECT ROUND(AVG((elem->>'mastery')::numeric)) INTO v_audio_mastery
    FROM jsonb_array_elements(v_audio_ratings) AS elem
    WHERE (elem->>'mastery')::numeric >= 0 AND (elem->>'hasValue')::boolean = true;
  END IF;

  DELETE FROM student_events
  WHERE student_id = v_student_id AND source_id = v_source_id
    AND (event_payload->>'exercise_index')::int = NEW.exercise_index;

  IF v_has_text THEN
    INSERT INTO student_events (student_id, teacher_id, event_type, event_source, source_id, event_payload, skill_ids, element_type, session_id, mastery)
    VALUES (v_student_id, v_teacher_id, v_event_type, 'worksheet', v_source_id,
      jsonb_build_object('answer_id', NEW.id, 'exercise_index', NEW.exercise_index, 'exercise_type', NEW.exercise_type, 'response_type', 'written', 'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1), 'nano_skill_ratings', COALESCE(v_written_ratings, '[]'::jsonb)),
      ARRAY(SELECT elem->>'name' FROM jsonb_array_elements(COALESCE(v_written_ratings, '[]'::jsonb)) AS elem WHERE elem->>'name' IS NOT NULL),
      NEW.exercise_type, NULL, v_written_mastery);
  END IF;

  IF v_has_audio THEN
    INSERT INTO student_events (student_id, teacher_id, event_type, event_source, source_id, event_payload, skill_ids, element_type, session_id, mastery)
    VALUES (v_student_id, v_teacher_id, v_event_type, 'worksheet', v_source_id,
      jsonb_build_object('answer_id', NEW.id, 'exercise_index', NEW.exercise_index, 'exercise_type', NEW.exercise_type, 'response_type', 'audio', 'audio_answers', NEW.audio_answers, 'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1), 'nano_skill_ratings', COALESCE(v_audio_ratings, '[]'::jsonb)),
      ARRAY(SELECT elem->>'name' FROM jsonb_array_elements(COALESCE(v_audio_ratings, '[]'::jsonb)) AS elem WHERE elem->>'name' IS NOT NULL),
      NEW.exercise_type, NULL, v_audio_mastery);
  END IF;

  IF NOT v_has_text AND NOT v_has_audio THEN
    INSERT INTO student_events (student_id, teacher_id, event_type, event_source, source_id, event_payload, skill_ids, element_type, session_id, mastery)
    VALUES (v_student_id, v_teacher_id, v_event_type, 'worksheet', v_source_id,
      jsonb_build_object('answer_id', NEW.id, 'exercise_index', NEW.exercise_index, 'exercise_type', NEW.exercise_type, 'response_type', 'empty', 'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1), 'nano_skill_ratings', '[]'::jsonb),
      NULL, NEW.exercise_type, NULL, NULL);
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
-- Homework trigger: same split logic
-- =====================================================
DROP TRIGGER IF EXISTS trg_homework_answer_to_events ON homework_student_answers;

CREATE OR REPLACE FUNCTION public.log_homework_answer_to_events()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_teacher_id uuid;
  v_student_id uuid;
  v_event_type text;
  v_written_ratings jsonb;
  v_audio_ratings jsonb;
  v_written_mastery numeric;
  v_audio_mastery numeric;
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

  v_has_text := NEW.answers IS NOT NULL AND NEW.answers != '{}'::jsonb;
  v_has_audio := NEW.audio_answers IS NOT NULL AND NEW.audio_answers != '{}'::jsonb;

  -- Build separate ratings for written vs audio questions
  IF NEW.item_evaluations IS NOT NULL THEN
    IF v_has_audio THEN
      SELECT jsonb_agg(elem - 'feedback') INTO v_written_ratings
      FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
      WHERE (elem->>'hasValue')::boolean IS NOT FALSE
        AND NOT (NEW.audio_answers ? (elem->>'question_index'));

      SELECT jsonb_agg(elem - 'feedback') INTO v_audio_ratings
      FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
      WHERE (elem->>'hasValue')::boolean IS NOT FALSE
        AND (NEW.audio_answers ? (elem->>'question_index'));
    ELSE
      SELECT jsonb_agg(elem - 'feedback') INTO v_written_ratings
      FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
      WHERE (elem->>'hasValue')::boolean IS NOT FALSE;
    END IF;
  END IF;

  v_written_mastery := NEW.mastery;
  v_audio_mastery := NEW.mastery;

  IF v_written_ratings IS NOT NULL AND jsonb_array_length(v_written_ratings) > 0 THEN
    SELECT ROUND(AVG((elem->>'mastery')::numeric)) INTO v_written_mastery
    FROM jsonb_array_elements(v_written_ratings) AS elem
    WHERE (elem->>'mastery')::numeric >= 0 AND (elem->>'hasValue')::boolean = true;
  END IF;

  IF v_audio_ratings IS NOT NULL AND jsonb_array_length(v_audio_ratings) > 0 THEN
    SELECT ROUND(AVG((elem->>'mastery')::numeric)) INTO v_audio_mastery
    FROM jsonb_array_elements(v_audio_ratings) AS elem
    WHERE (elem->>'mastery')::numeric >= 0 AND (elem->>'hasValue')::boolean = true;
  END IF;

  DELETE FROM student_events
  WHERE student_id = v_student_id AND source_id = NEW.homework_id
    AND (event_payload->>'exercise_index')::int = NEW.exercise_index;

  IF v_has_text THEN
    INSERT INTO student_events (student_id, teacher_id, event_type, event_source, source_id, event_payload, skill_ids, element_type, session_id, mastery)
    VALUES (v_student_id, v_teacher_id, v_event_type, 'homework', NEW.homework_id,
      jsonb_build_object('answer_id', NEW.id, 'exercise_index', NEW.exercise_index, 'exercise_type', NEW.exercise_type, 'response_type', 'written', 'is_submitted', NEW.is_submitted, 'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1), 'nano_skill_ratings', COALESCE(v_written_ratings, '[]'::jsonb)),
      ARRAY(SELECT elem->>'name' FROM jsonb_array_elements(COALESCE(v_written_ratings, '[]'::jsonb)) AS elem WHERE elem->>'name' IS NOT NULL),
      NEW.exercise_type, NULL, v_written_mastery);
  END IF;

  IF v_has_audio THEN
    INSERT INTO student_events (student_id, teacher_id, event_type, event_source, source_id, event_payload, skill_ids, element_type, session_id, mastery)
    VALUES (v_student_id, v_teacher_id, v_event_type, 'homework', NEW.homework_id,
      jsonb_build_object('answer_id', NEW.id, 'exercise_index', NEW.exercise_index, 'exercise_type', NEW.exercise_type, 'response_type', 'audio', 'audio_answers', NEW.audio_answers, 'is_submitted', NEW.is_submitted, 'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1), 'nano_skill_ratings', COALESCE(v_audio_ratings, '[]'::jsonb)),
      ARRAY(SELECT elem->>'name' FROM jsonb_array_elements(COALESCE(v_audio_ratings, '[]'::jsonb)) AS elem WHERE elem->>'name' IS NOT NULL),
      NEW.exercise_type, NULL, v_audio_mastery);
  END IF;

  IF NOT v_has_text AND NOT v_has_audio THEN
    INSERT INTO student_events (student_id, teacher_id, event_type, event_source, source_id, event_payload, skill_ids, element_type, session_id, mastery)
    VALUES (v_student_id, v_teacher_id, v_event_type, 'homework', NEW.homework_id,
      jsonb_build_object('answer_id', NEW.id, 'exercise_index', NEW.exercise_index, 'exercise_type', NEW.exercise_type, 'response_type', 'empty', 'is_submitted', NEW.is_submitted, 'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1), 'nano_skill_ratings', '[]'::jsonb),
      NULL, NEW.exercise_type, NULL, NULL);
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
