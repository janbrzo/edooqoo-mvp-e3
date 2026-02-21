
-- Step 2: Rename remaining flashcard: metrics to ns.* format (no duplicates now)
UPDATE student_skill_metrics ssm
SET 
  skill_name = 'ns.' || 
    CASE
      WHEN s.english_level ILIKE '%A1%' OR s.english_level ILIKE '%Beginner%' THEN 'A1'
      WHEN s.english_level ILIKE '%A2%' OR s.english_level ILIKE '%Elementary%' OR s.english_level ILIKE '%Pre-Intermediate%' THEN 'A2'
      WHEN s.english_level ILIKE '%B1%' OR s.english_level ILIKE '%Intermediate%' THEN 'B1'
      WHEN s.english_level ILIKE '%B2%' OR s.english_level ILIKE '%Upper%' THEN 'B2'
      WHEN s.english_level ILIKE '%C1%' OR s.english_level ILIKE '%Advanced%' THEN 'C1'
      WHEN s.english_level ILIKE '%C2%' OR s.english_level ILIKE '%Proficiency%' THEN 'C2'
      ELSE 'A2'
    END || '.vocabulary.definition_' ||
    trim(both '_' from regexp_replace(
      regexp_replace(
        regexp_replace(lower(COALESCE(fc.front_text, 'unknown')), '[\s\-]+', '_', 'g'),
        '[^a-z0-9_]', '', 'g'),
      '_+', '_', 'g'
    )),
  skill_category = 'vocabulary',
  micro_skill = 'vocab'
FROM flashcard_cards fc
JOIN flashcard_sets fs ON fc.set_id = fs.id
JOIN students s ON fs.student_id = s.id
WHERE ssm.skill_name LIKE 'flashcard:%'
  AND ssm.skill_name = 'flashcard:' || fc.id::text;

-- Step 3: Backfill student_events with NULL skill_ids for flashcard_review events
UPDATE student_events se
SET skill_ids = ARRAY[
  'ns.' || 
    CASE
      WHEN s.english_level ILIKE '%A1%' OR s.english_level ILIKE '%Beginner%' THEN 'A1'
      WHEN s.english_level ILIKE '%A2%' OR s.english_level ILIKE '%Elementary%' OR s.english_level ILIKE '%Pre-Intermediate%' THEN 'A2'
      WHEN s.english_level ILIKE '%B1%' OR s.english_level ILIKE '%Intermediate%' THEN 'B1'
      WHEN s.english_level ILIKE '%B2%' OR s.english_level ILIKE '%Upper%' THEN 'B2'
      WHEN s.english_level ILIKE '%C1%' OR s.english_level ILIKE '%Advanced%' THEN 'C1'
      WHEN s.english_level ILIKE '%C2%' OR s.english_level ILIKE '%Proficiency%' THEN 'C2'
      ELSE 'A2'
    END || '.vocabulary.definition_' ||
    trim(both '_' from regexp_replace(
      regexp_replace(
        regexp_replace(lower(COALESCE((se.event_payload->>'card_front')::text, 'unknown')), '[\s\-]+', '_', 'g'),
        '[^a-z0-9_]', '', 'g'),
      '_+', '_', 'g'
    ))
]
FROM students s
WHERE se.event_type = 'flashcard_review'
  AND (se.skill_ids IS NULL OR se.skill_ids = '{}')
  AND se.student_id = s.id;
