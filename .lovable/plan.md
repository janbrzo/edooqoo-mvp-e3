
# Plan naprawy 4 problemów

## Podsumowanie zidentyfikowanych przyczyn głównych

### PROBLEM 1 i 2: Brak `nano_skill_ratings` per-item i `mastery: null` w eventach

**Przyczyna znaleziona:**
W `SharedWorksheet.tsx` (linia 107-112) hook `useInteractiveSharedWorksheet` jest wywoływany **BEZ** parametru `exercises`:

```tsx
const interactiveHook = useInteractiveSharedWorksheet({
  worksheetId: worksheet?.id || '',
  studentEmail: verifiedEmail || '',
  totalExercises,
  exerciseQuestionCounts
  // ❌ BRAKUJE: exercises: worksheetData?.exercises || []
});
```

Bez parametru `exercises`, funkcja `calculateClosedExerciseMastery` nie ma dostępu do danych ćwiczeń i **zawsze zwraca null**.

W `HomeworkPage.tsx` (linia 138) parametr `exercises` JEST przekazywany:
```tsx
exercises: Array.isArray(homework?.selected_exercises) ? homework.selected_exercises : []
```

ALE nadal `mastery` jest null ponieważ:
1. Dla niektórych typów ćwiczeń (np. `antonyms`, `matching-halves`) logika w `calculateClosedExerciseMastery` nie obsługuje poprawnie ich struktury danych
2. Typ `listening-comprehension` nie jest w liście `CLOSED_EXERCISE_TYPES` więc zwraca null

**Rozwiązanie:**
1. Dodać `exercises` do hooka w `SharedWorksheet.tsx`
2. Rozszerzyć listę `CLOSED_EXERCISE_TYPES` o brakujące typy
3. Dodać obsługę brakujących struktur danych w `calculateClosedExerciseMastery`

---

### PROBLEM 3: NanoSkill tooltip nie pokazuje się wcale

**Przyczyna znaleziona:**
Kod w `NanoSkillBadge.tsx` używa poprawnie shadcn/ui `Tooltip`. Jednak tooltip w Radix wymaga:
1. **Globalnego `TooltipProvider`** - bez tego tooltips nie działają
2. Właściwej propagacji zdarzeń kursora

**Analiza:**
Komponent `NanoSkillBadge` jest używany wewnątrz innych komponentów (np. `ExerciseMatching`) które mogą mieć:
- `pointer-events: none` w jakimś parent elemencie
- Konflikt z innymi tooltipami/popoverami

Najbardziej prawdopodobna przyczyna: **brak globalnego `TooltipProvider`** na wyższym poziomie aplikacji - każdy `NanoSkillBadge` ma swój własny `TooltipProvider` z `delayDuration={0}`, ale może być konflikty z innymi providerami.

**Rozwiązanie:**
1. Przenieść `TooltipProvider` na poziom całej aplikacji (np. w `App.tsx`)
2. LUB upewnić się że `NanoSkillBadge` nie jest blokowany przez parent elementy

---

### PROBLEM 4: AI evaluation nie pokazuje się dla wszystkich zadań otwartych

**Przyczyna znaleziona:**
W logach widzę że `aiEvaluations` jest pobierane z hook (`aiEvaluations` linia 122 w HomeworkPage.tsx), ALE:

1. W `useInteractiveHomework.tsx` linia 393-423 - pytania są wysyłane pojedynczo do AI, ale `exercise_index` może być nadpisywany przez `question_index`:
   ```tsx
   answersToVerify.push({
     exercise_index: ans.exercise_index,  // <-- poprawne
     question_index: qIdx,  // <-- poprawne
     ...
   });
   ```

2. ALE w `verify-open-answers/index.ts` linia 167-172:
   ```tsx
   evaluations = evaluations.map((e, idx) => ({
     question_index: e.question_index ?? answers[idx]?.question_index ?? idx,
     // ❌ BRAKUJE: exercise_index - nie jest zwracane przez AI!
   }));
   ```

3. Następnie w `useInteractiveHomework.tsx` linia 445:
   ```tsx
   const exIdx = evaluation.exercise_index ?? evaluation.question_index; // Fallback używa question_index!
   ```

**Problem:** AI nie zwraca `exercise_index`, więc fallback używa `question_index` jako `exercise_index`, co powoduje niepoprawne grupowanie evaluations.

**Rozwiązanie:**
1. Przekazać `exercise_index` w odpowiedzi z edge function `verify-open-answers`
2. LUB zachować oryginalny `exercise_index` z requestu zamiast polegać na odpowiedzi AI

---

## Plan implementacji

### Zmiana 1: SharedWorksheet.tsx - dodać exercises do hooka

```tsx
// Linia 107-112 - dodać parametr exercises
const interactiveHook = useInteractiveSharedWorksheet({
  worksheetId: worksheet?.id || '',
  studentEmail: verifiedEmail || '',
  totalExercises,
  exerciseQuestionCounts,
  exercises: worksheetData?.exercises || [] // DODAĆ
});
```

### Zmiana 2: useInteractiveSharedWorksheet.tsx i useInteractiveHomework.tsx - rozszerzyć calculateClosedExerciseMastery

Dodać obsługę brakujących typów:
- `listening-comprehension` - jest otwarty, NIE zamknięty (poprawnie zwraca null)
- `antonyms`, `synonyms` - poprawić warunek
- `matching-halves` - sprawdzić strukturę danych

