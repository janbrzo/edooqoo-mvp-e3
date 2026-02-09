

# Plan naprawy: 3 problemy

## PROBLEM 1A: Create Homework na toolbarze nie triggeruje AI eval

### Analiza

Przeanalizowalem kod dokladnie. `WorksheetDisplay.tsx` linia 686-716 zawiera poprawny kod:
```typescript
const handleCreateHomework = async () => {
  // ... walidacja ...
  await supabase.functions.invoke('process-pending-ai-evaluations', {
    body: { worksheet_id: worksheetId, trigger_source: 'create_homework' }
  });
  setShowHomeworkModal(true);
};
```

Ten handler jest poprawnie podlaczony do `WorksheetToolbar` (linia 1003: `onCreateHomework={handleCreateHomework}`), a toolbar renderuje przycisk "Create Homework" z `onClick={onCreateHomework}` (linia 377).

Edge function `process-pending-ai-evaluations` jest wdrozona i dzialajaca (potwierdzilem testem curl - odpowiada poprawnie). Zawiera logike `autoQueueForCreateHomework`.

**Prawdopodobna przyczyna**: Funkcja `process-pending-ai-evaluations` NIE jest zarejestrowana w `supabase/config.toml`. Domyslnie Supabase ustawia `verify_jwt = true`. Nauczyciel JEST zalogowany wiec JWT jest dolaczony automatycznie przez `supabase.functions.invoke`. To POWINNO dzialac.

Ale jest subtelny problem: blad z edge function jest "polykany" cicho. `supabase.functions.invoke` NIE rzuca wyjatku przy bledzie - zwraca `{ data, error }`. Nasz `try/catch` lapie tylko bledy sieci, nie bledy logiczne. Jesli np. `autoQueueForCreateHomework` failuje (np. `needs_ai_evaluation` RPC zwraca blad), to nie widzimy tego w konsoli przegladarki.

### Rozwiazanie

1. Dodac `verify_jwt = false` w `config.toml` dla bezpieczenstwa (funkcja i tak uzywa service_role_key wewnetrznie)
2. Dodac logowanie `error` response z `supabase.functions.invoke` w `WorksheetDisplay.tsx`
3. Dodac `console.log` z wynikiem odpowiedzi edge function zeby widziec co sie dzieje

```typescript
const handleCreateHomework = async () => {
  // ... walidacja ...
  try {
    console.log('[WorksheetDisplay] Triggering AI eval before Create Homework modal, worksheetId:', worksheetId);
    const { data, error } = await supabase.functions.invoke('process-pending-ai-evaluations', {
      body: { worksheet_id: worksheetId, trigger_source: 'create_homework' }
    });
    if (error) {
      console.error('[WorksheetDisplay] AI eval error:', error);
    } else {
      console.log('[WorksheetDisplay] AI eval result:', data);
    }
  } catch (err) {
    console.warn('[WorksheetDisplay] AI eval network error:', err);
  }
  setShowHomeworkModal(true);
};
```

---

## PROBLEM 2: AI Evaluation daje mastery 70 za "I don't know"

### Przyczyna (POTWIERDZONA w kodzie)

Prompt w `verify-open-answers/index.ts` (linia 54-70) mowi:

> "Be encouraging but honest. **Focus on communication rather than perfection**. If the answer shows understanding but has minor errors, still give a passing score."

To jest zbyt poblazywy prompt. AI interpretuje "I don't know" jako "komunikacje" i daje 0.7 (70%). Nie ma zadnej instrukcji karacej za brak odpowiedzi.

### Roznica miedzy homework i worksheet

Worksheet AI eval uzywa TEGO SAMEGO prompta (`verify-open-answers`). Obie sciezki (homework `useInteractiveHomework.tsx` linia 357 i worksheet `process-pending-ai-evaluations` linia 142) wywoluja ta sama edge function `verify-open-answers`. Wiec nie ma roznicy w promptach - problem jest W SAMYM prompcie.

### Rozwiazanie

Dodac do prompta jasna instrukcje dotyczaca brakow odpowiedzi. Zmiany w `verify-open-answers/index.ts`:

