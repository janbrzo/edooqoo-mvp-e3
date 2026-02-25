
-- =====================================================
-- Calendar Module - Phase 1 (Core) + Phase 2 (Payment) tables
-- =====================================================

-- 1. Recurrence rules (must be created before calendar_slots references it)
CREATE TABLE public.calendar_recurrence_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Mon..6=Sun
  start_time time NOT NULL,
  end_time time NOT NULL,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_until date, -- NULL = indefinite
  is_active boolean NOT NULL DEFAULT true,
  auto_generate_weeks_ahead integer NOT NULL DEFAULT 4,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT valid_recurrence_time CHECK (end_time > start_time)
);

ALTER TABLE public.calendar_recurrence_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage their recurrence rules"
  ON public.calendar_recurrence_rules FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- 2. Calendar slots
CREATE TABLE public.calendar_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  title text,
  slot_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'available',
  booking_type text NOT NULL DEFAULT 'manual',
  recurrence_rule_id uuid REFERENCES public.calendar_recurrence_rules(id) ON DELETE SET NULL,
  worksheet_id uuid REFERENCES public.worksheets(id) ON DELETE SET NULL,
  notes text,
  student_notes text,
  booked_at timestamp with time zone,
  booked_by text,
  confirmed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancelled_by text,
  cancellation_reason text,
  is_paid boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT valid_slot_time CHECK (end_time > start_time),
  CONSTRAINT valid_slot_status CHECK (status IN ('available','booked','completed','cancelled','no_show'))
);

CREATE INDEX idx_calendar_slots_teacher_date ON public.calendar_slots(teacher_id, slot_date);
CREATE INDEX idx_calendar_slots_student ON public.calendar_slots(student_id);
CREATE INDEX idx_calendar_slots_status ON public.calendar_slots(teacher_id, status);

ALTER TABLE public.calendar_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their own slots"
  ON public.calendar_slots FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Public can view available slots"
  ON public.calendar_slots FOR SELECT TO anon, authenticated
  USING (status = 'available' AND student_id IS NULL);

CREATE POLICY "Students can view their booked slots"
  ON public.calendar_slots FOR SELECT TO anon, authenticated
  USING (student_id IS NOT NULL);

-- 3. Calendar settings
CREATE TABLE public.calendar_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  default_booking_mode text NOT NULL DEFAULT 'requires_confirmation',
  max_slots_per_student_per_week integer,
  enforce_slot_limit boolean NOT NULL DEFAULT false,
  default_lesson_duration_minutes integer NOT NULL DEFAULT 60,
  public_calendar_enabled boolean NOT NULL DEFAULT false,
  public_calendar_token text UNIQUE,
  timezone text NOT NULL DEFAULT 'Europe/Warsaw',
  notify_on_booking boolean NOT NULL DEFAULT true,
  notify_on_cancellation boolean NOT NULL DEFAULT true,
  notify_student_reminder_hours integer DEFAULT 24,
  notify_payment_reminder boolean NOT NULL DEFAULT false,
  payment_tracking_enabled boolean NOT NULL DEFAULT false,
  default_lesson_price numeric,
  currency text DEFAULT 'USD',
  min_cancellation_hours integer DEFAULT 24,
  gcal_integration_enabled boolean NOT NULL DEFAULT false,
  gcal_default_color text DEFAULT '1',
  gcal_default_reminder_minutes integer DEFAULT 30,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage their settings"
  ON public.calendar_settings FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Public read for booking page (to get booking mode, timezone etc.)
CREATE POLICY "Public can read settings by token"
  ON public.calendar_settings FOR SELECT TO anon, authenticated
  USING (public_calendar_enabled = true AND public_calendar_token IS NOT NULL);

-- 4. Calendar student settings (per-student overrides)
CREATE TABLE public.calendar_student_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  booking_mode_override text, -- NULL = use teacher default
  prepaid_lessons_remaining integer NOT NULL DEFAULT 0,
  lesson_price_override numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, student_id)
);

ALTER TABLE public.calendar_student_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage student settings"
  ON public.calendar_student_settings FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- 5. Calendar payment records
CREATE TABLE public.calendar_payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  slot_id uuid REFERENCES public.calendar_slots(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_type text NOT NULL DEFAULT 'lesson',
  lessons_count integer DEFAULT 1,
  is_confirmed boolean NOT NULL DEFAULT false,
  confirmed_at timestamp with time zone,
  confirmed_by text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage payment records"
  ON public.calendar_payment_records FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_calendar_slots_updated_at
  BEFORE UPDATE ON public.calendar_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_calendar_updated_at();

CREATE TRIGGER update_calendar_settings_updated_at
  BEFORE UPDATE ON public.calendar_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_calendar_updated_at();

CREATE TRIGGER update_calendar_student_settings_updated_at
  BEFORE UPDATE ON public.calendar_student_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_calendar_updated_at();
