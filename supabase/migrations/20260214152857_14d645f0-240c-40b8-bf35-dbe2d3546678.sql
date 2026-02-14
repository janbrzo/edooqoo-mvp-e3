
-- Issue 1: Expand student_test_questions.question_type CHECK constraint
-- to support welcome test question types
ALTER TABLE public.student_test_questions
DROP CONSTRAINT IF EXISTS student_test_questions_question_type_check;

ALTER TABLE public.student_test_questions
ADD CONSTRAINT student_test_questions_question_type_check
CHECK (question_type IN (
  'multiple_choice', 'fill_blank', 'true_false', 'matching', 'open_ended', 'sentence_order',
  'speaking_record', 'listening_comprehension', 'self_assessment', 'scenario_reaction',
  'preference_choice', 'open_reflection', 'self_assessment_matrix'
));

-- Issue 2a: Make homework_notifications.homework_id nullable
-- First drop the existing FK constraint, make nullable, re-add FK
ALTER TABLE public.homework_notifications
ALTER COLUMN homework_id DROP NOT NULL;

-- Issue 2b: Expand notification_type CHECK constraint
ALTER TABLE public.homework_notifications
DROP CONSTRAINT IF EXISTS homework_notifications_notification_type_check;

ALTER TABLE public.homework_notifications
ADD CONSTRAINT homework_notifications_notification_type_check
CHECK (notification_type IN ('completed', 'viewed', 'overdue', 'welcome_test_completed'));