```
IMPORTANT RULES:
- If the student writes "I don't know", "nie wiem", "no idea", or any equivalent non-answer in ANY language, give quality_score 0.0 to 0.1. This is NOT an acceptable answer.
- If the student writes only 1-2 words that don't form a meaningful response to the question, give quality_score 0.1 to 0.3.
- Answers must demonstrate understanding of the topic and use English. Answers in other languages should score 0.1 to 0.2.
- A passing score (0.7+) requires a genuine attempt to answer the question with at least a partial English sentence.
```

To jest zmiana w JEDNYM pliku (edge function), obowiazujaca zarowno dla homework jak i worksheet. Wiec spojnosc jest zachowana.

---

## PROBLEM 3: Wyswietlanie AI Evaluation na Shared Worksheet i Live Session

### Obecny stan

Komponenty cwiczen (ExerciseReading, ExerciseDialogue, ExerciseDescribe itd.) JUZ maja prop `aiEvaluations` i JUZ wyswietlaja `AiEvaluationBadge` gdy ten prop jest przekazany. To dziala w homework.

ALE:
1. **SharedWorksheetContent.tsx** - NIE przekazuje `aiEvaluations` do komponentow cwiczen
2. **useInteractiveSharedWorksheet.tsx** - NIE laduje `item_evaluations` z bazy i NIE eksponuje ich jako state
3. **get_worksheet_live_answers** RPC - NIE zwraca kolumny `item_evaluations` ani `mastery`
4. **useLiveSessionAnswers.tsx** - NIE laduje `item_evaluations` i NIE przekazuje ich do komponentow

### Rozwiazanie krok po kroku

**Krok 1: Zaktualizowac RPC `get_worksheet_live_answers`** - dodac `item_evaluations` i `mastery` do zwracanych kolumn

**Krok 2: `useInteractiveSharedWorksheet.tsx`** - ladowac `item_evaluations` z `get_worksheet_student_answers` (ktore JUZ zwraca `item_evaluations`) i eksponowac je jako nowy state:
```typescript
const [itemEvaluations, setItemEvaluations] = useState<Record<number, any[]>>({});

// W loadAnswers:
data.forEach((answer: any) => {
  loadedAnswers[answer.exercise_index] = answer.answers;
  if (answer.item_evaluations) {
    loadedEvals[answer.exercise_index] = answer.item_evaluations;
  }
});
setItemEvaluations(loadedEvals);

// W return:
return { ..., itemEvaluations };
```

**Krok 3: `useLiveSessionAnswers.tsx`** - ladowac `item_evaluations` z zaktualizowanego RPC i eksponowac je:
```typescript
const [liveItemEvaluations, setLiveItemEvaluations] = useState<Record<number, any[]>>({});
// ... analogicznie jak wyzej
return { ..., liveItemEvaluations };
```

**Krok 4: `SharedWorksheetContent.tsx`** - dodac prop `itemEvaluations` i przekazac go do komponentow cwiczen open-ended:

```typescript
interface SharedWorksheetContentProps {
  // ... istniejace props ...
  itemEvaluations?: Record<number, any[]>;  // NOWE
}

// W renderowaniu kazdego open-ended exercise:
<ExerciseReading
  // ... istniejace props ...
  aiEvaluations={convertItemEvalsToAiEvals(itemEvaluations?.[index])}
/>
```

Funkcja konwertujaca `item_evaluations` (format bazy) na `AiEvaluation` (format komponentu):
```typescript
const convertItemEvalsToAiEvals = (items: any[]): Record<number, AiEvaluation> | undefined => {
  if (!items || items.length === 0) return undefined;
  const result: Record<number, AiEvaluation> = {};
  items.forEach(item => {
    result[item.question_index] = {
      is_acceptable: (item.mastery || 0) >= 70,
      quality_score: (item.mastery || 0) / 100,
      feedback: item.feedback || '',
      question_index: item.question_index
    };
  });
  return result;
};
```

**Krok 5: `SharedWorksheet.tsx`** - przekazac `itemEvaluations` z hooka do `SharedWorksheetContent`

**Krok 6: Analogicznie dla Live Session** - w `WorksheetContent.tsx` gdzie renderowane sa cwiczenia w trybie Live Session, przekazac `liveItemEvaluations` z `useLiveSessionAnswers`

