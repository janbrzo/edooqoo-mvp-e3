

# Plan wdrozenia - Problemy 1-5

## ANALIZA GLEBOOKA - WYNIKI

### Problem 1 (Recorder) - przyczyna wspolna

Przeanalizowalem `updateAudioAnswer` w obu hookach (`useInteractiveHomework.tsx` linia 633, `useInteractiveSharedWorksheet.tsx` linia 512). Ta funkcja TYLKO aktualizuje React state (`setAudioAnswers`). **Nie wywoluje `scheduleAutoSave`** ani zadnego zapisu do bazy. To jest **jedna przyczyna** czterech objawow:

- **1.1 (reset odliczania):** W `HomeworkSpeakingRecorder.tsx` useEffect (linia 156) ma dependency `[status, registryKey, uploadAndSave]`. Funkcja `uploadAndSave` (linia 142) jest tworzona przez `useCallback` z dependency `[onAudioSaved]`. A `onAudioSaved` jest tworzone inline w renderze (HomeworkPage linia 709: `(qIndex, audioUrl) => updateAudioAnswer(index, qIndex, audioUrl)`). Kazdy re-render (scroll, wpisanie czegos) tworzy nowa referencje `onAudioSaved` -> nowy `uploadAndSave` -> useEffect sie odpalajako nowy -> resetuje timer na 30s.

- **1.2 (znika po refreshu):** `updateAudioAnswer` zapisuje URL tylko w React state. Nigdy nie wywoluje `saveAnswer()` z URL do bazy. Po refreshie state jest pusty, ladowane sa tylko `answers` z DB - audioAnswers nigdy nie byly zapisane.

- **1.3 (nie liczy sie w progress):** `getProgress()` (homework linia 546, shared linia 258) liczy tylko `answers[exerciseIndex]` (tekst). Nie sprawdza `audioAnswers`.

- **1.4 (brak logow):** Skoro audio nigdy nie trafia do DB (`homework_student_answers`/`worksheet_student_answers`), trigger SQL (`trg_homework_answer_to_events`/`trg_worksheet_answer_to_events`) nigdy nie odpala -> brak wpisow w `student_events`.

### Problem 2 (Welcome Test) - wyniki analizy

- **2.1:** `Skill Scores` (WelcomeTestResults.tsx linia 186) wyswietla dane z `student_learning_profiles` (AI-generated: grammar_score, vocabulary_score itd.). `Results by Skill` (TestDetailsView.tsx linia 362) wyswietla dane z `test_skill_results` (binary correct/incorrect count). Te dwa zrodla danych sa **roznymi metrykami** - pierwsza to AI-oceniona jakosc, druga to surowa poprawnosc MC. Speaking 25% vs 0% bo AI ocenilo na 25%, ale 0/3 correct bo zadne speaking nie ma correct_answer (sa otwarte).

- **2.3:** Nowe pytania Q3b, Q5b, Q13b, Q17b, Q41b NIE maja wpisow w `QUESTION_TRAIT_FALLBACK` (linia 322). Q3b jest `preference_choice` z `multi_select=true` ale MA `detected_trait` - wiec powinno isc sciezka detected_trait. ALE - Q3b jest multi-select i `detected_trait.mapping` mapuje INDEKSY pojedyncze, a przy multi-select odpowiedz to tablica. Frontend uzywa `questionDef.options?.indexOf(answer)` (linia 311) - to dziala dla string ale nie dla tablicy. Wiec multi-select z detected_trait jest ignorowany, wpada do fallback z `selected_preferences`.

- **2.5:** SQL query potwierdzil: pytania MC z `is_correct=true` i `skill_ids` maja `mastery=NULL`. Przyczyna: `add_student_event` RPC NIE przyjmuje parametru `p_mastery`. Frontend ustawia mastery w `nano_skill_ratings` wewnatrz payloadu, ale kolumna `mastery` tabeli nigdy nie jest ustawiana. Trigger `refresh_skill_metrics_on_event` przetwarza `nano_skill_ratings` ale tez nie ustawia kolumny `mastery`.

