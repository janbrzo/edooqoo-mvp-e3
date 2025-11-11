-- ============================================
-- PHASE 1: STUDENT KNOWLEDGE - DATABASE & BACKEND
-- ============================================

-- Create student_knowledge_entries table
CREATE TABLE public.student_knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'Personal Info',
    'Professional/Work Context',
    'Goals',
    'Strengths',
    'Weaknesses',
    'Common Mistakes',
    'To Practice',
    'Interests & Hobbies',
    'Notes'
  )),
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  worksheet_id UUID REFERENCES public.worksheets(id) ON DELETE SET NULL,
  entry_source TEXT DEFAULT 'manual' CHECK (entry_source IN ('manual', 'worksheet', 'vocabulary', 'ai-suggested')),
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  deleted_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_student_knowledge_student_id ON public.student_knowledge_entries(student_id);
CREATE INDEX idx_student_knowledge_teacher_id ON public.student_knowledge_entries(teacher_id);
CREATE INDEX idx_student_knowledge_category ON public.student_knowledge_entries(category);
CREATE INDEX idx_student_knowledge_created_at ON public.student_knowledge_entries(created_at DESC);
CREATE INDEX idx_student_knowledge_worksheet_id ON public.student_knowledge_entries(worksheet_id);
CREATE INDEX idx_student_knowledge_tags ON public.student_knowledge_entries USING GIN(tags);

-- Tag normalization function
CREATE OR REPLACE FUNCTION public.normalize_tag(tag TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Convert to lowercase and replace spaces with underscores
  RETURN lower(replace(trim(tag), ' ', '_'));
END;
$$;

-- Trigger function to normalize tags before insert/update
CREATE OR REPLACE FUNCTION public.normalize_tags_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalize all tags in the array
  IF NEW.tags IS NOT NULL THEN
    NEW.tags := ARRAY(
      SELECT normalize_tag(unnest(NEW.tags))
    );
  END IF;
  
  -- Update updated_at timestamp
  NEW.updated_at := (now() AT TIME ZONE 'Europe/Warsaw');
  
  RETURN NEW;
END;
$$;

-- Create trigger for tag normalization
CREATE TRIGGER normalize_tags_before_insert_update
  BEFORE INSERT OR UPDATE ON public.student_knowledge_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_tags_trigger();

-- Enable Row Level Security
ALTER TABLE public.student_knowledge_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Teachers can view their own students' knowledge
CREATE POLICY "Teachers can view their own students knowledge"
  ON public.student_knowledge_entries FOR SELECT
  USING (auth.uid() = teacher_id);

-- RLS Policy: Teachers can insert knowledge for their students
CREATE POLICY "Teachers can insert knowledge for their students"
  ON public.student_knowledge_entries FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

-- RLS Policy: Teachers can update their own knowledge entries
CREATE POLICY "Teachers can update their own knowledge entries"
  ON public.student_knowledge_entries FOR UPDATE
  USING (auth.uid() = teacher_id);

-- RLS Policy: Teachers can delete their own knowledge entries
CREATE POLICY "Teachers can delete their own knowledge entries"
  ON public.student_knowledge_entries FOR DELETE
  USING (auth.uid() = teacher_id);

-- Soft delete function
CREATE OR REPLACE FUNCTION public.soft_delete_knowledge_entry(
  p_entry_id UUID,
  p_teacher_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.student_knowledge_entries 
  SET deleted_at = NOW() 
  WHERE id = p_entry_id 
    AND teacher_id = p_teacher_id 
    AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Get unique tags for a student (for autocomplete suggestions)
CREATE OR REPLACE FUNCTION public.get_student_tags(p_student_id UUID, p_teacher_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  unique_tags TEXT[];
BEGIN
  -- Get unique tags from all entries for this student
  SELECT ARRAY(
    SELECT DISTINCT unnest(tags)
    FROM public.student_knowledge_entries
    WHERE student_id = p_student_id
      AND teacher_id = p_teacher_id
      AND deleted_at IS NULL
    ORDER BY unnest(tags)
  ) INTO unique_tags;
  
  RETURN COALESCE(unique_tags, '{}');
END;
$$;

-- Add comment to table
COMMENT ON TABLE public.student_knowledge_entries IS 'Stores teacher notes and knowledge about individual students to personalize learning and track progress';

-- Add comments to columns
COMMENT ON COLUMN public.student_knowledge_entries.category IS 'Predefined category for organizing knowledge entries';
COMMENT ON COLUMN public.student_knowledge_entries.tags IS 'Array of normalized tags (lowercase_with_underscores) for filtering and searching';
COMMENT ON COLUMN public.student_knowledge_entries.entry_source IS 'Source of the entry: manual (teacher created), worksheet (from worksheet view), vocabulary (from vocab sheet), ai-suggested (AI generated)';
COMMENT ON COLUMN public.student_knowledge_entries.deleted_at IS 'Soft delete timestamp - NULL means active, NOT NULL means deleted';