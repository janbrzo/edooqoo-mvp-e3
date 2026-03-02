
-- Add email notification toggle columns to calendar_settings
ALTER TABLE calendar_settings
  ADD COLUMN IF NOT EXISTS notify_email_on_booking boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email_on_cancellation boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email_on_reschedule boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email_on_confirmation boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email_on_rejection boolean NOT NULL DEFAULT true;

-- Add resolved_action column to calendar_notifications
ALTER TABLE calendar_notifications
  ADD COLUMN IF NOT EXISTS resolved_action text;
