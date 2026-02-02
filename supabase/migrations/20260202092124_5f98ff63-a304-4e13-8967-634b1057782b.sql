-- ============================================
-- KROK 1: Usuń STARE triggery i funkcje (z CASCADE)
-- ============================================

-- Usuń stary trigger dla worksheet
DROP TRIGGER IF EXISTS trigger_log_worksheet_answer_event ON public.worksheet_student_answers;
DROP FUNCTION IF EXISTS public.log_worksheet_answer_event() CASCADE;

-- Usuń stary trigger dla homework - najpierw trigger, potem funkcja
DROP TRIGGER IF EXISTS trigger_log_homework_answer_event ON public.homework_student_answers;
DROP TRIGGER IF EXISTS homework_answer_event_trigger ON public.homework_student_answers;
DROP FUNCTION IF EXISTS public.log_homework_answer_event() CASCADE;

-- ============================================
-- KROK 2: Zaktualizuj funkcję worksheet - oczyszczony payload
-- ============================================

CREATE OR REPLACE FUNCTION public.log_worksheet_answer_to_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_teacher_id uuid;
    v_student_id uuid;
BEGIN
    -- Pobierz teacher_id i student_id z worksheet
    SELECT w.user_id, w.student_id INTO v_teacher_id, v_student_id
    FROM public.worksheets w
    WHERE w.id = NEW.worksheet_id;

    -- Jeśli brak danych - nie loguj
    IF v_teacher_id IS NULL OR v_student_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Usuń poprzedni event dla tego samego ćwiczenia (strategia DELETE + INSERT)
    DELETE FROM public.student_events 
    WHERE student_id = v_student_id 
      AND source_id = NEW.worksheet_id 
      AND event_type = 'learning_activity'
      AND event_source = 'worksheet_answer_saved'
      AND (event_payload->>'exercise_index')::int = NEW.exercise_index;

    -- Wstaw nowy event z OCZYSZCZONYM payloadem
    INSERT INTO public.student_events (
        student_id,
        teacher_id,
        event_type,
        event_source,
        source_id,
        element_type,
        event_payload,
        skill_ids,
        session_id
    )
    VALUES (
        v_student_id,
        v_teacher_id,
        'learning_activity',
        'worksheet_answer_saved',
        NEW.worksheet_id,
        NEW.exercise_type,
        jsonb_build_object(
            'answer_id', NEW.id,
            'exercise_index', NEW.exercise_index,
            'exercise_type', NEW.exercise_type,
            'nano_skill_ratings', COALESCE(NEW.item_evaluations, '[]'::jsonb),
            'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
        ),
        ARRAY(
            SELECT DISTINCT jsonb_array_elements(COALESCE(NEW.item_evaluations, '[]'::jsonb))->>'name'
        ),
        NULL
    );

    RETURN NEW;
END;
$$;

-- Upewnij się że trigger istnieje
DROP TRIGGER IF EXISTS trg_worksheet_answer_to_events ON public.worksheet_student_answers;

CREATE TRIGGER trg_worksheet_answer_to_events
AFTER INSERT OR UPDATE ON public.worksheet_student_answers
FOR EACH ROW
EXECUTE FUNCTION public.log_worksheet_answer_to_events();

-- ============================================
-- KROK 3: Zaktualizuj funkcję homework - oczyszczony payload
-- ============================================

CREATE OR REPLACE FUNCTION public.log_homework_answer_to_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_teacher_id uuid;
    v_student_id uuid;
BEGIN
    SELECT ha.teacher_id, ha.student_id INTO v_teacher_id, v_student_id
    FROM public.homework_assignments ha
    WHERE ha.id = NEW.homework_id;

    IF v_teacher_id IS NULL OR v_student_id IS NULL THEN
        RETURN NEW;
    END IF;

    DELETE FROM public.student_events 
    WHERE student_id = v_student_id 
      AND source_id = NEW.homework_id 
      AND event_type = 'learning_activity'
      AND event_source = 'homework_answer_saved'
      AND (event_payload->>'exercise_index')::int = NEW.exercise_index;

    INSERT INTO public.student_events (
        student_id,
        teacher_id,
        event_type,
        event_source,
        source_id,
        element_type,
        event_payload,
        skill_ids,
        session_id
    )
    VALUES (
        v_student_id,
        v_teacher_id,
        'learning_activity',
        'homework_answer_saved',
        NEW.homework_id,
        NEW.exercise_type,
        jsonb_build_object(
            'answer_id', NEW.id,
            'exercise_index', NEW.exercise_index,
            'exercise_type', NEW.exercise_type,
            'nano_skill_ratings', COALESCE(NEW.item_evaluations, '[]'::jsonb),
            'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1),
            'is_submitted', COALESCE(NEW.is_submitted, false)
        ),
        ARRAY(
            SELECT DISTINCT jsonb_array_elements(COALESCE(NEW.item_evaluations, '[]'::jsonb))->>'name'
        ),
        NULL
    );

    RETURN NEW;
END;
$$;

-- Upewnij się że trigger istnieje
DROP TRIGGER IF EXISTS trg_homework_answer_to_events ON public.homework_student_answers;

CREATE TRIGGER trg_homework_answer_to_events
AFTER INSERT OR UPDATE ON public.homework_student_answers
FOR EACH ROW
EXECUTE FUNCTION public.log_homework_answer_to_events();