

# Plan naprawy 3 problemow

## PROBLEM 1: Mastery nie zapisuje sie w student_events po AI Evaluation

### Przyczyna glowna (POTWIERDZONA danymi z bazy)

Sprawdzilem dane w bazie i potwierdzam:
- Tabela `worksheet_student_answers` MA poprawne wartosci `mastery` (np. 78, 72, 73, 90...)
- Tabela `student_events` MA `mastery = NULL` we WSZYSTKICH rekordach `worksheet_answer_saved`

Przyczyna: trigger SQL `log_worksheet_answer_to_events` buduje `event_payload` BEZ pola `mastery`:

```sql
-- OBECNY KOD (brakuje mastery):
jsonb_build_object(
    'answer_id', NEW.id,
    'exercise_index', NEW.exercise_index,
    'exercise_type', NEW.exercise_type,
    'nano_skill_ratings', COALESCE(NEW.item_evaluations, '[]'::jsonb),
    'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
)
```

### Rozwiazanie

Dodac `mastery` do payloadu w triggerze SQL:

```sql
jsonb_build_object(
    'answer_id', NEW.id,
    'exercise_index', NEW.exercise_index,
    'exercise_type', NEW.exercise_type,
    'mastery', NEW.mastery,  -- DODANE
    'nano_skill_ratings', COALESCE(NEW.item_evaluations, '[]'::jsonb),
    'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
)
```

To automatycznie naprawi scenariusze A, B, C i D poniewaz:
- Gdy `process-pending-ai-evaluations` aktualizuje `mastery` w `worksheet_student_answers` -> trigger odpala UPDATE -> `student_events` dostaje nowa wartosc `mastery`
- Dotyczy KAZDEGO scenariusza: close tab, Create Homework, 10-min timer, Live Session Mark Done

### Dodatkowe naprawy dla scenariuszy B i C

**Scenariusz B (Create Homework)**: Juz zaimplementowany - `process-pending-ai-evaluations` jest wywolywany PRZED tworzeniem homework (linia 268-276 w CreateHomeworkModal.tsx). Ale sa 2 rekordy `pending` ze statusem `pending` (nigdy nie przetworzone). Sprawdze czy wywolanie dziala poprawnie i dodam `await` z odpowiednim timeout.

**Scenariusz C (10-min timer)**: Kod istnieje (linie 399-466 w useInteractiveSharedWorksheet.tsx), ale po kolejkowaniu do `pending_worksheet_ai_evaluations` BRAKUJE wywolania `process-pending-ai-evaluations`. Timer jedynie kolejkuje evaluations ale ich nie przetwarza. Trzeba dodac wywolanie Edge Function po zakolejkowaniu.

---

## PROBLEM 2: Brak elementu oczekiwania na AI Evaluation po submit homework

### Przyczyna

Sprawdzilem kod - element oczekiwania JUZ ISTNIEJE (linie 600-609 w HomeworkExerciseRenderer.tsx):
```tsx
{isOpenEnded && disabled && isWaitingForAiEval && !aiEvaluation && (
  <div className="animate-pulse">AI is evaluating your answers...</div>
)}
```

Warunek `!aiEvaluation` sprawdza caly obiekt `aiEvaluation` (Record). Problem: jezeli `aiEvaluations[index]` jest pustym obiektem `{}` zamiast `undefined`, warunek `!aiEvaluation` jest `false` i skeleton sie nie wyswietla.

Dodatkowo, po uzyskaniu wynikow AI, `isWaitingForAiEval` jest ustawiane na `false` (linia 453), ale to ustawia go globalnie - nie per exercise. Wiec jak AI zwroci wyniki dla exercise 0, to skeleton znika DLA WSZYSTKICH exercises naraz.

### Rozwiazanie

Zmienic warunek wyswietlania skeleton z:
```tsx
!aiEvaluation
```
na:
```tsx
(!aiEvaluation || Object.keys(aiEvaluation).length === 0)
```

To zapewni ze skeleton wyswietla sie gdy aiEvaluation jest `undefined` LUB pustym obiektem.

---

## PROBLEM 3: Kolejnosc zadan na homework nie zgadza sie z worksheet

### Przyczyna (POTWIERDZONA)

W `CreateHomeworkModal.tsx` linia 281:
```typescript
const originalExercisesData = Array.from(selectedExercises)
  .map(index => exercises[index])
  .filter(Boolean);
```

`Array.from(Set)` zwraca elementy w kolejnosci DODANIA do Set (insertion order). Gdy nauczyciel klika checkboxy w kolejnosci 3, 4, 1, 2 - homework dostaje zadania w tej kolejnosci.

### Rozwiazanie

Posortowac indeksy przed mapowaniem:
```typescript
const originalExercisesData = Array.from(selectedExercises)
  .sort((a, b) => a - b)  // SORTOWANIE po indeksie z worksheet
  .map(index => exercises[index])
  .filter(Boolean);
```

To zachowa:
- Kolejnosc z worksheet (gdzie media exercises sa juz na poczatku)
- Wygenerowane exercises na koncu (bo sa doklejane po `originalExercisesData`)
- Numery Exercise na homework zaczynaja sie od 1 (juz tak jest w HomeworkExerciseRenderer linia 84)

---

## PODSUMOWANIE ZMIAN

| # | Plik | Zmiana | Problem |
|---|------|--------|---------|
| 1 | Migracja SQL | Dodac `mastery` do payloadu triggera `log_worksheet_answer_to_events` | 1 (A,B,C,D) |
| 2 | `src/hooks/useInteractiveSharedWorksheet.tsx` | Po zakolejkowaniu AI eval w 10-min timerze, wywolac `process-pending-ai-evaluations` | 1C |
| 3 | `src/components/homework/HomeworkExerciseRenderer.tsx` | Poprawic warunek skeleton AI (`Object.keys` check) | 2 |
| 4 | `src/components/homework/CreateHomeworkModal.tsx` | Dodac `.sort((a,b) => a - b)` przy budowaniu listy exercises | 3 |
| 5 | Dokumentacja (6 plikow) | Aktualizacja | wszystkie |

### Kluczowe: dlaczego to nie zepsuje aplikacji

- Zmiana 1 (SQL trigger): dodaje JEDNO pole do payload - nie zmienia istniejacych pol, nie zmienia logiki DELETE+INSERT
- Zmiana 2 (10-min timer): dodaje wywolanie Edge Function PO zakolejkowaniu - worst case: duplikat wywolania ktory zostanie pominity (bo `needs_ai_evaluation` sprawdza timestampy)
- Zmiana 3 (skeleton): zmienia tylko warunek wyswietlania UI - zero wplywu na logike biznesowa
- Zmiana 4 (sort): dodaje sort na tablicy numerow - nie zmienia danych, tylko ich kolejnosc

