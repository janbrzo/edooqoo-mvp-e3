

# Plan: Naprawa oceny audio/speaking w DSLM

## Diagnoza problemu

Przeanalizowałem cały flow od nagrania audio przez studenta, aż po zapis w `student_events`. Oto co znalazłem:

### Problem 1: Audio event kopiuje nano_skill_ratings z pisanej odpowiedzi

W triggerze SQL `log_worksheet_answer_to_events()` (linia 248-254 migracji `20260308191711`), gdy `v_has_audio = true`, tworzony jest **drugi rekord** w `student_events` z `response_type: 'audio'`. Ale ten rekord dostaje **te same `v_nano_skill_ratings`** co rekord pisany — bo `v_nano_skill_ratings` pochodzi z `NEW.item_evaluations`, które jest wspólne dla całego ćwiczenia (i tekst, i audio).

Konkretnie: student odpowiada pisemnie na pytanie 0 i nagrywał audio na pytanie 1. Ale `item_evaluations` zawiera ocenę tylko pytania 0 (pisanego), bo AI-eval nie oceniło jeszcze audio. Trigger bierze te same `nano_skill_ratings` i wstawia je do obu rekordów — zarówno `written` jak i `audio`.

**Efekt:** Rekord audio w `student_events` ma `question_index: 0` i mastery z pisanej odpowiedzi zamiast oceny mówionej na pytanie 1.

### Problem 2: Brak transkrypcji w `process-pending-ai-evaluations`

Transkrypcja audio działa poprawnie w dwóch miejscach:
- **Welcome Test** — `process-welcome-test` wywołuje `transcribe-audio` i zapisuje transkrypcję w `question_data.transcription`
- **Homework Submit** — `useInteractiveHomework.tsx` (linia 308-331) buduje `transcriptionCache` i przekazuje `audio_transcription` do `verify-open-answers`

Ale **`process-pending-ai-evaluations`** (wywoływane przez przyciski "Create Homework" i "10-min timer" w Live Session) **NIE robi transkrypcji w ogóle**. Buduje `answersToVerify` wyłącznie z `pending.answers` (tekst), ignoruje `audio_answers`. Dlatego nawet gdyby `verify-open-answers` umiał ocenić speaking (i umie — ma pełne wsparcie `audio_transcription`), nigdy nie dostaje danych audio.

### Problem 3: Trigger SQL nie rozdziela nano_skills per pytanie

Trigger buduje jedną listę `v_nano_skill_ratings` z CAŁEGO `item_evaluations`, a potem wstawia ją identycznie do obu rekordów (written i audio). Nie filtruje, które pytania mają odpowiedź pisemną, a które audio.

---

## Plan naprawy

### Zmiana 1: `process-pending-ai-evaluations` — dodanie transkrypcji audio

**Plik:** `supabase/functions/process-pending-ai-evaluations/index.ts`

Obecny flow (linia 107-127):
```
answers = pending.answers  // tylko tekst
answersToVerify = entries(answers).map(...)  // ignoruje audio
```

Nowy flow:
```
1. answers = pending.answers (tekst)
2. audio_answers = pobranie z worksheet_student_answers/homework_student_answers WHERE worksheet_id + student_email + exercise_index
3. Dla każdego audio_answer: wywołaj transcribe-audio → zapisz transkrypcję
4. Buduj answersToVerify łącząc tekst + audio_transcription per question_index
```

Dokładna zmiana — po linii 107 dodać:

```typescript
// Fetch audio answers from the source table
let audioAnswers: Record<string, string> = {};
try {
  const { data: answerRow } = await supabase
    .from('worksheet_student_answers')
    .select('audio_answers')
    .eq('worksheet_id', pending.worksheet_id)
    .eq('student_email', pending.student_email)
    .eq('exercise_index', pending.exercise_index)
    .maybeSingle();
  
  if (answerRow?.audio_answers && typeof answerRow.audio_answers === 'object') {
    audioAnswers = answerRow.audio_answers as Record<string, string>;
  }
} catch (e) {
  console.error('[process-pending] Error fetching audio_answers:', e);
}

// Transcribe audio answers
const transcriptionMap: Record<number, { text: string; wordCount: number; duration?: number }> = {};
for (const [qIdxStr, audioUrl] of Object.entries(audioAnswers)) {
  if (!audioUrl || typeof audioUrl !== 'string' || !audioUrl.startsWith('http')) continue;
  const qIdx = parseInt(qIdxStr);
  try {
    const transcResponse = await fetch(`${supabaseUrl}/functions/v1/transcribe-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ audio_url: audioUrl })
    });
    if (transcResponse.ok) {
      const transcData = await transcResponse.json();
      if (transcData.transcription) {
        const words = transcData.transcription.split(/\s+/).filter((w: string) => w.length > 0);
        transcriptionMap[qIdx] = {
          text: transcData.transcription,
          wordCount: words.length
        };
        console.log(`[process-pending] Transcribed q${qIdx}: ${words.length} words`);
      }
    }
  } catch (e) {
    console.error(`[process-pending] Transcription failed for q${qIdx}:`, e);
  }
}
```

Następnie w buildzie `answersToVerify` (linia 113-127) dodać transkrypcje:

```typescript
return {
  exercise_index: pending.exercise_index,
  question_index: qIdx,
  question_text: questionText,
  student_answer: String(answer),
  suggested_answer: suggestedAnswer,
  exercise_type: pending.exercise_type,
  // Add transcription if available for this question
  ...(transcriptionMap[qIdx] ? {
    audio_transcription: transcriptionMap[qIdx].text,
    audio_word_count: transcriptionMap[qIdx].wordCount,
    audio_duration_seconds: transcriptionMap[qIdx].duration
  } : {})
};
```

### Zmiana 2: SQL trigger — rozdzielenie nano_skill_ratings per response_type

**Plik:** Nowa migracja SQL

Obecny trigger tworzy jedną listę `v_nano_skill_ratings` z CAŁEGO `item_evaluations` i kopiuje ją do obu rekordów. Musimy rozdzielić:

- **Rekord `written`** — tylko `nano_skill_ratings` dla pytań, na które student odpowiedział **pisemnie** (pytanie ma odpowiedź w `answers`, ale NIE ma odpowiedzi w `audio_answers`)
- **Rekord `audio`** — tylko `nano_skill_ratings` dla pytań, na które student nagrał **audio** (pytanie ma odpowiedź w `audio_answers`)

Kluczowa zmiana w obu triggerach (`log_worksheet_answer_to_events` i `log_homework_answer_to_events`):

```sql
-- Zamiast jednego v_nano_skill_ratings dla obu rekordów,
-- budujemy dwa oddzielne zestawy

