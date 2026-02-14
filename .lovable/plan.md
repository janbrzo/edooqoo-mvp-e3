
# Welcome Test v2 - Bug Fixes and Remaining Features

## ROOT CAUSE ANALYSIS

I found **5 critical database constraints** blocking functionality, plus multiple frontend bugs. Here's what's broken and why:

---

## CRITICAL DATABASE ISSUES (Must Fix First)

### Issue 1: Question insert fails with 400 error
**Root cause:** `student_test_questions.question_type` has a CHECK constraint that only allows: `multiple_choice`, `fill_blank`, `true_false`, `matching`, `open_ended`, `sentence_order`. The new types `speaking_record`, `listening_comprehension`, `self_assessment`, `scenario_reaction`, `preference_choice`, `open_reflection`, `self_assessment_matrix` are rejected.

**Fix:** Migration to expand the constraint to include all question types.

### Issue 2: Notifications can't be created for welcome test
**Root cause:** TWO problems:
1. `homework_notifications.homework_id` has a FOREIGN KEY to `homework_assignments(id)` -- a welcome test ID is NOT a homework assignment ID, so the insert fails
2. `homework_notifications.notification_type` has a CHECK constraint allowing only: `completed`, `viewed`, `overdue` -- not `welcome_test_completed`

**Fix:** Migration to make `homework_id` nullable and expand notification_type constraint.

### Issue 3: Email sender name shows "Worksheet Generator"
**Root cause:** `send-test-email/index.ts` line 96 has `from: 'Worksheet Generator <noreply@edooqoo.com>'` hardcoded.

**Fix:** Change to `'EDOOQOO <noreply@edooqoo.com>'`.

---

## ALL FIXES ORGANIZED BY POINT

### Point A1: Speaking & Listening

**SpeakingRecorder auto-save on navigation:**
- When student navigates away from a speaking question with status `recorded` (recorded but not saved), automatically trigger `uploadAndSave()` before navigating.
- Add `useEffect` cleanup or expose a `flush` method; call from `WelcomeTestPage` when `goToNext`/`goToPrevious` fires.

**ListeningPlayer fixes:**
- Change "Show text (if you need it)" to "Show text (if listening doesn't work)"
- Remove the duplicate transcript text shown outside the ListeningPlayer. Currently line 580-584 in WelcomeTestPage shows transcript AGAIN when `!question.audio_url` -- but for Q18l the audio_url is empty string `''`, which is falsy, so both the ListeningPlayer AND the fallback text render. Fix: only show fallback if `audio_url` is strictly `undefined` or `null`, not empty string. Also when audio_url is empty, ListeningPlayer should show a message "Audio not available" and auto-show the transcript.

### Point A2: Items 6-9 (teacher notes, class comparison, PDF export, re-take)
These require additional components. Will implement:
- **Teacher notes per question** in TestDetailsView (add a text input per question card)
- **PDF export** button in TestDetailsView header
- **Re-take option** button to create a new welcome test

### Point 3: Q28/Q29 answer hint removal
- Q26 description: remove `(e.g. "has been raining")` -- this gives away the answer
- Q27 description: remove `(e.g. "is said to be")` -- same issue
- The user mentioned Q28 and Q29 but looking at the code, Q28 and Q29 are multiple choice (collocations) with no such hint. The actual offending questions are Q26 and Q27.

### Point A4: Email modal blurred background
Currently (lines 213-248) the email modal shows a fake blurred placeholder with gray rectangles. This needs to show actual test content blurred behind it. Fix: render the actual version selector or first question behind a blur overlay rather than placeholder rectangles.

### Point 5: Email sender name
Change `send-test-email/index.ts` line 96 from `'Worksheet Generator <noreply@edooqoo.com>'` to `'EDOOQOO <noreply@edooqoo.com>'`.

Also fix the error-then-success flow: the addQuestions call fails due to the question_type constraint (Issue 1 above). Once the migration runs, this will work.

### Point 6: Notifications
Two DB fixes needed (see Issue 2 above). After migration:
- `homework_id` becomes nullable
- `notification_type` accepts `welcome_test_completed`
- The code in `process-welcome-test/index.ts` will work

The component `HomeworkNotificationBadge` already shows "Notifications" title and handles welcome_test_completed. The fetch query joins on `homework_assignments` which will fail for null homework_id -- fix the query to use LEFT JOIN.

### Point 7: Mobile first
Review all test screens for mobile:
- Version selector cards: stack vertically on small screens
- Question card: ensure proper padding, no horizontal overflow
- Section tabs: already has `overflow-x-auto`, good
- Navigation buttons: check spacing on small screens
- SpeakingRecorder: ensure microphone UI works on mobile
- Instruction screen: check button sizing

### Point 8: Email teacher on completion
The code exists in `process-welcome-test/index.ts` but it can't run because the whole function fails at the notification insert (Issue 2). Once the DB constraint is fixed, this will work. The email already uses `'edooqoo <noreply@edooqoo.com>'` -- correct.

