
-- Fix: Map ns.vocab.* to vocabulary (AI sometimes generates ns.vocab instead of ns.vocabulary)
CREATE OR REPLACE FUNCTION public.extract_skill_category(skill_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN skill_name LIKE 'ns.grammar.%' THEN 'grammar'
    WHEN skill_name LIKE 'ns.vocabulary.%' THEN 'vocabulary'
    WHEN skill_name LIKE 'ns.vocab.%' THEN 'vocabulary'
    WHEN skill_name LIKE 'ns.reading.%' THEN 'reading'
    WHEN skill_name LIKE 'ns.speaking.%' THEN 'speaking'
    WHEN skill_name LIKE 'ns.writing.%' THEN 'writing'
    WHEN skill_name LIKE 'ns.listening.%' THEN 'listening'
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

-- Re-categorize remaining "other" metrics
UPDATE student_skill_metrics
SET skill_category = public.extract_skill_category(skill_name)
WHERE skill_category = 'other';
