-- =====================================================
-- STUDENT PROGRESS TRACKING SYSTEM
-- Tables for tracking student learning goals, elements, and future worksheet suggestions
-- =====================================================

-- 1. Student Progress Goals
-- Stores supporting goals (aligned with main goal) and additional goals (side objectives)
CREATE TABLE public.student_progress_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('supporting', 'additional')),
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  is_achieved BOOLEAN DEFAULT FALSE,
  achieved_at TIMESTAMP WITH TIME ZONE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2. Student Learning Elements
-- Granular skills/knowledge items within each goal, rated 1-5
CREATE TABLE public.student_learning_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.student_progress_goals(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  element_type TEXT NOT NULL CHECK (element_type IN (
    'grammar', 'vocabulary', 'pronunciation', 'speaking', 'listening', 
    'reading', 'writing', 'functional', 'cultural', 'strategy', 'other'
  )),
  title TEXT NOT NULL,
  description TEXT,
  current_rating INTEGER CHECK (current_rating >= 1 AND current_rating <= 5),
  target_rating INTEGER DEFAULT 5 CHECK (target_rating >= 1 AND target_rating <= 5),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai_generated')),
  display_order INTEGER NOT NULL DEFAULT 0,
  last_rated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 3. Future Worksheet Suggestions (Timeline)
-- AI-generated or manual suggestions for upcoming lessons
CREATE TABLE public.future_worksheet_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL DEFAULT 1,
  suggested_topic TEXT NOT NULL,
  suggested_goal TEXT,
  suggested_exercises TEXT[],
  focus_elements UUID[], -- References to learning_elements that this worksheet should address
  rationale TEXT, -- Why this worksheet is suggested
  is_used BOOLEAN DEFAULT FALSE,
  used_worksheet_id UUID REFERENCES public.worksheets(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  source TEXT NOT NULL DEFAULT 'ai_generated' CHECK (source IN ('manual', 'ai_generated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.student_progress_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_learning_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.future_worksheet_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_progress_goals
CREATE POLICY "Teachers can view their own progress goals"
  ON public.student_progress_goals FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert progress goals"
  ON public.student_progress_goals FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own progress goals"
  ON public.student_progress_goals FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own progress goals"
  ON public.student_progress_goals FOR DELETE
  USING (auth.uid() = teacher_id);

-- RLS Policies for student_learning_elements
CREATE POLICY "Teachers can view their own learning elements"
  ON public.student_learning_elements FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert learning elements"
  ON public.student_learning_elements FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own learning elements"
  ON public.student_learning_elements FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own learning elements"
  ON public.student_learning_elements FOR DELETE
  USING (auth.uid() = teacher_id);

-- RLS Policies for future_worksheet_suggestions
CREATE POLICY "Teachers can view their own worksheet suggestions"
  ON public.future_worksheet_suggestions FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert worksheet suggestions"
  ON public.future_worksheet_suggestions FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own worksheet suggestions"
  ON public.future_worksheet_suggestions FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own worksheet suggestions"
  ON public.future_worksheet_suggestions FOR DELETE
  USING (auth.uid() = teacher_id);

-- Indexes for performance
CREATE INDEX idx_progress_goals_student ON public.student_progress_goals(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_progress_goals_teacher ON public.student_progress_goals(teacher_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_learning_elements_goal ON public.student_learning_elements(goal_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_learning_elements_student ON public.student_learning_elements(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_worksheet_suggestions_student ON public.future_worksheet_suggestions(student_id) WHERE deleted_at IS NULL;

-- Trigger for updated_at
CREATE TRIGGER update_progress_goals_updated_at
  BEFORE UPDATE ON public.student_progress_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_elements_updated_at
  BEFORE UPDATE ON public.student_learning_elements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_worksheet_suggestions_updated_at
  BEFORE UPDATE ON public.future_worksheet_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();