
-- 1. Overbooking prevention trigger
CREATE OR REPLACE FUNCTION public.check_slot_overlap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.student_id IS NOT NULL AND NEW.status NOT IN ('cancelled') THEN
    IF EXISTS (
      SELECT 1 FROM public.calendar_slots
      WHERE teacher_id = NEW.teacher_id
      AND slot_date = NEW.slot_date
      AND status NOT IN ('cancelled')
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND student_id IS NOT NULL
      AND substring(start_time::text from 1 for 5) < substring(NEW.end_time::text from 1 for 5)
      AND substring(end_time::text from 1 for 5) > substring(NEW.start_time::text from 1 for 5)
    ) THEN
      RAISE EXCEPTION 'Overbooking: lesson already exists at this time';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_slot_overlap
BEFORE INSERT OR UPDATE ON public.calendar_slots
FOR EACH ROW
EXECUTE FUNCTION public.check_slot_overlap();

-- 2. New columns for calendar_settings
ALTER TABLE public.calendar_settings ADD COLUMN IF NOT EXISTS display_start_hour integer NOT NULL DEFAULT 7;
ALTER TABLE public.calendar_settings ADD COLUMN IF NOT EXISTS display_end_hour integer NOT NULL DEFAULT 22;
ALTER TABLE public.calendar_settings ADD COLUMN IF NOT EXISTS allow_student_reschedule boolean NOT NULL DEFAULT false;
ALTER TABLE public.calendar_settings ADD COLUMN IF NOT EXISTS buffer_minutes integer NOT NULL DEFAULT 0;

-- 3. Update notification trigger to fire on INSERT too
CREATE OR REPLACE FUNCTION public.notify_on_slot_booking()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'booked' AND NEW.student_id IS NOT NULL THEN
    INSERT INTO public.calendar_notifications (teacher_id, notification_type, message, slot_id, student_name)
    VALUES (
      NEW.teacher_id,
      'new_booking',
      'New lesson booked on ' || NEW.slot_date || ' at ' || substring(NEW.start_time::text from 1 for 5),
      NEW.id,
      COALESCE((SELECT name FROM public.students WHERE id = NEW.student_id), NEW.student_notes)
    );
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status = 'booked' AND (OLD.status IS NULL OR OLD.status = 'available') THEN
    INSERT INTO public.calendar_notifications (teacher_id, notification_type, message, slot_id, student_name)
    VALUES (
      NEW.teacher_id,
      'new_booking',
      'New lesson booked on ' || NEW.slot_date || ' at ' || substring(NEW.start_time::text from 1 for 5),
      NEW.id,
      COALESCE((SELECT name FROM public.students WHERE id = NEW.student_id), NEW.student_notes)
    );
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status = 'booked' THEN
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
$$;

DROP TRIGGER IF EXISTS trg_notify_on_slot_booking ON public.calendar_slots;
CREATE TRIGGER trg_notify_on_slot_booking
AFTER INSERT OR UPDATE ON public.calendar_slots
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_slot_booking();
