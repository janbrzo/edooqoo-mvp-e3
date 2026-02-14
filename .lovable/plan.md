# Welcome Test v2 - Comprehensive Enhancement Plan

This is a massive upgrade covering 21 points. Below is the full plan organized by priority and dependency.

---

## OVERVIEW OF ALL CHANGES


| #   | Point                                  | Summary                                                                                                                                |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Speaking & Listening                   | Add microphone recording + TTS audio questions interspersed throughout test                                                            |
| 2   | Short version                          | Add test length selector (Short ~35 questions / Full ~50 questions)                                                                    |
| 3   | Ambiguous fill_blank UX                | Fix Q26, Q27, Q30 - make task type clearer                                                                                             |
| 4   | Email modal background                 | Make email verification modal show blurred test background                                                                             |
| 5   | Auto-send email                        | Automatically email student when teacher clicks "Send Welcome Test"                                                                    |
| 6   | Notifications rename                   | Rename "Homework Notifications" to "Notifications", add welcome test completion events                                                 |
| 7   | Pre-test screens                       | Add version selector screen + instruction screen with "Start" button before Q1                                                         |
| 8   | Email teacher on completion            | Auto-send email to teacher when student completes test                                                                                 |
| 9   | Confetti                               | Add confetti animation on completion screen                                                                                            |
| 10  | Page height                            | Reduce overall height by ~15% to eliminate scrolling                                                                                   |
| 11  | Answer count after refresh             | Fix: completed screen shows 0/45 after refresh (need to persist answered count)                                                        |
| 12  | Progress tracking in suggestion banner | Show real-time progress, allow viewing answers after completion for 7+ days                                                            |
| 13  | Pause & resume                         | Allow student to pause and resume test (already partially works via DB save, needs explicit UI)                                        |
| 14  | Time tracking                          | Verify and ensure per-question timing is tracked (already in hook, verify it works, verify if Pause & resume works for tracking time ) |
| 15  | AI analysis & teacher summary          | Use AI (Lovable AI) to analyze open answers, generate AI summary in email + profile                                                    |
| 16  | Show Translation button                | Add translations for non-skill questions in top 10 languages (między innymi Polski, Spanish, German....)                               |
| 17  | Test visible in student Tests tab      | Auto-create welcome test entry in Tests tab, viewable before/after completion                                                          |
| 18  | Preview button in Overview             | Add "Preview before sending" button that navigates to Tests tab                                                                        |
| 19  | Q15 extra option                       | Add "I don't try to understand, I use ChatGPT" answer                                                                                  |
| 20  | Additional improvements                | Listed below                                                                                                                           |
| 21  | Questions for me                       | Asked above (speaking/listening/translation)                                                                                           |


---

## TECHNICAL IMPLEMENTATION - GROUPED BY AREA

### A. DATA LAYER CHANGES

#### A1. New questions: Speaking + Listening (Points 1, 19)

Add ~5 new questions interspersed throughout existing sections:

**New speaking questions (microphone recording):**

- After Q16 (scenarios section): "Record yourself describing the hotel problem out loud" - new question_type: `speaking_record`
- After Q36 (communication section): "Record yourself declining the invitation" - `speaking_record`
- In goals section: "Record a 30-second introduction of yourself in English" - `speaking_record`

**New listening questions (pre-generated TTS audio):**

- In scenarios section: Replace Q18 text dialogue with actual audio version + text fallback
- Add 1 new listening comprehension in vocabulary section with audio

**Q15 extra option:**
Add `"I don't try to understand, I use ChatGPT"` as 5th option to Q15's options array.

Total questions: ~48-50 (Full version), ~22-25 (Short version)

**New question types in `welcomeTest.ts`:**

- `speaking_record` - student records microphone audio
- `listening_comprehension` - audio playback + answer

**Files changed:**

- `src/data/welcomeTestQuestions.ts` - add new questions, reorder for interspersing
- `src/types/welcomeTest.ts` - add new question types

#### A2. Short version definition (Point 2)

Add a constant defining which questions are included in Short vs Full version:

