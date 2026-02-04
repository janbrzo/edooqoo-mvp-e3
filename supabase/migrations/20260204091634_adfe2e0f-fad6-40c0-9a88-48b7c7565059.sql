-- Create table for pending AI evaluations (async processing on tab close)
CREATE TABLE IF NOT EXISTS public.pending_worksheet_ai_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id UUID NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL,
  exercise_index INTEGER NOT NULL,
  exercise_type TEXT NOT NULL,
  answers JSONB NOT NULL,
  english_level TEXT DEFAULT 'Intermediate',
  context JSONB, -- Additional context for AI (title, transcript, etc.)
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  
  UNIQUE(worksheet_id, student_email, exercise_index)
);

-- Index for fast pending lookup
CREATE INDEX idx_pending_ai_eval_status ON pending_worksheet_ai_evaluations(status) WHERE status = 'pending';

-- RLS Policies
ALTER TABLE pending_worksheet_ai_evaluations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert (for sendBeacon)
CREATE POLICY "Allow insert for pending evaluations"
ON pending_worksheet_ai_evaluations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Teachers can read pending for their worksheets
CREATE POLICY "Teachers can read pending for their worksheets"
ON pending_worksheet_ai_evaluations FOR SELECT
TO authenticated
USING (
  worksheet_id IN (
    SELECT id FROM worksheets WHERE teacher_id = auth.uid()
  )
);

-- Service role can update (for edge function)
CREATE POLICY "Service role can update pending"
ON pending_worksheet_ai_evaluations FOR UPDATE
USING (true);

-- RPC function to queue worksheet AI evaluation (for sendBeacon)
CREATE OR REPLACE FUNCTION public.queue_worksheet_ai_evaluation(
  p_worksheet_id UUID,
  p_student_email TEXT,
  p_exercise_index INTEGER,
  p_exercise_type TEXT,
  p_answers JSONB,
  p_english_level TEXT DEFAULT 'Intermediate',
  p_context JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO pending_worksheet_ai_evaluations (
    worksheet_id,
    student_email,
    exercise_index,
    exercise_type,
    answers,
    english_level,
    context,
    status
  )
  VALUES (
    p_worksheet_id,
    lower(p_student_email),
    p_exercise_index,
    p_exercise_type,
    p_answers,
    p_english_level,
    p_context,
    'pending'
  )
  ON CONFLICT (worksheet_id, student_email, exercise_index)
  DO UPDATE SET
    answers = EXCLUDED.answers,
    english_level = EXCLUDED.english_level,
    context = EXCLUDED.context,
    status = 'pending',
    created_at = NOW(),
    processed_at = NULL,
    error_message = NULL
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;