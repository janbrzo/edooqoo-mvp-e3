
-- Fix add_student_event to auto-extract mastery from nano_skill_ratings and is_correct
CREATE OR REPLACE FUNCTION public.add_student_event(
  p_student_id uuid, p_teacher_id uuid, p_event_type text, p_event_source text,
  p_source_id uuid DEFAULT NULL, p_event_payload jsonb DEFAULT '{}'::jsonb,
  p_skill_ids text[] DEFAULT NULL, p_element_type text DEFAULT NULL,
  p_session_id text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_event_id UUID;
  v_mastery numeric;
BEGIN
  -- Auto-extract mastery from nano_skill_ratings if present and has values
  IF p_event_payload ? 'nano_skill_ratings' 
     AND jsonb_array_length(p_event_payload->'nano_skill_ratings') > 0 THEN
    SELECT ROUND(AVG((elem->>'mastery')::numeric))
    INTO v_mastery
    FROM jsonb_array_elements(p_event_payload->'nano_skill_ratings') AS elem
    WHERE elem->>'mastery' IS NOT NULL
      AND (elem->>'mastery')::numeric >= 0
      AND (elem ? 'hasValue' AND (elem->>'hasValue')::boolean = true);
  END IF;

  -- Fallback: extract from is_correct for simple MC questions  
  IF v_mastery IS NULL AND p_event_payload ? 'is_correct' AND (p_event_payload->>'is_correct') IS NOT NULL THEN
    v_mastery := CASE 
      WHEN (p_event_payload->>'is_correct')::boolean = true THEN 100
      WHEN (p_event_payload->>'is_correct')::boolean = false THEN 0
      ELSE NULL
    END;
  END IF;

  INSERT INTO public.student_events (
    student_id, teacher_id, event_type, event_source,
    source_id, event_payload, skill_ids, element_type,
    session_id, mastery
  ) VALUES (
    p_student_id, p_teacher_id, p_event_type, p_event_source,
    p_source_id, p_event_payload, p_skill_ids, p_element_type,
    p_session_id, v_mastery
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Backfill existing NULL mastery for welcome_test MC questions
UPDATE student_events SET mastery = 100
WHERE event_source = 'welcome_test' AND mastery IS NULL
  AND skill_ids IS NOT NULL AND array_length(skill_ids, 1) > 0
  AND event_payload->>'is_correct' = 'true';

UPDATE student_events SET mastery = 0
WHERE event_source = 'welcome_test' AND mastery IS NULL
  AND skill_ids IS NOT NULL AND array_length(skill_ids, 1) > 0
  AND event_payload->>'is_correct' = 'false';
