
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_sync_booked boolean DEFAULT true;
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_sync_pending boolean DEFAULT true;
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_sync_available_new boolean DEFAULT false;
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_sync_available_on_cancel boolean DEFAULT true;
ALTER TABLE calendar_student_settings ADD COLUMN IF NOT EXISTS default_meeting_link text;
