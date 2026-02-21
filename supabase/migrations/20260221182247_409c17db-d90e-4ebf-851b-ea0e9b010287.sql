
-- DSLM Layer B v5: Update extract_micro_skill() and extract_skill_category() 
-- to support new CEFR format: ns.[CEFR].[full_topic].[skill_name]
-- with backward compatibility for old abbreviation format and legacy format

-- 1. Updated extract_micro_skill() with CEFR format support
CREATE OR REPLACE FUNCTION public.extract_micro_skill(skill_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    -- ===== NEW CEFR FORMAT: ns.[A1-C2].[full_topic].* =====
    WHEN skill_name ~ '^ns\.[ABC][12]\.' THEN
      CASE
        WHEN skill_name ~ '^ns\.[ABC][12]\.past_simple\.' THEN 'past_simple'
        WHEN skill_name ~ '^ns\.[ABC][12]\.past_continuous\.' THEN 'past_continuous'
        WHEN skill_name ~ '^ns\.[ABC][12]\.past_perfect\.' THEN 'past_perfect'
        WHEN skill_name ~ '^ns\.[ABC][12]\.present_simple\.' THEN 'present_simple'
        WHEN skill_name ~ '^ns\.[ABC][12]\.present_continuous\.' THEN 'present_continuous'
        WHEN skill_name ~ '^ns\.[ABC][12]\.present_perfect_continuous\.' THEN 'present_perfect_continuous'
        WHEN skill_name ~ '^ns\.[ABC][12]\.present_perfect\.' THEN 'present_perfect'
        WHEN skill_name ~ '^ns\.[ABC][12]\.future_simple\.' THEN 'future_simple'
        WHEN skill_name ~ '^ns\.[ABC][12]\.future_going_to\.' THEN 'future_going_to'
        WHEN skill_name ~ '^ns\.[ABC][12]\.future_continuous\.' THEN 'future_continuous'
        WHEN skill_name ~ '^ns\.[ABC][12]\.first_conditional\.' THEN 'first_conditional'
        WHEN skill_name ~ '^ns\.[ABC][12]\.second_conditional\.' THEN 'second_conditional'
        WHEN skill_name ~ '^ns\.[ABC][12]\.third_conditional\.' THEN 'third_conditional'
        WHEN skill_name ~ '^ns\.[ABC][12]\.mixed_conditionals\.' THEN 'mixed_conditionals'
        WHEN skill_name ~ '^ns\.[ABC][12]\.passive_voice\.' THEN 'passive_voice'
        WHEN skill_name ~ '^ns\.[ABC][12]\.reported_speech\.' THEN 'reported_speech'
        WHEN skill_name ~ '^ns\.[ABC][12]\.relative_clauses\.' THEN 'relative_clauses'
        WHEN skill_name ~ '^ns\.[ABC][12]\.modal_verbs\.' THEN 'modal_verbs'
        WHEN skill_name ~ '^ns\.[ABC][12]\.gerund_infinitive\.' THEN 'gerund_infinitive'
        WHEN skill_name ~ '^ns\.[ABC][12]\.phrasal_verbs\.' THEN 'phrasal_verbs'
        WHEN skill_name ~ '^ns\.[ABC][12]\.comparatives\.' THEN 'comparatives'
        WHEN skill_name ~ '^ns\.[ABC][12]\.superlatives\.' THEN 'superlatives'
        WHEN skill_name ~ '^ns\.[ABC][12]\.articles\.' THEN 'articles'
        WHEN skill_name ~ '^ns\.[ABC][12]\.prepositions\.' THEN 'prepositions'
        WHEN skill_name ~ '^ns\.[ABC][12]\.word_order\.' THEN 'word_order'
        WHEN skill_name ~ '^ns\.[ABC][12]\.negative_prefixes\.' THEN 'negative_prefixes'
        WHEN skill_name ~ '^ns\.[ABC][12]\.word_formation\.' THEN 'word_formation'
        WHEN skill_name ~ '^ns\.[ABC][12]\.vocabulary\.' THEN 'vocabulary'
        WHEN skill_name ~ '^ns\.[ABC][12]\.collocations\.' THEN 'collocations'
        WHEN skill_name ~ '^ns\.[ABC][12]\.idioms\.' THEN 'idioms'
        WHEN skill_name ~ '^ns\.[ABC][12]\.synonyms\.' THEN 'synonyms'
        WHEN skill_name ~ '^ns\.[ABC][12]\.antonyms\.' THEN 'antonyms'
        WHEN skill_name ~ '^ns\.[ABC][12]\.reading\.' THEN 'reading'
        WHEN skill_name ~ '^ns\.[ABC][12]\.speaking\.' THEN 'speaking'
        WHEN skill_name ~ '^ns\.[ABC][12]\.writing\.' THEN 'writing'
        WHEN skill_name ~ '^ns\.[ABC][12]\.listening\.' THEN 'listening'
        WHEN skill_name ~ '^ns\.[ABC][12]\.visual_comprehension\.' THEN 'visual_comprehension'
        ELSE 'other'
      END

    -- ===== OLD ABBREVIATION FORMAT: ns.prefix.* (backward compat) =====
    WHEN skill_name LIKE 'ns.ps.%' THEN 'past_simple'
    WHEN skill_name LIKE 'ns.pc.%' THEN 'past_continuous'
    WHEN skill_name LIKE 'ns.pp.%' THEN 'past_perfect'
    WHEN skill_name LIKE 'ns.prs.%' THEN 'present_simple'
    WHEN skill_name LIKE 'ns.prc.%' THEN 'present_continuous'
    WHEN skill_name LIKE 'ns.prp.%' THEN 'present_perfect'
    WHEN skill_name LIKE 'ns.prpc.%' THEN 'present_perfect_continuous'
    WHEN skill_name LIKE 'ns.fs.%' THEN 'future_simple'
    WHEN skill_name LIKE 'ns.fg.%' THEN 'future_going_to'
    WHEN skill_name LIKE 'ns.fc.%' THEN 'future_continuous'
    WHEN skill_name LIKE 'ns.cond1.%' THEN 'first_conditional'
    WHEN skill_name LIKE 'ns.cond2.%' THEN 'second_conditional'
    WHEN skill_name LIKE 'ns.cond3.%' THEN 'third_conditional'
    WHEN skill_name LIKE 'ns.condm.%' THEN 'mixed_conditionals'
    WHEN skill_name LIKE 'ns.passive.%' THEN 'passive_voice'
    WHEN skill_name LIKE 'ns.rs.%' THEN 'reported_speech'
    WHEN skill_name LIKE 'ns.rel.%' THEN 'relative_clauses'
    WHEN skill_name LIKE 'ns.mod.%' THEN 'modal_verbs'
    WHEN skill_name LIKE 'ns.ger_inf.%' THEN 'gerund_infinitive'
    WHEN skill_name LIKE 'ns.phr.%' THEN 'phrasal_verbs'
    WHEN skill_name LIKE 'ns.comp.%' THEN 'comparatives'
    WHEN skill_name LIKE 'ns.sup.%' THEN 'superlatives'
    WHEN skill_name LIKE 'ns.art.%' THEN 'articles'
    WHEN skill_name LIKE 'ns.prep.%' THEN 'prepositions'
    WHEN skill_name LIKE 'ns.wo.%' THEN 'word_order'
    WHEN skill_name LIKE 'ns.neg.%' THEN 'negative_prefixes'
    WHEN skill_name LIKE 'ns.wf.%' THEN 'word_formation'
    WHEN skill_name LIKE 'ns.vocab.%' THEN 'vocabulary'
    WHEN skill_name LIKE 'ns.coll.%' THEN 'collocations'
    WHEN skill_name LIKE 'ns.idiom.%' THEN 'idioms'
    WHEN skill_name LIKE 'ns.syn.%' THEN 'synonyms'
    WHEN skill_name LIKE 'ns.ant.%' THEN 'antonyms'
    WHEN skill_name LIKE 'ns.reading.%' THEN 'reading'
    WHEN skill_name LIKE 'ns.speaking.%' THEN 'speaking'
    WHEN skill_name LIKE 'ns.writing.%' THEN 'writing'
    WHEN skill_name LIKE 'ns.listening.%' THEN 'listening'

    -- ===== LEGACY FORMAT: ns.grammar.*, ns.vocabulary.*, etc. =====
    WHEN skill_name ~ '^ns\.grammar\.conditional_1' THEN 'first_conditional'
    WHEN skill_name ~ '^ns\.grammar\.conditional_2' THEN 'second_conditional'
    WHEN skill_name ~ '^ns\.grammar\.conditional_3' THEN 'third_conditional'
    WHEN skill_name ~ '^ns\.grammar\.mixed_conditional' THEN 'mixed_conditionals'
    WHEN skill_name ~ '^ns\.grammar\.future_going_to' THEN 'future_going_to'
    WHEN skill_name ~ '^ns\.grammar\.future_will' THEN 'future_simple'
    WHEN skill_name ~ '^ns\.grammar\.future_simple' THEN 'future_simple'
    WHEN skill_name ~ '^ns\.grammar\.future_continuous' THEN 'future_continuous'
    WHEN skill_name ~ '^ns\.grammar\.past_simple' THEN 'past_simple'
    WHEN skill_name ~ '^ns\.grammar\.past_continuous' THEN 'past_continuous'
    WHEN skill_name ~ '^ns\.grammar\.past_perfect' THEN 'past_perfect'
    WHEN skill_name ~ '^ns\.grammar\.present_simple' THEN 'present_simple'
    WHEN skill_name ~ '^ns\.grammar\.present_continuous' THEN 'present_continuous'
    WHEN skill_name ~ '^ns\.grammar\.present_perfect_continuous' THEN 'present_perfect_continuous'
    WHEN skill_name ~ '^ns\.grammar\.present_perfect' THEN 'present_perfect'
    WHEN skill_name ~ '^ns\.grammar\.passive' THEN 'passive_voice'
    WHEN skill_name ~ '^ns\.grammar\.reported_speech' THEN 'reported_speech'
    WHEN skill_name ~ '^ns\.grammar\.relative' THEN 'relative_clauses'
    WHEN skill_name ~ '^ns\.grammar\.modal' THEN 'modal_verbs'
    WHEN skill_name ~ '^ns\.grammar\.gerund' THEN 'gerund_infinitive'
    WHEN skill_name ~ '^ns\.grammar\.infinitive' THEN 'gerund_infinitive'
    WHEN skill_name ~ '^ns\.grammar\.phrasal' THEN 'phrasal_verbs'
    WHEN skill_name ~ '^ns\.grammar\.comparative' THEN 'comparatives'
    WHEN skill_name ~ '^ns\.grammar\.superlative' THEN 'superlatives'
    WHEN skill_name ~ '^ns\.grammar\.article' THEN 'articles'
    WHEN skill_name ~ '^ns\.grammar\.preposition' THEN 'prepositions'
    WHEN skill_name ~ '^ns\.grammar\.word_order' THEN 'word_order'
    WHEN skill_name ~ '^ns\.grammar\.negative_prefix' THEN 'negative_prefixes'
    WHEN skill_name ~ '^ns\.grammar\.word_formation' THEN 'word_formation'
    WHEN skill_name ~ '^ns\.grammar\.not_as_as' THEN 'comparatives'
    WHEN skill_name ~ '^ns\.grammar\.double_comparative' THEN 'comparatives'
    WHEN skill_name ~ '^ns\.grammar\.double_superlative' THEN 'superlatives'
    WHEN skill_name ~ '^ns\.grammar\.adverb_frequency' THEN 'word_order'
    WHEN skill_name ~ '^ns\.grammar\.would_like' THEN 'modal_verbs'
    WHEN skill_name LIKE 'ns.grammar.%' THEN 'grammar_other'
    WHEN skill_name LIKE 'ns.vocabulary.%' THEN 'vocabulary'
    WHEN skill_name LIKE 'ns.spelling.%' THEN 'vocabulary'
    WHEN skill_name LIKE 'ns.morphology.%' THEN 'word_formation'
    WHEN skill_name LIKE 'ns.collocations.%' THEN 'collocations'
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

-- 2. Updated extract_skill_category() with CEFR format + visual_comprehension
CREATE OR REPLACE FUNCTION public.extract_skill_category(skill_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    -- ===== NEW CEFR FORMAT: ns.[A1-C2].[topic].* =====
    WHEN skill_name ~ '^ns\.[ABC][12]\.(past_simple|past_continuous|past_perfect|present_simple|present_continuous|present_perfect|present_perfect_continuous|future_simple|future_going_to|future_continuous|first_conditional|second_conditional|third_conditional|mixed_conditionals|passive_voice|reported_speech|relative_clauses|modal_verbs|gerund_infinitive|phrasal_verbs|comparatives|superlatives|articles|prepositions|word_order|negative_prefixes|word_formation)\.' THEN 'grammar'
    WHEN skill_name ~ '^ns\.[ABC][12]\.(vocabulary|collocations|idioms|synonyms|antonyms)\.' THEN 'vocabulary'
    WHEN skill_name ~ '^ns\.[ABC][12]\.reading\.' THEN 'reading'
    WHEN skill_name ~ '^ns\.[ABC][12]\.speaking\.' THEN 'speaking'
    WHEN skill_name ~ '^ns\.[ABC][12]\.writing\.' THEN 'writing'
    WHEN skill_name ~ '^ns\.[ABC][12]\.listening\.' THEN 'listening'
    WHEN skill_name ~ '^ns\.[ABC][12]\.visual_comprehension\.' THEN 'visual_comprehension'

    -- ===== OLD ABBREVIATION FORMAT =====
    WHEN skill_name ~ '^ns\.(ps|pc|pp|prs|prc|prp|prpc|fs|fg|fc|cond1|cond2|cond3|condm|passive|rs|rel|mod|ger_inf|phr|comp|sup|art|prep|wo|neg|wf)\.' THEN 'grammar'
    WHEN skill_name ~ '^ns\.(vocab|coll|idiom|syn|ant)\.' THEN 'vocabulary'
    WHEN skill_name LIKE 'ns.reading.%' THEN 'reading'
    WHEN skill_name LIKE 'ns.speaking.%' THEN 'speaking'
    WHEN skill_name LIKE 'ns.writing.%' THEN 'writing'
    WHEN skill_name LIKE 'ns.listening.%' THEN 'listening'

    -- ===== LEGACY FORMAT =====
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

-- 3. Backfill micro_skill and skill_category for ALL existing records with updated functions
UPDATE public.student_skill_metrics 
SET micro_skill = public.extract_micro_skill(skill_name),
    skill_category = public.extract_skill_category(skill_name);

-- 4. Update student_category_metrics view to include visual_comprehension
CREATE OR REPLACE VIEW public.student_category_metrics AS
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
FROM student_skill_metrics
WHERE skill_category != 'other'
GROUP BY student_id, teacher_id, skill_category;
