

# Plan naprawy 2 problemów z logowaniem eventów

## PODSUMOWANIE ANALIZY

### PROBLEM 1.1 i 1.2: Zduplikowane dane w event_payload + brak czasu per-item

**Co widzę w event_payload teraz:**
```json
{
  "answers": { "0": "false", "1": "false", ... },  // ❌ ZBĘDNE - już jest w nano_skill_ratings
  "mastery": 56,  // ❌ ZBĘDNE - suma jest w nano_skill_ratings
  "exercise_type": "true-false-picture",
  "exercise_index": 6,
  "nano_skill_ratings": [
    { "name": "ns.reading...", "reason": "...", "mastery": 0, "hasValue": true },
    { "name": "ns.reading...", "reason": "...", "mastery": 100, "hasValue": true }
  ],
  "time_spent_seconds": 8  // ❌ Jest tylko dla całego ćwiczenia, nie per-item
}
```

**Czego brakuje:**
- A. Indeks przykładu (`question_index`) w każdym elemencie `nano_skill_ratings`
- B. Czas per-item nie jest możliwy do zmierzenia bez dodatkowego trackingu (uczeń nie klika "następne pytanie" - odpowiada na wszystkie naraz)

**Decyzja architektoniczna:**
- `time_spent_seconds` PER-ITEM jest technicznie niemożliwy bez fundamentalnej zmiany UI (wymusiłoby pokazywanie jednego pytania naraz)
- Możemy dodać `question_index` do każdego elementu nano_skill_ratings
- Możemy usunąć zduplikowane pola `answers` i ogólne `mastery` z event_payload

---

### PROBLEM 2: Podwójne logowanie - dwa triggery aktywne jednocześnie

**Potwierdzenie w bazie danych:**
```
event_type: worksheet_answer_saved | event_source: worksheet      → 90 rekordów (STARY)
event_type: learning_activity      | event_source: worksheet_answer_saved → 4 rekordy (NOWY)
```

**Przyczyna:**
W bazie istnieją DWA różne triggery na tabeli `worksheet_student_answers`:
1. `trigger_log_worksheet_answer_event` → funkcja `log_worksheet_answer_event()` (stary)
2. `trg_worksheet_answer_to_events` → funkcja `log_worksheet_answer_to_events()` (nowy)

Ostatnia migracja (`20260130084312_43f38a26-...`) usunęła tylko trigger `trg_worksheet_answer_to_events` przed jego ponownym utworzeniem, ale NIE usunęła starego triggera `trigger_log_worksheet_answer_event`.

**Rozwiązanie:**
Usunąć stary trigger `trigger_log_worksheet_answer_event` w nowej migracji SQL.

---

## PLAN IMPLEMENTACJI

### Zmiana 1: Nowa migracja SQL - usunięcie starych triggerów

```sql
-- Usuń STARY trigger dla worksheet_student_answers
DROP TRIGGER IF EXISTS trigger_log_worksheet_answer_event ON public.worksheet_student_answers;
DROP FUNCTION IF EXISTS public.log_worksheet_answer_event();

-- Usuń STARY trigger dla homework_student_answers (jeśli istnieje)
DROP TRIGGER IF EXISTS trigger_log_homework_answer_event ON public.homework_student_answers;
DROP FUNCTION IF EXISTS public.log_homework_answer_event();
```

### Zmiana 2: Zaktualizować trigger worksheet aby usunąć zbędne pola i dodać question_index

Zaktualizować funkcję `log_worksheet_answer_to_events()`:

```sql
CREATE OR REPLACE FUNCTION public.log_worksheet_answer_to_events()
RETURNS TRIGGER
AS $$
...
    INSERT INTO public.student_events (
        ...
        event_payload
    )
    VALUES (
        ...
        jsonb_build_object(
            'answer_id', NEW.id,
            'exercise_index', NEW.exercise_index,
            'exercise_type', NEW.exercise_type,
            -- USUNIĘTE: 'answers', NEW.answers,
            -- USUNIĘTE: 'mastery', NEW.mastery,
            'nano_skill_ratings', COALESCE(NEW.item_evaluations, '[]'::jsonb),
            'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
        )
    );
...
$$;
```

### Zmiana 3: Frontend - dodać question_index do item_evaluations

W `src/utils/masteryCalculator.ts` funkcja `buildItemEvaluations()`:

```typescript
export interface ItemEvaluation {
  question_index: number;  // DODAĆ
  name: string;
  reason: string;
  mastery: number;
  hasValue?: boolean;
}

// W buildItemEvaluations:
itemEvaluations.push({
  question_index: idx,  // DODAĆ
  name: nanoSkill.name,
  reason: nanoSkill.reason,
  mastery: itemMastery ?? 0,
  hasValue: itemMastery !== null
});
```

---

## LISTA PLIKÓW DO EDYCJI

| # | Plik/Akcja | Zmiana |
|---|------------|--------|
| 1 | **Nowa migracja SQL** | Usunąć stare triggery i funkcje |
| 2 | **Nowa migracja SQL** | Zaktualizować funkcje triggerów - usunąć zbędne pola z event_payload |
| 3 | `src/utils/masteryCalculator.ts` | Dodać `question_index` do interfejsu i funkcji `buildItemEvaluations()` |
| 4 | `src/integrations/supabase/types.ts` | Zaktualizować typy jeśli potrzebne |

---

## OCZEKIWANE REZULTATY

### Po implementacji:

**Event `worksheet_answer_saved` będzie wyglądał tak (CZYSTA STRUKTURA):**
```json
{
  "answer_id": "uuid-...",
  "exercise_index": 6,
  "exercise_type": "true-false-picture",
  "nano_skill_ratings": [
    {
      "question_index": 0,
      "name": "ns.reading.visual_inference_reported_action",
      "reason": "Tests inference of ongoing action from visual cues.",
      "mastery": 0,
      "hasValue": true
    },
    {
      "question_index": 1,
      "name": "ns.reading.visual_contradiction_reported_setting",
      "reason": "Requires identifying a contradiction.",
      "mastery": 100,
      "hasValue": true
    }
    // ... dla każdego pytania
  ],
  "time_spent_seconds": 8
}
```

**BRAK zduplikowanych eventów:**
- Tylko jeden event per zapis odpowiedzi (nie dwa jak teraz)

---

## UWAGA O CZASIE PER-ITEM

Aby mieć prawdziwy `time_spent_seconds` dla każdego pytania osobno, musielibyśmy:
1. Zmienić UI na pokazywanie jednego pytania naraz
2. LUB dodać tracking focusu (gdy uczeń klika w pole odpowiedzi, zaczyna się timer dla tego pytania)

To wymaga znaczących zmian w architekturze i może być zrealizowane jako osobna funkcjonalność. Obecny system mierzy czas dla całego ćwiczenia, co jest akceptowalnym przybliżeniem dla analityki.

---

## SEKCJA TECHNICZNA

### Weryfikacja triggerów przed zmianą

Przed implementacją warto sprawdzić aktualne triggery:
```sql
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'worksheet_student_answers';
```

### Migracja danych historycznych

Stare eventy z `event_type: worksheet_answer_saved` mogą zostać:
- Usunięte (jeśli są zbędne) 
- Pozostawione jako historia (bez wpływu na nowe logowanie)

Rekomenduję zostawić dla historii i tylko naprawić logowanie przyszłych eventów.

