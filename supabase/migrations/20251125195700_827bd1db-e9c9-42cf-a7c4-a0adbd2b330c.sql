-- FAZA 1: FLASHCARDS SYSTEM - Complete Database Schema (Fixed)

-- 1.1: Add native_language to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS native_language TEXT DEFAULT 'Spanish';

UPDATE public.students 
SET native_language = 'Spanish' 
WHERE native_language IS NULL;

COMMENT ON COLUMN public.students.native_language IS 
'Student native language for flashcard translations (default: Spanish)';

-- 1.2: Create flashcard_sets table
CREATE TABLE IF NOT EXISTS public.flashcard_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_bidirectional BOOLEAN DEFAULT true,
  share_token TEXT UNIQUE,
  share_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '365 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_flashcard_sets_teacher ON public.flashcard_sets(teacher_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_student ON public.flashcard_sets(student_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_share_token ON public.flashcard_sets(share_token);

-- 1.3: Create flashcard_cards table
CREATE TABLE IF NOT EXISTS public.flashcard_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES public.flashcard_sets(id) ON DELETE CASCADE,
  source_worksheet_id UUID REFERENCES public.worksheets(id) ON DELETE SET NULL,
  front_text TEXT NOT NULL,
  front_example TEXT,
  back_text TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'vocabulary_sheet')),
  card_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_flashcard_cards_set ON public.flashcard_cards(set_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_cards_position ON public.flashcard_cards(set_id, card_position);

-- 1.4: Create flashcard_progress table
CREATE TABLE IF NOT EXISTS public.flashcard_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.flashcard_cards(id) ON DELETE CASCADE,
  set_id UUID NOT NULL REFERENCES public.flashcard_sets(id) ON DELETE CASCADE,
  learner_identifier TEXT NOT NULL,
  direction INTEGER NOT NULL DEFAULT 1 CHECK (direction IN (1, 2)),
  easiness_factor DECIMAL(4,2) DEFAULT 2.5,
  repetition INTEGER DEFAULT 0,
  interval_days INTEGER DEFAULT 0,
  next_review_date TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,
  total_reviews INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_progress UNIQUE(card_id, learner_identifier, direction)
);

CREATE INDEX IF NOT EXISTS idx_flashcard_progress_learner ON public.flashcard_progress(learner_identifier);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_next_review ON public.flashcard_progress(next_review_date);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_set ON public.flashcard_progress(set_id);

-- 1.5: RLS Policies
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can manage their own sets" ON public.flashcard_sets;
CREATE POLICY "Teachers can manage their own sets" ON public.flashcard_sets
  FOR ALL USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Public can view sets by share_token" ON public.flashcard_sets;
CREATE POLICY "Public can view sets by share_token" ON public.flashcard_sets
  FOR SELECT USING (
    share_token IS NOT NULL 
    AND deleted_at IS NULL
    AND (share_expires_at IS NULL OR share_expires_at > NOW())
  );

ALTER TABLE public.flashcard_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can manage cards in their sets" ON public.flashcard_cards;
CREATE POLICY "Teachers can manage cards in their sets" ON public.flashcard_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.flashcard_sets 
      WHERE id = set_id AND teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.flashcard_sets 
      WHERE id = set_id AND teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public can view cards in shared sets" ON public.flashcard_cards;
CREATE POLICY "Public can view cards in shared sets" ON public.flashcard_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.flashcard_sets 
      WHERE id = set_id 
        AND share_token IS NOT NULL 
        AND deleted_at IS NULL
    )
  );

ALTER TABLE public.flashcard_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can manage their own progress" ON public.flashcard_progress;
CREATE POLICY "Anyone can manage their own progress" ON public.flashcard_progress
  FOR ALL USING (true)
  WITH CHECK (true);

-- 1.6: Database Functions
CREATE OR REPLACE FUNCTION public.generate_flashcard_share_token(
  p_set_id UUID, 
  p_teacher_id UUID, 
  p_expires_hours INTEGER DEFAULT 8760
) 
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE
  new_token TEXT;
BEGIN
  new_token := encode(extensions.gen_random_bytes(32), 'hex');
  
  UPDATE public.flashcard_sets 
  SET 
    share_token = new_token,
    share_expires_at = NOW() + (p_expires_hours || ' hours')::interval,
    updated_at = NOW()
  WHERE id = p_set_id 
    AND teacher_id = p_teacher_id 
    AND deleted_at IS NULL;
  
  IF FOUND THEN 
    RETURN new_token;
  ELSE 
    RETURN NULL;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_flashcard_set_by_share_token(p_share_token TEXT)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  is_bidirectional BOOLEAN,
  student_name TEXT,
  student_native_language TEXT,
  teacher_first_name TEXT,
  teacher_last_name TEXT,
  teacher_email TEXT,
  cards_count BIGINT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fs.id,
    fs.title,
    fs.description,
    fs.is_bidirectional,
    s.name as student_name,
    COALESCE(s.native_language, 'Spanish') as student_native_language,
    p.first_name as teacher_first_name,
    p.last_name as teacher_last_name,
    p.email as teacher_email,
    (SELECT COUNT(*) FROM public.flashcard_cards fc 
     WHERE fc.set_id = fs.id AND fc.deleted_at IS NULL) as cards_count,
    fs.created_at
  FROM public.flashcard_sets fs
  JOIN public.students s ON fs.student_id = s.id
  JOIN public.profiles p ON fs.teacher_id = p.id
  WHERE fs.share_token = p_share_token
    AND fs.deleted_at IS NULL
    AND (fs.share_expires_at IS NULL OR fs.share_expires_at > NOW());
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_flashcard_set(
  p_set_id UUID, 
  p_teacher_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.flashcard_sets 
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_set_id 
    AND teacher_id = p_teacher_id 
    AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_flashcard_cards_for_learning(
  p_set_id UUID,
  p_learner_identifier TEXT
)
RETURNS TABLE(
  card_id UUID,
  front_text TEXT,
  front_example TEXT,
  back_text TEXT,
  card_position INTEGER,
  direction INTEGER,
  easiness_factor DECIMAL,
  repetition INTEGER,
  interval_days INTEGER,
  next_review_date TIMESTAMPTZ,
  total_reviews INTEGER,
  correct_count INTEGER,
  incorrect_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fc.id as card_id,
    fc.front_text,
    fc.front_example,
    fc.back_text,
    fc.card_position,
    COALESCE(fp.direction, 1) as direction,
    COALESCE(fp.easiness_factor, 2.5) as easiness_factor,
    COALESCE(fp.repetition, 0) as repetition,
    COALESCE(fp.interval_days, 0) as interval_days,
    COALESCE(fp.next_review_date, NOW()) as next_review_date,
    COALESCE(fp.total_reviews, 0) as total_reviews,
    COALESCE(fp.correct_count, 0) as correct_count,
    COALESCE(fp.incorrect_count, 0) as incorrect_count
  FROM public.flashcard_cards fc
  LEFT JOIN public.flashcard_progress fp ON 
    fc.id = fp.card_id AND fp.learner_identifier = p_learner_identifier
  WHERE fc.set_id = p_set_id
    AND fc.deleted_at IS NULL
  ORDER BY fc.card_position;
END;
$$;