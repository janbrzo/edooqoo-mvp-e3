-- =====================================================
-- PROBLEM 1-3 FIX: DSLM Event Improvements
-- =====================================================

-- PROBLEM 1: Add time_spent_ms column to worksheet_student_answers
ALTER TABLE public.worksheet_student_answers 
ADD COLUMN IF NOT EXISTS time_spent_ms INTEGER DEFAULT 0;

-- PROBLEM 1: Update trigger to include time_spent_seconds in event_payload
CREATE OR REPLACE FUNCTION public.log_worksheet_answer_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
  v_existing_event_id UUID;
  v_internal_id TEXT;
BEGIN
  -- Get student_id and teacher_id from worksheets table
  SELECT w.student_id, w.teacher_id
  INTO v_student_id, v_teacher_id
  FROM public.worksheets w
  WHERE w.id = NEW.worksheet_id;
  
  -- Only log if we have valid student and teacher
  IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
    -- Create a unique internal ID for this worksheet + exercise combination
    v_internal_id := NEW.worksheet_id || '_ex_' || NEW.exercise_index;
    
    -- Check if event already exists for this worksheet + exercise
    SELECT id INTO v_existing_event_id
    FROM public.student_events
    WHERE source_id = NEW.worksheet_id
      AND event_type = 'worksheet_answer_saved'
      AND (event_payload->>'exercise_index')::int = NEW.exercise_index;
    
    IF v_existing_event_id IS NOT NULL THEN
      -- UPDATE existing event with new data (UPSERT pattern)
      UPDATE public.student_events
      SET 
        event_payload = jsonb_build_object(
          'exercise_index', NEW.exercise_index,
          'exercise_type', NEW.exercise_type,
          'answer_id', NEW.id,
          'answers', NEW.answers,
          'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
        ),
        created_at = NOW()
      WHERE id = v_existing_event_id;
    ELSE
      -- INSERT new event
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
          'exercise_index', NEW.exercise_index,
          'exercise_type', NEW.exercise_type,
          'answer_id', NEW.id,
          'answers', NEW.answers,
          'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log worksheet event: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- PROBLEM 2: Add time_spent_ms column to homework_student_answers
ALTER TABLE public.homework_student_answers 
ADD COLUMN IF NOT EXISTS time_spent_ms INTEGER DEFAULT 0;

-- PROBLEM 2: Create trigger to update student_events when ai_evaluation is updated
CREATE OR REPLACE FUNCTION public.update_homework_event_with_ai_evaluation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only if ai_evaluation changed and is not null
  IF NEW.ai_evaluation IS DISTINCT FROM OLD.ai_evaluation AND NEW.ai_evaluation IS NOT NULL THEN
    -- Update existing event in student_events with is_correct from ai_evaluation
    UPDATE public.student_events
    SET event_payload = event_payload || 
      jsonb_build_object(
        'is_correct', (NEW.ai_evaluation->>'is_acceptable')::BOOLEAN,
        'quality_score', (NEW.ai_evaluation->>'quality_score')::NUMERIC
      )
    WHERE source_id = NEW.homework_id
      AND event_type = 'homework_answer_submitted'
      AND (event_payload->>'exercise_index')::int = NEW.exercise_index;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for ai_evaluation updates (if not exists)
DROP TRIGGER IF EXISTS trigger_update_homework_ai_evaluation ON public.homework_student_answers;
CREATE TRIGGER trigger_update_homework_ai_evaluation
  AFTER UPDATE OF ai_evaluation ON public.homework_student_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_homework_event_with_ai_evaluation();

-- PROBLEM 3: Update flashcard_progress trigger to use time_spent_seconds instead of response_time_ms
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
        'is_correct', NEW.correct_count > COALESCE(OLD.correct_count, 0),
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

-- PROBLEM 2: Update homework answer event trigger to include time_spent_seconds
CREATE OR REPLACE FUNCTION public.log_homework_answer_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
  v_existing_event_id UUID;