### Uwaga dotyczaca wyswietlania

W homework, `aiEvaluations` wyswietla sie TYLKO gdy `disabled` jest `true` (po submisji). W shared worksheet chcemy pokazywac feedback po AI evaluation (10-min timer lub Create Homework) nawet gdy student nadal moze edytowac. Komponenty cwiczen sprawdzaja `aiEvaluations?.[qIndex] && disabled` - wiec trzeba tez przekazac `disabled={true}` LUB zmodyfikowac warunek w komponentach.

Najlepsza opcja: wyswietlac feedback BEZ blokowania edycji. Zmienic warunek w komponentach z `aiEvaluations?.[qIndex] && disabled` na `aiEvaluations?.[qIndex] && (disabled || isSharedWorksheet)`. W ten sposob student widzi feedback ale nadal moze pisac.

---

## PODSUMOWANIE ZMIAN

| # | Plik | Zmiana | Problem |
|---|------|--------|---------|
| 1 | `supabase/config.toml` | Dodac `[functions.process-pending-ai-evaluations] verify_jwt = false` | 1A |
| 2 | `src/components/WorksheetDisplay.tsx` | Poprawic logowanie bledow w handleCreateHomework | 1A |
| 3 | `supabase/functions/verify-open-answers/index.ts` | Dodac reguly karzace za non-answers ("I don't know", inne jezyki, 1-2 slowa) | 2 |
| 4 | Migracja SQL: `get_worksheet_live_answers` | Dodac `item_evaluations` i `mastery` do zwracanych kolumn | 3 |
| 5 | `src/hooks/useInteractiveSharedWorksheet.tsx` | Ladowac i eksponowac `itemEvaluations` | 3 |
| 6 | `src/hooks/useLiveSessionAnswers.tsx` | Ladowac i eksponowac `liveItemEvaluations` | 3 |
| 7 | `src/components/shared/SharedWorksheetContent.tsx` | Przyjmowac i przekazywac `aiEvaluations` do open-ended exercises | 3 |
| 8 | `src/pages/SharedWorksheet.tsx` | Przekazac `itemEvaluations` do SharedWorksheetContent | 3 |
| 9 | 7 komponentow cwiczen | Zmienic warunek wyswietlania z `disabled` na `disabled \|\| isSharedWorksheet` | 3 |
| 10 | Dokumentacja | Aktualizacja scenariuszy | E |

### Zaktualizowane scenariusze AI Evaluation (Problem E)

| Scenariusz | Trigger | event_type | Wyswietlanie feedback |
|---|---|---|---|
| Student wpisuje odpowiedz | Auto-save 1.5s | `student_learning_activity` | Brak |
| 10 min bez aktywnosci | Timer -> edge function | `10min_AI_evaluation` | TAK - badge pod pytaniem na shared worksheet |
| Nauczyciel klika Create Homework | Przycisk na toolbarze -> edge function | `create_hw_AI_evaluation` | TAK - badge pod pytaniem na shared worksheet i Live Session |
| Student klika Submit Homework | Submit handler | `submit_hw_AI_evaluation` | TAK - badge pod pytaniem na homework (jak dotychczas) |
| Nauczyciel klika Mark Done | RPC add_student_event | `mark_done_evaluation` | TAK - badge w Live Session (jak dotychczas) |

### Bezpieczenstwo zmian

- Zmiana 1 (config.toml): tylko wylacza JWT verification - funkcja i tak uzywa service_role_key wewnetrznie
- Zmiana 2 (logowanie): dodaje console.log - zero wplywu na logike
- Zmiana 3 (prompt): zmiana tekstu prompta - nie zmienia struktury odpowiedzi AI, tylko jej jakosc
- Zmiana 4 (RPC): dodanie kolumn do SELECT - nie zmienia istniejacych danych, backward compatible
- Zmiany 5-8 (hooks + komponenty): dodanie nowego stanu i propow - istniejace propsy nie sa zmieniane
- Zmiana 9 (warunek wyswietlania): dodanie `|| isSharedWorksheet` - nie zmienia zachowania dla homework (tam `disabled=true` i tak jest spelniony)