-- nano_skills for written-only questions  
v_written_ratings := (
  SELECT jsonb_agg(elem - 'feedback')
  FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
  WHERE (elem->>'hasValue')::boolean IS NOT FALSE
    AND NOT (NEW.audio_answers ? (elem->>'question_index'))
);

-- nano_skills for audio questions
v_audio_ratings := (
  SELECT jsonb_agg(elem - 'feedback') 
  FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
  WHERE (elem->>'hasValue')::boolean IS NOT FALSE
    AND (NEW.audio_answers ? (elem->>'question_index'))
);
```

Następnie:
- Rekord `written` używa `v_written_ratings`
- Rekord `audio` używa `v_audio_ratings`
- Mastery dla każdego rekordu obliczane z odpowiednich ratings

### Zmiana 3: `process-pending-ai-evaluations` — zapis speaking_score do item_evaluations

Obecny kod (linia 149-169) mapuje wyniki AI na `item_evaluations` używając tylko `quality_score`. Musimy dodać obsługę `speaking_score` i `writing_score`:

```typescript
const itemEvaluations = (aiResult.evaluations || []).map((e: any) => {
  const qIdx = e.question_index;
  const questionItem = questionItems[qIdx] || {};
  let nanoSkill = questionItem?.nano_skill;
  if (Array.isArray(nanoSkill)) nanoSkill = nanoSkill[0];
  
  // Use speaking_score for audio questions, writing_score for written, quality_score as fallback
  let mastery: number;
  if (transcriptionMap[qIdx] && e.speaking_score !== undefined) {
    mastery = Math.round(e.speaking_score * 100);
  } else if (e.writing_score !== undefined) {
    mastery = Math.round(e.writing_score * 100);
  } else {
    mastery = Math.round((e.quality_score || 0.7) * 100);
  }
  
  return {
    question_index: qIdx,
    name: nanoSkill?.name || `question_${qIdx}`,
    reason: nanoSkill?.reason || '',
    mastery,
    hasValue: true,
    feedback: e.feedback || '',
    // Mark which response type this evaluation covers
    response_type: transcriptionMap[qIdx] ? 'audio' : 'written'
  };
});
```

---

## Zmienione pliki

| Plik | Zmiana |
|------|--------|
| `supabase/functions/process-pending-ai-evaluations/index.ts` | Dodanie: fetch audio_answers, transkrypcja, przekazanie do verify-open-answers, obsługa speaking_score |
| Nowa migracja SQL | Przebudowa obu triggerów: rozdzielenie nano_skill_ratings na written vs audio per question_index |

## Co NIE zmienia się

- `verify-open-answers` — już poprawnie obsługuje `audio_transcription`, `speaking_score`, `writing_score`
- `useInteractiveHomework.tsx` — submit homework flow już robi transkrypcję (linia 308-331)
- `buildItemEvaluations` w `masteryCalculator.ts` — już poprawnie mapuje `speaking_score` do nano_skills `.speaking.`
- Struktura tabel — bez zmian
- Welcome Test — bez zmian

## Odpowiedź na pytanie 2

**Czy transkrypcja się odbywa?**

- Przy **Submit Homework** — TAK (linia 308-331 w `useInteractiveHomework.tsx`), transkrypcja jest trzymana w pamięci (`transcriptionCache`) i przekazywana do `verify-open-answers`
- Przy **Create Homework / 10-min timer** (via `process-pending-ai-evaluations`) — NIE, to jest właśnie root cause problemu
- Transkrypcja NIE jest zapisywana w bazie (w odróżnieniu od Welcome Test, gdzie transkrypcja ląduje w `question_data.transcription`)

Po naprawie: `process-pending-ai-evaluations` będzie transkrybować audio i przekazywać je do `verify-open-answers`, które już umie oceniać speaking.

