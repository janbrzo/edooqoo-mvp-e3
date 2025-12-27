-- =====================================================
-- MODULE: INTELLIGENT TESTS
-- =====================================================

-- 1. Main table for tests
CREATE TABLE public.student_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Test metadata
  test_type TEXT NOT NULL CHECK (test_type IN ('placement', 'progress_check', 'skill_verification', 'goal_check')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Links to Progress module
  linked_goal_id UUID REFERENCES public.student_progress_goals(id) ON DELETE SET NULL,
  linked_element_ids UUID[] DEFAULT '{}',
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'assigned', 'in_progress', 'completed', 'reviewed')),
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  
  -- Summary results (calculated after completion)
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  score_percentage NUMERIC(5,2),
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- Sharing with student
  share_token TEXT UNIQUE,
  share_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- AI generation metadata
  ai_generated BOOLEAN DEFAULT false,
  generation_params JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  deleted_at TIMESTAMPTZ
);

-- 2. Questions within tests
CREATE TABLE public.student_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.student_tests(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  
  -- Question content
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'fill_blank', 'true_false', 'matching', 'open_ended', 'sentence_order')),
  question_text TEXT NOT NULL,
  question_data JSONB DEFAULT '{}', -- options for multiple choice, pairs for matching, etc.
  correct_answer JSONB NOT NULL,
  explanation TEXT, -- shown after answering
  
  -- Skill mapping (links to Progress element types)
  element_type TEXT, -- grammar, vocabulary, listening, etc.
  difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),
  skill_tags TEXT[] DEFAULT '{}', -- e.g. ['present_perfect', 'irregular_verbs']
  
  -- Student answer
  student_answer JSONB,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  
  -- AI feedback for open-ended questions
  ai_feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  
  UNIQUE(test_id, question_index)
);

-- 3. Aggregated skill results (for Progress integration)
CREATE TABLE public.test_skill_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.student_tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  
  -- Skill identification
  element_type TEXT NOT NULL,
  skill_tags TEXT[] DEFAULT '{}',
  
  -- Results
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  score_percentage NUMERIC(5,2),
  
  -- Progress integration
  suggested_rating INTEGER CHECK (suggested_rating BETWEEN 1 AND 5),
  applied_to_element_id UUID REFERENCES public.student_learning_elements(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  
  UNIQUE(test_id, element_type)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_student_tests_student_id ON public.student_tests(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_tests_teacher_id ON public.student_tests(teacher_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_tests_status ON public.student_tests(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_tests_share_token ON public.student_tests(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_student_test_questions_test_id ON public.student_test_questions(test_id);
CREATE INDEX idx_test_skill_results_test_id ON public.test_skill_results(test_id);
CREATE INDEX idx_test_skill_results_student_id ON public.test_skill_results(student_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.student_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_skill_results ENABLE ROW LEVEL SECURITY;

-- student_tests policies
CREATE POLICY "Teachers can view their own tests"
  ON public.student_tests FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create tests"
  ON public.student_tests FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own tests"
  ON public.student_tests FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own tests"
  ON public.student_tests FOR DELETE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Public can view tests by share token"
  ON public.student_tests FOR SELECT
  USING (share_token IS NOT NULL AND deleted_at IS NULL);

-- student_test_questions policies
CREATE POLICY "Teachers can manage questions in their tests"
  ON public.student_test_questions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.student_tests 
    WHERE student_tests.id = student_test_questions.test_id 
    AND student_tests.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.student_tests 
    WHERE student_tests.id = student_test_questions.test_id 
    AND student_tests.teacher_id = auth.uid()
  ));

CREATE POLICY "Public can view questions in shared tests"
  ON public.student_test_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.student_tests 
    WHERE student_tests.id = student_test_questions.test_id 
    AND student_tests.share_token IS NOT NULL 
    AND student_tests.deleted_at IS NULL
  ));

CREATE POLICY "Anyone can update question answers"
  ON public.student_test_questions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.student_tests 
    WHERE student_tests.id = student_test_questions.test_id 
    AND student_tests.share_token IS NOT NULL 
    AND student_tests.deleted_at IS NULL
  ));

-- test_skill_results policies
CREATE POLICY "Teachers can view their test results"
  ON public.test_skill_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.student_tests 
    WHERE student_tests.id = test_skill_results.test_id 
    AND student_tests.teacher_id = auth.uid()
  ));

