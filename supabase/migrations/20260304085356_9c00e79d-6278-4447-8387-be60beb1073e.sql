-- Problem 1: Payment tracking enhancements
ALTER TABLE calendar_payment_records ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash';
ALTER TABLE calendar_payment_records ADD COLUMN IF NOT EXISTS payment_date date DEFAULT CURRENT_DATE;

-- Problem 2: Google Calendar integration
CREATE TABLE IF NOT EXISTS calendar_gcal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  gcal_calendar_id text DEFAULT 'primary',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id)
);
ALTER TABLE calendar_gcal_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage own gcal tokens" ON calendar_gcal_tokens FOR ALL TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

ALTER TABLE calendar_slots ADD COLUMN IF NOT EXISTS gcal_event_id text;

-- Problem 3: Meeting link for Teams/Zoom/Meet
ALTER TABLE calendar_slots ADD COLUMN IF NOT EXISTS meeting_link text;