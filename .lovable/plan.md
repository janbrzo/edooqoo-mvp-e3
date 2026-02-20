# DSLM Layer B - Rozwiazanie fragmentacji nano_skills

## DIAGNOZA PROBLEMU

Dane sa jednoznaczne:

- 138 unikalnych nano_skills w kategorii "speaking" ale lacznie tylko 201 eventow (1.5 event/skill)
- 145 unikalnych nano_skills w "reading" ale lacznie 191 eventow (1.3 event/skill)
- 73% wszystkich nano_skills ma dokladnie 1 event

Przyczyna: AI generuje unikalne, kontekstowe nazwy nano_skill jak `ns.grammar.conditional_1_advice_online_growth` zamiast powtarzalnych jak `ns.cond1.main_clause_future_will`.

---

## WYBOR ROZWIAZANIA

Masz racje - Opcja B (grupowanie SQL) jest lepsza niz hybryda. Dlaczego:

1. **AI generujace micro_skill bedzie miec TEN SAM problem unikalnosci** - kazdy model AI "unikalizuje" nazwy. Nawet z lista kanonicznych nazw, AI czesto dodaje kontekst. To ryzyko jest realne.
2. **Grupowanie SQL jest DETERMINISTYCZNE** - regex nie "wymysla", zawsze zwroci ten sam wynik.
3. **Mozna naprawic historyczne dane** - 855 istniejacych nano_skills zostanie pogrupowane retroaktywnie.
4. **Ale samo grupowanie SQL NIE WYSTARCZY** - trzeba TEZ poprawic prompt zeby AI generowal KROTSZE, bardziej powtarzalne nazwy. Inaczej problem bedzie narastad.

**Wiec robimy DWA kroki:**

- Krok A: Poprawic golden prompt - lepsze przyklady nano_skill z nowa konwencja nazewnicza
- Krok B: Dodac SQL grouping (`extract_micro_skill()`) dla agregacji istniejacych + przyszlych danych

---

## NOWA KONWENCJA NAZEWNICZA NANO_SKILLS

Obecny format: `ns.grammar.conditional_1_advice_online_growth`
Nowy format: `ns.cond1.main_clause_future_will`

Zasada: po `ns.` idzie **skrot tematu gramatycznego** (nie "grammar"/"vocab" - to jest zbyt ogolne), a nastepnie **nazwa umiejetnosci bez kontekstu lekcji**.

Twoja propozycja przedrostkow jest dobra. Oto pelna mapa:

```text
GRAMMAR:
  t.ps   = Past Simple           -> ns.ps.*
  t.pc   = Past Continuous       -> ns.pc.*
  t.pp   = Past Perfect          -> ns.pp.*
  t.prs  = Present Simple        -> ns.prs.*
  t.prc  = Present Continuous    -> ns.prc.*
  t.prp  = Present Perfect       -> ns.prp.*
  t.prpc = Pres. Perfect Cont.   -> ns.prpc.*
  t.fs   = Future Simple (will)  -> ns.fs.*
  t.fg   = Future Going To       -> ns.fg.*
  t.fc   = Future Continuous     -> ns.fc.*
  t.cond1 = First Conditional    -> ns.cond1.*
  t.cond2 = Second Conditional   -> ns.cond2.*
  t.cond3 = Third Conditional    -> ns.cond3.*
  t.condm = Mixed Conditionals   -> ns.condm.*
  t.passive = Passive Voice      -> ns.passive.*
  t.rs   = Reported Speech       -> ns.rs.*
  t.rel  = Relative Clauses      -> ns.rel.*
  t.mod  = Modal Verbs           -> ns.mod.*
  t.ger_inf = Gerund/Infinitive  -> ns.ger_inf.*
  t.phr  = Phrasal Verbs         -> ns.phr.*
  t.comp = Comparatives          -> ns.comp.*
  t.sup  = Superlatives          -> ns.sup.*
  t.art  = Articles              -> ns.art.*
  t.prep = Prepositions          -> ns.prep.*
  t.wo   = Word Order            -> ns.wo.*
  t.neg  = Negative Prefixes     -> ns.neg.*
  t.wf   = Word Formation        -> ns.wf.*

VOCABULARY:
  t.vocab = General Vocabulary    -> ns.vocab.*
  t.coll  = Collocations          -> ns.coll.*
  t.idiom = Idioms                -> ns.idiom.*
  t.syn   = Synonyms              -> ns.syn.*
  t.ant   = Antonyms              -> ns.ant.*

SKILLS:
  t.reading   = Reading           -> ns.reading.*
  t.speaking  = Speaking          -> ns.speaking.*
  t.writing   = Writing           -> ns.writing.*
  t.listening = Listening         -> ns.listening.*
```

