-- =====================================================
-- UJEDNOLICENIE MASTERY WE WSZYSTKICH EVENTACH DSLM
-- =====================================================

-- 1. Dodaj kolumnę mastery do worksheet_student_answers
ALTER TABLE public.worksheet_student_answers 
ADD COLUMN IF NOT EXISTS mastery INTEGER;

-- 2. Dodaj kolumnę mastery do homework_student_answers
ALTER TABLE public.homework_student_answers 
ADD COLUMN IF NOT EXISTS mastery INTEGER;

-- 3. Zaktualizuj save_worksheet_answer aby przyjmować p_mastery
CREATE OR REPLACE FUNCTION public.save_worksheet_answer(
    p_worksheet_id UUID,
    p_student_email TEXT,
    p_exercise_index INTEGER,
    p_exercise_type TEXT,
    p_answers JSONB,
    p_time_spent_ms INTEGER DEFAULT 0,
    p_mastery INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_answer_id UUID;
BEGIN
    INSERT INTO public.worksheet_student_answers (
        worksheet_id,
        student_email,
        exercise_index,
        exercise_type,
        answers,
        time_spent_ms,
        mastery,
        last_saved_at
    )
    VALUES (
        p_worksheet_id,
        LOWER(TRIM(p_student_email)),
        p_exercise_index,
        p_exercise_type,
        p_answers,
        p_time_spent_ms,
        p_mastery,
        NOW()
    )
    ON CONFLICT (worksheet_id, student_email, exercise_index)
    DO UPDATE SET
        answers = EXCLUDED.answers,
        exercise_type = EXCLUDED.exercise_type,
        time_spent_ms = EXCLUDED.time_spent_ms,
        mastery = EXCLUDED.mastery,
        last_saved_at = NOW()
    RETURNING id INTO v_answer_id;
    
    RETURN v_answer_id;
END;
$function$;

-- 4. Zaktualizuj save_homework_answer aby przyjmować p_mastery
CREATE OR REPLACE FUNCTION public.save_homework_answer(
    p_homework_id UUID,
    p_student_email TEXT,
    p_exercise_index INTEGER,
    p_exercise_type TEXT,
    p_answers JSONB,
    p_time_spent_ms INTEGER DEFAULT 0,
    p_mastery INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_answer_id UUID;
BEGIN
    INSERT INTO public.homework_student_answers (
        homework_id,
        student_email,
        exercise_index,
        exercise_type,
        answers,
        time_spent_ms,
        mastery,
        last_saved_at
    )
    VALUES (
        p_homework_id,
        LOWER(TRIM(p_student_email)),
        p_exercise_index,
        p_exercise_type,
        p_answers,
        p_time_spent_ms,
        p_mastery,
        NOW()
    )
    ON CONFLICT (homework_id, student_email, exercise_index)
    DO UPDATE SET
        answers = EXCLUDED.answers,
        exercise_type = EXCLUDED.exercise_type,
        time_spent_ms = EXCLUDED.time_spent_ms,
        mastery = EXCLUDED.mastery,
        last_saved_at = NOW()
    RETURNING id INTO v_answer_id;
    
    RETURN v_answer_id;
END;
$function$;

-- 5. Zaktualizuj log_worksheet_answer_event() - dodaj mastery do payload
CREATE OR REPLACE FUNCTION public.log_worksheet_answer_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
BEGIN
  -- Get student_id from students table using email
  SELECT s.id
  INTO v_student_id
  FROM public.students s
  WHERE s.student_email = NEW.student_email
  LIMIT 1;

  -- Get teacher_id from worksheets table
  SELECT w.user_id
  INTO v_teacher_id
  FROM public.worksheets w
  WHERE w.id = NEW.worksheet_id;

  -- Only log if we have valid IDs
  IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
    -- Use UPSERT to prevent duplicates for same worksheet+exercise
    INSERT INTO public.student_events (
      student_id,
      teacher_id,
      event_type,
      event_source,
      source_id,
      event_payload
    ) VALUES (
      v_student_id,
      v_teacher_id,
      'worksheet_answer_saved',
      'worksheet',
      NEW.worksheet_id,
      jsonb_build_object(
        'answer_id', NEW.id,
        'exercise_index', NEW.exercise_index,
        'exercise_type', NEW.exercise_type,
        'answers', NEW.answers,
        'mastery', NEW.mastery,
        'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
      )
    )
    ON CONFLICT (student_id, source_id, event_type, (event_payload->>'exercise_index'))
    DO UPDATE SET
      event_payload = jsonb_build_object(
        'answer_id', NEW.id,
        'exercise_index', NEW.exercise_index,
        'exercise_type', NEW.exercise_type,
        'answers', NEW.answers,
        'mastery', NEW.mastery,
        'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
      ),
      created_at = NOW();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log worksheet answer event: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- 6. Zaktualizuj log_homework_answer_event() - dodaj mastery do payload
CREATE OR REPLACE FUNCTION public.log_homework_answer_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
BEGIN
  -- Get student_id from students table using email
  SELECT s.id
  INTO v_student_id
  FROM public.students s
  WHERE s.student_email = NEW.student_email
  LIMIT 1;

  -- Get teacher_id from homework_assignments table
  SELECT ha.teacher_id
  INTO v_teacher_id
  FROM public.homework_assignments ha
  WHERE ha.id = NEW.homework_id;

  -- Only log if we have valid IDs
  IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
    -- Use UPSERT to prevent duplicates
    INSERT INTO public.student_events (
      student_id,
      teacher_id,
      event_type,
      event_source,
      source_id,
      event_payload
    ) VALUES (
      v_student_id,
      v_teacher_id,
      'homework_answer_submitted',
      'homework',
      NEW.homework_id,
      jsonb_build_object(
        'answer_id', NEW.id,
        'exercise_index', NEW.exercise_index,
        'exercise_type', NEW.exercise_type,
        'answers', NEW.answers,
        'mastery', NEW.mastery,
        'is_correct', NEW.ai_evaluation->>'is_acceptable',
        'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
      )
    )
    ON CONFLICT (student_id, source_id, event_type, (event_payload->>'exercise_index'))
    DO UPDATE SET
      event_payload = jsonb_build_object(
        'answer_id', NEW.id,
        'exercise_index', NEW.exercise_index,
        'exercise_type', NEW.exercise_type,
        'answers', NEW.answers,
        'mastery', NEW.mastery,
        'is_correct', NEW.ai_evaluation->>'is_acceptable',
        'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
      ),
      created_at = NOW();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log homework answer event: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- 7. Zaktualizuj log_flashcard_review_event() - zamień is_correct/quality_rating na mastery
CREATE OR REPLACE FUNCTION public.log_flashcard_review_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
  v_card_front TEXT;
  v_card_back TEXT;
  v_set_id UUID;
BEGIN
  -- Get set_id and card details
  SELECT fc.set_id, fc.front_text, fc.back_text
  INTO v_set_id, v_card_front, v_card_back
  FROM public.flashcard_cards fc
  WHERE fc.id = NEW.card_id;

  -- Get teacher_id from flashcard_sets
  IF v_set_id IS NOT NULL THEN
    SELECT fs.teacher_id
    INTO v_teacher_id
    FROM public.flashcard_sets fs
    WHERE fs.id = v_set_id;
  END IF;

  -- Get student_id from students table using learner_identifier (email)
  SELECT s.id
  INTO v_student_id
  FROM public.students s
  WHERE s.student_email = NEW.learner_identifier
  LIMIT 1;

  -- Only log if we have valid IDs
  IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
    INSERT INTO public.student_events (
      student_id,
      teacher_id,
      event_type,
      event_source,
      source_id,
      event_payload
    ) VALUES (
      v_student_id,
      v_teacher_id,
      'flashcard_review',
      'flashcards',
      NEW.set_id,
      jsonb_build_object(
        'card_id', NEW.card_id,
        'set_id', NEW.set_id,
        'direction', NEW.direction,
        'card_front', v_card_front,
        'card_back', v_card_back,
        'mastery', CASE 
          WHEN NEW.last_quality_rating >= 2 THEN 100  -- "I Know This"
          ELSE 0                                       -- "Again"
        END,
        'easiness_factor', NEW.easiness_factor,
        'repetition', NEW.repetition,
        'interval_days', NEW.interval_days,
        'total_reviews', NEW.total_reviews,
        'time_spent_seconds', ROUND(COALESCE(NEW.last_response_time_ms, 0) / 1000.0, 1)
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log flashcard review event: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- 8. Zaktualizuj update_homework_event_with_ai_evaluation() - dodaj mastery = quality_score * 100
CREATE OR REPLACE FUNCTION public.update_homework_event_with_ai_evaluation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id UUID;
  v_quality_score NUMERIC;
  v_mastery INTEGER;
BEGIN
  -- Only process if ai_evaluation was updated
  IF NEW.ai_evaluation IS NOT NULL AND (OLD.ai_evaluation IS NULL OR NEW.ai_evaluation IS DISTINCT FROM OLD.ai_evaluation) THEN
    -- Get student_id from students table
    SELECT s.id
    INTO v_student_id
    FROM public.students s
    WHERE s.student_email = NEW.student_email
    LIMIT 1;
    
    -- Extract quality_score and convert to mastery (0-100)
    v_quality_score := (NEW.ai_evaluation->>'quality_score')::NUMERIC;
    v_mastery := ROUND(COALESCE(v_quality_score, 0) * 100);
    
    -- Also update the mastery column in the answers table
    UPDATE public.homework_student_answers
    SET mastery = v_mastery
    WHERE id = NEW.id;

    IF v_student_id IS NOT NULL THEN
      -- Update existing event with AI evaluation data including mastery
      UPDATE public.student_events
      SET event_payload = event_payload || jsonb_build_object(
        'is_correct', NEW.ai_evaluation->>'is_acceptable',
        'ai_feedback', NEW.ai_evaluation->>'feedback',
        'quality_score', NEW.ai_evaluation->>'quality_score',
        'mastery', v_mastery
      )
      WHERE source_id = NEW.homework_id
        AND student_id = v_student_id
        AND event_type = 'homework_answer_submitted'
        AND (event_payload->>'exercise_index')::INTEGER = NEW.exercise_index;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to update homework event with AI evaluation: %', SQLERRM;
    RETURN NEW;
END;
$function$;