

# Plan naprawy 3 problemów z homework

## PODSUMOWANIE ZNALEZIONYCH PRZYCZYN

### PROBLEM 1: Mastery w logach student_events nie zmienia się po AI Evaluation

**Analiza kodu:**

W `useInteractiveHomework.tsx` linie 391-400:
```typescript
// Save to database - one update per exercise with all question evaluations
for (const [exIdxStr, evalData] of Object.entries(dbUpdates)) {
  const exIdx = parseInt(exIdxStr);
  await supabase
    .from('homework_student_answers')
    .update({ ai_evaluation: evalData })  // ❌ TYLKO ai_evaluation!
    .eq('homework_id', homeworkId)
    .eq('student_email', studentEmail)
    .eq('exercise_index', exIdx);
}
```

**Przyczyna główna:**
Po otrzymaniu wyników AI, system aktualizuje TYLKO kolumnę `ai_evaluation`, ale NIE aktualizuje kolumny `item_evaluations` i `mastery`. 

Trigger SQL `trg_homework_answer_to_events` przepisuje dane z kolumny `item_evaluations` do `nano_skill_ratings` w event_payload. Jeśli `item_evaluations` nie zostanie zaktualizowane po AI evaluation, logi pozostają z wartościami domyślnymi (50% dla oczekujących zadań otwartych).

**Rozwiązanie:**
Po otrzymaniu wyników AI, należy:
1. Przeliczyć `mastery` per-item używając `quality_score` z AI (0-1 → 0-100)
2. Zaktualizować kolumny `mastery` i `item_evaluations` w tabeli `homework_student_answers`
3. To automatycznie zaktualizuje logi w `student_events` przez trigger

---

### PROBLEM 2.1: AI Evaluation pojawia się na dole ćwiczenia, nie pod każdym pytaniem

**Analiza kodu:**

W `HomeworkExerciseRenderer.tsx` linie 565-582:
```tsx
{/* PROBLEM 4: Show AI Evaluations for open-ended exercises after submission - per question */}
{isOpenEnded && aiEvaluation && disabled && Object.keys(aiEvaluation).length > 0 && (
  <div className="mt-4 pt-4 border-t space-y-3">
    <h4 className="text-sm font-medium text-muted-foreground">AI Evaluation:</h4>
    {Object.entries(aiEvaluation).map(([qIdxStr, evaluation]) => {
      ...
    })}
  </div>
)}
```

**Przyczyna:**
AI Evaluation jest renderowane jako OSOBNA SEKCJA na końcu ćwiczenia, a nie przekazywane do poszczególnych komponentów ćwiczeń.

**Rozwiązanie:**
1. Dodać prop `aiEvaluations?: Record<number, AiEvaluation>` do interfejsu `InteractiveExerciseProps`
2. Przekazywać `aiEvaluation` do każdego komponentu ćwiczenia otwartego (ExerciseAnswerQuestions, ExerciseDialogue, ExerciseReading, itd.)
3. W każdym komponencie ćwiczenia renderować `AiEvaluationBadge` bezpośrednio pod polem odpowiedzi dla danego pytania
4. Usunąć zbiorczą sekcję z dołu `HomeworkExerciseRenderer`

---

### PROBLEM 2.2: AI Evaluation nie pojawia się dla Dialogue i niektórych innych zadań otwartych

**Analiza kodu:**

W `useInteractiveHomework.tsx` linia 313:
```typescript
const questionItems = exerciseData?.questions || exerciseData?.prompts || exerciseData?.sentences || [];
```

**Przyczyna:**
Dla ćwiczenia Dialogue, itemy są w polu `expressions`, ale kod sprawdza tylko: `questions`, `prompts`, `sentences`.

W ExerciseDialogue.tsx widać że dane expressions są przekazywane:
```tsx
{expressions && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {expressions.map((expr, eIndex) => { ... })}
  </div>
)}
```

**Rozwiązanie:**
Rozszerzyć logikę pobierania itemów o `expressions`:
```typescript
const questionItems = exerciseData?.questions || exerciseData?.prompts || exerciseData?.sentences || exerciseData?.expressions || [];
```

---

### PROBLEM 3: Przycisk Submit Homework wymaga 2 kliknięć

**Analiza kodu:**

W `HomeworkPage.tsx` linie 732-749:
```tsx
<Button 
  onClick={handleSubmitClick}
  disabled={isCompleting || isSaving}  // ❌ isSaving blokuje przycisk!
  className="w-full"
  size="lg"
>
```

**Przyczyna:**
Auto-save uruchamia się z opóźnieniem 1.5s i ustawia `isSaving=true`. Gdy uczeń kończy pisać i od razu klika "Submit Homework":
1. Kliknięcie wyzwala najpierw `onBlur` na polu tekstowym
2. `saveOnBlur()` ustawia `isSaving=true`
3. Przycisk staje się `disabled` w tym samym momencie
4. Kliknięcie jest ignorowane
5. Po zakończeniu zapisu (ok 0.5s) przycisk znów jest aktywny
6. Drugie kliknięcie działa

