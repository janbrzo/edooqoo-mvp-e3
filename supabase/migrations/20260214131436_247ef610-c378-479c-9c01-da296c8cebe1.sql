-- Add ai_summary column to student_learning_profiles for Welcome Test AI analysis
ALTER TABLE public.student_learning_profiles 
ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Add answered_count to student_tests for persisting completion stats
ALTER TABLE public.student_tests
ADD COLUMN IF NOT EXISTS answered_count INTEGER DEFAULT 0;