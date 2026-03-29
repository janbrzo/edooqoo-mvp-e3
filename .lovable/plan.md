

# Plan: Naprawa oceny audio w Homework + ukryte ikony odtwarzania + AI Score

## Diagnoza — 4 problemy

### Problem 1: Audio-only pytania nie są oceniane w Homework Submit

**Root cause:** W `useInteractiveHomework.tsx` linia 343, pętla budująca `answersToVerify` iteruje **wyłącznie** po `Object.entries(studentAnswersForExercise)` — czyli po `ans.answers` (tekst pisemny). Pytania, na które student odpowiedział TYLKO nagraniem audio (bez wpisywania tekstu), nie mają wpisu w `answers`, więc nigdy nie trafiają do `answersToVerify`.

Transkrypcja jest wykonywana poprawnie (linie 308-331, `transcriptionCache` jest wypełniany), ale potem te transkrypcje nigdy nie są użyte, bo pętla pomija pytania bez tekstu.

Dodatkowo `buildItemEvaluations` w `masteryCalculator.ts` (linia 450-455) pomija pytania bez `studentAnswer` (tekstu pisanego), więc nawet gdyby AI zwróciło wyniki, nie powstałyby `item_evaluations`.

**Dlaczego "reading" zadziałało:** Student miał ZARÓWNO tekst pisany ORAZ nagranie audio na te same pytania (question_index 1 miał written answer), więc pytanie trafiło do `answersToVerify`.

### Problem 2: Ikony odtwarzania nagrań znikają po Submit

**Root cause:** W `HomeworkPage.tsx` linia 708-709:
```typescript
onAudioAnswerChange={finalIsSubmitted ? undefined : ...}
```
Po submicie `onAudioAnswerChange` jest `undefined`. Wszystkie komponenty ćwiczeń renderują `HomeworkSpeakingRecorder` TYLKO gdy `onAudioAnswerChange` istnieje (`{onAudioAnswerChange && (<HomeworkSpeakingRecorder .../>)}`). Gdy jest `undefined`, komponent w ogóle się nie renderuje — razem z przyciskiem odtwarzania istniejącego nagrania.

### Problem 3: AI Score nie pokazuje się dla "reading" po Submit

**Root cause:** W `useInteractiveHomework.tsx` linie 415-420, dane AI ewaluacji zapisywane do `dbUpdates` zawierają TYLKO `quality_score` i `feedback`. Brakuje `writing_score` i `speaking_score`. Potem w liniach 429-438, `aiEvalLookup` próbuje odczytać te pola z `qEval` — ale ich tam nie ma. 

W konsekwencji `buildItemEvaluations` widzi `writing_score: undefined` i `speaking_score: undefined`, a dla nano_skillów `.speaking.` ustawia `skillMastery = -1` (linia 496), co oznacza `hasValue: false`. To sprawia, że `item_evaluations` mają `mastery: -1`, a trigger SQL odrzuca takie wpisy przy budowie ratings.

Dodatkowo `groupedEvaluations` (linia 408-413) też nie zawiera `writing_score`/`speaking_score`, więc frontend UI (`AiEvaluationBadge`) nie ma pełnych danych.

### Problem 4: Gdzie zapisywana jest transkrypcja

**Odpowiedź:**
- **Welcome Test:** transkrypcja jest trwale zapisywana w `student_test_questions.question_data.transcription`
- **Homework Submit:** transkrypcja żyje TYLKO w pamięci (`transcriptionCache` w `useInteractiveHomework.tsx`) — nigdy nie trafia do bazy
- **Shared Worksheet (process-pending):** transkrypcja żyje TYLKO w pamięci edge function — nigdy nie trafia do bazy
- **Wniosek:** Transkrypcja w homework i worksheet NIGDY nie jest persystowana. Przy kolejnym AI-eval (np. requeue) trzeba transkrybować ponownie.

---

## Plan naprawy

### Zmiana 1: Budowa `answersToVerify` z unii written + audio (useInteractiveHomework.tsx)

**Plik:** `src/hooks/useInteractiveHomework.tsx`
**Linie:** 333-380

Obecna pętla iteruje tylko po `Object.entries(studentAnswersForExercise)`. Trzeba ją zmienić na unię indeksów pytań z tekstu + audio.

**Dokładna zmiana:**

Zamiast:
```typescript
Object.entries(studentAnswersForExercise).forEach(([qIdxStr, studentAnswer]) => {
  const qIdx = parseInt(qIdxStr);
  ...
  if (!questionItem || !studentAnswer || String(studentAnswer).trim() === '') return;
  ...
});
```

Nowa logika:
```typescript
// Build union of question indexes from written + audio
const allQuestionIndexes = new Set<number>();
Object.keys(studentAnswersForExercise).forEach(k => allQuestionIndexes.add(parseInt(k)));
const exerciseAudio = audioAnswers[ans.exercise_index] || {};
Object.keys(exerciseAudio).forEach(k => allQuestionIndexes.add(parseInt(k)));

for (const qIdx of allQuestionIndexes) {
  const questionItem = questionItems[qIdx];
  if (!questionItem) continue;
  
  const writtenAnswer = studentAnswersForExercise[qIdx];
  const transcKey = `${ans.exercise_index}_${qIdx}`;
  const transcription = transcriptionCache[transcKey];
  
  // Effective answer: written text, or transcription for audio-only
  const effectiveAnswer = (writtenAnswer && String(writtenAnswer).trim() !== '')
    ? String(writtenAnswer)
    : (transcription ? transcription.text : null);
  
  if (!effectiveAnswer) continue;
  
  // ... build questionText, suggestedAnswer same as before ...
  
  answersToVerify.push({
    exercise_index: ans.exercise_index,
    question_index: qIdx,
    question_text: questionText,
    student_answer: (writtenAnswer && String(writtenAnswer).trim() !== '') ? String(writtenAnswer) : '',
    suggested_answer: suggestedAnswer || undefined,
    exercise_type: ans.exercise_type,
    ...(transcription ? {
      audio_transcription: transcription.text,
      audio_word_count: transcription.wordCount,
      audio_duration_seconds: transcription.duration
    } : {})
  });
}
```

