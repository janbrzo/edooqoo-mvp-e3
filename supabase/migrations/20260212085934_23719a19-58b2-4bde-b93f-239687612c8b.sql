
CREATE TABLE public.teacher_ai_eval_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES auth.users(id),
  worksheet_id UUID NOT NULL,
  exercise_index INTEGER NOT NULL,
  question_index INTEGER NOT NULL,
  exercise_type TEXT NOT NULL,
  quality_score NUMERIC,
  thumbs_up BOOLEAN NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.teacher_ai_eval_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage own feedback" ON public.teacher_ai_eval_feedback
  FOR ALL USING (auth.uid() = teacher_id);
