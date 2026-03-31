

# Plan: Naprawa nadpisywania eventów po Submit w Homework

## Diagnoza

### Root cause znaleziony

W `HomeworkPage.tsx` linia 680, każdy div ćwiczenia ma handler:
```
onBlur={handleExerciseBlur(index, exercise.type)}
```

Gdy student klika przycisk Play na nagraniu audio po submicie, **focus przesuwa się** z diva ćwiczenia → przeglądarka odpala `onBlur` → wywołuje `saveOnBlur()` → który wywołuje `saveAnswer()` → który woła RPC `save_homework_answer` → który triggeruje `log_homework_answer_to_events()`.

Problem: **`saveOnBlur` nie sprawdza czy homework jest już submitted.** Zapisuje odpowiedź na nowo, ale bez `ai_evaluation` i `item_evaluations` z AI eval (bo te dane nie są przesyłane w `saveOnBlur` — używa `buildItemEvaluations` które zwraca tylko basic nano_skills bez AI scores). Trigger SQL kasuje stare eventy i wstawia nowe z `nano_skill_ratings: []`.

To samo dotyczy `updateAudioAnswer` (linia 614) — nie sprawdza `isSubmitted`, choć `HomeworkPage.tsx` podaje no-op function gdy `finalIsSubmitted=true`, to `saveOnBlur` nie ma tego zabezpieczenia.

### Dlaczego shared worksheet nie ma tego problemu

W `SharedWorksheet.tsx` nie znalazłem `onBlur` na divie ćwiczenia — problem dotyczy **wyłącznie Homework**.

---

## Plan naprawy — 1 zmiana, 3 punkty

### Zmiana 1: Guard `isSubmitted` w `saveOnBlur`, `updateAudioAnswer` i `scheduleAutoSave`

**Plik:** `src/hooks/useInteractiveHomework.tsx`

Dodać early return na początku trzech funkcji gdy homework jest submitted:

**`saveOnBlur` (linia 247):**
```typescript
const saveOnBlur = useCallback((exerciseIndex: number, exerciseType: string) => {
    if (isSubmitted) return;  // ← NOWE: nie zapisuj po submicie
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    // ... reszta bez zmian
}, [answers, saveAnswer, exercises, isSubmitted]);  // ← dodać isSubmitted do deps
```

**`updateAudioAnswer` (linia 614):**
```typescript
const updateAudioAnswer = useCallback((exerciseIndex: number, questionIndex: number, audioUrl: string) => {
    if (isSubmitted) return;  // ← NOWE: nie zapisuj po submicie
    // ... reszta bez zmian
}, [answers, exercises, saveAnswer, sourceWorksheetId, homeworkId, audioAnswers, isSubmitted]);  // ← dodać isSubmitted
```

**`scheduleAutoSave` (linia 196):**
```typescript
const scheduleAutoSave = useCallback((exerciseIndex: number, exerciseType: string, exerciseAnswers: ExerciseAnswers) => {
    if (isSubmitted) return;  // ← NOWE: nie zapisuj po submicie
    // ... reszta bez zmian
}, [saveAnswer, exercises, isSubmitted]);  // ← dodać isSubmitted
```

### Zmiana 2: Reset homework do testów

**Migracja SQL:**
```sql
UPDATE homework_student_answers
SET is_submitted = false, submitted_at = NULL, ai_evaluation = NULL, 
    item_evaluations = NULL, eval_trigger = NULL, mastery = NULL
WHERE homework_id = (SELECT id FROM homework_assignments 
    WHERE share_token = 'c81caca14d21b916005ab3abe32a7a6a8d669350ae8f921fa2e440ff38a13a53');

UPDATE homework_assignments
SET completed_at = NULL, completed_by_teacher = false, reviewed_at = NULL, reviewed_by = NULL
WHERE share_token = 'c81caca14d21b916005ab3abe32a7a6a8d669350ae8f921fa2e440ff38a13a53';
```

---

## Zmieniane pliki

| Plik | Zmiana |
|------|--------|
| `src/hooks/useInteractiveHomework.tsx` | `isSubmitted` guard w `saveOnBlur`, `updateAudioAnswer`, `scheduleAutoSave` |
| Migracja SQL | Reset homework submission |
| `docs/TECHNICAL_DOCUMENTATION.md` | Dokumentacja guarda |
| `docs/CURRENT_STATE_ANALYSIS.md` | Status naprawy |

## Co NIE zmienia się

- `HomeworkSpeakingRecorder` — playback nie woła `onAudioSaved` (potwierdzone w kodzie)
- `HomeworkPage.tsx` — `onBlur` zostaje (potrzebny dla niezsubmitowanych homework)
- `useInteractiveSharedWorksheet.tsx` — nie ma tego problemu
- SQL triggery — bez zmian
- Edge Functions — bez zmian

## Test akceptacyjny

1. Zresetować homework → nagrać audio → Send Homework
2. Po submit sprawdzić `subscription_events` — powinny mieć `nano_skill_ratings` z ocenami
3. Kliknąć Play na nagraniu → sprawdzić `subscription_events` — **nie powinny się zmienić**

