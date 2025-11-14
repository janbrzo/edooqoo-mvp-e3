-- Create homework_assignments table
CREATE TABLE public.homework_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  student_id UUID REFERENCES public.students(id),
  source_worksheet_id UUID REFERENCES public.worksheets(id),
  title TEXT NOT NULL,
  selected_exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  share_token TEXT UNIQUE,
  share_expires_at TIMESTAMP WITH TIME ZONE,
  deadline TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Warsaw')
);

-- Enable RLS
ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Teachers can view their own homework"
ON public.homework_assignments
FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create homework"
ON public.homework_assignments
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own homework"
ON public.homework_assignments
FOR UPDATE
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own homework"
ON public.homework_assignments
FOR DELETE
USING (auth.uid() = teacher_id);

CREATE POLICY "Public can view homework by share token"
ON public.homework_assignments
FOR SELECT
USING (share_token IS NOT NULL);

CREATE POLICY "Service role full access homework_assignments"
ON public.homework_assignments
FOR ALL
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX idx_homework_share_token ON public.homework_assignments(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_homework_teacher_id ON public.homework_assignments(teacher_id);
CREATE INDEX idx_homework_student_id ON public.homework_assignments(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_homework_deadline ON public.homework_assignments(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_homework_reminder_pending ON public.homework_assignments(deadline, reminder_sent_at) 
  WHERE deadline IS NOT NULL AND reminder_sent_at IS NULL;

-- Trigger for updated_at
CREATE TRIGGER update_homework_updated_at
BEFORE UPDATE ON public.homework_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Database function: Generate homework share token
CREATE OR REPLACE FUNCTION public.generate_homework_share_token(
  p_homework_id UUID,
  p_teacher_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  new_token TEXT;
BEGIN
  -- Generate unique token
  new_token := encode(extensions.gen_random_bytes(32), 'hex');
  
  -- Update homework with new token
  UPDATE public.homework_assignments
  SET share_token = new_token
  WHERE id = p_homework_id 
    AND teacher_id = p_teacher_id;
  
  IF FOUND THEN
    RETURN new_token;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Database function: Get homework by share token
CREATE OR REPLACE FUNCTION public.get_homework_by_share_token(p_share_token TEXT)
RETURNS TABLE(
  id UUID,
  title TEXT,
  selected_exercises JSONB,
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  teacher_email TEXT,
  teacher_first_name TEXT,
  teacher_last_name TEXT,
  student_name TEXT,
  student_english_level TEXT,
  source_worksheet_title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update view tracking
  UPDATE public.homework_assignments
  SET 
    viewed_at = CASE 
      WHEN viewed_at IS NULL THEN NOW() 
      ELSE viewed_at 
    END,
    view_count = view_count + 1
  WHERE share_token = p_share_token;
  
  -- Return homework data with related information
  RETURN QUERY
  SELECT 
    ha.id,
    ha.title,
    ha.selected_exercises,
    ha.deadline,
    ha.created_at,
    p.email AS teacher_email,
    p.first_name AS teacher_first_name,
    p.last_name AS teacher_last_name,
    s.name AS student_name,
    s.english_level AS student_english_level,
    w.title AS source_worksheet_title
  FROM public.homework_assignments ha
  LEFT JOIN public.profiles p ON ha.teacher_id = p.id
  LEFT JOIN public.students s ON ha.student_id = s.id
  LEFT JOIN public.worksheets w ON ha.source_worksheet_id = w.id
  WHERE ha.share_token = p_share_token;
END;
$$;