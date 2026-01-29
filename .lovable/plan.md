
# Plan naprawy 5 problemów

## Podsumowanie znalezionych przyczyn

### PROBLEM 1 i 2: Brak `nano_skill_ratings` per-item i `mastery: null` w eventach worksheet/homework

**Analiza:**
Porównując format eventów:
- **exercise_mastery_evaluation** (wzorcowy): zawiera `nano_skill_ratings` jako tablicę z osobnym `mastery` dla każdego przykładu
- **worksheet_answer_saved** i **homework_answer_submitted**: zawierają tylko ogólne `mastery` dla całego ćwiczenia (i jest null)

**Przyczyna:**
1. Triggery SQL (`log_worksheet_answer_event` i `log_homework_answer_event`) nie mają dostępu do danych nano_skill z poziomu tabeli answers - te dane są w JSON worksheeta
2. Frontend nie oblicza `mastery` per-item przed zapisem - wysyła tylko odpowiedzi

**Wymagane zmiany:**
To jest **fundamentalna zmiana architektury** - aby mieć `nano_skill_ratings` per-item w eventach studenta, system musi:
1. Pobierać nano_skill z danych ćwiczenia dla każdego pytania
2. Obliczać poprawność każdej odpowiedzi
3. Zapisywać to jako tablicę podobną do teacher events

**Rozwiązanie - podejście etapowe:**

**Faza A - Natychmiastowa (obliczanie mastery):**
- Dodać obliczanie ogólnego `mastery` dla zamkniętych ćwiczeń w hookach `useInteractiveSharedWorksheet.tsx` i `useInteractiveHomework.tsx`
- Przekazać `mastery` do RPC przy zapisie

**Faza B - Pełna integracja nano_skill (wymaga więcej pracy):**
- Rozszerzyć triggery SQL o pole `item_evaluations` w payloadzie
- Frontend musi przekazywać strukturę podobną do `nano_skill_ratings`

---

### PROBLEM 3: NanoSkill tooltip się nie pokazuje

**Analiza kodu NanoSkillBadge.tsx:**
```tsx
<TooltipPrimitive.Provider delayDuration={0} skipDelayDuration={0}>
  <TooltipPrimitive.Root>
    <TooltipPrimitive.Trigger asChild>
      <Badge ... />
    </TooltipPrimitive.Trigger>
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content 
        side="top" 
        align="start"
        sideOffset={8}
        avoidCollisions={true}
        collisionPadding={16}
        className="z-[9999] w-72 p-3 bg-white border rounded-lg shadow-lg animate-in ..."
      >
```

**Przyczyna:**
Brak propsa `open` lub kontroli stanu - Radix Tooltip wymaga interakcji użytkownika, ale może być blokowany przez:
1. `pointer-events` problemy w parent elementach
2. Brak odpowiedniego trigger behavior

**Rozwiązanie:**
Uprościć implementację - zamiast `TooltipPrimitive` użyć standardowego `Tooltip` z shadcn/ui który jest przetestowany i działa poprawnie:

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

<TooltipProvider delayDuration={0}>
  <Tooltip>
    <TooltipTrigger asChild>
      <Badge ... />
    </TooltipTrigger>
    <TooltipContent side="top" align="start" className="w-72 p-3 z-[9999]">
      ...
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

### PROBLEM 4: AI evaluation pokazuje się dla całego zadania zamiast per-question

**Analiza:**
Obecny system wysyła wszystkie odpowiedzi jako jeden string do AI i otrzymuje jedną ocenę dla całego ćwiczenia:
```tsx
student_answer: Object.values(exerciseAnswers).join(', ')
```

**Przyczyna:**
`verify-open-answers` otrzymuje jeden zbiorczy tekst odpowiedzi zamiast osobnych pytań.

**Rozwiązanie:**
Zmienić strukturę w `useInteractiveHomework.tsx` aby wysyłać **każde pytanie osobno**:

```tsx
// PRZED: jedna odpowiedź na całe ćwiczenie
answersToVerify.push({
  question_index: exerciseIndex,
  student_answer: allAnswers.join(', '),
  ...
});

// PO: osobna odpowiedź per-question
exercise.questions.forEach((question, qIndex) => {
  answersToVerify.push({
    question_index: exerciseIndex * 100 + qIndex, // unikalne ID per-question
    question_text: question.text,
    student_answer: answers[qIndex],
    suggested_answer: question.suggested_answer,
    ...
  });
});
```

