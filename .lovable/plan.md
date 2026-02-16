# DSLM Layer A - Deep Audit and Layer B Readiness Assessment

## Executive Summary

Layer A (Event Log) is functionally working but has **3 critical issues** that MUST be fixed before moving to Layer B. The data you showed me is real and the structures are mostly good -- but there's a naming inconsistency mess and a flashcard mastery logic gap.

---

## ISSUE 1: Flashcard Mastery -- Binary 0/100 Problem

### Your observation is partially correct

You noticed `"mastery": 100` even on `"repetition": 1`. Here's why:

The current SQL trigger (`log_flashcard_review_event`) does this:

```text
mastery = quality_rating >= 2 ? 100 : 0
```

This means: "Did the student click 'I Know This' (100%) or 'Again' (0%)?" -- it's a **single-review snapshot**, not a cumulative measure.

### Why this is a problem for DSLM

In Layer B, when you compute a student's actual mastery of a vocabulary item, you need **weighted mastery** that considers:

- How many times the card was reviewed (`total_reviews`)
- The spaced repetition interval (`interval_days`) -- a card with interval 30 days is much better known than interval 1 day
- The easiness factor (`easiness_factor`) -- lower EF = harder card
- Whether the student keeps getting it right over time

### The fix

The raw event data is actually **sufficient** for Layer B to compute weighted mastery. All the SM-2 parameters are already in the payload. But the `mastery` field in the event misleads -- it should reflect a more nuanced score.

**Proposed formula for the trigger:**

```text
mastery = CASE
  WHEN quality_rating < 2 THEN 0                    -- Failed = 0%
  WHEN repetition = 1 THEN 50                       -- First correct = 50%
  WHEN repetition = 2 THEN 70                       -- Second correct = 70%
  WHEN repetition >= 3 AND interval_days >= 6 THEN 90   -- Well-known = 90%
  WHEN repetition >= 4 AND interval_days >= 21 THEN 100  -- Mastered = 100%
  ELSE 60                                            -- Default correct
END
```

This gives Layer B a more accurate per-event mastery signal while keeping all raw SM-2 data for deeper analysis.

