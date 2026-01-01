-- PROBLEM 6 FIX: Napraw DEFAULT dla created_at w student_events
-- Zmień z błędnego (now() AT TIME ZONE 'Europe/Warsaw') na poprawne now() (UTC)
ALTER TABLE public.student_events 
ALTER COLUMN created_at SET DEFAULT now();

-- PROBLEM 2 (Homework) + PROBLEM 1 (Worksheet): Dodaj time_spent_seconds do event payloads
-- Zaktualizuj trigger homework aby zawierał time_spent_seconds i is_correct z ai_evaluation

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
  v_time_spent_seconds INT;
  v_is_correct BOOLEAN;
BEGIN
  -- ONLY generate events when is_submitted changes from false to true
  IF NEW.is_submitted = true AND (OLD IS NULL OR OLD.is_submitted = false) THEN
    -- Get student_id and teacher_id from homework_assignments
    SELECT ha.student_id, ha.teacher_id
    INTO v_student_id, v_teacher_id
    FROM public.homework_assignments ha
    WHERE ha.id = NEW.homework_id;
    
    -- Calculate time_spent_seconds from started_at to submitted_at
    IF NEW.submitted_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
      v_time_spent_seconds := EXTRACT(EPOCH FROM (NEW.submitted_at - NEW.started_at))::INT;
    ELSE
      v_time_spent_seconds := NULL;
    END IF;
    
    -- Get is_correct from ai_evaluation if exists
    IF NEW.ai_evaluation IS NOT NULL AND NEW.ai_evaluation->>'is_acceptable' IS NOT NULL THEN
      v_is_correct := (NEW.ai_evaluation->>'is_acceptable')::BOOLEAN;
    ELSE
      v_is_correct := NULL;
    END IF;
    
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
          'answers', NEW.answers,
          'time_spent_seconds', v_time_spent_seconds,
          'is_correct', v_is_correct
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