Następnie zapisać `aiEvaluations` jako `Record<number, Record<number, AiEvaluation>>` (exerciseIndex -> questionIndex -> evaluation).

---

### PROBLEM 5: Multiple Choice Audio - różna kolejność w Live Session vs Shared Worksheet

**Analiza:**
- **ExerciseSection.tsx** (linia 1544): przekazuje `worksheetId={worksheetId}` do `ExerciseMultipleChoiceAudio`
- **SharedWorksheetContent.tsx** (linia 620-630): **NIE przekazuje** `worksheetId`!

```tsx
// SharedWorksheetContent.tsx linia 620-630 - BRAKUJE worksheetId!
<ExerciseMultipleChoiceAudio
  questions={exercise.questions}
  audio_url={exercise.audio_url}
  isEditing={false}
  viewMode="student"
  onQuestionChange={() => {}}
  isInteractive={effectiveInteractive}
  studentAnswers={studentAnswers[index] || {}}
  onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
  // ❌ BRAKUJE: worksheetId={worksheet.id}
/>
```

**Przyczyna:**
Bez `worksheetId` funkcja `shuffleArrayWithSeed` w `ExerciseMultipleChoiceAudio` używa pustego seeda lub nie wykonuje shuffle w ogóle, co powoduje inną kolejność niż w widoku nauczyciela.

**Rozwiązanie:**
Dodać `worksheetId={worksheet.id}` do komponentu `ExerciseMultipleChoiceAudio` w `SharedWorksheetContent.tsx`:

```tsx
{exercise.type === 'multiple-choice-audio' && exercise.questions && (
  <ExerciseMultipleChoiceAudio
    questions={exercise.questions}
    audio_url={exercise.audio_url}
    isEditing={false}
    viewMode="student"
    onQuestionChange={() => {}}
    isInteractive={effectiveInteractive}
    studentAnswers={studentAnswers[index] || {}}
    onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
    worksheetId={worksheet.id}  // ✅ DODAĆ
  />
)}
```

---

## Plan implementacji

### Kolejność zmian:

| # | Problem | Plik | Zmiana | Priorytet |
|---|---------|------|--------|-----------|
| 1 | P5 | `SharedWorksheetContent.tsx` | Dodać `worksheetId={worksheet.id}` do `ExerciseMultipleChoiceAudio` | WYSOKI |
| 2 | P3 | `NanoSkillBadge.tsx` | Uprościć tooltip używając shadcn/ui `Tooltip` zamiast `TooltipPrimitive` | WYSOKI |
| 3 | P4 | `useInteractiveHomework.tsx` | Wysyłać pytania osobno do AI zamiast zbiorczo | ŚREDNI |
| 4 | P4 | `HomeworkExerciseRenderer.tsx` | Wyświetlać AI evaluation per-question | ŚREDNI |
| 5 | P1/P2 | `useInteractiveSharedWorksheet.tsx` | Obliczać mastery dla zamkniętych ćwiczeń | ŚREDNI |
| 6 | P1/P2 | `useInteractiveHomework.tsx` | Obliczać mastery dla zamkniętych ćwiczeń | ŚREDNI |

---

## Szczegóły techniczne

### Zmiana 1: SharedWorksheetContent.tsx (Problem 5)

```tsx
// Linia 620-630 - dodać worksheetId
{exercise.type === 'multiple-choice-audio' && exercise.questions && (
  <ExerciseMultipleChoiceAudio
    questions={exercise.questions}
    audio_url={exercise.audio_url}
    isEditing={false}
    viewMode="student"
    onQuestionChange={() => {}}
    isInteractive={effectiveInteractive}
    studentAnswers={studentAnswers[index] || {}}
    onAnswerChange={(qIndex, value) => onAnswerChange?.(index, exercise.type, qIndex, value)}
    worksheetId={worksheet.id}  // DODAĆ
  />
)}
```

### Zmiana 2: NanoSkillBadge.tsx (Problem 3)

