-- Add reminder_hours column to homework_assignments
ALTER TABLE public.homework_assignments 
ADD COLUMN IF NOT EXISTS reminder_hours INTEGER DEFAULT 24;

COMMENT ON COLUMN public.homework_assignments.reminder_hours IS 'Number of hours before deadline to send reminder email (default: 24h)';