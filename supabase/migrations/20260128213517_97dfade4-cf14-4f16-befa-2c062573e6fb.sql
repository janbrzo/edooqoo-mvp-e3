-- =====================================================
-- FIX PROBLEM 1 & 2: SQL Triggers using DELETE + INSERT pattern
-- (ON CONFLICT failed because no matching unique index exists)
-- =====================================================

-- Fix log_worksheet_answer_event - use DELETE + INSERT instead of ON CONFLICT
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
  -- Get student_id from students table
  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.student_email = NEW.student_email
  LIMIT 1;

  -- Get teacher_id from worksheets table
  SELECT w.user_id INTO v_teacher_id
  FROM public.worksheets w
  WHERE w.id = NEW.worksheet_id;

  IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
    -- DELETE existing event for this exercise (UPSERT pattern without ON CONFLICT)
    DELETE FROM public.student_events
    WHERE student_id = v_student_id
      AND source_id = NEW.worksheet_id
      AND event_type = 'worksheet_answer_saved'
      AND (event_payload->>'exercise_index')::INTEGER = NEW.exercise_index;
    
    -- INSERT new event
    INSERT INTO public.student_events (
      student_id, teacher_id, event_type, event_source, source_id, event_payload
    ) VALUES (
      v_student_id, v_teacher_id,
      'worksheet_answer_saved', 'worksheet', NEW.worksheet_id,
      jsonb_build_object(
        'answer_id', NEW.id,
        'exercise_index', NEW.exercise_index,
        'exercise_type', NEW.exercise_type,
        'answers', NEW.answers,
        'mastery', NEW.mastery,
        'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log worksheet answer event: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Fix log_homework_answer_event - use DELETE + INSERT instead of ON CONFLICT
CREATE OR REPLACE FUNCTION public.log_homework_answer_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
  v_mastery_value INTEGER;
BEGIN
  -- Get student_id from students table using email
  SELECT s.id, s.teacher_id INTO v_student_id, v_teacher_id
  FROM public.students s
  WHERE s.student_email = NEW.student_email
  LIMIT 1;

  IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
    -- Calculate mastery from is_correct if mastery column is null
    v_mastery_value := COALESCE(
      NEW.mastery,
      CASE 
        WHEN NEW.is_submitted AND NEW.ai_evaluation IS NOT NULL THEN
          ROUND((NEW.ai_evaluation->>'quality_score')::NUMERIC * 100)::INTEGER
        ELSE NULL
      END
    );
    
    -- DELETE existing event for this exercise (UPSERT pattern without ON CONFLICT)
    DELETE FROM public.student_events
    WHERE student_id = v_student_id
      AND source_id = NEW.homework_id
      AND event_type = 'homework_answer_submitted'
      AND (event_payload->>'exercise_index')::INTEGER = NEW.exercise_index;
    
    -- INSERT new event
    INSERT INTO public.student_events (
      student_id, teacher_id, event_type, event_source, source_id, event_payload
    ) VALUES (
      v_student_id, v_teacher_id,
      'homework_answer_submitted', 'homework', NEW.homework_id,
      jsonb_build_object(
        'answer_id', NEW.id,
        'exercise_index', NEW.exercise_index,
        'exercise_type', NEW.exercise_type,
        'answers', NEW.answers,
        'is_correct', CASE 
          WHEN NEW.ai_evaluation IS NOT NULL THEN (NEW.ai_evaluation->>'is_acceptable')::BOOLEAN
          ELSE NULL
        END,
        'mastery', v_mastery_value,
        'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log homework answer event: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update the AI evaluation trigger to also update mastery in the event
CREATE OR REPLACE FUNCTION public.update_homework_event_with_ai_evaluation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id UUID;
  v_mastery_value INTEGER;
BEGIN
  -- Only trigger if ai_evaluation changed from NULL to a value
  IF OLD.ai_evaluation IS NULL AND NEW.ai_evaluation IS NOT NULL THEN
    -- Get student_id
    SELECT s.id INTO v_student_id
    FROM public.students s
    WHERE s.student_email = NEW.student_email
    LIMIT 1;

    IF v_student_id IS NOT NULL THEN
      -- Calculate mastery from quality_score (0.0-1.0 -> 0-100)
      v_mastery_value := ROUND((NEW.ai_evaluation->>'quality_score')::NUMERIC * 100)::INTEGER;
      
      -- Update the event_payload with AI evaluation results including mastery
      UPDATE public.student_events
      SET event_payload = event_payload || jsonb_build_object(
        'is_correct', (NEW.ai_evaluation->>'is_acceptable')::BOOLEAN,
        'mastery', v_mastery_value,
        'ai_quality_score', (NEW.ai_evaluation->>'quality_score')::NUMERIC,
        'ai_feedback', NEW.ai_evaluation->>'feedback'
      )
      WHERE student_id = v_student_id
        AND source_id = NEW.homework_id
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

-- Ensure the trigger exists for AI evaluation updates
DROP TRIGGER IF EXISTS trigger_update_homework_ai_evaluation ON public.homework_student_answers;
CREATE TRIGGER trigger_update_homework_ai_evaluation
  AFTER UPDATE OF ai_evaluation ON public.homework_student_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_homework_event_with_ai_evaluation();

-- Update flashcard trigger to use mastery instead of is_correct/quality_rating
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
  v_mastery_value INTEGER;
BEGIN
  -- Get student_id and teacher_id from flashcard_sets
  SELECT fs.student_id, fs.teacher_id INTO v_student_id, v_teacher_id
  FROM public.flashcard_sets fs
  WHERE fs.id = NEW.set_id;

  -- Get card content
  SELECT fc.front_text, fc.back_text INTO v_card_front, v_card_back
  FROM public.flashcard_cards fc
  WHERE fc.id = NEW.card_id;

  IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
    -- Convert quality_rating to mastery: >= 2 means "I Know This" = 100%, otherwise 0%
    v_mastery_value := CASE 
      WHEN NEW.last_quality_rating >= 2 THEN 100
      ELSE 0
    END;
    
    INSERT INTO public.student_events (
      student_id, teacher_id, event_type, event_source, source_id, event_payload
    ) VALUES (
      v_student_id, v_teacher_id,
      'flashcard_review', 'flashcard', NEW.set_id,
      jsonb_build_object(
        'card_id', NEW.card_id,
        'set_id', NEW.set_id,
        'direction', NEW.direction,
        'card_front', v_card_front,
        'card_back', v_card_back,
        'mastery', v_mastery_value,
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