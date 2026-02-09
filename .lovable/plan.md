

# Plan naprawy: 4 problemy

## PROBLEM 1: Rozna struktura event_payload miedzy homework i worksheet

### Analiza przyczyny

Porownanie danych:
- **Homework (DOBRZE)**: `name: "ns.speaking.past_preference_expression"`, `reason: "Tests the ability to..."`, brak `feedback`
- **Worksheet (ZLE)**: `name: "question_0"`, `reason: ""`, ma `feedback`

Przyczyna lezy w edge function `process-pending-ai-evaluations/index.ts` (linie 162-175). Buduje `item_evaluations` tak:

```javascript
const nanoSkill = questionItem?.nano_skill;
return {
  name: nanoSkill?.name || `question_${qIdx}`,  // <-- TU JEST PROBLEM
  reason: nanoSkill?.reason || '',
  feedback: e.feedback || ''  // <-- TO JEST EKSTRA (homework nie ma)
};
```

`questionItem` pochodzi z `context.questions` zapisanego w kolejce `pending_worksheet_ai_evaluations`. Ale `context.questions` NIE zawiera obiektu `nano_skill`! Bo w `autoQueueForCreateHomework` (linia 318):

```javascript
context.questions = exercise.questions || exercise.prompts || ... || [];
```

To kopiuje pytania Z worksheeta, wiec `nano_skill` POWINIEN byc. Problem jest raczej w 10-min timer w `useInteractiveSharedWorksheet.tsx` (linia 424):

```javascript
p_context: {
  title: exercise?.title || `Exercise ${exerciseIndex + 1}`,
  questions: exercise?.questions || exercise?.prompts || ...
}
```

Tutaj `exercise` pochodzi z `exercises[exerciseIndex]` - tablicy propsow hooka. Wiec `nano_skill` JEST w danych. Pytanie - czy `nano_skill` przezywa serializacje do JSONB w `pending_worksheet_ai_evaluations`?

Kluczowy insight: nawet jesli `nano_skill` jest w danych, problem `feedback` i brak `is_submitted` wynika z tego ze homework i worksheet buduja `item_evaluations` w DWOCH ROZNYCH miejscach:
1. **Homework**: frontend (`useInteractiveHomework.tsx` linie 411-427) - nie dodaje `feedback`
2. **Worksheet**: edge function (`process-pending-ai-evaluations` linie 162-175) - dodaje `feedback`

### Rozwiazanie

Ujednolicic format w edge function `process-pending-ai-evaluations` aby pasowat do formatu homework:
- Usunac `feedback` z `item_evaluations` (feedback jest w `ai_evaluation` kolumnie, nie w event_payload)
- Upewnic sie ze `nano_skill` jest prawidlowo wyciagany

```javascript
// BYLO (zle):
return {
  question_index: qIdx,
  name: nanoSkill?.name || `question_${qIdx}`,
  reason: nanoSkill?.reason || '',
  mastery: Math.round((e.quality_score || 0.7) * 100),
  hasValue: true,
  feedback: e.feedback || ''  // <-- TO USUNAC Z ITEM_EVALUATIONS
};

// BEDZIE (dobrze - identycznie jak homework):
return {
  question_index: qIdx,
  name: nanoSkill?.name || `question_${qIdx}`,
  reason: nanoSkill?.reason || '',
  mastery: Math.round((e.quality_score || 0.7) * 100),
  hasValue: true
};
```

ALE - `feedback` jest potrzebny w `item_evaluations` w tabeli `worksheet_student_answers` bo `SharedWorksheetContent` go uzywa do wyswietlania! Wiec:
- W `worksheet_student_answers.item_evaluations` - zachowac `feedback` (do wyswietlania UI)  
- W `student_events.event_payload.nano_skill_ratings` - usunac `feedback` (do logu DSLM)

Trigger SQL `log_worksheet_answer_to_events` juz filtruje `item_evaluations` do `nano_skill_ratings` (linia 133-138). Wystarczy dodac filtrowanie pola `feedback` z elementow w triggerze:

```sql
-- Usunac 'feedback' z kazgego elementu nano_skill_ratings
SELECT jsonb_agg(
  elem - 'feedback'  -- Usun klucz 'feedback' z kazdego obiektu
)
INTO v_nano_skill_ratings
FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
WHERE (elem->>'hasValue')::boolean IS NOT FALSE;
```

To zapewnia identyczna strukture event_payload jak homework.

---

## PROBLEM 2A: Create Homework nie triggeruje AI eval

### Analiza przyczyny (POTWIERDZONA logami)