**Rozwiązanie:**
Usunąć `isSaving` z warunku `disabled`:
```tsx
disabled={isCompleting}  // Tylko blokujemy podczas finalnego submit
```

Alternatywnie, można dodać logikę oczekiwania na zakończenie pending saves przed submitem - ale to komplikuje UX. Prostsze jest pozwolenie na submit nawet gdy trwa auto-save, bo `submitHomework()` i tak najpierw ładuje wszystkie odpowiedzi z bazy.

---

## PLAN IMPLEMENTACJI

### Zmiana 1: Aktualizacja mastery po AI Evaluation (PROBLEM 1)

**Plik: `src/hooks/useInteractiveHomework.tsx`**

W funkcji `submitHomework()`, po otrzymaniu wyników AI (linie ~360-410), dodać aktualizację `item_evaluations` i `mastery`:

```typescript
// Po linii 389 (dbUpdates[exIdx].question_evaluations.push...)
// Dodać budowanie item_evaluations z AI scores

// Build item_evaluations with AI mastery scores
const exerciseData = exercises[exIdx];
const questionItems = exerciseData?.questions || exerciseData?.prompts || exerciseData?.sentences || exerciseData?.expressions || [];

const itemEvals: ItemEvaluation[] = dbUpdates[exIdx].question_evaluations.map((qEval: any) => {
  const qItem = questionItems[qEval.question_index];
  const nanoSkill = safeGetNanoSkill(qItem);
  
  return {
    question_index: qEval.question_index,
    name: nanoSkill?.name || `question_${qEval.question_index}`,
    reason: nanoSkill?.reason || '',
    mastery: Math.round(qEval.quality_score * 100), // 0-1 → 0-100
    hasValue: true
  };
});

const overallMastery = itemEvals.length > 0
  ? Math.round(itemEvals.reduce((sum, e) => sum + e.mastery, 0) / itemEvals.length)
  : null;

// Update database with item_evaluations and mastery
await supabase
  .from('homework_student_answers')
  .update({ 
    ai_evaluation: evalData,
    item_evaluations: itemEvals,  // ✅ DODANE
    mastery: overallMastery       // ✅ DODANE
  })
  .eq('homework_id', homeworkId)
  .eq('student_email', studentEmail)
  .eq('exercise_index', exIdx);
```

---

### Zmiana 2: Przekazanie AI Evaluation do komponentów ćwiczeń (PROBLEM 2.1)

**Plik: `src/types/interactiveHomework.ts`**

Dodać import i prop do interfejsu `InteractiveExerciseProps`:
```typescript
import { AiEvaluation } from '@/components/homework/AiEvaluationBadge';

export interface InteractiveExerciseProps {
  // ... istniejące props
  
  /**
   * AI evaluations per question index (for open-ended exercises)
   */
  aiEvaluations?: Record<number, AiEvaluation>;
}
```

**Plik: `src/components/homework/HomeworkExerciseRenderer.tsx`**

Przekazać `aiEvaluation` do każdego komponentu ćwiczenia otwartego:
```tsx
// Przy ExerciseAnswerQuestions (linia ~499):
<ExerciseAnswerQuestions
  ...
  aiEvaluations={aiEvaluation}  // ✅ DODANE
/>

// Przy ExerciseDialogue (linia ~178):
<ExerciseDialogue
  ...
  aiEvaluations={aiEvaluation}  // ✅ DODANE
/>

// Podobnie dla: ExerciseReading, ExerciseListeningComprehension, 
// ExerciseDescribe, ExerciseParaphrasing, itd.
```

I usunąć zbiorczą sekcję AI Evaluation z dołu (linie 565-582).

**Pliki komponentów ćwiczeń (ExerciseAnswerQuestions.tsx, ExerciseDialogue.tsx, itd.):**

Dodać prop i renderowanie badge'a pod każdym pytaniem:
```tsx
interface ExerciseAnswerQuestionsProps extends Partial<InteractiveExerciseProps> {
  // ... istniejące props
  aiEvaluations?: Record<number, AiEvaluation>;  // ✅ DODANE
}

// W mapowaniu pytań, po Input:
{isInteractive && aiEvaluations?.[qIndex] && disabled && (
  <AiEvaluationBadge 
    evaluation={aiEvaluations[qIndex]} 
    showFeedback={true}
  />
)}
```

---

### Zmiana 3: Dodanie `expressions` do listy itemów (PROBLEM 2.2)

**Plik: `src/hooks/useInteractiveHomework.tsx`**

Linia 313 - rozszerzyć o `expressions`:
```typescript
const questionItems = exerciseData?.questions || exerciseData?.prompts || exerciseData?.sentences || exerciseData?.expressions || [];
```

---

### Zmiana 4: Naprawić przycisk Submit (PROBLEM 3)

**Plik: `src/pages/HomeworkPage.tsx`**

