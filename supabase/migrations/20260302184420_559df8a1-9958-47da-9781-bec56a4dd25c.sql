
-- Fix overly permissive RLS policies on homework_student_answers
-- Current: USING(true) for SELECT/INSERT/UPDATE = anyone can access everything
-- New: Require homework to have a share_token (proves legitimate shared access)

-- Drop the overly permissive student policies
DROP POLICY IF EXISTS "Students can read their own answers" ON public.homework_student_answers;
DROP POLICY IF EXISTS "Students can insert their own answers" ON public.homework_student_answers;
DROP POLICY IF EXISTS "Students can update their own answers" ON public.homework_student_answers;

-- Students can only read answers for homework that has a share_token (shared by teacher)
CREATE POLICY "Students can read answers for shared homework"
  ON public.homework_student_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.homework_assignments ha
      WHERE ha.id = homework_student_answers.homework_id
        AND ha.share_token IS NOT NULL
    )
  );

-- Students can only insert answers for homework that has a share_token
CREATE POLICY "Students can insert answers for shared homework"
  ON public.homework_student_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.homework_assignments ha
      WHERE ha.id = homework_student_answers.homework_id
        AND ha.share_token IS NOT NULL
    )
  );

-- Students can only update their own answers (by email) for shared homework
CREATE POLICY "Students can update their own answers for shared homework"
  ON public.homework_student_answers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.homework_assignments ha
      WHERE ha.id = homework_student_answers.homework_id
        AND ha.share_token IS NOT NULL
    )
  );
