-- Add "Outdated" functionality columns to student_knowledge_entries table
ALTER TABLE public.student_knowledge_entries
ADD COLUMN is_outdated BOOLEAN DEFAULT false,
ADD COLUMN outdated_at TIMESTAMPTZ,
ADD COLUMN outdated_reason TEXT;

-- Add index for filtering by outdated status
CREATE INDEX idx_knowledge_outdated ON public.student_knowledge_entries(is_outdated);

-- Create function to mark entry as outdated
CREATE OR REPLACE FUNCTION public.mark_knowledge_outdated(
  p_entry_id UUID,
  p_teacher_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS boolean AS $$
BEGIN
  UPDATE public.student_knowledge_entries
  SET 
    is_outdated = true,
    outdated_at = NOW(),
    outdated_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_entry_id 
    AND teacher_id = p_teacher_id 
    AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create function to mark entry as current (undo outdated)
CREATE OR REPLACE FUNCTION public.mark_knowledge_current(
  p_entry_id UUID,
  p_teacher_id UUID
) RETURNS boolean AS $$
BEGIN
  UPDATE public.student_knowledge_entries
  SET 
    is_outdated = false,
    outdated_at = NULL,
    outdated_reason = NULL,
    updated_at = NOW()
  WHERE id = p_entry_id 
    AND teacher_id = p_teacher_id 
    AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';