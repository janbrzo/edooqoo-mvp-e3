

# Plan naprawy 6 problemów z logowaniem i wyświetlaniem AI Evaluation

## PODSUMOWANIE ANALIZY

### PROBLEM 1: Logi worksheet zawierają puste odpowiedzi (hasValue: false, mastery: 0)

**Przyczyna główna w `buildItemEvaluations()` (src/utils/masteryCalculator.ts linie 300-326):**

```typescript
items.forEach((item: any, idx: number) => {
  const nanoSkill = safeGetNanoSkill(item);
  if (!nanoSkill) return;  // ✅ OK - pomija pytania bez nano_skill
  
  // ❌ PROBLEM: Nie sprawdza czy student udzielił odpowiedzi!
  // Dodaje WSZYSTKIE pytania z nano_skill, nawet bez odpowiedzi
  
  itemEvaluations.push({
    question_index: idx,
    name: nanoSkill.name,
    reason: nanoSkill.reason,
    mastery: itemMastery ?? 0,  // Puste = 0, ale element i tak jest dodany
    hasValue: itemMastery !== null
  });
});
```

**Rozwiązanie:** Dodać warunek - jeśli student nie udzielił odpowiedzi, pomijamy ten element:

```typescript
items.forEach((item: any, idx: number) => {
  const nanoSkill = safeGetNanoSkill(item);
  if (!nanoSkill) return;
  
  const studentAnswer = answers[idx];
  
  // NOWY WARUNEK: Pomijaj pytania bez odpowiedzi studenta
  const hasStudentAnswer = studentAnswer !== undefined && 
                           studentAnswer !== null && 
                           studentAnswer !== '';
  if (!hasStudentAnswer) return;
  
  // ... reszta kodu
});
```

---

### PROBLEM 1.1: AI Evaluation nie jest wykonywana przy zamykaniu karty worksheet

**Przyczyna w `useInteractiveSharedWorksheet.tsx` linie 354-368:**

