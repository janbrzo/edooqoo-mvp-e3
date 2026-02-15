

# Welcome Test v2 - Bug Fixes Round 2

## ROOT CAUSE ANALYSIS

After deep analysis of the code, database, and logs, I identified **13 distinct issues** with clear root causes and safe fixes.

---

## ISSUE 1: SpeakingRecorder not recording (Q20, Q39, Q45)

**Root cause:** The `MediaRecorder` constructor uses `mimeType: 'audio/webm'` which may not be supported on all browsers (especially Safari/iOS). When `getUserMedia` succeeds but `MediaRecorder` fails, nothing happens visually -- the component stays at "idle" with 0:00.

**Fix:**
- Add mimeType detection: try `audio/webm`, fallback to `audio/mp4`, then no mimeType (let browser decide)
- Add error boundary: if MediaRecorder fails, show clear error message
- Auto-save on navigation: the current `useEffect` cleanup works but has a closure issue -- `status` captured in cleanup may be stale. Fix by using a ref for status.

**Speech-to-text for teacher review:**
- When teacher views a speaking answer in TestDetailsView, add an audio player + "Transcribe" button
- On click, call a new edge function or existing AI gateway to transcribe the audio URL
- Store transcription alongside the answer

**Files:** `SpeakingRecorder.tsx`, `TestDetailsView.tsx`, new edge function `transcribe-audio/index.ts`

---

## ISSUE 2: ListeningPlayer has no audio (Q21)

**Root cause:** The `audio_url` field in `wt_q18l` is an empty string `''`. Audio was never pre-generated.

**Fix:**
- Create a one-time script/edge function that calls `generate-audio` for each listening question and stores the R2 URL
- But simpler: use OpenAI TTS directly in a new edge function `generate-welcome-test-audio` that takes the transcript text and returns an R2 URL
- After generation, hardcode the R2 URL into `welcomeTestQuestions.ts` so it's permanent
- For now as immediate fix: generate audio on first load of listening question if `audio_url` is empty, using client-side call to `generate-audio`

**Practical approach:** Create a maintenance edge function `generate-welcome-test-audio` that:
1. Takes the transcript text from the question
2. Calls OpenAI TTS to generate audio
3. Uploads to R2
4. Returns the URL

Then hardcode the URLs into the questions. This is a one-time operation.

**Files:** New `supabase/functions/generate-welcome-test-audio/index.ts`, update `welcomeTestQuestions.ts` with real URLs after generation

---

## ISSUE 3: Event log duplication (14 logs per answer)

**Root cause:** `saveAnswer` in `useWelcomeTest.tsx` fires `add_student_event` on EVERY keystroke for `fill_blank`, `open_ended`, `open_reflection` questions. Each character typed triggers the full save flow including the event log.

**Fix:**
- Debounce event logging: only log events when answer is "committed" (on blur, on navigate, on explicit save)
- Split `saveAnswer` into two parts:
  1. `updateLocalAnswer` -- updates state only (no DB call) -- called on every keystroke
  2. `commitAnswer` -- saves to DB + logs event -- called on blur/navigate/save
- For radio/checkbox questions (single click = final answer), call `commitAnswer` immediately
- For text inputs, call `commitAnswer` on blur or navigation

Also fix: events should use DELETE+INSERT pattern (upsert) per section, not insert every time. The current `add_student_event` RPC doesn't upsert -- it inserts. Need to add a unique constraint or use custom logic.

**Files:** `useWelcomeTest.tsx`, `WelcomeTestPage.tsx`

---

## ISSUE 4: Wrong score calculation (16% showing 8/49 correct)

**Root cause:** `calculate_test_results` RPC treats ALL 49 questions as gradeable, counting `is_correct` for each. But ~25 questions are profiling (self_assessment, preference_choice, open_reflection, speaking_record, self_assessment_matrix) -- they have no correct answer and `is_correct` is NULL, which gets counted as "wrong" in the percentage.

**Fix:**
- In `TestDetailsView` and `TestCard`: for welcome tests, only count questions that HAVE a `correct_answer` defined (skill questions)
- Show two separate stats:
  - "8/22 skill questions correct" (grammar, vocab, reading, listening)
  - "43/49 questions answered" (total engagement)
- Update `calculate_test_results` or override display for welcome tests

