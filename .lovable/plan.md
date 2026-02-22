

# Plan wdrozenia - 6 problemow DSLM + UX

---

## Problem 1: Brak badge nano_skill w zadaniu Reading + dual badges

**Przyczyna**: `ExerciseReading.tsx` linia 52 uzywa `safeGetNanoSkill(question)` ktory zwraca TYLKO pierwszy nano_skill. Komponent `NanoSkillBadge` otrzymuje prop `nanoSkill` ale NIE otrzymuje `allNanoSkills`, wiec drugi nano_skill (writing) nigdy sie nie wyswietla.

Dodatkowo warunek widocznosci (linia 53): `viewMode === 'teacher' && !isSharedWorksheet && nanoSkill` - w Live Session `viewMode` jest konwertowany na `'teacher'` w `ExerciseSection.tsx` linia 651, wiec badge POWINIEN byc widoczny. Problem moze lezec w tym ze AI nie generuje `nano_skill` jako array w nowym formacie, ale to trzeba zweryfikowac na danych.

**Rozwiazanie**:
- W `ExerciseReading.tsx`: dodac import `safeGetAllNanoSkills` i przekazac wynik jako prop `allNanoSkills` do `NanoSkillBadge`
- Ten sam wzorzec zastosowac we WSZYSTKICH 29 komponentach cwiczen (ExerciseDialogue, ExerciseMatching, ExerciseFillInBlanks, itd.)
- Kazdy komponent ktory renderuje `NanoSkillBadge` musi przekazywac `allNanoSkills={safeGetAllNanoSkills(item)}`

**Pliki do zmiany**: ExerciseReading.tsx, ExerciseDialogue.tsx, ExerciseMatching.tsx, ExerciseFillInBlanks.tsx, ExerciseMultipleChoice.tsx, ExerciseOddOneOut.tsx, ExerciseAnswerQuestions.tsx, ExerciseGapText.tsx, ExerciseMatchingHalves.tsx, ExerciseCompleteWord.tsx, ExerciseCategorize.tsx, ExerciseParaphrasing.tsx, ExerciseSentenceTransformation.tsx, ExerciseNegativePrefixes.tsx, ExerciseWordOrder.tsx, ExerciseSynonymsAntonyms.tsx, ExerciseListeningComprehension.tsx, ExerciseMultipleChoiceAudio.tsx, ExerciseTrueFalseAudio.tsx, ExerciseFillInBlanksAudio.tsx, ExerciseAnswerQuestionsAudio.tsx, ExerciseDescribe.tsx + True/False components

---

## Problem 2: Przycisk "Add Exercise" w Live Session

**Opis**: Nowy przycisk obok Create Homework w toolbarze Live Session. Otwiera modal podobny do CreateHomeworkModal, ale zamiast tworzyc homework, generuje nowe cwiczenie i dodaje je do biezacego worksheetu (pod ostatnim Exercise, przed Vocabulary Sheet). Limit: max 12 cwiczen na worksheet.

**Rozwiazanie techniczne**:

1. **Nowy komponent `AddExerciseModal.tsx`**:
   - Modal z lista typow cwiczen do wyboru (jak w CreateHomeworkModal)
   - Pole na dodatkowe instrukcje (opcjonalne)
   - Przycisk "Generate" ktory wywoluje edge function `generateWorksheet` z parametrem `single_exercise: true`
   - Po wygenerowaniu: dodaje cwiczenie do `editableWorksheet.exercises` i zapisuje do bazy

2. **Zmiany w `WorksheetToolbar.tsx`**:
   - Nowy prop `onAddExercise`
   - Przycisk "Add Exercise" widoczny TYLKO w Live Session mode
   - Skrocenie nazw przyciskow: "Homework" zamiast "Create Homework", "Draw" zamiast "Draw on Worksheet", "Hide" zamiast "Hide Drawings"

3. **Zapis do bazy**: 
   - UPDATE `worksheets.ai_response` z nowym cwiczeniem
   - Automatyczna synchronizacja z shared worksheet (student zobaczy nowe cwiczenie w real-time bo czyta z tego samego rekordu)

4. **Limit 12 cwiczen**: Walidacja w modalu - jesli `exercises.length >= 12`, przycisk "Add Exercise" jest disabled z tooltip "Maximum 12 exercises per worksheet"

**Pliki do zmiany**: Nowy `AddExerciseModal.tsx`, WorksheetToolbar.tsx, WorksheetContainer.tsx (lub WorksheetContent.tsx - tam gdzie jest logika worksheetu)

---

## Problem 3: Ikona usuwania w Overview > Recent Worksheets

**Przyczyna**: W zakladce Overview (StudentPage.tsx linie 418-448) nie ma przycisku Delete - jest tylko link do worksheetu i WorksheetHomeworkSection.

**Rozwiazanie**: Dodac `DeleteWorksheetButton` obok kazdego worksheetu w sekcji Recent Worksheets (linie 418-448). Uzyc tego samego komponentu co w zakladce Worksheets (linia 641-644).

