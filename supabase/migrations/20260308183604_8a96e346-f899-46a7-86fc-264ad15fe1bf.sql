CREATE TABLE public.student_gcal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email text NOT NULL,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  gcal_calendar_id text DEFAULT 'primary',
  settings jsonb DEFAULT '{"reminder_minutes": 30, "color_id": "9", "auto_add": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (student_email, teacher_id)
);

ALTER TABLE public.student_gcal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages student gcal tokens" ON public.student_gcal_tokens
  FOR ALL USING (true) WITH CHECK (true);