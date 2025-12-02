-- Update submit_homework_answers function to also set completed_at in homework_assignments
CREATE OR REPLACE FUNCTION public.submit_homework_answers(p_homework_id uuid, p_student_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Mark all answers as submitted
  UPDATE public.homework_student_answers
  SET 
    is_submitted = true,
    submitted_at = NOW()
  WHERE homework_id = p_homework_id
    AND student_email = p_student_email
    AND is_submitted = false;
  
  -- Also mark the homework assignment as completed
  UPDATE public.homework_assignments
  SET 
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_homework_id;
  
  RETURN FOUND;
END;
$function$;