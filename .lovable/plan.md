

# Plan naprawy: 5 problemow

## PROBLEM 1A: Create Homework trigger za pozno (w modalu zamiast na przycisku)

### Przyczyna

Przycisk "Create Homework" na toolbarze worksheet (`WorksheetToolbar.tsx` linia 377) wywoluje `onCreateHomework` ktory w `WorksheetDisplay.tsx` (linia 686) robi TYLKO `setShowHomeworkModal(true)` - otwiera modal. AI Evaluation jest triggerowana dopiero w `CreateHomeworkModal.tsx` linia 270 - wewnatrz modalu po kliknieciu "Create Homework Assignment".

### Rozwiazanie

Przeniesc wywolanie `process-pending-ai-evaluations` z `CreateHomeworkModal.tsx` do `handleCreateHomework` w `WorksheetDisplay.tsx`. Czyli AI eval odpali sie ZANIM modal sie otworzy.

**Zmiana w `WorksheetDisplay.tsx`** (linia 686-706):
```typescript
const handleCreateHomework = async () => {
  // ... walidacja userId i worksheetId (bez zmian) ...
  
  // Trigger AI evaluation TERAZ - przed otwarciem modalu
  try {
    console.log('[WorksheetDisplay] Triggering AI eval before Create Homework modal');
    await supabase.functions.invoke('process-pending-ai-evaluations', {
      body: { worksheet_id: worksheetId, trigger_source: 'create_homework' }
    });
  } catch (err) {
    console.warn('[WorksheetDisplay] AI eval failed (non-critical):', err);
  }
  
  setShowHomeworkModal(true);
};
```

**Zmiana w `CreateHomeworkModal.tsx`** (linia 267-276): Usunac blok wywolujacy `process-pending-ai-evaluations` z handlera tworzenia homework w modalu.

---

## PROBLEM 1B: Timing 10-minutowego timera

Uzytkownik zaobserwowal: odpowiedz wpisana o 8:36, druga o 8:42, AI eval odpalilo o 8:52. Pozniej: odpowiedz o 8:51, AI eval o 9:12 (nie o 9:01).

### Wyjasnienie

Timer sprawdza co 1 minute (linia 445: `setInterval(checkAndTriggerAiEval, ONE_MINUTE)`). Warunek to "10 minut od **ostatniego zapisu**" (linia 380: `timeSinceLastSave >= TEN_MINUTES`). 

- Scenariusz 1: Ostatni zapis 8:42, timer check o 8:52 (10 min passed) -> triggeruje. POPRAWNE.
- Scenariusz 2: Ostatni zapis 8:51. Timer check o 9:01 -> 10 min? Tak! ALE jest drugi warunek (linia 386): `lastSavedAt.getTime() > lastAiEvalTriggerRef.current`. Jesli o 8:52 juz byl trigger, to `lastAiEvalTriggerRef.current = 8:52`. Nowy save 8:51 < 8:52 -> warunek NIE spelniony! Timer czeka na NASTEPNY inteval check po nowym save.

Problem: `lastAiEvalTriggerRef` porownuje z `lastSavedAt` ale `lastSavedAt` to React state ktory moze sie nie odswiezyc idealnie. Prawdopodobnie odpowiedz o 8:51 ustawila `lastSavedAt` na Date(8:51), ale `lastAiEvalTriggerRef` bylo Date(8:52) -> warunek `8:51 > 8:52` = false. Dopiero kolejne zapisanie (o 9:01 lub pozniej) ustawilo nowe `lastSavedAt` i timer o 9:12 zobaczyl 10 min minelo.

### Rozwiazanie

Zmienic logike warunku - zamiast porownywac timestamp ref z lastSavedAt, sprawdzac czy od ostatniego TRIGERA minelo wystarczajaco duzo czasu I czy byly NOWE odpowiedzi po ostatnim trigerze:

```typescript
if (timeSinceLastSave >= TEN_MINUTES && 
    lastSavedAt.getTime() > lastAiEvalTriggerRef.current) {
```

Problem jest w tym ze `lastSavedAt` (8:51) jest WCZESNIEJSZE niz `lastAiEvalTriggerRef` (8:52). Fix: po ustawieniu `lastAiEvalTriggerRef` trzeba uzyc `lastSavedAt.getTime()` zamiast `Date.now()`:

```typescript
// BYLO:
lastAiEvalTriggerRef.current = Date.now();

// BEDZIE:
lastAiEvalTriggerRef.current = lastSavedAt.getTime();
```

To gwarantuje ze kazdy NOWY save (po AI eval) bedzie mial timestamp WIEKSZY niz ref i warunek bedzie spelniony po 10 min od tego nowego save.

---

## PROBLEM 1C i 1D: Create Homework nie dziala po student_learning_activity

### Przyczyna (POTWIERDZONA danymi z bazy)

Gdy student wpisal nowa odpowiedz po AI eval, `worksheet_student_answers.eval_trigger` NIE jest resetowany do NULL (patrz Problem 2 ponizej). `needs_ai_evaluation` sprawdza `last_saved_at > last_ai_eval_at`. Jesli student wpisa odpowiedz o 9:50, `last_saved_at = 9:50 > last_ai_eval_at = 9:47` -> `needs_ai_evaluation = TRUE`. 

ALE: `save_worksheet_answer` tez nie resetuje `eval_trigger`. Wiec `eval_trigger` zostaje jako np. `'10min_inactivity'` z poprzedniej AI eval. Gdy Create Homework triggeruje edge function, ta ustawia `eval_trigger = 'create_homework'` przy UPDATE. To powinno dzialac...

Sprawdzam dalej: edge function `process-pending-ai-evaluations` auto-queue logika (linia 275) wywoluje `needs_ai_evaluation`. Jesli student wpisa nowa odpowiedz po AI eval, `last_saved_at > last_ai_eval_at` = TRUE -> kolejkuje -> przetwarza -> UPDATE z `eval_trigger = 'create_homework'` -> trigger zapisze `create_hw_AI_evaluation`. To POWINNO dzialac.

Problem moze byc w tym ze `save_worksheet_answer` NIE resetuje `eval_trigger` do NULL. Wiec gdy student wpisal nowa odpowiedz, trigger odpalil sie z STARYM `eval_trigger = '10min_inactivity'` i zapisa event jako `10min_AI_evaluation` zamiast `student_learning_activity`. Nastepnie `needs_ai_evaluation` widzi `last_saved_at > last_ai_eval_at` ale... wait, `last_ai_eval_at` nie jest aktualizowane przez student save, wiec nadal `last_saved_at > last_ai_eval_at` = TRUE.

Czyli problem C i D to TEN SAM bug co Problem 2 - `eval_trigger` nie jest resetowany. Fix Problem 2 naprawi tez C i D.

---

## PROBLEM 2: event_type nie zmienia sie na student_learning_activity po zmianie odpowiedzi przez studenta

### Przyczyna (POTWIERDZONA)

Funkcja `save_worksheet_answer` robi UPSERT:
```sql
ON CONFLICT (worksheet_id, student_email, exercise_index)
DO UPDATE SET
    answers = EXCLUDED.answers,
    exercise_type = EXCLUDED.exercise_type,
    time_spent_ms = EXCLUDED.time_spent_ms,
    mastery = EXCLUDED.mastery,
    item_evaluations = EXCLUDED.item_evaluations,
    last_saved_at = NOW()
```

**NIE resetuje `eval_trigger` do NULL!** Wiec po AI eval ustawiajacej `eval_trigger = '10min_inactivity'`, kazdy kolejny save studenta nadal ma `eval_trigger = '10min_inactivity'`, i trigger mapuje to na `10min_AI_evaluation` zamiast `student_learning_activity`.

### Rozwiazanie

Dodac `eval_trigger = NULL` do ON CONFLICT UPDATE w `save_worksheet_answer`:

```sql
ON CONFLICT (worksheet_id, student_email, exercise_index)
DO UPDATE SET
    answers = EXCLUDED.answers,
    exercise_type = EXCLUDED.exercise_type,
    time_spent_ms = EXCLUDED.time_spent_ms,
    mastery = EXCLUDED.mastery,
    item_evaluations = EXCLUDED.item_evaluations,
    eval_trigger = NULL,        -- RESET! Student save = no AI trigger
    last_saved_at = NOW()
```

To samo dla `save_homework_answer`.

---

## PROBLEM 3: Zla struktura event_payload

### Roznice

**Stara (poprawna):**
```json
{
  "answer_id": "d37c558b-...",
  "exercise_type": "discussion",
  "exercise_index": 5,
  "nano_skill_ratings": [...],
  "time_spent_seconds": 2.4
}
```