Problem: `antonyms` ma `exercise_type: 'antonyms'` ale w kodzie jest warunek `exerciseType === 'synonyms-antonyms'`. Trzeba dodać:
```tsx
} else if ((exerciseType === 'synonyms-antonyms' || exerciseType === 'synonyms' || exerciseType === 'antonyms') && exerciseData.items) {
```

Ten warunek JEST już obecny (linia 87-92 w obu plikach), więc problem może być w strukturze danych.

### Zmiana 3: NanoSkillBadge.tsx - upewnić się że tooltip działa

Najprościej: dodać `open` prop kontrolowany przez hover state:

```tsx
const [isOpen, setIsOpen] = useState(false);

<TooltipProvider delayDuration={0}>
  <Tooltip open={isOpen} onOpenChange={setIsOpen}>
    <TooltipTrigger 
      asChild
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Badge ... />
    </TooltipTrigger>
    <TooltipContent ... />
  </Tooltip>
</TooltipProvider>
```

To daje pełną kontrolę nad stanem tooltip i zapewnia natychmiastowe znikanie.

### Zmiana 4: useInteractiveHomework.tsx - naprawić mapowanie exercise_index

W liniach 444-446 zmienić:
```tsx
// PRZED:
const exIdx = evaluation.exercise_index ?? evaluation.question_index;

// PO: Użyj oryginalnego exercise_index z answersToVerify
// Trzeba zachować mapowanie answer index -> exercise_index
```

Lepsze rozwiązanie: przekazać `exercise_index` do edge function i zwrócić go w odpowiedzi:

**verify-open-answers/index.ts:**
```tsx
// Linia 167-172 - zachować exercise_index z inputu
evaluations = evaluations.map((e, idx) => ({
  question_index: e.question_index ?? answers[idx]?.question_index ?? idx,
  exercise_index: answers[idx]?.exercise_index, // DODAĆ - z inputu
  quality_score: Math.max(0, Math.min(1, e.quality_score || 0)),
  is_acceptable: e.is_acceptable ?? (e.quality_score >= 0.7),
  feedback: e.feedback || 'Thank you for your answer.'
}));
```

---

## Lista plików do edycji

| Problem | Plik | Zmiana |
|---------|------|--------|
| 1, 2 | `src/pages/SharedWorksheet.tsx` | Dodać `exercises` do hooka |
| 1, 2 | `src/hooks/useInteractiveSharedWorksheet.tsx` | Debug logów, sprawdzić dlaczego calculateClosedExerciseMastery zwraca null |
| 1, 2 | `src/hooks/useInteractiveHomework.tsx` | Sprawdzić struktury danych dla antonyms/matching-halves |
| 3 | `src/components/worksheet/NanoSkillBadge.tsx` | Dodać kontrolowany state dla tooltip |
| 4 | `supabase/functions/verify-open-answers/index.ts` | Dodać `exercise_index` do zwracanej odpowiedzi |
| 4 | `src/hooks/useInteractiveHomework.tsx` | Naprawić mapowanie evaluation -> exercise_index |

---

## Oczekiwane rezultaty

1. **Problem 1 i 2:** Eventy `worksheet_answer_saved` i `homework_answer_submitted` będą mieć wypełnione pole `mastery` (0-100%) dla zamkniętych ćwiczeń

2. **Problem 3:** Tooltip z pełną nazwą nano skill pojawi się natychmiast po najechaniu na badge "ns (94%)" i zniknie natychmiast po odsunięciu kursora

3. **Problem 4:** Każde pytanie otwarte będzie miało osobną ocenę AI z feedbackiem wyświetlaną przy tym pytaniu

---

## Sekcja techniczna - szczegóły debugowania

### Debug dla Problemu 1/2 (mastery null):

1. W `calculateClosedExerciseMastery` dodać console.log:
```tsx
console.log('[calculateClosedExerciseMastery]', {
  exerciseType,
  hasExerciseData: !!exerciseData,
  dataKeys: exerciseData ? Object.keys(exerciseData) : [],
  answersCount: Object.keys(answers).length
});
```

2. Sprawdzić czy `exerciseData.items` ma poprawną strukturę dla `antonyms`:
   - Czy każdy item ma pole `answer`/`antonym`?
   - Czy odpowiedź studenta (np. "G") to litera czy tekst?

### Debug dla Problemu 4 (AI evaluation):

1. W console.log sprawdzić strukturę `answersToVerify`:
```tsx
console.log('[submitHomework] answersToVerify:', JSON.stringify(answersToVerify, null, 2));
```

2. Sprawdzić czy `verifyResult.evaluations` zawiera `exercise_index`:
```tsx
console.log('[submitHomework] Raw evaluations:', JSON.stringify(verifyResult.evaluations, null, 2));
```

---

## Uwaga o docelowej architekturze nano_skill_ratings

Obecny system loguje tylko ogólne `mastery` (0-100%) per ćwiczenie. Aby osiągnąć pełną strukturę jak w `exercise_mastery_evaluation` (z `nano_skill_ratings` per-item), potrzebna jest większa refaktoryzacja:

1. Frontend musi pobierać `nano_skill` z każdego pytania w ćwiczeniu
2. Obliczać poprawność per-item
3. Tworzyć strukturę `nano_skill_ratings: [{ name, reason, mastery }]`
4. Przekazywać to do RPC jako JSON

To może być zrealizowane w osobnym zadaniu - obecny plan skupia się na naprawie działających funkcji.