---

## ZMIANY W GOLDEN PROMPT (core-instructions.ts)

Punkt 22 nie zmieni sie z obecnego:

```
22. PEDAGOGICAL SKILL TAGGING
Each individual exercise item MUST include EXACTLY one nano_skill...
A nano_skill represents the smallest observable and testable unit...
```

**Dla kazdego exercise type** dodam 5-8 zlotych przykladow. Oto konkretne przyklady:

### Reading exercise:

```
reading:
  ns.reading.main_idea_extraction
  ns.reading.detail_extraction
  ns.reading.inference_from_context
  ns.reading.paraphrase_recognition
  ns.reading.sequence_of_events
  ns.reading.cause_effect_identification
  ns.reading.character_emotion_analysis
  ns.reading.vocabulary_in_context
```

### True-False:

```
true-false:
  ns.reading.paraphrase_recognition
  ns.reading.negation_detection
  ns.reading.detail_verification
  ns.reading.inference_validation
  ns.reading.fact_vs_opinion
```

### Matching:

```
matching:
  ns.vocab.definition_matching
  ns.vocab.contextual_meaning
  ns.vocab.word_category_recognition
  ns.coll.verb_noun_pairing
  ns.vocab.register_awareness
```

### Fill-in-blanks:

```
fill-in-blanks:
  ns.vocab.adjective_collocation
  ns.vocab.contextual_word_choice
  ns.vocab.semantic_field_selection
  ns.[grammar_prefix].form_selection
  ns.coll.fixed_expression
```

### Multiple-choice (grammar focused):

```
multiple-choice:
  ns.comp.irregular_form (good->better)
  ns.sup.long_adjective_form (most delicious)
  ns.comp.short_adjective_form (spicier)
  ns.comp.adverb_form (more slowly)
  ns.[grammar_prefix].form_recognition
```

### Dialogue:

```
dialogue:
  ns.speaking.polite_request
  ns.speaking.making_complaint
  ns.speaking.expressing_gratitude
  ns.speaking.apologizing
  ns.speaking.ordering_food
  ns.speaking.asking_for_information
```

### Discussion:

```
discussion:
  ns.speaking.opinion_expression
  ns.speaking.justifying_preference
  ns.speaking.narrating_past_experience
  ns.speaking.comparison_and_contrast
  ns.speaking.hypothetical_reasoning
```

### Error-correction:

```
error-correction:
  ns.comp.double_comparative_error
  ns.sup.double_superlative_error
  ns.[grammar_prefix].form_error_recognition
  ns.[grammar_prefix].word_order_error
```

### Odd-one-out:

```
odd-one-out:
  ns.vocab.part_of_speech_recognition
  ns.vocab.gerund_recognition
  ns.vocab.semantic_category_identification
```

### Synonyms/Antonyms:

```
synonyms:
  ns.syn.adjective_synonym
  ns.syn.verb_synonym
  ns.syn.formal_informal_equivalent
antonyms:
  ns.ant.adjective_antonym
  ns.ant.verb_antonym
  ns.ant.gradable_opposite
```

### Sentence-transformation:

```
sentence-transformation:
  ns.passive.active_to_passive
  ns.rs.direct_to_indirect
  ns.comp.not_as_as_structure
  ns.sup.superlative_transformation
  ns.cond1.unless_transformation
```

### Word-order:

```
word-order:
  ns.wo.subject_verb_object
  ns.wo.adverb_frequency_position
  ns.wo.question_inversion
  ns.wo.adjective_order
```

### Gap-text:

```
gap-text:
  ns.ps.irregular_verb_form
  ns.prp.continuous_form
  ns.cond2.subjunctive_were
  ns.[grammar_prefix].verb_conjugation
```

### Negative-prefixes:

```
negative-prefixes:
  ns.neg.prefix_un_selection
  ns.neg.prefix_dis_selection
  ns.neg.prefix_im_selection
  ns.neg.prefix_in_selection
  ns.neg.prefix_ir_selection
```

### Categorize:

```
categorize:
  ns.vocab.semantic_categorization
  ns.vocab.word_family_grouping
  ns.vocab.register_categorization
```

### Paraphrasing:

```
paraphrasing:
  ns.writing.synonym_substitution
  ns.writing.structural_paraphrase
  ns.writing.meaning_preservation
```

### Complete-word:

```
complete-word:
  ns.vocab.vowel_pattern_recognition
  ns.vocab.spelling_from_context
```

### Matching-halves:

```
matching-halves:
  ns.reading.clause_connection
  ns.reading.semantic_coherence
  ns.[grammar_prefix].subordinate_clause
```