**Files:** `StudentTestsTab.tsx` (TestCard), `TestDetailsView.tsx`, possibly `process-welcome-test/index.ts`

---

## ISSUE 5: Resume position after cross-device refresh

**Root cause:** Position is stored in `localStorage` which is device-specific. When opening on a new device, `localStorage` is empty, so position defaults to question 1.

**Fix:**
- Store resume position in database (e.g., `student_tests.generation_params` JSON field or new column)
- On load, read position from DB first, then fallback to localStorage
- When saving answers, also persist the current position to DB
- On resume: navigate directly to the first unanswered question (not the stored position)

Better approach: On resume, find the first question WITHOUT an answer in the DB and go there. This is device-independent and always correct.

**Files:** `useWelcomeTest.tsx`

---

## ISSUE 6: AI Analysis missing speaking answers + empty Motivation section

**6A. Speaking answers not in AI analysis:**
The AI prompt only sends open question IDs: `['wt_q12', 'wt_q13', 'wt_q16', 'wt_q17', 'wt_q36', 'wt_q37', 'wt_q40', 'wt_q41', 'wt_q45']`. Speaking answers (wt_q16s, wt_q36s, wt_q41s) are audio URLs, not text. To include them, we need to transcribe the audio first, then include transcription in the AI prompt.

**Fix:** Before AI analysis, check if any speaking answers are URLs. If so, call speech-to-text (using Lovable AI or OpenAI Whisper) to get text, then include in the prompt.

**6B. Empty Motivation & Personality section:**
The `detected_traits` object is being passed from the frontend but the trait detection logic has a bug. The trait mapping uses option INDEX but the frontend saves the option TEXT, not the index. Looking at `saveAnswer` line 239: `questionDef.options?.indexOf(answer)` -- this works correctly for single-select. BUT the `detectedTraits` ref is component-level and gets wiped on page refresh. So if the student answered trait questions in a previous session, the traits are lost.

**Fix:** Reconstruct traits from saved answers in `process-welcome-test` edge function instead of relying on frontend `detected_traits`. The edge function already has all answers and all question definitions -- compute traits server-side.

**Files:** `supabase/functions/process-welcome-test/index.ts`, new `transcribe-audio` functionality

---

## ISSUE 7: Translation auto-select from student profile

**Root cause:** The translation dropdown defaults to "none" and requires manual selection. The student's native language from their profile is not used.

**Fix:**
- In `useWelcomeTest`, fetch the student's `native_language` from the `students` table
- Pass it to `WelcomeTestPage`
- Auto-set `translationLang` to matching language if available
- Keep manual override dropdown

Also: only Polish has full translations. Need to add complete translations for the other 9 languages.

**Files:** `useWelcomeTest.tsx`, `WelcomeTestPage.tsx`, `welcomeTestTranslations.ts`

---

## ISSUE 8: Preview/View Results navigation not working

**Root cause:** `navigate('/student/${id}?tab=tests')` changes the URL, but `StudentPage` reads `searchParams.get('tab')` only once in `useState` initializer (line 55). When URL changes via programmatic navigation ON THE SAME PAGE, the component doesn't re-read the param.

**Fix:** Add a `useEffect` that watches `searchParams` and syncs `activeTab`:
```typescript
useEffect(() => {
  const tab = searchParams.get('tab');
  if (tab && tab !== activeTab) {
    setActiveTab(tab);
  }
}, [searchParams]);
```

Also for "View Results": pass testId in URL so Tests tab auto-opens the specific test:
`navigate('/student/${id}?tab=tests&testId=${testId}')`

**Files:** `StudentPage.tsx`, `WelcomeTestSuggestion.tsx`

---

## ISSUE 9: Teacher access control on student test link

**9.1 Teacher should NOT answer the test:**
Currently, if a teacher opens the student's test link, they get the version selector and can answer questions, which would pollute the student's data.

**Fix:** When `isTeacher` is detected (authenticated user), show a blocking screen:
- "This is the student's test link"
- "To view answers, go to Student Profile > Tests tab"
- Button: "Go to Student Results" (links to `/student/${studentId}?tab=tests&testId=${testId}`)

**9.2 Teacher preview mode:**
- Add a button "Take Test as Teacher (Preview)" that generates a separate URL/mode
- Use a query param `?mode=teacher_preview` that enables answering but does NOT save to the student's record
- Or simpler: just let teacher click through questions in read-only mode (no saving)

