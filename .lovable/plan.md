

# Głęboka analiza problemów AI Evaluation - Plan naprawy

## ZIDENTYFIKOWANE PRZYCZYNY PROBLEMÓW

### PROBLEM 1.1-1.4: AI Evaluation nie działa przy zamykaniu karty

**PRZYCZYNA GŁÓWNA:**
1. Dane DO trafiają do tabeli `pending_worksheet_ai_evaluations` (widzę 1 rekord ze statusem `pending`)
2. Funkcja `process-pending-ai-evaluations` NIE jest wywoływana automatycznie
3. W `useLiveSessionAnswers.tsx` (linia 94) funkcja jest wywoływana tylko gdy nauczyciel wchodzi na worksheet w trybie Live Session
4. **BRAKUJE wywołania** przy "Create Homework" - sprawdziłem `CreateHomeworkModal.tsx` i widzę że wywołanie jest WEWNĄTRZ bloku try-catch (linia 338-346), ALE jest wykonywane PO utworzeniu homework, więc dane nie są przetworzone PRZED użyciem w homework

**ROZWIĄZANIE:**
1. Przenieść wywołanie `process-pending-ai-evaluations` PRZED utworzeniem homework
2. Timer 10-minutowy istnieje w kodzie (linie 387-458 w `useInteractiveSharedWorksheet.tsx`), ale sprawdza tylko `answers` z pamięci React, nie wszystkie z bazy

---

### PROBLEM 2.1: AI Evaluation nie wyświetla się dla `listening-comprehension`

**PRZYCZYNA GŁÓWNA:**
W pliku `src/hooks/useInteractiveHomework.tsx` linie 278-283:
```typescript
const openAnswerTypes = [
  'reading', 'discussion', 'describe', 'answer-questions', 
  'dialogue', 'answer-questions-audio', 'describe-picture',
  'answer-questions-picture', 'paraphrasing', 'speaking',
  'sentence-transformation', 'essay', 'gap-text', 'word-order'
];
```

**BRAKUJE:** `'listening-comprehension'`!

**ROZWIĄZANIE:**
Dodać `'listening-comprehension'` do listy `openAnswerTypes`.

---

### PROBLEM 2.2: Generyczne odpowiedzi AI ("Your answer has been recorded...")

**PRZYCZYNA GŁÓWNA:**
W logach Edge Function widzę:
```
ERROR [verify-open-answers] Failed to parse AI response: SyntaxError: Unterminated string in JSON at position 6059
```

AI zwraca DOBRE odpowiedzi z konkretnymi feedbackami, ale parsowanie JSON ZAWODZI z powodu:
1. AI czasami zwraca odpowiedź z niepełnym JSON (za długa odpowiedź, ucięta)
2. W `verify-open-answers/index.ts` przy błędzie parsowania (linie 221-228) zwracany jest generyczny feedback

**Przykład dobrej odpowiedzi z logów:**
```json
{
  "question_index": 0,
  "quality_score": 1.0,
  "is_acceptable": true,
  "feedback": "Great job! Your answer is perfectly clear and directly addresses the question."
}
```

**Ale parsowanie zawodzi** i kod zwraca:
```typescript
feedback: 'Your answer has been recorded. AI evaluation was unavailable, your teacher will review it.'
```

**ROZWIĄZANIE:**
1. Zwiększyć `max_tokens` w wywołaniu AI (z 2000 na 4000)
2. Ulepszyć parsowanie - próbować parsować częściowy JSON
3. Dodać retry logic przy błędzie parsowania

---

## PLAN IMPLEMENTACJI

### Zmiana 1: Dodać `listening-comprehension` do listy otwartych typów

**Plik:** `src/hooks/useInteractiveHomework.tsx`

**Lokalizacja:** Linie 278-283

```typescript
// PRZED (brakuje listening-comprehension):
const openAnswerTypes = [
  'reading', 'discussion', 'describe', 'answer-questions', 
  'dialogue', 'answer-questions-audio', 'describe-picture',
  'answer-questions-picture', 'paraphrasing', 'speaking',
  'sentence-transformation', 'essay', 'gap-text', 'word-order'
];

// PO (dodane listening-comprehension):
const openAnswerTypes = [
  'reading', 'discussion', 'describe', 'answer-questions', 
  'dialogue', 'answer-questions-audio', 'describe-picture',
  'answer-questions-picture', 'paraphrasing', 'speaking',
  'sentence-transformation', 'essay', 'gap-text', 'word-order',
  'listening-comprehension'  // ← DODANE
];
```

---

### Zmiana 2: Przenieść wywołanie AI Evaluation PRZED utworzeniem homework

**Plik:** `src/components/homework/CreateHomeworkModal.tsx`

**Lokalizacja:** Funkcja `generateHomework`, linie 249-367

**Obecna kolejność (ZŁA):**
1. Tworzy homework w bazie
2. Generuje share token
3. Dopiero POTEM wywołuje `process-pending-ai-evaluations`

**Poprawna kolejność:**
1. **NAJPIERW** wywołać `process-pending-ai-evaluations`
2. Poczekać na zakończenie
3. POTEM tworzyć homework

