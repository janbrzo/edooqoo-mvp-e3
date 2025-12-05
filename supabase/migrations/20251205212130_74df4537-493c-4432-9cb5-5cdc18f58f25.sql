-- Function to insert homework submission notification with SECURITY DEFINER
-- This bypasses RLS for anonymous students submitting homework
CREATE OR REPLACE FUNCTION insert_homework_submission_notification(
  p_homework_id UUID,
  p_message TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_id UUID;
  v_student_id UUID;
BEGIN
  -- Get teacher and student IDs from homework
  SELECT teacher_id, student_id 
  INTO v_teacher_id, v_student_id
  FROM homework_assignments 
  WHERE id = p_homework_id;
  
  -- Only insert if we found the homework
  IF v_teacher_id IS NOT NULL THEN
    INSERT INTO homework_notifications 
    (teacher_id, homework_id, student_id, notification_type, message)
    VALUES (v_teacher_id, p_homework_id, v_student_id, 'submission', p_message);
  END IF;
END;
$$;