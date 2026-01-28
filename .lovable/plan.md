
# Plan naprawy 5 problemów

## Podsumowanie zidentyfikowanych przyczyn

### PROBLEM 1 & 2: Brak eventów worksheet_answer_saved i homework_answer_submitted

**Przyczyna znaleziona w logach PostgreSQL:**
```
Failed to log worksheet answer event: there is no unique or exclusion constraint matching the ON CONFLICT specification
```

Problem jest w triggerach SQL. Ostatnia migracja dodała klauzulę `ON CONFLICT`:
```sql
ON CONFLICT (student_id, source_id, event_type, (event_payload->>'exercise_index'))
```

Ale tabela `student_events` **nie ma takiego UNIQUE INDEX** dla tej kombinacji kolumn. SQL wymaga istniejącego unikalnego constraintu aby ON CONFLICT działał.

**Rozwiązanie:**
1. Utworzyć brakujący UNIQUE INDEX na tabeli `student_events`:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_events_upsert 
ON public.student_events (student_id, source_id, event_type, (event_payload->>'exercise_index'))
WHERE event_type IN ('worksheet_answer_saved', 'homework_answer_submitted');
```

LUB alternatywnie:
2. Zamienić `ON CONFLICT` na podejście z `DELETE + INSERT` w triggerach.

**Rekomenduję podejście 2** (DELETE + INSERT) ponieważ:
- Jest bardziej uniwersalne
- Nie wymaga tworzenia nowych indeksów na JSONB
- Jest mniej podatne na błędy

---

### PROBLEM 3: NanoSkill tooltip w lewym górnym rogu

**Przyczyna:**
W `NanoSkillBadge.tsx` dodano `style={{ position: 'fixed' }}` do `TooltipPrimitive.Content`. Ustawienie `position: fixed` **bez jawnych współrzędnych** (top, left) powoduje że element ląduje w lewym górnym rogu (0,0).

Radix Tooltip automatycznie oblicza pozycję używając Floating UI (Popper.js), ale `position: fixed` nadpisuje te obliczenia.

**Rozwiązanie:**
1. Usunąć `style={{ position: 'fixed', zIndex: 10000 }}` z TooltipPrimitive.Content
2. Polegać na domyślnym pozycjonowaniu Radix (które używa CSS transform)
3. Zachować wysokie `z-index` w className
4. Dla natychmiastowego znikania: `delayDuration={0}` już jest ustawiony, ale trzeba też dodać `closeDelay={0}`

---

### PROBLEM 4.1: AI evaluation nie wyświetla się na homework

**Analiza:**
W `useInteractiveHomework.tsx` linia 278-289:
- AI evaluation jest pobierane: `verifyResult?.evaluations`
- Następnie jest zapisywane do bazy: `update({ ai_evaluation: evaluation })`

**Ale problem polega na tym, że:**
1. Po zapisaniu `ai_evaluation` do bazy, frontend nie odświeża danych
2. Komponent `HomeworkExerciseRenderer` nie pobiera ani nie wyświetla `ai_evaluation`
3. Brakuje integracji z `AiEvaluationBadge` w widoku homework

**Rozwiązanie:**
1. Dodać pobieranie `ai_evaluation` z bazy w `loadAnswers()` w `useInteractiveHomework.tsx`
2. Przekazać evaluation do `HomeworkExerciseRenderer`
3. Wyświetlić `AiEvaluationBadge` dla zadań otwartych

---

### PROBLEM 4.2: Prompt w verify-open-answers

**Analiza promptu:**
Prompt zawiera tylko:
```
Question: ${a.question_text}
Student's answer: ${a.student_answer}
Suggested answer: ${a.suggested_answer}
```

Ale `suggested_answer` nie jest przekazywane poprawnie z `useInteractiveHomework.tsx` linia 256-264:
```tsx
.map((ans: any) => {
  return {
    question_index: ans.exercise_index,
    question_text: `Exercise ${ans.exercise_index + 1}`,  // <-- Brak prawdziwego question_text
    student_answer: answerValues.join(', '),
    exercise_type: ans.exercise_type
    // <-- Brak suggested_answer!
  };
})
```

**Rozwiązanie:**
1. Pobierać dane ćwiczenia (pytania, poprawne odpowiedzi) przed wysłaniem do AI
2. Przekazać `suggested_answer` dla każdego pytania
3. Przekazać pełny `question_text` zamiast "Exercise X"

---

### PROBLEM 5: Multiple Choice Audio w Live Session

**Przyczyna:**
W `ExerciseMultipleChoiceAudio.tsx` linia 174:
```tsx
const isLiveSelected = liveSessionAnswer?.[qIndex] === oIndex;
```

Porównuje `liveSessionAnswer` z **indeksem opcji** (`oIndex`).

Ale w `ExerciseMultipleChoice.tsx` linia 139:
```tsx
const isLiveSelected = liveAnswer === option.text;
```

Porównuje z **tekstem opcji** (`option.text`).

Problem: student zapisuje odpowiedź jako **tekst opcji** (np. "Paris"), ale `ExerciseMultipleChoiceAudio` szuka **indeksu** (np. 0, 1, 2).

**Rozwiązanie:**
Zmienić porównanie w `ExerciseMultipleChoiceAudio.tsx` na `option.text`:
```tsx
const isLiveSelected = liveSessionAnswer?.[qIndex] === option.text;
```

---

## Pliki do edycji

| Problem | Plik | Zmiana |
|---------|------|--------|
| 1, 2 | SQL Migration | Naprawić triggery - usunąć ON CONFLICT i użyć DELETE+INSERT |
| 3 | `NanoSkillBadge.tsx` | Usunąć `position: fixed`, dodać `closeDelay={0}` |
| 4.1 | `useInteractiveHomework.tsx` | Pobierać i zwracać `ai_evaluation` |
| 4.1 | `HomeworkExerciseRenderer.tsx` | Wyświetlić `AiEvaluationBadge` |
| 4.2 | `useInteractiveHomework.tsx` | Przekazać pełne dane pytań do verify-open-answers |
| 5 | `ExerciseMultipleChoiceAudio.tsx` | Zmienić `=== oIndex` na `=== option.text` |

---

## Szczegóły implementacji

### SQL Migration - Naprawka triggerów (Problem 1 & 2)

```sql
-- Naprawka log_worksheet_answer_event - zamień ON CONFLICT na DELETE+INSERT
CREATE OR REPLACE FUNCTION public.log_worksheet_answer_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
BEGIN
  -- Get student_id and teacher_id
  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.student_email = NEW.student_email
  LIMIT 1;

  SELECT w.user_id INTO v_teacher_id
  FROM public.worksheets w
  WHERE w.id = NEW.worksheet_id;

  IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
    -- DELETE existing event for this exercise (UPSERT pattern without ON CONFLICT)
    DELETE FROM public.student_events
    WHERE student_id = v_student_id
      AND source_id = NEW.worksheet_id
      AND event_type = 'worksheet_answer_saved'
      AND (event_payload->>'exercise_index')::INTEGER = NEW.exercise_index;
    
    -- INSERT new event
    INSERT INTO public.student_events (
      student_id, teacher_id, event_type, event_source, source_id, event_payload
    ) VALUES (
      v_student_id, v_teacher_id,
      'worksheet_answer_saved', 'worksheet', NEW.worksheet_id,
      jsonb_build_object(
        'answer_id', NEW.id,
        'exercise_index', NEW.exercise_index,
        'exercise_type', NEW.exercise_type,
        'answers', NEW.answers,
        'mastery', NEW.mastery,
        'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0) / 1000.0, 1)
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log worksheet answer event: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Analogiczna naprawka dla log_homework_answer_event
```

### NanoSkillBadge.tsx - Naprawka tooltipa (Problem 3)

```tsx
<TooltipPrimitive.Provider delayDuration={0}>
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
        className="z-[9999] w-72 p-3 bg-white border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95"
        // USUNIĘTO: style={{ position: 'fixed', zIndex: 10000 }}
      >
        ...
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  </TooltipPrimitive.Root>
</TooltipPrimitive.Provider>
```

### ExerciseMultipleChoiceAudio.tsx - Live Session fix (Problem 5)

```tsx
// Linia 174 - PRZED:
const isLiveSelected = liveSessionAnswer?.[qIndex] === oIndex;

// PO:
const isLiveSelected = liveSessionAnswer?.[qIndex] === option.text;
```

---

## Co zobaczysz po implementacji

1. **Eventy w student_events:** Worksheet i homework odpowiedzi będą poprawnie logowane z polem `mastery`

2. **NanoSkill tooltip:** Pojawi się bezpośrednio przy badge "ns (94%)" i zniknie natychmiast po odsunięciu kursora

3. **AI Evaluation na homework:** Po submit pojawi się badge z wynikiem AI i feedback dla zadań otwartych

4. **Live Session Multiple Choice Audio:** Odpowiedzi studenta będą widoczne jako niebieskie zaznaczenia (tak jak w zwykłym Multiple Choice)

---

## Sekcja techniczna - szczegóły zmian

### Kolejność implementacji

1. **Najpierw SQL Migration** - naprawia logowanie eventów
2. **Potem NanoSkillBadge.tsx** - naprawia tooltip
3. **Potem ExerciseMultipleChoiceAudio.tsx** - naprawia Live Session
4. **Na koniec useInteractiveHomework.tsx + HomeworkExerciseRenderer.tsx** - naprawia AI evaluation display

### Zmiany w useInteractiveHomework.tsx dla problemu 4

```tsx
// W loadAnswers() - dodać pobieranie ai_evaluation
const loadedAnswers: Record<number, ExerciseAnswers> = {};
const loadedEvaluations: Record<number, any> = {};

data.forEach((answer: any) => {
  loadedAnswers[answer.exercise_index] = answer.answers;
  if (answer.ai_evaluation) {
    loadedEvaluations[answer.exercise_index] = answer.ai_evaluation;
  }
});

setAnswers(loadedAnswers);
setAiEvaluations(loadedEvaluations);  // Nowy state
```

```tsx
// W submitHomework() - przekazać pełne dane pytań
// Pobierz exercises z homework aby mieć dostęp do question_text i suggested_answer
```

### Nowy state w hook

```tsx
const [aiEvaluations, setAiEvaluations] = useState<Record<number, any>>({});

// Zwrócić w return
return {
  ...
  aiEvaluations,
};
```