### Point A11: 0/49 after refresh on completion screen
**Root cause:** When `completed=true` and page refreshes, `useWelcomeTest` loads existing answers from DB. But it counts answers from `ALL_WELCOME_TEST_QUESTIONS` which is the full 49 questions. The hook maps `questionsData` from DB to `existingAnswers` using `ALL_WELCOME_TEST_QUESTIONS[q.question_index]`. If the question_index in DB doesn't match the array index (because addQuestions failed for new types), some answers are lost.

**Real fix:** The `completeTest` function should send `answered_count` to the edge function. It already does for `process-welcome-test` but the value comes from the state which gets reset on refresh. The fix is: when loading a completed test, read `answered_count` from `student_tests` table (already fetched but used only as `persistedAnsweredCount`). The actual bug is that `allVisibleQuestions` is empty when `testVersion` is null (after refresh, version is loaded from localStorage but might be null if cleared). Need to ensure version is restored before counting.

### Point A12: Progress tracking - "Waiting for student" stuck
**Root cause:** The `fetchProgress` function counts questions with non-null `student_answer`. But since `addQuestions` failed (constraint issue 1), there are NO questions in `student_test_questions` table. The student answers are saved by `useWelcomeTest` hook using `question_index` to match, but if no rows exist, updates succeed on 0 rows. 

**Fix:** Once DB constraint is fixed, questions will be inserted correctly, and the progress polling will work.

### Point A13: Previous answers not visible after refresh
**Root cause:** When navigating back to previously answered questions, the answers ARE loaded into state (`existingAnswers`) but the QuestionInput components don't receive the correct `answer` prop because the mapping from DB question_index to question ID might be off.

**Fix:** In `useWelcomeTest.fetchTest`, ensure answer mapping correctly uses the question ID, not just index. Currently line 102-107 maps using `ALL_WELCOME_TEST_QUESTIONS[q.question_index]` which works if questions were inserted in order. Add a `resumeTest` flow that also pauses on refresh (show "Resume" screen instead of jumping to test).

### Point A16: Translation button missing
The Globe icon is present in the header (line 364-374) but may not be visible because it's styled as a 7x7px button with no border. Make it more visible with a label "Show Translation" and ensure it appears prominently.

### Point A17: Test not visible in Tests tab before sending
**Root cause:** Tests tab only shows tests from `student_tests` table. Before the teacher clicks "Send Welcome Test", no record exists. 

**Fix:** Add a "Welcome Test" placeholder card in StudentTestsTab that appears when no welcome test exists yet. Clicking it opens a preview of the questions (read-only). After test is created, the real test card replaces it.

### Point A18: Preview button not working
The button navigates to `/student/${studentId}?tab=tests` but since there's no welcome test in the DB yet (before sending), there's nothing to see in the Tests tab.

**Fix:** Same as A17 -- add placeholder. Also, Preview should work even before test is created.

### Point 19: View Results button not working
The "View Results" button navigates to `/student/${studentId}?tab=tests`. This should work if the test exists. Need to verify the tab switching logic in StudentPage handles `?tab=tests` URL parameter correctly.

### Point 20: Student events duplication
619 events for a single test is excessive. Each question answer creates a separate event. 

**Fix:** Instead of logging per-question events, aggregate by section. When a student answers a question, update (upsert) a single event per section with all question results in the payload. Change `event_source` from `'test'` to `'welcome_test'`. Set `element_type` properly.

---

## IMPLEMENTATION FILES

| File | Action | Fixes |
|------|--------|-------|
| SQL Migration | NEW | Fix question_type check, notification constraints |
| `supabase/functions/send-test-email/index.ts` | EDIT | Fix sender name to "EDOOQOO" |
| `src/components/welcome-test/ListeningPlayer.tsx` | EDIT | Fix transcript text, handle empty audio_url |
| `src/components/welcome-test/SpeakingRecorder.tsx` | EDIT | Add auto-save on unmount |
| `src/pages/WelcomeTestPage.tsx` | EDIT | Fix blur background, translation visibility, listening fallback, mobile, auto-save speaking, resume on refresh |
| `src/hooks/useWelcomeTest.tsx` | EDIT | Fix answered count persistence, section-level events, resume flow |
| `src/data/welcomeTestQuestions.ts` | EDIT | Remove answer hints from Q26/Q27 |
| `src/components/homework/HomeworkNotificationBadge.tsx` | EDIT | Fix LEFT JOIN for nullable homework_id |
| `src/components/student-tests/StudentTestsTab.tsx` | EDIT | Add welcome test placeholder |
| `src/components/student-tests/TestDetailsView.tsx` | EDIT | Add teacher notes, PDF export button |
| `src/components/dashboard/WelcomeTestSuggestion.tsx` | EDIT | Fix progress polling |
| `supabase/functions/process-welcome-test/index.ts` | EDIT | Fix notification insert |
| Documentation (6 files) | EDIT | Update all |

## IMPLEMENTATION ORDER

1. **Database migration** (unblocks everything)
2. **Edge function fixes** (email sender, notification insert)
3. **Frontend fixes** (all UI bugs)
4. **New features** (teacher notes, PDF, re-take, placeholder)
5. **Documentation updates**
