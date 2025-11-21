-- Add send_overdue_emails column to students table
-- This allows teachers to control whether overdue homework emails are sent for each student
-- Default is true (enabled)

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS send_overdue_emails BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.students.send_overdue_emails IS 'Controls whether to send overdue homework email notifications for this student';
