
-- Calendar Slot Logs table for auditing
CREATE TABLE public.calendar_slot_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  action text NOT NULL,
  actor text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_slot_logs_slot_id ON public.calendar_slot_logs(slot_id);
CREATE INDEX idx_slot_logs_teacher_id ON public.calendar_slot_logs(teacher_id, created_at DESC);

ALTER TABLE public.calendar_slot_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view their logs" ON public.calendar_slot_logs FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Anyone can insert logs" ON public.calendar_slot_logs FOR INSERT WITH CHECK (true);

-- Calendar Teacher Vacations table
CREATE TABLE public.calendar_teacher_vacations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  label text DEFAULT 'Vacation',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_teacher_vacations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage vacations" ON public.calendar_teacher_vacations FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Public can view vacations" ON public.calendar_teacher_vacations FOR SELECT USING (true);

-- Add slot_type column to calendar_slots
ALTER TABLE public.calendar_slots ADD COLUMN IF NOT EXISTS slot_type text NOT NULL DEFAULT 'slot';

-- Add metadata column to calendar_notifications
ALTER TABLE public.calendar_notifications ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