Zamienić `TooltipPrimitive` na standardowy `Tooltip` z shadcn/ui:

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// W komponencie:
<TooltipProvider delayDuration={0}>
  <Tooltip>
    <TooltipTrigger asChild>
      <Badge
        variant="outline"
        className={`text-xs cursor-help ${getBadgeColor(nanoSkill.confidence)}`}
      >
        ns ({confidencePercent}%)
      </Badge>
    </TooltipTrigger>
    <TooltipContent 
      side="top" 
      align="start" 
      className="w-72 p-3 z-[9999] bg-white border shadow-lg"
    >
      <div className="space-y-2">
        <p className="font-semibold text-sm text-gray-900">{displayName}</p>
        <p className="text-xs text-gray-600">{nanoSkill.reason}</p>
        <div className="flex items-center gap-2 pt-1 border-t">
          <span className="text-xs text-muted-foreground">Full ID:</span>
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded break-all">{nanoSkill.name}</code>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Confidence:</span>
          <span className="text-xs font-medium">{confidencePercent}%</span>
        </div>
      </div>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Zmiana 3-4: useInteractiveHomework.tsx i HomeworkExerciseRenderer.tsx (Problem 4)

**useInteractiveHomework.tsx** - zmienić wysyłanie do AI:

```tsx
// Zamiast wysyłać jedno pytanie na ćwiczenie, wysyłamy każde pytanie osobno
const answersToVerify: any[] = [];

for (const ans of savedAnswers.filter(a => openAnswerTypes.includes(a.exercise_type))) {
  const exerciseData = exercises[ans.exercise_index];
  const questions = exerciseData?.questions || exerciseData?.prompts || [];
  
  // Iteruj przez każde pytanie osobno
  Object.entries(ans.answers || {}).forEach(([qIdxStr, studentAnswer]) => {
    const qIdx = parseInt(qIdxStr);
    const question = questions[qIdx];
    
    answersToVerify.push({
      question_index: qIdx, // index pytania wewnątrz ćwiczenia
      exercise_index: ans.exercise_index, // index ćwiczenia
      question_text: typeof question === 'string' ? question : (question?.text || question?.prompt || ''),
      student_answer: String(studentAnswer),
      suggested_answer: question?.suggested_answer || question?.answer || '',
      exercise_type: ans.exercise_type
    });
  });
}
```

**HomeworkExerciseRenderer.tsx** - wyświetlać per-question:

```tsx
// Zmienić typ aiEvaluation z AiEvaluation na Record<number, AiEvaluation>
// I wyświetlać przy każdym pytaniu osobno
{isOpenEnded && disabled && questionEvaluations && (
  <AiEvaluationBadge 
    evaluation={questionEvaluations[qIndex]} 
    showFeedback={true}
    compact={true}
  />
)}
```

### Zmiana 5-6: Obliczanie mastery (Problem 1 i 2)

W hookach dodać funkcję obliczającą mastery dla zamkniętych ćwiczeń:

```tsx
const calculateClosedExerciseMastery = (
  exerciseType: string,
  exerciseData: any,
  answers: Record<number, any>
): number | null => {
  // Tylko dla zamkniętych ćwiczeń
  const closedTypes = ['multiple-choice', 'true-false', 'matching', 'fill-in-blanks', ...];
  if (!closedTypes.includes(exerciseType)) return null;
  
  let correct = 0;
  let total = 0;
  
  // Logika porównania zależy od typu ćwiczenia
  if (exerciseType === 'multiple-choice' && exerciseData.questions) {
    exerciseData.questions.forEach((q: any, idx: number) => {
      const correctOption = q.options?.find((o: any) => o.correct)?.text;
      if (answers[idx] === correctOption) correct++;
      total++;
    });
  }
  // ... analogicznie dla innych typów
  
  return total > 0 ? Math.round((correct / total) * 100) : null;
};
```

---

## Oczekiwane rezultaty

1. **Problem 5 (MC Audio shuffle):** Odpowiedzi A, B, C, D będą w tej samej kolejności w SharedWorksheet i LiveSession
2. **Problem 3 (Tooltip):** Tooltip pojawi się natychmiast po najechaniu na badge "ns (94%)" i zniknie po odsunięciu kursora
3. **Problem 4 (AI per-question):** Każde pytanie otwarte będzie miało osobną ocenę AI z feedbackiem
4. **Problem 1 i 2 (Mastery):** Pole `mastery` będzie wypełnione dla zamkniętych ćwiczeń (0-100%)

---

## Uwaga o pełnej integracji nano_skill_ratings

Aby eventy worksheet/homework miały pełną strukturę `nano_skill_ratings` jak eventy nauczyciela, potrzebna jest większa refaktoryzacja:
- Frontend musi przekazywać dane nano_skill z worksheet JSON do RPC
- Triggery SQL muszą obsługiwać nową strukturę
- To może być zrealizowane w osobnym zadaniu po podstawowych naprawkach
