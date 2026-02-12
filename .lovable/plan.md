
# Plan naprawy: 6 problemow

## PROBLEM 1: Ujednolicenie wygladu Shared Worksheet i Homework

### Analiza roznic (obecny stan)

| Element | Shared Worksheet | Homework | Lepsze |
|---------|-----------------|----------|--------|
| **Tlo strony** | `bg-gray-50` (szare) | `bg-background` (biale) | Homework (biale) |
| **Szerokosc kontentu** | `max-w-6xl` (~1152px) | `max-w-5xl` (~1024px) | Shared (szersze) |
| **Naglowek** | Prosty: tytul + "Shared by: email" | Rozbudowany: tytul + student name + teacher + deadline + created | Homework ma wiecej info, ale za duzo |
| **Progress bar** | Prostszy, `bg-white border-b shadow-sm` | Bardziej rozbudowany z badge'ami | Shared (czystszy) |
| **Przycisk Study** | Duzy okragly przycisk na srodku ekranu | BRAK | Shared |
| **Identyfikacja typu** | Brak wyraznego label "Shared Worksheet" | Brak wyraznego label "Homework" | Brak w obu |
| **Padding cwiczen** | `p-6` wewnatrz worksheet-content | `p-5` w HomeworkExerciseRenderer | Shared |
| **Media section** | Uzywa komponentu `MediaSection` | Wlasny renderowany blok z Card | Shared (czystrze) |
| **Tytul cwiczen** | Uzywa `getOfficialExerciseName` | Uzywa surowego `exercise.title` | Shared (spujniejsze) |
| **Footer** | "Your answers are automatically saved." | "Submit Homework" button + teacher view | OK - rozne konteksty |

### Plan zmian

**A. Tlo - zmiana na Shared Worksheet:**
- `SharedWorksheet.tsx` linia 393: `bg-gray-50` -> `bg-background` (biale tlo jak homework)

**B. Szerokosc - ujednolicenie na max-w-6xl:**
- `HomeworkPage.tsx` linia 633, 692: `max-w-5xl` -> `max-w-6xl`
- `HomeworkProgressBar.tsx` linia 40: `max-w-5xl` -> `max-w-6xl`

**C. Label identyfikujacy typ dokumentu:**
- Shared Worksheet: Dodac maly badge/label na gorze naglowka: fioletowy pasek z tekstem "SHARED WORKSHEET" i ikona FileText
- Homework: Dodac maly badge/label: pomaranczowy pasek z tekstem "HOMEWORK" i ikona ClipboardList
- Styl: subtelny, w gornej czesci naglowka (nad tytulem), maly `text-xs uppercase tracking-wider`

**D. Naglowek Homework - uproszczenie:**
- Dodac do Homework naglowka styl bardziej podobny do Shared Worksheet
- Naglowek Homework: zachowac informacje (student, teacher, deadline) ale w bardziej kompaktowym ukladzie
- Uzyc tego samego stylu co Shared: `bg-white border-b shadow-sm` zamiast `bg-card border-b border-border`

**E. Przycisk Study na Homework:**
- Dodac `StudyModeButton` na Homework (po weryfikacji emaila, przed interaktywnym trybem)
- Stan `isStudyMode` - student musi kliknac "Study" aby zaczac wypelniac
- Tekst przycisku: "Start" zamiast "Study" (homework context)

**F. Tytuly cwiczen w Homework - uzyc getOfficialExerciseName:**
- W `HomeworkExerciseRenderer.tsx` zamiast surowego `exercise.title`, uzyc identycznej logiki co SharedWorksheetContent

**G. Media section w Homework - uzyc MediaSection:**
- Zamiast wlasnego renderowania w HomeworkPage, uzyc komponentu `MediaSection` (ten sam co Shared Worksheet)

### Pliki do zmiany:
- `src/pages/SharedWorksheet.tsx` - tlo, label
- `src/pages/HomeworkPage.tsx` - szerokosc, label, Study button, media section
- `src/components/homework/HomeworkProgressBar.tsx` - szerokosc
- `src/components/homework/HomeworkExerciseRenderer.tsx` - tytuly cwiczen
- `src/components/shared/SharedWorksheetContent.tsx` - label

