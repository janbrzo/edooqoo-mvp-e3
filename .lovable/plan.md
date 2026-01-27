
# Plan ujednolicenia pola `mastery` we wszystkich eventach DSLM

## Podsumowanie sytuacji

Użytkownik chce ujednolicić format danych w tabeli `student_events` tak, aby wszystkie eventy (worksheet, homework, flashcard) zawierały pole `mastery` w formacie 0-100%, identycznie jak eventy typu `exercise_mastery_evaluation` od nauczyciela.

**Obecny stan eventów:**

| Event type | Obecne pola | Brakuje |
|------------|-------------|---------|
| teacher (exercise_mastery_evaluation) | `nano_skill_ratings: [{mastery: 80, ...}]` | ✅ Wzorcowy format |
| worksheet_answer_saved | `answers`, `time_spent_seconds` | ❌ Brak `mastery` |
| homework_answer_submitted | `answers`, `is_correct`, `time_spent_seconds` | ❌ Brak `mastery` |
| flashcard_review | `is_correct`, `quality_rating` | ❌ Brak `mastery` |

---

## PROBLEM 1: Worksheet events - brak `mastery`

### Analiza
Worksheet events obecnie logują tylko odpowiedzi ucznia bez oceny poprawności. Potrzebne jest:
1. Obliczenie `mastery` (0-100%) na podstawie poprawności odpowiedzi
2. Dla zamkniętych pytań: porównanie z poprawnymi odpowiedziami
3. Dla otwartych pytań: wywołanie AI weryfikacji

### Rozwiązanie

**Krok 1:** Frontend - dodać logikę obliczania mastery w `useInteractiveSharedWorksheet.tsx`

Dla zamkniętych pytań:
- Poprawna odpowiedź → `mastery: 100`
- Niepoprawna odpowiedź → `mastery: 0`
- Brak odpowiedzi → `mastery: null`

**Krok 2:** Przekazać `mastery` jako parametr do RPC `save_worksheet_answer`

**Krok 3:** SQL Trigger - dodać `mastery` do payloadu eventu

**Zmiany w plikach:**

1. **`src/hooks/useInteractiveSharedWorksheet.tsx`**
   - Dodać funkcję `calculateMasteryForAnswer(exerciseIndex, exerciseType, answer, exerciseData)`
   - Przekazać `p_mastery` do RPC przy zapisie

2. **SQL Migration**
   - Dodać kolumnę `mastery INTEGER` do `worksheet_student_answers`
   - Zaktualizować `save_worksheet_answer` RPC aby przyjmować `p_mastery`
   - Zaktualizować trigger `log_worksheet_answer_event()` aby logować `mastery`

---

## PROBLEM 2: Homework events - brak `mastery`

### Analiza
Homework events mają `is_correct` (boolean/null), ale brakuje `mastery` (0-100%).

### Rozwiązanie

**Krok 1:** Konwersja `is_correct` na `mastery`:
- `is_correct = true` → `mastery: 100`
- `is_correct = false` → `mastery: 0`
- `is_correct = null` (oczekuje AI) → `mastery: null`, potem update po AI

**Krok 2:** Trigger `update_homework_event_with_ai_evaluation` powinien też aktualizować `mastery` z `quality_score`

**Zmiany w plikach:**

1. **`src/hooks/useInteractiveHomework.tsx`**
   - Dodać logikę obliczania `mastery` dla zamkniętych pytań
   - Przekazać `p_mastery` do RPC

2. **SQL Migration**
   - Dodać `mastery INTEGER` do `homework_student_answers`
   - Zaktualizować `save_homework_answer` RPC
   - Zaktualizować trigger `log_homework_answer_event()` aby logować `mastery`
   - Zaktualizować trigger `update_homework_event_with_ai_evaluation()` aby też ustawiać `mastery` z `quality_score * 100`

---

## PROBLEM 3: Flashcard events - zamienić `is_correct`/`quality_rating` na `mastery`

