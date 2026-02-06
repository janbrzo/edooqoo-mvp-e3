

# Plan naprawy 5 problemow

## PROBLEM 1: True/False odpowiedzi w student HTML export

**Analiza:** W pliku `ExerciseTrueFalseAudio.tsx` (linia 122), radio button w trybie non-interactive ma:
```
checked={viewMode === 'teacher' && statement.isTrue === true}
```

Czyli w widoku teacher poprawna odpowiedz jest zaznaczona na radio button. Gdy eksportujemy HTML, klonujemy DOM - wtedy te radio buttons SA zaznaczone. W `htmlExport.ts` (linie 480-484) jest fix ktory odznacza radio buttons, ALE ten fix dotyczy TYLKO elementow wewnatrz `clonedElement`. Problem polega na tym ze:

1. Export klonuje caly DOM z widoku `teacher` (bo nauczyciel jest zalogowany)
2. Kod czyszczacy (linia 480) odznacza `input[type="radio"]` - to POWINNO dzialac

**Wniosek:** Kod wyglada poprawnie - radio buttons SA odznaczane. Dodamy dodatkowe zabezpieczenie - usuwanie atrybutu `checked` z DOM i nadpisanie wlasciwosci `checked` w JavaScript, bo `removeAttribute('checked')` usuwa atrybut HTML, ale nie zmienia stanu wewnetrznego DOM.

**Zmiana:** W `htmlExport.ts` dodac bardziej agresywne czyszczenie: ustawic `(radio as HTMLInputElement).checked = false` ORAZ dodac inline style `display:none` na green answer spans specyficznie dla True/False.

---

## PROBLEM 2.1: Searchbar dla studentow na Dashboard

**Zmiana:** W `Dashboard.tsx` dodac:
- Input do wyszukiwania studentow (filter w czasie rzeczywistym po nazwie)
- Filtrowanie `students` przez `filter(s => s.name.toLowerCase().includes(searchTerm))`

## PROBLEM 2.2: Sortowanie A-Z / Z-A

**Zmiana:** W `Dashboard.tsx` dodac:
- Przycisk toggle sortowania A-Z / Z-A (maly, delikatny)
- Stan `sortMode`: 'recent' (domyslny) | 'az' | 'za'
- Logika sortowania stosowana przed renderowaniem

## PROBLEM 2.3: Sprawdzenie domyslnego sortowania

**Analiza:** W `useStudents.tsx` linia 27: `.order('updated_at', { ascending: false })` - sortuje po `updated_at` malejaco, czyli ostatnio aktywny student jest na gorze. Funkcja `updateStudentActivity` (linia 121) aktualizuje `updated_at` przy tworzeniu worksheet. To jest POPRAWNE.

---

## PROBLEM 3: Progress procentowy liczony od przykladow, nie od zadan

**Aktualny stan:** Procent = (ukonczone_zadania / wszystkie_zadania) * 100. Jedno zadanie jest "ukonczone" gdy ALL sub-questions maja odpowiedzi.

**Zmiana:**
1. W `HomeworkProgress` i `SharedWorksheetProgress` dodac nowe pola:
   - `totalTasks` (suma wszystkich przykladow/pytan)
   - `answeredTasks` (suma uzupelnionych przykladow/pytan)
2. Procent na pasku = `answeredTasks / totalTasks * 100`
3. Wyswietlanie: "Progress: 1/8 exercises | 5/80 tasks (6%)"
4. Tekst exercises zostaje bez zmian - liczy sie po pelnych zadaniach
5. Zmiany w: `useInteractiveHomework.tsx`, `useInteractiveSharedWorksheet.tsx`, `HomeworkProgressBar.tsx`, `SharedWorksheetProgressBar.tsx`

---

## PROBLEM 4.1: True/False nie pokazuje poprawnych odpowiedzi po submit

**Analiza:** W `HomeworkExerciseRenderer.tsx` linia 536-585, True/False rendering nie pokazuje poprawnej odpowiedzi (`statement.isTrue`) gdy `showCorrectAnswers === true`. Brakuje wizualnego oznaczenia poprawnej odpowiedzi - jest tylko podswietlanie inputu studenta.

**Zmiana:** Dodac wyswietlanie poprawnej odpowiedzi (zielony tekst "Correct: True/False") obok odpowiedzi studenta po submit. Dodac takze kolorowanie tla (zielone/czerwone) jak w innych cwiczeniach.

## PROBLEM 4.2: Matching nie jest jednoznaczny po submit

**Analiza:** W `ExerciseMatching.tsx` po submit (`showCorrectAnswers=true`) student widzi:
- Swoja odpowiedz (litera np. "B") 
- Poprawna litera w nawiasie np. "(A)"
- Ale NIE widzi jaka definicja odpowiada jakiej literze

**Zmiana:** Po submit dodac wyswietlanie pelnej definicji obok poprawnej odpowiedzi, np.:
- Student wybral: B
- Poprawna: A (definicja tekst)
Lub wyswietlic definicje bezposrednio przy poprawnej odpowiedzi, tak jak w Live Session.

---

## PROBLEM 5: Oczekiwanie na AI Evaluation po submit

**Analiza:** Po kliknieciu "Submit Homework" AI Evaluation trwa 5-10 sekund. Student widzi puste miejsce.

**Zmiana:** 
- Dodac stan `isWaitingForAiEval` w `useInteractiveHomework.tsx`
- Ustawiac na `true` po submit, na `false` gdy `aiEvaluations` sie zaktualizuja
- W `HomeworkExerciseRenderer.tsx` lub `HomeworkPage.tsx` wyswietlic animowany element (skeleton/spinner) z tekstem "AI is evaluating your answers..." przy zadaniach otwartych
- Element znika gdy AI feedback sie pojawi

---

## PODSUMOWANIE ZMIAN W PLIKACH

| # | Plik | Zmiana | Problem |
|---|------|--------|---------|
| 1 | `src/utils/htmlExport.ts` | Agresywniejsze czyszczenie radio i odpowiedzi T/F | 1 |
| 2 | `src/pages/Dashboard.tsx` | Searchbar + sortowanie A-Z | 2.1, 2.2 |
| 3 | `src/hooks/useInteractiveHomework.tsx` | Nowe pola progress (totalTasks, answeredTasks) + isWaitingForAiEval | 3, 5 |
| 4 | `src/hooks/useInteractiveSharedWorksheet.tsx` | Nowe pola progress (totalTasks, answeredTasks) | 3 |
| 5 | `src/types/interactiveHomework.ts` | Rozszerzenie HomeworkProgress o totalTasks, answeredTasks | 3 |
| 6 | `src/types/interactiveSharedWorksheet.ts` | Rozszerzenie SharedWorksheetProgress o totalTasks, answeredTasks | 3 |
| 7 | `src/components/homework/HomeworkProgressBar.tsx` | Wyswietlanie tasks + procent z tasks | 3 |
| 8 | `src/components/shared/SharedWorksheetProgressBar.tsx` | Wyswietlanie tasks + procent z tasks | 3 |
| 9 | `src/components/homework/HomeworkExerciseRenderer.tsx` | T/F poprawne odpowiedzi + Matching czytelnosc + AI waiting skeleton | 4.1, 4.2, 5 |
| 10 | `src/components/worksheet/ExerciseMatching.tsx` | Dodanie definicji przy showCorrectAnswers | 4.2 |
| 11 | Dokumentacja (6 plikow) | Aktualizacja | wszystkie |