---

## PROBLEM 2: Teacher's Tip pod poleceniem zamiast na dole

### Analiza
W `ExerciseSection.tsx` linia 1730-1735, `TeacherTipSection` jest renderowany NA KONCU po wszystkich typach cwiczen. Musi byc przeniesiony tuz pod `ExerciseContent` (linia 790-796), czyli po instructions i content, ale PRZED renderowaniem konkretnego typu cwiczenia.

### Rozwiazanie
Przeniesc `TeacherTipSection` z linii 1730 do linii ~797 (po `ExerciseContent`, przed first exercise type render):

```
ExerciseContent (instructions + content)
TeacherTipSection  <-- TUTAJ (przeniesiony z dolu)
Reading / Matching / Fill-in-Blanks / etc.
```

### Plik:
- `src/components/worksheet/ExerciseSection.tsx`

---

## PROBLEM 3: Inna kolejnosc odpowiedzi multiple-choice-picture na Homework

### Analiza
`ExerciseMultipleChoice.tsx` uzywa shuffle seed: `${worksheetId}-mc-${qIndex}-${options}`.

- Na worksheet/shared worksheet: `worksheetId` = UUID worksheet'u
- Na homework (`HomeworkExerciseRenderer.tsx` linia 182): `worksheetId={homeworkId}` - to jest UUID homework_assignments, NIE worksheet'u

Rozne ID = rozny seed = rozna kolejnosc odpowiedzi.

### Rozwiazanie
W `HomeworkPage.tsx` trzeba przekazac `source_worksheet_id` zamiast `homework.id` do `HomeworkExerciseRenderer`. Homework RPC powinno zwracac `source_worksheet_id`.

Sprawdze czy `get_homework_by_share_token` zwraca source_worksheet_id. Jesli nie, dodam je do interface i pobiorę z tabeli homework_assignments.

Alternatywne rozwiazanie (prostsze): Uzyc content-based seed zamiast worksheetId-based seed. Ale to zmienilby kolejnosc na worksheet tez, wiec lepiej przekazac correct worksheetId.

Konkretnie:
1. W `HomeworkPage.tsx` pobrac `source_worksheet_id` z tabeli `homework_assignments`
2. Przekazac go jako `worksheetId` prop do `HomeworkExerciseRenderer`

### Plik:
- `src/pages/HomeworkPage.tsx` - pobrac i przekazac source_worksheet_id

---

## PROBLEM 4: Fill in the Blanks (Audio) - brak odpowiedzi studenta w Live Session

### Analiza
`ExerciseFillInBlanksAudio.tsx` NIE ma prop `liveSessionAnswer` - w interfejsie brakuje tego propsa. W `ExerciseSection.tsx` linia 1650-1698, przy renderowaniu `ExerciseFillInBlanksAudio` NIE jest przekazywany `liveSessionAnswer`.

Jest to identyczny problem jak wczesniejszy Fill in Blanks (nie-audio), ale tym razem dla wersji audio.

### Rozwiazanie
1. Dodac `liveSessionAnswer?: Record<number, any>` do interfejsu `ExerciseFillInBlanksAudioProps`
2. W renderowaniu (linia 93-164), po sekcji correct answer, dodac wyswietlanie `[Student: answer]` w niebieskim kolorze
3. W `ExerciseSection.tsx` linia ~1693, przekazac `liveSessionAnswer={liveSessionAnswer}`

### Pliki:
- `src/components/worksheet/ExerciseFillInBlanksAudio.tsx`
- `src/components/worksheet/ExerciseSection.tsx`

---

## PROBLEM 5: AI Evaluation feedback box - za duzy dolny margines

### Analiza
Na zrzucie widac, ze okienko z feedbackiem ma duzo pustego miejsca pod tekstem. Obecny kod (linia 107-112 w `AiEvaluationBadge.tsx`):
```tsx
<div className="flex items-start gap-1.5 p-1.5 bg-muted/50 rounded-lg text-xs">
```

