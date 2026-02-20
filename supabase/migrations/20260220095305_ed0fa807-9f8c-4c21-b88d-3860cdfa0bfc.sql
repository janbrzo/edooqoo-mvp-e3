
-- 1. Add micro_skill column to student_skill_metrics
ALTER TABLE public.student_skill_metrics ADD COLUMN IF NOT EXISTS micro_skill TEXT;

-- 2. Create extract_micro_skill() function that maps nano_skills to canonical micro groups
CREATE OR REPLACE FUNCTION public.extract_micro_skill(skill_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    -- NEW PREFIX FORMAT (ns.prefix.*)
    WHEN skill_name LIKE 'ns.ps.%' THEN 'ps'
    WHEN skill_name LIKE 'ns.pc.%' THEN 'pc'
    WHEN skill_name LIKE 'ns.pp.%' THEN 'pp'
    WHEN skill_name LIKE 'ns.prs.%' THEN 'prs'
    WHEN skill_name LIKE 'ns.prc.%' THEN 'prc'
    WHEN skill_name LIKE 'ns.prp.%' THEN 'prp'
    WHEN skill_name LIKE 'ns.prpc.%' THEN 'prpc'
    WHEN skill_name LIKE 'ns.fs.%' THEN 'fs'
    WHEN skill_name LIKE 'ns.fg.%' THEN 'fg'
    WHEN skill_name LIKE 'ns.fc.%' THEN 'fc'
    WHEN skill_name LIKE 'ns.cond1.%' THEN 'cond1'
    WHEN skill_name LIKE 'ns.cond2.%' THEN 'cond2'
    WHEN skill_name LIKE 'ns.cond3.%' THEN 'cond3'
    WHEN skill_name LIKE 'ns.condm.%' THEN 'condm'
    WHEN skill_name LIKE 'ns.passive.%' THEN 'passive'
    WHEN skill_name LIKE 'ns.rs.%' THEN 'rs'
    WHEN skill_name LIKE 'ns.rel.%' THEN 'rel'
    WHEN skill_name LIKE 'ns.mod.%' THEN 'mod'
    WHEN skill_name LIKE 'ns.ger_inf.%' THEN 'ger_inf'
    WHEN skill_name LIKE 'ns.phr.%' THEN 'phr'
    WHEN skill_name LIKE 'ns.comp.%' THEN 'comp'
    WHEN skill_name LIKE 'ns.sup.%' THEN 'sup'
    WHEN skill_name LIKE 'ns.art.%' THEN 'art'
    WHEN skill_name LIKE 'ns.prep.%' THEN 'prep'
    WHEN skill_name LIKE 'ns.wo.%' THEN 'wo'
    WHEN skill_name LIKE 'ns.neg.%' THEN 'neg'
    WHEN skill_name LIKE 'ns.wf.%' THEN 'wf'
    WHEN skill_name LIKE 'ns.vocab.%' THEN 'vocab'
    WHEN skill_name LIKE 'ns.coll.%' THEN 'coll'
    WHEN skill_name LIKE 'ns.idiom.%' THEN 'idiom'
    WHEN skill_name LIKE 'ns.syn.%' THEN 'syn'
    WHEN skill_name LIKE 'ns.ant.%' THEN 'ant'
    WHEN skill_name LIKE 'ns.reading.%' THEN 'reading'
    WHEN skill_name LIKE 'ns.speaking.%' THEN 'speaking'
    WHEN skill_name LIKE 'ns.writing.%' THEN 'writing'
    WHEN skill_name LIKE 'ns.listening.%' THEN 'listening'
    -- LEGACY FORMAT (ns.grammar.*, ns.vocabulary.*, etc.)
    WHEN skill_name ~ '^ns\.grammar\.conditional_1' THEN 'cond1'
    WHEN skill_name ~ '^ns\.grammar\.conditional_2' THEN 'cond2'
    WHEN skill_name ~ '^ns\.grammar\.conditional_3' THEN 'cond3'
    WHEN skill_name ~ '^ns\.grammar\.mixed_conditional' THEN 'condm'
    WHEN skill_name ~ '^ns\.grammar\.future_going_to' THEN 'fg'
    WHEN skill_name ~ '^ns\.grammar\.future_will' THEN 'fs'
    WHEN skill_name ~ '^ns\.grammar\.future_simple' THEN 'fs'
    WHEN skill_name ~ '^ns\.grammar\.future_continuous' THEN 'fc'
    WHEN skill_name ~ '^ns\.grammar\.past_simple' THEN 'ps'
    WHEN skill_name ~ '^ns\.grammar\.past_continuous' THEN 'pc'
    WHEN skill_name ~ '^ns\.grammar\.past_perfect' THEN 'pp'
    WHEN skill_name ~ '^ns\.grammar\.present_simple' THEN 'prs'
    WHEN skill_name ~ '^ns\.grammar\.present_continuous' THEN 'prc'
    WHEN skill_name ~ '^ns\.grammar\.present_perfect_continuous' THEN 'prpc'
    WHEN skill_name ~ '^ns\.grammar\.present_perfect' THEN 'prp'
    WHEN skill_name ~ '^ns\.grammar\.passive' THEN 'passive'
    WHEN skill_name ~ '^ns\.grammar\.reported_speech' THEN 'rs'
    WHEN skill_name ~ '^ns\.grammar\.relative' THEN 'rel'
    WHEN skill_name ~ '^ns\.grammar\.modal' THEN 'mod'
    WHEN skill_name ~ '^ns\.grammar\.gerund' THEN 'ger_inf'
    WHEN skill_name ~ '^ns\.grammar\.infinitive' THEN 'ger_inf'
    WHEN skill_name ~ '^ns\.grammar\.phrasal' THEN 'phr'
    WHEN skill_name ~ '^ns\.grammar\.comparative' THEN 'comp'
    WHEN skill_name ~ '^ns\.grammar\.superlative' THEN 'sup'
    WHEN skill_name ~ '^ns\.grammar\.article' THEN 'art'
    WHEN skill_name ~ '^ns\.grammar\.preposition' THEN 'prep'
    WHEN skill_name ~ '^ns\.grammar\.word_order' THEN 'wo'
    WHEN skill_name ~ '^ns\.grammar\.negative_prefix' THEN 'neg'
    WHEN skill_name ~ '^ns\.grammar\.word_formation' THEN 'wf'
    WHEN skill_name ~ '^ns\.grammar\.not_as_as' THEN 'comp'
    WHEN skill_name ~ '^ns\.grammar\.double_comparative' THEN 'comp'
    WHEN skill_name ~ '^ns\.grammar\.double_superlative' THEN 'sup'
    WHEN skill_name ~ '^ns\.grammar\.adverb_frequency' THEN 'wo'
    WHEN skill_name ~ '^ns\.grammar\.would_like' THEN 'mod'
    WHEN skill_name LIKE 'ns.grammar.%' THEN 'grammar_other'
    WHEN skill_name LIKE 'ns.vocabulary.%' THEN 'vocab'
    WHEN skill_name LIKE 'ns.spelling.%' THEN 'vocab'
    WHEN skill_name LIKE 'ns.morphology.%' THEN 'wf'
    WHEN skill_name LIKE 'ns.collocations.%' THEN 'coll'
    WHEN skill_name LIKE 'ns.expression.%' THEN 'speaking'
    WHEN skill_name LIKE 'ns.paraphrasing.%' THEN 'writing'
    WHEN skill_name LIKE 'ns.sentence.%' THEN 'grammar_other'
    WHEN skill_name LIKE 'ns.questions.%' THEN 'speaking'
    WHEN skill_name LIKE 'ns.comprehension.%' THEN 'reading'
    WHEN skill_name LIKE 'ns.dialogue.%' THEN 'speaking'
    WHEN skill_name LIKE 'ns.functional.%' THEN 'speaking'
    WHEN skill_name LIKE 'ns.pronunciation.%' THEN 'pronunciation'
    WHEN skill_name LIKE 'flashcard:%' THEN 'flashcard'
    ELSE 'other'
  END;
$$;

-- 3. Update extract_skill_category to also handle new prefixes
CREATE OR REPLACE FUNCTION public.extract_skill_category(skill_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    -- New prefix format
    WHEN skill_name ~ '^ns\.(ps|pc|pp|prs|prc|prp|prpc|fs|fg|fc|cond1|cond2|cond3|condm|passive|rs|rel|mod|ger_inf|phr|comp|sup|art|prep|wo|neg|wf)\.' THEN 'grammar'
    WHEN skill_name ~ '^ns\.(vocab|coll|idiom|syn|ant)\.' THEN 'vocabulary'
    WHEN skill_name LIKE 'ns.reading.%' THEN 'reading'
    WHEN skill_name LIKE 'ns.speaking.%' THEN 'speaking'
    WHEN skill_name LIKE 'ns.writing.%' THEN 'writing'
    WHEN skill_name LIKE 'ns.listening.%' THEN 'listening'
    -- Legacy format
    WHEN skill_name LIKE 'ns.grammar.%' THEN 'grammar'
    WHEN skill_name LIKE 'ns.vocabulary.%' THEN 'vocabulary'
    WHEN skill_name LIKE 'ns.morphology.%' THEN 'grammar'
    WHEN skill_name LIKE 'ns.pronunciation.%' THEN 'pronunciation'
    WHEN skill_name LIKE 'ns.spelling.%' THEN 'vocabulary'
    WHEN skill_name LIKE 'ns.collocations.%' THEN 'vocabulary'
    WHEN skill_name LIKE 'ns.idiom.%' THEN 'vocabulary'
    WHEN skill_name LIKE 'ns.expression.%' THEN 'vocabulary'
    WHEN skill_name LIKE 'ns.paraphrasing.%' THEN 'writing'
    WHEN skill_name LIKE 'ns.sentence.%' THEN 'grammar'
    WHEN skill_name LIKE 'ns.questions.%' THEN 'speaking'
    WHEN skill_name LIKE 'ns.comprehension.%' THEN 'reading'
    WHEN skill_name LIKE 'ns.dialogue.%' THEN 'speaking'
    WHEN skill_name LIKE 'ns.functional.%' THEN 'speaking'
    WHEN skill_name LIKE 'flashcard:%' THEN 'vocabulary'
    ELSE 'other'
  END;
$$;

-- 4. Backfill micro_skill for all existing records
UPDATE public.student_skill_metrics 
SET micro_skill = public.extract_micro_skill(skill_name)
WHERE micro_skill IS NULL;

-- 5. Also update skill_category for existing records using new function
UPDATE public.student_skill_metrics 
SET skill_category = public.extract_skill_category(skill_name);

-- 6. Update refresh trigger to also set micro_skill
CREATE OR REPLACE FUNCTION public.refresh_skill_metrics_on_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- 7. Update compute_skill_metric to also set micro_skill on upsert
CREATE OR REPLACE FUNCTION public.compute_skill_metric(p_student_id uuid, p_teacher_id uuid, p_skill_name text, p_skill_category text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  v_micro_skill TEXT;
  r RECORD;
BEGIN
  -- Extract micro_skill
  v_micro_skill := public.extract_micro_skill(p_skill_name);

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
      
      v_history := v_history || jsonb_build_object(
        'mastery', r.mastery_val,
        'date', to_char(r.created_at, 'YYYY-MM-DD')
      );
    END;
  END LOOP;
  
  -- Also handle flashcard events
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

  IF v_total_events = 0 THEN
    RETURN;
  END IF;

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

  -- Upsert with micro_skill
  INSERT INTO public.student_skill_metrics (
    student_id, teacher_id, skill_name, skill_category, micro_skill,
    current_mastery, trend, total_events, 
    first_event_at, last_event_at, mastery_history, updated_at
  ) VALUES (
    p_student_id, p_teacher_id, p_skill_name, p_skill_category, v_micro_skill,
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
    micro_skill = EXCLUDED.micro_skill,
    updated_at = now();
END;
$function$;

-- 8. Create aggregation view for micro_skill level
CREATE OR REPLACE VIEW public.student_micro_skill_metrics AS
SELECT 
  student_id,
  teacher_id,
  micro_skill,
  skill_category,
  ROUND(AVG(current_mastery), 1) AS avg_mastery,
  COUNT(*)::integer AS nano_skill_count,
  SUM(total_events)::integer AS total_events,
  MAX(last_event_at) AS last_activity,
  CASE
    WHEN COUNT(*) FILTER (WHERE trend = 'improving') > COUNT(*) FILTER (WHERE trend = 'declining') THEN 'improving'
    WHEN COUNT(*) FILTER (WHERE trend = 'declining') > COUNT(*) FILTER (WHERE trend = 'improving') THEN 'declining'
    ELSE 'stable'
  END AS trend
FROM student_skill_metrics
WHERE micro_skill IS NOT NULL AND micro_skill != 'other' AND micro_skill != 'flashcard'
GROUP BY student_id, teacher_id, micro_skill, skill_category;

-- 9. Add index for micro_skill queries
CREATE INDEX IF NOT EXISTS idx_skill_metrics_micro_skill 
ON public.student_skill_metrics (student_id, teacher_id, micro_skill);
