
-- Fix: Make the view use SECURITY INVOKER (default for new views)
DROP VIEW IF EXISTS public.student_category_metrics;

CREATE VIEW public.student_category_metrics
WITH (security_invoker = true)
AS
SELECT
  student_id,
  teacher_id,
  skill_category AS category,
  ROUND(AVG(current_mastery), 1) AS avg_mastery,
  COUNT(*)::integer AS skill_count,
  SUM(total_events)::integer AS total_events,
  MAX(last_event_at) AS last_activity,
  CASE
    WHEN COUNT(*) FILTER (WHERE trend = 'improving') > COUNT(*) FILTER (WHERE trend = 'declining') THEN 'improving'
    WHEN COUNT(*) FILTER (WHERE trend = 'declining') > COUNT(*) FILTER (WHERE trend = 'improving') THEN 'declining'
    ELSE 'stable'
  END AS trend
FROM public.student_skill_metrics
GROUP BY student_id, teacher_id, skill_category;