Logi edge function:
```
trigger_source: null, worksheet_id: 76afe634-...
No pending evaluations found
```

`trigger_source: null` oznacza ze **to NIE jest wywolanie z handleCreateHomework** (ktore ustawia `trigger_source: 'create_homework'`). Te wywolania pochodza z `useLiveSessionAnswers.tsx` linia 69 (ktore NIE przekazuje trigger_source).

Problem: `handleCreateHomework` w `WorksheetDisplay.tsx` WYGLADA poprawnie, ale moze nie byc w ogole wywolywany. Moge wylaczac scenariusz z innego powodu - moze `worksheetId` jest undefined lub funkcja nie jest async poprawnie?

Ale bardziej prawdopodobne: nauczyciel w trybie Live Session widzi `process-pending-ai-evaluations` wywolywane co kilka sekund (z `useLiveSessionAnswers` w processPendingAiEvals + Realtime re-renders), co zasypuje logi, a Create Homework call jest pomiedzy nimi i trudno znalezc.

Prawdziwy problem moze byc tez taki: `handleCreateHomework` jest `async` ale `WorksheetToolbar` moze nie czekac na wynik. Sprawdzam - `WorksheetToolbar` linia 377 robi `onClick={onCreateHomework}`. `onCreateHomework` to `handleCreateHomework` ktore jest async. `onClick` na przycisku NIE czeka na async - ale to nie problem, bo `await` wewnatrz handerlera i tak zadziala.

Zidentyfikowalem prawdziwy problem: `useLiveSessionAnswers` wywoluje `processPendingAiEvals` przy KAZDYM renderze/reconnect (linia 100), a ten jest w useEffect dependencies (linia 149: `[worksheetId, enabled, loadInitialAnswers, processPendingAiEvals]`). `processPendingAiEvals` zalezy od `loadInitialAnswers` ktore zalezy od `worksheetId`. Wiec zamienia sie w petle re-renderow ktora ciagle wywoluje edge function - ALE z `trigger_source: null`, co CZYSC kolejke pending evaluations zanim Create Homework zdazy je dodac!

Scenariusz:
1. Student wpisuje odpowiedz -> trigger SQL tworzy event `student_learning_activity`
2. Teacher klika Create Homework -> `handleCreateHomework` wywoluje edge function z `trigger_source: 'create_homework'`
3. Edge function `autoQueueForCreateHomework` sprawdza `needs_ai_evaluation` -> TRUE -> kolejkuje
4. Edge function przetwarza kolejke -> SUKCES
5. ALE JEDNOCZESNIE `useLiveSessionAnswers` tez wywoluje edge function z `trigger_source: null` -> ta TEZE przetwarza ta sama kolejke -> conflict

To nie jest glowny problem. Glowny problem: logi pokazuja ze `trigger_source` to `null` - co oznacza ze Create Homework call NIGDY nie dotarl do edge function, albo dotarl ale wczesniej/pozniej niz oczekiwano.

### Rozwiazanie

1. Dodac await i lepszy error handling w `handleCreateHomework`
2. Wazniejsze: zatrzymac `processPendingAiEvals` w `useLiveSessionAnswers` od ciaglego wywolywania - wywolac je TYLKO RAZ przy mount, nie w kazdym rerender
3. Sprawdzic czy `handleCreateHomework` jest w ogole wywolywany - dodac alert/toast tymczasowy

```typescript
// useLiveSessionAnswers.tsx - wywolac processPendingAiEvals tylko raz, nie w dependencies useEffect
useEffect(() => {
  if (!enabled || !worksheetId) return;
  
  loadInitialAnswers();
  processPendingAiEvals(); // Wywolaj raz
  
  // Realtime subscription...
  
  return () => { ... };
}, [worksheetId, enabled]); // USUNAC loadInitialAnswers i processPendingAiEvals z dependencies
```

---

## PROBLEM 3: AI Evaluation feedback w Live Session u nauczyciela

### Obecny stan

`WorksheetContent.tsx` przekazuje `liveSessionAnswers` do `ExerciseSection` (linia 515), ale NIE przekazuje `liveItemEvaluations`. `useLiveSessionAnswers` juz eksponuje `liveItemEvaluations` (dodane w poprzedniej iteracji).

### Rozwiazanie

1. Dodac prop `liveItemEvaluations` do `WorksheetContent` interface
2. Przekazac go z `WorksheetDisplay` (ktory ma dostep do `useLiveSessionAnswers`)
3. W `ExerciseSection` - dodac prop `liveItemEvaluations` 
4. Przekazac `aiEvaluations` do open-ended exercise components z `liveItemEvaluations` (konwersja format)