### Listening exercises:

```
listening-comprehension:
  ns.listening.main_idea_identification
  ns.listening.detail_extraction
  ns.listening.speaker_identification
  ns.listening.emotion_inference
  ns.listening.sequence_of_events
```

---

## SQL GROUPING (extract_micro_skill)

Funkcja `extract_micro_skill()` bedzie mapowac kazda nazwe nano_skill na kanoniczny "macro":

```text
ns.grammar.conditional_1_*        -> cond1
ns.grammar.conditional_2_*        -> cond2
ns.grammar.future_going_to_*      -> fg
ns.grammar.future_will_*          -> fs
ns.grammar.future_simple_*        -> fs
ns.grammar.reported_speech*       -> rs
ns.grammar.passive_voice*         -> passive
ns.grammar.present_simple*        -> prs
ns.grammar.past_simple*           -> ps
ns.cond1.*                        -> cond1  (nowy format)
ns.cond2.*                        -> cond2  (nowy format)
ns.ps.*                           -> ps     (nowy format)
ns.rs.*                           -> rs     (nowy format)
ns.reading.*                      -> reading
ns.speaking.*                     -> speaking
ns.listening.*                    -> listening
ns.writing.*                      -> writing
ns.vocab.*                        -> vocab
ns.vocabulary.*                   -> vocab
ns.syn.*                          -> syn
ns.ant.*                          -> ant
ns.comp.*                         -> comp
ns.sup.*                          -> sup
ns.neg.*                          -> neg
ns.coll.*                         -> coll
ns.phr.*                          -> phr
ns.mod.*                          -> mod
ns.wo.*                           -> wo
ns.wf.*                           -> wf
```

Ta funkcja bedzie uzywana w `compute_skill_metric()` do agregacji na poziomie micro_skill. Dodamy kolumne `micro_skill` do `student_skill_metrics` i stworzymy dodatkowy widok `student_micro_skill_metrics` agregujacy dane per  micro.

---

## PROBLEM 2A: Period Filter

Dodamy nad summary cards rzad przyciskow z presetami i polem custom:

```text
Period: [3d] [7d] [14d] [30d] [60d] [90d] [120d] [180d] [All] [Custom: ___]
```

Implementacja:

- Nowy state `periodDays: number | null` w `SkillsOverviewPanel`
- `useSkillMetrics` dostanie parametr `periodDays`
- Filtrowanie w SQL query: `.gte('last_event_at', cutoffDate)`
- Radar chart i category breakdown automatycznie sie zaktualizuja

---

## PROBLEM 2B: Sparkline

Nowy komponent `MasterySparkline` (Recharts `LineChart`, ~100x28px):

- Dane z `mastery_history` JSONB (juz istnieja w student_skill_metrics)
- Kolor: zielony=improving, czerwony=declining, szary=stable
- Brak osi, brak tooltip - czysty mini-wykres
- Wyswietlany obok MasteryBar w liscie nano_skills
- Jesli < 2 punkty historii - nie pokazuj

---

## PODSUMOWANIE ZMIAN


| Plik                         | Zmiana                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| `core-instructions.ts`       | Rozbudowany punkt 22 z nowa konwencja i 5-8 zlotych przykladow na kazdy exercise type                |
| `individual-exercises.ts`    | Aktualizacja przykladowych nano_skill nazw w JSON templates (nowe prefiksy)                          |
| SQL migracja                 | Kolumna `micro`_skill, funkcja extract_`micro`_skill(), backfill, modyfikacja compute_skill_metric() |
| SQL view                     | student_micro_skill_metrics (agregacja per micro)                                                    |
| `useSkillMetrics.tsx`        | Parametr periodDays, filtrowanie SQL                                                                 |
| `SkillsOverviewPanel.tsx`    | Period filter UI, sparkline, przelacznik nano/micro view                                             |
| Nowy: `MasterySparkline.tsx` | Mini-chart komponent                                                                                 |
| 6 plikow dokumentacji        | Aktualizacja                                                                                         |


### Czego NIE zmieniamy:

- Layer A (student_events tabela i triggery) - dane nietkniete
- Worksheet/Homework/Flashcard frontend - bez zmian
- process-welcome-test - bez zmian
- Struktura JSON exercises (format nano_skill object zostaje taki sam - name/confidence/reason)

### Kolejnosc implementacji:

1. Prompt: Nowy punkt 22 w core-instructions.ts + aktualizacja przykladow w individual-exercises.ts
2. SQL: `micro`_skill infrastruktura + backfill istniejacych danych
3. Frontend: Period filter + Sparkline + micro/Nano toggle
4. Dokumentacja