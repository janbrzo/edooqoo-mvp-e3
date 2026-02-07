

# Plan naprawy 4 problemow

## PROBLEM 1.1: Rozne event_type w student_events zamiast "learning_activity"

### Obecny stan

Oba triggery SQL (`log_worksheet_answer_to_events` i `log_homework_answer_to_events`) wstawiaja staly `event_type = 'learning_activity'`. Trigger nie wie CO spowodowalo aktualizacje rekordu - student wpisa odpowiedz, 10-min timer odpali AI eval, nauczyciel klikna Create Homework itd.

### Problem

Trigger SQL nie ma informacji o kontekscie wywolania - widzi tylko INSERT/UPDATE na tabeli. Nie wie czy to student wpisal odpowiedz, czy AI Evaluation zaktualizowala mastery.

### Rozwiazanie

Trigger moze rozroznic scenariusze na podstawie DANYCH w rekordzie:

- Jesli `NEW.mastery IS NULL` -> student wlasnie wpisa odpowiedz (jeszcze bez AI eval) -> `event_type = 'student_learning_activity'`
- Jesli `NEW.mastery IS NOT NULL` -> AI Evaluation zaktualizowala rekord -> potrzebujemy wiedziec JAKI trigger

Aby przekazac kontekst "co wywolalo AI eval", najczysciej jest uzyc **pola `event_payload`** w rekordzie `student_events` z dodatkowym kluczem `trigger_source`. To pole bedzie ustawiane przez kod frontendowy/edge function, ktory wywoluje `process-pending-ai-evaluations`.

Ale... trigger SQL nie wie jaki "trigger_source" uzyc. Najprostsze rozwiazanie:

**Dodac kolumne `eval_trigger` do tabeli `worksheet_student_answers` i `homework_student_answers`** - ustawiana przez frontend/edge function przed aktualizacja mastery. Trigger SQL czyta te kolumne i mapuje na odpowiedni event_type.

Wartosci `eval_trigger`:
- `NULL` lub `'student'` -> `event_type = 'student_learning_activity'`
- `'10min_inactivity'` -> `event_type = '10min_AI_evaluation'`
- `'close_tab'` -> `event_type = 'close_tab_AI_evaluation'`
- `'create_homework'` -> `event_type = 'create_hw_AI_evaluation'`
- `'submit_homework'` -> `event_type = 'submit_hw_AI_evaluation'`

### Implementacja krok po kroku

1. **Migracja SQL**: Dodac kolumne `eval_trigger text` do obu tabel
2. **Trigger SQL update**: Czytac `NEW.eval_trigger` i mapowac na event_type
3. **Frontend - useInteractiveSharedWorksheet.tsx**: Przed wywolaniem `process-pending-ai-evaluations` dla 10-min timera, ustawic `eval_trigger = '10min_inactivity'` w `pending_worksheet_ai_evaluations.context`
4. **Frontend - beforeunload handler**: Ustawic `eval_trigger = 'close_tab'`
5. **Frontend - CreateHomeworkModal.tsx**: Ustawic `eval_trigger = 'create_homework'`
6. **Edge function process-pending-ai-evaluations**: Po przeliczeniu mastery, ustawic `eval_trigger` w UPDATE na `worksheet_student_answers`
7. **Edge function (homework submit)**: Ustawic `eval_trigger = 'submit_homework'`

**Moja rekomendacja lepsza**: Zamiast kolumny `eval_trigger` w tabelach odpowiedzi, lepiej przekazac `trigger_source` jako parametr do edge function `process-pending-ai-evaluations`, ktory potem przy UPDATE `worksheet_student_answers` ustawi te wartosc. To unika dodawania kolumny do tabel odpowiedzi.

Jeszcze prostsza opcja: Edge function po wykonaniu AI eval moze BEZPOSREDNIO zaktualizowac `student_events` z wlasciwym `event_type`. Ale to komplikuje logike DELETE+INSERT w triggerze.

**Finalne rozwiazanie (najprostsze i najczystrsze)**:

Dodac kolumne `eval_trigger text DEFAULT NULL` do `worksheet_student_answers` i `homework_student_answers`. Trigger czyta te kolumne:

```sql
-- W triggerze:
CASE 
  WHEN NEW.eval_trigger = '10min_inactivity' THEN '10min_AI_evaluation'
  WHEN NEW.eval_trigger = 'close_tab' THEN 'close_tab_AI_evaluation'
  WHEN NEW.eval_trigger = 'create_homework' THEN 'create_hw_AI_evaluation'
  WHEN NEW.eval_trigger = 'submit_homework' THEN 'submit_hw_AI_evaluation'
  ELSE 'student_learning_activity'
END
```

Frontend ustawia `eval_trigger` poprzez parametr do `process-pending-ai-evaluations` edge function, ktora przed UPDATE na `worksheet_student_answers` ustawia ten kolumne.

---

## PROBLEM 1.2: Mark Done - zmiana event_type i event_source

### Obecny stan

W `ExerciseSection.tsx` linia 494-502, Mark Done zapisuje:
- `event_type: 'exercise_mastery_evaluation'`
- `event_source: 'teacher'`

### Rozwiazanie

Zmiana na:
- `event_type: 'mark_done_evaluation'`
- `event_source: 'worksheet'`

Zmiany w `ExerciseSection.tsx` w 3 miejscach:
1. Linia 459: zmiana w zapytaniu SELECT (szukanie istniejacych eventow)
2. Linia 494: zmiana w INSERT (nowy event)
3. Linia 570: zmiana w kolejnym zapytaniu SELECT

Plus odpowiednia zmiana w `src/types/dslm/events.ts` - dodac nowy typ `'mark_done_evaluation'`.

---

## PROBLEM 2: Caly payload nadpisywany zamiast pojedynczego itemu

### Obecny stan

Trigger SQL robi DELETE + INSERT calego eventu przy kazdym UPDATE na `worksheet_student_answers`. Payload zawiera `nano_skill_ratings` z `item_evaluations` - to jest CALA tablica evaluacji, nie pojedynczy item.

### Problem

To NIE jest bug - trigger poprawnie zapisuje CALY aktualny stan odpowiedzi dla danego exercise. Kazdy exercise ma 1 rekord w `student_events`. Gdy student zmienia odpowiedz na pytanie 3 z 8, to `worksheet_student_answers` jest aktualizowany z CALYM nowym zestawem odpowiedzi (bo kolumna `answers` przechowuje JSONB z wszystkimi odpowiedziami). Trigger wiec poprawnie loguje caly aktualny stan.

### Analiza czy da sie to naprawic

Zmiana na per-item logowanie wymagalaby:
- 1 rekord w `student_events` per pytanie zamiast per exercise
- Zmiana calej struktury DELETE + INSERT
- Zmiana wszystkich zapytan ktore czytaja te eventy

To byloby BARDZO skomplikowane i ryzkowne. 

**Rekomendacja**: Zostawic jak jest. Event per exercise (nie per item) to wlasciwy poziom granularnosci dla DSLM. Payload ZAWSZE zawiera aktualny stan calego exercise - to jest poprawne zachowanie. Zmiana tylko jednego itemu w payload nie ma sensu, bo mastery i nano_skill_ratings sa obliczane dla calego exercise.

Jedyne co mozna zrobic to dodac do payloadu pole `changed_item_index` informujace KTORY item zostal zmieniony. Ale to wymaga przekazania tej informacji z frontendu do triggera - dodatkowa komplikacja.

**Proponuje NIE ruszac tego** - obecne zachowanie jest poprawne architektonicznie.

---

## PROBLEM 3: Textarea nie dopasowuje rozmiaru po odswiezeniu

### Przyczyna

Wszystkie textarea uzywaja auto-resize TYLKO w `onChange`:
```tsx
onChange={(e) => {
  e.target.style.height = 'auto';
  e.target.style.height = `${e.target.scrollHeight}px`;
}}
```

