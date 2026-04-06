-- Add new columns for explicit meeting link mode tracking
ALTER TABLE public.calendar_student_settings
  ADD COLUMN IF NOT EXISTS generated_meeting_link text,
  ADD COLUMN IF NOT EXISTS meeting_link_mode text NOT NULL DEFAULT 'default';

-- Set existing records to 'custom' mode to preserve their current state safely
UPDATE public.calendar_student_settings
SET meeting_link_mode = 'custom'
WHERE default_meeting_link IS NOT NULL;