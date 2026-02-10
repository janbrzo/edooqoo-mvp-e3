

# Plan naprawy: 4 problemy (skorygowany Problem 1)

## PROBLEM 1: Brak AI Evaluation w Live Session - PRZYCZYNA GŁÓWNA

### Analiza (głęboka)

Pipeline jest POPRAWNIE podłączony:
- `WorksheetDisplay` → `liveItemEvaluations` → `WorksheetContent` → `ExerciseSection` → `liveAiEvaluations` → exercise components

Konwersja `convertLiveEvalsToAiEvals` działa.

**PRAWDZIWA PRZYCZYNA** jest w bazie danych. Znalazłem 4 przeciążone wersje funkcji `save_worksheet_answer` (5, 6, 7 i 8 parametrów). Frontend wywołuje wersję z 8 parametrami (z `p_item_evaluations`). Ta wersja robi:

```sql
item_evaluations = COALESCE(EXCLUDED.item_evaluations, worksheet_student_answers.item_evaluations)
```

`COALESCE` oznacza: "użyj nowej wartości, a jeśli jest NULL - zachowaj starą". Problem: frontend NIGDY nie wysyła `null` dla `item_evaluations` przy open-ended. `buildItemEvaluations` w `masteryCalculator.ts` ZAWSZE generuje tablicę z `mastery: 50, hasValue: true` dla open-ended bez AI eval.

Scenariusz:
1. AI eval wykonuje się → edge function zapisuje `item_evaluations` z prawdziwym feedbackiem (mastery: 70, feedback: "Good job!")
2. Student zmienia odpowiedź → auto-save po 1.5s → frontend wysyła `item_evaluations` z `mastery: 50, hasValue: true, brak feedback`
3. `COALESCE` widzi że nowa wartość NIE jest null → nadpisuje prawdziwe AI eval
4. Realtime UPDATE → nauczyciel otrzymuje dane z mastery=50 bez feedbacku
5. `convertLiveEvalsToAiEvals` tworzy badge "AI Score: 50%" bez feedbacku - co wygląda jak brak feedbacku

### Rozwiązanie

Zmiana w `useInteractiveSharedWorksheet.tsx` - NIE wysyłać `item_evaluations` z masteryCalculator przy auto-save. Frontend powinien wysyłać `null` dla `p_item_evaluations` aby zachować istniejące AI eval w bazie:

```typescript
// BYŁO (linia 145):
p_item_evaluations: itemEvaluations ? JSON.parse(JSON.stringify(itemEvaluations)) : null

// BĘDZIE:
p_item_evaluations: null  // Never overwrite AI evaluations from auto-save
```

W ten sposób `COALESCE(NULL, worksheet_student_answers.item_evaluations)` zachowa prawdziwe AI eval dane.

ALE - to zepsuje logowanie do `student_events` bo trigger `log_worksheet_answer_to_events` korzysta z `NEW.item_evaluations` do budowania `nano_skill_ratings`. Jeśli `item_evaluations` nie jest aktualizowane przy save, trigger nie będzie miał danych.

**Lepsze rozwiązanie**: Wysyłać `item_evaluations` ALE z `hasValue: false` (po fix z masteryCalculator: `mastery: -1, hasValue: false`). Zmienić SQL RPC aby NIE nadpisywać `item_evaluations` gdy nowe dane mają `hasValue: false`:

```sql
-- Zmiana w save_worksheet_answer (8-param):
item_evaluations = CASE
  WHEN EXCLUDED.item_evaluations IS NULL THEN worksheet_student_answers.item_evaluations
  WHEN (EXCLUDED.item_evaluations::jsonb->0->>'hasValue')::boolean = false 
       AND worksheet_student_answers.item_evaluations IS NOT NULL
       AND (worksheet_student_answers.item_evaluations::jsonb->0->>'hasValue')::boolean = true
    THEN worksheet_student_answers.item_evaluations  -- Preserve real AI eval
  ELSE EXCLUDED.item_evaluations
END
```

To jest za skomplikowane. Najprostsze i najbezpieczniejsze rozwiązanie:

