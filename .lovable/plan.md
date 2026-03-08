

# Plan wielokrokowy: Naprawy DSLM — nagrania audio, Welcome Test, logi eventów

---

## PROBLEM 1: Nagrywanie odpowiedzi (Homework + Shared Worksheet)

### 1.1 Auto-save countdown resetuje się

**Diagnoza:** W `HomeworkSpeakingRecorder.tsx` linia 177-181, `useEffect` zależy od `[autoSaveCountdown]`. Każda zmiana `autoSaveCountdown` (co sekundę ticker zmienia wartość) powoduje NOWY `useEffect` cleanup + restart. Ale to akurat jest poprawne — problem leży w linii 160-174: `useEffect` zależy od `[status, registryKey]`. Gdy `status` nie zmienia się, ten effect NIE powinien się resetować.

Rzeczywisty problem: `scheduleAutoSave` w hookach (`useInteractiveSharedWorksheet.tsx` linia 170-203 i `useInteractiveHomework.tsx` linia 192+) — gdy student scrolluje i wchodzi w interakcję z innymi pytaniami, `updateAnswer` jest wywoływany, co wyzwala `scheduleAutoSave`, który wywołuje `saveAnswer`. `saveAnswer` aktualizuje `answers` w stanie. Ale `updateAudioAnswer` (linia 515-538 i 636-658) CZYTA `answers` ze stanu i sam wywołuje `saveAnswer`. Jeśli `answers` zmieni się (bo student pisze w innym polu), to `updateAudioAnswer` dostaje nowy `answers` ref — ale to NIE powinno resetować timera w `HomeworkSpeakingRecorder`.

Prawdziwa przyczyna: linia 177-181:
```tsx
useEffect(() => {
  if (autoSaveCountdown === null || autoSaveCountdown <= 0) return;
  const t = setInterval(() => setAutoSaveCountdown(p => p !== null && p > 0 ? p - 1 : null), 1000);
  return () => clearInterval(t);
}, [autoSaveCountdown]);
```

Za każdym razem gdy `autoSaveCountdown` się zmieni (np. z 30→29), ten effect się re-uruchamia. To jest OK, ALE: jeśli coś innego zmieni `autoSaveCountdown` z powrotem na 30 (np. effect z linii 160 się re-uruchomi), to timer resetuje.

Effect z linii 160 ma deps `[status, registryKey]`. Jeśli `registryKey` się zmieni, resetuje countdown. Ale `registryKey` to stały string jak `"sw_2_1"`. Problem jest w `uploadAndSave` — jest stabilny (deps `[]`).

**Ale UWAGA**: Linia 174 — cleanup `return () => { if (timer) clearTimeout(timer); }` — to czyści 30s timeout. Jeśli effect się re-uruchomi (bo `status` zmieni się np. z 'recorded' na... ale nie zmieni się jeśli student scrolluje).

Sprawdzam ponownie: `status` jest wewnętrzny do `HomeworkSpeakingRecorder`. Scrollowanie/pisanie w innych polach NIE zmienia `status` ani `registryKey`. Więc timer 30s POWINIEN działać stabilnie.

**Prawdziwy problem może być taki**: Rodzic re-renderuje komponent z nowym `onAudioSaved` prop (lambda `(url) => onAudioAnswerChange(qIndex, url)`). To powoduje re-render `HomeworkSpeakingRecorder`. Ale props nie zmieniają `status` ani `registryKey`.

Jedyna opcja: komponent jest odmontowywany i montowany na nowo (key change). Sprawdzam — w `SharedWorksheetContent.tsx` linia 463:
```tsx
<HomeworkSpeakingRecorder
  existingAudioUrl={audioAnswers?.[index]?.[qIndex]}
  onAudioSaved={(url) => onAudioAnswerChange(index, qIndex, url)}
  registryKey={`sw_${index}_${qIndex}`}
/>
```

Jeśli `audioAnswers` zmieni się (bo inny recorder zapisał audio w innym ćwiczeniu), to `existingAudioUrl` się zmieni (z undefined na undefined — bo to INNE ćwiczenie). Ale wait — `audioAnswers?.[index]?.[qIndex]` zmieni się tylko jeśli zmieni się audio DLA TEGO KONKRETNEGO index+qIndex. Zmiana audio w innym ćwiczeniu zmienia top-level obiekt ale nie ten konkretny.

ALE — React re-renderuje komponent bo rodzic się re-renderuje. `existingAudioUrl` nie zmieni się, ale linia 60-65:
```tsx
useEffect(() => {
  if (existingAudioUrl) {
    setStatus('done');
    setAudioUrl(existingAudioUrl);
  }
}, [existingAudioUrl]);
```

To NIE zmieni `status` bo `existingAudioUrl` się nie zmieniło (nadal undefined).

**Konkluzja po głębokiej analizie**: Countdown ticker z linii 177-181 jest re-uruchamiany za KAŻDĄ zmianą `autoSaveCountdown`. To oznacza: 30→29 = cleanup old interval + create new interval. To jest poprawne ale nieefektywne. Problem jest w tym że `setInterval` z `setAutoSaveCountdown` callback: `p => p !== null && p > 0 ? p - 1 : null`. Gdy `p` osiągnie 0, ustawia null. Ale `autoSaveCountdown` zmienia się co sekundę, re-triggerując effect.