**Additionally**: The `mastery` column in `student_events` table should also be populated (currently it's NULL for flashcard events). This column exists but isn't being set by the flashcard trigger.

### Verdict: Data is SUFFICIENT but mastery calculation needs improvement

---

## ISSUE 2: Worksheet and Homework Data -- CORRECT but naming is INCONSISTENT

### Your sample data is correct

The `nano_skill_ratings` structure with `name`, `reason`, `mastery`, `hasValue`, `question_index` is exactly what Layer B needs. The `time_spent_seconds` and `answer_id` are present. This is good.

### The critical problem: Event naming chaos

Looking at the actual database, there are **5 different naming conventions** for essentially the same type of event:

```text
event_type                  | event_source              | count | period
----------------------------|---------------------------|-------|--------
worksheet_answer_saved      | worksheet                 | 90    | Jan 1 - Feb 2 (OLD)
learning_activity           | worksheet_answer_saved    | 14    | Feb 2 - Feb 7 (MEDIUM)
student_learning_activity   | worksheet                 | 21    | Feb 7 - Feb 12 (NEW)
homework_answer_saved       | homework                  | 29    | Dec 30 (OLD)
learning_activity           | homework_answer_saved     | 61    | Feb 3 - Feb 7 (MEDIUM)
student_learning_activity   | homework                  | 13    | Feb 8 - Feb 15 (NEW)
homework_answer_submitted   | homework                  | 48    | (OLD)
homework_submitted          | homework                  | 7     | (OLD)
```

This means **3 different trigger versions** have been deployed over time, each using different event_type/event_source pairs. Layer B would need to handle all these variants -- that's fragile and error-prone.

### The fix

1. Choose ONE canonical naming convention and stick with it:  
student_learning_activity   | worksheet                 | 21    | Feb 7 - Feb 12 (NEW)  
and  
student_learning_activity   | homework                  | 13    | Feb 8 - Feb 15 (NEW)
2. Write a one-time migration to normalize old events
3. Update triggers to use the canonical names

**Proposed canonical naming:**


| Source                    | event_type                      | event_source   |
| ------------------------- | ------------------------------- | -------------- |
| Student answers worksheet | `student_learning_activity`     | `worksheet`    |
| Student answers homework  | `student_learning_activity`     | `homework`     |
| Student submits homework  | `homework_submitted`            | `homework`     |
| Flashcard review          | `flashcard_review`              | `flashcard`    |
| Teacher Mark Done         | `mark_done_evaluation`          | `worksheet`    |
| Teacher observation       | `teacher_observation`           | `teacher`      |
| AI evaluation (10min)     | `10min_AI_evaluation`           | `worksheet`    |
| Knowledge entry           | `knowledge_entry_added`         | `teacher`      |
| Welcome test progress     | `welcome_test_section_progress` | `welcome_test` |
| Welcome test complete     | `welcome_test_completed`        | `welcome_test` |


Then normalize existing data with a migration:

```sql
UPDATE student_events SET event_type = 'student_learning_activity', event_source = 'worksheet'
WHERE event_type = 'worksheet_answer_saved' AND event_source = 'worksheet';

UPDATE student_events SET event_type = 'student_learning_activity', event_source = 'worksheet'
WHERE event_type = 'learning_activity' AND event_source = 'worksheet_answer_saved';

UPDATE student_events SET event_type = 'student_learning_activity', event_source = 'homework'
WHERE event_type = 'learning_activity' AND event_source = 'homework_answer_saved';

UPDATE student_events SET event_type = 'student_learning_activity', event_source = 'homework'
WHERE event_type = 'homework_answer_saved' AND event_source = 'homework';

UPDATE student_events SET event_type = 'homework_submitted', event_source = 'homework'
WHERE event_type = 'homework_answer_submitted' AND event_source = 'homework';
```

### Verdict: Data STRUCTURE is correct, but NAMING needs normalization

---

## ISSUE 3: Homework Data -- CORRECT

The homework payload you showed is well-structured:

- `nano_skill_ratings` with per-question mastery -- GOOD
- `time_spent_seconds: 117.5` -- realistic active time -- GOOD
- `is_submitted: true` -- submission status -- GOOD
- `answer_id` -- traceable -- GOOD

**One missing field:** The `mastery` column in `student_events` is not populated by the homework trigger. Only the AI evaluation events have it. The trigger should set `mastery` = average of nano_skill_ratings mastery values.

### Verdict: CORRECT and sufficient. Add mastery column population.

---

## ISSUE 4: Welcome Test Data -- CORRECT but needs cleanup

### Event types are correct:

- `test_answer_submitted` / `test` -- individual answer events (from other test types too, not just welcome test)
- `welcome_test_section_progress` / `welcome_test` -- section aggregates
- `welcome_test_completed` / `welcome_test` -- final completion

### Problem: Section progress bloat

You have 146 `welcome_test_section_progress` events. For 2 completed tests with ~10 sections each, you'd expect ~20 events. The 146 means the dedup fix (sectionKey = sectionId) from Round 3 hasn't been deployed yet OR old bloated events haven't been cleaned up.

### The completed test payload is good:

- `estimated_level`, `grammar_score`, `vocabulary_score` -- GOOD
- `profile_summary` with psychological traits -- GOOD
- `detected_traits` -- GOOD

### Fix: Clean up old bloated section events and verify the dedup is working.

### Verdict: CORRECT structure. Clean up old bloat.

---

## ISSUE 5: Layer A Readiness for Layer B -- Assessment

### What's READY:

1. **nano_skill_ratings** -- Granular per-question mastery for worksheets and homework -- EXCELLENT
2. **time_spent_seconds** -- Active time tracking with visibility API -- EXCELLENT
3. **SM-2 parameters** for flashcards -- EXCELLENT
4. **AI evaluations** -- Quality scores for open-ended exercises -- GOOD
5. **Teacher observations** and knowledge entries -- GOOD
6. **Welcome test profiling** -- Psychological traits and skill scores -- GOOD

### What MUST be fixed before Layer B:

1. **Event naming normalization** -- All events must use canonical types (migration + trigger update)
2. **Flashcard mastery formula** -- Change from binary 0/100 to weighted scale
3. **Mastery column population** -- All triggers should SET the `mastery` column, not just payload
4. **Old data cleanup** -- Remove duplicate/bloated events

### What Layer B will compute:

- Aggregate mastery per nano_skill across all sources (worksheet + homework + flashcard + test)
- Time-weighted decay (skills not practiced recently lose mastery)
- Confidence scoring (more data points = higher confidence)
- Skill grouping by element_type (grammar, vocabulary, speaking, etc.)
- Progress trends over time windows

---

## Implementation Plan

### Step 1: Event Naming Normalization

- Write SQL migration to normalize all old events to canonical names
- Update `log_worksheet_answer_to_events()` trigger: `event_type = 'student_learning_activity'`, `event_source = 'worksheet'`
- Update `log_homework_answer_to_events()` trigger: `event_type = 'student_learning_activity'`, `event_source = 'homework'`
- Update TypeScript types in `events.ts` to match

### Step 2: Flashcard Mastery Fix

- Update `log_flashcard_review_event()` trigger with weighted mastery formula
- Populate `mastery` column in `student_events` for flashcard events

### Step 3: Mastery Column for All Triggers

- All 3 triggers (worksheet, homework, flashcard) compute average mastery from nano_skill_ratings and set the `mastery` column

### Step 4: Old Data Cleanup

- Delete duplicate `welcome_test_section_progress` events (keep latest per section per student)
- Delete old `homework_answer_submitted` duplicates of `homework_submitted`

### Step 5: Update TypeScript Types

- Sync `events.ts` with canonical event types
- Remove deprecated event types

### Step 6: Documentation Update

- Update all 6 docs + README

### Files to Change:


| File                       | Change                                             |
| -------------------------- | -------------------------------------------------- |
| New SQL migration          | Normalize old events + update 3 triggers + cleanup |
| `src/types/dslm/events.ts` | Canonical event types                              |
| 6 documentation files      | DSLM Layer A audit results                         |


### What this does NOT change (safe):

- No frontend component changes
- No edge function changes
- No hook logic changes
- Only SQL triggers and TypeScript type definitions
- Old data normalized, not deleted (except true duplicates)