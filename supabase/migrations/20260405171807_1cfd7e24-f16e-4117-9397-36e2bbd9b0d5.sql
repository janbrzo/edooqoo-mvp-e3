ALTER TABLE public.calendar_settings
ADD COLUMN IF NOT EXISTS auto_create_student_meeting_link boolean NOT NULL DEFAULT false;