
-- =====================================================
-- DSLM Layer B: Metrics & Signals
-- =====================================================

-- 1. Table: student_skill_metrics
CREATE TABLE public.student_skill_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  skill_name TEXT NOT NULL,
  skill_category TEXT NOT NULL,
  current_mastery NUMERIC DEFAULT 0,
  trend TEXT DEFAULT 'stable' CHECK (trend IN ('improving', 'declining', 'stable')),
  total_events INTEGER DEFAULT 0,
  last_event_at TIMESTAMPTZ,
  first_event_at TIMESTAMPTZ,
  mastery_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, teacher_id, skill_name)
);

-- Indexes
CREATE INDEX idx_ssm_student_teacher ON public.student_skill_metrics(student_id, teacher_id);
CREATE INDEX idx_ssm_category ON public.student_skill_metrics(skill_category);
CREATE INDEX idx_ssm_skill_name ON public.student_skill_metrics(skill_name);

-- RLS
ALTER TABLE public.student_skill_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their students metrics"
  ON public.student_skill_metrics FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Service role full access student_skill_metrics"
  ON public.student_skill_metrics FOR ALL
  USING (true) WITH CHECK (true);

-- 2. Function: compute_student_skill_metrics
-- Recomputes metrics for a specific student+teacher+skill_name
CREATE OR REPLACE FUNCTION public.compute_skill_metric(
  p_student_id UUID,
  p_teacher_id UUID,
  p_skill_name TEXT,
  p_skill_category TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_weighted_sum NUMERIC := 0;
  v_weight_total NUMERIC := 0;
  v_total_events INTEGER := 0;
  v_first_at TIMESTAMPTZ;
  v_last_at TIMESTAMPTZ;
  v_current_mastery NUMERIC;
  v_trend TEXT := 'stable';
  v_history JSONB := '[]'::jsonb;
  v_recent_avg NUMERIC;
  v_older_avg NUMERIC;
  r RECORD;
BEGIN
  -- Gather all mastery values for this skill from nano_skill_ratings
  FOR r IN
    SELECT 
      (nsr->>'mastery')::numeric AS mastery_val,
      se.created_at,
      EXTRACT(EPOCH FROM (now() - se.created_at)) / 86400.0 AS days_ago
    FROM student_events se,
         jsonb_array_elements(se.event_payload->'nano_skill_ratings') AS nsr
    WHERE se.student_id = p_student_id
      AND se.teacher_id = p_teacher_id
      AND nsr->>'name' = p_skill_name
      AND (nsr->>'hasValue')::boolean = true
      AND (nsr->>'mastery')::numeric >= 0
    ORDER BY se.created_at ASC
  LOOP
    DECLARE
      v_weight NUMERIC;
    BEGIN
      v_weight := exp(-0.03 * r.days_ago);
      v_weighted_sum := v_weighted_sum + (r.mastery_val * v_weight);
      v_weight_total := v_weight_total + v_weight;
      v_total_events := v_total_events + 1;
      
      IF v_first_at IS NULL THEN
        v_first_at := r.created_at;
      END IF;
      v_last_at := r.created_at;
      
      -- Build history (keep last 20)
      v_history := v_history || jsonb_build_object(
        'mastery', r.mastery_val,
        'date', to_char(r.created_at, 'YYYY-MM-DD')
      );
    END;
  END LOOP;
  
  -- Also handle flashcard events (no nano_skill_ratings, use mastery column directly)
  IF p_skill_name LIKE 'flashcard:%' THEN
    FOR r IN
      SELECT 
        se.mastery AS mastery_val,
        se.created_at,
        EXTRACT(EPOCH FROM (now() - se.created_at)) / 86400.0 AS days_ago
      FROM student_events se
      WHERE se.student_id = p_student_id
        AND se.teacher_id = p_teacher_id
        AND se.event_source = 'flashcard'
        AND se.mastery IS NOT NULL
        AND se.event_payload->>'card_id' = substring(p_skill_name from 11)
      ORDER BY se.created_at ASC
    LOOP
      DECLARE
        v_weight NUMERIC;
      BEGIN
        v_weight := exp(-0.03 * r.days_ago);
        v_weighted_sum := v_weighted_sum + (r.mastery_val * v_weight);
        v_weight_total := v_weight_total + v_weight;
        v_total_events := v_total_events + 1;
        
        IF v_first_at IS NULL THEN
          v_first_at := r.created_at;
        END IF;
        v_last_at := r.created_at;
        
        v_history := v_history || jsonb_build_object(
          'mastery', r.mastery_val,
          'date', to_char(r.created_at, 'YYYY-MM-DD')
        );
      END;
    END LOOP;
  END IF;

  -- Nothing to compute
  IF v_total_events = 0 THEN
    RETURN;
  END IF;

  -- Weighted mastery
  v_current_mastery := ROUND(v_weighted_sum / NULLIF(v_weight_total, 0), 1);
  
  -- Trim history to last 20
  IF jsonb_array_length(v_history) > 20 THEN
    v_history := (
      SELECT jsonb_agg(elem)
      FROM (
        SELECT elem
        FROM jsonb_array_elements(v_history) AS elem
        ORDER BY elem->>'date' DESC
        LIMIT 20
      ) sub
    );
  END IF;

  -- Trend: compare last 3 vs previous 3
  IF v_total_events >= 4 THEN
    SELECT AVG((elem->>'mastery')::numeric) INTO v_recent_avg
    FROM (
      SELECT elem FROM jsonb_array_elements(v_history) AS elem
      ORDER BY elem->>'date' DESC LIMIT 3
    ) sub;
    
    SELECT AVG((elem->>'mastery')::numeric) INTO v_older_avg
    FROM (
      SELECT elem FROM jsonb_array_elements(v_history) AS elem
      ORDER BY elem->>'date' DESC OFFSET 3 LIMIT 3
    ) sub;
    
    IF v_older_avg IS NOT NULL THEN
      IF v_recent_avg > v_older_avg + 10 THEN
        v_trend := 'improving';
      ELSIF v_recent_avg < v_older_avg - 10 THEN
        v_trend := 'declining';
      ELSE
        v_trend := 'stable';
      END IF;
    END IF;
  END IF;

  -- Upsert
  INSERT INTO public.student_skill_metrics (
    student_id, teacher_id, skill_name, skill_category,
    current_mastery, trend, total_events, 
    first_event_at, last_event_at, mastery_history, updated_at
  ) VALUES (
    p_student_id, p_teacher_id, p_skill_name, p_skill_category,
    v_current_mastery, v_trend, v_total_events,
    v_first_at, v_last_at, v_history, now()
  )
  ON CONFLICT (student_id, teacher_id, skill_name) DO UPDATE SET
    current_mastery = EXCLUDED.current_mastery,
    trend = EXCLUDED.trend,
    total_events = EXCLUDED.total_events,
    last_event_at = EXCLUDED.last_event_at,
    mastery_history = EXCLUDED.mastery_history,
    skill_category = EXCLUDED.skill_category,
    updated_at = now();
END;
$$;

-- 3. Function: extract category from nano_skill name
CREATE OR REPLACE FUNCTION public.extract_skill_category(skill_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN skill_name LIKE 'ns.grammar.%' THEN 'grammar'
    WHEN skill_name LIKE 'ns.vocabulary.%' THEN 'vocabulary'
    WHEN skill_name LIKE 'ns.reading.%' THEN 'reading'
    WHEN skill_name LIKE 'ns.speaking.%' THEN 'speaking'
    WHEN skill_name LIKE 'ns.writing.%' THEN 'writing'
    WHEN skill_name LIKE 'ns.listening.%' THEN 'listening'
    WHEN skill_name LIKE 'ns.morphology.%' THEN 'grammar'
    WHEN skill_name LIKE 'ns.pronunciation.%' THEN 'pronunciation'
    WHEN skill_name LIKE 'flashcard:%' THEN 'vocabulary'
    ELSE 'other'
  END;
$$;

-- 4. Trigger: auto-refresh metrics on new events
CREATE OR REPLACE FUNCTION public.refresh_skill_metrics_on_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nsr RECORD;
  v_category TEXT;
BEGIN
  -- Process nano_skill_ratings from the event payload
  IF NEW.event_payload ? 'nano_skill_ratings' THEN
    FOR nsr IN
      SELECT 
        elem->>'name' AS skill_name
      FROM jsonb_array_elements(NEW.event_payload->'nano_skill_ratings') AS elem
      WHERE (elem->>'hasValue')::boolean = true
        AND (elem->>'mastery')::numeric >= 0
    LOOP
      v_category := public.extract_skill_category(nsr.skill_name);
      PERFORM public.compute_skill_metric(
        NEW.student_id, NEW.teacher_id, nsr.skill_name, v_category
      );
    END LOOP;
  END IF;
  
  -- Process flashcard events
  IF NEW.event_source = 'flashcard' AND NEW.mastery IS NOT NULL THEN
    PERFORM public.compute_skill_metric(
      NEW.student_id, NEW.teacher_id,
      'flashcard:' || (NEW.event_payload->>'card_id'),
      'vocabulary'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_refresh_skill_metrics
  AFTER INSERT ON public.student_events
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_skill_metrics_on_event();

-- 5. View: student_category_metrics (aggregation per category)
CREATE OR REPLACE VIEW public.student_category_metrics AS
SELECT
  student_id,
  teacher_id,
  skill_category AS category,
  ROUND(AVG(current_mastery), 1) AS avg_mastery,
  COUNT(*) AS skill_count,
  SUM(total_events) AS total_events,
  MAX(last_event_at) AS last_activity,
  (SELECT sm2.skill_name FROM student_skill_metrics sm2 
   WHERE sm2.student_id = ssm.student_id AND sm2.teacher_id = ssm.teacher_id 
   AND sm2.skill_category = ssm.skill_category
   ORDER BY sm2.current_mastery ASC LIMIT 1) AS weakest_skill,
  (SELECT sm3.skill_name FROM student_skill_metrics sm3 
   WHERE sm3.student_id = ssm.student_id AND sm3.teacher_id = ssm.teacher_id 
   AND sm3.skill_category = ssm.skill_category
   ORDER BY sm3.current_mastery DESC LIMIT 1) AS strongest_skill,
  CASE
    WHEN COUNT(*) FILTER (WHERE trend = 'improving') > COUNT(*) FILTER (WHERE trend = 'declining') THEN 'improving'
    WHEN COUNT(*) FILTER (WHERE trend = 'declining') > COUNT(*) FILTER (WHERE trend = 'improving') THEN 'declining'
    ELSE 'stable'
  END AS trend
FROM public.student_skill_metrics ssm
GROUP BY student_id, teacher_id, skill_category;

-- 6. Function to backfill existing events into metrics
CREATE OR REPLACE FUNCTION public.backfill_skill_metrics(p_student_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT
      nsr->>'name' AS skill_name,
      se.student_id,
      se.teacher_id
    FROM student_events se,
         jsonb_array_elements(se.event_payload->'nano_skill_ratings') AS nsr
    WHERE (p_student_id IS NULL OR se.student_id = p_student_id)
      AND (nsr->>'hasValue')::boolean = true
      AND (nsr->>'mastery')::numeric >= 0
  LOOP
    PERFORM public.compute_skill_metric(
      r.student_id, r.teacher_id, r.skill_name,
      public.extract_skill_category(r.skill_name)
    );
    v_count := v_count + 1;
  END LOOP;
  
  -- Also backfill flashcard metrics
  FOR r IN
    SELECT DISTINCT
      'flashcard:' || (se.event_payload->>'card_id') AS skill_name,
      se.student_id,
      se.teacher_id
    FROM student_events se
    WHERE se.event_source = 'flashcard'
      AND se.mastery IS NOT NULL
      AND (p_student_id IS NULL OR se.student_id = p_student_id)
  LOOP
    PERFORM public.compute_skill_metric(
      r.student_id, r.teacher_id, r.skill_name, 'vocabulary'
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;
