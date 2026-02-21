
-- ============================================================
-- Backfill flashcard metrics in 3 separate steps to handle duplicates
-- ============================================================

-- Step 1: Delete flashcard: rows that would create duplicates
-- (keep the existing ns.* row, delete the flashcard: row, merge data)
WITH flashcard_to_new AS (
  SELECT 
    ssm.id AS old_id,
    ssm.student_id,
    ssm.teacher_id,
    ssm.current_mastery,
    ssm.total_events,
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
          regexp_replace(lower(COALESCE(fc.front_text, 'unknown')), '[\s\-]+', '_', 'g'),
          '[^a-z0-9_]', '', 'g'),
        '_+', '_', 'g'
      )) AS new_name
  FROM student_skill_metrics ssm
  JOIN flashcard_cards fc ON ssm.skill_name = 'flashcard:' || fc.id::text
  JOIN flashcard_sets fs ON fc.set_id = fs.id
  JOIN students s ON fs.student_id = s.id
  WHERE ssm.skill_name LIKE 'flashcard:%'
),
-- Find all duplicates: flashcard rows whose new_name already exists OR appears multiple times
dupes_to_delete AS (
  SELECT f.old_id
  FROM flashcard_to_new f
  WHERE EXISTS (
    SELECT 1 FROM student_skill_metrics existing
    WHERE existing.student_id = f.student_id
      AND existing.teacher_id = f.teacher_id
      AND existing.skill_name = f.new_name
      AND existing.id != f.old_id
  )
  OR f.old_id NOT IN (
    -- Keep only the first row per (student, teacher, new_name) group
    SELECT DISTINCT ON (student_id, teacher_id, new_name) old_id
    FROM flashcard_to_new
    ORDER BY student_id, teacher_id, new_name, current_mastery DESC NULLS LAST
  )
)
DELETE FROM student_skill_metrics WHERE id IN (SELECT old_id FROM dupes_to_delete);