---

## ROZWIAZANIA

### Problem 1.1: Reset odliczania auto-save

**Przyczyna:** `uploadAndSave` zmienia referencje przy kazdym renderze bo `onAudioSaved` jest inline.

**Fix w `HomeworkSpeakingRecorder.tsx`:**
- Uzyc `useRef` do przechowania `onAudioSaved` zamiast dependency w useCallback
- Zmiana: dodac `const onAudioSavedRef = useRef(onAudioSaved)` + useEffect aktualizujacy ref
- `uploadAndSave` useCallback zmienia dependency z `[onAudioSaved]` na `[]` (stabilna referencja)
- useEffect auto-save (linia 156) zmienia dependency z `[status, registryKey, uploadAndSave]` na `[status, registryKey]` - uploadAndSave jest teraz stabilna

```typescript
// Dodac na poczatku komponentu (po linii 54):
const onAudioSavedRef = useRef(onAudioSaved);
useEffect(() => { onAudioSavedRef.current = onAudioSaved; }, [onAudioSaved]);

// Zmienic uploadAndSave (linia 142):
const uploadAndSave = useCallback(async () => {
  if (!blobRef.current) return;
  setStatus('uploading');
  try {
    const url = await uploadBlobToR2(blobRef.current);
    if (!url) throw new Error('No URL returned');
    setAudioUrl(url); setStatus('done'); onAudioSavedRef.current(url);
    toast.success('Recording saved!');
  } catch {
    setStatus('error'); setErrorMsg('Upload failed. Please try again.');
  }
}, []); // STABILNA - nie zalezy od onAudioSaved

// useEffect auto-save (linia 156) - usunac uploadAndSave z deps:
useEffect(() => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  if (status === 'recorded' && blobRef.current) {
    if (registryKey) {
      (window as any).__pendingSpeakingRecordings?.set(registryKey, { blob: blobRef.current, save: uploadAndSave });
    }
    setAutoSaveCountdown(30);
    timer = setTimeout(() => { uploadAndSave(); }, 30000);
  }
  if (status === 'done' || status === 'idle') {
    if (registryKey) (window as any).__pendingSpeakingRecordings?.delete(registryKey);
    setAutoSaveCountdown(null);
  }
  return () => { if (timer) clearTimeout(timer); };
}, [status, registryKey]); // BEZ uploadAndSave - jest stabilna
```

### Problem 1.2 + 1.4: Audio nie zapisuje sie do bazy / brak logow

**Przyczyna:** `updateAudioAnswer` aktualizuje TYLKO React state. Nie wywoluje zapisu do DB.

**Fix w `useInteractiveHomework.tsx`:**
W `updateAudioAnswer` (linia 633), po ustawieniu state, wywolac `scheduleAutoSave` tak jak robi to `updateAnswer`:

```typescript
const updateAudioAnswer = useCallback((exerciseIndex: number, questionIndex: number, audioUrl: string) => {
  setAudioAnswers(prev => {
    const updated = {
      ...prev,
      [exerciseIndex]: {
        ...(prev[exerciseIndex] || {}),
        [questionIndex]: audioUrl
      }
    };
    
    // TRIGGER DB SAVE - audio must be persisted just like text answers
    // Use current text answers + new audio state to save
    const exerciseType = exercises[exerciseIndex]?.type || exercises[exerciseIndex]?.exercise_type || '';
    const currentAnswers = answers[exerciseIndex] || {};
    
    // Build evaluations with updated audio
    const exerciseData = { ...exercises[exerciseIndex], worksheetId: sourceWorksheetId || homeworkId };
    const mastery = calculateOverallMastery(exerciseType, exerciseData, currentAnswers as Record<string | number, any>);
    const itemEvaluations = buildItemEvaluations(exerciseData, currentAnswers as Record<string | number, any>, exerciseType, null, updated[exerciseIndex] || null);
    
    // Save to DB (immediate, not debounced - recording just finished)
    saveAnswer(exerciseIndex, exerciseType, currentAnswers, mastery, itemEvaluations);
    
    return updated;
  });
  console.log('[useInteractiveHomework] Audio answer saved:', { exerciseIndex, questionIndex, audioUrl: audioUrl.substring(0, 50) });
}, [answers, exercises, saveAnswer, sourceWorksheetId, homeworkId]);
```

