

# Zaktualizowany Plan naprawy 4 problemów z Homework i Worksheet

## ZMIANA W PROBLEMIE 1: AI Evaluation przy zamykaniu karty worksheet

### Architektura rozwiązania

Ponieważ `beforeunload` nie pozwala na oczekiwanie na odpowiedź AI (przeglądarka może zamknąć kartę zanim AI odpowie), implementujemy **asynchroniczne przetwarzanie**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLOW: Zamknięcie karty worksheet                     │
└─────────────────────────────────────────────────────────────────────────────┘

STUDENT zamyka kartę
         │
         ▼
┌─────────────────────────────────────────────┐
│  sendBeacon → zapisz pending_ai_eval        │
│  do tabeli pending_worksheet_ai_evaluations │
└─────────────────────────────────────────────┘
         │
         ▼  (asynchronicznie)
┌─────────────────────────────────────────────┐
│  Cron job / Trigger wywołuje Edge Function  │
│  process-pending-ai-evaluations             │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  AI ocenia odpowiedzi                       │
│  → aktualizuje worksheet_student_answers    │
│  → trigger zapisuje do student_events       │
└─────────────────────────────────────────────┘
```

### Nowe elementy do stworzenia

#### 1. Nowa tabela: `pending_worksheet_ai_evaluations`

```sql
CREATE TABLE public.pending_worksheet_ai_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id UUID NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL,
  exercise_index INTEGER NOT NULL,
  exercise_type TEXT NOT NULL,
  answers JSONB NOT NULL,
  english_level TEXT,
  context JSONB, -- Dodatkowy kontekst dla AI (tytuł, transkrypcja, itp.)
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  
  UNIQUE(worksheet_id, student_email, exercise_index)
);

-- Index dla szybkiego pobierania pending
CREATE INDEX idx_pending_ai_eval_status ON pending_worksheet_ai_evaluations(status) WHERE status = 'pending';
```

#### 2. Nowa Edge Function: `process-pending-ai-evaluations`

Ta funkcja będzie:
1. Pobierać pending evaluations z tabeli
2. Wywoływać AI dla każdej
3. Aktualizować `worksheet_student_answers` z wynikami
4. Oznaczać jako completed

#### 3. Cron Job (pg_cron) lub Supabase Webhook

Można użyć:
- **Opcja A**: pg_cron co 30 sekund sprawdza pending
- **Opcja B**: Supabase realtime webhook przy INSERT
- **Opcja C**: Frontend teacher przy wejściu na worksheet sprawdza pending

**Rekomendacja**: Opcja C jest najprostsza - gdy nauczyciel wchodzi na worksheet, automatycznie sprawdzamy czy są pending AI evals dla tego studenta i je przetwarzamy.

---

## PLAN IMPLEMENTACJI

### Zmiana 1: Nowa tabela pending_worksheet_ai_evaluations

**Nowa migracja SQL:**

```sql
-- Create table for pending AI evaluations (async processing on tab close)
CREATE TABLE IF NOT EXISTS public.pending_worksheet_ai_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id UUID NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL,
  exercise_index INTEGER NOT NULL,
  exercise_type TEXT NOT NULL,
  answers JSONB NOT NULL,
  english_level TEXT DEFAULT 'Intermediate',
  context JSONB, -- Additional context for AI (title, transcript, etc.)
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  
  UNIQUE(worksheet_id, student_email, exercise_index)
);

-- Index for fast pending lookup
CREATE INDEX idx_pending_ai_eval_status ON pending_worksheet_ai_evaluations(status) WHERE status = 'pending';

-- RLS Policies
ALTER TABLE pending_worksheet_ai_evaluations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert (for sendBeacon)
CREATE POLICY "Allow insert for pending evaluations"
ON pending_worksheet_ai_evaluations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Teachers can read pending for their worksheets
CREATE POLICY "Teachers can read pending for their worksheets"
ON pending_worksheet_ai_evaluations FOR SELECT
TO authenticated
USING (
  worksheet_id IN (
    SELECT id FROM worksheets WHERE teacher_id = auth.uid()
  )
);