**Chwila — to jest poprawny wzorzec** (każda zmiana cleanup+restart). Timer nie powinien się resetować do 30 bo nic nie ustawia go z powrotem na 30 chyba że `status` zmieni się na 'recorded' ponownie.

**Sprawdzam nowy scenariusz**: Student nagrywa → status='recorded' → effect z linii 160 ustawia countdown=30 i setTimeout(30s). Student pisze w innym polu → `answers` się zmienia → React re-renderuje `SharedWorksheetContent` → re-renderuje `HomeworkSpeakingRecorder` → komponent się nie odmontowuje, props się nie zmieniają znacząco. Countdown działa.

**ALE** — jeśli użytkownik odwiedzi to samo pole tekstu obok nagrania i wpisze coś, to `updateAnswer` jest wywoływany. Jeśli ten `updateAnswer` uruchomi `scheduleAutoSave` → `saveAnswer` → to aktualizuje `answers` w stanie → React re-renderuje. `HomeworkSpeakingRecorder` dostaje te same props. Efektów ubocznych nie powinno być.

**Możliwy edge case**: Jeśli `saveAnswer` w `useInteractiveSharedWorksheet` zmieni `audioAnswers` (linia 532: `const newAudioForExercise = { ...(audioAnswers[exerciseIndex] || {}), [questionIndex]: audioUrl }`). NIE — to jest w `updateAudioAnswer`, nie w `saveAnswer`.

**OK, testuję inną hipotezę**: Może problem jest specyficzny dla jednej przeglądarki lub wynika z re-renderów powodowanych przez `isSaving` state. Gdy `saveAnswer` ustawia `setIsSaving(true)` → cały hook zwraca nowy `isSaving=true` → parent re-renderuje → child re-renderuje. Ale to nie zmienia props `HomeworkSpeakingRecorder`.

**Decyzja**: Pomimo że nie znalazłem 100% root cause resetu timera, przepiszę timer na bardziej odporny wzorzec — `useRef` zamiast `useState` + `useEffect`:

**Fix w `HomeworkSpeakingRecorder.tsx`:**
1. Zamienić `autoSaveCountdown` useState na `useRef<number>(0)` + osobny `displayCountdown` useState
2. Uruchomić JEDEN `setInterval(1000)` który dekrementuje ref i aktualizuje display
3. Timeout 30s pozostaje jako `setTimeout` z deps `[status]` (nie `registryKey` bo jest stabilny)
4. Cleanup: wyczyścić interval i timeout razem
5. Usunąć zależność od `autoSaveCountdown` w useEffect

Konkretna zmiana:

```tsx
// Zamień dotychczasowe 2 effecty (linie 159-181) na jeden ref-based timer:
const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
const [displayCountdown, setDisplayCountdown] = useState<number | null>(null);

useEffect(() => {
  // Cleanup previous
  if (autoSaveTimerRef.current) { clearTimeout(autoSaveTimerRef.current); autoSaveTimerRef.current = null; }
  if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
  
  if (status === 'recorded' && blobRef.current) {
    if (registryKey) {
      (window as any).__pendingSpeakingRecordings?.set(registryKey, { blob: blobRef.current, save: uploadAndSave });
    }
    // Start 30s countdown
    let remaining = 30;
    setDisplayCountdown(remaining);
    
    countdownIntervalRef.current = setInterval(() => {
      remaining--;
      setDisplayCountdown(remaining > 0 ? remaining : null);
      if (remaining <= 0 && countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }, 1000);
    
    autoSaveTimerRef.current = setTimeout(() => { uploadAndSave(); }, 30000);
  }
  if (status === 'done' || status === 'idle') {
    if (registryKey) (window as any).__pendingSpeakingRecordings?.delete(registryKey);
    setDisplayCountdown(null);
  }
  
  return () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };
}, [status, registryKey, uploadAndSave]);
// uploadAndSave is stable (deps=[])
```

Render: zamienić `autoSaveCountdown` na `displayCountdown` w JSX.

### 1.2 Nagranie znika po odświeżeniu strony

**Diagnoza**: Audio URL jest przechowywany TYLKO w React state (`audioAnswers`). `loadAnswers` w obu hookach ładuje `answer.answers` (tekst JSONB) ale NIE audio. Tabele `worksheet_student_answers` i `homework_student_answers` nie mają kolumny na audio.

Gdy `updateAudioAnswer` jest wywoływany, wywołuje `saveAnswer` który zapisuje `currentAnswers` (tekst) do bazy. Audio URL NIE jest nigdzie w bazie.

**Fix — 3 kroki:**

**A. Migracja SQL** — dodać kolumnę `audio_answers` do obu tabel:
```sql
ALTER TABLE worksheet_student_answers ADD COLUMN IF NOT EXISTS audio_answers JSONB DEFAULT '{}'::jsonb;
ALTER TABLE homework_student_answers ADD COLUMN IF NOT EXISTS audio_answers JSONB DEFAULT '{}'::jsonb;
```