**FINALNE ROZWIĄZANIE**: W `useInteractiveSharedWorksheet.tsx` przy auto-save, NIE wysyłać `item_evaluations` gdy nie ma AI eval (gdy `hasValue: false` na wszystkich elementach). Wysyłać je TYLKO gdy zawierają faktyczne dane AI eval.

```typescript
// Sprawdź czy item_evaluations zawierają prawdziwe oceny AI
const hasRealAiEval = itemEvaluations?.some(e => e.hasValue !== false && e.mastery > 0);
const evalToSend = hasRealAiEval ? JSON.parse(JSON.stringify(itemEvaluations)) : null;

p_item_evaluations: evalToSend
```

---

## PROBLEM 2.1: Po zmianie odpowiedzi AI Score zmienia się na "50% Needs improvement"

### Rozwiązanie (bez zmian od planu)

Zmiana w `masteryCalculator.ts`:
- `itemMastery = 50` → `itemMastery = null`  
- `mastery: itemMastery ?? 0` → `mastery: itemMastery !== null ? itemMastery : -1`
- `hasValue: true` → `hasValue: itemMastery !== null`

Zmiana w `convertItemEvalsToAiEvals` (SharedWorksheetContent) i `convertLiveEvalsToAiEvals` (ExerciseSection):
- Filtrować elementy z `hasValue: false` - nie tworzyć badge

---

## PROBLEM 2.2: student_events z mastery=50 dla student_learning_activity

### Rozwiązanie (bez zmian od planu)

Fix z 2.1 automatycznie naprawi - `mastery: -1, hasValue: false` zamiast `mastery: 50, hasValue: true`.

---

## PROBLEM 3: Loading modal na Create Homework (bez zmian od planu)

### Rozwiązanie

W `WorksheetDisplay.tsx`:
- Stan `isAiEvalLoading` 
- Dialog z Loader2 + tekst "Analyzing student progress..."

---

## PROBLEM 4: Brak AI Eval feedback dla Discussion Questions na shared worksheet i Live Session

### Rozwiązanie (bez zmian od planu)

Dodać `AiEvaluationBadge` do inline renderowania discussion questions w:
- `ExerciseSection.tsx` (Live Session)
- `SharedWorksheetContent.tsx` (Shared Worksheet)

---

## PODSUMOWANIE ZMIAN

| # | Plik | Zmiana | Problem |
|---|------|--------|---------|
| 1 | `src/utils/masteryCalculator.ts` | `itemMastery = null` zamiast 50, `mastery: -1, hasValue: false` | 1, 2.1, 2.2 |
| 2 | `src/hooks/useInteractiveSharedWorksheet.tsx` | Nie wysyłać `item_evaluations` przy auto-save gdy brak AI eval (hasValue=false) | 1 |
| 3 | `src/components/shared/SharedWorksheetContent.tsx` | Filtrować hasValue=false w converterze, dodać AiEvaluationBadge do discussion | 2.1, 4 |
| 4 | `src/components/worksheet/ExerciseSection.tsx` | Filtrować hasValue=false w converterze, dodać AiEvaluationBadge do discussion | 1, 4 |
| 5 | `src/components/WorksheetDisplay.tsx` | Loading modal przy Create Homework | 3 |
| 6 | Dokumentacja | Aktualizacja | Wszystkie |

### Bezpieczeństwo zmian

- Zmiana 1 (masteryCalculator): dotyczy TYLKO open-ended exercises bez AI eval. Closed exercises mają osobną ścieżkę (`calculateItemMastery`) i NIE są dotykane
- Zmiana 2 (auto-save null): `COALESCE(NULL, existing)` w SQL zachowuje istniejące dane - zero utraty danych. Trigger SQL nadal dostaje `NEW.item_evaluations` z bazy (nie z EXCLUDED)
- Zmiana 3-4 (filtry + badge): dodanie UI i filtrowanie - zero wpływu na istniejącą logikę
- Zmiana 5 (loading modal): nowy stan i dialog - zero wpływu na flow

