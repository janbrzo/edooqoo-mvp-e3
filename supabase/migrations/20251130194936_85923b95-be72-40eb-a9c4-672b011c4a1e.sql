-- ============================================
-- FAZA 1: Interactive Worksheets - Database Schema
-- ============================================

-- Table: homework_student_answers
-- Stores student responses for homework exercises
CREATE TABLE IF NOT EXISTS public.homework_student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id UUID NOT NULL REFERENCES public.homework_assignments(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL,
  exercise_index INTEGER NOT NULL,
  exercise_type TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_submitted BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  
  -- Constraint: one answer record per homework + student + exercise
  UNIQUE(homework_id, student_email, exercise_index)
);

-- Table: homework_teacher_comments
-- Stores teacher feedback on student exercises
CREATE TABLE IF NOT EXISTS public.homework_teacher_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id UUID NOT NULL REFERENCES public.homework_assignments(id) ON DELETE CASCADE,
  exercise_index INTEGER NOT NULL,
  student_email TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id),
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_homework_student_answers_homework_id 
  ON public.homework_student_answers(homework_id);

CREATE INDEX IF NOT EXISTS idx_homework_student_answers_student_email 
  ON public.homework_student_answers(student_email);

CREATE INDEX IF NOT EXISTS idx_homework_student_answers_composite 
  ON public.homework_student_answers(homework_id, student_email);

CREATE INDEX IF NOT EXISTS idx_homework_teacher_comments_homework_id 
  ON public.homework_teacher_comments(homework_id);

CREATE INDEX IF NOT EXISTS idx_homework_teacher_comments_student_email 
  ON public.homework_teacher_comments(student_email);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.homework_student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_teacher_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Students can read their own answers
CREATE POLICY "Students can read their own answers"
  ON public.homework_student_answers
  FOR SELECT
  USING (true); -- Anyone can read (we verify email in application logic)

-- Policy: Students can insert their own answers
CREATE POLICY "Students can insert their own answers"
  ON public.homework_student_answers
  FOR INSERT
  WITH CHECK (true); -- Anyone can insert (we verify email in application logic)

-- Policy: Students can update their own answers
CREATE POLICY "Students can update their own answers"
  ON public.homework_student_answers
  FOR UPDATE
  USING (true); -- Anyone can update (we verify email in application logic)

-- Policy: Teachers can read all answers for their homework
CREATE POLICY "Teachers can read all answers"
  ON public.homework_student_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.homework_assignments ha
      WHERE ha.id = homework_student_answers.homework_id
        AND ha.teacher_id = auth.uid()
    )
  );

-- Policy: Teachers can read all comments
CREATE POLICY "Teachers can read comments"
  ON public.homework_teacher_comments
  FOR SELECT
  USING (auth.uid() = teacher_id);

-- Policy: Teachers can insert comments
CREATE POLICY "Teachers can insert comments"
  ON public.homework_teacher_comments
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

-- Policy: Teachers can update their own comments
CREATE POLICY "Teachers can update comments"
  ON public.homework_teacher_comments
  FOR UPDATE
  USING (auth.uid() = teacher_id);

-- Policy: Teachers can delete their own comments
CREATE POLICY "Teachers can delete comments"
  ON public.homework_teacher_comments
  FOR DELETE
  USING (auth.uid() = teacher_id);

-- ============================================
-- SQL HELPER FUNCTIONS
-- ============================================

-- Function: Get student homework answers
CREATE OR REPLACE FUNCTION public.get_student_homework_answers(
  p_homework_id UUID,
  p_student_email TEXT
)
RETURNS TABLE (
  id UUID,
  exercise_index INTEGER,
  exercise_type TEXT,
  answers JSONB,
  is_submitted BOOLEAN,
  started_at TIMESTAMPTZ,
  last_saved_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hsa.id,
    hsa.exercise_index,
    hsa.exercise_type,
    hsa.answers,
    hsa.is_submitted,
    hsa.started_at,
    hsa.last_saved_at,
    hsa.submitted_at
  FROM public.homework_student_answers hsa
  WHERE hsa.homework_id = p_homework_id
    AND hsa.student_email = p_student_email
  ORDER BY hsa.exercise_index;
END;
$$;

-- Function: Save homework answer (upsert)
CREATE OR REPLACE FUNCTION public.save_homework_answer(
  p_homework_id UUID,
  p_student_email TEXT,
  p_exercise_index INTEGER,
  p_exercise_type TEXT,
  p_answers JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_answer_id UUID;
BEGIN
  -- Upsert: insert or update if exists
  INSERT INTO public.homework_student_answers (
    homework_id,
    student_email,
    exercise_index,
    exercise_type,
    answers,
    last_saved_at
  )
  VALUES (
    p_homework_id,
    p_student_email,
    p_exercise_index,
    p_exercise_type,
    p_answers,
    NOW()
  )
  ON CONFLICT (homework_id, student_email, exercise_index)
  DO UPDATE SET
    answers = EXCLUDED.answers,
    last_saved_at = NOW()
  RETURNING id INTO v_answer_id;
  
  RETURN v_answer_id;
END;
$$;

-- Function: Submit homework answers
CREATE OR REPLACE FUNCTION public.submit_homework_answers(
  p_homework_id UUID,
  p_student_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark all answers as submitted
  UPDATE public.homework_student_answers
  SET 
    is_submitted = true,
    submitted_at = NOW()
  WHERE homework_id = p_homework_id
    AND student_email = p_student_email
    AND is_submitted = false;
  
  RETURN FOUND;
END;
$$;

-- Function: Get homework comments for teacher
CREATE OR REPLACE FUNCTION public.get_homework_comments(
  p_homework_id UUID,
  p_student_email TEXT
)
RETURNS TABLE (
  id UUID,
  exercise_index INTEGER,
  comment_text TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    htc.id,
    htc.exercise_index,
    htc.comment_text,
    htc.created_at,
    htc.updated_at
  FROM public.homework_teacher_comments htc
  WHERE htc.homework_id = p_homework_id
    AND htc.student_email = p_student_email
  ORDER BY htc.exercise_index;
END;
$$;

-- Function: Add or update teacher comment
CREATE OR REPLACE FUNCTION public.save_teacher_comment(
  p_homework_id UUID,
  p_exercise_index INTEGER,
  p_student_email TEXT,
  p_teacher_id UUID,
  p_comment_text TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comment_id UUID;
BEGIN
  -- Check if comment already exists for this teacher/homework/exercise/student
  SELECT id INTO v_comment_id
  FROM public.homework_teacher_comments
  WHERE homework_id = p_homework_id
    AND exercise_index = p_exercise_index
    AND student_email = p_student_email
    AND teacher_id = p_teacher_id;
  
  IF v_comment_id IS NOT NULL THEN
    -- Update existing comment
    UPDATE public.homework_teacher_comments
    SET 
      comment_text = p_comment_text,
      updated_at = NOW()
    WHERE id = v_comment_id;
  ELSE
    -- Insert new comment
    INSERT INTO public.homework_teacher_comments (
      homework_id,
      exercise_index,
      student_email,
      teacher_id,
      comment_text
    )
    VALUES (
      p_homework_id,
      p_exercise_index,
      p_student_email,
      p_teacher_id,
      p_comment_text
    )
    RETURNING id INTO v_comment_id;
  END IF;
  
  RETURN v_comment_id;
END;
$$;