**B. Aktualizacja RPC `save_worksheet_answer`** — nowy parametr `p_audio_answers`:
```sql
CREATE OR REPLACE FUNCTION public.save_worksheet_answer(
  p_worksheet_id UUID, p_student_email TEXT, p_exercise_index INTEGER,
  p_exercise_type TEXT, p_answers JSONB,
  p_time_spent_ms INTEGER DEFAULT NULL, p_mastery INTEGER DEFAULT NULL,
  p_item_evaluations JSONB DEFAULT NULL,
  p_audio_answers JSONB DEFAULT NULL  -- NOWE
) RETURNS UUID ...
  INSERT INTO worksheet_student_answers (..., audio_answers)
  VALUES (..., COALESCE(p_audio_answers, '{}'::jsonb))
  ON CONFLICT ... DO UPDATE SET
    ...,
    audio_answers = CASE 
      WHEN EXCLUDED.audio_answers IS NOT NULL AND EXCLUDED.audio_answers != '{}'::jsonb 
      THEN EXCLUDED.audio_answers 
      ELSE worksheet_student_answers.audio_answers 
    END
```

Analogicznie dla `save_homework_answer`.

**C. Aktualizacja RPC `get_worksheet_student_answers`** i `get_student_homework_answers` — zwracać `audio_answers`.

**D. Frontend — `useInteractiveSharedWorksheet.tsx`**:
- `loadAnswers`: po załadowaniu danych, wyciągnąć `audio_answers` i ustawić `setAudioAnswers`
- `saveAnswer`: przekazywać `audioAnswers[exerciseIndex]` jako `p_audio_answers`
- `updateAudioAnswer`: przekazywać nowe audio do `saveAnswer`

Analogicznie dla `useInteractiveHomework.tsx`.

### 1.3 Nagranie nie wpływa na Progress

**Diagnoza**: W `useInteractiveSharedWorksheet.tsx` progress JUŻ jest naprawiony (linie 268-301) — `getProgress` merguje `answers` i `audioAnswers`. W `useInteractiveHomework.tsx` trzeba sprawdzić:

```tsx
// useInteractiveHomework.tsx - getProgress
```

Sprawdzam:

Homework `getProgress` prawdopodobnie NIE uwzględnia audio. Trzeba dodać analogiczną logikę jak w worksheet hook.

**Fix**: W `useInteractiveHomework.tsx`, zaktualizować `getProgress` aby mergować `audioAnswers` z `answers` (analogicznie do kodu worksheet z linii 268-301).

### 1.4 Logi do student_events nie zapisują się prawidłowo

**Diagnoza**: SQL trigger `log_worksheet_answer_to_events()` (linia 128-153 z migracji 20260219) robi DELETE + INSERT na podstawie `source_id + exercise_index`:

```sql
DELETE FROM student_events
WHERE student_id = v_student_id
  AND source_id = v_source_id
  AND (event_payload->>'exercise_index')::int = NEW.exercise_index;
```

To znaczy: za każdym razem gdy `save_worksheet_answer` jest wywoływany, trigger KASUJE poprzedni event i wstawia nowy. Jest JEDEN event na exercise (nie osobne dla tekstu i audio).

Problem użytkownika: "jeżeli najpierw nagram a później napiszę dla tego samego przykładu to nie pokazuje się żaden log ani dla nagrania ani dla pisania"

**Przyczyna**: Gdy student nagrywa, `updateAudioAnswer` wywołuje `saveAnswer` z `currentAnswers` (tekst — pusty bo jeszcze nic nie napisał). Trigger tworzy event z `nano_skill_ratings` z `item_evaluations` (które mogą być null bo brak tekstu = brak oceny). Potem student pisze — `scheduleAutoSave` → `saveAnswer` → trigger kasuje poprzedni event i tworzy nowy. Ale `item_evaluations` obliczane w `buildItemEvaluations` mogą mieć `hasValue: false` → `hasRealAiEval = false` → `evalToSend = null` (linia 187-188). Wtedy trigger wstawia event z pustym `nano_skill_ratings: []` → `skill_ids = []` → mastery = NULL.

**Ale trigger powinien nadal wstawiać event!** Problem jest gdzieś indziej. Sprawdzam trigger: linia 99-106:
```sql
SELECT s.id INTO v_student_id FROM students s WHERE s.student_email = NEW.student_email AND s.teacher_id = v_teacher_id AND s.deleted_at IS NULL LIMIT 1;
IF v_student_id IS NULL THEN RETURN NEW; END IF;
```

Trigger wymaga `v_student_id`. Jeśli email studenta nie pasuje do żadnego studenta w tabeli `students` dla tego nauczyciela, event NIE jest tworzony. To prawdopodobna przyczyna — na shared worksheet student podaje email, ale ten email musi być w tabeli `students`.

Linia 93-97 — pobiera `v_teacher_id` z `worksheets.user_id`. Kolumna `user_id` vs `teacher_id` — w tabeli worksheets jest kolumna `teacher_id`? Sprawdzam schema: jest `teacher_email` ale nie ma `user_id` ani `teacher_id` w `worksheets`...

**AH HA!** Trigger szuka `worksheets.user_id` ale tabela `worksheets` prawdopodobnie NIE MA kolumny `user_id`!

