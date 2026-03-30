

# Plan: Naprawa 3 problemów audio w Homework

## Diagnoza

### Problem 1: Nadpisywanie eventów po Submit

**Root cause:** W `useInteractiveHomework.tsx` linie 313-332, persystencja transkrypcji odbywa się jako osobny `supabase.update({ answers })` **PRZED** ewaluacją AI. Każdy taki update triggeruje `log_homework_answer_to_events()`, który:
1. USUWA wszystkie eventy dla danego ćwiczenia (linia 187-189 triggera)
2. Wstawia nowe eventy z bieżącym `item_evaluations` (które w tym momencie jest NULL bo AI eval jeszcze nie przeszedł)

Rezultat: eventy lądują z `nano_skill_ratings: []` po update transkrypcji, a potem (po AI eval) trigger ponownie je kasuje i wstawia poprawne. **ALE** jeśli transkrypcja nie działa (Problem 3) → AI eval nie ma audio answers do oceny → te ćwiczenia nie trafiają do AI → trigger z pustymi ratings jest finalny.

Dodatkowo: po submit, gdy user odtwarza nagranie, sam playback NIE triggeruje żadnego zapisu (zweryfikowałem w kodzie `HomeworkSpeakingRecorder`). Ale efekt "nadpisywania" który widzisz wynika z tego, że submit flow uruchomił trigger BEZ ocen.

**Naprawa:** Przenieść persystencję transkrypcji do tego samego `.update()` co AI eval, żeby trigger nie strzelał dwukrotnie. Zamiast:
- Krok A: `.update({ answers })` → trigger z pustymi ratings
- Krok B: `.update({ ai_evaluation, item_evaluations })` → trigger z ratings

Zrobić:
- Jeden `.update({ answers: answersWithTranscriptions, ai_evaluation, item_evaluations, mastery, eval_trigger })` → trigger strzelą RAZ z poprawnymi ratings

### Problem 2: Jeden AI Score zamiast dwóch

**Root cause:** `AiEvaluationBadge` wyświetla JEDNĄ ocenę (`quality_score`) jako "AI Score: X%". Nie ma logiki na rozdzielenie `writing_score` i `speaking_score` w osobne badge'e.

Ponadto `groupedEvaluations` (linie 378-383) zapisuje do stanu UI TYLKO `quality_score` i `feedback` — `writing_score` i `speaking_score` nie trafiają do obiektu `AiEvaluation` → nie są dostępne dla badge'a.

**Naprawa:**
1. Rozszerzyć interfejs `AiEvaluation` o `writing_score?` i `speaking_score?`
2. Zapisywać te pola w `groupedEvaluations`
3. Zmienić `AiEvaluationBadge` aby gdy oba scory istnieją, wyświetlał dwa badge'e:
   - "✍️ Writing: X%" 
   - "🎤 Speaking: Y%"
   A gdy jest tylko jeden — wyświetlał jeden badge z etykietą odpowiedniego typu.

### Problem 3: Transkrypcje nie zapisują się w DB

**Root cause:** Kod persystencji istnieje (linie 313-332 w `useInteractiveHomework`), ale aby zadziałał, `transcribeAllAudio` musi zwrócić niepusty cache. Funkcja `transcribe-audio` ma poprawkę na anon key w kodzie, ale logi Edge Function są puste — co może oznaczać:
- Funkcja nie została faktycznie wywołana (frontend error silencing)
- Lub `supabase.functions.invoke` zwraca błąd którego nie logujemy wystarczająco głośno

W `audioEvalUtils.ts` linia 48-50, jeśli `transcError` istnieje, logujemy `console.error` ale kontynuujemy. Jeśli nie ma errora ale `transcResult` nie ma `transcription`, logujemy `console.warn`. Potrzebujemy lepszej diagnostyki.

Dodatkowa hipoteza: `supabase.functions.invoke` z klienta anonowego może zwracać error w `data` a nie w `error` field (zależy od wersji SDK). Trzeba to zweryfikować.

---

## Plan naprawy — 4 zmiany

### Zmiana 1: Połączenie persystencji transkrypcji z AI eval update

