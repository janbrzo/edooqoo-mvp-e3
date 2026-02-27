
-- Add student_id and title columns to calendar_recurrence_rules
ALTER TABLE public.calendar_recurrence_rules
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS title text;

-- Create calendar_notifications table
CREATE TABLE IF NOT EXISTS public.calendar_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  message text NOT NULL,
  slot_id uuid REFERENCES public.calendar_slots(id) ON DELETE SET NULL,
  student_name text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their notifications"
  ON public.calendar_notifications FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their notifications"
  ON public.calendar_notifications FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Anyone can insert notifications"
  ON public.calendar_notifications FOR INSERT
  WITH CHECK (true);

-- Create trigger to auto-notify on slot booking
CREATE OR REPLACE FUNCTION public.notify_on_slot_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'booked' AND (OLD.status IS NULL OR OLD.status = 'available') THEN
    INSERT INTO public.calendar_notifications (teacher_id, notification_type, message, slot_id, student_name)
    VALUES (
      NEW.teacher_id,
      'new_booking',
      'New lesson booked on ' || NEW.slot_date || ' at ' || substring(NEW.start_time::text from 1 for 5),
      NEW.id,
      COALESCE((SELECT name FROM public.students WHERE id = NEW.student_id), NEW.student_notes)
    );
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status = 'booked' THEN
    INSERT INTO public.calendar_notifications (teacher_id, notification_type, message, slot_id, student_name)
    VALUES (
      NEW.teacher_id,
      'cancellation',
      'Lesson cancelled on ' || NEW.slot_date || ' at ' || substring(NEW.start_time::text from 1 for 5),
      NEW.id,
      COALESCE((SELECT name FROM public.students WHERE id = NEW.student_id), '')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_on_slot_booking ON public.calendar_slots;
CREATE TRIGGER trg_notify_on_slot_booking
  AFTER UPDATE ON public.calendar_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_slot_booking();
