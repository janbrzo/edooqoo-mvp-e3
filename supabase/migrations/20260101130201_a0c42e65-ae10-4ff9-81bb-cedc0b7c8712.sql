-- ============================================
-- DSLM Stage 1.2 Fixes - Multiple Issues
-- ============================================

-- PROBLEM 1: Add trigger for worksheet_student_answers to log events
-- ============================================
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
  -- Get student_id and teacher_id from worksheets table
  SELECT w.student_id, w.teacher_id
  INTO v_student_id, v_teacher_id
  FROM public.worksheets w
  WHERE w.id = NEW.worksheet_id;
  
  -- Only log if we have valid student and teacher
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
      'worksheet_answer_saved',
      'worksheet',
      NEW.worksheet_id,
      jsonb_build_object(
        'exercise_index', NEW.exercise_index,
        'exercise_type', NEW.exercise_type,
        'answer_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log worksheet event: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Create trigger for worksheet_student_answers (fires on INSERT and UPDATE)
DROP TRIGGER IF EXISTS trigger_log_worksheet_answer_event ON public.worksheet_student_answers;
CREATE TRIGGER trigger_log_worksheet_answer_event
  AFTER INSERT OR UPDATE ON public.worksheet_student_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_worksheet_answer_event();

-- PROBLEM 2: Fix duplicate homework events by adding deduplication check
-- ============================================
CREATE OR REPLACE FUNCTION public.log_homework_answer_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
  v_existing_event_count INT;
BEGIN
  -- ONLY generate events when is_submitted changes from false to true
  IF NEW.is_submitted = true AND (OLD IS NULL OR OLD.is_submitted = false) THEN
    -- Get student_id and teacher_id from homework_assignments
    SELECT ha.student_id, ha.teacher_id
    INTO v_student_id, v_teacher_id
    FROM public.homework_assignments ha
    WHERE ha.id = NEW.homework_id;
    
    -- Check for existing event with same homework_id + exercise_index in last 5 seconds (deduplication)
    SELECT COUNT(*) INTO v_existing_event_count
    FROM public.student_events
    WHERE source_id = NEW.homework_id
      AND event_type = 'homework_answer_submitted'
      AND (event_payload->>'exercise_index')::int = NEW.exercise_index
      AND created_at > (NOW() - INTERVAL '5 seconds');
    
    -- Only insert if no duplicate exists AND we have valid data
    IF v_existing_event_count = 0 AND v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
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
          'answers', NEW.answers
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log homework event: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- PROBLEM 4: Update flashcard_review event to include card content and response time
-- ============================================
CREATE OR REPLACE FUNCTION public.log_flashcard_review_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
  v_is_correct BOOLEAN;
  v_card_front TEXT;
  v_card_back TEXT;
BEGIN
  -- Get student_id and teacher_id from flashcard_sets
  SELECT fs.student_id, fs.teacher_id
  INTO v_student_id, v_teacher_id
  FROM public.flashcard_sets fs
  WHERE fs.id = NEW.set_id;
  
  -- Get card content
  SELECT fc.front_text, fc.back_text
  INTO v_card_front, v_card_back
  FROM public.flashcard_cards fc
  WHERE fc.id = NEW.card_id;
  
  -- Determine if answer was correct (correct_count increased)
  v_is_correct := (NEW.correct_count > COALESCE(OLD.correct_count, 0));
  
  -- Insert event only if we have data and this is an UPDATE (review)
  IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL AND TG_OP = 'UPDATE' THEN
    INSERT INTO public.student_events (
      student_id, 
      teacher_id, 
      event_type, 
      event_source, 
      source_id, 
      event_payload,
      element_type
    ) VALUES (
      v_student_id,
      v_teacher_id,
      'flashcard_review',
      'flashcard',
      NEW.card_id,
      jsonb_build_object(
        'set_id', NEW.set_id,
        'direction', NEW.direction,
        'is_correct', v_is_correct,
        'easiness_factor', NEW.easiness_factor,
        'repetition', NEW.repetition,
        'interval_days', NEW.interval_days,
        'total_reviews', NEW.total_reviews,
        'card_front', v_card_front,
        'card_back', v_card_back
      ),
      'vocabulary'
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log flashcard event: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- CLEANUP: Remove duplicate homework events (keep only the first one per homework + exercise_index)
-- ============================================
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY source_id, (event_payload->>'exercise_index')::int, DATE_TRUNC('second', created_at)
    ORDER BY id
  ) as rn
  FROM student_events
  WHERE event_type = 'homework_answer_submitted'
)
DELETE FROM student_events
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);