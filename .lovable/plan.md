

# Plan: Naprawa 4 problemów DSLM + Readiness Checklist

## Problem 1: Wolne otwieranie Create Homework (~10s)

**Root cause:** W `WorksheetDisplay.tsx` linia 714, kliknięcie "Create Homework" najpierw `await`-uje `supabase.functions.invoke('process-pending-ai-evaluations')` — czyli czeka na zakończenie pełnego pipeline'u AI evaluation ZANIM otworzy modal. To trwa ~10s gdy jest wiele pending evaluations, albo nawet gdy ich nie ma (cold start edge function).

**Naprawa:** Odpalić `process-pending-ai-evaluations` w tle (fire-and-forget) i natychmiast otworzyć modal. AI eval powinien działać asynchronicznie — jego wyniki i tak trafiają do bazy i nie wpływają na tworzenie homework.

**Dokładna zmiana w `src/components/WorksheetDisplay.tsx`:**

```typescript
const handleCreateHomework = async () => {
  if (!userId) { /* existing validation */ return; }
  if (!worksheetId) { /* existing validation */ return; }
  
  // Fire-and-forget: trigger AI eval in background, don't block modal
  supabase.functions.invoke('process-pending-ai-evaluations', {
    body: { worksheet_id: worksheetId, trigger_source: 'create_homework' }
  }).then(({ error }) => {
    if (error) console.error('[WorksheetDisplay] Background AI eval error:', error);
    else devLog('[WorksheetDisplay] Background AI eval completed');
  }).catch(err => console.warn('[WorksheetDisplay] Background AI eval network error:', err));
  
  // Open modal immediately — no waiting
  setShowHomeworkModal(true);
};
```

Usunąć `setIsAiEvalLoading(true/false)` — nie jest już potrzebny skoro nie blokujemy UI.

---

## Problem 2: Odtwarzanie nagrania nadpisuje eventy po Submit

**Root cause:** Przeanalizowałem głęboko i playback (`playAudio` w `HomeworkSpeakingRecorder`) NIE wywołuje `onAudioSaved`. Callback `onAudioAnswerChange` jest ustawiony na no-op po submit (linia 710 `HomeworkPage.tsx`).

Natomiast problem „nadpisywania" (wpis z `nano_skill_ratings: []` i `student_learning_activity`) wynika z kodu persystencji transkrypcji na liniach 473-489 `useInteractiveHomework.tsx`. Ta pętla robi `.update({ answers: existingAnswers })` dla ćwiczeń z audio, które NIE miały AI eval. Ten update:
1. Ustawia `answers` (nowa wartość z `_transcription_X`)  
2. NIE ustawia `eval_trigger` → trigger widzi `eval_trigger = NULL` (lub wartość z poprzedniego update)
3. Trigger robi DELETE + INSERT z `event_type = 'student_learning_activity'`
4. `nano_skill_ratings` bierze z `NEW.item_evaluations` — ale jeśli `item_evaluations` zostały ustawione TYLKO dla ćwiczeń w `dbUpdates`, a ten update jest dla ćwiczeń POZA `dbUpdates`, to `item_evaluations` może być NULL

**Ale jest jeszcze głębszy problem:** Trigger strzelą na KAŻDY update `homework_student_answers`, nawet te po submit. To oznacza, że gdyby cokolwiek zrobiło update na tabelę po zakończeniu submit flow, eventy zostałyby nadpisane.

**Naprawa dwuetapowa:**

### A) Guard w SQL trigger: nie nadpisuj eventów po submit

Dodać do triggera `log_homework_answer_to_events()` warunek: jeśli istnieją eventy z `event_type = 'submit_hw_AI_evaluation'` dla tego exercise_index, to NIE rób DELETE + INSERT. To zapobiega nadpisywaniu ocen po submit niezależnie od tego, co triggeruje update na tabelę.

```sql
-- Na początku triggera, po pobraniu v_student_id:
-- Skip re-logging if this exercise already has submit-evaluated events
-- (prevents transcription persistence from overwriting AI eval results)
IF EXISTS (
  SELECT 1 FROM student_events 
  WHERE student_id = v_student_id 
    AND source_id = NEW.homework_id
    AND (event_payload->>'exercise_index')::int = NEW.exercise_index
    AND event_type = 'submit_hw_AI_evaluation'
) AND NEW.eval_trigger IS DISTINCT FROM 'submit_homework' THEN
  RETURN NEW;
END IF;
```

### B) Guard w frontendzie: nie rób update po submit

W pętli persystencji transkrypcji (linia 473), sprawdzić czy homework jest submitted i czy to ćwiczenie nie zostało już zaktualizowane z AI eval:

Ale to jest mniej krytyczne bo guard SQL rozwiązuje problem niezależnie od frontendu.

---

## Problem 3: Mastery i skill_ids — wyjaśnienie + czy działa poprawnie

