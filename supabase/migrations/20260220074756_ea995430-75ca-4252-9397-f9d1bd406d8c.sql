
-- ============================================
-- DSLM Layer A Backfill - Round 12
-- Finalizacja danych przed Layer B
-- ============================================

-- Krok 1: Backfill flashcard mastery (407 eventow z NULL mastery)
UPDATE student_events
SET mastery = CASE 
  WHEN (event_payload->>'repetition')::int = 0 THEN 0
  WHEN (event_payload->>'repetition')::int >= 4 
    AND (event_payload->>'interval_days')::int >= 21 THEN 100
  WHEN (event_payload->>'repetition')::int >= 3 
    AND (event_payload->>'interval_days')::int >= 6 THEN 90
  WHEN (event_payload->>'repetition')::int = 2 THEN 70
  WHEN (event_payload->>'repetition')::int = 1 THEN 50
  ELSE 60
END
WHERE event_source = 'flashcard' AND mastery IS NULL;

-- Krok 1b: Sync payload.mastery z kolumna mastery
UPDATE student_events
SET event_payload = jsonb_set(
  event_payload, '{mastery}', to_jsonb(mastery::int)
)
WHERE event_source = 'flashcard' 
AND mastery IS NOT NULL 
AND event_payload->>'mastery' IS NULL;

-- Krok 2: Backfill flashcard element_type (441 eventow)
UPDATE student_events
SET element_type = 'vocabulary'
WHERE event_source = 'flashcard' AND element_type IS NULL;

-- Krok 3: Backfill welcome_test mastery z nano_skill_ratings
UPDATE student_events
SET mastery = (
  SELECT ROUND(AVG((elem->>'mastery')::numeric))
  FROM jsonb_array_elements(event_payload->'nano_skill_ratings') elem
  WHERE (elem->>'mastery')::numeric >= 0 
    AND (elem->>'hasValue')::boolean = true
)
WHERE event_source = 'welcome_test' 
AND mastery IS NULL
AND jsonb_array_length(COALESCE(event_payload->'nano_skill_ratings', '[]'::jsonb)) > 0;

-- Krok 4: Backfill worksheet/homework element_type
UPDATE student_events
SET element_type = event_payload->>'exercise_type'
WHERE event_source IN ('worksheet', 'homework')
AND element_type IS NULL
AND event_payload->>'exercise_type' IS NOT NULL;