**Zmiana w `StudentPage.tsx`**:
- W sekcji Recent Worksheets, wewnatrz mapowania `worksheets.slice(0, 5).map(...)`, dodac `DeleteWorksheetButton` po prawej stronie kazdego wiersza
- Trzeba zmienic layout z `<Link>` na `<div>` z osobnym linkiem i przyciskiem delete, zeby klikniecie delete nie nawigowalo do worksheetu

---

## Problem 4: Znaczniki [V] i [G] na worksheet

**Opis**: Na formularzu mozna wybrac V (vocabulary) lub G (grammar) per exercise. Te znaczniki sa zapisywane w `formData.exerciseFocusMap` (np. `{"reading": "vocabulary", "fill-in-blanks": "grammar"}`). Trzeba je wyswietlac w 2 miejscach:

**A. InputParamsCard.tsx** - w "Selected Exercise Types":
- Przed nazwa cwiczenia dodac `[V]` lub `[G]` w kwadratowym nawiasie
- Np. `[V] Discussion, [G] Fill in the Blanks, Reading`
- Trzeba przekazac `exerciseFocusMap` jako nowy prop

**B. ExerciseHeader.tsx** - w naglowku cwiczenia:
- Po "Exercise 7:" dodac `[V]` lub `[G]`
- Np. "Exercise 7: [V] Discussing"
- Trzeba przekazac `exerciseFocus` jako nowy prop z ExerciseSection

**Pliki do zmiany**:
- `InputParamsCard.tsx`: nowy prop `exerciseFocusMap`, wyswietlanie [V]/[G] przed nazwa
- `ExerciseHeader.tsx`: nowy prop `exerciseFocus`, wyswietlanie [V]/[G] w tytule
- `ExerciseSection.tsx`: przekazanie `exerciseFocus` z `originalFormData?.exerciseFocusMap?.[exercise.type]`
- `WorksheetContent.tsx` lub komponent renderujacy InputParamsCard: przekazanie `exerciseFocusMap`

---

## Problem 5: Period i CEFR filtry obok siebie

**Przyczyna**: W `SkillsOverviewPanel.tsx` linie 196-241, Period filter i CEFR filter sa w osobnych `<div>` co powoduje ze sa pod soba.

**Rozwiazanie**: Polaczyc oba filtry w jeden `<div>` z separatorem `|` lub dodatkowym marginesem, zeby byly w jednej linii:

```text
Period: [7d] [14d] [30d] ... [Custom] [Go]  |  CEFR: [All] [A1] [A2] [B1] [B2] [C1] [C2]
```

Zmiana w `SkillsOverviewPanel.tsx` linie 196-241: zamiast dwoch osobnych div, jeden div z `flex-wrap` i separator miedzy nimi.

---

## Problem 6: StudentSwitcherPopover - scroll + niebieski ludzik

**Przyczyna scroll**: `ScrollArea` ma `max-h-72` (288px) co powinno dzialac, ale moze nie dzialac poprawnie z Radix ScrollArea. Problem moze byc w tym ze `ScrollArea` wymaga konkretnej wysokosci a nie max-height, lub brakuje `overflow-y-auto` na wewnetrznym kontenerze.

**Przyczyna koloru**: Ikona `<User>` nie ma zadnego koloru - domyslnie jest czarna/szara.

**Rozwiazanie**:
- W `StudentSwitcherPopover.tsx`:
  - Zmienic kolor ikony User na niebieski: `className="h-8 w-8 text-blue-600"`
  - Dodac `h-72` (zamiast `max-h-72`) do ScrollArea lub uzyc natywnego `overflow-y-auto` zamiast Radix ScrollArea
  - Alternatywnie: zastapic `<ScrollArea className="max-h-72">` na `<div className="max-h-72 overflow-y-auto">`

---

## Kolejnosc implementacji

1. **Problem 6** - Najszybsza zmiana (StudentSwitcherPopover - 2 linie)
2. **Problem 5** - Szybka zmiana (filtry obok siebie - kilka linii)
3. **Problem 3** - Srednia zmiana (delete w Overview)
4. **Problem 1** - Srednia zmiana (allNanoSkills we wszystkich komponentach)
5. **Problem 4** - Srednia zmiana ([V]/[G] tagi)
6. **Problem 2** - Najwieksza zmiana (Add Exercise modal + logika)

## Pliki do zmiany (podsumowanie)

| Plik | Zmiana |
|------|--------|
| StudentSwitcherPopover.tsx | Niebieski kolor ikony + fix scroll |
| SkillsOverviewPanel.tsx | Period + CEFR w jednej linii |
| StudentPage.tsx | DeleteWorksheetButton w Overview > Recent Worksheets |
| ExerciseReading.tsx + 20+ exercise components | allNanoSkills prop do NanoSkillBadge |
| InputParamsCard.tsx | exerciseFocusMap prop, wyswietlanie [V]/[G] |
| ExerciseHeader.tsx | exerciseFocus prop, [V]/[G] w tytule |
| ExerciseSection.tsx | Przekazanie exerciseFocus do ExerciseHeader |
| WorksheetToolbar.tsx | Przycisk Add Exercise, skrocone nazwy |
| Nowy: AddExerciseModal.tsx | Modal do generowania nowego cwiczenia |
| WorksheetContainer.tsx | Logika dodawania cwiczenia do worksheetu |
| Dokumentacja (6 plikow) | Aktualizacja |