```typescript
export const WELCOME_TEST_SHORT_QUESTION_IDS = [
  'wt_q1', 'wt_q3', 'wt_q4', 'wt_q7', // About You (4)
  'wt_q9', 'wt_q12', // Experience (2)
  'wt_q16', 'wt_q18', // Scenarios (2)
  'wt_q20', 'wt_q22', 'wt_q26', // Grammar (3)
  'wt_q28', 'wt_q30', 'wt_q34', // Vocabulary (3)
  'wt_q38', 'wt_q39', // Communication (2)
  'wt_q42', 'wt_q43', 'wt_q44', // Goals (3)
  // + 1 speaking, 1 listening
];
```

Short version: ~22 questions (all sections represented, key trait detectors included)
Full version: all ~50 questions

**File:** `src/data/welcomeTestQuestions.ts`

#### A3. Fix ambiguous fill_blank questions (Point 3)

Change Q26, Q27 to `sentence_transformation` type (renders as: shows original sentence, input field with clear label "Complete the sentence"):

- Q26: Show "It started raining two hours ago." then "It ___ for two hours." with clear instruction "Complete with the correct tense form"
- Q27: Show "People say he is very smart." then "He ___ very smart." with instruction "Rewrite using passive construction"
- Q30: Already has clear `description: 'Write the correct form of the word in brackets.'` - just make the placeholder text more explicit in UI

**File:** `src/data/welcomeTestQuestions.ts` - update descriptions to be clearer

#### A4. Translations for top 10 languages (Point 16)

Create static translation file for non-skill questions only (About You, Experience, Goals, scenario descriptions - NOT grammar/vocabulary test items).

Top 10 languages: Polish, Spanish, German, French, Portuguese, Italian, Turkish, Russian, Czech, Ukrainian

Use AI (one-time generation) to create translations, store as:

```typescript
// src/data/welcomeTestTranslations.ts
export const WELCOME_TEST_TRANSLATIONS: Record<string, Record<string, { question: string; options?: string[]; description?: string }>> = {
  'Polish': {
    'wt_q1': {
      question: 'Jak opisalbyss/opisalabys swoj angielski w tej chwili?',
      options: ['Radze sobie w codziennych sytuacjach...', ...],
      description: 'Wybierz opcje, ktora najlepiej opisuje Twoj obecny poziom.'
    },
    // ... only for translatable questions
  },
  'Spanish': { ... },
  // ...
};
```

**New file:** `src/data/welcomeTestTranslations.ts`

#### A5. Pre-generated audio for listening questions (Point 1)

Generate TTS audio clips for 2-3 listening questions and store URLs in question data. Use the existing `generate-audio` edge function to pre-generate once, then store R2 URLs directly in the question definitions.

**Files:** `src/data/welcomeTestQuestions.ts` - add `audio_url` field to listening questions

---

### B. BACKEND CHANGES

#### B1. Auto-send email on test creation (Point 5)

Modify `WelcomeTestSuggestion.handleCreateAndSend` to call `send-test-email` edge function immediately after creating the test. Already have `send-test-email` edge function - just need to call it with the welcome test URL format (`/welcome-test/${token}` instead of `/test/${token}`).

Need to update `send-test-email/index.ts` to accept a `testUrl` parameter or detect welcome test type.

**Files:**

- `src/components/dashboard/WelcomeTestSuggestion.tsx` - add email sending after test creation
- `supabase/functions/send-test-email/index.ts` - accept custom URL path

#### B2. Email teacher on completion (Point 8)

In `process-welcome-test/index.ts`, after processing results, send email to teacher via Resend with:

- Student name
- Estimated level
- Key profile highlights
- Link to student's test results

**File:** `supabase/functions/process-welcome-test/index.ts`

#### B3. AI analysis of open answers (Point 15)

In `process-welcome-test/index.ts`, call Lovable AI Gateway to:

1. Evaluate open-ended answers (Q12, Q13, Q16, Q17, Q36, Q37, Q40, Q41, Q45) for quality
2. Generate a short AI summary of the student profile
3. Store in `student_learning_profiles.ai_summary` (new column)
4. Log mastery to `student_events` for open-ended questions

**Files:**

- `supabase/functions/process-welcome-test/index.ts` - add AI evaluation
- SQL migration - add `ai_summary TEXT` column to `student_learning_profiles`

#### B4. Add welcome test notification to teacher (Point 6)