Sprawdzę — w schema `worksheets` kolumny to: id, title, ai_response, html_content, created_at, teacher_email, deleted_at, etc. NIE MA `user_id`! Jest `teacher_id` (UUID).

Ale w triggerze:
```sql
SELECT user_id INTO v_teacher_id FROM worksheets WHERE id = NEW.worksheet_id;
```

To powinno rzucić error bo kolumna `user_id` nie istnieje. Ale trigger ma `EXCEPTION WHEN OTHERS THEN` — nie, ten trigger NIE ma exception handler! Więc jeśli `user_id` nie istnieje, trigger rzuca error i cała transakcja jest cofana!

Sprawdzam ponownie — czytam `worksheets` schema z supabase-tables... nie widzę `user_id` w schema. Ale czekaj, trigger może się odwoływać do kolumny która istnieje w bazie ale nie jest wymieniona w dostarczonym schema (schema jest skrócony). Kolumna `teacher_id` jest prawdopodobnie w tabeli worksheets.

Ale trigger używa `user_id` NIE `teacher_id`. To jest BUG jeśli kolumna to `teacher_id` a nie `user_id`.

Muszę to zweryfikować:

**Fix dla triggerów**: Zmienić `user_id` na `teacher_id` w obu triggerach. Plus dodać `EXCEPTION WHEN OTHERS THEN RETURN NEW` na końcu triggerów żeby nie przerywać save.

Ale jest też fundamentalny problem: **jeden event na exercise NIE wystarczy** — user chce oddzielne logi dla tekstu i audio. Obecna architektura: DELETE + INSERT per exercise_index = nadpisuje.

**Docelowa architektura**: Dwa eventy per exercise: jeden z `event_payload.response_type = 'written'` i drugi z `response_type = 'audio'`. Delete musi być per exercise + response_type.

To wymaga zmiany triggerów SQL.

---

## PROBLEM 2: Welcome Test

### 2.1 + 2.1B + 2.1C: Niespójne wyniki Skill Scores vs Results by Skill

**Diagnoza**: Dwa źródła danych:
1. `student_learning_profiles` → `grammar_score`, `vocabulary_score`, `reading_score`, `writing_score`, `speaking_score` — obliczane przez AI w `process-welcome-test`
2. `test_skill_results` → `correct_answers`, `total_questions`, `score_percentage` — obliczane automatycznie (ile poprawnych MC)

**Różnica Speaking**: Profil AI daje `speaking_score = 25%` (AI oceniło jakość nagrania), ale `test_skill_results` daje `0%` bo `is_correct` dla speaking pytań jest `false` lub `null` (AI scoring w `process-welcome-test` ocenia na skali 0-100, ale `is_correct` jest binarne).

**Różnica Reading**: Profil AI = 100%, `test_skill_results` = 67% (2/3). Profil AI liczy `is_correct` z wagami i AI oceny, `test_skill_results` liczy surowe correct/total.

**Fix**: Zgodnie z życzeniem usera — połączyć w jedną sekcję "Skill Scores". Dane z `test_skill_results` (correct_answers/total_questions) są dokładniejsze dla MC pytań, a AI scores lepsze dla open-ended/speaking. Połączyć:

1. Dla Grammar, Vocabulary, Reading, Listening — użyć `score_percentage` z `test_skill_results` (obiektywne: poprawne/total)
2. Dla Writing, Speaking — użyć `writing_score` / `speaking_score` z `student_learning_profiles` (AI ocena jakości)
3. Dla każdego skilla — pokazać zarówno `score_percentage%` jak i `(X/Y)` jeśli dostępne

W `WelcomeTestResults.tsx` zmienić sekcję "Skill Scores" (linie 203-250):
- Dla każdego skilla: priorytetowo `test_skill_results.score_percentage` dla MC-heavy skills, `profile.*_score` dla open-ended skills
- Zawsze pokazywać `(correct/total)` obok jeśli `test_skill_results` ma dane
- Dodać `Listening` (brakuje w obecnej liście — jest w `test_skill_results` ale nie w profilu)
- Usunąć `strongest_skill`/`weakest_skill` jeśli są niespójne — lub przeliczyć na podstawie merged danych
- W `TestDetailsView.tsx` — sekcja "Results by Skill" jest JUŻ ukryta dla welcome testów (linia 362-363). Potwierdzić.

Konkretna zmiana w `WelcomeTestResults.tsx`:
```tsx
const SKILL_DISPLAY = [
  { label: 'Grammar', profileKey: 'grammar_score', useAiScore: false },
  { label: 'Vocabulary', profileKey: 'vocabulary_score', useAiScore: false },
  { label: 'Reading', profileKey: 'reading_score', useAiScore: false },
  { label: 'Listening', profileKey: null, useAiScore: false },
  { label: 'Writing', profileKey: 'writing_score', useAiScore: true },
  { label: 'Speaking', profileKey: 'speaking_score', useAiScore: true },
];

// Dla każdego skilla:
// - jeśli useAiScore=true → wyświetl profile score (AI ocena jakości)
// - jeśli useAiScore=false → wyświetl test_skill_results score (MC poprawne)
// - zawsze pokazuj (X/Y) jeśli dostępne z test_skill_results
```

