-- Problem 1: Add last_quality_rating column to flashcard_progress
ALTER TABLE public.flashcard_progress 
ADD COLUMN IF NOT EXISTS last_quality_rating INTEGER;

-- Update the trigger to include quality_rating in event payload
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
        'quality_rating', NEW.last_quality_rating,
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