
# Zaktualizowany plan naprawy: 6 problemow

## PROBLEM 1: Kontrola Vocabulary vs Grammar na cwiczeniach

### Jak to bedzie dzialac (krok po kroku)

**UX w formularzu (ExerciseSelector):**

W trybie Manual, pod kazda wybrana kafelka cwiczenia pojawia sie maly dwu-przyciskowy przelacznik:

```
[x] Reading Comprehension 📖
    [V] [G]         <-- male przyciski, domyslnie oba nieaktywne (szare)
```

- Klikniecie "V" (Vocabulary) - przycisk zmienia kolor na niebieski, focus tego cwiczenia ustawiony na vocabulary
- Klikniecie "G" (Grammar) - przycisk zmienia kolor na fioletowy, focus na grammar
- Klikniecie aktywnego przycisku - odznaczenie, powrot do domyslnego (AI decyduje)
- Tylko jeden moze byc aktywny naraz (V lub G, nie oba)
- Przelaczniki widoczne TYLKO dla wybranych cwiczen (checked=true)

**Przyklad widoku:**
```
[x] Reading Comprehension 📖     [V]  [G]
[x] Fill in the Blanks ✏️        [V]  [G]    <-- G aktywne (fioletowy)
[x] Multiple Choice 📝           [V]  [G]    <-- V aktywne (niebieski)
[ ] True/False Questions ✓✗                  <-- nie wybrane, brak przelacznikow
[x] Matching Exercise 🔗         [V]  [G]
```

**Dane w FormData:**

```typescript
// W types.ts - nowe pole:
exerciseFocusMap?: Record<string, 'vocabulary' | 'grammar'>;
// Klucz = exercise ID, wartosc = focus type
// Brak wpisu = AI decyduje (domyslnie)

// Przyklad wartosci:
{
  "fill-in-blanks": "grammar",
  "multiple-choice": "vocabulary"
}
```

**Co trafia do promptu AI:**

W `generateExerciseListInstruction()` zamiast:
```
Use EXACTLY these exercise types: reading, fill-in-blanks, multiple-choice, matching
```
Generujemy:
```
Use EXACTLY these exercise types: reading, fill-in-blanks [GRAMMAR FOCUS], multiple-choice [VOCABULARY FOCUS], matching
```

**Nowa instrukcja w core-instructions.ts (punkt 25):**
```
25. EXERCISE FOCUS TAGS:
    Some exercises are tagged with [VOCABULARY FOCUS] or [GRAMMAR FOCUS]:
    - [VOCABULARY FOCUS]: This exercise MUST focus on topic-related vocabulary, 
      word meanings, collocations, and lexical practice. Do NOT emphasize grammar 
      structures in this exercise.
    - [GRAMMAR FOCUS]: This exercise MUST focus on practicing the specified grammar 
      point (from grammarFocus field). Design items that require students to apply 
      the grammar rule. If no grammarFocus is specified, focus on grammar structures 
      naturally relevant to the topic.
    - Exercises WITHOUT a tag: Use your best judgment to balance vocabulary and 
      grammar based on the lesson context.
```

**Warunek:** Instrukcja 25 jest dodawana TYLKO gdy exerciseFocusMap ma przynajmniej 1 wpis. Jesli mapa jest pusta - prompt jest identyczny jak dotychczas (zero zmian w istniejacym zachowaniu).

### Pliki do zmiany:
1. `src/components/WorksheetForm/types.ts` - dodac `exerciseFocusMap?: Record<string, 'vocabulary' | 'grammar'>` do `FormData`
2. `src/components/WorksheetForm/ExerciseSelector.tsx` - dodac przelaczniki V/G pod kazdym wybranym cwiczeniem + nowy prop `exerciseFocusMap` i `onFocusChange`
3. `src/components/WorksheetForm/index.tsx` - dodac stan `exerciseFocusMap`, przekazac do ExerciseSelector i submitForm
4. `src/utils/promptFormatter.ts` - w `formatPromptForAI` dodac linie `exerciseFocusMap: ...` jesli mapa niepusta; w `createFormDataForStorage` zachowac mape
5. `supabase/functions/generateWorksheet/prompts/core-instructions.ts` - w `generateExerciseListInstruction` wstawic tagi `[VOCABULARY FOCUS]` / `[GRAMMAR FOCUS]` z mapy; w `getCoreInstructions` dodac punkt 25
6. `supabase/functions/generateWorksheet/prompts/prompt-composer.ts` - przekazac `exerciseFocusMap` do `getCoreInstructions`
7. `supabase/functions/generateWorksheet/index.ts` - odczytac `exerciseFocusMap` z request body i przekazac dalej

