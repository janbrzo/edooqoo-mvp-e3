-- ============================================
-- FAZA 1: Interactive Shared Worksheets - Database Schema
-- ============================================

-- 1. Add share_recipient_email column to worksheets table
ALTER TABLE public.worksheets 
ADD COLUMN IF NOT EXISTS share_recipient_email TEXT DEFAULT NULL;

-- 2. Create worksheet_student_answers table (analogous to homework_student_answers)
CREATE TABLE IF NOT EXISTS public.worksheet_student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worksheet_id UUID NOT NULL REFERENCES public.worksheets(id) ON DELETE CASCADE,
    student_email TEXT NOT NULL,
    exercise_index INTEGER NOT NULL,
    exercise_type TEXT NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ DEFAULT NULL,
    
    -- Unique constraint: one answer record per worksheet + email + exercise
    UNIQUE (worksheet_id, student_email, exercise_index)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_worksheet_student_answers_worksheet_id 
ON public.worksheet_student_answers(worksheet_id);

CREATE INDEX IF NOT EXISTS idx_worksheet_student_answers_student_email 
ON public.worksheet_student_answers(student_email);

CREATE INDEX IF NOT EXISTS idx_worksheet_student_answers_lookup 
ON public.worksheet_student_answers(worksheet_id, student_email);

-- 4. Enable Row Level Security
ALTER TABLE public.worksheet_student_answers ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - Allow public read/write for shared worksheet functionality
-- Students need to save answers without authentication
CREATE POLICY "Anyone can view worksheet answers" 
ON public.worksheet_student_answers 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert worksheet answers" 
ON public.worksheet_student_answers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update worksheet answers" 
ON public.worksheet_student_answers 
FOR UPDATE 
USING (true);

-- Teachers can delete answers for their worksheets
CREATE POLICY "Teachers can delete worksheet answers" 
ON public.worksheet_student_answers 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.worksheets w 
        WHERE w.id = worksheet_student_answers.worksheet_id 
        AND w.teacher_id = auth.uid()
    )
);

-- 6. Enable Realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.worksheet_student_answers;

-- 7. Create RPC function to verify student email for worksheet access
CREATE OR REPLACE FUNCTION public.verify_worksheet_student_email(
    p_worksheet_id UUID,
    p_email TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_student_email TEXT;
    v_share_recipient_email TEXT;
    v_student_id UUID;
BEGIN
    -- Get worksheet data
    SELECT 
        w.student_id,
        w.share_recipient_email,
        s.student_email
    INTO v_student_id, v_share_recipient_email, v_student_email
    FROM public.worksheets w
    LEFT JOIN public.students s ON w.student_id = s.id
    WHERE w.id = p_worksheet_id
    AND w.deleted_at IS NULL;
    
    -- Worksheet must have assigned student
    IF v_student_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Email matches if it's either:
    -- 1. The student's registered email from their profile
    -- 2. The share_recipient_email set by teacher in Share modal
    RETURN (
        (v_student_email IS NOT NULL AND lower(v_student_email) = lower(p_email))
        OR
        (v_share_recipient_email IS NOT NULL AND lower(v_share_recipient_email) = lower(p_email))
    );
END;
$$;

-- 8. Create RPC function to save worksheet answer
CREATE OR REPLACE FUNCTION public.save_worksheet_answer(
    p_worksheet_id UUID,
    p_student_email TEXT,
    p_exercise_index INTEGER,
    p_exercise_type TEXT,
    p_answers JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_answer_id UUID;
BEGIN
    -- Upsert: insert or update if exists
    INSERT INTO public.worksheet_student_answers (
        worksheet_id,
        student_email,
        exercise_index,
        exercise_type,
        answers,
        last_saved_at
    )
    VALUES (
        p_worksheet_id,
        lower(p_student_email),
        p_exercise_index,
        p_exercise_type,
        p_answers,
        NOW()
    )
    ON CONFLICT (worksheet_id, student_email, exercise_index)
    DO UPDATE SET
        answers = EXCLUDED.answers,
        last_saved_at = NOW()
    RETURNING id INTO v_answer_id;
    
    RETURN v_answer_id;
END;
$$;

-- 9. Create RPC function to get worksheet student answers
CREATE OR REPLACE FUNCTION public.get_worksheet_student_answers(
    p_worksheet_id UUID,
    p_student_email TEXT
) RETURNS TABLE (
    id UUID,
    exercise_index INTEGER,
    exercise_type TEXT,
    answers JSONB,
    is_completed BOOLEAN,
    started_at TIMESTAMPTZ,
    last_saved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wsa.id,
        wsa.exercise_index,
        wsa.exercise_type,
        wsa.answers,
        wsa.is_completed,
        wsa.started_at,
        wsa.last_saved_at,
        wsa.completed_at
    FROM public.worksheet_student_answers wsa
    WHERE wsa.worksheet_id = p_worksheet_id
    AND lower(wsa.student_email) = lower(p_student_email)
    ORDER BY wsa.exercise_index;
END;
$$;

-- 10. Create RPC function to get worksheet student answers for teacher (Realtime fallback)
CREATE OR REPLACE FUNCTION public.get_worksheet_live_answers(
    p_worksheet_id UUID
) RETURNS TABLE (
    id UUID,
    student_email TEXT,
    exercise_index INTEGER,
    exercise_type TEXT,
    answers JSONB,
    last_saved_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wsa.id,
        wsa.student_email,
        wsa.exercise_index,
        wsa.exercise_type,
        wsa.answers,
        wsa.last_saved_at
    FROM public.worksheet_student_answers wsa
    WHERE wsa.worksheet_id = p_worksheet_id
    ORDER BY wsa.exercise_index, wsa.last_saved_at DESC;
END;
$$;