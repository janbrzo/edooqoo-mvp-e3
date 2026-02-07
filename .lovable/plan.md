
# Plan naprawy 4 problemow

## PROBLEM 1: "operator does not exist: uuid = text" - logi nie zapisuja sie

**Przyczyna (POTWIERDZONA w kodzie SQL):**

W triggerze `log_worksheet_answer_to_events` zmienna `v_source_id` jest zadeklarowana jako `text`:
```sql
v_source_id text;
```

A potem uzywana w porownaniu z kolumna `source_id` w tabeli `student_events`, ktora ma typ `uuid`:
```sql
DELETE FROM student_events
WHERE source_id = v_source_id  -- uuid = text -> BLAD!
```

To powoduje blad PostgreSQL "operator does not exist: uuid = text" przy kazdym INSERT/UPDATE do `worksheet_student_answers`.

**Rozwiazanie:**

Migracja SQL zmieniajaca deklaracje zmiennej z `text` na `uuid`:
```sql
v_source_id uuid;  -- bylo: text
```

Albo alternatywnie dodanie rzutowania:
```sql
v_source_id := NEW.worksheet_id::uuid;
```

Wybieramy zmiane typu zmiennej na `uuid` - to czystsze rozwiazanie. Cala reszta logiki triggera jest poprawna (mastery juz jest dodane).

---

## PROBLEM 2: Element oczekiwania AI Evaluation - zmiana pozycji

**Obecny stan:** Element oczekiwania wyswietla sie POD kazdym zadaniem otwartym (linie 600-609 w HomeworkExerciseRenderer). To jest pozycja wewnatrz scrollowalnej strony - znika gdy przewiniesz.

**Rozwiazanie:** Przeniesc element oczekiwania z wnetrza `HomeworkExerciseRenderer` do `HomeworkPage.tsx` jako **fixed sidebar** po prawej stronie ekranu, wycentrowany w pionie. Bedzie widoczny niezaleznie od scrollowania. Zniknie gdy AI Evaluation sie pojawi.

Implementacja:
- W `HomeworkPage.tsx` dodac fixed div z `className="fixed right-4 top-1/2 -translate-y-1/2 z-50"`
- Warunek wyswietlania: `isSubmitted && isWaitingForAiEval`
- Usunac stary element z `HomeworkExerciseRenderer.tsx`
- Styl: maly panel z animacja pulsowania, ikona spinner, tekst "AI is evaluating..."
- Panel znika automatycznie gdy `isWaitingForAiEval` staje sie `false`

---

## PROBLEM 3: Progress bez spacji

**Przyczyna:**

W `HomeworkProgressBar.tsx` linie 47-54, elementy sa w oddzielnych spanach z `gap-3`, ale wyglada na to ze na mniejszych ekranach gap moze nie dzialac lub tekst jest zbyt zwarty. Dodatkowy problem: brak separatora wizualnego miedzy elementami.

**Rozwiazanie:**

Dodac separator `|` (pionowa kreska) miedzy elementami:
```tsx
<span className="text-sm font-medium">
  Progress: {progress.answeredExercises}/{progress.totalExercises} exercises
</span>
<span className="text-xs text-muted-foreground mx-1">|</span>
{progress.totalTasks > 0 && (
  <span className="text-xs text-muted-foreground">
    {progress.answeredTasks}/{progress.totalTasks} tasks
  </span>
)}
```

To samo dla `SharedWorksheetProgressBar.tsx`.

---

## PROBLEM 4: Kolejnosc zadan na homework

**Przyczyna (POTWIERDZONA):**

Sort `.sort((a, b) => a - b)` w `CreateHomeworkModal.tsx` linia 282 JEST poprawny dla indeksow. ALE problem lezy w `exercise.title` - kazde zadanie z worksheet ma juz w tytule numer np. "Exercise 6: True or False". Gdy `HomeworkExerciseRenderer` sprawdza:
```tsx
if (exercise.title?.toLowerCase().startsWith('exercise')) {
  return exercise.title;  // Zwraca "Exercise 6: True or False" zamiast "Exercise 1: True or False"
}
```

Uzywany jest ORYGINALNY numer z worksheet zamiast nowego numeru z homework. Dlatego widac "Exercise: 3, 4, 1, 2, 5, 6, 7, 8" - bo tyutly zostaly skopiowane z worksheet.

**Rozwiazanie:**

W `HomeworkExerciseRenderer.tsx` ZAWSZE nadpisywac numer exercise na `index + 1`:
```tsx
const renderTitle = () => {
  // Strip existing "Exercise N:" prefix if present
  let titleText = exercise.title || 'Untitled Exercise';
  const exerciseMatch = titleText.match(/^Exercise\s+\d+\s*:\s*(.*)/i);
  if (exerciseMatch) {
    titleText = exerciseMatch[1]; // Extract just the name part
  }
  return `Exercise ${index + 1}: ${titleText}`;
};
```

To zapewni ze:
- Zadania z worksheet dostana nowe numery 1,2,3,...
- Wygenerowane zadania kontynuuja numeracje (9, 10, ...)
- Kolejnosc z worksheet jest zachowana (bo sort juz dziala)

---

## PODSUMOWANIE ZMIAN

| # | Plik | Zmiana | Problem |
|---|------|--------|---------|
| 1 | Migracja SQL | Zmienic `v_source_id text` na `v_source_id uuid` w triggerze | 1 |
| 2 | `src/pages/HomeworkPage.tsx` | Dodac fixed sidebar z AI waiting indicator | 2 |
| 3 | `src/components/homework/HomeworkExerciseRenderer.tsx` | Usunac stary AI waiting element | 2 |
| 4 | `src/components/homework/HomeworkProgressBar.tsx` | Dodac separatory `\|` miedzy elementami | 3 |
| 5 | `src/components/shared/SharedWorksheetProgressBar.tsx` | Dodac separatory `\|` miedzy elementami | 3 |
| 6 | `src/components/homework/HomeworkExerciseRenderer.tsx` | Nadpisywac numer Exercise na `index + 1` | 4 |
| 7 | Dokumentacja | Aktualizacja | wszystkie |

### Bezpieczenstwo zmian

- Zmiana 1 (SQL): naprawia BUG - zmienia typ zmiennej lokalnej, zero wplywu na inne funkcje
- Zmiana 2-3 (sidebar): przenosi element UI, zero wplywu na logike
- Zmiana 4-5 (spacje): kosmetyka CSS/tekstu
- Zmiana 6 (numeracja): zmienia TYLKO wyswietlany tytul, nie zmienia danych w bazie