### Analiza
Flashcards mają `is_correct` i `quality_rating`. Użytkownik chce ujednolicić do `mastery`.

Mapowanie:
- `quality_rating = 0` (Again) → `mastery: 0`
- `quality_rating = 2` (I Know This) → `mastery: 100`

### Rozwiązanie

**SQL Migration** - zaktualizować trigger `log_flashcard_review_event()`:

```sql
-- Zamień is_correct i quality_rating na mastery
jsonb_build_object(
  'card_id', NEW.card_id,
  'set_id', NEW.set_id,
  'direction', NEW.direction,
  'card_front', v_card_front,
  'card_back', v_card_back,
  'mastery', CASE 
    WHEN NEW.last_quality_rating >= 2 THEN 100  -- "I Know This"
    ELSE 0                                       -- "Again"
  END,
  'easiness_factor', NEW.easiness_factor,
  'repetition', NEW.repetition,
  'interval_days', NEW.interval_days,
  'total_reviews', NEW.total_reviews,
  'time_spent_seconds', ROUND(COALESCE(NEW.last_response_time_ms, 0) / 1000.0, 1)
)
```

**Uwaga:** Zachowamy `quality_rating` w triggerze na potrzeby szczegółowej diagnostyki, ale głównym polem będzie `mastery`.

---

## PROBLEM 4: NanoSkill tooltip nie działa

### Analiza przyczyny

Po dokładnej analizie kodu znalazłem problem:

1. **`ExerciseSection.tsx` linia 720** ma `overflow-hidden`:
   ```tsx
   <div ref={ref} className="mb-4 bg-white border rounded-lg overflow-hidden shadow-sm relative">
   ```

2. Mimo że `NanoSkillBadge` używa `TooltipPrimitive.Portal` (który powinien renderować tooltip poza DOM hierarchy), jest możliwe że:
   - `overflow-hidden` na kontenerze nadal wpływa na pozycjonowanie
   - `z-index: 9999` jest niewystarczający
   - Popper.js (używany przez Radix) ma problemy z kalkulacją pozycji

### Rozwiązanie - wielopoziomowe

**Krok 1:** W `NanoSkillBadge.tsx` dodać jawne ustawienia do `TooltipPrimitive.Content`:

```tsx
<TooltipPrimitive.Content 
  side="top" 
  align="start"
  sideOffset={8}
  avoidCollisions={true}
  collisionPadding={16}
  sticky="always"
  className="z-[9999] w-72 p-3 bg-white border rounded-lg shadow-lg ..."
  style={{ 
    position: 'fixed',  // Force fixed positioning
    zIndex: 10000 
  }}
>
```

**Krok 2:** Usunąć `overflow-hidden` z kontenera w `ExerciseSection.tsx` i zastąpić na `overflow-visible` lub usunąć całkowicie (jeśli nie jest potrzebny dla innych funkcji):

```tsx
// PRZED (linia 720)
<div ref={ref} className="mb-4 bg-white border rounded-lg overflow-hidden shadow-sm relative">

// PO - usunąć overflow-hidden
<div ref={ref} className="mb-4 bg-white border rounded-lg shadow-sm relative">
```

**Krok 3:** Alternatywnie - zmienić podejście na `Popover` zamiast `Tooltip` jeśli problem się utrzyma (Popover jest bardziej niezawodny w skomplikowanych layoutach).

---

## Lista plików do edycji

| Plik | Zmiana |
|------|--------|
| `src/hooks/useInteractiveSharedWorksheet.tsx` | Dodać obliczanie `mastery`, przekazać do RPC |
| `src/hooks/useInteractiveHomework.tsx` | Dodać obliczanie `mastery`, przekazać do RPC |
| **SQL Migration** | Dodać kolumny `mastery`, zaktualizować 4 triggery/funkcje |
| `src/components/worksheet/NanoSkillBadge.tsx` | Poprawić tooltip props |
| `src/components/worksheet/ExerciseSection.tsx` | Usunąć `overflow-hidden` |