**Plik:** `src/hooks/useInteractiveHomework.tsx`

Obecny flow w `submitHomework`:
```
1. submit_homework_answers RPC (is_submitted=true)    → trigger fires
2. For each transcription: .update({ answers })        → trigger fires (premature!)  
3. AI eval → .update({ ai_evaluation, item_evaluations }) → trigger fires (correct)
```

Nowy flow:
```
1. submit_homework_answers RPC (is_submitted=true)    → trigger fires
2. Transcribe all audio (no DB writes yet)
3. AI eval
4. Single .update({ answers+transcriptions, ai_evaluation, item_evaluations }) → trigger fires ONCE
```

**Dokładna zmiana w liniach 313-433:**

Usunąć pętlę persystencji transkrypcji (linie 313-333). Zamiast tego, po AI eval (linie 395-433), w pętli `for (const [exIdxStr, evalData] of Object.entries(dbUpdates))` dodać logikę mergowania transkrypcji do `answers`:

```typescript
for (const [exIdxStr, evalData] of Object.entries(dbUpdates)) {
  const exIdx = parseInt(exIdxStr);
  // ... existing itemEvals calculation ...
  
  // Merge transcriptions into answers for this exercise
  const ans = savedAnswers.find((a: any) => a.exercise_index === exIdx);
  const existingAnswers = (typeof ans?.answers === 'object' && ans?.answers !== null) ? { ...ans.answers } : {};
  for (const [cacheKey, transcription] of Object.entries(transcriptionCache)) {
    const [txExIdx, txQIdx] = cacheKey.split('_');
    if (parseInt(txExIdx) === exIdx) {
      existingAnswers[`_transcription_${txQIdx}`] = transcription.text;
    }
  }
  
  await supabase
    .from('homework_student_answers')
    .update({ 
      answers: existingAnswers,  // ← includes transcriptions
      ai_evaluation: evalData,
      item_evaluations: JSON.parse(JSON.stringify(itemEvals)),
      mastery: overallMastery,
      eval_trigger: 'submit_homework'
    })
    .eq('homework_id', homeworkId)
    .eq('student_email', studentEmail)
    .eq('exercise_index', exIdx);
}

// Also persist transcriptions for exercises that had audio but NO AI eval
// (e.g. non-open exercise types with audio recordings)
for (const [cacheKey, transcription] of Object.entries(transcriptionCache)) {
  const [exIdxStr, qIdxStr] = cacheKey.split('_');
  const exIdx = parseInt(exIdxStr);
  if (dbUpdates[exIdx]) continue; // Already handled above
  
  const ans = savedAnswers.find((a: any) => a.exercise_index === exIdx);
  if (!ans) continue;
  const existingAnswers = (typeof ans.answers === 'object' && ans.answers !== null) ? { ...ans.answers } : {};
  existingAnswers[`_transcription_${qIdxStr}`] = transcription.text;
  
  await supabase
    .from('homework_student_answers')
    .update({ answers: existingAnswers })
    .eq('homework_id', homeworkId)
    .eq('student_email', studentEmail)
    .eq('exercise_index', exIdx);
}
```

### Zmiana 2: Dwa AI Score badge'e (writing + speaking)

**Plik:** `src/components/homework/AiEvaluationBadge.tsx`

Rozszerzyć interfejs `AiEvaluation`:
```typescript
export interface AiEvaluation {
  is_acceptable: boolean;
  quality_score: number;
  feedback: string;
  question_index?: number;
  writing_score?: number;   // ← NOWE
  speaking_score?: number;  // ← NOWE
}
```

Zmienić komponent `AiEvaluationBadge` aby renderował:
- Jeśli `writing_score` i `speaking_score` oba istnieją → dwa oddzielne badge'e: "✍️ Writing: X%" i "🎤 Speaking: Y%"
- Jeśli tylko `writing_score` → jeden badge "✍️ Writing: X%"
- Jeśli tylko `speaking_score` → jeden badge "🎤 Speaking: Y%"
- Jeśli żaden nie istnieje (backward compat) → obecny badge "AI Score: X%"

Feedback (`evaluation.feedback`) wyświetlany RAZ pod oboma badge'ami.

