UPDATE homework_student_answers
SET is_submitted = false, submitted_at = NULL, ai_evaluation = NULL, 
    item_evaluations = NULL, eval_trigger = NULL, mastery = NULL
WHERE homework_id = (SELECT id FROM homework_assignments 
    WHERE share_token = 'c81caca14d21b916005ab3abe32a7a6a8d669350ae8f921fa2e440ff38a13a53');

UPDATE homework_assignments
SET completed_at = NULL, completed_by_teacher = false, reviewed_at = NULL, reviewed_by = NULL
WHERE share_token = 'c81caca14d21b916005ab3abe32a7a6a8d669350ae8f921fa2e440ff38a13a53';