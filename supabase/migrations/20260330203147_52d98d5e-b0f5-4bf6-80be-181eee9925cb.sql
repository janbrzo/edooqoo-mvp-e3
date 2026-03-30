
-- Reset homework submission for testing (share_token c81caca1...)
DO $$
DECLARE
  v_homework_id uuid;
BEGIN
  SELECT id INTO v_homework_id FROM public.homework_assignments 
  WHERE share_token = 'c81caca14d21b916005ab3abe32a7a6a8d669350ae8f921fa2e440ff38a13a53';
  
  IF v_homework_id IS NOT NULL THEN
    UPDATE public.homework_student_answers
    SET is_submitted = false, submitted_at = NULL, ai_evaluation = NULL, 
        item_evaluations = NULL, eval_trigger = NULL, mastery = NULL
    WHERE homework_id = v_homework_id;
    
    UPDATE public.homework_assignments
    SET completed_at = NULL, completed_by_teacher = false, reviewed_at = NULL, reviewed_by = NULL
    WHERE id = v_homework_id;
  END IF;
END $$;
