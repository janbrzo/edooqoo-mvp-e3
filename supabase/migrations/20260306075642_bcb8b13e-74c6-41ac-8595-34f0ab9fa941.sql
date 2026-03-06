ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_color_booked text DEFAULT '9';
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_color_available text DEFAULT '2';
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_color_pending text DEFAULT '5';
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_color_completed text DEFAULT '10';
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_color_no_show text DEFAULT '6';
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_sync_mode text DEFAULT 'booked_only';
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS auto_create_meet_link boolean DEFAULT false;