**Fix analogiczny w `useInteractiveSharedWorksheet.tsx`** (linia 512) - ta sama logika, uzyc `worksheetId` zamiast `homeworkId`.

### Problem 1.3: Audio nie zlicza sie w progress

**Fix w `useInteractiveHomework.tsx` - `getProgress` (linia 546):**
Dodac sprawdzanie `audioAnswers` obok `answers`:

```typescript
const getProgress = useCallback((): HomeworkProgress => {
  let answeredExercises = 0;
  let totalTasks = 0;
  let answeredTasks = 0;
  
  for (let i = 0; i < totalExercises; i++) {
    const questionCount = exerciseQuestionCounts[i] || 1;
    totalTasks += questionCount;
  }
  
  // Merge text answers and audio answers to get complete picture
  const allExerciseIndices = new Set([
    ...Object.keys(answers).map(Number),
    ...Object.keys(audioAnswers).map(Number)
  ]);
  
  allExerciseIndices.forEach(exerciseIndex => {
    const exerciseAnswers = answers[exerciseIndex] || {};
    const exerciseAudioAnswers = audioAnswers[exerciseIndex] || {};
    const questionCount = exerciseQuestionCounts[exerciseIndex] || 1;
    
    // Count unique answered questions (text OR audio counts as answered)
    let answeredQuestionsCount = 0;
    const allQuestionIndices = new Set([
      ...Object.keys(exerciseAnswers).map(Number),
      ...Object.keys(exerciseAudioAnswers).map(Number)
    ]);
    
    allQuestionIndices.forEach(qIdx => {
      const hasText = exerciseAnswers[qIdx] !== null && exerciseAnswers[qIdx] !== undefined && exerciseAnswers[qIdx] !== '';
      const hasAudio = !!exerciseAudioAnswers[qIdx];
      if (hasText || hasAudio) answeredQuestionsCount++;
    });
    
    answeredTasks += answeredQuestionsCount;
    
    if (answeredQuestionsCount >= questionCount) {
      answeredExercises++;
    }
  });

  const cappedAnsweredTasks = Math.min(answeredTasks, totalTasks);
  const percentageComplete = totalTasks > 0 
    ? Math.min(100, Math.round((cappedAnsweredTasks / totalTasks) * 100))
    : 0;

  return { totalExercises, answeredExercises, percentageComplete, totalTasks, answeredTasks: cappedAnsweredTasks };
}, [answers, audioAnswers, totalExercises, exerciseQuestionCounts]);
```

**Fix analogiczny w `useInteractiveSharedWorksheet.tsx`** - `getProgress` (linia 258).

---

### Problem 2.1: Niespojne sekcje Skill Scores vs Results by Skill

**Analiza:** Dwie sekcje pokazuja dwa rozne pomiary:
- `Skill Scores` (z `student_learning_profiles`) = AI-oceniona jakosc 0-100%
- `Results by Skill` (z `test_skill_results`) = ilosc poprawnych odpowiedzi X/Y

**Rozwiazanie:** Polaczyc obie w jedna sekcje `Skill Scores` i dodac kolumne `Correct` z danymi z `test_skill_results`. Dodac tez `Listening` do Skill Scores (brakuje).

**Fix w `WelcomeTestResults.tsx`:**
1. Dodac state `skillResults` z `test_skill_results`
2. Pobrac dane z `test_skill_results` w useEffect (obok profilu)
3. Rozszerzyc sekcje Skill Scores o kolumne correct/total:

```typescript
// Dodac do useEffect fetchProfile:
const { data: testData } = await supabase
  .from('student_tests')
  .select('id')
  .eq('student_id', studentId)
  .eq('teacher_id', teacherId)
  .eq('test_type', 'welcome')
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

if (testData) {
  const { data: skillResults } = await supabase
    .from('test_skill_results')
    .select('*')
    .eq('test_id', testData.id);
  setSkillResults(skillResults || []);
}

// W renderze Skill Scores - dodac Listening, dodac correct/total:
{[
  { label: 'Grammar', score: profile.grammar_score, skill: 'grammar' },
  { label: 'Vocabulary', score: profile.vocabulary_score, skill: 'vocabulary' },
  { label: 'Reading', score: profile.reading_score, skill: 'reading' },
  { label: 'Listening', score: null /* profil nie ma listening */, skill: 'listening' },
  { label: 'Writing', score: profile.writing_score, skill: 'writing' },
  { label: 'Speaking', score: (profile as any).speaking_score, skill: 'speaking' },
].map(({ label, score, skill }) => {
  const result = skillResults.find(r => r.element_type === skill);
  return (
    <div key={label} className="flex items-center gap-3">
      <span className="w-28 text-sm">{label}</span>
      <div className="flex-1">
        <Progress value={score || (result ? result.score_percentage : 0)} className="h-2" />
      </div>
      <span className="w-12 text-right text-sm font-medium">
        {score !== null ? `${Math.round(score)}%` : result ? `${Math.round(result.score_percentage)}%` : '—'}
      </span>
      {result && (
        <span className="w-16 text-right text-xs text-muted-foreground">
          ({result.correct_answers}/{result.total_questions})
        </span>
      )}
    </div>
  );
})}
```

**Usunac sekcje "Results by Skill"** z `TestDetailsView.tsx` (linie 362-398).

---

### Problem 2.2: Preview testu przed wyslaniem

**Obecny stan:** Przed wyslaniem testu jest przycisk "Preview" ktory rozwija spis tresci i przycisk "Send Welcome Test". Po wyslaniu jest "Copy Link" i "Preview" (link do testu w teacher mode).

**Rozwiazanie:**
W `StudentTestsTab.tsx` (placeholder card gdy brak testu, linia 71-122) i w `TestDetailsView.tsx` (header, linia 224-249):

**A. Przed wyslaniem (StudentTestsTab placeholder card):**
- Przycisk "Preview" = otwiera link do welcome test w teacher mode (tworzy test w draft, generuje share token, otwiera `/welcome-test/{token}`)
- Przycisk "Results" = otwiera TestDetailsView z testId (pokaze WelcomeTestResults - ktory pokaze "Not yet generated" i pelna liste pytan)
- Przycisk "Send Welcome Test" = jak dotychczas

**B. W TestDetailsView - jesli test nie ma odpowiedzi:**
Obecna logika (linia 322): `{isWelcomeTest && (test.status === 'completed' || test.status === 'reviewed') && (<WelcomeTestResults .../>)}`
Zmienic na: `{isWelcomeTest && (<WelcomeTestResults .../>)}` - pokaze profil LUB "not yet generated" message.

Dla listy pytan (linia 401-421): juz pokazuje wszystkie pytania. Obecny problem: jesli student nie odpowiedzial na zadne pytanie, QuestionCard pokazuje uproszczona wersje. Fix: zawsze pokazywac pelna wersje pytania z opcjami.

**Fix w `TestDetailsView.tsx` QuestionCard:**
W QuestionCard (linia 427), jesli `!hasAnswer`, nadal pokazywac pelne pytanie z opcjami ale bez odpowiedzi studenta (zamiast uproszczonego widoku).