### Zmiana 2: `buildItemEvaluations` — audio-only jako valid answer (masteryCalculator.ts)

**Plik:** `src/utils/masteryCalculator.ts`
**Linie:** 450-455

Obecna logika:
```typescript
const hasStudentAnswer = studentAnswer !== undefined && studentAnswer !== null && String(studentAnswer).trim() !== '';
if (!hasStudentAnswer) return;
```

Nowa logika — uwzględnij audio jako valid answer:
```typescript
const hasStudentAnswer = studentAnswer !== undefined && studentAnswer !== null && String(studentAnswer).trim() !== '';
const hasAudioAnswer = audioAnswers?.[idx] != null;
if (!hasStudentAnswer && !hasAudioAnswer) return;
```

### Zmiana 3: Przekazanie `writing_score`/`speaking_score` do dbUpdates (useInteractiveHomework.tsx)

**Plik:** `src/hooks/useInteractiveHomework.tsx`
**Linie:** 415-420

Obecna logika pomija `writing_score` i `speaking_score`:
```typescript
dbUpdates[exIdx].question_evaluations.push({
  question_index: qIdx,
  is_acceptable: evaluation.is_acceptable,
  quality_score: evaluation.quality_score,
  feedback: evaluation.feedback
});
```

Nowa logika:
```typescript
dbUpdates[exIdx].question_evaluations.push({
  question_index: qIdx,
  is_acceptable: evaluation.is_acceptable,
  quality_score: evaluation.quality_score,
  writing_score: evaluation.writing_score,
  speaking_score: evaluation.speaking_score,
  feedback: evaluation.feedback
});
```

### Zmiana 4: Ikony odtwarzania audio po submit (HomeworkPage.tsx)

**Plik:** `src/pages/HomeworkPage.tsx`
**Linia:** 708-709

Obecna logika:
```typescript
onAudioAnswerChange={finalIsSubmitted ? undefined : (qIndex, audioUrl) => updateAudioAnswer(...)}
```

Nowa logika — po submicie przekaż no-op zamiast undefined, żeby `HomeworkSpeakingRecorder` się renderował w trybie `disabled`:
```typescript
onAudioAnswerChange={
  finalIsSubmitted 
    ? ((_qIndex: number, _audioUrl: string) => {})  // no-op: renders recorder in disabled/playback mode
    : (qIndex: number, audioUrl: string) => updateAudioAnswer(index, qIndex, audioUrl)
}
```

Ponieważ `disabled` jest już ustawiony na `true` po submit (linia 703), `HomeworkSpeakingRecorder` automatycznie zablokuje nagrywanie, ale nadal wyświetli przycisk odtwarzania dla istniejących nagrań.

### Zmiana 5: Persystencja transkrypcji (opcjonalna, zalecana)

**Nie wdrażamy teraz** — transkrypcja w pamięci jest wystarczająca dla obecnego flow. Przy `process-pending-ai-evaluations` transkrypcja jest robiona w edge function. Persystencja do bazy byłaby optymalizacją (mniej wywołań Whisper), ale dodaje złożoność. Zostawiamy na przyszłość.

---

## Zmieniane pliki

| Plik | Zmiana |
|------|--------|
| `src/hooks/useInteractiveHomework.tsx` | (1) Union written+audio w `answersToVerify`, (2) przekazanie `writing_score`/`speaking_score` do dbUpdates |
| `src/utils/masteryCalculator.ts` | `buildItemEvaluations` — audio-only jako valid answer |
| `src/pages/HomeworkPage.tsx` | No-op zamiast `undefined` dla `onAudioAnswerChange` po submit |

## Co NIE zmienia się

- Edge functions (`verify-open-answers`, `process-pending-ai-evaluations`, `transcribe-audio`) — ostatnie poprawki są poprawne
- Triggery SQL — rozdzielanie written/audio ratings działa poprawnie
- Shared Worksheet — osobny hook, ale ma identyczny problem z budową `answersToVerify` w `useInteractiveSharedWorksheet.tsx`... Poczekaj.

## UWAGA: Ten sam problem w Shared Worksheet

`useInteractiveSharedWorksheet.tsx` ma dokładnie ten sam wzorzec: nie sprawdziłem jeszcze czy builduje `answersToVerify` z unii. Ale obecny flow Shared Worksheet nie robi transkrypcji na froncie (robi ją `process-pending-ai-evaluations`), więc problem 1 tam jest rozwiązany edge function'em. Ale `buildItemEvaluations` z brakującym audio-only traktowaniem dotyczy obu hooków.

## Dokumentacja

Aktualizacja w ramach implementacji:
- `docs/TECHNICAL_DOCUMENTATION.md` — opis naprawy audio-only flow
- `docs/CURRENT_STATE_ANALYSIS.md` — zamknięcie incydentu
- `docs/DEVELOPMENT_ROADMAP.md` — status

## Odpowiedź na pytanie 4

**Transkrypcja nagrań:**
- **Welcome Test** → `student_test_questions.question_data.transcription` (persystentna w bazie)
- **Homework** → `transcriptionCache` w pamięci hooka (utracona po zamknięciu strony)
- **Shared Worksheet** → pamięć edge function `process-pending-ai-evaluations` (utracona po zakończeniu request)
- Nigdzie poza Welcome Test transkrypcja nie jest trwale zapisywana