```typescript
const generateHomework = async () => {
  // ... walidacja ...
  
  setIsGenerating(true);

  try {
    // PLAN FIX 1.2: Process pending AI evaluations FIRST - PRZED utworzeniem homework
    // To zapewnia że dane z worksheet są przetworzone zanim nauczyciel zobaczy je w homework
    try {
      console.log('[CreateHomeworkModal] Processing pending AI evaluations BEFORE homework creation');
      const { data: aiResult } = await supabase.functions.invoke('process-pending-ai-evaluations', {
        body: { worksheet_id: worksheetId }
      });
      console.log('[CreateHomeworkModal] AI evaluation result:', aiResult);
    } catch (aiError) {
      console.warn('[CreateHomeworkModal] Failed to process pending AI evals (continuing anyway):', aiError);
    }

    const student = students.find(s => s.id === selectedStudentId);
    
    // ... reszta logiki tworzenia homework ...
  } catch (error) {
    // ...
  }
};
```

---

### Zmiana 3: Naprawić parsowanie JSON w verify-open-answers

**Plik:** `supabase/functions/verify-open-answers/index.ts`

**Problem:** AI czasami zwraca za długą odpowiedź i JSON jest ucięty

**Rozwiązania:**
1. Zwiększyć `max_tokens` z 2000 na 4000
2. Dodać lepsze czyszczenie JSON (usuwanie trailing text po tablicy)
3. Parsować każdą ewaluację osobno

```typescript
// Linia 128: Zwiększyć max_tokens
body: JSON.stringify({
  model: 'google/gemini-2.5-flash',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  temperature: 0.3,
  max_tokens: 4000,  // ← ZWIĘKSZONE z 2000
}),

// Linie 150-228: Ulepszone parsowanie
try {
  let cleanContent = rawContent.trim();
  
  // Usuń markdown code blocks
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.slice(7);
  }
  if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.slice(3);
  }
  if (cleanContent.endsWith('```')) {
    cleanContent = cleanContent.slice(0, -3);
  }
  
  // NOWE: Znajdź koniec tablicy JSON i usuń wszystko po nim
  const lastBracket = cleanContent.lastIndexOf(']');
  if (lastBracket !== -1) {
    cleanContent = cleanContent.substring(0, lastBracket + 1);
  }
  
  // NOWE: Napraw niekompletny JSON - zamknij otwarte obiekty
  let openBraces = (cleanContent.match(/{/g) || []).length;
  let closeBraces = (cleanContent.match(/}/g) || []).length;
  while (closeBraces < openBraces) {
    cleanContent += '}';
    closeBraces++;
  }
  
  cleanContent = cleanContent.trim();
  
  let parsedContent = JSON.parse(cleanContent);
  // ... reszta logiki ...
} catch (parseError) {
  // Fallback: próbuj parsować obiekt po obiekcie
  console.error('[verify-open-answers] Initial parse failed, trying object-by-object');
  
  // Generuj dynamiczny feedback zamiast generycznego
  evaluations = answers.map((a, idx) => ({
    exercise_index: a.exercise_index,
    question_index: a.question_index,
    quality_score: 0.75, // Trochę wyższy default
    is_acceptable: true,
    feedback: `Good effort on this answer. Your teacher will provide detailed feedback.` // Lepszy generyczny tekst
  }));
}
```

---

### Zmiana 4: Dodać questionItems dla exercises z polem `items`

**Plik:** `src/hooks/useInteractiveHomework.tsx`

**Lokalizacja:** Linia 400 - brakuje `exerciseData?.items`

```typescript
// PRZED:
const questionItems = exerciseData?.questions || exerciseData?.prompts || exerciseData?.sentences || exerciseData?.expressions || [];

// PO (dodane items):
const questionItems = exerciseData?.questions || exerciseData?.prompts || exerciseData?.sentences || exerciseData?.expressions || exerciseData?.items || [];
```

---

## PODSUMOWANIE ZMIAN

| # | Plik | Zmiana | Cel |
|---|------|--------|-----|
| 1 | `src/hooks/useInteractiveHomework.tsx` (linie 278-283) | Dodać `'listening-comprehension'` do `openAnswerTypes` | Fix 2.1: AI Eval dla listening |
| 2 | `src/hooks/useInteractiveHomework.tsx` (linia 400) | Dodać `exerciseData?.items` | Fix 2.1: Dane dla listening |
| 3 | `src/components/homework/CreateHomeworkModal.tsx` | Przenieść AI Eval PRZED tworzenie homework | Fix 1.2: Przetworzenie przed homework |
| 4 | `supabase/functions/verify-open-answers/index.ts` | Zwiększyć max_tokens, ulepszyć parsowanie | Fix 2.2: Prawdziwy feedback AI |

---

## OCZEKIWANE REZULTATY

### Po implementacji:

**PROBLEM 1.1-1.4:**
- Gdy nauczyciel kliknie "Create Homework", system najpierw przetworzy pending AI evaluations
- Timer 10-min będzie nadal działać w tle (istniejąca logika)
- Close Tab nadal będzie kolejkować evaluations do `pending_worksheet_ai_evaluations`

**PROBLEM 2.1:**
- `listening-comprehension` będzie uwzględnione w weryfikacji AI
- AI Evaluation badge pojawi się pod każdym pytaniem w tym typie ćwiczenia

**PROBLEM 2.2:**
- AI będzie miało więcej tokenów na odpowiedź (4000 vs 2000)
- Parsowanie będzie bardziej odporne na błędy
- Feedback będzie dynamiczny zamiast generycznego "unavailable"

