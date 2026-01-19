-- ETAP 1: Usuń istniejącą funkcję add_student_event (wszystkie sygnatury)
DROP FUNCTION IF EXISTS public.add_student_event(uuid, uuid, text, text, uuid, jsonb, uuid[], text, text);
DROP FUNCTION IF EXISTS public.add_student_event(uuid, uuid, text, text, uuid, jsonb, text[], text, text);

-- ETAP 2: Zmień typ kolumny skill_ids z uuid[] na text[]
ALTER TABLE public.student_events 
ALTER COLUMN skill_ids TYPE text[] 
USING skill_ids::text[];

-- ETAP 3: Utwórz nową funkcję RPC z parametrem text[] zamiast uuid[]
CREATE OR REPLACE FUNCTION public.add_student_event(
  p_student_id uuid,
  p_teacher_id uuid,
  p_event_type text,
  p_event_source text,
  p_source_id uuid DEFAULT NULL,
  p_event_payload jsonb DEFAULT '{}'::jsonb,
  p_skill_ids text[] DEFAULT NULL,
  p_element_type text DEFAULT NULL,
  p_session_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.student_events (
    student_id,
    teacher_id,
    event_type,
    event_source,
    source_id,
    event_payload,
    skill_ids,
    element_type,
    session_id
  )
  VALUES (
    p_student_id,
    p_teacher_id,
    p_event_type,
    p_event_source,
    p_source_id,
    p_event_payload,
    p_skill_ids,
    p_element_type,
    p_session_id
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;