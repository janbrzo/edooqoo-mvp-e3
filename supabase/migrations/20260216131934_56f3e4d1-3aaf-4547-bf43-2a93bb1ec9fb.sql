
-- =====================================================
-- DSLM Layer A Audit: Normalize events + Fix triggers
-- =====================================================

-- STEP 1: Normalize old event naming to canonical types
-- =====================================================

-- Old worksheet events → student_learning_activity / worksheet
UPDATE student_events SET event_type = 'student_learning_activity', event_source = 'worksheet'
WHERE event_type = 'worksheet_answer_saved' AND event_source = 'worksheet';

UPDATE student_events SET event_type = 'student_learning_activity', event_source = 'worksheet'
WHERE event_type = 'learning_activity' AND event_source = 'worksheet_answer_saved';

-- Old homework events → student_learning_activity / homework
UPDATE student_events SET event_type = 'student_learning_activity', event_source = 'homework'
WHERE event_type = 'learning_activity' AND event_source = 'homework_answer_saved';

UPDATE student_events SET event_type = 'student_learning_activity', event_source = 'homework'
WHERE event_type = 'homework_answer_saved' AND event_source = 'homework';

-- Old homework submitted → homework_submitted / homework
UPDATE student_events SET event_type = 'homework_submitted', event_source = 'homework'
WHERE event_type = 'homework_answer_submitted' AND event_source = 'homework';

-- Old teacher exercise mastery → mark_done_evaluation / teacher
UPDATE student_events SET event_type = 'mark_done_evaluation'
WHERE event_type = 'exercise_mastery_evaluation' AND event_source = 'teacher';

-- Old flashcard source typo (flashcards → flashcard)
UPDATE student_events SET event_source = 'flashcard'
WHERE event_type = 'flashcard_review' AND event_source = 'flashcards';

-- STEP 2: Flashcard mastery - weighted formula + populate mastery column
-- =====================================================

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
  v_mastery_value INTEGER;
BEGIN
  SELECT fs.student_id, fs.teacher_id INTO v_student_id, v_teacher_id
  FROM public.flashcard_sets fs
  WHERE fs.id = NEW.set_id;

  SELECT fc.front_text, fc.back_text INTO v_card_front, v_card_back
  FROM public.flashcard_cards fc
  WHERE fc.id = NEW.card_id;

  IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
    -- Weighted mastery formula based on SM-2 parameters
    v_mastery_value := CASE 
      WHEN NEW.last_quality_rating < 2 THEN 0
      WHEN NEW.repetition >= 4 AND NEW.interval_days >= 21 THEN 100
      WHEN NEW.repetition >= 3 AND NEW.interval_days >= 6 THEN 90
      WHEN NEW.repetition = 2 THEN 70
      WHEN NEW.repetition = 1 THEN 50
      ELSE 60
    END;
    
    INSERT INTO public.student_events (
      student_id, teacher_id, event_type, event_source, source_id,
      event_payload, mastery
    ) VALUES (
      v_student_id, v_teacher_id,
      'flashcard_review', 'flashcard', NEW.set_id,
      jsonb_build_object(
        'card_id', NEW.card_id,
        'set_id', NEW.set_id,
        'direction', NEW.direction,
        'card_front', v_card_front,
        'card_back', v_card_back,
        'mastery', v_mastery_value,
        'easiness_factor', NEW.easiness_factor,
        'repetition', NEW.repetition,
        'interval_days', NEW.interval_days,
        'total_reviews', NEW.total_reviews,
        'time_spent_seconds', ROUND(COALESCE(NEW.last_response_time_ms, 0) / 1000.0, 1)
      ),
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

-- STEP 3: Backfill mastery column for old flashcard events that have NULL mastery
-- =====================================================

UPDATE student_events
SET mastery = CASE
  WHEN (event_payload->>'mastery')::int IS NOT NULL THEN (event_payload->>'mastery')::int
  ELSE NULL
END
WHERE event_type = 'flashcard_review' AND mastery IS NULL AND event_payload->>'mastery' IS NOT NULL;

-- STEP 4: Cleanup welcome_test_section_progress bloat
-- Keep only the latest event per student per section
-- =====================================================

DELETE FROM student_events
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY student_id, event_payload->>'section'
        ORDER BY created_at DESC
      ) as rn
    FROM student_events
    WHERE event_type = 'welcome_test_section_progress'
  ) sub
  WHERE rn > 1
);