Insert a row into `homework_notifications` table when welcome test is completed (reuse existing table with new `notification_type: 'welcome_test_completed'`).

**File:** `supabase/functions/process-welcome-test/index.ts`

#### B5. Speaking answer upload (Point 1)

Create small edge function or reuse `upload-to-r2` to store student audio recordings. The recorded audio blob gets uploaded, URL stored as the answer.

**File:** New utility in `src/hooks/useWelcomeTest.tsx` for audio upload

---

### C. FRONTEND CHANGES

#### C1. WelcomeTestPage.tsx - Major overhaul (Points 2, 4, 7, 9, 10, 11, 13)

**Pre-test flow (Point 7):**

1. Email verification modal (Point 4: add backdrop-blur behind it, show blurred test preview)
2. Version selection screen: two cards - "Quick Test (15 min, 22 questions)" and "Complete Test (30 min, 50 questions)"
3. Instruction screen: "Please answer honestly. If you don't know, click 'I don't know' or skip. This is NOT graded. Your teacher wants to understand how to help you best." + big round "Start Welcome Test" button

**During test:**

- Reduce height by ~15% (Point 10): smaller paddings, compact section tabs, smaller card padding
- Add "Pause Test" button (Point 13): saves progress, shows "You can come back anytime" message
- Show Translation toggle (Point 16): small globe icon button, shows translated question below original
- New question renderers for `speaking_record` and `listening_comprehension`

**Speaking recorder component:**

- Request microphone permission
- Record up to 60 seconds
- Show waveform visualization
- Upload to R2, save URL as answer
- Playback recorded answer

**Listening component:**

- Audio player (reuse existing AudioPlayer pattern)
- Show transcript toggle ("Show text" fallback)
- Multiple choice or open answer below

**Completion screen (Points 9, 11):**

- Add `react-confetti` (already installed) on completion
- Fix answer count: store `answeredCount` in the completion event/DB so it persists after refresh
- Show completion time

**Files:**

- `src/pages/WelcomeTestPage.tsx` - major rewrite
- `src/hooks/useWelcomeTest.tsx` - add pause/resume, audio recording, version selection
- New: `src/components/welcome-test/SpeakingRecorder.tsx`
- New: `src/components/welcome-test/ListeningPlayer.tsx`
- New: `src/components/welcome-test/VersionSelector.tsx`
- New: `src/components/welcome-test/InstructionScreen.tsx`

#### C2. NotificationBadge rename + welcome test events (Point 6)

- Rename component from `HomeworkNotificationBadge` to `NotificationBadge`
- Change header from "Homework Notifications" to "Notifications"
- Fetch from `homework_notifications` table (same table, new notification_types)
- Add icon differentiation: homework bell vs welcome test sparkle icon
- Navigate to student page Tests tab on welcome test notification click

**Files:**

- `src/components/homework/HomeworkNotificationBadge.tsx` - rename, expand
- All files importing it - update import

#### C3. WelcomeTestSuggestion banner improvements (Point 12, 18)

- When status is `pending`: show real-time progress "X/Y questions answered" (poll or subscribe to `student_test_questions`)
- When status is `completed`: don't hide - show "View Results" button for 7+ days
- Add "Preview before sending" button (Point 18): navigates to `/student/{id}?tab=tests` and auto-opens the welcome test

**File:** `src/components/dashboard/WelcomeTestSuggestion.tsx`

#### C4. Tests tab - auto-show welcome test (Point 17)

In `StudentTestsTab`, ensure welcome test always appears in the list. When teacher clicks it:

- Before student completes: show questions in read-only preview mode
- After completion: show questions + student answers + AI evaluation

**File:** `src/components/student-tests/StudentTestsTab.tsx`

#### C5. WelcomeTestResults - AI summary display (Point 15)

Add AI-generated summary section to teacher's results view. Show:

- Overall profile narrative
- Key recommendations
- Open answer evaluations with scores

**File:** `src/components/student-tests/WelcomeTestResults.tsx`

---

### D. ADDITIONAL IMPROVEMENTS (Point 20)

Based on pedagogical analysis, here are elements ordered by importance:

1. **Skip button per question** - student can skip without answering (don't force, reduces anxiety, more honest results) -  ok akceptuję
2. **"I don't know" quick button** - for grammar/vocab questions, faster than leaving blank, and tells us something -  ok akceptuję
3. **Progress save indicator** - visible "Saved" badge so student knows they won't lose progress -  ok akceptuję
4. **Estimated time remaining** - based on avg time per question and remaining questions -  ok akceptuję
5. **Section completion celebration** - small animation between sections ("Great job! 2 more sections to go") -  ok akceptuję
6. **Teacher notes on individual answers** - teacher can add notes when reviewing answers -  ok akceptuję
7. **Comparison with class average** - when teacher has multiple students, show how this student compares -  ok akceptuję
8. **Export to PDF** - teacher can export the full profile as PDF -  ok akceptuję
9. **Re-take option** - teacher can send a new welcome test after some time to compare progress -  ok akceptuję
10. **Profile integration with worksheet generation** - use learning profile data in AI prompt for worksheets (separate feature, not in this sprint)  -  nie akceptuję to będę robił osbno w ramach DSLM

For this sprint, implement items 1-9

---

## FILE CHANGES SUMMARY


| #   | File                                                    | Action          | Points                         |
| --- | ------------------------------------------------------- | --------------- | ------------------------------ |
| 1   | `src/data/welcomeTestQuestions.ts`                      | MODIFY          | 1, 2, 3, 19                    |
| 2   | `src/data/welcomeTestTranslations.ts`                   | NEW             | 16                             |
| 3   | `src/types/welcomeTest.ts`                              | MODIFY          | 1, 2                           |
| 4   | `src/pages/WelcomeTestPage.tsx`                         | MAJOR REWRITE   | 2, 4, 7, 9, 10, 11, 13, 16, 20 |
| 5   | `src/hooks/useWelcomeTest.tsx`                          | MODIFY          | 1, 2, 11, 13, 14               |
| 6   | `src/components/welcome-test/SpeakingRecorder.tsx`      | NEW             | 1                              |
| 7   | `src/components/welcome-test/ListeningPlayer.tsx`       | NEW             | 1                              |
| 8   | `src/components/welcome-test/VersionSelector.tsx`       | NEW             | 2, 7                           |
| 9   | `src/components/welcome-test/InstructionScreen.tsx`     | NEW             | 7                              |
| 10  | `src/components/dashboard/WelcomeTestSuggestion.tsx`    | MODIFY          | 5, 12, 18                      |
| 11  | `src/components/homework/HomeworkNotificationBadge.tsx` | MODIFY (rename) | 6                              |
| 12  | `src/components/student-tests/WelcomeTestResults.tsx`   | MODIFY          | 15                             |
| 13  | `src/components/student-tests/StudentTestsTab.tsx`      | MODIFY          | 17                             |
| 14  | `src/components/student-tests/TestDetailsView.tsx`      | MODIFY          | 17                             |
| 15  | `supabase/functions/process-welcome-test/index.ts`      | MODIFY          | 8, 15, 6                       |
| 16  | `supabase/functions/send-test-email/index.ts`           | MODIFY          | 5                              |
| 17  | SQL migration                                           | NEW             | 15 (ai_summary column)         |
| 18  | Sidebar import updates                                  | MODIFY          | 6                              |
| 19  | Documentation (6 docs)                                  | MODIFY          | all                            |


---

## IMPLEMENTATION ORDER

Due to the size, implementation will be done in 3 batches:

**Batch 1 - Core fixes + UX:**

- Points 3, 4, 9, 10, 11, 19 (quick fixes)
- Points 7, 2 (pre-test screens, version selector)
- Point 13 (pause/resume)

**Batch 2 - Communication + Notifications:**

- Points 5, 8 (auto-email send/receive)
- Point 6 (notifications rename)
- Points 12, 17, 18 (banner improvements, tests tab)

**Batch 3 - Advanced features:**

- Point 1 (speaking + listening with audio)
- Point 15 (AI analysis)
- Point 16 (translations)
- Point 20 (additional improvements 1-5)

---

## SAFETY

- All changes are additive - no existing functionality is modified
- New question types don't affect existing test rendering
- NotificationBadge rename is purely cosmetic + extension
- Audio recording is optional - student can skip speaking questions
- Translations are lazy-loaded - no impact on non-translation users
- Short version is a subset of Full - same data structure