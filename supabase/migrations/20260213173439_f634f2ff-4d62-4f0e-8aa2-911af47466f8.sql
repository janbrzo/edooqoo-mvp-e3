
-- Create student_learning_profiles table for Welcome Test results
CREATE TABLE public.student_learning_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  welcome_test_id UUID REFERENCES public.student_tests(id),
  
  -- Level assessment
  estimated_level TEXT,
  self_assessed_level TEXT,
  level_confidence TEXT CHECK (level_confidence IN ('overestimates', 'accurate', 'underestimates')),
  
  -- Motivation & personality
  motivation_type TEXT CHECK (motivation_type IN ('instrumental', 'integrative', 'mixed')),
  anxiety_level TEXT CHECK (anxiety_level IN ('low', 'medium', 'high')),
  ambiguity_tolerance TEXT CHECK (ambiguity_tolerance IN ('low', 'medium', 'high')),
  error_attitude TEXT CHECK (error_attitude IN ('comfortable', 'cautious', 'avoidant')),
  
  -- Learning preferences
  preferred_activities TEXT[],
  preferred_input_channel TEXT CHECK (preferred_input_channel IN ('visual', 'auditory', 'kinesthetic')),
  feedback_preference TEXT,
  interest_topics TEXT[],
  weekly_study_time TEXT,
  
  -- Skill scores (0-100)
  grammar_score NUMERIC,
  vocabulary_score NUMERIC,
  reading_score NUMERIC,
  writing_score NUMERIC,
  communication_score NUMERIC,
  strongest_skill TEXT,
  weakest_skill TEXT,
  
  -- Self-efficacy ratings (1-5)
  confidence_speaking SMALLINT,
  confidence_writing SMALLINT,
  confidence_listening SMALLINT,
  confidence_reading SMALLINT,
  confidence_presenting SMALLINT,
  confidence_small_talk SMALLINT,
  
  -- Meta
  raw_answers JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(student_id, teacher_id)
);

-- Enable RLS
ALTER TABLE public.student_learning_profiles ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own students' profiles
CREATE POLICY "Teachers can view their students' learning profiles"
  ON public.student_learning_profiles
  FOR SELECT
  USING (auth.uid() = teacher_id);

-- Teachers can insert profiles for their students
CREATE POLICY "Teachers can insert learning profiles"
  ON public.student_learning_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their students' profiles
CREATE POLICY "Teachers can update learning profiles"
  ON public.student_learning_profiles
  FOR UPDATE
  USING (auth.uid() = teacher_id);

-- Teachers can delete their students' profiles
CREATE POLICY "Teachers can delete learning profiles"
  ON public.student_learning_profiles
  FOR DELETE
  USING (auth.uid() = teacher_id);

-- Service role / edge functions need access too (for process-welcome-test)
CREATE POLICY "Service role full access to learning profiles"
  ON public.student_learning_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_student_learning_profiles_student ON public.student_learning_profiles(student_id);
CREATE INDEX idx_student_learning_profiles_teacher ON public.student_learning_profiles(teacher_id);

-- Trigger for updated_at
CREATE TRIGGER update_student_learning_profiles_updated_at
  BEFORE UPDATE ON public.student_learning_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