**Nowa (zla):**
```json
{
  "answers": {"0": "cute but ", ...},
  "exercise_type": "answer-questions-audio",
  "time_spent_ms": 48775,
  "exercise_index": 1,
  "nano_skill_ratings": [...]
}
```

### 3 roznice:
1. Brak `answer_id` -> zastapione przez `answers` (surowy JSONB odpowiedzi)
2. `time_spent_seconds` -> zamienione na `time_spent_ms`
3. Dodane `answers` (surowe dane) - to nie powinno byc w event_payload

### Rozwiazanie

Zmienic trigger SQL aby:
1. Dodac `answer_id` = `NEW.id` (UUID rekordu `worksheet_student_answers`)
2. Zamienic `time_spent_ms` na `time_spent_seconds` = `NEW.time_spent_ms / 1000.0`
3. Usunac `answers` z payloadu - surowe odpowiedzi nie sa potrzebne w event logu (sa w `worksheet_student_answers`)

```sql
jsonb_build_object(
  'answer_id', NEW.id,
  'exercise_index', NEW.exercise_index,
  'exercise_type', NEW.exercise_type,
  'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1),
  'nano_skill_ratings', COALESCE(v_nano_skill_ratings, '[]'::jsonb)
)
```

To samo dla homework trigger (ktory dodatkowo zachowa `is_submitted`).

---

## PODSUMOWANIE ZMIAN

| # | Plik | Zmiana | Problem |
|---|------|--------|---------|
| 1 | `src/components/WorksheetDisplay.tsx` | Dodac wywolanie `process-pending-ai-evaluations` w `handleCreateHomework` PRZED otwarciem modalu | 1A |
| 2 | `src/components/homework/CreateHomeworkModal.tsx` | Usunac wywolanie `process-pending-ai-evaluations` z handlera tworzenia homework | 1A |
| 3 | `src/hooks/useInteractiveSharedWorksheet.tsx` | Zmienic `lastAiEvalTriggerRef.current = Date.now()` na `lastAiEvalTriggerRef.current = lastSavedAt.getTime()` | 1B |
| 4 | Migracja SQL: `save_worksheet_answer` | Dodac `eval_trigger = NULL` do ON CONFLICT UPDATE | 2, 1C, 1D |
| 5 | Migracja SQL: `save_homework_answer` | Dodac `eval_trigger = NULL` do ON CONFLICT UPDATE | 2 |
| 6 | Migracja SQL: `log_worksheet_answer_to_events` | Zmienic event_payload: dodac `answer_id`, zamienic `time_spent_ms` na `time_spent_seconds`, usunac `answers` | 3 |
| 7 | Migracja SQL: `log_homework_answer_to_events` | Analogiczna zmiana event_payload | 3 |
| 8 | Dokumentacja | Aktualizacja scenariuszy i struktur | 1E |

### Zaktualizowane scenariusze (Problem 1E)

| Scenariusz | Trigger | event_type w student_events |
|---|---|---|
| Student wpisuje/zmienia odpowiedz | Auto-save 1.5s -> `save_worksheet_answer` (eval_trigger=NULL) | `student_learning_activity` |
| 10 min bez aktywnosci | Timer frontend -> queue -> edge function -> UPDATE z eval_trigger='10min_inactivity' | `10min_AI_evaluation` |
| Nauczyciel klika Create Homework (przycisk na worksheet) | `handleCreateHomework` -> edge function (PRZED modalem) -> UPDATE z eval_trigger='create_homework' | `create_hw_AI_evaluation` |
| Student klika Submit Homework | Submit handler -> UPDATE z eval_trigger='submit_homework' | `submit_hw_AI_evaluation` |
| Nauczyciel klika Mark Done | RPC `add_student_event` bezposrednio | `mark_done_evaluation` |

### Bezpieczenstwo zmian

- Zmiana 1-2 (przeniesienie AI eval): przenosiny kodu z modalu do handlera - ta sama funkcja, inny moment wywolania
- Zmiana 3 (timer ref): zmiana jednej linii - naprawia timing, nie zmienia logiki
- Zmiana 4-5 (eval_trigger NULL): dodanie jednego pola do UPSERT - istniejace dane nie sa dotykane, nowe zapisy beda poprawne
- Zmiana 6-7 (event_payload): zmiana struktury payloadu w triggerze - dotyczy NOWYCH eventow, stare rekordy zostaja bez zmian

