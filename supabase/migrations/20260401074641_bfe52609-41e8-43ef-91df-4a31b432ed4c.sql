
-- Step 1: Add cefr_level column to flashcard_cards
ALTER TABLE public.flashcard_cards 
ADD COLUMN IF NOT EXISTS cefr_level TEXT DEFAULT NULL;

COMMENT ON COLUMN public.flashcard_cards.cefr_level IS 
  'CEFR level (A1-C2) of the word/phrase, assigned by AI during creation';

-- Step 2: Backfill existing cards based on student's english_level
UPDATE flashcard_cards fc
SET cefr_level = CASE
  WHEN s.english_level ILIKE '%A1%' OR s.english_level ILIKE '%Beginner%' THEN 'A1'
  WHEN s.english_level ILIKE '%A2%' OR s.english_level ILIKE '%Elementary%' 
       OR s.english_level ILIKE '%Pre-Intermediate%' THEN 'A2'
  WHEN s.english_level ILIKE '%B1%' OR s.english_level ILIKE '%Intermediate%' THEN 'B1'
  WHEN s.english_level ILIKE '%B2%' OR s.english_level ILIKE '%Upper%' THEN 'B2'
  WHEN s.english_level ILIKE '%C1%' OR s.english_level ILIKE '%Advanced%' THEN 'C1'
  WHEN s.english_level ILIKE '%C2%' OR s.english_level ILIKE '%Proficiency%' THEN 'C2'
  ELSE 'A2'
END
FROM flashcard_sets fs
JOIN students s ON fs.student_id = s.id
WHERE fc.set_id = fs.id
  AND fc.cefr_level IS NULL;

-- Step 3: Replace trigger function with skill_ids, element_type, and difficulty multiplier
CREATE OR REPLACE FUNCTION public.log_flashcard_review_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
  v_card_front TEXT;
  v_card_back TEXT;
  v_cefr_level TEXT;
  v_back_type TEXT;
  v_mastery_value INTEGER;
  v_skill_id TEXT;
  v_difficulty_multiplier NUMERIC;
BEGIN
  SELECT fs.student_id, fs.teacher_id, fs.back_type 
  INTO v_student_id, v_teacher_id, v_back_type
  FROM public.flashcard_sets fs
  WHERE fs.id = NEW.set_id;

  SELECT fc.front_text, fc.back_text, COALESCE(fc.cefr_level, 'A2')
  INTO v_card_front, v_card_back, v_cefr_level
  FROM public.flashcard_cards fc
  WHERE fc.id = NEW.card_id;

  IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
    v_skill_id := 'ns.' || v_cefr_level || '.vocabulary.definition_' ||
      trim(both '_' from regexp_replace(
        regexp_replace(
          regexp_replace(lower(COALESCE(v_card_front, 'unknown')), '[\s\-]+', '_', 'g'),
          '[^a-z0-9_]', '', 'g'),
        '_+', '_', 'g'
      ));

    v_difficulty_multiplier := CASE 
      WHEN COALESCE(v_back_type, 'translation') = 'definition' THEN 0.9
      ELSE 1.0
    END;

    v_mastery_value := ROUND((CASE 
      WHEN NEW.last_quality_rating < 2 THEN 0
      WHEN NEW.repetition >= 4 AND NEW.interval_days >= 21 THEN 100
      WHEN NEW.repetition >= 3 AND NEW.interval_days >= 6 THEN 90
      WHEN NEW.repetition = 2 THEN 70
      WHEN NEW.repetition = 1 THEN 50
      ELSE 60
    END) * v_difficulty_multiplier);
    
    INSERT INTO public.student_events (
      student_id, teacher_id, event_type, event_source, source_id,
      event_payload, skill_ids, element_type, mastery
    ) VALUES (
      v_student_id, v_teacher_id,
      'flashcard_review', 'flashcard', NEW.set_id,
      jsonb_build_object(
        'card_id', NEW.card_id,
        'set_id', NEW.set_id,
        'direction', NEW.direction,
        'back_type', COALESCE(v_back_type, 'translation'),
        'cefr_level', v_cefr_level,
        'card_front', v_card_front,
        'card_back', v_card_back,
        'mastery', v_mastery_value,
        'easiness_factor', NEW.easiness_factor,
        'repetition', NEW.repetition,
        'interval_days', NEW.interval_days,
        'total_reviews', NEW.total_reviews,
        'time_spent_seconds', ROUND(COALESCE(NEW.last_response_time_ms, 0) / 1000.0, 1)
      ),
      ARRAY[v_skill_id],
      'vocabulary',
      v_mastery_value
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log flashcard review event: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 4: Backfill existing flashcard_review events
UPDATE student_events
SET element_type = 'vocabulary'
WHERE event_type = 'flashcard_review' 
  AND element_type IS NULL;

UPDATE student_events se
SET skill_ids = ARRAY[
  'ns.' || COALESCE(fc.cefr_level, 'A2') || '.vocabulary.definition_' ||
    trim(both '_' from regexp_replace(
      regexp_replace(
        regexp_replace(lower(COALESCE((se.event_payload->>'card_front')::text, 'unknown')), 
          '[\s\-]+', '_', 'g'),
        '[^a-z0-9_]', '', 'g'),
      '_+', '_', 'g'
    ))
]
FROM flashcard_cards fc
WHERE se.event_type = 'flashcard_review'
  AND (se.event_payload->>'card_id')::uuid = fc.id
  AND (se.skill_ids IS NULL OR se.skill_ids = '{}');