Zmiana w `WorksheetContentProps`:
```typescript
liveItemEvaluations?: Record<number, any[]>;
```

Zmiana w renderowaniu ExerciseSection:
```typescript
<ExerciseSection
  ...
  liveItemEvaluations={viewMode === 'live-session' ? liveItemEvaluations?.[originalIndex] : undefined}
/>
```

W `ExerciseSection` - przekazac `aiEvaluations` do komponentow open-ended (ExerciseReading, ExerciseDialogue itd.) konwertujac `liveItemEvaluations` na format `Record<number, AiEvaluation>`:

```typescript
const convertLiveEvalsToAiEvals = (items: any[]): Record<number, AiEvaluation> | undefined => {
  if (!items?.length) return undefined;
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

---

## PROBLEM 4: Rozszerzenie sugestii

### 4a. ExerciseSentenceTransformation bez aiEvaluations

Ten komponent jest open-ended (w liscie `EXERCISE_TYPE_CLASSIFICATION.open`) ale NIE przyjmuje propa `aiEvaluations`. Trzeba go dodac analogicznie do ExerciseReading, ExerciseDialogue itd.

### 4b. Timer odswiezania itemEvaluations

Student na shared worksheet NIE widzi AI feedback bez odswiezenia strony po tym jak AI eval sie wykonala (bo dane sa w bazie, a frontend nie wie ze sie zmienily). Rozwiazanie: dodac polling co 30 sekund w `useInteractiveSharedWorksheet` ktory sprawdza `item_evaluations` z bazy i aktualizuje state.

### 4c. Realtime na `useLiveSessionAnswers`

Realtime subscription na `worksheet_student_answers` juz istnieje (linia 103-141), ALE `payload.new` w UPDATE nie zawiera `item_evaluations` w danych Realtime (Supabase Realtime nie zawsze zwraca wszystkie kolumny). Fix: po kazdym UPDATE Realtime, wywolac `loadInitialAnswers()` ktore pobierze pelne dane wlacznie z `item_evaluations`.

---

## PODSUMOWANIE ZMIAN

| # | Plik | Zmiana | Problem |
|---|------|--------|---------|
| 1 | Migracja SQL: `log_worksheet_answer_to_events` | Usunac `feedback` z `nano_skill_ratings` w payloadzie (`elem - 'feedback'`) | 1 |
| 2 | Migracja SQL: `log_homework_answer_to_events` | Analogiczna zmiana (dla spojnosci) | 1 |
| 3 | `src/hooks/useLiveSessionAnswers.tsx` | Usunac `loadInitialAnswers` i `processPendingAiEvals` z useEffect dependencies, dodac refetch po Realtime UPDATE z item_evaluations | 2A, 4c |
| 4 | `src/components/WorksheetDisplay.tsx` | Przekazac `liveItemEvaluations` do `WorksheetContent` | 3 |
| 5 | `src/components/worksheet/WorksheetContent.tsx` | Dodac prop `liveItemEvaluations`, przekazac do ExerciseSection | 3 |
| 6 | `src/components/worksheet/ExerciseSection.tsx` | Dodac prop `liveItemEvaluations`, konwertowac i przekazac do open-ended exercises jako `aiEvaluations` | 3 |
| 7 | `src/components/worksheet/ExerciseSentenceTransformation.tsx` | Dodac prop `aiEvaluations` i `isSharedWorksheet` | 4a |
| 8 | `src/hooks/useInteractiveSharedWorksheet.tsx` | Dodac polling co 30s dla `item_evaluations` aby student widzial feedback bez odswiezania | 4b |
| 9 | Dokumentacja | Aktualizacja scenariuszy | Wszystkie |

### Bezpieczenstwo zmian

- Zmiana 1-2 (SQL trigger): usuwamy jedno pole z JSONB obiektu - nie zmienia to zapisu do `worksheet_student_answers`, tylko do `student_events`
- Zmiana 3 (useEffect deps): naprawia re-render loop - obecny kod i tak dziala, tylko wywoluje edge function za czesto
- Zmiany 4-6 (Live Session): dodanie nowych opcjonalnych propow - istniejace renderowanie nie jest zmieniane
- Zmiana 7 (SentenceTransformation): dodanie opcjonalnego propa - bez wplywu na istniejace uzycia
- Zmiana 8 (polling): nowy efekt ktory NIE zmienia istniejacych - tylko odswierza dane