---

## Szczegóły techniczne migracji SQL

```sql
-- =====================================================
-- UJEDNOLICENIE MASTERY WE WSZYSTKICH EVENTACH DSLM
-- =====================================================

-- 1. Dodaj kolumnę mastery do worksheet_student_answers
ALTER TABLE public.worksheet_student_answers 
ADD COLUMN IF NOT EXISTS mastery INTEGER;

-- 2. Dodaj kolumnę mastery do homework_student_answers
ALTER TABLE public.homework_student_answers 
ADD COLUMN IF NOT EXISTS mastery INTEGER;

-- 3. Zaktualizuj save_worksheet_answer aby przyjmować p_mastery
CREATE OR REPLACE FUNCTION public.save_worksheet_answer(
    p_worksheet_id UUID,
    p_student_email TEXT,
    p_exercise_index INTEGER,
    p_exercise_type TEXT,
    p_answers JSONB,
    p_time_spent_ms INTEGER DEFAULT 0,
    p_mastery INTEGER DEFAULT NULL
) RETURNS UUID ...

-- 4. Zaktualizuj save_homework_answer aby przyjmować p_mastery
CREATE OR REPLACE FUNCTION public.save_homework_answer(
    p_homework_id UUID,
    p_student_email TEXT,
    p_exercise_index INTEGER,
    p_exercise_type TEXT,
    p_answers JSONB,
    p_time_spent_ms INTEGER DEFAULT 0,
    p_mastery INTEGER DEFAULT NULL
) RETURNS UUID ...

-- 5. Zaktualizuj log_worksheet_answer_event() - dodaj mastery do payload
-- 6. Zaktualizuj log_homework_answer_event() - dodaj mastery do payload
-- 7. Zaktualizuj log_flashcard_review_event() - zamień is_correct/quality_rating na mastery
-- 8. Zaktualizuj update_homework_event_with_ai_evaluation() - dodaj mastery = quality_score * 100
```

---

## Co zobaczysz po implementacji

### 1. Worksheet events (`worksheet_answer_saved`)
```json
{
  "answers": {"0": "B", "1": "A"},
  "exercise_type": "matching",
  "exercise_index": 1,
  "time_spent_seconds": 4.9,
  "mastery": 100  // NEW: 0-100%
}
```

### 2. Homework events (`homework_answer_submitted`)
```json
{
  "answers": {"0": true, "1": true},
  "exercise_type": "true-false-audio",
  "exercise_index": 5,
  "time_spent_seconds": 3509,
  "mastery": 75  // NEW: obliczone z % poprawnych lub AI quality_score
}
```

### 3. Flashcard events (`flashcard_review`)
```json
{
  "card_id": "...",
  "set_id": "...",
  "direction": 1,
  "card_front": "...",
  "card_back": "...",
  "mastery": 100,  // NEW: 100 dla "I Know", 0 dla "Again"
  "easiness_factor": 2.5,
  "repetition": 3,
  "interval_days": 13,
  "total_reviews": 6,
  "time_spent_seconds": 0.8
}
```

### 4. NanoSkill tooltip
- Po najechaniu na badge "ns (94%)" natychmiast pojawi się elegancka karta z pełnymi informacjami o skill'u
- Tooltip będzie widoczny ponad wszystkimi elementami strony

---

## Zachowanie kompatybilności wstecznej

1. **Stare eventy** w bazie pozostaną bez `mastery` - można je zmigrować osobnym skryptem jeśli potrzeba
2. **Frontend** będzie obsługiwać oba formaty (z i bez `mastery`)
3. **Triggery** są typu `CREATE OR REPLACE` więc bezpiecznie nadpiszą istniejące
4. **Nowe kolumny** mają `DEFAULT NULL` więc nie wpływają na istniejące dane