Linia 734 - usunąć `isSaving`:
```tsx
<Button 
  onClick={handleSubmitClick}
  disabled={isCompleting}  // ✅ Usunięto || isSaving
  ...
>
```

I zaktualizować tekst przycisku (linie 738-747):
```tsx
{isCompleting ? (
  <>
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    Submitting...
  </>
) : (
  <>
    <Send className="mr-2 h-5 w-5" />
    Submit Homework
  </>
)}
```

---

## LISTA PLIKÓW DO EDYCJI

| # | Plik | Zmiana | Priorytet |
|---|------|--------|-----------|
| 1 | `src/hooks/useInteractiveHomework.tsx` | Aktualizacja `item_evaluations` i `mastery` po AI evaluation + dodanie `expressions` | **KRYTYCZNY** |
| 2 | `src/types/interactiveHomework.ts` | Dodać `aiEvaluations` do `InteractiveExerciseProps` | WYSOKI |
| 3 | `src/components/homework/HomeworkExerciseRenderer.tsx` | Przekazać `aiEvaluation` do komponentów + usunąć zbiorczą sekcję | **KRYTYCZNY** |
| 4 | `src/components/worksheet/ExerciseAnswerQuestions.tsx` | Dodać prop `aiEvaluations` i renderować badge pod pytaniami | WYSOKI |
| 5 | `src/components/worksheet/ExerciseDialogue.tsx` | Dodać prop `aiEvaluations` i renderować badge pod expressions | WYSOKI |
| 6 | `src/components/worksheet/ExerciseReading.tsx` | Dodać prop `aiEvaluations` i renderować badge pod pytaniami | WYSOKI |
| 7 | `src/components/worksheet/ExerciseListeningComprehension.tsx` | Dodać prop `aiEvaluations` i renderować badge pod pytaniami | WYSOKI |
| 8 | `src/components/worksheet/ExerciseDescribe.tsx` | Dodać prop `aiEvaluations` i renderować badge pod promptami | WYSOKI |
| 9 | `src/components/worksheet/ExerciseParaphrasing.tsx` | Dodać prop `aiEvaluations` i renderować badge pod zdaniami | WYSOKI |
| 10 | `src/components/worksheet/ExerciseAnswerQuestionsAudio.tsx` | Dodać prop `aiEvaluations` i renderować badge pod pytaniami | ŚREDNI |
| 11 | `src/pages/HomeworkPage.tsx` | Usunąć `isSaving` z disabled przycisku Submit | **KRYTYCZNY** |
| 12 | `docs/TECHNICAL_DOCUMENTATION.md` | Zaktualizować dokumentację | NISKI |

---

## OCZEKIWANE REZULTATY

### Po implementacji PROBLEM 1:

Event `homework_answer_saved` po AI evaluation będzie zawierał poprawne mastery:
```json
{
  "exercise_index": 2,
  "exercise_type": "answer-questions",
  "nano_skill_ratings": [
    {
      "question_index": 0,
      "name": "ns.grammar.reported_speech.reported_advice",
      "reason": "Tests ability to report advice...",
      "mastery": 50,    // ✅ Zgodne z AI Score 50%
      "hasValue": true
    },
    {
      "question_index": 1,
      "name": "ns.grammar.reported_speech.reported_past_events",
      "reason": "Tests reporting past activities...",
      "mastery": 40,    // ✅ Zgodne z AI Score 40%
      "hasValue": true
    }
  ]
}
```

### Po implementacji PROBLEM 2.1 i 2.2:

- AI Evaluation badge pojawi się bezpośrednio pod każdym polem odpowiedzi
- Uczeń nie musi scrollować, żeby zobaczyć feedback
- Dialogue, Reading, Describe Picture i wszystkie inne zadania otwarte będą wyświetlać oceny AI

### Po implementacji PROBLEM 3:

- Przycisk "Submit Homework" zadziała od pierwszego kliknięcia
- Nie będzie blokowany przez trwający auto-save

---

## SEKCJA TECHNICZNA

### Import w komponentach ćwiczeń

Każdy komponent ćwiczenia otwartego musi zaimportować:
```typescript
import { AiEvaluationBadge, AiEvaluation } from '@/components/homework/AiEvaluationBadge';
```

### Warunki renderowania AI badge

Badge powinien być renderowany tylko gdy:
1. `isInteractive === true` (tryb studenta)
2. `aiEvaluations?.[qIndex]` istnieje (jest ocena dla tego pytania)
3. `disabled === true` (homework został wysłany)

```tsx
{isInteractive && aiEvaluations?.[qIndex] && disabled && (
  <AiEvaluationBadge evaluation={aiEvaluations[qIndex]} showFeedback={true} />
)}
```

### Kompatybilność wsteczna

Wszystkie zmiany są addytywne - dodajemy nowe opcjonalne props. Istniejący kod który nie przekazuje `aiEvaluations` będzie nadal działał - po prostu nie wyświetli badge'a.

