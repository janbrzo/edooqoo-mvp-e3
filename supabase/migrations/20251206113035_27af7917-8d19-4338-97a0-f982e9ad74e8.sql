-- Drop and recreate function with automatic message building
CREATE OR REPLACE FUNCTION insert_homework_submission_notification(
  p_homework_id UUID,
  p_message TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_id UUID;
  v_student_id UUID;
  v_student_name TEXT;
  v_homework_title TEXT;
  v_final_message TEXT;
BEGIN
  -- Fetch all needed data in one query (SECURITY DEFINER gives full access)
  SELECT 
    ha.teacher_id, 
    ha.student_id, 
    ha.title,
    COALESCE(s.name, 'Student')
  INTO v_teacher_id, v_student_id, v_homework_title, v_student_name
  FROM homework_assignments ha
  LEFT JOIN students s ON ha.student_id = s.id
  WHERE ha.id = p_homework_id;
  
  -- Build message if not provided
  IF p_message IS NULL THEN
    v_final_message := v_student_name || ' submitted homework: ' || COALESCE(v_homework_title, 'Homework');
  ELSE
    v_final_message := p_message;
  END IF;
  
  -- Insert notification if teacher exists
  IF v_teacher_id IS NOT NULL THEN
    INSERT INTO homework_notifications 
    (teacher_id, homework_id, student_id, notification_type, message)
    VALUES (v_teacher_id, p_homework_id, v_student_id, 'submission', v_final_message);
  END IF;
END;
$$;