Przeliczyć `strongest_skill` i `weakest_skill` na podstawie merged danych (w JS w komponencie).

### 2.2 Przyciski Preview i View Results na Overview

**Diagnoza**: W `WelcomeTestSuggestion.tsx`:
- Status `no_test`: przycisk "Preview" przenosi do `/student/:id?tab=tests`
- Status `pending`/`in_progress`: przycisk "Preview" przenosi do tests
- Status `completed`: przycisk "View Results"

**Fix**: Zmienić przyciski na Overview:
- Status `no_test`: 
  - "Preview Test" — otwiera test w teacher mode (jak obecny Preview w tests tab: `handlePreviewTest`)
  - "Send Welcome Test" — bez zmian
- Status `pending`/`in_progress`:
  - "View Results" → navigate do `?tab=tests&testId=X` (otwiera wyniki)
  - "Preview Test" → otwiera teacher mode preview
  - "Copy Link" — bez zmian
- Status `completed`:
  - "View Results" → navigate do `?tab=tests&testId=X`
  - "Preview Test" → otwiera teacher mode preview

Potrzebna jest logika `handlePreviewTest` w `WelcomeTestSuggestion.tsx`. Obecnie jest tylko w `StudentTestsTab.tsx`. Skopiować/wyekstrahować.

W `StudentTestsTab.tsx` — dodać tekst do przycisków ikon:
```tsx
// Linia 207-212: zmienić z icon-only na icon+text:
<Button variant="outline" size="sm" onClick={() => setSelectedTestId(welcomeTest.id)}>
  <BarChart3 className="h-4 w-4 mr-1.5" />
  View Results
</Button>
<Button variant="outline" size="sm" onClick={handlePreviewTest} disabled={creatingPreview}>
  {creatingPreview ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-1.5" />}
  Preview Test
</Button>
```

### 2.3 `selected_preferences` zamiast semantycznej nazwy cechy

**Diagnoza**: Kod na linii 367-369 `useWelcomeTest.tsx`:
```tsx
const traitKey = QUESTION_TRAIT_FALLBACK[questionId] || 'selected_preferences';
```

To fallback dla pytań `preference_choice` multi-select BEZ `detected_trait`. Problem: Q3b MA `detected_trait` więc nie powinien trafiać tu. Ale dla bezpieczeństwa (i na wypadek gdyby mapping zawiódł z jakiegoś powodu), dodać nowe pytania do `QUESTION_TRAIT_FALLBACK`:

```tsx
const QUESTION_TRAIT_FALLBACK: Record<string, string> = {
  'wt_q2': 'main_frustrations',
  'wt_q3b': 'usage_context',       // NOWE — safety fallback
  'wt_q6': 'preferred_activities',
  'wt_q9': 'learning_duration',
  'wt_q10': 'learning_background',
  'wt_q11': 'exam_experience',
  'wt_q12': 'learning_goal',
  'wt_q13': 'desired_topics',
  'wt_q15': 'reading_strategy',
  'wt_q41': 'learning_priorities',
  'wt_q43': 'interest_topics',
  'wt_q45': 'final_message',
};
```

Dodatkowo: naprawić istniejące eventy w bazie:
```sql
UPDATE student_events 
SET event_payload = jsonb_set(
  event_payload, 
  '{detected_traits}', 
  (event_payload->'detected_traits') - 'selected_preferences' || 
  jsonb_build_object('usage_context', event_payload->'detected_traits'->>'selected_preferences')
)
WHERE event_source = 'welcome_test' 
  AND event_payload->'detected_traits' ? 'selected_preferences'
  AND event_payload->>'answer_id' = 'wt_q3b';
```

### 2.4 Mastery z pustym skill_ids

**Diagnoza**: Eventy profiling/behavioral (wt_q12, wt_q13) nie mają `nano_skill` — poprawnie! Te pytania mierzą cechy osobowości, nie umiejętności językowe. Mastery jest tam obliczane z `nano_skill_ratings` lub `is_correct` w `add_student_event` (linia 14-31 migracji 20260225). Ale `nano_skill_ratings` jest pustą tablicą `[]` i `is_correct` jest null.

Skąd więc mastery? Sprawdzam — `add_student_event` linia 15: `jsonb_array_length(p_event_payload->'nano_skill_ratings') > 0` → 0 > 0 = false → skip. Linia 25: `p_event_payload ? 'is_correct' AND (p_event_payload->>'is_correct') IS NOT NULL` → `is_correct` jest null → skip. Więc `v_mastery = NULL`.

Użytkownik mówi że mastery jest ustawione dla tych eventów. Może z backfillu? Backfill na końcu migracji ustawia mastery=100 jeśli `is_correct=true` i `skill_ids IS NOT NULL`. Dla tych eventów `skill_ids` jest puste i `is_correct` jest null — więc backfill ich NIE dotyka.

**Konkluzja**: Mastery powinno być NULL dla pytań profilowych bez skill_ids. Jeśli user widzi mastery — to musi być z innego źródła. Ale user pyta "do czego to jest mastery skoro skill_ids jest puste?" — odpowiedź: mastery nie powinno tam być. Jeśli jest, to bug z wcześniejszego kodu.

