
-- Reset homework submission status for testing
UPDATE homework_student_answers 
SET is_submitted = false, submitted_at = NULL, ai_evaluation = NULL, item_evaluations = NULL
WHERE homework_id = 'd4c4da77-148c-4043-bc42-214aa9e400ac';

UPDATE homework_assignments 
SET completed_at = NULL, completed_by_teacher = NULL, reviewed_at = NULL, reviewed_by = NULL
WHERE id = 'd4c4da77-148c-4043-bc42-214aa9e400ac';