Po odswiezeniu strony, `value` jest ustawione z bazy (pelny tekst), ale `onChange` sie NIE odpala - wiec textarea zostaje z domyslna wysokoscia `rows={1}` (ok. 40px).

### Rozwiazanie

Dodac `useEffect` lub `ref callback` ktory ustawia wysokosc textarea po renderowaniu. Najczysciej:

Stworzyc maly komponent `AutoResizeTextarea` ktory:
1. Rozszerza standardowy `Textarea`
2. Uzywa `useRef` + `useEffect` do ustawienia wysokosci po renderowaniu
3. Obsluguje rowniez `onChange` jak dotychczas

```tsx
const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const resolvedRef = (ref as any) || internalRef;
    
    useEffect(() => {
      const el = resolvedRef.current;
      if (el) {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }
    }, [value]);
    
    return (
      <Textarea
        ref={resolvedRef}
        value={value}
        onChange={(e) => {
          e.target.style.height = 'auto';
          e.target.style.height = `${e.target.scrollHeight}px`;
          onChange?.(e);
        }}
        className={cn("resize-none overflow-hidden", className)}
        {...props}
      />
    );
  }
);
```

Potem zamienic wszystkie 6 miejsc gdzie uzyty jest pattern `e.target.style.height = 'auto'` na ten komponent.

Dotyczy plikow:
- `ExerciseReading.tsx`
- `ExerciseAnswerQuestions.tsx`
- `ExerciseDescribe.tsx`
- `ExerciseDialogue.tsx`
- `ExerciseParaphrasing.tsx`
- `HomeworkExerciseRenderer.tsx`

---

## PODSUMOWANIE ZMIAN

| # | Plik | Zmiana | Problem |
|---|------|--------|---------|
| 1 | Migracja SQL | Dodac kolumne `eval_trigger` do `worksheet_student_answers` i `homework_student_answers` | 1.1 |
| 2 | Migracja SQL | Zaktualizowac oba triggery (`log_worksheet_answer_to_events`, `log_homework_answer_to_events`) - czytac `eval_trigger` i mapowac na event_type | 1.1 |
| 3 | `supabase/functions/process-pending-ai-evaluations/index.ts` | Przyjmowac parametr `trigger_source`, ustawiac go jako `eval_trigger` w UPDATE | 1.1 |
| 4 | `src/hooks/useInteractiveSharedWorksheet.tsx` | Przekazywac `trigger_source` do edge function (10-min: `'10min_inactivity'`, close-tab: `'close_tab'`) | 1.1 |
| 5 | `src/components/homework/CreateHomeworkModal.tsx` | Przekazywac `trigger_source: 'create_homework'` | 1.1 |
| 6 | `src/hooks/useInteractiveHomework.tsx` | Przekazywac `trigger_source: 'submit_homework'` | 1.1 |
| 7 | `src/components/worksheet/ExerciseSection.tsx` | Zmienic event_type na `'mark_done_evaluation'` i event_source na `'worksheet'` | 1.2 |
| 8 | `src/types/dslm/events.ts` | Dodac nowe typy eventow | 1.1, 1.2 |
| 9 | `src/components/ui/AutoResizeTextarea.tsx` | NOWY komponent | 3 |
| 10 | 6 plikow exercise | Zamienic textarea na AutoResizeTextarea | 3 |
| 11 | Dokumentacja | Aktualizacja | wszystkie |

Problem 2 - NIE ruszamy. Obecne zachowanie (caly payload per exercise) jest architektonicznie poprawne.

### Bezpieczenstwo zmian

- Zmiana 1-6 (eval_trigger): nowa kolumna z DEFAULT NULL - istniejace dane nie sa dotykane, trigger dziala jak wczesniej gdy eval_trigger IS NULL
- Zmiana 7 (Mark Done): zmiana stringow - nie zmienia logiki biznesowej
- Zmiana 9-10 (AutoResizeTextarea): komponent opakowujacy istniejacy Textarea - zero wplywu na logike, tylko poprawka wyswietlania

