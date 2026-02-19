
-- PROBLEM 6: Add speaking_score column to student_learning_profiles
ALTER TABLE public.student_learning_profiles 
ADD COLUMN IF NOT EXISTS speaking_score numeric NULL;

-- PROBLEM 3: Fix trigger to skip welcome tests (frontend handles with richer payload)
CREATE OR REPLACE FUNCTION public.log_test_answer_event()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
  v_test_type TEXT;
BEGIN
  IF NEW.student_answer IS NOT NULL AND (OLD IS NULL OR OLD.student_answer IS NULL) THEN
    SELECT st.student_id, st.teacher_id, st.test_type
    INTO v_student_id, v_teacher_id, v_test_type
    FROM public.student_tests st
    WHERE st.id = NEW.test_id;
    
    -- Skip welcome tests - frontend handles event logging with richer payload
    IF v_test_type = 'welcome' THEN
      RETURN NEW;
    END IF;
    
    IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
      INSERT INTO public.student_events (
        student_id,
        teacher_id,
        event_type,
        event_source,
        source_id,
        element_type,
        event_payload
      ) VALUES (
        v_student_id,
        v_teacher_id,
        'test_answer_submitted',
        'test',
        NEW.test_id,
        NEW.element_type,
        jsonb_build_object(
          'question_index', NEW.question_index,
          'question_type', NEW.question_type,
          'is_correct', NEW.is_correct,
          'time_spent_seconds', NEW.time_spent_seconds
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- PROBLEM 3: Delete duplicate events with event_source='test' for welcome tests
DELETE FROM public.student_events 
WHERE event_source = 'test' 
AND event_type = 'test_answer_submitted'
AND source_id IN (SELECT id FROM public.student_tests WHERE test_type = 'welcome');
