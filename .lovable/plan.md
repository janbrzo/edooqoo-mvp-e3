

# Plan naprawy: AI Evaluation triggers i event_type

## PROBLEM 2: event_type nie zmienia sie gdy student wpisze nowa odpowiedz

### Co sie dzieje teraz (POTWIERDZONE danymi z bazy)

Dane z bazy pokazuja DUPLIKATY dla tego samego exercise:

- exercise_index=0, listening-comprehension: **DWA rekordy**
  - `student_learning_activity` (12:55)
  - `10min_AI_evaluation` (13:41)

Powinien byc JEDEN rekord. Gdy student wpisal nowa odpowiedz po AI evaluation, stary rekord `10min_AI_evaluation` powinien zostac usuniety i zastapiony nowym `student_learning_activity`.

### Przyczyna (POTWIERDZONA w kodzie SQL)

Trigger SQL (linie 57-62 migracji) robi:

```sql
DELETE FROM student_events
WHERE student_id = v_student_id
  AND source_id = NEW.worksheet_id
  AND event_type = v_event_type          -- TU JEST BUG!
  AND (event_payload->>'exercise_index')::int = NEW.exercise_index;
```

`event_type = v_event_type` oznacza:
- Gdy student wpisuje odpowiedz → v_event_type = 'student_learning_activity' → DELETE szuka TYLKO rekordow z tym typem
- Istniejacy rekord '10min_AI_evaluation' NIE zostaje usuniety bo ma INNY event_type
- Wynik: powstaja DWA rekordy dla tego samego exercise

### Rozwiazanie

Usunac `AND event_type = v_event_type` z DELETE. Jedno exercise powinno miec JEDEN rekord w student_events (niezaleznie od typu). DELETE powinien usuwac KAZDY istniejacy rekord dla danego exercise:

```sql
DELETE FROM student_events
WHERE student_id = v_student_id
  AND source_id = NEW.worksheet_id
  AND (event_payload->>'exercise_index')::int = NEW.exercise_index;
```

To gwarantuje ze:
- Student wpisuje odpowiedz → usuwa stary rekord (niezaleznie czy to bylo 'student_learning_activity' czy '10min_AI_evaluation') → wstawia nowy 'student_learning_activity'
- AI eval 10-min → usuwa stary 'student_learning_activity' → wstawia nowy '10min_AI_evaluation'
- Student znowu wpisuje → usuwa '10min_AI_evaluation' → wstawia nowy 'student_learning_activity'

To samo naprawic w triggerze homework.

---

## PROBLEM 1A: Create Homework nie triggeruje AI Evaluation

### Co sie dzieje teraz

`CreateHomeworkModal.tsx` (linia 270) wywoluje:
```javascript
supabase.functions.invoke('process-pending-ai-evaluations', {
  body: { worksheet_id: worksheetId, trigger_source: 'create_homework' }
});
```

Ale `process-pending-ai-evaluations` przetwarza TYLKO rekordy ktore JUZ sa w kolejce `pending_worksheet_ai_evaluations`. Jesli student pracowal na worksheet i 10-min timer jeszcze nie odpalil, to kolejka jest PUSTA. Edge function zwraca "No pending evaluations" i nic sie nie dzieje.

### Rozwiazanie

W `CreateHomeworkModal.tsx`, PRZED wywolaniem `process-pending-ai-evaluations`, nalezy NAJPIERW dodac do kolejki evaluacje dla wszystkich open-ended exercises. Logika:

1. Pobrac odpowiedzi studenta z `worksheet_student_answers` dla tego worksheet
2. Dla kazdego open-ended exercise, wywolac `queue_worksheet_ai_evaluation`
3. Dopiero POTEM wywolac `process-pending-ai-evaluations`

Ale... CreateHomeworkModal nie ma dostepu do `studentEmail` ani `exercises` z shared worksheet. Modal dziala po stronie NAUCZYCIELA. Wiec lepsze rozwiazanie:

**Zmodyfikowac edge function `process-pending-ai-evaluations`** aby w trybie `create_homework` (gdy `trigger_source = 'create_homework'`):
1. Pobrala WSZYSTKIE odpowiedzi studenta z `worksheet_student_answers` dla danego worksheet_id
2. Dla kazdej odpowiedzi open-ended, sprawdzila `needs_ai_evaluation`
3. Jesli potrzebna - sama utworzyla pending evaluation i przetworzy

To jest czystsze bo cala logika zostaje po stronie serwera.

---

## PROBLEM 1C: Usunac close_tab AI evaluation

### Co usuwamy

W `useInteractiveSharedWorksheet.tsx` linie 353-383: caly blok ktory kolejkuje AI evaluation przy zamknieciu karty. ZOSTAWIAMY linie 330-351 (save_worksheet_answer z keepalive) - samo zapisywanie odpowiedzi przy zamknieciu karty MUSI zostac.

Usuwamy rowniez wartosc `'close_tab'` z triggerow SQL (CASE WHEN).

---

## PROBLEM 1D: Aktualizacja scenariuszy

Po zmianach scenariusze beda:

| Scenariusz | Trigger | event_type |
|---|---|---|
| Student wpisuje/zmienia odpowiedz | Zapis do bazy (auto-save 1.5s) | `student_learning_activity` |
| 10 min bez aktywnosci studenta | Timer + kolejka + edge function | `10min_AI_evaluation` |
| ~~Zamkniecie karty~~ | ~~USUNIETY~~ | ~~close_tab_AI_evaluation~~ |
| Nauczyciel klika Create Homework | Edge function + auto-queue | `create_hw_AI_evaluation` |
| Student klika Submit Homework | Submit handler | `submit_hw_AI_evaluation` |
| Nauczyciel klika Mark Done | RPC add_student_event | `mark_done_evaluation` |

---

## PODSUMOWANIE ZMIAN

| # | Plik | Zmiana | Problem |
|---|------|--------|---------|
| 1 | Migracja SQL | Usunac `AND event_type = v_event_type` z DELETE w obu triggerach | 2 |
| 2 | Migracja SQL | Usunac `close_tab` z CASE WHEN w obu triggerach | 1C |
| 3 | `process-pending-ai-evaluations/index.ts` | Dodac logike auto-queue gdy `trigger_source = 'create_homework'`: pobrac odpowiedzi z `worksheet_student_answers`, stworzyc pending evals dla open-ended exercises, potem przetworzyc | 1A |
| 4 | `useInteractiveSharedWorksheet.tsx` | Usunac blok kolejkowania AI eval przy close_tab (linie 353-383), zostawic save odpowiedzi (linie 330-351) | 1C |
| 5 | `src/types/dslm/events.ts` | Usunac `close_tab_AI_evaluation` z typow | 1C, 1D |
| 6 | Dokumentacja | Aktualizacja scenariuszy | 1D |

### Bezpieczenstwo zmian

- Zmiana 1 (SQL DELETE): naprawia BUG duplikatow - teraz DELETE usuwa istniejacy rekord BEZ wzgledu na event_type. Efekt uboczny: ZERO - kazde exercise i tak powinno miec dokladnie 1 rekord
- Zmiana 2 (SQL CASE): usuniecienie jednej wartosci z CASE - jesli ktos przesle 'close_tab', dostanie default 'student_learning_activity' zamiast bledu
- Zmiana 3 (edge function): dodaje nowa sciezke logiki - istniejace sciezki nie sa zmieniane
- Zmiana 4 (frontend): usuniecienie kodu - nie moze nic zepsuc
