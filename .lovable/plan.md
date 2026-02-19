

# Welcome Test - Round 9: Zaktualizowany kompleksowy plan

## Podsumowanie

Po glebokiej analizie kodu i danych w bazie znalazlem 6 konkretnych problemow. Ponizej zaktualizowany plan z uwzglednieniem Twoich uwag.

---

## PROBLEM 1: Automatyczna transkrypcja (bez przycisku Transcribe)

### Stan obecny
Nagrania dzialaja (R2 upload OK). `process-welcome-test` juz transkrybuje speaking answers (linie 386-413), ale transkrypcja jest uzywana TYLKO wewnetrznie w prompcie AI. Nie jest zapisywana do bazy. Nauczyciel widzi przycisk "Transcribe" ktory musi recznie kliknac.

### Rozwiazanie
1. W `process-welcome-test/index.ts` - po udanej transkrypcji, zapisac ja do `student_test_questions.question_data.transcription`:
```typescript
if (transcriptions[sqId]) {
  await supabase
    .from('student_test_questions')
    .update({
      question_data: { ...existingData, transcription: transcriptions[sqId] }
    })
    .eq('test_id', test_id)
    .eq('question_index', questionIndexForSqId);
}
```

2. W `TestDetailsView.tsx` - QuestionCard:
   - Zaladowac transkrypcje z `question.question_data.transcription` (useEffect)
   - Wyswietlac ja automatycznie pod odtwarzaczem
   - USUNAC przycisk "Transcribe" calkowicie
   - USUNAC funkcje `handleTranscribe`
   - USUNAC stany `transcribing`
   - Zostawic stan `transcription` do wyswietlania

---

## PROBLEM 2: Speaking i Writing score - analiza AI zamiast binarnego true/false

### Stan obecny
- `test_skill_results` pokazuje Speaking 0% (0/3), Writing 16.67% (1/6)
- Wszystkie speaking/writing questions maja `is_correct = null` (bo nie sa pytaniami zamknietymi)
- Funkcja `calculate_test_results` liczy score na podstawie `is_correct` - null traktuje jako 0
- W learning profile `writing_score = null`, `communication_score = null`

### Rozwiazanie - ocena AI per-question (0-100)
Zamiast prostego true/false, AI oceni kazde pytanie na skali 0-100:

1. W `process-welcome-test/index.ts` - prompt AI juz prosi o `per_question_scores`. Dodac logike:
   - Dla kazdego open_ended/speaking pytania, ustawic `is_correct` na podstawie score:
     - score >= 40: `is_correct = true` (student podejmuje realna probe)
     - score < 40: `is_correct = false`
   - Zapisac indywidualny score do `question_data.ai_score` (0-100) aby nauczyciel widzial dokladna ocene
   - Na koncu wywolac `calculate_test_results` aby przeliczyc "Results by Skill"

2. Dodatkowo obliczyc `speaking_score` i zaktualizowac `writing_score` w `student_learning_profiles`:
```typescript
// Calculate speaking score from per_question_scores
const speakingIds = ['wt_q16s', 'wt_q36s', 'wt_q41s'];
const speakingScores = speakingIds.map(id => perScores[id]).filter(s => s !== undefined);
const speakingScore = speakingScores.length > 0
  ? Math.round(speakingScores.reduce((a,b) => a+b, 0) / speakingScores.length)
  : null;

// Calculate writing score from AI (open_ended questions only)
const writingIds = ['wt_q16', 'wt_q17', 'wt_q36', 'wt_q37', 'wt_q40'];
const writingScores = writingIds.map(id => perScores[id]).filter(s => s !== undefined);
const writingScoreAI = writingScores.length > 0
  ? Math.round(writingScores.reduce((a,b) => a+b, 0) / writingScores.length)
  : null;

// Update learning profile with AI-based scores
await supabase
  .from('student_learning_profiles')
  .update({
    writing_score: writingScoreAI ?? writingScore,  // AI score or fallback to is_correct-based
    // speaking_score column doesn't exist - need migration
  })
  .eq('student_id', student_id)
  .eq('teacher_id', teacher_id);
```

3. W `WelcomeTestResults.tsx`:
   - Zamienic "Communication" na "Speaking" ze score z `per_question_scores`
   - Potrzebna migracja SQL: dodac kolumne `speaking_score numeric` do `student_learning_profiles`

---

## PROBLEM 3: student_events.event_source = 'test' (67 rekordow)

### Przyczyna (ZNALEZIONA)
Istnieje trigger bazodanowy `log_test_answer_event` ktory automatycznie tworzy event z hardcoded `event_source = 'test'` przy kazdym UPDATE `student_test_questions`. Jednoczesnie frontend w `useWelcomeTest.tsx` tworzy event z `event_source = 'welcome_test'`. Kazda odpowiedz generuje DWA eventy.

### Rozwiazanie - migracja SQL
1. Zmodyfikowac trigger aby pomijal welcome testy:
```sql
CREATE OR REPLACE FUNCTION public.log_test_answer_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
  v_test_type TEXT;
BEGIN
  IF NEW.student_answer IS NOT NULL AND (OLD IS NULL OR OLD.student_answer IS NULL) THEN
    SELECT st.student_id, st.teacher_id, st.test_type
    INTO v_student_id, v_teacher_id, v_test_type
    FROM public.student_tests st WHERE st.id = NEW.test_id;
    
    -- Skip welcome tests - frontend handles with richer payload
    IF v_test_type = 'welcome' THEN RETURN NEW; END IF;
    
    IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
      INSERT INTO public.student_events (...) VALUES (...);
    END IF;
  END IF;
  RETURN NEW;
END; $$;
```

