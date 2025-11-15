-- =========================================
-- MIGRATION: Homework System Extensions
-- =========================================

-- 1. Add student_email to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS student_email TEXT;

COMMENT ON COLUMN public.students.student_email IS 'Optional email address for sending homework notifications';

-- 2. Add completion tracking to homework_assignments
ALTER TABLE public.homework_assignments 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_by_teacher BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.homework_assignments.completed_at IS 'Timestamp when homework was marked as completed';
COMMENT ON COLUMN public.homework_assignments.completed_by_teacher IS 'True if teacher marked it as completed, false if student marked it';

-- 3. Create homework_notifications table for teacher notifications
CREATE TABLE IF NOT EXISTS public.homework_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  homework_id UUID NOT NULL REFERENCES public.homework_assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('completed', 'viewed', 'overdue')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'Europe/Warsaw'),
  read_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE public.homework_notifications IS 'Notifications for teachers about student homework activities';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_homework_notifications_teacher_id 
  ON public.homework_notifications(teacher_id);

CREATE INDEX IF NOT EXISTS idx_homework_notifications_is_read 
  ON public.homework_notifications(teacher_id, is_read);

CREATE INDEX IF NOT EXISTS idx_homework_notifications_created_at 
  ON public.homework_notifications(created_at DESC);

-- 4. Enable RLS on homework_notifications
ALTER TABLE public.homework_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homework_notifications
CREATE POLICY "Teachers can view their own notifications"
  ON public.homework_notifications
  FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own notifications"
  ON public.homework_notifications
  FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Service role can manage all notifications"
  ON public.homework_notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Create RPC function for marking homework as completed
CREATE OR REPLACE FUNCTION public.mark_homework_completed(
  p_homework_id UUID,
  p_user_id UUID,
  p_is_teacher BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_homework RECORD;
  v_student_name TEXT;
  v_homework_title TEXT;
  v_notification_id UUID;
BEGIN
  -- Get homework details
  SELECT 
    ha.*,
    s.name as student_name,
    s.teacher_id
  INTO v_homework
  FROM public.homework_assignments ha
  JOIN public.students s ON ha.student_id = s.id
  WHERE ha.id = p_homework_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Homework not found'
    );
  END IF;
  
  -- Verify authorization
  IF p_is_teacher AND p_user_id != v_homework.teacher_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized'
    );
  END IF;
  
  -- Update homework completion status
  UPDATE public.homework_assignments
  SET 
    completed_at = NOW(),
    completed_by_teacher = p_is_teacher,
    updated_at = NOW()
  WHERE id = p_homework_id;
  
  -- Create notification for teacher (only if student completed it)
  IF NOT p_is_teacher THEN
    INSERT INTO public.homework_notifications (
      teacher_id,
      homework_id,
      student_id,
      notification_type,
      message
    ) VALUES (
      v_homework.teacher_id,
      p_homework_id,
      v_homework.student_id,
      'completed',
      format('%s has completed homework: %s', v_homework.student_name, v_homework.title)
    )
    RETURNING id INTO v_notification_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'homework_id', p_homework_id,
    'completed_at', NOW(),
    'completed_by_teacher', p_is_teacher,
    'notification_id', v_notification_id
  );
END;
$$;

COMMENT ON FUNCTION public.mark_homework_completed IS 'Marks homework as completed and creates teacher notification if completed by student';