**Fix w `StudentTestsTab.tsx`:**
Zamienic sekcje placeholder card (linia 71-122):
- Dodac 3 przyciski: "Preview" (external link icon), "Results" (eye icon), "Send Welcome Test"
- "Preview" tworzy test draft jesli nie istnieje, generuje token, otwiera w nowym tabie
- "Results" otwiera TestDetailsView z draft test ID (setSelectedTestId)

---

### Problem 2.3: Nowe pytania uzywaja `selected_preferences` zamiast semantycznych kluczy

**Przyczyna:** Q3b jest `preference_choice` z `multi_select=true` I MA `detected_trait`. Ale `detected_trait` mapuje indeksy pojedyncze, a odpowiedz multi-select to tablica stringow. Frontend (linia 310-316) uzywa `options.indexOf(answer)` - ale `answer` jest tablica, wiec indexOf zwraca -1. Wiec detected_trait jest ignorowany i wpada do fallback.

Q5b, Q13b, Q17b, Q41b sa `scenario_reaction` (single select) z `detected_trait` - te POWINNY dzialac poprawnie. Sprawdzmy:

Q5b ma `detected_trait.trait_name: 'deadline_response'`. Jesli student wybral jedną opcje jako string, `indexOf` zadziala. Wiec Q5b/Q13b/Q17b/Q41b powinny dzialac.

Problem dotyczy TYLKO Q3b (multi-select preference_choice z detected_trait).

**Fix w `useWelcomeTest.tsx` (linia 309-346):**
1. Dodac Q3b do `QUESTION_TRAIT_FALLBACK` z kluczem `'usage_context'`
2. Alternatywnie: naprawic logike detected_trait dla multi-select - wziąć najwyższy priorytet z mapping:

```typescript
// Linia 322 - dodac do QUESTION_TRAIT_FALLBACK:
'wt_q3b': 'usage_context',

// Lepsze rozwiazanie: naprawic detected_trait dla multi-select
// Przed linia 310, dodac obsluge multi-select:
if (questionDef.detected_trait && Array.isArray(answer)) {
  // Multi-select: map each selected option to its trait value
  const traitValues = (answer as string[]).map(a => {
    const idx = questionDef.options?.indexOf(a);
    if (idx !== undefined && idx >= 0) {
      return questionDef.detected_trait!.mapping[String(idx)];
    }
    return null;
  }).filter(Boolean);
  
  if (traitValues.length > 0) {
    detectedTraitData = { [questionDef.detected_trait.trait_name]: traitValues.join(', ') };
  }
}
```

---

### Problem 2.4: Mastery ustawione ale skill_ids puste

**To NIE jest blad.** Pytania profilowe (Q12, Q13) nie maja `nano_skill` - wiec `skill_ids` jest puste. Mastery dla tych pytan jest ustawiane przez `process-welcome-test` (AI scoring open-ended questions). To jest poprawne zachowanie - profiling questions nie mierza umiejetnosci jezykowych.

**Brak zmian.**

---

### Problem 2.5: Mastery NULL dla MC pytan z skill_ids

**Przyczyna potwierdzona:** Funkcja SQL `add_student_event` NIE ma parametru `p_mastery`. Frontend ustawia mastery w `nano_skill_ratings[0].mastery` (wartosc 100 lub 0), ale kolumna `mastery` tabeli nigdy nie jest ustawiana.

**Fix - migracja SQL:**
Zmodyfikowac funkcje `add_student_event` aby auto-ekstrahowal mastery z nano_skill_ratings:

```sql
CREATE OR REPLACE FUNCTION public.add_student_event(
  p_student_id uuid, p_teacher_id uuid, p_event_type text, p_event_source text,
  p_source_id uuid DEFAULT NULL, p_event_payload jsonb DEFAULT '{}'::jsonb,
  p_skill_ids text[] DEFAULT NULL, p_element_type text DEFAULT NULL,
  p_session_id text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_event_id UUID;
  v_mastery numeric;
BEGIN
  -- Auto-extract mastery from nano_skill_ratings if present
  IF p_event_payload ? 'nano_skill_ratings' THEN
    SELECT ROUND(AVG((elem->>'mastery')::numeric))
    INTO v_mastery
    FROM jsonb_array_elements(p_event_payload->'nano_skill_ratings') AS elem
    WHERE (elem->>'mastery')::numeric >= 0
      AND (elem->>'hasValue')::boolean = true;
  END IF;

  -- Fallback: extract from is_correct for simple MC questions  
  IF v_mastery IS NULL AND p_event_payload ? 'is_correct' THEN
    v_mastery := CASE 
      WHEN (p_event_payload->>'is_correct')::boolean = true THEN 100
      WHEN (p_event_payload->>'is_correct')::boolean = false THEN 0
      ELSE NULL
    END;
  END IF;

  INSERT INTO public.student_events (
    student_id, teacher_id, event_type, event_source,
    source_id, event_payload, skill_ids, element_type,
    session_id, mastery
  ) VALUES (
    p_student_id, p_teacher_id, p_event_type, p_event_source,
    p_source_id, p_event_payload, p_skill_ids, p_element_type,
    p_session_id, v_mastery
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;
```

Dodatkowo: backfill istniejacych NULL mastery:
```sql
UPDATE student_events SET mastery = 100
WHERE event_source = 'welcome_test' AND mastery IS NULL
  AND skill_ids IS NOT NULL AND array_length(skill_ids, 1) > 0
  AND (event_payload->>'is_correct')::boolean = true;

UPDATE student_events SET mastery = 0
WHERE event_source = 'welcome_test' AND mastery IS NULL
  AND skill_ids IS NOT NULL AND array_length(skill_ids, 1) > 0
  AND (event_payload->>'is_correct')::boolean = false;
```

---

### Problem 2.6: Brak tlumaczen nowych pytan Q3b, Q5b, Q13b, Q17b, Q41b

**Fix:** Dodac 5 nowych pytan do kazdego z 10 jezykow w `src/data/welcomeTestTranslations.ts`.

Kazdy jezyk potrzebuje tlumaczeń:
- `wt_q3b`: "Where do you use (or want to use) English the most?" + 6 opcji
- `wt_q5b`: "Imagine this: your boss just told you..." + 4 opcji
- `wt_q13b`: "Think about the last time you tried to learn something new..." + 4 opcji
- `wt_q17b`: "You see a perfect job posting..." + 4 opcji
- `wt_q41b`: "Which of these situations is closest to yours right now?" + 4 opcji

10 jezykow x 5 pytan = 50 wpisow translacyjnych.

---

### Problem 3: Skip button w NanoSkillMasteryModal na gorze

**Fix w `NanoSkillMasteryModal.tsx` (linia 589-618):**
Przeniesc przycisk "Skip (mark done without evaluation)" z DialogFooter na gore - zaraz pod linijka "Skills without a set value won't be saved" (linia 539-544):

```typescript
// Po linii 544 (zamkniecie div z AlertCircle), dodac:
{onSkip && (
  <Button 
    variant="ghost" 
    onClick={handleSkip} 
    className="gap-2 text-muted-foreground w-full justify-start"
    disabled={isLoadingAiEvaluation}
  >
    <SkipForward className="h-4 w-4" />
    Skip (mark done without evaluation)
  </Button>
)}

// Usunac z DialogFooter (linia 591-598) stary przycisk Skip
```

---

## KOLEJNOSC IMPLEMENTACJI

