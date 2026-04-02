
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
  v_raw_mastery INTEGER;
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

    -- 3-scenario difficulty multiplier based on direction + back_type
    v_difficulty_multiplier := CASE 
      WHEN NEW.direction = 1 THEN 0.70  -- Sees EN term, guesses back = easiest
      WHEN NEW.direction = 2 AND COALESCE(v_back_type, 'translation') = 'definition' THEN 1.1  -- Sees EN definition, must recall EN term = hardest
      ELSE 1.0  -- Sees native translation, must recall EN term = normal
    END;

    v_raw_mastery := CASE 
      WHEN NEW.last_quality_rating < 2 THEN 0
      WHEN NEW.repetition >= 4 AND NEW.interval_days >= 21 THEN 100
      WHEN NEW.repetition >= 3 AND NEW.interval_days >= 6 THEN 90
      WHEN NEW.repetition = 2 THEN 70
      WHEN NEW.repetition = 1 THEN 50
      ELSE 60
    END;

    v_mastery_value := LEAST(ROUND(v_raw_mastery * v_difficulty_multiplier), 100);
    
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
        'difficulty_multiplier', v_difficulty_multiplier,
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
