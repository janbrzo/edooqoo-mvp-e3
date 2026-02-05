

# Poprawiony Plan - Scenariusze AI Evaluation dla Shared Worksheet

## KLUCZOWA ZASADA

```
AI EVALUATION wykonuj TYLKO gdy:
  last_answer_change_time > last_ai_evaluation_time
  
Innymi słowy: Tylko jeśli student wprowadził NOWĄ zmianę od ostatniej AI Evaluation
```

---

## PEŁNY SCHEMAT LOGICZNY

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SCENARIUSZE AI Evaluation dla Shared Worksheet                │
│                                                                                  │
│   Zmienne śledzące:                                                              │
│   - last_answer_change: timestamp ostatniej zmiany odpowiedzi przez studenta     │
│   - last_ai_eval: timestamp ostatniej wykonanej AI Evaluation                    │
│                                                                                  │
│   WARUNEK WYKONANIA: last_answer_change > last_ai_eval                           │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │  Student zmienia │
                              │    odpowiedź     │
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ last_answer_change│
                              │    = NOW()       │
                              └────────┬─────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
         ▼                             ▼                             ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   TRIGGER 1:    │         │   TRIGGER 2:    │         │   TRIGGER 3:    │
│  Close Tab      │         │ Create Homework │         │ 10 min timeout  │
└────────┬────────┘         └────────┬────────┘         └────────┬────────┘
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│        last_answer_change > last_ai_eval ?                                   │
│                                                                              │
│        ┌───────────────────────────────┬────────────────────────────────┐    │
│        │ TAK                           │ NIE                            │    │
│        ▼                               ▼                                │    │
│   ┌─────────────────┐           ┌─────────────────┐                     │    │
│   │ WYKONAJ         │           │ POMIŃ           │                     │    │
│   │ AI EVALUATION   │           │ (już ocenione)  │                     │    │
│   │                 │           │                 │                     │    │
│   │ last_ai_eval    │           └─────────────────┘                     │    │
│   │   = NOW()       │                                                   │    │
│   └─────────────────┘                                                   │    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                           PRZYKŁADY SCENARIUSZY
═══════════════════════════════════════════════════════════════════════════════

SCENARIUSZ 1: Close Tab → Create Homework → 10 min
────────────────────────────────────────────────────
  [T=0]  Student zmienia odpowiedź      → last_answer_change = T0
  [T=1]  Close Tab                      → last_answer_change(T0) > last_ai_eval(0) 
                                          ✅ WYKONAJ AI EVAL → last_ai_eval = T1
  [T=2]  Create Homework                → last_answer_change(T0) < last_ai_eval(T1)
                                          ❌ POMIŃ (już ocenione)
  [T=3]  10 min mija                    → last_answer_change(T0) < last_ai_eval(T1)
                                          ❌ POMIŃ (już ocenione)


SCENARIUSZ 2: Create Homework → Close Tab → 10 min
────────────────────────────────────────────────────
  [T=0]  Student zmienia odpowiedź      → last_answer_change = T0
  [T=1]  Create Homework                → last_answer_change(T0) > last_ai_eval(0)
                                          ✅ WYKONAJ AI EVAL → last_ai_eval = T1
  [T=2]  Close Tab                      → last_answer_change(T0) < last_ai_eval(T1)
                                          ❌ POMIŃ (już ocenione)
  [T=3]  10 min mija                    → last_answer_change(T0) < last_ai_eval(T1)
                                          ❌ POMIŃ (już ocenione)


SCENARIUSZ 3: 10 min → Create Homework → Close Tab
────────────────────────────────────────────────────
  [T=0]  Student zmienia odpowiedź      → last_answer_change = T0
  [T=10] 10 min mija                    → last_answer_change(T0) > last_ai_eval(0)
                                          ✅ WYKONAJ AI EVAL → last_ai_eval = T10
  [T=11] Create Homework                → last_answer_change(T0) < last_ai_eval(T10)
                                          ❌ POMIŃ (już ocenione)
  [T=12] Close Tab                      → last_answer_change(T0) < last_ai_eval(T10)
                                          ❌ POMIŃ (już ocenione)


SCENARIUSZ 4: Close Tab → Create Homework → NOWA ZMIANA → 10 min
────────────────────────────────────────────────────────────────
  [T=0]  Student zmienia odpowiedź      → last_answer_change = T0
  [T=1]  Close Tab                      → last_answer_change(T0) > last_ai_eval(0)
                                          ✅ WYKONAJ AI EVAL → last_ai_eval = T1
  [T=2]  Create Homework                → last_answer_change(T0) < last_ai_eval(T1)
                                          ❌ POMIŃ (już ocenione)
  [T=3]  Student NOWA zmiana            → last_answer_change = T3
  [T=13] 10 min mija                    → last_answer_change(T3) > last_ai_eval(T1)
                                          ✅ WYKONAJ AI EVAL → last_ai_eval = T13


SCENARIUSZ 5: Create Homework → 10 min (nic) → NOWA ZMIANA → Close Tab
───────────────────────────────────────────────────────────────────────
  [T=0]  Student zmienia odpowiedź      → last_answer_change = T0
  [T=1]  Create Homework                → last_answer_change(T0) > last_ai_eval(0)
                                          ✅ WYKONAJ AI EVAL → last_ai_eval = T1
  [T=11] 10 min mija                    → last_answer_change(T0) < last_ai_eval(T1)
                                          ❌ POMIŃ (już ocenione)
  [T=12] Student NOWA zmiana            → last_answer_change = T12
  [T=15] Close Tab (przed 10 min)       → last_answer_change(T12) > last_ai_eval(T1)
                                          ✅ WYKONAJ AI EVAL → last_ai_eval = T15