CREATE POLICY "Teachers can manage test results"
  ON public.test_skill_results FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.student_tests 
    WHERE student_tests.id = test_skill_results.test_id 
    AND student_tests.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.student_tests 
    WHERE student_tests.id = test_skill_results.test_id 
    AND student_tests.teacher_id = auth.uid()
  ));

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate share token for test
CREATE OR REPLACE FUNCTION public.generate_test_share_token(
  p_test_id UUID, 
  p_teacher_id UUID, 
  p_expires_hours INTEGER DEFAULT 720
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  new_token TEXT;
BEGIN
  new_token := encode(extensions.gen_random_bytes(32), 'hex');
  
  UPDATE public.student_tests 
  SET 
    share_token = new_token,
    share_expires_at = NOW() + (p_expires_hours || ' hours')::interval,
    updated_at = NOW()
  WHERE id = p_test_id 
    AND teacher_id = p_teacher_id 
    AND deleted_at IS NULL;
  
  IF FOUND THEN 
    RETURN new_token;
  ELSE 
    RETURN NULL;
  END IF;
END;
$$;

-- Function to get test by share token
CREATE OR REPLACE FUNCTION public.get_test_by_share_token(p_share_token TEXT)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  test_type TEXT,
  total_questions INTEGER,
  student_name TEXT,
  teacher_first_name TEXT,
  teacher_last_name TEXT,
  teacher_email TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.id,
    st.title,
    st.description,
    st.test_type,
    st.total_questions,
    s.name as student_name,
    p.first_name as teacher_first_name,
    p.last_name as teacher_last_name,
    p.email as teacher_email,
    st.status,
    st.created_at
  FROM public.student_tests st
  JOIN public.students s ON st.student_id = s.id
  JOIN public.profiles p ON st.teacher_id = p.id
  WHERE st.share_token = p_share_token
    AND st.deleted_at IS NULL
    AND (st.share_expires_at IS NULL OR st.share_expires_at > NOW());
END;
$$;

-- Function to calculate and save test results
CREATE OR REPLACE FUNCTION public.calculate_test_results(p_test_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total INTEGER;
  v_correct INTEGER;
  v_score NUMERIC(5,2);
  v_time INTEGER;
  v_student_id UUID;
  v_result JSONB;
BEGIN
  -- Get student_id and calculate totals
  SELECT 
    st.student_id,
    COUNT(*)::INTEGER,
    COALESCE(SUM(CASE WHEN stq.is_correct THEN 1 ELSE 0 END), 0)::INTEGER,
    COALESCE(SUM(stq.time_spent_seconds), 0)::INTEGER
  INTO v_student_id, v_total, v_correct, v_time
  FROM public.student_tests st
  LEFT JOIN public.student_test_questions stq ON stq.test_id = st.id
  WHERE st.id = p_test_id
  GROUP BY st.student_id;
  
  -- Calculate score
  v_score := CASE WHEN v_total > 0 THEN (v_correct::NUMERIC / v_total * 100) ELSE 0 END;
  
  -- Update test with results
  UPDATE public.student_tests
  SET 
    total_questions = v_total,
    correct_answers = v_correct,
    score_percentage = v_score,
    time_spent_seconds = v_time,
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_test_id;
  
  -- Calculate per-skill results
  DELETE FROM public.test_skill_results WHERE test_id = p_test_id;
  
  INSERT INTO public.test_skill_results (test_id, student_id, element_type, skill_tags, total_questions, correct_answers, score_percentage, suggested_rating)
  SELECT 
    p_test_id,
    v_student_id,
    element_type,
    ARRAY_AGG(DISTINCT tag) FILTER (WHERE tag IS NOT NULL),
    COUNT(*)::INTEGER,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::INTEGER,
    (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100),
    CASE 
      WHEN (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100) >= 80 THEN 5
      WHEN (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100) >= 60 THEN 4
      WHEN (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100) >= 40 THEN 3
      WHEN (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100) >= 20 THEN 2
      ELSE 1
    END
  FROM public.student_test_questions stq
  LEFT JOIN LATERAL unnest(stq.skill_tags) AS tag ON true
  WHERE stq.test_id = p_test_id AND stq.element_type IS NOT NULL
  GROUP BY element_type;
  
  v_result := jsonb_build_object(
    'total_questions', v_total,
    'correct_answers', v_correct,
    'score_percentage', v_score,
    'time_spent_seconds', v_time
  );
  
  RETURN v_result;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_student_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_tests_updated_at
  BEFORE UPDATE ON public.student_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_student_tests_updated_at();