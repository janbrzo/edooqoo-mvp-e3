-- Add student_email column to students table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'student_email'
  ) THEN
    ALTER TABLE public.students 
    ADD COLUMN student_email TEXT;
    
    COMMENT ON COLUMN public.students.student_email IS 'Email address of the student for homework notifications';
  END IF;
END $$;