**Files:** `WelcomeTestPage.tsx`, `useWelcomeTest.tsx`

---

## ISSUE 10: Teacher notes + Re-take option

**Teacher notes per question:**
- In `TestDetailsView`, add a small textarea below each question for teacher notes
- Store in `student_test_questions.question_data` JSON (add a `teacher_note` field) or new column
- Save on blur with debounce

**Re-take option:**
- Add "Re-take Test" button in TestDetailsView header
- Creates a new welcome test (new ID), archives the old one
- Student gets a fresh test link

**Files:** `TestDetailsView.tsx`, `StudentTestsTab.tsx`

---

## ISSUE 11: Mobile-first checks

Key areas to fix:
- `VersionSelector`: already uses responsive grid, but check card padding
- Section tabs: horizontal scroll works but needs touch-friendly sizing
- Question dots at bottom: 49 dots at 24px each = too many for small screens. Switch to progress bar on mobile
- Navigation buttons: stack vertically on very small screens
- SpeakingRecorder: microphone button should be larger on mobile (thumb-friendly)
- Email modal: ensure full-width on mobile

**Files:** `WelcomeTestPage.tsx`, `VersionSelector.tsx`, `SpeakingRecorder.tsx`

---

## ISSUE 12: Email modal blurred background

**Root cause:** The current implementation (lines 213-266) already shows blurred content with fake placeholder questions. The issue is that it uses hardcoded placeholder text instead of real test content, and the blur effect may not be visible enough.

**Fix:** Increase blur intensity, use actual first section questions from `WELCOME_TEST_SECTIONS_WITH_QUESTIONS`, and ensure the overlay covers properly.

**Files:** `WelcomeTestPage.tsx`

---

## ISSUE 13: Teacher completion email with link to results

**Root cause:** The email says "View the full learning profile in the student's profile page" but has no clickable link.

**Fix:** Add a clickable link to the student's test results page in the email HTML. Need to know the app's public URL -- use `SUPABASE_URL` to derive it or pass it from the frontend.

**Files:** `supabase/functions/process-welcome-test/index.ts`

---

## IMPLEMENTATION ORDER

1. **Database/Backend fixes** (Issues 3, 4, 6)
   - Fix event logging (debounce + upsert)
   - Fix score calculation for welcome tests
   - Fix trait detection server-side
   
2. **Critical UX fixes** (Issues 1, 2, 5, 8, 9)
   - Fix SpeakingRecorder cross-browser
   - Generate audio for listening questions
   - Fix cross-device resume
   - Fix tab navigation
   - Block teacher from answering

3. **Feature additions** (Issues 10, 7, 13)
   - Teacher notes + re-take
   - Auto-translation from profile
   - Email with results link

4. **Polish** (Issues 11, 12)
   - Mobile-first responsive fixes
   - Email modal blur improvement

---

## FILES CHANGED

| File | Action | Issues |
|------|--------|--------|
| `src/components/welcome-test/SpeakingRecorder.tsx` | EDIT | 1, 11 |
| `src/components/welcome-test/ListeningPlayer.tsx` | EDIT | 2 |
| `src/hooks/useWelcomeTest.tsx` | EDIT | 3, 5, 7, 9 |
| `src/pages/WelcomeTestPage.tsx` | EDIT | 3, 9, 11, 12 |
| `src/pages/StudentPage.tsx` | EDIT | 8 |
| `src/components/student-tests/TestDetailsView.tsx` | EDIT | 1, 4, 10 |
| `src/components/student-tests/StudentTestsTab.tsx` | EDIT | 4 |
| `src/components/dashboard/WelcomeTestSuggestion.tsx` | EDIT | 8 |
| `src/data/welcomeTestQuestions.ts` | EDIT | 2 (audio URLs) |
| `src/data/welcomeTestTranslations.ts` | EDIT | 7 (add 9 languages) |
| `supabase/functions/process-welcome-test/index.ts` | EDIT | 6, 13 |
| `supabase/functions/generate-welcome-test-audio/index.ts` | NEW | 2 |
| `supabase/functions/transcribe-audio/index.ts` | NEW | 1, 6 |
| Documentation (6 files) | EDIT | all |

