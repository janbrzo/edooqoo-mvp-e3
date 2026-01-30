-- ============================================
-- PROBLEM 1: Add item_evaluations column for per-item nano_skill_ratings
-- ============================================

-- Add column to worksheet_student_answers
ALTER TABLE public.worksheet_student_answers 
ADD COLUMN IF NOT EXISTS item_evaluations JSONB;

-- Add column to homework_student_answers  
ALTER TABLE public.homework_student_answers 
ADD COLUMN IF NOT EXISTS item_evaluations JSONB;

-- ============================================
-- Update save_worksheet_answer function to accept p_item_evaluations
-- ============================================
CREATE OR REPLACE FUNCTION public.save_worksheet_answer(
    p_worksheet_id UUID,
    p_student_email TEXT,
    p_exercise_index INTEGER,
    p_exercise_type TEXT,
    p_answers JSONB,
    p_time_spent_ms INTEGER DEFAULT 0,
    p_mastery INTEGER DEFAULT NULL,
    p_item_evaluations JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_answer_id UUID;
BEGIN
    INSERT INTO public.worksheet_student_answers (
        worksheet_id,
        student_email,
        exercise_index,
        exercise_type,
        answers,
        time_spent_ms,
        mastery,
        item_evaluations,
        is_completed,
        started_at,
        last_saved_at
    )
    VALUES (
        p_worksheet_id,
        LOWER(TRIM(p_student_email)),
        p_exercise_index,
        p_exercise_type,
        p_answers,
        p_time_spent_ms,
        p_mastery,
        p_item_evaluations,
        TRUE,
        NOW(),
        NOW()
    )
    ON CONFLICT (worksheet_id, student_email, exercise_index)
    DO UPDATE SET
        answers = EXCLUDED.answers,
        exercise_type = EXCLUDED.exercise_type,
        time_spent_ms = EXCLUDED.time_spent_ms,
        mastery = EXCLUDED.mastery,
        item_evaluations = EXCLUDED.item_evaluations,
        last_saved_at = NOW()
    RETURNING id INTO v_answer_id;
    
    RETURN v_answer_id;
END;
$$;

-- ============================================
-- Update save_homework_answer function to accept p_item_evaluations
-- ============================================
CREATE OR REPLACE FUNCTION public.save_homework_answer(
    p_homework_id UUID,
    p_student_email TEXT,
    p_exercise_index INTEGER,
    p_exercise_type TEXT,
    p_answers JSONB,
    p_time_spent_ms INTEGER DEFAULT 0,
    p_mastery INTEGER DEFAULT NULL,
    p_item_evaluations JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_answer_id UUID;
BEGIN
    INSERT INTO public.homework_student_answers (
        homework_id,
        student_email,
        exercise_index,
        exercise_type,
        answers,
        time_spent_ms,
        mastery,
        item_evaluations,
        is_submitted,
        started_at,
        last_saved_at
    )
    VALUES (
        p_homework_id,
        LOWER(TRIM(p_student_email)),
        p_exercise_index,
        p_exercise_type,
        p_answers,
        p_time_spent_ms,
        p_mastery,
        p_item_evaluations,
        FALSE,
        NOW(),
        NOW()
    )
    ON CONFLICT (homework_id, student_email, exercise_index)
    DO UPDATE SET
        answers = EXCLUDED.answers,
        exercise_type = EXCLUDED.exercise_type,
        time_spent_ms = EXCLUDED.time_spent_ms,
        mastery = EXCLUDED.mastery,
        item_evaluations = EXCLUDED.item_evaluations,
        last_saved_at = NOW()
    RETURNING id INTO v_answer_id;
    
    RETURN v_answer_id;
END;
$$;

-- ============================================
-- Replace trigger function for worksheet_student_answers to include nano_skill_ratings
-- ============================================
CREATE OR REPLACE FUNCTION public.log_worksheet_answer_to_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id UUID;
    v_teacher_id UUID;
BEGIN
    -- Get student_id and teacher_id from worksheet
    SELECT w.student_id, p.id INTO v_student_id, v_teacher_id
    FROM public.worksheets w
    JOIN public.profiles p ON p.id = w.user_id
    WHERE w.id = NEW.worksheet_id;
    
    -- Skip if no student_id (worksheet not assigned to student)
    IF v_student_id IS NULL OR v_teacher_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Delete existing event for this exercise to prevent duplicates (upsert pattern)
    DELETE FROM public.student_events
    WHERE student_id = v_student_id
      AND source_id = NEW.worksheet_id
      AND event_source = 'worksheet_answer_saved'
      AND (event_payload->>'exercise_index')::integer = NEW.exercise_index;
    
    -- Insert new event with nano_skill_ratings from item_evaluations
    INSERT INTO public.student_events (
        student_id,
        teacher_id,
        event_type,
        event_source,
        source_id,
        event_payload
    )
    VALUES (
        v_student_id,
        v_teacher_id,
        'learning_activity',
        'worksheet_answer_saved',
        NEW.worksheet_id,
        jsonb_build_object(
            'answer_id', NEW.id,
            'exercise_index', NEW.exercise_index,
            'exercise_type', NEW.exercise_type,
            'answers', NEW.answers,
            'mastery', NEW.mastery,
            'nano_skill_ratings', COALESCE(NEW.item_evaluations, '[]'::jsonb),
            'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
        )
    );
    
    RETURN NEW;
END;
$$;

-- ============================================
-- Replace trigger function for homework_student_answers to include nano_skill_ratings
-- ============================================
CREATE OR REPLACE FUNCTION public.log_homework_answer_to_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id UUID;
    v_teacher_id UUID;
BEGIN
    -- Get student_id and teacher_id from homework assignment
    SELECT ha.student_id, ha.teacher_id INTO v_student_id, v_teacher_id
    FROM public.homework_assignments ha
    WHERE ha.id = NEW.homework_id;
    
    -- Skip if no student_id
    IF v_student_id IS NULL OR v_teacher_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Only log when homework is submitted
    IF NEW.is_submitted = TRUE AND (OLD IS NULL OR OLD.is_submitted = FALSE) THEN
        -- Delete existing event for this exercise to prevent duplicates (upsert pattern)
        DELETE FROM public.student_events
        WHERE student_id = v_student_id
          AND source_id = NEW.homework_id
          AND event_source = 'homework_answer_submitted'
          AND (event_payload->>'exercise_index')::integer = NEW.exercise_index;
        
        -- Insert new event with nano_skill_ratings from item_evaluations
        INSERT INTO public.student_events (
            student_id,
            teacher_id,
            event_type,
            event_source,
            source_id,
            event_payload
        )
        VALUES (
            v_student_id,
            v_teacher_id,
            'learning_activity',
            'homework_answer_submitted',
            NEW.homework_id,
            jsonb_build_object(
                'answer_id', NEW.id,
                'exercise_index', NEW.exercise_index,
                'exercise_type', NEW.exercise_type,
                'answers', NEW.answers,
                'mastery', NEW.mastery,
                'nano_skill_ratings', COALESCE(NEW.item_evaluations, '[]'::jsonb),
                'is_correct', CASE WHEN NEW.mastery IS NOT NULL AND NEW.mastery >= 50 THEN TRUE ELSE NULL END,
                'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Ensure triggers exist
DROP TRIGGER IF EXISTS trg_worksheet_answer_to_events ON public.worksheet_student_answers;
CREATE TRIGGER trg_worksheet_answer_to_events
    AFTER INSERT OR UPDATE ON public.worksheet_student_answers
    FOR EACH ROW
    EXECUTE FUNCTION public.log_worksheet_answer_to_events();

DROP TRIGGER IF EXISTS trg_homework_answer_to_events ON public.homework_student_answers;
CREATE TRIGGER trg_homework_answer_to_events
    AFTER INSERT OR UPDATE ON public.homework_student_answers
    FOR EACH ROW
    EXECUTE FUNCTION public.log_homework_answer_to_events();