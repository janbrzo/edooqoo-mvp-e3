-- FIX 1: Remove the open INSERT policy on user_roles that allows privilege escalation
DROP POLICY IF EXISTS "Allow new user role creation" ON public.user_roles;

-- FIX 2: Replace the open students policy with teacher-scoped access
DROP POLICY IF EXISTS "Students access policy" ON public.students;

CREATE POLICY "Teachers can manage own students"
  ON public.students
  FOR ALL
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);