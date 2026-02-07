

# Plan naprawy 3 problemow

## PROBLEM 1: "column mastery of relation student_events does not exist"

**Przyczyna (POTWIERDZONA):**

Sprawdzilem kolumny tabeli `student_events` - NIE MA kolumny `mastery`. Tabela ma: id, student_id, teacher_id, event_type, event_source, source_id, event_payload, skill_ids, element_type, session_id, created_at, is_processed.

Trigger `log_worksheet_answer_to_events` (ostatnia migracja) probuje wstawic `NEW.mastery` do kolumny `mastery` w `student_events`:
```sql
INSERT INTO student_events (..., mastery, ...) VALUES (..., NEW.mastery, ...)
```

Ta kolumna NIE ISTNIEJE - stad blad. Rozwiazanie: dodac brakujaca kolumne `mastery` do tabeli `student_events`.

**Zmiana:** Migracja SQL:
```sql
ALTER TABLE public.student_events ADD COLUMN IF NOT EXISTS mastery numeric;
```

---

## PROBLEM 2: Multiple Choice - niejednoznaczne odpowiedzi po submit

**Przyczyna (POTWIERDZONA w kodzie):**

W `ExerciseMultipleChoice.tsx` po submit (`showCorrectAnswers=true`):
- Poprawna odpowiedz: zielone tlo + zielone kolko z checkmarkiem
- Bledna odpowiedz studenta: czerwone tlo + czerwone kolko z X
- ALE: brak tekstu "Your answer" / "Correct answer" - student musi zgadywac co znacza kolory

**Zmiana:** Dodac tekstowe etykiety:
- Na opcji ktora zaznaczyl student: etykieta "(Your answer)" w niebieskim kolorze
- Na poprawnej opcji (jesli student wybral inna): etykieta "(Correct)" w zielonym kolorze
- Jesli student trafil poprawna: etykieta "(Your answer - Correct!)" w zielonym kolorze

Zmiany w `ExerciseMultipleChoice.tsx` linie 170-185.

---

## PROBLEM 3: Kolejnosc zadan na homework

**Analiza (POTWIERDZONA danymi z bazy):**

Dane z ostatniego homework w bazie:
- Pozycja 0: "Exercise 1: Listening Comprehension..."
- Pozycja 1: "Exercise 2: Answer Questions..."
- Pozycja 2: "Exercise 3: Meeting at the University..."
- Pozycja 3: "Exercise 4: Finding a Book..."
- Pozycja 4: "Exercise 6: Discussing School Life" (oryginalny numer 6!)
- Pozycja 5: "Exercise 5: Your School Experiences" (oryginalny numer 5!)

Kolejnosc W BAZIE jest poprawna - odpowiada kolejnosci z worksheet (gdzie media exercises sa na poczatku). Problem lezy TYLKO w tytulach - "Exercise 6" i "Exercise 5" zachowuja oryginalne numery z worksheet.

Fix z `renderTitle()` (dodany w ostatniej edycji) JUZ rozwiazuje ten problem - strip "Exercise N:" i zastepuje "Exercise {index+1}:". Ale DANE W BAZIE nadal maja stare tytuly - dla NOWYCH homework bedzie poprawnie, ale stare rekordy zostana ze starymi tytulami.

Dodatkowo: wygenerowane zadania na koncu maja tytul "Exercise 1:" zamiast kontynuowac numeracje. `renderTitle()` naprawi to rowniez - wygenerowane zadanie na pozycji 8 dostanie "Exercise 9:".

**Wniosek:** Fix `renderTitle()` JUZ jest w kodzie. Sprawdze czy dziala poprawnie i nie wymaga zmian. Jesli problem nadal wystepuje po renderTitle, to znaczy ze `renderTitle` nie jest wywoływany - sprawdze to.

---

## PODSUMOWANIE ZMIAN

| # | Plik | Zmiana | Problem |
|---|------|--------|---------|
| 1 | Migracja SQL | Dodac kolumne `mastery numeric` do `student_events` | 1 |
| 2 | `src/components/worksheet/ExerciseMultipleChoice.tsx` | Dodac etykiety "(Your answer)" i "(Correct)" po submit | 2 |

Problem 3 jest juz naprawiony przez istniejacy `renderTitle()` w `HomeworkExerciseRenderer.tsx` - nie wymaga dodatkowych zmian.

### Bezpieczenstwo zmian

- Zmiana 1 (SQL): dodaje NOWA kolumne - zero wplywu na istniejace dane, trigger zacznie dzialac poprawnie
- Zmiana 2 (etykiety): dodaje TYLKO tekstowe elementy UI po submit - zero wplywu na logike interakcji