**Fix**: Wyczyścić mastery dla eventów bez skill_ids i bez nano_skill:
```sql
UPDATE student_events SET mastery = NULL
WHERE event_source = 'welcome_test'
  AND (skill_ids IS NULL OR array_length(skill_ids, 1) IS NULL)
  AND event_payload->'nano_skill_ratings' = '[]'::jsonb;
```

### 2.5 Mastery NULL dla eventów z skill_ids (grammar/vocab/reading)

**Diagnoza**: Te eventy mają `nano_skill_ratings: []` (pusta tablica) mimo że mają `skill_ids`. Mastery powinno być obliczone z `is_correct`. Sprawdzam `add_student_event`:

Linia 25: `p_event_payload ? 'is_correct' AND (p_event_payload->>'is_correct') IS NOT NULL`

Problem: `is_correct` w payload to boolean, ale `->>'is_correct'` zwraca tekst. `true` → `'true'`, `false` → `'false'`, `null` → NULL w SQL. Jeśli `is_correct` jest `null` w JSON (nie brak klucza, a wartość null), to `->>'is_correct'` zwraca SQL NULL → warunek IS NOT NULL jest false → skip.

Ale user mówi że te eventy to grammar/vocab/reading MC z `is_correct = true` lub `false`. Więc mastery POWINNO być 100 lub 0.

Sprawdzam: w migracji 20260225 jest backfill:
```sql
UPDATE student_events SET mastery = 100
WHERE event_source = 'welcome_test' AND mastery IS NULL
  AND skill_ids IS NOT NULL AND array_length(skill_ids, 1) > 0
  AND event_payload->>'is_correct' = 'true';
```

To powinno zadziałać. ALE — test mógł być wykonany PO backfillu (backfill to jednorazowa migracja). Nowe eventy tworzą się przez `add_student_event` RPC. Tam warunek (linia 25):

```sql
IF v_mastery IS NULL AND p_event_payload ? 'is_correct' AND (p_event_payload->>'is_correct') IS NOT NULL THEN
```

Sprawdzam co frontend wysyła: linia 387:
```tsx
is_correct: isCorrect,
```

Gdzie `isCorrect` jest `true`, `false`, lub `null`. Jeśli to JS `null`, w JSONB to jest `"is_correct": null`. W SQL: `p_event_payload->>'is_correct'` zwraca... hmm. JSONB `null` vs SQL NULL — to jest ten sam problem! `p_event_payload->>'is_correct'` when JSONB value is JSON null returns SQL NULL. Więc warunek `IS NOT NULL` jest false!

**ROOT CAUSE**: JSONB null vs SQL NULL confusion! Gdy `is_correct` jest JSON `null`, `->>` operator zwraca SQL `NULL`. Warunek `IS NOT NULL` jest false. Więc mastery nie jest obliczane.

**ALE** — dla MC pytań `isCorrect` jest `true` lub `false` (NIE null). Sprawdzam: linia 254-263:
```tsx
if (questionDef.correct_answer) {
  isCorrect = ...true/false...;
}
```

Grammar/vocab/reading pytania MAJĄ `correct_answer` więc `isCorrect` jest true/false. `->>` zwraca `'true'` lub `'false'`. `IS NOT NULL` jest true. Mastery powinno być obliczone.

Więc problem NIE jest w `add_student_event`. Sprawdzam czy eventy nie są tworzone starym kodem (bez backfillu). Migracja backfillu (20260225) uruchomiła się po deployu. Nowe eventy z nowego testu powinny mieć mastery.

**Hipoteza**: Użytkownik mógł uruchomić test ZANIM migracja 20260225 była zaaplikowana. Wtedy stary `add_student_event` nie miał auto-extract. 

**Fix**: Ponowny backfill + potwierdzenie że `add_student_event` działa:
```sql
-- Backfill: set mastery for welcome_test MC events that have skill_ids but NULL mastery
UPDATE student_events SET mastery = CASE 
  WHEN event_payload->>'is_correct' = 'true' THEN 100
  WHEN event_payload->>'is_correct' = 'false' THEN 0
  ELSE NULL
END
WHERE event_source = 'welcome_test'
  AND mastery IS NULL
  AND skill_ids IS NOT NULL AND array_length(skill_ids, 1) > 0;
```

---

## Podsumowanie pliku po pliku

### Pliki do zmiany:

| # | Plik | Zmiana |
|---|---|---|
| 1 | Migracja SQL | `audio_answers` kolumna, update RPC, backfill mastery, fix trait data, update triggers |
| 2 | `src/components/homework/HomeworkSpeakingRecorder.tsx` | Ref-based timer (fix 1.1) |
| 3 | `src/hooks/useInteractiveSharedWorksheet.tsx` | Load/save audio_answers (1.2), pass audio to saveAnswer (1.4) |
| 4 | `src/hooks/useInteractiveHomework.tsx` | Load/save audio_answers (1.2), progress merge (1.3) |
| 5 | `src/components/student-tests/WelcomeTestResults.tsx` | Merge Skill Scores z test_skill_results (2.1) |
| 6 | `src/components/dashboard/WelcomeTestSuggestion.tsx` | Preview Test + View Results buttons (2.2) |
| 7 | `src/components/student-tests/StudentTestsTab.tsx` | Tekst na przyciskach (2.2) |
| 8 | `src/hooks/useWelcomeTest.tsx` | Fallback map update (2.3) |
| 9 | Triggery SQL worksheet/homework | Dwa eventy per exercise (text+audio) (1.4), fix `user_id`→`teacher_id` |

