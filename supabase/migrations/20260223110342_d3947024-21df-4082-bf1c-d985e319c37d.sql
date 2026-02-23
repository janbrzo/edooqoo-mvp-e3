
-- Problem 6: Admin activity log table
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_teacher_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage activity logs" ON public.admin_activity_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert admin role for the owner account
INSERT INTO public.user_roles (user_id, role)
VALUES ('4ee84131-4ac8-4931-86ee-e116234e7e1f', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