2. Usunac zduplikowane eventy:
```sql
DELETE FROM student_events 
WHERE event_source = 'test' 
AND event_type = 'test_answer_submitted'
AND source_id IN (SELECT id FROM student_tests WHERE test_type = 'welcome');
```

---

## PROBLEM 4: student_events.event_payload - mastery nadal -1

### Stan faktyczny
Sprawdzilem baze danych. Kolumna `mastery` w `student_events` JUZ ma wartosci (45, 55, 60, 70 itd.) dla najnowszego testu. ALE `nano_skill_ratings` wewnatrz `event_payload` JSON nadal ma `mastery: -1`.

Uzytkownik patrzy na `event_payload` i widzi `-1` w `nano_skill_ratings[0].mastery`. To jest stale - ten JSON nie jest aktualizowany po AI Analysis. Tylko kolumna `mastery` jest aktualizowana.

### Rozwiazanie
Po AI Analysis, zaktualizowac tez `nano_skill_ratings` wewnatrz `event_payload`:
```typescript
for (const qId of allOpenSpeakingIds) {
  const score = perScores[qId];
  if (score !== undefined) {
    // Update mastery column
    await supabase
      .from('student_events')
      .update({ mastery: score })
      .eq('source_id', test_id)
      .filter('event_payload->>answer_id', 'eq', qId);
    
    // Also update nano_skill_ratings inside event_payload
    const { data: evt } = await supabase
      .from('student_events')
      .select('event_payload')
      .eq('source_id', test_id)
      .filter('event_payload->>answer_id', 'eq', qId)
      .eq('event_source', 'welcome_test')
      .single();
    
    if (evt?.event_payload) {
      const payload = evt.event_payload;
      if (payload.nano_skill_ratings?.length > 0) {
        payload.nano_skill_ratings[0].mastery = score;
        payload.nano_skill_ratings[0].hasValue = true;
      }
      await supabase
        .from('student_events')
        .update({ event_payload: payload, mastery: score })
        .eq('source_id', test_id)
        .filter('event_payload->>answer_id', 'eq', qId)
        .eq('event_source', 'welcome_test');
    }
  }
}
```

---

## PROBLEM 5: Timer - visibilitychange

### Stan obecny
Timer liczy czas od `Date.now()` w momencie wyswietlenia pytania do `commitAnswer`. Nie pauzuje gdy tab nieaktywny.

### Rozwiazanie
W `useWelcomeTest.tsx`:
```typescript
const pausedAtRef = useRef<number | null>(null);
const accumulatedPauseRef = useRef(0);

useEffect(() => {
  const handler = () => {
    if (document.hidden) {
      pausedAtRef.current = Date.now();
    } else if (pausedAtRef.current) {
      accumulatedPauseRef.current += (Date.now() - pausedAtRef.current);
      pausedAtRef.current = null;
    }
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}, []);
```

W `commitAnswer` - odejmowac czas pauzy:
```typescript
const rawTime = Date.now() - questionTimers.current[questionId];
const pauseTime = accumulatedPauseRef.current;
accumulatedPauseRef.current = 0;
const timeSpent = Math.max(0, Math.round((rawTime - pauseTime) / 1000));
```

---

## PROBLEM 6: Communication -> Speaking w Skill Scores

### Rozwiazanie
1. Migracja SQL: dodac kolumne `speaking_score numeric` do `student_learning_profiles`
2. W `WelcomeTestResults.tsx`: zamienic "Communication" na "Speaking"
3. W `process-welcome-test`: zapisywac `speaking_score` obliczony z AI per_question_scores

---

## Podsumowanie zmian w plikach

| Plik | Zmiana | Problem |
|------|--------|---------|
| `process-welcome-test/index.ts` | Zapisac transkrypcje do question_data, ustawic is_correct po AI score, zaktualizowac nano_skill_ratings w payloadzie, obliczyc speaking_score, wywolac calculate_test_results | 1, 2, 4 |
| `TestDetailsView.tsx` | Usunac przycisk Transcribe, auto-ladowac transkrypcje z question_data | 1 |
| `WelcomeTestResults.tsx` | Zamienic Communication na Speaking | 6 |
| `useWelcomeTest.tsx` | Dodac visibilitychange listener | 5 |
| SQL migracja | Dodac speaking_score, naprawic trigger, usunac duplikaty | 2, 3, 6 |
| 6 plikow dokumentacji | Zaktualizowac o Round 9 | wszystkie |

### Czego NIE zmieniamy:
- SpeakingRecorder.tsx - upload base64 dziala
- WelcomeTestPage.tsx - bez zmian
- Routing, homework, flashcards, worksheet
- upload-to-r2 - bez zmian

### Kolejnosc implementacji:
1. SQL migracja - speaking_score + trigger fix + delete duplikaty
2. `process-welcome-test/index.ts` - transkrypcje + is_correct + speaking_score + payload fix
3. `TestDetailsView.tsx` - usunac Transcribe, auto-wyswietlac transkrypcje
4. `WelcomeTestResults.tsx` - Communication -> Speaking
5. `useWelcomeTest.tsx` - visibilitychange
6. Deploy process-welcome-test
7. Dokumentacja

