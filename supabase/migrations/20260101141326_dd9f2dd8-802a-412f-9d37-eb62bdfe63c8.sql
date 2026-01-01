-- PROBLEM 1 FIX: Update worksheet event trigger to use UPSERT instead of INSERT
-- This ensures only ONE event per worksheet + exercise_index combination (always with latest data)

-- First, drop the existing trigger
DROP TRIGGER IF EXISTS trigger_log_worksheet_answer_event ON public.worksheet_student_answers;

-- Create improved trigger function that uses UPSERT (update existing or insert new)
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
          'answers', NEW.answers
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
          'answers', NEW.answers
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

-- Recreate the trigger
CREATE TRIGGER trigger_log_worksheet_answer_event
  AFTER INSERT OR UPDATE ON public.worksheet_student_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_worksheet_answer_event();

-- PROBLEM 5 FIX: Add response_time_ms column to flashcard_progress for tracking
ALTER TABLE public.flashcard_progress 
ADD COLUMN IF NOT EXISTS last_response_time_ms INTEGER;

-- Update flashcard trigger to include response_time_ms from the new column
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
        'card_back', v_card_back,
        'response_time_ms', NEW.last_response_time_ms
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