Problem NIE jest w padding (`p-1.5` jest juz maly). Problem jest w tym, ze `<p>` element moze miec domyslny `margin-bottom`, lub `space-y-2` na rodzicu (linia 83) dodaje zbyt duzy gap pod feedback divem.

### Rozwiazanie
- Dodac `pb-0` lub `!pb-1` do wewnetrznego diva
- Uzyc `space-y-1` zamiast `space-y-2` na glownym kontenerze (linia 83)
- Dodac `m-0` do paragrafu `<p>` w feedbacku

Zmiana w `AiEvaluationBadge.tsx`:
- linia 83: `space-y-2` -> `space-y-1`
- linia 110: dodac `m-0` do `<p>`

### Plik:
- `src/components/homework/AiEvaluationBadge.tsx`

---

## PROBLEM 6: Error Correction - brak odpowiedzi po Submit Homework

### Analiza
W `HomeworkExerciseRenderer.tsx` linie 317-339, error-correction jest renderowane inline (nie uzywa osobnego komponentu). Aktualny kod:

```tsx
{isInteractive && (
  <input value={studentAnswer} ... disabled={disabled} />
)}
```

Po submit homework, `disabled=true`, wiec input jest disabled ale WIDOCZNY (bo `isInteractive=true` nadal). 
ALE - brak sekcji `showCorrectAnswers` - nie wyswietla prawidlowej odpowiedzi po submicie!

Porownanie z `ExerciseSectionUtils.tsx` linia 235-259: tam jest:
```tsx
{(viewMode === 'teacher' || showCorrectAnswers) && (
  <div className="text-green-600 italic text-sm">
    <span>({sentence.answer || sentence.correction})</span>
  </div>
)}
```

### Rozwiazanie
Dodac sekcje `showCorrectAnswers` do error-correction w `HomeworkExerciseRenderer.tsx`, wyswietlajac poprawna odpowiedz (`sentence.answer || sentence.correction || sentence.correct || sentence.corrected`), kolorystyka odpowiedzi (zielona/czerwona) na podstawie porownania z odpowiedzia studenta, oraz visual feedback (tlo zielone/czerwone na inputach).

### Plik:
- `src/components/homework/HomeworkExerciseRenderer.tsx`

---

## PODSUMOWANIE ZMIAN

| # | Plik | Zmiana | Problem |
|---|------|--------|---------|
| 1 | `SharedWorksheet.tsx` | Biale tlo, label "SHARED WORKSHEET" | 1 |
| 2 | `HomeworkPage.tsx` | Szerokosc 6xl, label "HOMEWORK", Study button, source_worksheet_id | 1, 3 |
| 3 | `HomeworkProgressBar.tsx` | Szerokosc 6xl | 1 |
| 4 | `HomeworkExerciseRenderer.tsx` | Official exercise names, fix error-correction showCorrectAnswers | 1, 6 |
| 5 | `ExerciseSection.tsx` | Przeniesc TeacherTip pod instructions, dodac liveSessionAnswer do FillInBlanksAudio | 2, 4 |
| 6 | `ExerciseFillInBlanksAudio.tsx` | Dodac liveSessionAnswer prop i wyswietlanie | 4 |
| 7 | `AiEvaluationBadge.tsx` | Zmniejszyc space-y i margines | 5 |
| 8 | `SharedWorksheetContent.tsx` | Label "SHARED WORKSHEET" w naglowku | 1 |
| 9 | Dokumentacja | Aktualizacja | Wszystkie |

### Bezpieczenstwo zmian

- Problem 1: Tylko zmiany CSS/layout + nowy stanowy przycisk Study. Brak zmian w logice zapisywania danych.
- Problem 2: Tylko przeniesienie JSX w ExerciseSection - zero zmian logicznych.
- Problem 3: Zmiana przekazywanego ID - jesli pobierzemy source_worksheet_id, shuffle bedzie identyczny.
- Problem 4: Addytywna zmiana - dodanie propsa i warunkowego renderowania.
- Problem 5: Tylko zmiana CSS.
- Problem 6: Addytywna zmiana - dodanie brakujacej sekcji showCorrectAnswers.