**Plik:** `src/hooks/useInteractiveHomework.tsx` linie 378-383

Dodać `writing_score` i `speaking_score` do `groupedEvaluations`:
```typescript
groupedEvaluations[exIdx][qIdx] = {
  is_acceptable: evaluation.is_acceptable,
  quality_score: evaluation.quality_score,
  writing_score: evaluation.writing_score,    // ← NOWE
  speaking_score: evaluation.speaking_score,  // ← NOWE
  feedback: evaluation.feedback,
  question_index: qIdx
};
```

**Plik:** `src/types/interactiveHomework.ts` — zaktualizować interfejs `AiEvaluation` tutaj też (jeśli jest duplikat):
```typescript
export interface AiEvaluation {
  is_acceptable: boolean;
  quality_score: number;
  feedback: string;
  question_index?: number;
  writing_score?: number;
  speaking_score?: number;
}
```

### Zmiana 3: Lepsza diagnostyka transkrypcji

**Plik:** `src/utils/audioEvalUtils.ts`

W `transcribeAllAudio`, po `supabase.functions.invoke`, dodać logowanie pełnej odpowiedzi:
```typescript
const { data: transcResult, error: transcError } = await supabase.functions.invoke('transcribe-audio', {
  body: { audio_url: audioUrl }
});

// Enhanced diagnostics
devLog(`${logPrefix} Invoke result for ${cacheKey}: error=${!!transcError}, data keys=${transcResult ? Object.keys(transcResult) : 'null'}`);

if (transcError) {
  console.error(`${logPrefix} Transcription invoke error for ${cacheKey}:`, transcError);
  // Also log the data field which may contain error details
  if (transcResult) console.error(`${logPrefix} Error response data:`, transcResult);
  continue;
}

// Check for error in response body (SDK sometimes puts errors in data, not error)
if (transcResult?.error) {
  console.error(`${logPrefix} Transcription API error for ${cacheKey}:`, transcResult.error);
  continue;
}
```

### Zmiana 4: Resetowanie homework do testów

**Migracja SQL:** Resetowanie `homework_student_answers` dla share_token `c81caca1...`:
```sql
UPDATE homework_student_answers
SET is_submitted = false, submitted_at = NULL, ai_evaluation = NULL, 
    item_evaluations = NULL, eval_trigger = NULL, mastery = NULL
WHERE homework_id = (SELECT id FROM homework_assignments WHERE share_token = 'c81caca14d21b916005ab3abe32a7a6a8d669350ae8f921fa2e440ff38a13a53');

UPDATE homework_assignments
SET completed_at = NULL, completed_by_teacher = false, reviewed_at = NULL, reviewed_by = NULL
WHERE share_token = 'c81caca14d21b916005ab3abe32a7a6a8d669350ae8f921fa2e440ff38a13a53';
```

---

## Zmieniane pliki

| Plik | Zmiana |
|------|--------|
| `src/hooks/useInteractiveHomework.tsx` | (1) Połączenie persystencji transkrypcji z AI eval update, (2) `writing_score`/`speaking_score` w `groupedEvaluations` |
| `src/components/homework/AiEvaluationBadge.tsx` | Dwa badge'e: writing + speaking, rozszerzony interfejs |
| `src/types/interactiveHomework.ts` | `AiEvaluation` z `writing_score?` i `speaking_score?` |
| `src/utils/audioEvalUtils.ts` | Lepsza diagnostyka invoke errors |
| Migracja SQL | Reset homework submission |

## Co NIE zmienia się

- `transcribe-audio` Edge Function — poprawka anon key jest już wdrożona
- `verify-open-answers` — zwraca `writing_score`/`speaking_score` poprawnie
- SQL triggery — logika rozdzielania written/audio eventów jest poprawna
- `HomeworkSpeakingRecorder` — playback nie triggeruje żadnych zapisów (potwierdzone)
- `masteryCalculator.ts` — audio-only fix jest poprawny

## Dokumentacja

- `docs/TECHNICAL_DOCUMENTATION.md`
- `docs/CURRENT_STATE_ANALYSIS.md`