SCENARIUSZ 6: 10 min → Close Tab (nic) → NOWA ZMIANA → Create Homework
───────────────────────────────────────────────────────────────────────
  [T=0]  Student zmienia odpowiedź      → last_answer_change = T0
  [T=10] 10 min mija                    → last_answer_change(T0) > last_ai_eval(0)
                                          ✅ WYKONAJ AI EVAL → last_ai_eval = T10
  [T=11] Close Tab                      → last_answer_change(T0) < last_ai_eval(T10)
                                          ❌ POMIŃ (już ocenione)
  [T=12] Student NOWA zmiana            → last_answer_change = T12
  [T=15] Create Homework                → last_answer_change(T12) > last_ai_eval(T10)
                                          ✅ WYKONAJ AI EVAL → last_ai_eval = T15
```

---

## IMPLEMENTACJA TECHNICZNA

### Nowe pola w bazie danych

Potrzebujemy śledzić `last_ai_eval_at` per exercise w tabeli `worksheet_student_answers`:

```sql
-- Dodać kolumnę do worksheet_student_answers
ALTER TABLE worksheet_student_answers 
ADD COLUMN IF NOT EXISTS last_ai_eval_at TIMESTAMPTZ;
```

### Logika w kodzie

```typescript
// W useInteractiveSharedWorksheet.tsx - przy zapisie odpowiedzi
const saveAnswer = async (...) => {
  // ... existing save logic ...
  
  // ZAWSZE aktualizuj last_saved_at (to jest nasz last_answer_change)
  setLastSavedAt(new Date());
};

// Funkcja sprawdzająca czy trzeba wykonać AI Eval
const shouldRunAiEvaluation = async (exerciseIndex: number): Promise<boolean> => {
  // Pobierz last_ai_eval_at z bazy
  const { data } = await supabase
    .from('worksheet_student_answers')
    .select('last_saved_at, last_ai_eval_at')
    .eq('worksheet_id', worksheetId)
    .eq('student_email', studentEmail)
    .eq('exercise_index', exerciseIndex)
    .single();
  
  if (!data) return false;
  
  const lastChange = new Date(data.last_saved_at).getTime();
  const lastAiEval = data.last_ai_eval_at ? new Date(data.last_ai_eval_at).getTime() : 0;
  
  return lastChange > lastAiEval;
};

// TRIGGER 1: Close Tab
const handleBeforeUnload = async () => {
  for (const exerciseIndex of openEndedExercises) {
    if (await shouldRunAiEvaluation(exerciseIndex)) {
      // Queue AI Evaluation
      await queueAiEvaluation(exerciseIndex);
    }
  }
};

// TRIGGER 2: Create Homework (w CreateHomeworkModal)
const handleCreateHomework = async () => {
  for (const exerciseIndex of openEndedExercises) {
    if (await shouldRunAiEvaluation(exerciseIndex)) {
      // Process AI Evaluation
      await processAiEvaluation(exerciseIndex);
    }
  }
};

// TRIGGER 3: 10 min timeout
const checkInactivityTimer = async () => {
  for (const exerciseIndex of openEndedExercises) {
    const timeSinceLastChange = Date.now() - lastSavedAt.getTime();
    if (timeSinceLastChange >= 10 * 60 * 1000) {
      if (await shouldRunAiEvaluation(exerciseIndex)) {
        // Queue AI Evaluation
        await queueAiEvaluation(exerciseIndex);
      }
    }
  }
};

// Po wykonaniu AI Evaluation - aktualizuj timestamp
const afterAiEvaluation = async (exerciseIndex: number) => {
  await supabase
    .from('worksheet_student_answers')
    .update({ last_ai_eval_at: new Date().toISOString() })
    .eq('worksheet_id', worksheetId)
    .eq('student_email', studentEmail)
    .eq('exercise_index', exerciseIndex);
};
```

---

## PODSUMOWANIE ZMIAN W PLANIE

| # | Plik | Zmiana | Priorytet |
|---|------|--------|-----------|
| 1 | **Nowa migracja SQL** | Dodać kolumnę `last_ai_eval_at` | **KRYTYCZNY** |
| 2 | `src/hooks/useInteractiveSharedWorksheet.tsx` | Fetch z keepalive + warunek `shouldRunAiEvaluation` | **KRYTYCZNY** |
| 3 | `src/hooks/useInteractiveSharedWorksheet.tsx` | Timer 10 min z warunkiem | WYSOKI |
| 4 | `src/components/homework/CreateHomeworkModal.tsx` | AI Eval z warunkiem | WYSOKI |
| 5 | `supabase/functions/process-pending-ai-evaluations/index.ts` | Aktualizować `last_ai_eval_at` po przetworzeniu | **KRYTYCZNY** |
| 6 | `supabase/functions/verify-open-answers/index.ts` | Naprawić parsowanie AI | **KRYTYCZNY** |
| 7 | `src/hooks/useInteractiveHomework.tsx` | Dodać `items` do questionItems | ŚREDNI |
| 8 | `docs/TECHNICAL_DOCUMENTATION.md` | Zaktualizować dokumentację | NISKI |

---

## RESZTA PLANU (BEZ ZMIAN)

### PROBLEM 2.1 & 2.2: Naprawić parsowanie AI i wyświetlanie dla listening-comprehension

Jak w poprzednim planie - ulepszyć parsowanie w `verify-open-answers` i dodać `exerciseData?.items` do `questionItems`.