-- Service role can update
CREATE POLICY "Service role can update pending"
ON pending_worksheet_ai_evaluations FOR UPDATE
TO service_role
USING (true);
```

---

### Zmiana 2: Nowa RPC funkcja do zapisywania pending AI eval

**Plik: Nowa migracja SQL**

```sql
CREATE OR REPLACE FUNCTION public.queue_worksheet_ai_evaluation(
  p_worksheet_id UUID,
  p_student_email TEXT,
  p_exercise_index INTEGER,
  p_exercise_type TEXT,
  p_answers JSONB,
  p_english_level TEXT DEFAULT 'Intermediate',
  p_context JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO pending_worksheet_ai_evaluations (
    worksheet_id,
    student_email,
    exercise_index,
    exercise_type,
    answers,
    english_level,
    context,
    status
  )
  VALUES (
    p_worksheet_id,
    lower(p_student_email),
    p_exercise_index,
    p_exercise_type,
    p_answers,
    p_english_level,
    p_context,
    'pending'
  )
  ON CONFLICT (worksheet_id, student_email, exercise_index)
  DO UPDATE SET
    answers = EXCLUDED.answers,
    english_level = EXCLUDED.english_level,
    context = EXCLUDED.context,
    status = 'pending',
    created_at = NOW(),
    processed_at = NULL,
    error_message = NULL
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;
```

---

### Zmiana 3: Zaktualizować beforeunload w useInteractiveSharedWorksheet

**Plik: `src/hooks/useInteractiveSharedWorksheet.tsx`**

Zamiast usuwać AI verification, zaimplementować `sendBeacon` do zapisywania pending:

```typescript
// PROBLEM 1 FIX: AI verification on tab/window close using sendBeacon
useEffect(() => {
  const handleBeforeUnload = () => {
    // Iterate through all open-ended exercises with answers
    for (const exerciseIndexStr of Object.keys(answers)) {
      const exerciseIndex = parseInt(exerciseIndexStr);
      const exerciseType = exerciseTypesRef.current[exerciseIndex];
      const exerciseAnswers = answers[exerciseIndex];
      
      // Skip if no answers or not open-ended
      if (!exerciseAnswers || Object.keys(exerciseAnswers).length === 0) continue;
      if (!OPEN_ENDED_EXERCISE_TYPES.includes(exerciseType)) continue;
      
      // Get active time for this exercise
      const activeTimeMs = getActiveTimeMs(exerciseIndex);
      
      // 1. First save the answer itself (keepalive fetch)
      const saveData = {
        p_worksheet_id: worksheetId,
        p_student_email: studentEmail.trim().toLowerCase(),
        p_exercise_index: exerciseIndex,
        p_exercise_type: exerciseType,
        p_answers: exerciseAnswers,
        p_time_spent_ms: activeTimeMs
      };
      
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/save_worksheet_answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify(saveData),
        keepalive: true
      }).catch(() => {});
      
      // 2. Queue for AI evaluation using sendBeacon (more reliable for unload)
      const exercise = exercises[exerciseIndex];
      const queueData = {
        p_worksheet_id: worksheetId,
        p_student_email: studentEmail.trim().toLowerCase(),
        p_exercise_index: exerciseIndex,
        p_exercise_type: exerciseType,
        p_answers: exerciseAnswers,
        p_english_level: 'Intermediate', // TODO: get from worksheet data
        p_context: {
          title: exercise?.title || `Exercise ${exerciseIndex + 1}`,
          questions: exercise?.questions || exercise?.prompts || exercise?.sentences || exercise?.expressions || []
        }
      };
      
      // sendBeacon is more reliable than fetch for beforeunload
      const beaconUrl = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/queue_worksheet_ai_evaluation`;
      const beaconHeaders = {
        type: 'application/json'
      };
      const blob = new Blob([JSON.stringify(queueData)], beaconHeaders);
      
      // Add API key as query param since sendBeacon doesn't support headers
      navigator.sendBeacon(
        `${beaconUrl}?apikey=${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        blob
      );
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [answers, worksheetId, studentEmail, exercises, getActiveTimeMs]);
```

---

### Zmiana 4: Nowa Edge Function process-pending-ai-evaluations

**Plik: `supabase/functions/process-pending-ai-evaluations/index.ts`**

```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending evaluations (limit to avoid timeout)
    const { data: pendingEvals, error: fetchError } = await supabase
      .from('pending_worksheet_ai_evaluations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) throw fetchError;
    if (!pendingEvals || pendingEvals.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No pending evaluations' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[process-pending] Found ${pendingEvals.length} pending evaluations`);

    let processed = 0;
    for (const pending of pendingEvals) {
      try {
        // Mark as processing
        await supabase
          .from('pending_worksheet_ai_evaluations')
          .update({ status: 'processing' })
          .eq('id', pending.id);

        // Build answers for AI verification
        const answers = pending.answers;
        const context = pending.context || {};
        const questionItems = context.questions || [];
        
        const answersToVerify = Object.entries(answers).map(([qIdxStr, answer]) => {
          const qIdx = parseInt(qIdxStr);
          const questionItem = questionItems[qIdx];
          return {
            exercise_index: pending.exercise_index,
            question_index: qIdx,
            question_text: questionItem?.question || questionItem?.text || questionItem?.prompt || `Question ${qIdx + 1}`,
            student_answer: String(answer),
            suggested_answer: questionItem?.answer || questionItem?.suggested_answer || '',
            exercise_type: pending.exercise_type
          };
        });

        // Call verify-open-answers
        const verifyResponse = await fetch(`${supabaseUrl}/functions/v1/verify-open-answers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            answers: answersToVerify,
            english_level: pending.english_level,
            context: context.title
          })
        });

        if (!verifyResponse.ok) {
          throw new Error(`AI verification failed: ${await verifyResponse.text()}`);
        }

        const aiResult = await verifyResponse.json();
        
        // Build item_evaluations from AI result
        const itemEvaluations = aiResult.evaluations.map((e: any) => ({
          question_index: e.question_index,
          name: questionItems[e.question_index]?.nano_skill?.name || `question_${e.question_index}`,
          reason: questionItems[e.question_index]?.nano_skill?.reason || '',
          mastery: Math.round(e.quality_score * 100),
          hasValue: true
        }));

        const overallMastery = itemEvaluations.length > 0
          ? Math.round(itemEvaluations.reduce((sum: number, e: any) => sum + e.mastery, 0) / itemEvaluations.length)
          : null;

        // Update worksheet_student_answers with AI results
        await supabase
          .from('worksheet_student_answers')
          .update({
            item_evaluations: itemEvaluations,
            mastery: overallMastery
          })
          .eq('worksheet_id', pending.worksheet_id)
          .eq('student_email', pending.student_email)
          .eq('exercise_index', pending.exercise_index);

        // Mark as completed
        await supabase
          .from('pending_worksheet_ai_evaluations')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', pending.id);

        processed++;
        console.log(`[process-pending] Completed evaluation ${pending.id}`);

      } catch (evalError: any) {
        console.error(`[process-pending] Error processing ${pending.id}:`, evalError);
        await supabase
          .from('pending_worksheet_ai_evaluations')
          .update({ 
            status: 'failed',
            error_message: evalError.message,
            processed_at: new Date().toISOString()
          })
          .eq('id', pending.id);
      }
    }

    return new Response(
      JSON.stringify({ processed, total: pendingEvals.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[process-pending] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

### Zmiana 5: Wyzwalanie przetwarzania pending przy wejściu nauczyciela

**Plik: `src/hooks/useLiveSessionAnswers.tsx`** (lub gdzie nauczyciel ładuje dane worksheet)

Dodać wywołanie po załadowaniu:

```typescript
// Process any pending AI evaluations when teacher views worksheet
useEffect(() => {
  const processPendingAiEvals = async () => {
    try {
      await supabase.functions.invoke('process-pending-ai-evaluations');
      console.log('[LiveSession] Processed pending AI evaluations');
    } catch (error) {
      console.warn('[LiveSession] Failed to process pending AI evals:', error);
    }
  };
  
  // Call once when component mounts (teacher opens worksheet)
  processPendingAiEvals();
}, []);
```

---

## RESZTA PLANU (BEZ ZMIAN)

### PROBLEM 2.1 & 2.2: Naprawić mapowanie question_index w verify-open-answers

**Plik: `supabase/functions/verify-open-answers/index.ts`**

Linie 167-173 - użyć oryginalnych indeksów z requestu:

```typescript
evaluations = evaluations.map((e, idx) => ({
  exercise_index: answers[idx]?.exercise_index,
  question_index: answers[idx]?.question_index,  // ← ZMIANA: nie używaj e.question_index
  quality_score: Math.max(0, Math.min(1, e.quality_score || 0)),
  is_acceptable: e.is_acceptable ?? (e.quality_score >= 0.7),
  feedback: e.feedback || 'Thank you for your answer.'
}));
```

---

### PROBLEM 3: Dodać auto-resize do pól tekstowych

**Pliki:**
- `src/components/worksheet/ExerciseAnswerQuestions.tsx`
- `src/components/worksheet/ExerciseDialogue.tsx`
- `src/components/worksheet/ExerciseParaphrasing.tsx`
- `src/components/worksheet/ExerciseReading.tsx`
- `src/components/worksheet/ExerciseDescribe.tsx`
- `src/components/homework/HomeworkExerciseRenderer.tsx` (dla discussion)

Zamienić `<Input>` na auto-resizing `<textarea>`:

```tsx
<textarea
  value={studentAnswer || ''}
  onChange={(e) => {
    onAnswerChange?.(qIndex, e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  }}
  placeholder="Your answer..."
  className={`min-h-[40px] w-full border rounded px-3 py-2 resize-none overflow-hidden ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
  rows={1}
  disabled={disabled}
/>
```

---

### PROBLEM 4: Stworzyć mapę oficjalnych nazw typów ćwiczeń

**Plik: `supabase/functions/generateWorksheet/helpers.ts`**

```typescript
export const EXERCISE_TYPE_NAMES: Record<string, string> = {
  'reading': 'Reading Comprehension',
  'true-false': 'True/False Questions',
  'matching': 'Vocabulary Matching',
  'fill-in-blanks': 'Fill in the Blanks',
  'multiple-choice': 'Multiple Choice',
  'dialogue': 'Dialogue Practice',
  'answer-questions': 'Answer Questions',
  // ... wszystkie typy
};

export const getOfficialExerciseName = (type: string): string => {
  return EXERCISE_TYPE_NAMES[type] || type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};
```

**Plik: `supabase/functions/generateWorksheet/index.ts`** i **`src/utils/exerciseProcessor.ts`**

Użyć `getOfficialExerciseName()` przy budowaniu tytułu.

---

## PODSUMOWANIE LISTY PLIKÓW DO EDYCJI

| # | Plik/Akcja | Zmiana | Priorytet |
|---|------------|--------|-----------|
| 1 | **Nowa migracja SQL** | Tabela `pending_worksheet_ai_evaluations` + RPC | **KRYTYCZNY** |
| 2 | **Nowa Edge Function** | `process-pending-ai-evaluations` | **KRYTYCZNY** |
| 3 | `src/hooks/useInteractiveSharedWorksheet.tsx` | sendBeacon dla pending AI eval | **KRYTYCZNY** |
| 4 | `src/hooks/useLiveSessionAnswers.tsx` | Wyzwolenie przetwarzania pending | WYSOKI |
| 5 | `supabase/functions/verify-open-answers/index.ts` | Naprawić mapowanie question_index | **KRYTYCZNY** |
| 6 | Komponenty ćwiczeń (6 plików) | Auto-resize textarea | WYSOKI |
| 7 | `supabase/functions/generateWorksheet/helpers.ts` | EXERCISE_TYPE_NAMES | WYSOKI |
| 8 | `supabase/functions/generateWorksheet/index.ts` | Oficjalne nazwy | WYSOKI |
| 9 | `src/utils/exerciseProcessor.ts` | Oficjalne nazwy | WYSOKI |
| 10 | `docs/TECHNICAL_DOCUMENTATION.md` | Dokumentacja | NISKI |

---

## OCZEKIWANE REZULTATY

### PROBLEM 1 - AI Evaluation przy zamykaniu karty:
- Gdy student zamyka kartę, `sendBeacon` zapisuje "pending" do bazy
- Gdy nauczyciel wchodzi na worksheet (lub przy "Mark Done"), pending są przetwarzane
- Wyniki AI trafiają do `worksheet_student_answers.item_evaluations`
- Trigger automatycznie aktualizuje `student_events`

### PROBLEM 2.1 & 2.2 - Poprawne mapowanie AI:
- AI Evaluation wyświetla się pod poprawnym pytaniem
- Każde zadanie otwarte ma feedback

### PROBLEM 3 - Auto-resize:
- Pola tekstowe automatycznie rosną z treścią
- Brak scrollowania wewnątrz pola

### PROBLEM 4 - Nazwy ćwiczeń:
- `Exercise 1: Multiple Choice (Picture)` zamiast `Multiple choice picture`