1. **Migracja SQL** - fix `add_student_event` + backfill mastery (Problem 2.5)
2. **HomeworkSpeakingRecorder.tsx** - useRef stabilizacja (Problem 1.1)
3. **useInteractiveHomework.tsx** - updateAudioAnswer trigger save + getProgress audio (Problem 1.2, 1.3, 1.4)
4. **useInteractiveSharedWorksheet.tsx** - analogiczne fixy (Problem 1.2, 1.3, 1.4)
5. **useWelcomeTest.tsx** - fix multi-select detected_trait + QUESTION_TRAIT_FALLBACK (Problem 2.3)
6. **WelcomeTestResults.tsx** - merge Skill Scores + Results by Skill (Problem 2.1)
7. **TestDetailsView.tsx** - usunac sekcje Results by Skill + fix preview (Problem 2.1, 2.2)
8. **StudentTestsTab.tsx** - Preview/Results/Send buttons (Problem 2.2)
9. **NanoSkillMasteryModal.tsx** - Skip button na gorze (Problem 3)
10. **welcomeTestTranslations.ts** - 50 nowych wpisow (Problem 2.6)
11. **Dokumentacja** - 6 plikow

## PLIKI DO ZMIANY

| Plik | Problem | Zmiana |
|---|---|---|
| Migracja SQL | 2.5 | Rozszerzyc `add_student_event` o auto-mastery + backfill |
| `src/components/homework/HomeworkSpeakingRecorder.tsx` | 1.1 | useRef dla onAudioSaved, stabilny uploadAndSave |
| `src/hooks/useInteractiveHomework.tsx` | 1.2, 1.3, 1.4 | updateAudioAnswer trigger save + getProgress z audioAnswers |
| `src/hooks/useInteractiveSharedWorksheet.tsx` | 1.2, 1.3, 1.4 | Analogicznie |
| `src/hooks/useWelcomeTest.tsx` | 2.3 | Fix multi-select detected_trait + QUESTION_TRAIT_FALLBACK Q3b |
| `src/components/student-tests/WelcomeTestResults.tsx` | 2.1 | Merge skill_results + dodac Listening |
| `src/components/student-tests/TestDetailsView.tsx` | 2.1, 2.2 | Usunac Results by Skill + fix preview |
| `src/components/student-tests/StudentTestsTab.tsx` | 2.2 | Preview/Results/Send buttons |
| `src/components/worksheet/NanoSkillMasteryModal.tsx` | 3 | Skip button na gorze |
| `src/data/welcomeTestTranslations.ts` | 2.6 | 50 nowych wpisow (5 pytan x 10 jezykow) |
| Dokumentacja (6 plikow) | Wszystkie | Aktualizacja |

## DSLM READINESS CHECKLIST (Layer A/B/C/D)

```text
LAYER A (Immutable Event Log)
#  | Element                                    | Status
1  | student_events INSERT na kazda odpowiedz   | OK (homework/worksheet triggers)
2  | Welcome test events                        | PROBLEM - mastery NULL dla MC
3  | Audio recording events                     | PROBLEM - updateAudioAnswer nie zapisuje do DB
4  | Event dedup (DELETE+INSERT)                 | OK
5  | Kanoniczne event_type                      | OK
6  | Time tracking (visibility timer)            | OK
7  | buildItemEvaluations ALL nano_skills       | OK (naprawione poprzednio)

LAYER B (Metrics & Signals)  
8  | student_skill_metrics auto-refresh          | OK (trigger)
9  | compute_skill_metric weighted avg           | OK
10 | Trend calculation                           | OK
11 | student_category_metrics VIEW               | OK
12 | student_micro_skill_metrics VIEW            | OK
13 | Mastery extraction w add_student_event      | DO NAPRAWY (Problem 2.5)

LAYER C (Student Profiles)
14 | student_learning_profiles                   | OK
15 | Learning Path Score calculation             | OK (dodane w poprzednim PR)
16 | Trait detection z Welcome Test              | CZESCIOWO - Q3b multi-select broken
17 | AI summary generation                       | OK

LAYER D (Decision Engine)
18 | Worksheet generation influenced by profile  | NIE ZAIMPLEMENTOWANE (future)
19 | Learning path routing                       | NIE ZAIMPLEMENTOWANE (future)
20 | Exercise selection algorithm                 | NIE ZAIMPLEMENTOWANE (future)
```

Po wdrozeniu powyzszych fixow, pozycje 2, 3, 13 i 16 beda OK.

