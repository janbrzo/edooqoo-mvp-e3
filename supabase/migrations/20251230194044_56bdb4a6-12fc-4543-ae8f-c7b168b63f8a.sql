-- =====================================================
-- DSLM Etap 1.1 Hotfix: Fix Homework Event Trigger
-- Only generate events when homework is SUBMITTED (not on every auto-save)
-- =====================================================

-- Drop the existing trigger
DROP TRIGGER IF EXISTS homework_answer_event_trigger ON public.homework_student_answers;

-- Create improved trigger function
CREATE OR REPLACE FUNCTION public.log_homework_answer_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
BEGIN
  -- ONLY generate events when is_submitted changes from false to true
  -- This prevents flooding the event log with auto-save events
  IF NEW.is_submitted = true AND (OLD IS NULL OR OLD.is_submitted = false) THEN
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
        'homework_answer_submitted',  -- New event type for submitted answers
        'homework',
        NEW.homework_id,
        jsonb_build_object(
          'exercise_index', NEW.exercise_index,
          'exercise_type', NEW.exercise_type,
          'answer_id', NEW.id,
          'answers', NEW.answers  -- Include actual answer content
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the main operation
    RAISE WARNING 'Failed to log homework event: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Re-create trigger (only on UPDATE now, since INSERT without is_submitted=true doesn't generate events)
CREATE TRIGGER homework_answer_event_trigger
AFTER INSERT OR UPDATE ON public.homework_student_answers
FOR EACH ROW
EXECUTE FUNCTION public.log_homework_answer_event();

-- =====================================================
-- Create table for teacher corrections (separate from student answers)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.homework_teacher_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id UUID NOT NULL REFERENCES public.homework_assignments(id) ON DELETE CASCADE,
  exercise_index INTEGER NOT NULL,
  exercise_type TEXT NOT NULL,
  teacher_id UUID NOT NULL,
  corrections JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: one correction per teacher per exercise per homework
  CONSTRAINT unique_teacher_correction UNIQUE (homework_id, exercise_index, teacher_id)
);

-- Enable RLS
ALTER TABLE public.homework_teacher_corrections ENABLE ROW LEVEL SECURITY;

-- RLS policies for homework_teacher_corrections
CREATE POLICY "Teachers can view their own corrections"
  ON public.homework_teacher_corrections
  FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own corrections"
  ON public.homework_teacher_corrections
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own corrections"
  ON public.homework_teacher_corrections
  FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own corrections"
  ON public.homework_teacher_corrections
  FOR DELETE
  USING (auth.uid() = teacher_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teacher_corrections_homework 
  ON public.homework_teacher_corrections(homework_id);

-- Add updated_at trigger
CREATE TRIGGER update_teacher_corrections_updated_at
BEFORE UPDATE ON public.homework_teacher_corrections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Cleanup: Delete old redundant homework_answer_saved events
-- (those with is_submitted = false)
-- =====================================================
DELETE FROM public.student_events 
WHERE event_type = 'homework_answer_saved' 
  AND (event_payload->>'is_submitted')::boolean = false;