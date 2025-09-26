-- Add soft delete column to students table
ALTER TABLE public.students 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for better performance when filtering deleted students
CREATE INDEX idx_students_deleted_at ON public.students(deleted_at);

-- Create function for soft deleting a student
CREATE OR REPLACE FUNCTION public.soft_delete_student(p_student_id uuid, p_teacher_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.students 
  SET deleted_at = NOW() 
  WHERE id = p_student_id 
    AND teacher_id = p_teacher_id 
    AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$;