```typescript
// Trigger AI verification for open-ended exercises
if (answersToVerify.length > 0) {
  fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-open-answers`, {
    // ...
    keepalive: true
  }).catch(() => {});  // ❌ Wyniki AI są IGNOROWANE - nigdy nie trafiają do bazy!
}
```

**Problem:**
1. `beforeunload` używa asynchronicznego `fetch` z `keepalive`, ale przeglądarka może zakończyć proces przed odpowiedzią
2. Nawet jeśli odpowiedź przyjdzie, nie ma kodu do jej przetworzenia i zapisania do bazy
3. W przeciwieństwie do Homework (`submitHomework()`), Worksheet NIE aktualizuje `item_evaluations` po AI

**Rozwiązanie:** 
Worksheet przy zamykaniu karty nie powinien próbować robić pełnej AI evaluation (jest zbyt wolna). Zamiast tego:
- Usunąć kod `verify-open-answers` z `beforeunload` (nie działa i daje fałszywe nadzieje)
- AI Evaluation dla worksheet powinno być wyzwalane przez nauczyciela (przycisk "Mark Done") - tak jak jest teraz w `useInteractiveSharedWorksheet`

---

### PROBLEM 2B: Błędne name/reason po Submit Homework dla answer-questions

**Przyczyna w `useInteractiveHomework.tsx` linie 401-412:**

```typescript
const itemEvals: ItemEvaluation[] = evalData.question_evaluations.map((qEval: any) => {
  const qItem = questionItems[qEval.question_index];  // ❌ Używa GLOBALNEGO question_index z AI!
  const nanoSkill = qItem ? safeGetNanoSkill(qItem) : null;
  
  return {
    question_index: qEval.question_index,
    name: nanoSkill?.name || `question_${qEval.question_index}`,  // ❌ Fallback gdy nie znajdzie
    reason: nanoSkill?.reason || '',
    // ...
  };
});
```

**Problem:**
AI zwraca `question_index: 10, 11, 12...` dla zadania `exercise_index: 3`, ale kod szuka `questionItems[10]` zamiast `questionItems[0, 1, 2...]`.

**Dowód z bazy danych:**
```json
"nano_skill_ratings": [
  { "name": "question_10", "question_index": 10 },  // ❌ Błędny index!
  { "name": "question_11", "question_index": 11 }
]
```

Ale dla Dialogue (które działa poprawnie), index zaczyna się od 0.

**Przyczyna główna:**
W `submitHomework()` budujemy `answersToVerify` z GLOBALNYM indeksem z pętli `Object.entries()`:

```typescript
Object.entries(studentAnswersForExercise).forEach(([qIdxStr, studentAnswer]) => {
  const qIdx = parseInt(qIdxStr);  // To jest string key z Record, np. "10", "11"...
  
  answersToVerify.push({
    question_index: qIdx,  // ❌ Wysyłamy do AI globalny index!
    // ...
  });
});
```

**Rozwiązanie:**
1. W funkcji budującej `itemEvals` po AI, użyć ORYGINALNYCH nano_skill z ćwiczenia, a nie szukać po indeksie z AI
2. Zmienić logikę mapowania - zapamiętać powiązanie między pytaniami ćwiczenia a wynikami AI

---

### PROBLEM 3.1: AI Evaluation nie wyświetla się dla Dialogue i innych zadań

**Analiza przekazywania aiEvaluation w HomeworkExerciseRenderer.tsx:**

| Typ ćwiczenia | Czy przekazuje `aiEvaluations`? |
|---------------|--------------------------------|
| reading | ✅ Tak (linia 127) |
| dialogue | ✅ Tak (linia 195) |
| discussion | ❌ NIE (linie 200-224) |
| paraphrasing | ✅ Tak (linia 282) |
| listening-comprehension | ✅ Tak (linia 414) |
| answer-questions-audio | ✅ Tak (linia 430) |
| describe-picture | ✅ Tak (linia 501) |
| answer-questions | ✅ Tak (linia 517) |

**Przyczyna dla Dialogue:**
Mimo że `aiEvaluations` jest przekazywane, komponent `ExerciseDialogue` wyświetla badge tylko gdy `disabled === true`:

```tsx
{aiEvaluations?.[eIndex] && disabled && (  // ❌ Wymaga disabled!
  <AiEvaluationBadge evaluation={aiEvaluations[eIndex]} showFeedback={true} />
)}
```

Sprawdźmy czy `disabled` jest poprawnie przekazywane w HomeworkPage...

**Dodatkowy problem - discussion:**
Ćwiczenie `discussion` jest renderowane inline w `HomeworkExerciseRenderer` (linie 200-224) bez przekazania `aiEvaluations` - brakuje badge'a!

---

### PROBLEM 3.2: AI Evaluation znika po odświeżeniu homework

**Przyczyna - funkcja RPC nie zwraca ai_evaluation:**

```sql
-- OBECNA definicja (BŁĘDNA):
RETURNS TABLE(
  id uuid, 
  exercise_index integer, 
  exercise_type text, 
  answers jsonb, 
  is_submitted boolean,
  started_at timestamp,
  last_saved_at timestamp, 
  submitted_at timestamp
)  -- ❌ BRAK: ai_evaluation, item_evaluations, mastery, time_spent_ms
```

Tabela `homework_student_answers` MA te kolumny, ale funkcja RPC ich nie zwraca!

**Rozwiązanie:**
Zaktualizować funkcje RPC:
- `get_student_homework_answers` - dodać `ai_evaluation`, `item_evaluations`, `mastery`
- `get_worksheet_student_answers` - dodać `item_evaluations`, `mastery`

---

## PLAN IMPLEMENTACJI

### Zmiana 1: Naprawić buildItemEvaluations - filtrować puste odpowiedzi

**Plik: `src/utils/masteryCalculator.ts`**

```typescript
export const buildItemEvaluations = (
  exerciseData: any,
  answers: Record<string | number, any>,
  exerciseType: string,
  aiEvaluations?: Record<number, { quality_score?: number }> | null
): ItemEvaluation[] | null => {
  if (!exerciseData) return null;
  
  const itemEvaluations: ItemEvaluation[] = [];
  const items = getExerciseItems(exerciseData);
  
  items.forEach((item: any, idx: number) => {
    const nanoSkill = safeGetNanoSkill(item);
    if (!nanoSkill) return;
    
    const studentAnswer = answers[idx];
    
    // NOWY WARUNEK: Pomijaj pytania bez odpowiedzi studenta
    const hasStudentAnswer = studentAnswer !== undefined && 
                             studentAnswer !== null && 
                             String(studentAnswer).trim() !== '';
    if (!hasStudentAnswer) return;  // ✅ Nie loguj pustych odpowiedzi
    
    let itemMastery: number | null = null;
    
    // ... reszta bez zmian
    
    itemEvaluations.push({
      question_index: idx,
      name: nanoSkill.name,
      reason: nanoSkill.reason,
      mastery: itemMastery ?? 0,
      hasValue: itemMastery !== null
    });
  });
  
  return itemEvaluations.length > 0 ? itemEvaluations : null;
};
```

---

### Zmiana 2: Naprawić mapowanie nano_skill po AI Evaluation w homework

**Plik: `src/hooks/useInteractiveHomework.tsx`**

Problem: `question_index` z AI nie odpowiada indeksom w `questionItems`.

Rozwiązanie: Przed wysłaniem do AI, zapisać mapowanie, a po otrzymaniu wyników użyć ORYGINALNYCH nano_skill:

```typescript
// W submitHomework(), linie ~394-428:

// Build item_evaluations with AI mastery scores
const exerciseData = exercises[exIdx];
const questionItems = exerciseData?.questions || exerciseData?.prompts || 
                     exerciseData?.sentences || exerciseData?.expressions || [];

// Znajdź WSZYSTKIE pytania które mają nano_skill
const itemsWithNanoSkill = questionItems
  .map((item: any, idx: number) => ({ item, idx, nanoSkill: safeGetNanoSkill(item) }))
  .filter((x: any) => x.nanoSkill !== null);

// Mapuj wyniki AI do oryginalnych nano_skill
// AI zwraca question_index który MOŻE być różny od idx w questionItems
const itemEvals: ItemEvaluation[] = evalData.question_evaluations.map((qEval: any, aiIdx: number) => {
  // Szukaj dopasowania - najpierw po question_index, potem po pozycji
  let matchedItem = itemsWithNanoSkill.find((x: any) => x.idx === qEval.question_index);
  
  // Fallback: jeśli nie znaleziono, użyj pozycji w tablicy AI
  if (!matchedItem && aiIdx < itemsWithNanoSkill.length) {
    matchedItem = itemsWithNanoSkill[aiIdx];
  }
  
  return {
    question_index: qEval.question_index,
    name: matchedItem?.nanoSkill?.name || `question_${qEval.question_index}`,
    reason: matchedItem?.nanoSkill?.reason || '',
    mastery: Math.round(qEval.quality_score * 100),
    hasValue: true
  };
});
```

---

### Zmiana 3: Dodać AI Evaluation do discussion w HomeworkExerciseRenderer

**Plik: `src/components/homework/HomeworkExerciseRenderer.tsx`**

W sekcji discussion (linie 200-224) dodać badge pod każdym inputem:

```tsx
{/* Discussion questions */}
{exercise.type === 'discussion' && exercise.questions && (
  <div className="space-y-2">
    <h3 className="font-medium text-gray-700 mb-2">Discussion Questions:</h3>
    {exercise.questions.map((question: string, qIndex: number) => {
      const studentAnswer = studentAnswers[qIndex] || '';
      return (
        <div key={qIndex} className="p-2 border rounded-lg bg-white">
          <p className="leading-snug mb-2">
            {qIndex + 1}. {safeGetText(question)}
          </p>
          {isInteractive && (
            <>
              <input
                type="text"
                value={studentAnswer}
                onChange={(e) => onAnswerChange(qIndex, e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full h-10 border rounded px-3"
                disabled={disabled}
              />
              {/* DODANE: AI Evaluation badge */}
              {aiEvaluation?.[qIndex] && disabled && (
                <AiEvaluationBadge 
                  evaluation={aiEvaluation[qIndex]} 
                  showFeedback={true}
                />
              )}
            </>
          )}
        </div>
      );
    })}
  </div>
)}
```

---

### Zmiana 4: Zaktualizować funkcje RPC aby zwracały ai_evaluation

**Nowa migracja SQL:**

```sql
-- Update get_student_homework_answers to return ai_evaluation
CREATE OR REPLACE FUNCTION public.get_student_homework_answers(
  p_homework_id UUID,
  p_student_email TEXT
)
RETURNS TABLE(
  id UUID,
  exercise_index INTEGER,
  exercise_type TEXT,
  answers JSONB,
  is_submitted BOOLEAN,
  started_at TIMESTAMPTZ,
  last_saved_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  ai_evaluation JSONB,      -- DODANE
  item_evaluations JSONB,   -- DODANE
  mastery INTEGER           -- DODANE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hsa.id,
    hsa.exercise_index,
    hsa.exercise_type,
    hsa.answers,
    hsa.is_submitted,
    hsa.started_at,
    hsa.last_saved_at,
    hsa.submitted_at,
    hsa.ai_evaluation,
    hsa.item_evaluations,
    hsa.mastery
  FROM homework_student_answers hsa
  JOIN homework_assignments ha ON hsa.homework_id = ha.id
  JOIN students s ON ha.student_id = s.id
  WHERE hsa.homework_id = p_homework_id
    AND lower(hsa.student_email) = lower(p_student_email)
  ORDER BY hsa.exercise_index;
END;
$$;

-- Similarly for get_worksheet_student_answers
CREATE OR REPLACE FUNCTION public.get_worksheet_student_answers(
  p_worksheet_id UUID,
  p_student_email TEXT
)
RETURNS TABLE(
  id UUID,
  exercise_index INTEGER,
  exercise_type TEXT,
  answers JSONB,
  is_completed BOOLEAN,
  started_at TIMESTAMPTZ,
  last_saved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  item_evaluations JSONB,   -- DODANE
  mastery INTEGER           -- DODANE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wsa.id,
    wsa.exercise_index,
    wsa.exercise_type,
    wsa.answers,
    wsa.is_completed,
    wsa.started_at,
    wsa.last_saved_at,
    wsa.completed_at,
    wsa.item_evaluations,
    wsa.mastery
  FROM worksheet_student_answers wsa
  WHERE wsa.worksheet_id = p_worksheet_id
    AND lower(wsa.student_email) = lower(p_student_email)
  ORDER BY wsa.exercise_index;
END;
$$;
```

---

### Zmiana 5: Usunąć niedziałający kod AI verification z beforeunload

**Plik: `src/hooks/useInteractiveSharedWorksheet.tsx`**

Usunąć linie 354-368 (wywołanie verify-open-answers w beforeunload) - nie działa i wprowadza w błąd:

```typescript
// USUNĄĆ:
// Trigger AI verification for open-ended exercises
if (answersToVerify.length > 0) {
  fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-open-answers`, {
    // ...
  }).catch(() => {});
}
```

---

## LISTA PLIKÓW DO EDYCJI

| # | Plik | Zmiana | Priorytet |
|---|------|--------|-----------|
| 1 | `src/utils/masteryCalculator.ts` | Filtrować puste odpowiedzi w `buildItemEvaluations()` | **KRYTYCZNY** |
| 2 | `src/hooks/useInteractiveHomework.tsx` | Naprawić mapowanie nano_skill po AI | **KRYTYCZNY** |
| 3 | `src/components/homework/HomeworkExerciseRenderer.tsx` | Dodać AI badge do discussion | WYSOKI |
| 4 | **Nowa migracja SQL** | Zaktualizować RPC o ai_evaluation | **KRYTYCZNY** |
| 5 | `src/hooks/useInteractiveSharedWorksheet.tsx` | Usunąć niedziałający kod AI w beforeunload | ŚREDNI |
| 6 | `docs/TECHNICAL_DOCUMENTATION.md` | Zaktualizować dokumentację | NISKI |

---

## OCZEKIWANE REZULTATY

### Po implementacji:

**PROBLEM 1 - Logi worksheet:**
- Tylko pytania z odpowiedziami studenta będą w `nano_skill_ratings`
- Puste pytania nie będą logowane

**PROBLEM 2B - Homework name/reason:**
- Po Submit Homework, `nano_skill_ratings` będzie zawierał poprawne nazwy i opisy z oryginalnych nano_skill

**PROBLEM 3.1 - AI Evaluation wyświetlanie:**
- Discussion (i wszystkie inne typy otwarte) będą wyświetlać badge pod każdym pytaniem

**PROBLEM 3.2 - AI Evaluation po odświeżeniu:**
- Dane AI evaluation będą persystowane i ładowane z bazy po odświeżeniu

---

## SEKCJA TECHNICZNA

### Weryfikacja po wdrożeniu:

```sql
-- Test 1: Sprawdź czy RPC zwraca ai_evaluation
SELECT id, ai_evaluation FROM get_student_homework_answers(
  'homework-uuid'::uuid, 
  'student@email.com'
);

-- Test 2: Sprawdź czy logi nie zawierają pustych odpowiedzi
SELECT event_payload->'nano_skill_ratings'
FROM student_events
WHERE event_source = 'worksheet_answer_saved'
ORDER BY created_at DESC
LIMIT 5;
```

### Kompatybilność wsteczna

- Zmiana w `buildItemEvaluations` nie psuje istniejących logów - po prostu przyszłe logi będą bardziej dokładne
- Nowe kolumny w RPC są addytywne - stary kod frontendowy będzie je ignorował