### Implementacja w ExerciseSelector.tsx (szczegoly):

Nowe propsy:
```typescript
interface ExerciseSelectorProps {
  // ... existing props
  exerciseFocusMap?: Record<string, 'vocabulary' | 'grammar'>;
  onFocusChange?: (exerciseId: string, focus: 'vocabulary' | 'grammar' | undefined) => void;
}
```

W renderowaniu kazdego cwiczenia (linia 744-786), pod etykieta, dodac:
```tsx
{isSelected && selectionMode === 'manual' && (
  <div className="flex gap-1 ml-auto">
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onFocusChange?.(exercise.id, 
          exerciseFocusMap?.[exercise.id] === 'vocabulary' ? undefined : 'vocabulary'
        );
      }}
      className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors ${
        exerciseFocusMap?.[exercise.id] === 'vocabulary'
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-500 hover:bg-blue-100'
      }`}
    >
      V
    </button>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onFocusChange?.(exercise.id, 
          exerciseFocusMap?.[exercise.id] === 'grammar' ? undefined : 'grammar'
        );
      }}
      className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors ${
        exerciseFocusMap?.[exercise.id] === 'grammar'
          ? 'bg-purple-500 text-white'
          : 'bg-gray-200 text-gray-500 hover:bg-purple-100'
      }`}
    >
      G
    </button>
  </div>
)}
```

---

## PROBLEM 2: Roznice wizualne Shared Worksheet vs Homework

### A. Usunac ogolny box na Shared Worksheet
W `SharedWorksheetContent.tsx` linia 588 jest wrapper `<div className="bg-white rounded-lg shadow-sm border overflow-hidden relative">`. Usunac ten wrapper zeby cwiczenia renderowaly sie bezposrednio (jak na Homework).

### B.1 Naglowek Shared Worksheet - wyrownanie do lewej
Zmienic `max-w-4xl` na `max-w-6xl` w naglowku (linia 536 w SharedWorksheet.tsx). Dzieki temu tekst naglowka wyrownuje sie z cwiczeniami ponizej.

### B.2 Uzupelnic informacje w naglowku Shared Worksheet
Dodac informacje ktore sa w Homework:
- "For: [student name]" (jesli worksheet przypisany do studenta)
- Ujednolicic format daty z Homework

### C. Pasek postepu Shared Worksheet
Zmienic `max-w-4xl` na `max-w-6xl` w `SharedWorksheetProgressBar.tsx` (linia 26). Zmienic styl na identyczny z `HomeworkProgressBar` (ten sam layout flex).

### D. Label na pasku postepu (sticky)
Przeniesc kolorowy label "SHARED WORKSHEET" / "HOMEWORK" z naglowka na pasek postepu (sticky top-0), po lewej stronie od paska postepu. Usunac label z naglowkow.

Zmiany w `SharedWorksheetProgressBar.tsx`:
```tsx
<div className="sticky top-0 z-20 bg-white border-b shadow-sm">
  <div className="max-w-6xl mx-auto px-4 py-3">
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Label */}
      <div className="flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5 text-worksheet-purple" />
        <span className="text-xs font-semibold uppercase tracking-wider text-worksheet-purple">
          Shared Worksheet
        </span>
      </div>
      {/* Progress info - identyczny layout jak HomeworkProgressBar */}
      ...
    </div>
  </div>
</div>
```

Analogicznie w `HomeworkProgressBar.tsx` - dodac label "HOMEWORK" (pomaranczowy) po lewej.