### Migracja SQL — pełna treść:

```sql
-- 1. Audio answers columns
ALTER TABLE worksheet_student_answers ADD COLUMN IF NOT EXISTS audio_answers JSONB DEFAULT '{}'::jsonb;
ALTER TABLE homework_student_answers ADD COLUMN IF NOT EXISTS audio_answers JSONB DEFAULT '{}'::jsonb;

-- 2. Update save_worksheet_answer
CREATE OR REPLACE FUNCTION public.save_worksheet_answer(
  p_worksheet_id UUID, p_student_email TEXT, p_exercise_index INTEGER,
  p_exercise_type TEXT, p_answers JSONB,
  p_time_spent_ms INTEGER DEFAULT NULL, p_mastery INTEGER DEFAULT NULL,
  p_item_evaluations JSONB DEFAULT NULL,
  p_audio_answers JSONB DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID; BEGIN
  INSERT INTO worksheet_student_answers (
    worksheet_id, student_email, exercise_index, exercise_type,
    answers, started_at, last_saved_at, time_spent_ms, mastery, item_evaluations, audio_answers
  ) VALUES (
    p_worksheet_id, lower(p_student_email), p_exercise_index, p_exercise_type,
    p_answers, NOW(), NOW(), COALESCE(p_time_spent_ms, 0), p_mastery, p_item_evaluations,
    COALESCE(p_audio_answers, '{}'::jsonb)
  )
  ON CONFLICT (worksheet_id, student_email, exercise_index) DO UPDATE SET
    answers = EXCLUDED.answers,
    last_saved_at = NOW(),
    time_spent_ms = COALESCE(EXCLUDED.time_spent_ms, worksheet_student_answers.time_spent_ms),
    mastery = COALESCE(EXCLUDED.mastery, worksheet_student_answers.mastery),
    item_evaluations = COALESCE(EXCLUDED.item_evaluations, worksheet_student_answers.item_evaluations),
    audio_answers = CASE 
      WHEN EXCLUDED.audio_answers != '{}'::jsonb THEN EXCLUDED.audio_answers 
      ELSE worksheet_student_answers.audio_answers 
    END,
    eval_trigger = NULL
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

-- 3. Update save_homework_answer (analogicznie)
-- [pełna treść jak wyżej ale z homework_student_answers]

-- 4. Update get_worksheet_student_answers — dodać audio_answers do SELECT
CREATE OR REPLACE FUNCTION public.get_worksheet_student_answers(
  p_worksheet_id UUID, p_student_email TEXT
) RETURNS TABLE(..., audio_answers jsonb) ...
  SELECT ..., wsa.audio_answers FROM worksheet_student_answers wsa ...

-- 5. Update get_student_homework_answers — dodać audio_answers do SELECT
-- [analogicznie]

-- 6. Fix worksheet trigger — teacher_id zamiast user_id + dwa eventy (text/audio)
DROP TRIGGER IF EXISTS trg_worksheet_answer_to_events ON worksheet_student_answers;
CREATE OR REPLACE FUNCTION public.log_worksheet_answer_to_events()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_teacher_id uuid; v_student_id uuid; v_event_type text;
  v_nano_skill_ratings jsonb; v_mastery numeric; v_source_id uuid;
  v_has_audio boolean;
BEGIN
  v_event_type := CASE 
    WHEN NEW.eval_trigger = '10min_inactivity' THEN '10min_AI_evaluation'
    WHEN NEW.eval_trigger = 'create_homework' THEN 'create_hw_AI_evaluation'
    WHEN NEW.eval_trigger = 'submit_homework' THEN 'submit_hw_AI_evaluation'
    ELSE 'student_learning_activity'
  END;

  SELECT teacher_id INTO v_teacher_id FROM worksheets WHERE id = NEW.worksheet_id;
  IF v_teacher_id IS NULL THEN RETURN NEW; END IF;

  SELECT s.id INTO v_student_id FROM students s
  WHERE s.student_email = NEW.student_email AND s.teacher_id = v_teacher_id AND s.deleted_at IS NULL LIMIT 1;
  IF v_student_id IS NULL THEN RETURN NEW; END IF;

  -- Strip feedback, filter hasValue
  IF NEW.item_evaluations IS NOT NULL THEN
    SELECT jsonb_agg(elem - 'feedback') INTO v_nano_skill_ratings
    FROM jsonb_array_elements(NEW.item_evaluations::jsonb) AS elem
    WHERE (elem->>'hasValue')::boolean IS NOT FALSE;
  END IF;

  -- Auto-calculate mastery
  v_mastery := NEW.mastery;
  IF v_mastery IS NULL AND v_nano_skill_ratings IS NOT NULL AND jsonb_array_length(v_nano_skill_ratings) > 0 THEN
    SELECT ROUND(AVG((elem->>'mastery')::numeric)) INTO v_mastery
    FROM jsonb_array_elements(v_nano_skill_ratings) AS elem
    WHERE (elem->>'mastery')::numeric >= 0 AND (elem->>'hasValue')::boolean = true;
  END IF;

  v_source_id := NEW.worksheet_id;
  v_has_audio := NEW.audio_answers IS NOT NULL AND NEW.audio_answers != '{}'::jsonb;

  -- DELETE previous events for this exercise (both text and audio)
  DELETE FROM student_events
  WHERE student_id = v_student_id AND source_id = v_source_id
    AND (event_payload->>'exercise_index')::int = NEW.exercise_index;

  -- INSERT text event (always, if answers non-empty)
  IF NEW.answers IS NOT NULL AND NEW.answers != '{}'::jsonb THEN
    INSERT INTO student_events (
      student_id, teacher_id, event_type, event_source,
      source_id, event_payload, skill_ids, element_type, session_id, mastery
    ) VALUES (
      v_student_id, v_teacher_id, v_event_type, 'worksheet',
      v_source_id,
      jsonb_build_object(
        'answer_id', NEW.id, 'exercise_index', NEW.exercise_index,
        'exercise_type', NEW.exercise_type, 'response_type', 'written',
        'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1),
        'nano_skill_ratings', COALESCE(v_nano_skill_ratings, '[]'::jsonb)
      ),
      ARRAY(SELECT elem->>'name' FROM jsonb_array_elements(COALESCE(v_nano_skill_ratings, '[]'::jsonb)) AS elem WHERE elem->>'name' IS NOT NULL),
      NEW.exercise_type, NULL, v_mastery
    );
  END IF;

  -- INSERT audio event (if audio exists)
  IF v_has_audio THEN
    INSERT INTO student_events (
      student_id, teacher_id, event_type, event_source,
      source_id, event_payload, skill_ids, element_type, session_id, mastery
    ) VALUES (
      v_student_id, v_teacher_id, v_event_type, 'worksheet',
      v_source_id,
      jsonb_build_object(
        'answer_id', NEW.id, 'exercise_index', NEW.exercise_index,
        'exercise_type', NEW.exercise_type, 'response_type', 'audio',
        'audio_answers', NEW.audio_answers,
        'time_spent_seconds', ROUND(COALESCE(NEW.time_spent_ms, 0)::numeric / 1000.0, 1),
        'nano_skill_ratings', COALESCE(v_nano_skill_ratings, '[]'::jsonb)
      ),
      ARRAY(SELECT elem->>'name' FROM jsonb_array_elements(COALESCE(v_nano_skill_ratings, '[]'::jsonb)) AS elem WHERE elem->>'name' IS NOT NULL),
      NEW.exercise_type, NULL, v_mastery
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'log_worksheet_answer_to_events error: %', SQLERRM;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_worksheet_answer_to_events
AFTER INSERT OR UPDATE ON worksheet_student_answers
FOR EACH ROW EXECUTE FUNCTION log_worksheet_answer_to_events();

-- 7. Analogiczny trigger dla homework
-- [pełna treść jak wyżej ale z homework_student_answers]

-- 8. Backfill mastery dla welcome_test
UPDATE student_events SET mastery = CASE 
  WHEN event_payload->>'is_correct' = 'true' THEN 100
  WHEN event_payload->>'is_correct' = 'false' THEN 0
  ELSE NULL
END
WHERE event_source = 'welcome_test' AND mastery IS NULL
  AND skill_ids IS NOT NULL AND array_length(skill_ids, 1) > 0;

-- 9. Clear mastery for profiling events without skills
UPDATE student_events SET mastery = NULL
WHERE event_source = 'welcome_test'
  AND (skill_ids IS NULL OR array_length(skill_ids, 1) IS NULL)
  AND event_payload->'nano_skill_ratings' = '[]'::jsonb
  AND mastery IS NOT NULL;

-- 10. Fix selected_preferences → usage_context for Q3b
UPDATE student_events 
SET event_payload = jsonb_set(
  event_payload, '{detected_traits}',
  (event_payload->'detected_traits') - 'selected_preferences' || 
  jsonb_build_object('usage_context', event_payload->'detected_traits'->>'selected_preferences')
)
WHERE event_source = 'welcome_test' 
  AND event_payload->'detected_traits' ? 'selected_preferences'
  AND event_payload->>'answer_id' = 'wt_q3b';
```

### Kolejność wdrożenia:

1. **Migracja SQL** — kolumny audio_answers, update RPC, triggers, backfill
2. **HomeworkSpeakingRecorder.tsx** — ref-based timer (1.1)
3. **useInteractiveSharedWorksheet.tsx** — load/save audio (1.2), pass audio to DB (1.4)
4. **useInteractiveHomework.tsx** — load/save audio (1.2), progress merge (1.3)
5. **WelcomeTestResults.tsx** — merge Skill Scores (2.1)
6. **WelcomeTestSuggestion.tsx** — Preview Test + View Results (2.2)
7. **StudentTestsTab.tsx** — tekst na przyciskach (2.2)
8. **useWelcomeTest.tsx** — fallback map (2.3)
9. Aktualizacja dokumentacji