BEGIN
  -- Get teacher_id and student_id from homework_assignments
  SELECT 
    ha.teacher_id,
    ha.student_id
  INTO v_teacher_id, v_student_id
  FROM public.homework_assignments ha
  WHERE ha.id = NEW.homework_id;

  -- Only log if we have valid IDs
  IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
    -- Check for existing event (UPSERT pattern)
    SELECT id INTO v_existing_event_id
    FROM public.student_events
    WHERE source_id = NEW.homework_id
      AND event_type = 'homework_answer_submitted'
      AND (event_payload->>'exercise_index')::int = NEW.exercise_index;
    
    IF v_existing_event_id IS NOT NULL THEN
      -- Update existing event
      UPDATE public.student_events
      SET event_payload = jsonb_build_object(
            'exercise_index', NEW.exercise_index,
            'exercise_type', NEW.exercise_type,
            'answer_id', NEW.id,
            'answers', NEW.answers,
            'is_correct', CASE 
              WHEN NEW.ai_evaluation IS NOT NULL THEN (NEW.ai_evaluation->>'is_acceptable')::BOOLEAN
              ELSE NULL 
            END,
            'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
          ),
          created_at = NOW()
      WHERE id = v_existing_event_id;
    ELSE
      -- Insert new event
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
          'exercise_index', NEW.exercise_index,
          'exercise_type', NEW.exercise_type,
          'answer_id', NEW.id,
          'answers', NEW.answers,
          'is_correct', CASE 
            WHEN NEW.ai_evaluation IS NOT NULL THEN (NEW.ai_evaluation->>'is_acceptable')::BOOLEAN
            ELSE NULL 
          END,
          'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
        )
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log homework answer event: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update save_worksheet_answer function to accept time_spent_ms parameter
CREATE OR REPLACE FUNCTION public.save_worksheet_answer(
    p_worksheet_id UUID,
    p_student_email TEXT,
    p_exercise_index INTEGER,
    p_exercise_type TEXT,
    p_answers JSONB,
    p_time_spent_ms INTEGER DEFAULT 0
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_answer_id UUID;
BEGIN
  -- Upsert the answer
  INSERT INTO public.worksheet_student_answers (
    worksheet_id,
    student_email,
    exercise_index,
    exercise_type,
    answers,
    time_spent_ms,
    last_saved_at
  ) VALUES (
    p_worksheet_id,
    LOWER(TRIM(p_student_email)),
    p_exercise_index,
    p_exercise_type,
    p_answers,
    p_time_spent_ms,
    NOW()
  )
  ON CONFLICT (worksheet_id, student_email, exercise_index)
  DO UPDATE SET
    answers = EXCLUDED.answers,
    time_spent_ms = EXCLUDED.time_spent_ms,
    last_saved_at = NOW()
  RETURNING id INTO v_answer_id;
  
  RETURN v_answer_id;
END;
$function$;

-- Update save_homework_answer function to accept time_spent_ms parameter
CREATE OR REPLACE FUNCTION public.save_homework_answer(
    p_homework_id UUID,
    p_student_email TEXT,
    p_exercise_index INTEGER,
    p_exercise_type TEXT,
    p_answers JSONB,
    p_time_spent_ms INTEGER DEFAULT 0
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_answer_id UUID;
BEGIN
  -- Upsert the answer
  INSERT INTO public.homework_student_answers (
    homework_id,
    student_email,
    exercise_index,
    exercise_type,
    answers,
    time_spent_ms,
    last_saved_at
  ) VALUES (
    p_homework_id,
    LOWER(TRIM(p_student_email)),
    p_exercise_index,
    p_exercise_type,
    p_answers,
    p_time_spent_ms,
    NOW()
  )
  ON CONFLICT (homework_id, student_email, exercise_index)
  DO UPDATE SET
    answers = EXCLUDED.answers,
    time_spent_ms = EXCLUDED.time_spent_ms,
    last_saved_at = NOW()
  RETURNING id INTO v_answer_id;
  
  RETURN v_answer_id;
END;
$function$;