### E. Lesson Media na Homework - uzyc MediaSection
Zamienic linie 654-711 w `HomeworkPage.tsx` (wlasny Card z images/audio) na komponent `MediaSection` (ten sam co na SharedWorksheet i WorksheetPage). MediaSection ma AudioPlayer z kontrolkami, pin, collapse, lepszy layout.

### F. Dodatkowe propozycje UX (zaakceptowane)
1. **Auto-save indicator** - ujednolicic styl zapisu na obu (identyczne badge'e)
2. **Smooth scroll** - dodac `scroll-behavior: smooth` do body w obu stronach
3. **Progress confetti** - mikro-animacja przy 100% postepie (react-confetti juz zainstalowane)

### Pliki do zmiany:
- `src/pages/SharedWorksheet.tsx` - naglowek max-w-6xl, usunac label, uzupelnic info
- `src/components/shared/SharedWorksheetContent.tsx` - usunac wrapper box
- `src/components/shared/SharedWorksheetProgressBar.tsx` - max-w-6xl, dodac label, layout jak Homework
- `src/components/homework/HomeworkProgressBar.tsx` - dodac label "HOMEWORK"
- `src/pages/HomeworkPage.tsx` - usunac label z naglowka, MediaSection zamiast Card, smooth scroll, confetti
- `src/index.css` - dodac `scroll-behavior: smooth`

---

## PROBLEM 3: Teacher's Tip nie widoczny

### Przyczyna
W poprzedniej zmianie `TeacherTipSection` zostal usuniety z linii 1730 (komentarz "moved to after ExerciseContent") ale NIGDY nie zostal dodany w nowym miejscu. Linia 1730 mowi `{/* TeacherTipSection moved to after ExerciseContent (line ~797) */}` ale w linii 797 nie ma renderowania tego komponentu.

### Rozwiazanie
Dodac `TeacherTipSection` po linii 796 (po `<ExerciseContent />`), przed linia 798 (przed pierwszym typem cwiczenia):

```tsx
{/* Teacher's Tip - directly after instructions, before exercise items */}
{exercise.teacher_tip && (exerciseViewMode === 'teacher' || viewMode === 'live-session') && (
  <TeacherTipSection
    tip={exercise.teacher_tip}
    isEditing={isEditing}
    onChange={handleTeacherTipChangeLocal}
    viewMode={exerciseViewMode}
  />
)}
```

### Plik:
- `src/components/worksheet/ExerciseSection.tsx` (linia 797)

---

## PROBLEM 4: AI Evaluation feedback box - dolny margines

### Przyczyna
Element `<p>` w HTML ma domyslny `margin-bottom` ktory dodaje dodatkowa przestrzen. Mimo `m-0` w Tailwind, przegladarka moze dodawac wlasne style. Rozwiazanie: zamienic `<p>` na `<span className="block">` i dodac precyzyjny padding.

### Rozwiazanie
W `AiEvaluationBadge.tsx` linia 107-112:
```tsx
{showFeedback && feedback && (
  <div className="flex items-start gap-1.5 px-1.5 pt-1 pb-0.5 bg-muted/50 rounded-lg text-xs">
    <AlertCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
    <span className="text-muted-foreground leading-tight block">{feedback}</span>
  </div>
)}
```

Kluczowe zmiany:
- `p-1.5` zamienione na `px-1.5 pt-1 pb-0.5` (mniejszy dolny padding)
- `<p>` zamienione na `<span className="block">` (brak domyslnego margin-bottom)

### Plik:
- `src/components/homework/AiEvaluationBadge.tsx`

---

## PROBLEM 5: Shuffle consistency - mastery i student_events

### Glowna przyczyna
`masteryCalculator.ts` oblicza shuffle seed uzywajac `exerciseData.worksheetId`, ale `exerciseData` (czyli `exercises[exerciseIndex]`) NIE ZAWIERA pola `worksheetId`. Dlatego seed w kalkulatorze jest INNY niz w UI (ktore otrzymuje `worksheetId` jako osobny prop).

Dotyczy to WSZYSTKICH cwiczen uzywajacych shuffle:
- **matching** - seed: `${worksheetId}-${itemsKey}` (UI) vs `${undefined}-${itemsKey}` = brak worksheetId (kalkulator)
- **synonyms/antonyms** - seed: `syn-${itemsKey}` - TEN jest OK (nie uzywa worksheetId)
- **matching-halves** - seed: `${worksheetId}-halves-${halvesKey}` (UI) vs `default-halves-${halvesKey}` (kalkulator)
- **multiple-choice** - seed: `${worksheetId}-mc-${qIndex}-${options}` - NIE dotyczy kalkulatora (MC porownuje tekst, nie litery)

### Rozwiazanie

**Krok 1:** W hookach `useInteractiveSharedWorksheet` i `useInteractiveHomework`, przed wywolaniem `buildItemEvaluations`, dodac `worksheetId` do `exerciseData`:

```typescript
// useInteractiveSharedWorksheet.tsx (linia 180):
const exerciseData = { ...exercises[exerciseIndex], worksheetId };

// useInteractiveHomework.tsx (linia 200):
const exerciseData = { ...exercises[exerciseIndex], worksheetId: homeworkId };
// homeworkId jest juz ustawiony na source_worksheet_id || homework.id (linia 726 HomeworkPage)
```

To jest minimalna, czysto addytywna zmiana - dodaje jedno pole do obiektu exerciseData PRZED przekazaniem do kalkulatora. Nie zmienia zadnych istniejacych danych ani flow.

**Krok 2:** Weryfikacja przeplywu danych:

```
HomeworkPage.tsx linia 726:
  homeworkId={homework.source_worksheet_id || homework.id}
    -> HomeworkExerciseRenderer prop "homeworkId"
      -> ExerciseMultipleChoice prop "worksheetId={homeworkId}" (linia 185)
      -> ExerciseMatching prop "worksheetId={homeworkId}"
      
useInteractiveHomework.tsx linia 138:
  homeworkId: homework?.id (NIE source_worksheet_id!)
    -> exerciseData NIE ma worksheetId
```

PROBLEM: `useInteractiveHomework` uzywa `homework?.id` jako `homeworkId` (linia 138), a nie `source_worksheet_id`. UI komponenty otrzymuja `source_worksheet_id` (linia 726), ale hook nie. Trzeba przekazac `sourceWorksheetId` do hooka.

**Krok 3:** W `HomeworkPage.tsx`, przekazac `sourceWorksheetId` do `useInteractiveHomework`:

```typescript
// Interfejs hooka - dodac pole:
interface UseInteractiveHomeworkProps {
  homeworkId: string;
  sourceWorksheetId?: string; // NOWE
  // ...
}

// W hooku - uzyc sourceWorksheetId jako worksheetId dla exerciseData:
const effectiveWorksheetId = sourceWorksheetId || homeworkId;
const exerciseData = { ...exercises[exerciseIndex], worksheetId: effectiveWorksheetId };

// W HomeworkPage.tsx - przekazac:
const {
  answers, ...
} = useInteractiveHomework({
  homeworkId: homework?.id || '',
  sourceWorksheetId: homework?.source_worksheet_id || undefined, // NOWE
  // ...
});
```

**Krok 4:** To samo w `useInteractiveSharedWorksheet.tsx`:
```typescript
// worksheetId juz jest dostepny jako prop hooka (linia 18)
const exerciseData = { ...exercises[exerciseIndex], worksheetId };
```

### Wplyw na student_events.event_payload

Dzieki temu, `buildItemEvaluations` -> `calculateItemMastery` bedzie uzywal poprawnego seeda:
- `exerciseData.worksheetId` bedzie rowny ID oryginalnego worksheetu
- Seed shuffle w kalkulatorze = seed w UI
- Wynik: poprawna litera = poprawne mastery = poprawne nano_skill_ratings w event_payload

### Pliki do zmiany:
- `src/hooks/useInteractiveSharedWorksheet.tsx` - dodac worksheetId do exerciseData
- `src/hooks/useInteractiveHomework.tsx` - dodac sourceWorksheetId prop, uzyc w exerciseData
- `src/pages/HomeworkPage.tsx` - przekazac sourceWorksheetId do hooka

---

## PROBLEM 6: Usunac "Add Observation" z Event Log Panel

### Zmiana
W `EventLogPanel.tsx`:
- Usunac przycisk "Add Observation" (linia 141-148)
- Usunac formularz dodawania obserwacji (linia 162-198)
- Usunac zwiazane stany: `showAddForm`, `newObservation`, `observationType`, `isSubmitting` (linia 64-67)
- Usunac funkcje: `handleAddObservation` (linia 78-90)
- Zachowac: filtry, liste eventow, statystyki, refresh, `addTeacherObservation` w hookach (nie usuwac z hooka, tylko z UI)

### Plik:
- `src/components/dslm/EventLogPanel.tsx`

---

## PODSUMOWANIE ZMIAN

| # | Plik | Zmiana | Problem |
|---|------|--------|---------|
| 1 | `types.ts` | Dodac `exerciseFocusMap` do FormData | 1 |
| 2 | `ExerciseSelector.tsx` | Przyciski V/G pod cwiczeniami | 1 |
| 3 | `WorksheetForm/index.tsx` | Stan exerciseFocusMap | 1 |
| 4 | `promptFormatter.ts` | Dodac focusMap do promptu i storage | 1 |
| 5 | `core-instructions.ts` | Tagi [VOCABULARY/GRAMMAR FOCUS], punkt 25 | 1 |
| 6 | `prompt-composer.ts` | Przekazac exerciseFocusMap | 1 |
| 7 | `generateWorksheet/index.ts` | Odczytac exerciseFocusMap z body | 1 |
| 8 | `SharedWorksheet.tsx` | Naglowek max-w-6xl, usunac label, info | 2 |
| 9 | `SharedWorksheetContent.tsx` | Usunac wrapper box | 2 |
| 10 | `SharedWorksheetProgressBar.tsx` | max-w-6xl, label, layout | 2 |
| 11 | `HomeworkProgressBar.tsx` | Dodac label "HOMEWORK" | 2 |
| 12 | `HomeworkPage.tsx` | Usunac label, MediaSection, scroll, confetti, sourceWorksheetId do hooka | 2, 5 |
| 13 | `index.css` | scroll-behavior: smooth | 2F |
| 14 | `ExerciseSection.tsx` | Dodac TeacherTipSection po ExerciseContent | 3 |
| 15 | `AiEvaluationBadge.tsx` | Fix margines: span zamiast p, pb-0.5 | 4 |
| 16 | `useInteractiveSharedWorksheet.tsx` | Dodac worksheetId do exerciseData | 5 |
| 17 | `useInteractiveHomework.tsx` | Dodac sourceWorksheetId prop | 5 |
| 18 | `EventLogPanel.tsx` | Usunac Add Observation | 6 |
| 19 | Dokumentacja | Aktualizacja | Wszystkie |

### Bezpieczenstwo zmian

- Problem 1: Nowe pole `exerciseFocusMap` jest opcjonalne. Jesli puste, prompt jest identyczny jak dotychczas. Zero wplywu na istniejace worksheety.
- Problem 2: Zmiany CSS/layout only + MediaSection (juz uzywany na SharedWorksheet). Confetti na 100% to efekt wizualny bez wplywu na dane.
- Problem 3: Addytywna zmiana - dodanie brakujacego renderowania komponentu.
- Problem 4: Zamiana `<p>` na `<span>` i zmiana paddingu - zero wplywu na logike.
- Problem 5: Dodanie jednego pola `worksheetId` do obiektu exerciseData PRZED przekazaniem do kalkulatora. Nie zmienia struktury danych w bazie. Jesli pole bylo undefined, fallback w kalkulatorze i tak dzialal (tyle ze z blednym seedem). Teraz seed bedzie poprawny.
- Problem 6: Usuniecie UI elementow - hook `addTeacherObservation` zostaje nietkniety (moze byc uzywany gdzie indziej).
