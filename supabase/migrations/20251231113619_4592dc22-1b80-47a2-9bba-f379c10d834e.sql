-- Dodanie kolumny ai_evaluation do homework_student_answers
-- Przechowuje wyniki AI oceny pytań otwartych

ALTER TABLE public.homework_student_answers 
ADD COLUMN IF NOT EXISTS ai_evaluation JSONB DEFAULT NULL;

-- Komentarz opisujący strukturę JSONB:
-- {
--   "evaluated_at": "ISO timestamp",
--   "model": "google/gemini-2.5-flash",
--   "evaluations": [
--     {
--       "question_index": 0,
--       "quality_score": 0.85,
--       "is_acceptable": true,
--       "feedback": "Good answer covering main points"
--     }
--   ]
-- }

COMMENT ON COLUMN public.homework_student_answers.ai_evaluation IS 'AI evaluation results for open-ended answers (DSLM diagnostic data)';