**Co widzisz w `student_events`:**
- `event_payload.nano_skill_ratings` → tablica z obiektami `{name, mastery, hasValue, ...}` — każdy nano-skill ma swoje INDYWIDUALNE mastery
- `mastery` (kolumna) → ŚREDNIA z nano_skill_ratings → 75 = `(70 + 75) / 2` → tak, poprawnie
- `skill_ids` → wyciągnięte nazwy nano-skilli z ratings → `["ns.B1.grammar.going_to_for_plans", "ns.B1.grammar.will_for_spontaneous_decision"]` → poprawnie

**Jak to działa w Layer B:**
1. Trigger na `student_events` (INSERT) wywołuje `compute_skill_metric()` dla KAŻDEGO skill_name z `skill_ids`
2. `compute_skill_metric()` przeszukuje WSZYSTKIE eventy studenta, znajduje WSZYSTKIE nano_skill_ratings z danym `name` (np. `ns.B1.grammar.going_to_for_plans`)
3. Oblicza weighted average (`exp(-0.03 * days_ago)`) — nowsze wyniki mają większą wagę
4. Zapisuje/aktualizuje wiersz w `student_skill_metrics` z `current_mastery`, `trend`, `history`

**Odpowiedź: TAK, działa poprawnie.** Kolumna `mastery` w `student_events` to agregat dla tego eventu, ale Layer B IGNORUJE ją — bezpośrednio czyta z `nano_skill_ratings[].mastery` wewnątrz payloadu, matchując po `name`. Każdy nano-skill dostaje SWOJĄ indywidualną mastery w `student_skill_metrics`.

---

## Problem 4: DSLM Layer A/B/C/D Readiness Checklist

Na podstawie analizy kodu i migracji:

### Layer A — Event Log ✅ (95% gotowy)
- ✅ Tabela `student_events` z kanonicznymi typami
- ✅ Triggery SQL automatycznie logują z homework, worksheet, flashcard, test
- ✅ Separacja written/audio eventów z osobnym mastery
- ✅ `nano_skill_ratings` z pełnym kontekstem (name, mastery, hasValue, response_type)
- ✅ RPC `add_student_event()` z auto-ekstrakcją mastery
- ⚠️ **Problem:** Po submit, transcription persistence może nadpisać eventy (Problem 2) → naprawa powyżej
- ⚠️ **Problem:** Transkrypcje mogą nie być persystowane (zależy od sukcesu transcribe-audio)

### Layer B — Metrics & Signals ✅ (90% gotowy)
- ✅ Tabela `student_skill_metrics` z weighted average mastery
- ✅ `compute_skill_metric()` z exponential decay (0.03/dzień)
- ✅ `extract_micro_skill()` mapuje nano-skille na kanoniczne grupy
- ✅ Trigger na `student_events` automatycznie rekomputuje metryki
- ✅ View `student_category_metrics` agreguje po kategoriach
- ⚠️ **Brak:** `compute_student_summary()` nie istnieje jeszcze (planowane w Layer C)

### Layer C — Student Profiles 🟡 (30% gotowy)
- ✅ `student_learning_profiles` tabela istnieje (Welcome Test profil)
- ✅ `student_learning_elements` z celami nauczania
- ❌ **Brak:** `compute_student_summary()` — dynamiczny profil z metryk Layer B
- ❌ **Brak:** Kompaktowy JSON summary (mocne/słabe strony) do wstrzyknięcia w prompt AI
- ❌ **Brak:** Integracja z generatorami (generate-timeline, generateWorksheet)

### Layer D — Decision Engine 🔴 (10% gotowy)
- ✅ `future_worksheet_suggestions` tabela istnieje
- ❌ **Brak:** Automatyczna generacja sugestii z profilu Layer C
- ❌ **Brak:** Zamknięta pętla feedback → content generation
- ❌ **Brak:** Adaptywny dobór trudności na podstawie trendu mastery

---

## Zmieniane pliki

| Plik | Zmiana |
|------|--------|
| `src/components/WorksheetDisplay.tsx` | Fire-and-forget AI eval przy Create Homework |
| SQL migration | Guard w `log_homework_answer_to_events()` — nie nadpisuj eventów po submit |
| SQL migration | Reset homework submission dla testów |
| `docs/CURRENT_STATE_ANALYSIS.md` | DSLM Readiness Checklist |
| `docs/TECHNICAL_DOCUMENTATION.md` | Opis guarda SQL + fire-and-forget |
| `docs/DEVELOPMENT_ROADMAP.md` | Checklist Layer C/D |

## Co NIE zmienia się

- `HomeworkSpeakingRecorder` — playback nie triggeruje zapisów (potwierdzone w kodzie)
- `audioEvalUtils.ts` — logika buildAnswersToVerify jest poprawna
- `AiEvaluationBadge` — dual score jest poprawny
- `process-pending-ai-evaluations` — pipeline jest poprawny
- `verify-open-answers` — scoring jest poprawny
- `compute_skill_metric()` — Layer B metryki działają poprawnie

## Test akceptacyjny

1. Kliknij "Create Homework" w Live Session → modal otwiera się natychmiast (< 1s)
2. Na homework po submit → eventy w `student_events` NIE zmieniają się przy odtwarzaniu nagrań
3. `student_events.mastery` = średnia z `nano_skill_ratings[].mastery` → poprawne
4. `student_skill_metrics` per nano-skill → poprawne indywidualne mastery

