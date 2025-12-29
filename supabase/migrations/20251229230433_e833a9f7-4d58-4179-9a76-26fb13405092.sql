-- =====================================================
-- DSLM ETAP 1: Event Collection Foundation
-- Tabela student_events + triggery na istniejących tabelach
-- =====================================================

-- Tabela główna do zbierania wszystkich eventów edukacyjnych
CREATE TABLE public.student_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  
  -- Event classification
  event_type TEXT NOT NULL,
  event_source TEXT NOT NULL, -- 'homework', 'flashcard', 'test', 'worksheet', 'teacher', 'system'
  source_id UUID, -- ID homework/flashcard/test/worksheet
  
  -- Event data
  event_payload JSONB NOT NULL DEFAULT '{}',
  skill_ids UUID[], -- powiązane learning elements
  element_type TEXT, -- grammar, vocabulary, speaking, listening, writing, reading
  
  -- Metadata
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  
  -- Processing flag (for signal computation)
  is_processed BOOLEAN NOT NULL DEFAULT false
);

-- Indeksy dla wydajności
CREATE INDEX idx_student_events_student_time ON public.student_events(student_id, created_at DESC);
CREATE INDEX idx_student_events_type ON public.student_events(event_type);
CREATE INDEX idx_student_events_source ON public.student_events(event_source, source_id);
CREATE INDEX idx_student_events_unprocessed ON public.student_events(is_processed) WHERE is_processed = false;

-- Enable RLS
ALTER TABLE public.student_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Teachers can view their students events"
ON public.student_events FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert events for their students"
ON public.student_events FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Service role full access student_events"
ON public.student_events FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- TRIGGER 1: homework_student_answers -> student_events
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_homework_answer_event()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
BEGIN
  -- Pobierz student_id i teacher_id z homework_assignments
  SELECT ha.student_id, ha.teacher_id
  INTO v_student_id, v_teacher_id
  FROM public.homework_assignments ha
  WHERE ha.id = NEW.homework_id;
  
  -- Wstaw event tylko jeśli mamy dane
  IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
    INSERT INTO public.student_events (
      student_id, 
      teacher_id, 
      event_type, 
      event_source, 
      source_id, 
      event_payload
    ) VALUES (
      v_student_id,
      v_teacher_id,
      CASE 
        WHEN NEW.is_submitted = true AND (OLD IS NULL OR OLD.is_submitted = false) THEN 'homework_submitted'
        ELSE 'homework_answer_saved'
      END,
      'homework',
      NEW.homework_id,
      jsonb_build_object(
        'exercise_index', NEW.exercise_index,
        'exercise_type', NEW.exercise_type,
        'is_submitted', NEW.is_submitted,
        'answer_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the main operation
    RAISE WARNING 'Failed to log homework event: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_homework_answer_event
AFTER INSERT OR UPDATE ON public.homework_student_answers
FOR EACH ROW
EXECUTE FUNCTION public.log_homework_answer_event();

-- =====================================================
-- TRIGGER 2: flashcard_progress -> student_events
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_flashcard_review_event()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
  v_is_correct BOOLEAN;
BEGIN
  -- Pobierz student_id i teacher_id z flashcard_sets
  SELECT fs.student_id, fs.teacher_id
  INTO v_student_id, v_teacher_id
  FROM public.flashcard_sets fs
  WHERE fs.id = NEW.set_id;
  
  -- Określ czy odpowiedź była poprawna (correct_count wzrósł)
  v_is_correct := (NEW.correct_count > COALESCE(OLD.correct_count, 0));
  
  -- Wstaw event tylko jeśli mamy dane i to jest aktualizacja (review)
  IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL AND TG_OP = 'UPDATE' THEN
    INSERT INTO public.student_events (
      student_id, 
      teacher_id, 
      event_type, 
      event_source, 
      source_id, 
      event_payload,
      element_type
    ) VALUES (
      v_student_id,
      v_teacher_id,
      'flashcard_review',
      'flashcard',
      NEW.card_id,
      jsonb_build_object(
        'set_id', NEW.set_id,
        'direction', NEW.direction,
        'is_correct', v_is_correct,
        'easiness_factor', NEW.easiness_factor,
        'repetition', NEW.repetition,
        'interval_days', NEW.interval_days,
        'total_reviews', NEW.total_reviews
      ),
      'vocabulary' -- flashcards są zawsze vocabulary
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log flashcard event: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_flashcard_review_event
AFTER UPDATE ON public.flashcard_progress
FOR EACH ROW
EXECUTE FUNCTION public.log_flashcard_review_event();

-- =====================================================
-- TRIGGER 3: student_test_questions -> student_events
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_test_answer_event()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
BEGIN
  -- Tylko gdy student_answer zostało ustawione (odpowiedź na pytanie)
  IF NEW.student_answer IS NOT NULL AND (OLD IS NULL OR OLD.student_answer IS NULL) THEN
    -- Pobierz student_id i teacher_id z student_tests
    SELECT st.student_id, st.teacher_id
    INTO v_student_id, v_teacher_id
    FROM public.student_tests st
    WHERE st.id = NEW.test_id;
    
    IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
      INSERT INTO public.student_events (
        student_id, 
        teacher_id, 
        event_type, 
        event_source, 
        source_id, 
        event_payload,
        element_type
      ) VALUES (
        v_student_id,
        v_teacher_id,
        'test_answer_submitted',
        'test',
        NEW.test_id,
        jsonb_build_object(
          'question_id', NEW.id,
          'question_type', NEW.question_type,
          'question_index', NEW.question_index,
          'is_correct', NEW.is_correct,
          'time_spent_seconds', NEW.time_spent_seconds,
          'difficulty_level', NEW.difficulty_level
        ),
        NEW.element_type
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log test answer event: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_test_answer_event
AFTER UPDATE ON public.student_test_questions
FOR EACH ROW
EXECUTE FUNCTION public.log_test_answer_event();

-- =====================================================
-- TRIGGER 4: student_knowledge_entries -> student_events
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_knowledge_entry_event()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.student_events (
    student_id, 
    teacher_id, 
    event_type, 
    event_source, 
    source_id, 
    event_payload,
    element_type
  ) VALUES (
    NEW.student_id,
    NEW.teacher_id,
    'knowledge_entry_added',
    'teacher',
    NEW.id,
    jsonb_build_object(
      'category', NEW.category,
      'tags', NEW.tags,
      'entry_source', NEW.entry_source
    ),
    NEW.category
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log knowledge entry event: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_knowledge_entry_event
AFTER INSERT ON public.student_knowledge_entries
FOR EACH ROW
EXECUTE FUNCTION public.log_knowledge_entry_event();

-- =====================================================
-- Funkcja pomocnicza do ręcznego dodawania eventów
-- =====================================================
CREATE OR REPLACE FUNCTION public.add_student_event(
  p_student_id UUID,
  p_teacher_id UUID,
  p_event_type TEXT,
  p_event_source TEXT,
  p_source_id UUID DEFAULT NULL,
  p_event_payload JSONB DEFAULT '{}',
  p_skill_ids UUID[] DEFAULT NULL,
  p_element_type TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.student_events (
    student_id,
    teacher_id,
    event_type,
    event_source,
    source_id,
    event_payload,
    skill_ids,
    element_type,
    session_id
  ) VALUES (
    p_student_id,
    p_teacher_id,
    p_event_type,
    p_event_source,
    p_source_id,
    p_event_payload,
    p_skill_ids,
    p_element_type,
    p_session_id
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;