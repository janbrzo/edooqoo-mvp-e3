
# English Worksheet Generator - Technical Documentation

## System Overview - ETAP 2+

The English Worksheet Generator is a full-featured SaaS platform built on React, TypeScript, and Supabase. After completing ETAP 2 and adding advanced exercise management, the application provides comprehensive account management, student organization, subscription-based worksheet generation, and advanced exercise manipulation capabilities for English teachers.

**Latest Update (February 2026) - Speaking Integration Phase:**
- **HomeworkSpeakingRecorder**: Students can record audio answers for open-ended exercises in Homework and Shared Worksheets. Audio is uploaded to R2 via `upload-to-r2` edge function
- **Audio transcription before AI eval**: On homework submission, audio URLs are transcribed via `transcribe-audio` (OpenAI Whisper) before being sent to `verify-open-answers` with `audio_transcription`, `audio_word_count`, `audio_duration_seconds`
- **Speaking score in AI eval**: `verify-open-answers` returns separate `writing_score` and `speaking_score` per answer, mapped to nano-skills containing `.wr.`/`.writing.` and `.sp.`/`.speaking.` respectively
- **Triple nano-skill tagging**: Open-ended exercises now generate 3 nano-skills (primary + writing + speaking) in prompt templates
- **Admin impersonation**: Admin dashboard at `/admin` with Magic Link login via `admin-impersonate` edge function, activity logging in `admin_activity_log` table

**Previous Update (February 2026) - DSLM + UX Improvements Phase 3:**
- **NanoSkill badges in all exercises**: All 22+ exercise components now pass `allNanoSkills` to `NanoSkillBadge`, enabling dual badge display (e.g. reading + writing) in Reading and other exercises
- **[V]/[G] exercise focus tags**: Exercises display `[V]` (vocabulary) or `[G]` (grammar) focus tags in both InputParamsCard ("Selected Exercise Types") and ExerciseHeader titles (e.g. "Exercise 7: [V] Discussing")
- **Add Exercise in Live Session**: New "Add Exercise" button in toolbar (Live Session only) opens `AddExerciseModal` to generate and append exercises to the worksheet (max 12). Auto-saves to database and syncs with shared worksheet
- **Delete worksheet in Overview**: `DeleteWorksheetButton` added to "Recent Worksheets" section in student Overview tab
- **Period + CEFR filters side-by-side**: SkillsOverviewPanel displays Period and CEFR filters in a single horizontal row
- **Student switcher scroll fix**: Replaced Radix ScrollArea with native `overflow-y-auto` div for reliable scrolling, blue icon color
- **Toolbar label shortening**: In Live Session mode, button labels shortened: "Homework" (was "Create Homework"), "Draw" (was "Draw on Worksheet"), "Hide"/"Show" (was "Hide/Show Drawings")

**Previous Update (February 2026) - DSLM Layer B v5 Phase 2:**
- **Flashcard nano_skill naming**: Trigger `log_flashcard_review_event()` now generates `ns.[CEFR].vocabulary.definition_[word]` format
- **Period filter always visible**: SkillsOverviewPanel now shows period filter even when no data exists for selected period
- **CEFR level filter**: New filter buttons (A1-C2) in SkillsOverviewPanel
- **Student switcher popover**: Clickable user icon in StudentPage header opens a popover with sorted student list

**Previous Update (February 2026) - DSLM Layer B v5 Implementation:**
- **Dual nano_skill system**: Open-ended exercises now include TWO nano_skills (primary skill + writing skill). Speaking nano_skills in written exercises use lower confidence (0.35-0.45) since assessment is indirect
- **CEFR-tagged nano_skills**: New naming convention `ns.[CEFR].[topic].[skill_name]` (e.g. `ns.A2.past_simple.irregular_verb_go`). Full English topic names replace abbreviations
- **visual_comprehension category**: New skill category for picture-based exercises (replacing incorrect "reading" categorization)
- **Word-specific matching**: Matching exercises use `ns.A2.vocabulary.definition_appetizer` instead of generic `definition_matching`
- **extract_micro_skill() updated**: Supports 3 formats: new CEFR (`ns.A2.past_simple.*`), old abbreviations (`ns.ps.*`), and legacy (`ns.grammar.past_simple_*`) with full backward compatibility
- **extract_skill_category() updated**: Maps CEFR-format skills to 8 categories (grammar, vocabulary, reading, speaking, writing, listening, visual_comprehension, pronunciation)
- **NanoSkillBadge dual display**: Shows both primary and secondary (writing) badges with category-specific labels (rd, wr, sp, li, vc)
- **masteryCalculator.ts**: `buildItemEvaluations()` now iterates ALL nano_skills per item, creating evaluations for each
- **safeGetAllNanoSkills()**: New utility in textObjectFixer.ts returning full nano_skill array

**Previous Update (February 2026) - DSLM Layer B Implementation:**
- **student_skill_metrics table**: Aggregated skill metrics per nano_skill per student with time-weighted mastery (exponential decay)
- **compute_skill_metric() function**: Weighted average mastery, trend analysis, history maintenance
- **Auto-refresh trigger**: `trg_refresh_skill_metrics` fires AFTER INSERT on `student_events`
- **student_category_metrics view**: Aggregates nano_skills into category-level metrics
- **SkillsOverviewPanel component**: "Skills" tab in StudentPage with radar chart and nano_skill list

**Previous Update (February 2026) - DSLM Layer A Finalization Round 12:**
- **Flashcard mastery backfill**: Calculated mastery for 407 old flashcard events using SM-2 weighted formula
- **Welcome test mastery backfill**: Calculated mastery from nano_skill_ratings average for ~180 welcome_test events
- **Layer A status**: ALL sources now have complete mastery and element_type data

**Previous Update (February 2026) - DSLM Layer A Cleanup Round 11:**
- **Data cleanup**: Deleted ~500 trash welcome_test events (NULL answer_id from old trigger), 20 legacy `event_source='test'` events
- **Flashcard mastery backfill**: Fixed 55 old events with inflated mastery=100 for repetition=1 (now correctly 50 per weighted formula)
- **Mastery auto-calculation in triggers**: Worksheet and homework triggers now auto-calculate mastery from `nano_skill_ratings` average when `NEW.mastery` IS NULL — ensures `student_events.mastery` column is always populated
- **Mastery backfill**: Updated ~194 existing worksheet/homework events with NULL mastery by computing average from their nano_skill_ratings payloads

**Previous Update (February 2026) - Welcome Test v2 Round 10:**
- **Transcription cache fix**: `process-welcome-test` now fetches FRESH `question_data` from DB before saving `ai_score`, preventing transcription overwrite by stale cache
- **Strict AI scoring prompt**: Detailed rubric with word count, time analysis, relevance checks. Brief/off-topic speaking = max 20-30pts. Minimal writing = max 15-25pts. Scale: 0-15 minimal → 86-100 excellent
- **Time context for AI**: Word count and `time_spent_seconds` passed to AI for fluency evaluation

**Previous Update (February 2026) - Welcome Test v2 Round 9:**
- **Automatic transcription**: `process-welcome-test` now saves speaking transcriptions to `question_data.transcription` — teachers see them automatically without clicking "Transcribe"
- **Transcribe button removed**: `TestDetailsView` no longer shows manual "Transcribe" button; transcriptions auto-load from `question_data`
- **AI per-question scoring (0-100)**: Each open-ended/speaking answer gets individual AI score; `is_correct` set based on score ≥40 threshold
- **Speaking score**: New `speaking_score` column in `student_learning_profiles`, calculated from AI scores of speaking questions (wt_q16s, wt_q36s, wt_q41s)
- **Writing score AI-based**: `writing_score` now uses AI per-question scores instead of binary is_correct counting
- **Communication → Speaking**: Replaced "Communication" with "Speaking" in Skill Scores UI (`WelcomeTestResults.tsx`)
- **Event payload mastery fix**: `nano_skill_ratings[0].mastery` inside `event_payload` JSON now updated with actual AI score (was stuck at -1)
- **Trigger fix**: `log_test_answer_event` trigger now skips welcome tests (prevents duplicate events with `event_source='test'`)
- **Duplicate events cleanup**: Deleted all `event_source='test'` events for welcome tests from `student_events`
- **Timer precision**: Added `visibilitychange` listener in `useWelcomeTest` — timer pauses when tab is inactive
- **Test results recalculation**: `calculate_test_results` called after AI scoring to update "Results by Skill" with correct speaking/writing scores

**Previous Update (February 2026) - Welcome Test v2 Round 4 Bug Fixes:**
- **SpeakingRecorder auto-save race condition fixed**: Merged auto-save and reset effects into one `useEffect` to prevent blob being cleared before upload. Now recordings reliably upload to R2 on Next click.
- **Skip question white screen fixed**: Added `flushPendingAnswer` and `goToNext` as dependencies to `skipQuestion` callback, preventing stale closures on section boundaries.
- **Teacher preview version guard**: `setTestVersion` now checks `isTeacherMode` — teacher preview no longer persists version to localStorage/DB, preventing student version lock.
- **Share link URL fixed**: `ShareTestModal` now accepts `testType` prop and generates correct `/welcome-test/` URL for welcome tests instead of `/test/`.
- **Quick Version results UI**: `TestDetailsView` filters out questions not in `WELCOME_TEST_SHORT_QUESTION_IDS` when displaying Quick Version results.
- **Translation default OFF**: Removed auto-set `translationLang` useEffect — translation now starts disabled, activates only on button click.
- **AI Analysis context**: `process-welcome-test` now receives and includes `test_version` in AI prompt for accurate Quick Version analysis.

**Previous Update (February 2026) - DSLM Layer A Audit & Normalization:**
- **Event naming normalized**: All old event_type/event_source variants consolidated to canonical names via SQL migration (5 UPDATE operations covering ~250 events)
- **Flashcard mastery formula**: Changed from binary 0/100 to weighted scale (0=fail, 50=1st correct, 70=2nd correct, 90=well-known, 100=mastered) based on SM-2 repetition + interval_days
- **Mastery column populated**: Flashcard trigger now sets `student_events.mastery` column (was NULL before)
- **Welcome test bloat cleanup**: Reduced from 146 to 14 `welcome_test_section_progress` events (kept latest per student+section)
- **TypeScript types synced**: `src/types/dslm/events.ts` rewritten with canonical event types, typed payloads, and `welcome_test` event source
- **EventLogPanel updated**: Added `welcome_test` to event source icons and colors

**Latest Update (February 2026) - Welcome Test v2 Round 3 Bug Fixes:**
- **SpeakingRecorder auto-save**: Added `questionId` prop — auto-uploads recording to R2 when student navigates to next question without clicking Save
- **Teacher audio playback**: Improved `isAudioAnswer` detection in `TestDetailsView` — recognizes R2 URLs (`pub-`, `r2.dev`), shows audio player for speaking answers
- **Transcription (Whisper)**: Rewrote `transcribe-audio` edge function to use OpenAI Whisper API (fetches audio binary, sends to `/v1/audio/transcriptions`)
- **TTS audio fix**: Fixed `generate-welcome-test-audio` — chunked base64 conversion (8KB chunks) to avoid stack overflow on large audio files
- **Q21 audio re-generated**: New TTS-1 audio with exact verbatim transcript (café dialogue), stored at R2
- **AI Analysis + speaking**: `process-welcome-test` now transcribes speaking answers (wt_q16s, wt_q36s, wt_q41s) via Whisper before AI analysis
- **Event dedup fix**: `useWelcomeTest` section key changed from `${sectionId}_${count}` to just `sectionId` — one event per section
- **Re-take preserves results**: Removed soft-delete of old test in `handleRetake` — previous test stays visible with results
- **Translate button**: Added auto-translate button that picks language from student's `native_language` profile
- **Full translations**: Completed all 10 language translation sets (PL, ES, DE, FR, PT, IT, TR, RU, CS, UK) to match Polish coverage
- **Blur modal improved**: Increased preview questions (2→4), opacity (0.30→0.50), stronger blur effect
- **Auth redirect**: `StudentPage` now redirects unauthenticated users to login with return URL instead of showing "Student not found"

**Previous Update (February 2026) - Welcome Test v2 Round 2 Bug Fixes:**
- **SpeakingRecorder**: Cross-browser mimeType detection (webm → mp4 → fallback), stale closure fix via `statusRef`, larger mobile button
- **Event logging**: Debounced `commitAnswer` — events only on blur/navigation, not every keystroke. Split `saveAnswer` into local update + commit
- **Score calculation**: Welcome tests now separate skill questions (grammar/vocab/reading/listening) from profiling questions in display
- **Cross-device resume**: First unanswered question found from DB answers, not localStorage position
- **Server-side traits**: `process-welcome-test` reconstructs `motivation_type`, `anxiety_level`, `ambiguity_tolerance`, `error_attitude`, `preferred_input_channel` from DB answers (not relying on frontend `detected_traits`)
- **Teacher email**: Completion email now includes clickable "View Results" link to student test results
- **Teacher access control**: Teachers opening student test link see blocking screen with link to results (can't accidentally answer)
- **Teacher notes**: Per-question textarea in `TestDetailsView`, saved in `question_data.teacher_note`
- **Re-take**: Button in test details creates new welcome test, archives old one
- **Auto-translation**: `native_language` from student profile auto-selects translation language
- **10 language translations**: Full translation sets for PL, ES, DE, FR, PT, IT, TR, RU, CS, UK
- **Mobile progress**: 49 question dots replaced with compact progress bar on mobile
- **Tab navigation fix**: `StudentPage` syncs `activeTab` with URL `searchParams` via `useEffect`
- **New edge functions**: `generate-welcome-test-audio` (TTS → R2), `transcribe-audio` (STT via Lovable gateway)
- **`answered_count`**: Added to `StudentTest` type definition

**Previous Update (February 2026) - Welcome Test v2 Bug Fixes & Features:**
- **DB Migration**: Expanded `student_test_questions.question_type` CHECK to include `speaking_record`, `listening_comprehension`, `self_assessment`, `scenario_reaction`, `preference_choice`, `open_reflection`, `self_assessment_matrix`. Made `homework_notifications.homework_id` nullable. Added `welcome_test_completed` to `notification_type` CHECK
- **Email sender**: Changed from "Worksheet Generator" to "EDOOQOO" in `send-test-email/index.ts`
- **ListeningPlayer**: Fixed duplicate transcript display, renamed "Show text (if you need it)" → "Show text (if listening doesn't work)", auto-show transcript when audio_url is empty
- **SpeakingRecorder**: Auto-saves recording on unmount (navigation away) via fire-and-forget upload
- **Answer hints removed**: Q26/Q27 descriptions no longer show correct answers in parentheses
- **Email modal**: Replaced gray placeholder rectangles with actual blurred test content behind modal
- **Translation toggle**: Globe button now has visible label "Translate" and proper border styling
- **Notifications**: `HomeworkNotificationBadge` uses separate queries instead of JOIN (handles nullable homework_id), title changed to "Notifications"
- **Welcome Test placeholder**: `StudentTestsTab` shows preview card with all sections/questions even before test is created
- **0/49 refresh fix**: `useWelcomeTest` now persists `answered_count` to DB and uses `Math.max()` of persisted vs computed count
- **Pause on refresh**: Returning to test with existing answers shows "Paused" screen with "Resume Test" button
- **Events dedup**: Changed from per-question to per-section event logging, `event_source` changed from `'test'` to `'welcome_test'`
- **process-welcome-test**: Fixed notification insert (null homework_id), event_source to 'welcome_test'

**Previous Update (February 2026) - AI Eval prompt strictness, feedback visibility, Create Homework debug:**
- **#1 AI prompt strictness**: `verify-open-answers` now penalizes non-answers ("I don't know", "nie wiem", etc.) with quality_score 0.0-0.1. Short non-meaningful answers (1-2 words) get 0.1-0.3. Non-English answers get 0.1-0.2. Passing (0.7+) requires genuine English sentence attempt
- **#2 AI Eval feedback on Shared Worksheet**: `item_evaluations` from DB now loaded by `useInteractiveSharedWorksheet` and `useLiveSessionAnswers`, passed through `SharedWorksheetContent` to exercise components via `aiEvaluations` prop. Display condition changed from `disabled` to `disabled || isSharedWorksheet`
- **#3 RPC update**: `get_worksheet_live_answers` now returns `item_evaluations` and `mastery` columns
- **#4 config.toml**: Added `verify_jwt = false` for `process-pending-ai-evaluations` Edge Function
- **#5 Create Homework error logging**: `WorksheetDisplay.handleCreateHomework` now logs `{ data, error }` response from edge function instead of silently catching

**Previous Update (February 2026) - eval_trigger reset, event_payload fix, Create Homework timing:**
- **#1 eval_trigger=NULL on student save**: Both `save_worksheet_answer` and `save_homework_answer` now reset `eval_trigger = NULL` on UPSERT. This ensures the SQL trigger correctly maps student saves to `student_learning_activity` instead of keeping stale AI eval trigger types
- **#2 event_payload structure restored**: Triggers now produce `answer_id` (UUID), `time_spent_seconds` (rounded), no raw `answers` blob. Matches original DSLM contract
- **#3 Create Homework AI eval moved to worksheet button**: `process-pending-ai-evaluations` is now called in `WorksheetDisplay.handleCreateHomework` (BEFORE modal opens), not inside `CreateHomeworkModal` (which was too late)
- **#4 10-min timer ref fix**: Changed `lastAiEvalTriggerRef.current = Date.now()` to `lastSavedAt.getTime()`, preventing edge case where saves made just before AI eval trigger had timestamps earlier than the trigger ref

**Previous Update (February 2026) - Fix Duplicate Events, Create Homework AI Eval & Remove close_tab:**
- **#1 SQL DELETE fix**: Removed `AND event_type = v_event_type` from DELETE in both triggers (`log_worksheet_answer_to_events`, `log_homework_answer_to_events`). Now DELETE removes ANY existing event for the same exercise, preventing duplicates when event_type changes (e.g. student types after AI eval)
- **#2 close_tab REMOVED**: Removed `close_tab` from CASE WHEN in both SQL triggers and removed AI evaluation queueing block from `useInteractiveSharedWorksheet.tsx` beforeunload handler. Answer saving on tab close remains intact
- **#3 Create Homework auto-queue**: `process-pending-ai-evaluations` now auto-queues evaluations for all open-ended exercises when `trigger_source = 'create_homework'`, fetching answers directly from `worksheet_student_answers` instead of relying on pre-queued items
- **#4 Updated AI eval scenarios**: `student_learning_activity` (student types, eval_trigger=NULL), `10min_AI_evaluation` (timer, eval_trigger='10min_inactivity'), `create_hw_AI_evaluation` (Create Homework button on worksheet toolbar), `submit_hw_AI_evaluation` (Submit Homework), `mark_done_evaluation` (Mark Done via RPC)

**Previous Update (February 2026) - Event Type Differentiation, Mark Done Metadata & AutoResize Textarea:**
- **#1 eval_trigger column**: Added `eval_trigger text` column to `worksheet_student_answers` and `homework_student_answers`. SQL triggers map this to specific `event_type` values in `student_events`
- **#2 process-pending-ai-evaluations**: Accepts `trigger_source` parameter and sets `eval_trigger` on the answer record before SQL trigger fires
- **#3 Mark Done metadata**: Changed `event_type` to `mark_done_evaluation` and `event_source` to `worksheet`
- **#4 AutoResizeTextarea component**: Auto-sets textarea height on initial render and value changes

**Previous Update (February 2026) - Mastery Logging, AI Eval Triggers & Homework Order Fixes:**
- **#1 SQL Trigger mastery field**: `log_worksheet_answer_to_events` now includes `NEW.mastery` in `event_payload`. This ensures `student_events` reflects accurate AI-evaluated mastery scores for all scenarios (close tab, Create Homework, 10-min timer, Live Session Mark Done)
- **#2 10-min timer AI processing**: After queuing AI evaluations in the inactivity timer, the system now calls `process-pending-ai-evaluations` Edge Function to actually process them (previously only queued without processing)
- **#3 AI waiting skeleton fix**: Changed condition from `!aiEvaluation` to `(!aiEvaluation || Object.keys(aiEvaluation).length === 0)` so skeleton shows even when aiEvaluation is an empty object `{}`
- **#4 Homework exercise ordering**: Added `.sort((a, b) => a - b)` before mapping selected exercises, preserving worksheet order (media exercises first) instead of Set insertion order

**Previous Update (February 2026) - UX & Progress Improvements:**
- **#1 HTML Export True/False Fix**: Strengthened radio button unchecking in student HTML export with `defaultChecked = false` and removal of answer labels
- **#2 Dashboard Student Search & Sort**: Added real-time search bar and A-Z/Z-A sorting toggle for student list. Default sort remains by most recent activity
- **#3 Task-Level Progress Bar**: Progress percentage now counts individual tasks (questions) instead of exercises. Display: "Progress: 1/8 exercises | 5/80 tasks (6%)"
- **#4 True/False Post-Submit Display**: After homework submit, True/False exercises show correct answers with green/red color coding and ✓/✗ indicators
- **#5 Matching Post-Submit Clarity**: Matching exercise now shows full definition text alongside correct letter after submit
- **#6 AI Evaluation Waiting Indicator**: After submit, open-ended exercises show "AI is evaluating your answers..." animated skeleton until feedback arrives
- **#7 Listening Comprehension in OPEN_ENDED_TYPES**: Added to renderer's open-ended list for AI evaluation loading indicator

**Previous Update (February 2026) - AI Evaluation Fixes v2:**
- **#1 Create Homework triggers AI Eval FIRST**: `CreateHomeworkModal` now calls `process-pending-ai-evaluations` BEFORE creating the homework record, ensuring worksheet AI scores are available immediately
- **#2 Listening Comprehension AI Eval**: Added `'listening-comprehension'` to `openAnswerTypes` list in `useInteractiveHomework.tsx` for homework AI verification
- **#3 Items field lookup**: Added `exerciseData?.items` to question items lookup in homework AI mastery sync (line 400)
- **#4 Robust JSON parsing**: `verify-open-answers` Edge Function now handles truncated JSON responses: truncates after last `]`, repairs unclosed braces, retries with last incomplete object removed. `max_tokens` increased from 2000 to 4000
- **#5 Specific AI feedback**: System prompt updated to require SPECIFIC feedback (not generic). Dynamic fallback improved with score-based messages

**Previous Update (February 2026) - AI Evaluation Conditional Triggers & Improved Feedback:**
- **#1 Conditional AI Evaluation**: AI Evaluation for shared worksheets now uses `last_saved_at > last_ai_eval_at` logic. Evaluation triggers only when student has made NEW changes since last evaluation
- **#2 Three AI Evaluation Triggers**: Close Tab (fetch+keepalive), Create Homework, 10-Minute Inactivity Timer
- **#3 Database Changes**: Added `last_ai_eval_at TIMESTAMPTZ` column to `worksheet_student_answers`. New RPC functions: `needs_ai_evaluation()`, `mark_ai_evaluation_done()`

**Previous Update (February 2026) - AI Evaluation Logging & Display Fixes:**
- **#1 AI Evaluation Per-Item Display**: AI evaluation badges now render directly under each answer input (not at bottom of exercise). Updated 8 exercise components: `ExerciseAnswerQuestions`, `ExerciseDialogue`, `ExerciseReading`, `ExerciseListeningComprehension`, `ExerciseDescribe`, `ExerciseParaphrasing`, `ExerciseAnswerQuestionsAudio`
- **#2 Mastery Sync After AI Evaluation**: `submitHomework()` now updates `item_evaluations` and `mastery` columns alongside `ai_evaluation` after receiving AI scores. Uses `quality_score * 100` for per-item mastery calculation
- **#3 Dialogue Exercise Support**: Added `expressions` to question item lookup in AI verification: `exerciseData?.questions || exerciseData?.prompts || exerciseData?.sentences || exerciseData?.expressions`
- **#4 Submit Button Fix**: Removed `isSaving` from button disabled condition - now only blocked during actual submission (`isCompleting`)
- **#5 Updated `InteractiveExerciseProps`**: Added `aiEvaluations?: Record<number, AiEvaluation>` prop for passing per-question AI feedback to exercise components

**Previous Update (January 2026) - Per-Item Nano Skill Ratings in Events:**
- **#1 New `item_evaluations` Column**: Added `item_evaluations JSONB` column to `worksheet_student_answers` and `homework_student_answers` tables. Stores per-item `nano_skill_ratings` array matching `exercise_mastery_evaluation` format
- **#2 RPC Functions Updated**: `save_worksheet_answer` and `save_homework_answer` now accept `p_item_evaluations JSONB` parameter
- **#3 SQL Triggers Updated**: `log_worksheet_answer_to_events` and `log_homework_answer_to_events` now include `nano_skill_ratings` from `item_evaluations` column in event payload
- **#4 New Utility `masteryCalculator.ts`**: Centralized per-item mastery calculation logic exported from new utility file:
  - `calculateItemMastery()` - calculates 0-100% for single item in closed exercises
  - `buildItemEvaluations()` - builds array of `{name, reason, mastery}` for all items with nano_skill
  - `calculateOverallMastery()` - calculates average mastery for entire exercise
  - `safeGetNanoSkill()` - safely extracts nano_skill data from various item structures
- **#5 Frontend Hooks Updated**: `useInteractiveSharedWorksheet` and `useInteractiveHomework` now use `buildItemEvaluations()` to build per-item ratings and pass to RPC
- **#6 NanoSkill Tooltip Fixed**: Replaced `Tooltip` with `HoverCard` component in `NanoSkillBadge.tsx` - more reliable for rich content display with proper z-index handling

**Event Payload Structure After Update:**
```json
{
  "exercise_index": 0,
  "exercise_type": "multiple-choice-picture",
  "answers": { "0": "A", "1": "B" },
  "mastery": 60,
  "nano_skill_ratings": [
    { "name": "ns.reading.main_activity_identification", "reason": "Tests ability to identify central action", "mastery": 100 },
    { "name": "ns.reading.detail_inference", "reason": "Tests inference from visual context", "mastery": 0 }
  ],
  "time_spent_seconds": 7.4
}
```

**Previous Update (January 2026) - 5 Critical Fixes (Tooltip, AI Per-Question, MC Audio Shuffle, Mastery Calculation):**
- **#1 P5 - MC Audio Shuffle Consistency**: Added `worksheetId={worksheet.id}` prop to `ExerciseMultipleChoiceAudio` in `SharedWorksheetContent.tsx` - ensures same A,B,C,D order in both student view and Live Session
- **#2 P3 - NanoSkill Tooltip Fixed**: Replaced `TooltipPrimitive` with standard shadcn/ui `Tooltip` component in `NanoSkillBadge.tsx`. Now appears instantly on hover and disappears immediately when cursor leaves
- **#3 P4 - AI Evaluation Per-Question**: Complete refactor of AI verification system:
  - `useInteractiveHomework` now sends each question separately to `verify-open-answers` (not aggregated per exercise)
  - AI evaluations stored as `Record<number, Record<number, AiEvaluation>>` (exercise_index → question_index → evaluation)
  - `HomeworkExerciseRenderer` displays individual `AiEvaluationBadge` per question with "Question X:" labels
  - Database stores `{ question_evaluations: [{question_index, is_acceptable, quality_score, feedback}, ...] }` per exercise
- **#4 P1/P2 - Mastery Calculation for Closed Exercises**: New `calculateClosedExerciseMastery()` function in both hooks:
  - Automatically calculates 0-100% score for 14 closed exercise types (multiple-choice, true-false, matching, fill-in-blanks, etc.)
  - Called in `scheduleAutoSave()` and `saveOnBlur()` before saving to database
  - Compares student answers against correct answers from exercise data structure
  - `mastery` field now populated in `worksheet_answer_saved` and `homework_answer_submitted` events

**Previous Update (January 2026) - 5 Critical Fixes (Event Logging, Tooltip, AI Display, Live Session):**

**Previous Update (January 2026) - DSLM Mastery Unification + NanoSkill Tooltip Fix:**
- **#1 Unified Mastery Field**: All student events now include `mastery` (0-100%) in `event_payload`:
  - `worksheet_answer_saved`: `mastery` passed via RPC `p_mastery` parameter
  - `homework_answer_submitted`: `mastery` calculated from AI `quality_score × 100` or passed directly
  - `flashcard_review`: `mastery` mapped from `quality_rating` (≥2 → 100, else 0) - replaces `is_correct`/`quality_rating`
- **#2 SQL Triggers Updated**: All 4 event triggers now include `mastery` in payload. AI evaluation trigger also updates `mastery` column
- **#3 Frontend RPC Functions**: `save_worksheet_answer` and `save_homework_answer` now accept optional `p_mastery` parameter
- **#4 NanoSkill Tooltip Fix**: Added `avoidCollisions`, `collisionPadding`, `sticky="always"`, and `style={{ position: 'fixed', zIndex: 10000 }}` to `TooltipPrimitive.Content`. Removed `overflow-hidden` from ExerciseSection container

**Previous Update (January 2026) - 3 DSLM/UI Fixes:**
- **#1 Flashcard quality_rating**: Added `last_quality_rating` column to `flashcard_progress` table. SQL trigger now includes `quality_rating` (0=Again, 2=I Know This) in event payload - provides explicit tracking of button clicks independent of `correct_count` delta
- **#2 Matching Box Sizes**: Changed grid from `5:7` to `6:6` split, set `min-h-[52px]` (was `min-h-[44px]`), and reduced SelectTrigger to `w-14 h-8` - now matches Synonyms/Antonyms and MatchingHalves exactly
- **#3 NanoSkill Tooltip Fix**: Refactored `NanoSkillBadge.tsx` to use `TooltipPrimitive.Portal` directly with proper `z-[9999]` and animation classes - tooltip now renders outside DOM hierarchy reliably

**Previous Update (January 2026) - DSLM Event Improvements + 2 UI Fixes:**
- **#1 Matching Box Size Consistency**: Added `h-[36px]` to SelectTrigger in ExerciseMatching.tsx - ensures left column boxes (with dropdowns) match right column box heights
- **#2 NanoSkill Tooltip Fix**: Replaced unreliable HoverCard with Tooltip component in NanoSkillBadge.tsx - now reliably shows skill details (name, reason, confidence) on hover
- **#3 Create Homework Button Disable**: Added `isGeneratingExercises` to disabled condition - prevents creating homework while exercises are still being generated
- **#4 Multiple Choice Audio Styling**: Changed icon from `rounded-md` to `rounded-full` and replaced RadioGroup with custom clickable divs - now matches standard Multiple Choice visual style exactly
- **#5 Homework Visual Consistency**: Created new `HomeworkExerciseRenderer.tsx` component that renders exercises identically to SharedWorksheetContent.tsx - same purple header, icons, paddings. HomeworkPage now uses this instead of ExerciseSection

**Previous Update (January 2026) - 6 Bug Fixes:**
- **#1.1 Homework Modal Exercise Filtering**: CreateHomeworkModal now filters available exercise types based on worksheet media - Picture exercises only shown if worksheet has image, Audio exercises only shown if worksheet has audio. Uses `worksheetHasPicture` and `worksheetHasAudio` props from WorksheetDisplay
- **#1.2 Homework NanoSkill Badges for Teachers**: HomeworkPage now passes `viewMode={isTeacher ? "teacher" : "student"}` to ExerciseSection, enabling NanoSkill badge visibility for logged-in teachers
- **#2 Matching Box Size Consistency**: All matching exercises (Matching, SynonymsAntonyms, MatchingHalves) now use `min-h-[52px]` for both left and right columns
- **#3 NanoSkill Tooltip Portal Fix**: NanoSkillBadge now uses HoverCardPrimitive directly for correct tooltip rendering

**Previous Update (January 2026) - Scenario/Writing Task Format Support:**
- **ExerciseWritingTask Component**: NEW component to handle AI-generated `scenario_prompt + tasks` JSON format. Supports homework with complex structure containing scenario context, task sections with headings, and individual questions with nano_skills
- **Format Detection**: ExerciseSection.tsx now detects `scenario_prompt + tasks` format in `describe` exercises and renders ExerciseWritingTask instead of ExerciseDescribe
- **Interactive Support**: Full support for student answers with unique keys (`taskIndex-questionIndex`), auto-save, and teacher/live-session views
- **Backward Compatible**: Standard `describe` exercises continue to render with ExerciseDescribe

**Previous Update (January 2026) - 3 Critical Bug Fixes:**
- **#1 Describe-Picture AI Verification Not Triggering**: FIXED the root cause - `normalizeExerciseType()` was converting `describe-picture` to `describe`, but `EXERCISE_TYPE_CLASSIFICATION.open` only contained `describe-picture`. Added BOTH `describe-picture` AND `describe` to the open array. Also fixed condition in `handleMarkDoneWithModal` to check `exerciseType === 'describe' || exercise.type === 'describe-picture'`
- **#2 Paraphrasing Shows NanoSkill & Empty Suggested Answer**: Applied `safeGetText()` to BOTH `sentence.word_to_use` (lines 62, 70) AND `sentence.answer` (lines 99, 104) in `ExerciseParaphrasing.tsx`. Now displays clean "Use: nearby" and proper "Suggested answer: ..."
- **#3 Synonyms/Antonyms Matching Section Location**: Redesigned to match `ExerciseMatchingHalves.tsx` layout - Select dropdown is now INLINE in the left Words column, not in a separate section below. Removed redundant "Match the Words" section

**Previous Update (January 2026) - 5 Bug Fixes:**
- **#1 Matching Halves Mastery 50% Fix**: `NanoSkillMasteryModal.tsx` now calculates correct answer letter dynamically using the same seeded shuffle algorithm as `ExerciseMatchingHalves.tsx`. Previously used non-existent `correct_match` field - now calculates `shuffledPosition` of item and compares with student letter. Each item shows individual 80%/30% score
- **#2 Describe-Picture AI Verification**: Added `'describe-picture'` to `EXERCISE_TYPE_CLASSIFICATION.open` array. AI evaluation now triggers correctly for this exercise type
- **#3 TRUE/FALSE Radio Buttons in Student HTML**: `htmlExport.ts` now unchecks ALL radio buttons (`input[type="radio"]`) by setting `checked = false` and removing `checked` attribute. Student exports show empty radio buttons
- **#4 Paraphrasing "Use:" Shows NanoSkill**: `ExerciseParaphrasing.tsx` now uses `safeGetText()` for `word_to_use` field (lines 62, 70). Displays clean "Use: nearby" instead of `{text: "nearby", nano_skill: {...}}`
- **#5 Synonyms/Antonyms Missing Definitions**: `ExerciseSynonymsAntonyms.tsx` now ALWAYS renders the shuffled definitions column (A, B, C...) regardless of `isInteractive` state. Shared worksheets now correctly show terms on left, definitions on right, with matching section below for interactive mode

**Previous Update (January 2026) - 4 Live Session & HTML Export Fixes:**
- **TRUE/FALSE in Student HTML**: `htmlExport.ts` removes answer indicators (`.text-green-600`, `True/False` text, `.teacher-answer`) when exporting in student view mode
- **Mastery Evaluation Fix for 4 Exercise Types**: Extended `calculateInitialMasteryForItem` to handle: Synonyms/Antonyms (match letter with definition position), Error Correction (check BOTH `sentence.correction` AND `sentence.correct`)
- **Audio/Image Context for AI**: AI verification includes `audio_transcript` and `image_description` from exercise data
- **Enhanced AI Logging**: `verify-open-answers` Edge Function logs full request, prompts, and responses for debugging

**Previous Update (January 2026) - Mastery Evaluation Save Fix (skill_ids Type Change):**
- **Column Type Changed**: `student_events.skill_ids` column type changed from `uuid[]` to `text[]` via SQL migration - allows storing skill names directly instead of requiring UUID foreign keys
- **RPC Function Updated**: `add_student_event` function recreated with `p_skill_ids text[]` parameter - now accepts array of skill name strings
- **Direct RPC Call**: ExerciseSection.tsx uses direct `supabase.rpc('add_student_event', {...})` call for saving mastery evaluations with skill names in `p_skill_ids` parameter
- **Enhanced Logging**: Added detailed `📤 [Mastery]` and `✅ [Mastery]` logs showing exact RPC parameters and results for debugging
- **Hook Warning Logs**: useStudentEvents.tsx logs `⚠️ [useStudentEvents] addEvent skipped` when invalid IDs are passed

**Previous Update (January 2026) - JSON Parsing Crash Fix & Monitoring:**
- **#1 WorksheetPage Fallback**: Added graceful fallback to `html_content` when `ai_response` JSON parsing fails. Logs ai_response length for monitoring truncation issues. Shows toast notification when using fallback data.
- **#2 StudentHomeworkTab Crash Fix**: Added try-catch around `JSON.parse(firstWorksheet.ai_response)` in CreateHomeworkModal exercises prop - prevents white screen crash on corrupted worksheet data.
- **#3 ai_response Limit Increased**: Backend `generateWorksheet` function now saves up to 200,000 characters instead of 50,000 (lines 535 and 734). Prevents truncation for large worksheets.
- **#4 Truncation Monitoring**: Added logging in Edge Function: `📊 [MONITORING] ai_response length: X chars, limit: 200000, truncated: true/false`. Console warnings appear when data is truncated for later analysis.

**Previous Update (January 2026) - 5 Mastery Evaluation & Shared Worksheet Fixes:**
- **#1.1 Slider Values for 7 Exercise Types**: Extended `calculateInitialMasteryForItem` to correctly handle Error Correction (sentence.correct), Word Order (sentence.correct_order), Negative Prefixes/Complete Word (word.answer/complete), Categorize (categories.correct_items mapping), and improved Matching Halves (half.correct_match only). Each item now shows individual 80%/30% value based on correctness.
- **#2 AI Verification Extended**: Added `listening-comprehension` to OPEN_ENDED_EXERCISE_TYPES. Fixed `describe-picture` question retrieval to check `exercise.prompts` array. Full response now logged to console for debugging.
- **#3 Exercise Type Classification**: New `EXERCISE_TYPE_CLASSIFICATION` constant defines all 29 exercise types as `open` (9 types requiring AI) or `closed` (20 types with automatic verification).
- **#4 Instant Modal with Loading State**: Modal opens IMMEDIATELY when clicking "Mark Done" for open-ended exercises. Shows "AI is evaluating student answers..." spinner while AI processes. Buttons disabled during evaluation.
- **#5 Synonyms/Antonyms in Shared Worksheet**: Added `worksheetId` and `isSharedWorksheet={true}` props to ExerciseSynonymsAntonyms in SharedWorksheetContent.tsx. Ensures consistent shuffle between teacher and student views.

**Previous Update (January 2026) - Shared Worksheet White Screen Fix:**
- **React Error #31 Fix**: SharedWorksheetContent.tsx now uses `safeGetText()` to extract text from `{text, nano_skill}` objects before rendering. Fixed in 4 locations: Warmup Questions (line 184), Discussion Questions (line 404), Error Correction (line 492), True/False Statements (line 694). Prevents "Objects are not valid as a React child" crash for worksheets with nano_skill data.

**Previous Update (January 2026) - Mastery Evaluation Fixes (3 Problems):**
- **#1.1 True-False/Matching/OddOneOut Fix**: `calculateInitialMasteryForItem` now correctly handles: True-False uses `statement.isTrue` (not `.correct`), Matching Halves compares with `half.correct_match`, Odd One Out uses case-insensitive `question.correct_answer`. Each item displays individual mastery value (80% correct, 30% incorrect)
- **#1.2 AI Verification for Open-Ended**: Before opening mastery modal for open-ended exercises (dialogue, discussion, describe-picture, answer-questions, paraphrasing, reading), system calls `verify-open-answers` Edge Function. AI returns `quality_score` (0-1) converted to percentage (0-100%) and displayed as slider initial value
- **#2 Save Evaluation Fixed**: Added validation for `studentIdProp`/`teacherIdProp` before calling `addEvent`. Props `aiEvaluations` and `isLoadingAiEvaluation` now properly passed to NanoSkillMasteryModal
- **Exercise Type Classification**: Open-ended (AI verification): dialogue, discussion, describe-picture, answer-questions*, paraphrasing, reading, listening-comprehension. Closed (automatic 0/1): fill-in-blanks, multiple-choice, true-false, matching*, odd-one-out, categorize, complete-word, synonyms-antonyms, negative-prefixes, word-order, gap-text, sentence-transformation, error-correction

**Previous Update (January 2026) - 5 New UX Fixes:**
- **#1 Dynamic Title Truncation**: WorksheetHeader now dynamically calculates `maxTitleLength = 59 - 5 - studentNameLength` ensuring titles always fit in one line regardless of student name length. Full title shown in tooltip on hover
- **#2.1 Random Selection EXACT Count**: Random mode now always selects exact `maxExercises` (6 or 8). Added validation loop to fill any missing slots from general exercises pool
- **#2.2/2.3 Media-Aware Auto-Complete**: Fallback auto-complete in `submitForm()` filters exercises by media type - no Picture exercises without Picture mode, no Audio exercises without Audio mode. Uses `PICTURE_COMPATIBLE_EXERCISES` and `AUDIO_COMPATIBLE_EXERCISES` constants
- **#3 Generation Time Calculator**: New `calculateExpectedTime()` function: base 45s + 25s(audio) + 20s(image) + 8s(grammar) + 4s(per extra exercise over 6). Results rounded to 10s for clean display ("~50s", "~1:20 min")
- **#4 Multiple Choice Consistent Order**: `worksheetId` now passed to `ExerciseMultipleChoice` in SharedWorksheetContent.tsx - ensures identical A/B/C/D answer order for teacher and student views
- **#5 Matching Halves Inline Dropdowns**: Moved Select dropdown directly into "Sentence beginnings" section (next to number). Removed old separate interactive section below grid. Student now picks answer inline with each sentence

**Previous Update (January 2026) - 5 New Problem Fixes (UX & Demo Mode):**

**Previous Update (January 2026) - 8 Problem Fixes:**
- **#1 Mastery Slider Presets**: NanoSkillMasteryModal now pre-fills slider values based on student answers from Live Session (80% correct, 30% incorrect, 50% partial, null=no answer). Only skills with explicitly set values are saved to `student_events`
- **#2 Pin Labels Animation**: Added 5-second animated labels for "Pin image" and "Pin audio player" buttons (matching FAB style)
- **#3 Save Evaluation UPSERT**: Fixed Save Evaluation to properly save to `student_events` - now uses UPSERT pattern to update existing records instead of creating duplicates
- **#4 Multiple Choice Shuffle**: Implemented deterministic shuffle using worksheetId as seed for Multiple Choice (including Audio/Picture variants) - ensures consistent A/B/C/D distribution across views
- **#5.1 Rename Immediate Update**: Worksheet title now updates immediately in UI after rename (uses localTitle state)
- **#5.2 Student Assignment Immediate**: Student name updates immediately after transfer (uses localStudentName state with onStudentNameChange callback)
- **#6.1 Quick Note Dropdown**: Category dropdown now displays above panel (`side="top"`)
- **#6.2 Minimized Icons Position**: Quick Notes icon at `bottom-20 left-4`, Draft Notes at `bottom-4 left-4` - arranged vertically
- **#6.3 Auto-hide Panel Headers**: Panel headers now auto-hide and appear on hover, with Pin button to keep permanently visible

**Previous Update (January 2026) - Live Session Enhancements & UI Fixes:**
- **#1 NanoSkill Editable**: NanoSkillBadge edit pencil now shows when `onEdit` prop is passed (removed `isEditing` condition). Added NanoSkill support to `error-correction`, `true-false`, and `discussion` exercises with full edit callbacks
- **#2 z-index Fix**: Increased z-index to `z-[100]` for StudentKnowledgeFAB, StudentKnowledgeMiniList, StudentKnowledgeFloatingPanel, and FlashcardFABs - all modals/FABs now display above WorksheetToolbar (z-[60])
- **#3 FAB Tooltips Unified**: Removed native `title=""` attributes from FAB buttons - all FABs now show consistent animated labels (not ugly browser tooltips)
- **#4 InputParamsCard Truncation**: Reduced MAX_CHARS from 60 to 55 - parameters now fit in single line with "Show more" button
- **#5 Flashcards Null Fix**: Added null fallback `studentName || 'Student'` in FlashcardSetsSection - prevents "Cannot read properties of null (reading 'trim')" crash

**Previous Update (January 2026) - 7 Problem Fixes:**
- **CRITICAL BUG FIX**: Fixed `TypeError: Cannot read properties of undefined (reading 'replace')` that caused blank page after worksheet generation
- **safeGetText Enhanced**: Function in `textObjectFixer.ts` now handles `undefined`, `null`, nested objects, and always returns a string (never crashes)
- **safeGetNanoSkill Enhanced**: Now handles `nano_skill` as both object `{...}` and array `[{...}]` formats (Gemini sometimes returns arrays)
- **Components Updated**: All 16 exercise components now use `safeGetText()` for safe `.text` property access
- **Pattern**: All components extract text safely: `const sentenceText = safeGetText(sentence?.text ?? sentence);` then use `sentenceText.replace()` which never fails

**Previous Update (January 2026) - AI Model Migration to Gemini 2.5 Flash + JSON Mode:**
- **Performance Fix**: Migrated from GPT-5-mini to Gemini 2.5 Flash as primary model - 8-exercise worksheets now complete in ~120s (was: timeout at 150s)
- **JSON Mode Enabled**: Added `responseMimeType: "application/json"` to force Gemini to return valid JSON (fixes SyntaxError crashes)
- **Fallback System**: GPT-5-mini remains as automatic fallback if Gemini fails (API error, rate limit)
- **JSON Repair**: Enhanced `parseAIResponse()` in `helpers.ts` with automatic JSON repair for trailing commas, missing braces, etc.
- **Uses Existing Key**: Leverages `GEMINI_API_KEY` already configured in Supabase secrets (shared with image generation)
- **Speed Improvement**: ~90 tokens/second (Gemini) vs ~40 tokens/second (GPT-5-mini) = 2.25x faster
- **Logging Enhanced**: Edge Functions now log which model was used (`📊 Used model: gemini-2.5-flash` or `📊 Used model: gpt-5-mini-2025-08-07`)
- **Both Functions Updated**: `generateWorksheet` and `generate-test` now use Gemini with OpenAI fallback
- **No Quality Degradation**: Gemini 2.5 Flash is excellent for structured JSON generation

**Previous Update (January 2026) - NanoSkill Rendering & URL Fix:**
- **CRITICAL BUG FIX**: Fixed React Error #31 where AI-generated items with `{text, nano_skill}` structure crashed rendering
- **textObjectFixer Enhanced**: Added `safeGetText()` and `safeGetNanoSkill()` helpers in `src/utils/textObjectFixer.ts` for safe text extraction
- **ExerciseSection Fixed**: Discussion questions now safely handle both string and object question formats
- **URL After Generation**: Worksheet URL now updates to `/worksheet/{id}` immediately after generation (uses `window.history.pushState`)
- **NanoSkillBadge Component**: New `src/components/worksheet/NanoSkillBadge.tsx` displays nano_skill as colored badge with tooltip (confidence-based colors)
- **Exercise Components Updated**: `ExerciseFillInBlanks.tsx` and `ExerciseMultipleChoice.tsx` now display nano_skill badges for teachers (not on shared worksheets)

**Previous Update (January 2026) - DSLM Pedagogical Skill Tagging System (v2 - Simplified):**
- **nano_skill ONLY**: Every exercise item now includes exactly ONE `nano_skill` object with `name`, `confidence`, `reason` fields (micro_skill removed for token optimization)
- **PEDAGOGICAL SKILL TAGGING**: Section in `core-instructions.ts` defines tagging rules - one atomic nano_skill per item
- **generate-test Synchronized**: `generate-test/index.ts` system prompt and example JSON updated to require single `nano_skill` (no micro_skill)
- **Homework Uses generateWorksheet**: Homework generation inherits the same prompts via `useHomeworkExerciseGeneration.tsx`
- **Syntax Fix**: Corrected `""nano_skill"` syntax error in `individual-exercises.ts` line 851

**Previous Update (January 2026) - DSLM Stage 1.4 Full Event Collection Fixes:**
- **CRITICAL: Timestamp Fix**: Changed `student_events.created_at` DEFAULT from `(now() AT TIME ZONE 'Europe/Warsaw')` to `now()` - all events now store correct UTC time
- **Homework Events Enhanced**: `log_homework_answer_event()` trigger now includes `time_spent_seconds` (calculated from started_at to submitted_at) and `is_correct` (from ai_evaluation.is_acceptable) in event payload
- **AI Evaluation Display**: New `AiEvaluationBadge.tsx` component shows AI quality score and feedback in `HomeworkReviewPage.tsx` for teachers reviewing open-ended answers
- **ShareTestModal Integration**: `TestDetailsView.tsx` now opens `ShareTestModal` when clicking "Share Test" - allows copying link and sending via email (like flashcard sharing)
- **Edge Function Logging**: Added detailed console logs to `verify-open-answers` for debugging (request body, API key status, response parsing)

**Previous Update (January 2026) - DSLM Stage 1.3 Full Event Collection Fixes:**
- **Worksheet Events UPSERT**: Changed `log_worksheet_answer_event()` trigger from INSERT to UPSERT pattern - now only ONE event per worksheet + exercise combination, always with latest data (no more duplicate events)
- **Worksheet Event Payload**: Now includes full `answers` content in event payload for diagnostic analysis
- **Homework Email localStorage**: `HomeworkPage.tsx` now remembers verified email for 24 hours in localStorage - students don't need to re-enter email on page refresh
- **Test Email Verification**: `StudentTestPage.tsx` now requires email before starting test, stored in localStorage for 24h
- **Share Test Modal**: New `ShareTestModal.tsx` component for sharing tests with students (copy link + send email)
- **send-test-email Edge Function**: New Edge Function to send test links via email (using Resend API)
- **AI Verification Expanded Types**: Extended `openAnswerTypes` in `submitHomework()` to include `describe-picture`, `answer-questions-picture`, `paraphrasing`, `speaking`, `sentence-transformation`, `essay`, `gap-text`, `word-order`
- **AI Verification Logging**: Added detailed console logs for debugging AI verification process
- **Time Display Fix**: Removed misleading "(UTC)" suffix from EventLogPanel - `format()` already displays local time
- **Flashcard Response Time DB**: Added `last_response_time_ms` column to `flashcard_progress` table
- **Flashcard Event Time**: Flashcard review events now include `response_time_ms` in payload from database column

**Previous Update (January 2026) - DSLM Stage 1.2 Event Collection Fixes:**
- **New Tests Tab**: Added 7th tab "Tests" to StudentPage.tsx with ClipboardCheck icon - for creating and managing AI-powered student tests
- **Database Tables**: Created `student_tests`, `student_test_questions`, `test_skill_results` with full RLS policies and sharing capabilities
- **Edge Function**: `generate-test` uses GPT-4o-mini to generate personalized test questions based on:
  - Student's English level and main goal
  - Learning elements from Progress module (skills with low ratings)
  - Knowledge Base entries (weaknesses, common mistakes)
  - Flashcard vocabulary the student struggles with
- **Test Types**: Placement, Progress Check, Skill Verification, Goal Achievement
- **Question Types**: Multiple choice, fill in blank, true/false, matching
- **Hooks**: `useStudentTests.tsx` for tests CRUD operations
- **Components**: `StudentTestsTab.tsx` displays test list and statistics
- **Share Functionality**: Tests can be shared with students via token-based links
- **Progress Integration**: Test results can update Learning Elements ratings in Progress module

**Previous Update (December 2025) - Student Progress Tracking System:**
- **Unified Main Goals**: Created `src/constants/studentGoals.ts` with centralized MAIN_GOALS list (9 options including new: Social Conversation, Personal Development, Fun & Entertainment)
- **New Progress Tab**: Added 6th tab "Progress" to StudentPage.tsx with TrendingUp icon - tracks student learning goals and progress
- **Database Tables**: Created `student_progress_goals`, `student_learning_elements`, `future_worksheet_suggestions` with full RLS policies
- **Hooks**: `useStudentProgress.tsx` for goals/elements CRUD, `useFutureTimeline.tsx` for AI-powered worksheet suggestions
- **Components**: `StudentProgressTab.tsx` with Progress Overview, Supporting Goals, Additional Goals, Future Timeline sections
- **AI Timeline Generation**: Edge function `generate-timeline` uses Lovable AI Gateway (Gemini 2.5 Flash) to suggest 2-4 personalized worksheets
- **Learning Elements**: 11 element types (grammar, vocabulary, pronunciation, etc.) with 1-5 star rating system
- **Goal Types**: "Supporting" (aligned with main goal) and "Additional" (side objectives)
- **Use This Feature**: One-click pre-fill of worksheet generator from timeline suggestions

**Previous Update (December 2025) - Navigation & UX Improvements:**
- **Navigation Sidebar Highlighting**: Added `isGrammarActive` and `isVocabularyActive` to `useWorksheetNavigation` hook - G/V buttons now highlight when scrolling to those sections
- **Student Page Tab URLs**: Added `useSearchParams` to sync active tab with URL - refreshing page now preserves current tab (`/student/:id?tab=worksheets`)
- **Worksheet Navigation URLs**: Changed from `sessionStorage` approach to direct `/worksheet/:id` navigation - URLs are now shareable
- **Open Worksheet in New Tab**: Replaced `<div onClick>` with `<Link to>` components - right-click and middle-click now work correctly
- **Typewriter Hint Animation**: New `TypewriterHint` component above Lesson topic field - rotates through 15 educational hints with 3s typing + 2s pause effect

**Previous Update (December 2025) - Drawing Overlay v5.1 Fixes:**
- **CRITICAL FIX: Undo/Redo Initial State**: Initial state now saved INSIDE `loadFromJSON` callback - guarantees state captured AFTER all objects loaded
- **Live Session Visibility Race Condition**: Added 100ms setTimeout before setting `isDrawingLayerVisible=true` - gives time for DrawingOverlay to mount
- **Eraser Diagnostics**: Added comprehensive `console.log` statements to debug eraser functionality (checks isTeacher, isEnabled, activeTool, objectsCount)
- **loadDrawingsFromData Updated**: Now accepts `shouldSaveInitialState` parameter to save initial state at correct moment
- **loadDrawings Updated**: Passes flag to save initial state only when loading during initialization, not during realtime updates

**Previous Update (December 2025) - Drawing Overlay v5.0 Fixes:**
- **CRITICAL FIX: Drawing Layer Visibility**: Added `isVisible` prop to DrawingOverlay for CSS visibility control, separate from `isEnabled`
- **Live Session Auto-Show**: Drawings ALWAYS visible when entering Live Session mode (no matter if drawings exist)
- **Show/Hide Button Fixed**: Now properly toggles CSS visibility via `isVisible` prop
- **Separate Tool Settings**: Each tool (Marker, Highlighter, Arrow) now has INDEPENDENT color and stroke width settings
- **ToolSettingsMap Type**: New TypeScript interface for storing per-tool settings
- **DrawingToolbar v5.0**: Now accepts `toolSettings` prop and passes correct colors per tool
- **Highlighter Colors**: Fixed to use semi-transparent `HIGHLIGHTER_COLORS` instead of opaque `DRAWING_COLORS`

**Previous Update (December 2025) - Drawing Overlay v4.0 Fixes:**
- **Eraser Precision Fixed**: Uses `pointToSegmentDistance` for Path objects - checks distance to SEGMENTS, not just endpoints
- **Undo/Redo Fixed**: Initial state saved AFTER `loadFromJSON` callback completes; forced React re-render after state restore
- **Debug Logs**: `console.log('🎨 ...')` messages for tracking drawing state

**Previous Update (December 2025) - Drawing Overlay v3.0 Fixes:**
- **CRITICAL FIX: loadDrawingsFromData now returns Promise** - Initial state saved AFTER drawings are fully loaded
- **Drawing Layer Visibility Fixed**: Drawings auto-show when entering Live Session if existing drawings exist
- **Popover Behavior Fixed**: First click selects tool (no popover), second click opens popover - removed onOpenChange
- **"Saving..." Indicator**: Moved outside toolbar to prevent width flickering
- **Select Word Integration**: When Select Word mode (S) is active with drawing enabled, auto-switches to "Select on Worksheet" tool

**Previous Updates - Drawing Overlay for Live Session:**
- **Drawing Tools**: Select Worksheet (V), Marker (M), Highlighter (H), Arrow (A), Eraser (E)
- **Color Palettes**: Marker/Arrow: 15 colors, Highlighter: 5 semi-transparent colors
- **Stroke Width**: Range 1-16, slider with live preview
- **Undo/Redo**: 50-step history, Ctrl+Z/Ctrl+Y shortcuts
- **Auto-save**: 2s debounce to database
- **Database Table**: `worksheet_drawings` with RLS policies
- **Fabric.js**: Canvas library for drawing
- **Touch Support**: Mobile/tablet support
- **Z-Index**: Toolbar z-[60] > DrawingOverlay z-[30]

**Previous Update (December 2025) - Shared Worksheet & Live Session Fixes:**
- **Live Session Answers Inline Display**: Fixed data flow - `liveSessionAnswer` now correctly passed from `WorksheetContent` → `ExerciseSection` → individual exercise components for inline blue highlighting
- **Navigation Sidebar on Shared Worksheets**: Fixed scroll-to-exercise by passing `exerciseRefs` to `SharedWorksheetContent` and assigning refs to exercise divs
- **Pin Audio/Picture on Shared Worksheets**: Added floating Pin and Maximize buttons with pinned audio player (identical to main worksheet)
- **Teacher Toolbar on Shared Worksheets**: Teachers now see toolbar with "Dashboard" and "Student Page" navigation buttons instead of simple notice
- **Mark Done Persistence**: "Mark Done" button state now persists to `localStorage` so it survives page refresh
- **Mark Done Button Visibility**: Improved button styling with better contrast (white/green background) on purple header
- **Share Modal Email Pre-fill on /student**: StudentPage's ShareWorksheetModal now pre-fills student email
- **Lightbulb Button Category Lock**: When clicking lightbulb button, panel only shows "Next Lesson Ideas" category (no grid)

**Previous Update (December 2025) - Interactive Worksheets Improvements:**
- **Live Session Inline Answers**: In "Live Session" mode, teacher can mark exercises as "Done" with elegant gray styling
- **Share Button on Student Worksheets**: New Share button on worksheet cards in `/student` Worksheets tab with green border when link active
- **Share Link Extended to 10 Days**: Worksheet share links now valid for 10 days (was 7)
- **Share Modal Reuses Active Token**: When sharing, if valid share token exists, it's shown immediately (no regeneration)
- **Matching Exercises Deterministic Shuffle**: Uses seeded random based on worksheetId - same order on every load
- **Next Lesson Ideas Category**: New Student Knowledge category with dedicated lightbulb button on worksheet
- **Email Template Fixes**: Worksheet and Homework email templates no longer overflow on desktop
- **Exercise Header Done Button**: Teachers can mark exercises as completed in Live Session view

**Previous Update (December 2025) - Interactive Shared Worksheets:**
- **Interactive Shared Worksheets**: Students can now complete exercises interactively on shared worksheets (`/shared/:token`) - identical to homework functionality
- **Study Mode**: Big "Study" button on shared worksheets enables interactive answering with auto-save
- **Email Verification**: Students verify email before accessing study mode (same as homework)
- **Share Worksheet Modal Enhancement**: New recipient email field with "Save for verification" option
- **Live Session Mode**: Teacher can enable "Live Session" to see student answers in real-time via Supabase Realtime
- **Send Worksheet Email**: New Edge Function `send-worksheet-email` to send worksheet links via email
- **Database Tables**: New `worksheet_student_answers` table for storing student answers on shared worksheets
- **All 18 Exercise Types**: Full interactive support in SharedWorksheetContent.tsx

**Previous Update (December 2025) - Interactive Worksheets v4:**
- **Homework Notifications Navigate to Homework**: Clicking notification bell now navigates to `/homework/:share_token` instead of student profile
- **Teacher Edit Mode Improved**: Uses LOCAL state - changes are NOT auto-saved until "Save" clicked. "Discard" truly discards without saving.
- **Auto-save Speed**: Reduced debounce from 5 seconds to 1.5 seconds for faster feedback on Multiple Choice and other exercises
- **Progress Bar Controls**: Unlock/Save/Discard buttons now also appear on sticky progress bar at top of page
- **Describe Picture Fallback**: ExerciseProcessor now generates 10 default prompts if ChatGPT returns empty prompts array

**Previous Update (December 2025) - Interactive Worksheets v3:**
- **Homework Notifications Fixed**: Changed `notification_type` from `'submission'` to `'completed'` in `insert_homework_submission_notification` SQL function to match database CHECK constraint
- **Teacher Edit Mode**: Teachers can now unlock editing on homework view, modify student answers, and save/discard changes
- **Pinned Media Redesigned**: Audio/Image panels now open only via fixed buttons (no auto-show on scroll), with proper X close buttons and Maximize for images
- **Describe Picture Exercise**: Now generates 10 prompts instead of 8
- **Duplicate Worksheet Button**: Added to WorksheetToolbar next to Edit Worksheet button

**Previous Update (December 2025) - Interactive Worksheets v2:**
- **Student Interactive Homework**: Students can now answer exercises interactively via `/homework/:token` route with email verification
- **Auto-save**: Answers are automatically saved every 5 seconds with debounce + immediate save on blur
- **Progress Tracking**: Progress bar shows X/Y exercises completed (only counts exercise when ALL questions answered)
- **Teacher View**: Teachers access homework via same `/homework/:token` link, see EXACTLY same view as students (no `teacher` viewMode)
- **Notifications Fixed**: Bell icon notifications now work using `insert_homework_submission_notification` RPC function with SECURITY DEFINER (bypasses RLS for anonymous students)
- **Immediate Answer Display**: Students see correct answers immediately after submitting (no review wait)
- **View Count**: Homework `view_count` increments when student opens link
- **Exercise Types**: All 18 exercise types support interactive input (Input fields h-10, Radio buttons, Select dropdowns)
- **Error Correction/Word Formation Fixed**: Now have input fields for student answers (previously missing)
- **Input Field Fixes**: Reading/Listening/Paraphrasing use single-line Input (h-10), not textarea
- **Layout Fixes**: Reading/CompleteWord/Dialogue in 2-column grid, Categorize words in 3-column grid
- **Answer Colors**: Strong visual feedback - green-200 border-green-600 for correct, red-200 border-red-600 for incorrect
- **Empty Field Marking**: Unanswered fields marked red after submission
- **Incomplete Submission Modal**: Confirmation dialog when submitting with progress < 100%
- **Navigation Sidebar**: Exercise navigation (numbered buttons) on homework pages like worksheets
- **Floating Pinned Media**: Inline audio player and expandable image in bottom-right corner (not scroll-to button)
- **Scroll-Up Button**: Quick return to top button appears after scrolling
- **Simplified Badges**: Homework tab shows only "Completed" badge (removed "Needs Review", "Reviewed", "Submitted")

## Architecture Stack

### Frontend
- **React 18.3** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** component library for consistent UI
- **React Router** for client-side routing
- **React Query** for server state management

### Backend
- **Supabase** as Backend-as-a-Service
- **PostgreSQL** database with Row Level Security
- **Supabase Auth** for user authentication
- **Edge Functions** for serverless API endpoints
- **Stripe** for payment processing and subscription management

### External Integrations
- **OpenAI/LLM** for AI-powered worksheet generation
- **Stripe** for payment processing, subscriptions, and billing
- **Supabase Email** for transactional emails

## Database Schema - ETAP 2

### Core Tables

#### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  subscription_type TEXT DEFAULT 'free',
  subscription_status TEXT,
  stripe_customer_id TEXT,
  monthly_worksheet_limit INTEGER DEFAULT 0,
  monthly_worksheets_used INTEGER DEFAULT 0,
  available_tokens INTEGER DEFAULT 2,
  rollover_tokens INTEGER DEFAULT 0,
  total_worksheets_created INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### students
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  english_level TEXT NOT NULL,
  learning_goal TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### worksheets
```sql
CREATE TABLE worksheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  lesson_topic TEXT NOT NULL,
  english_level TEXT NOT NULL,
  learning_goals TEXT,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Authentication System

### User Registration Flow
1. **Email/Password signup** through Supabase Auth
2. **Email confirmation** required for full access
3. **Profile creation** with 2 free tokens automatically added
4. **Student addition prompt** before worksheet generation

### Security Features
- **Row Level Security (RLS)** on all tables
- **Email verification** mandatory for account activation
- **Secure password requirements** enforced by Supabase
- **JWT-based sessions** with automatic refresh

## Student Management System

### Student Entity
```typescript
interface Student {
  id: string;
  user_id: string;
  name: string;
  english_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  learning_goal: 'Work' | 'Exam' | 'General English';
  created_at: string;
  updated_at: string;
}
```

### Key Features
- **Unlimited students** per account
- **CRUD operations** through React hooks
- **Required for generation**: Must select student before creating worksheet
- **Auto-population**: Student data fills generator form automatically

## Worksheet Generation System

### Generation Requirements
```typescript
// Prerequisites for worksheet generation
const canGenerate = 
  user?.email_confirmed_at && 
  students.length > 0 && 
  (monthlyRemaining > 0 || availableTokens > 0);
```

### Content Types
- **Vocabulary Sheets**: Term definitions and examples
- **Grammar Exercises**: Context-specific grammar practice
- **Reading Comprehension**: Custom passages with questions
- **Fill-in-the-Blanks**: Targeted vocabulary and grammar
- **Multiple Choice**: Various difficulty levels
- **Matching Exercises**: Terms, definitions, concepts
- **Dialogue Practice**: Conversation scenarios
- **Mixed Exercises**: Combination of multiple types

### Generation Flow
1. **Student selection** (required dropdown)
2. **Auto-fill** student level and learning goal
3. **Topic and objectives** input by teacher
4. **AI generation** (30-60 seconds)
5. **Student assignment** and database storage
6. **Download availability** (both Student/Teacher versions)

## Token & Subscription System

### Resource Priority Logic
```typescript
// Critical consumption order
const consumeResource = () => {
  if (monthlyRemaining > 0) {
    // Use monthly worksheet allowance first
    updateMonthlyUsage();
  } else if (availableTokens > 0) {
    // Use available tokens second
    consumeToken();
  } else {
    // Show upgrade options
    showPaywall();
  }
};
```

### Subscription Plans
```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // USD per month
  monthlyLimit: number; // Worksheets per month
  features: string[];
}

## Database Functions

The application uses several PostgreSQL functions for security and business logic:

### Shared Worksheets
- `get_worksheet_by_share_token(p_share_token text)`: Returns worksheet data including media fields (selected_image, selected_audio, audio_url) for public sharing via token. Includes automatic expiration check.

const plans = [
  { id: 'free', name: 'Free Demo', price: 0, monthlyLimit: 0 },
  { id: 'side-gig', name: 'Side-Gig Plan', price: 9, monthlyLimit: 15 },
  { id: 'full-time-30', name: 'Full-Time 30', price: 19, monthlyLimit: 30 },
  { id: 'full-time-60', name: 'Full-Time 60', price: 39, monthlyLimit: 60 },
  { id: 'full-time-90', name: 'Full-Time 90', price: 59, monthlyLimit: 90 },
  { id: 'full-time-120', name: 'Full-Time 120', price: 79, monthlyLimit: 120 }
];
```

### Rollover System
```sql
-- Automatic rollover at billing cycle
CREATE OR REPLACE FUNCTION handle_subscription_renewal()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate unused worksheets
  NEW.rollover_tokens = OLD.rollover_tokens + 
    (OLD.monthly_worksheet_limit - OLD.monthly_worksheets_used);
  
  -- Add to available tokens
  NEW.available_tokens = OLD.available_tokens + 
    (OLD.monthly_worksheet_limit - OLD.monthly_worksheets_used);
  
  -- Reset monthly usage
  NEW.monthly_worksheets_used = 0;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Payment Integration

### Stripe Implementation
```typescript
// Subscription creation
const createSubscription = async (planData) => {
  const { data } = await supabase.functions.invoke('create-subscription', {
    body: {
      planType: planData.type,
      monthlyLimit: planData.monthlyLimit,
      price: planData.price,
      planName: planData.name
    }
  });
  
  if (data?.url) {
    window.location.href = data.url; // Redirect to Stripe Checkout
  }
};
```

### Webhook Handling
- **Payment success**: Automatic subscription activation
- **Subscription renewal**: Rollover calculation and reset
- **Payment failure**: Graceful degradation with notifications
- **Cancellation**: End-of-period access preservation

## Download System

### Access Control
```typescript
// Automatic unlock for all registered users
const checkDownloadAccess = (userId: string) => {
  return !!userId && userId !== 'anonymous';
};
```

### File Generation
- **HTML format**: Optimal quality, offline-capable
- **PDF format**: Universal compatibility
- **Timestamped filenames**: Easy organization
- **Separate versions**: Student (clean) and Teacher (with answers)

## User Interface Architecture

### Component Structure
```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── dashboard/            # Dashboard-specific components
│   ├── worksheet/            # Worksheet-related components
│   └── WorksheetForm/        # Generation form components
├── hooks/                    # Custom React hooks
├── pages/                    # Route components
├── services/                 # API and business logic
└── utils/                    # Utility functions
```

### State Management
- **React Query**: Server state and caching
- **React Context**: Global user state
- **Local State**: Component-specific state
- **Custom Hooks**: Business logic encapsulation

### Responsive Design
- **Mobile-first**: Tailwind responsive utilities
- **Touch-friendly**: Proper button sizes and spacing
- **Cross-browser**: Tested on major browsers
- **Accessibility**: ARIA labels and keyboard navigation

## API Architecture

### Edge Functions
```
supabase/functions/
├── generateWorksheet/        # AI worksheet generation
├── create-subscription/      # Stripe subscription creation
├── stripe-webhook/          # Payment webhook handling
├── customer-portal/         # Stripe customer portal
├── downgrade-subscription/  # Plan downgrade logic
└── check-subscription-status/ # Subscription sync
```

### Database Functions
```sql
-- Token consumption with priority logic
CREATE OR REPLACE FUNCTION consume_token(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record profiles%ROWTYPE;
BEGIN
  SELECT * INTO profile_record FROM profiles WHERE id = user_id;
  
  -- Check monthly allowance first
  IF profile_record.monthly_worksheets_used < profile_record.monthly_worksheet_limit THEN
    UPDATE profiles 
    SET monthly_worksheets_used = monthly_worksheets_used + 1,
        total_worksheets_created = total_worksheets_created + 1
    WHERE id = user_id;
    RETURN TRUE;
  ELSIF profile_record.available_tokens > 0 THEN
    UPDATE profiles 
    SET available_tokens = available_tokens - 1,
        total_worksheets_created = total_worksheets_created + 1
    WHERE id = user_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

## Performance Optimizations

### Frontend Optimizations
- **Code splitting**: Route-based lazy loading
- **React Query caching**: Reduced API calls
- **Optimistic updates**: Immediate UI feedback
- **Memoization**: React.memo and useMemo for expensive operations

### Backend Optimizations
- **Database indexes**: On frequently queried columns
- **Row Level Security**: Efficient access control
- **Edge Functions**: Serverless auto-scaling
- **CDN delivery**: Fast global content delivery

### Caching Strategy
```typescript
// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false
    }
  }
});
```

## Security Considerations

### Data Protection
- **Encryption at rest**: Supabase handles database encryption
- **HTTPS only**: All communications encrypted in transit
- **Environment variables**: Sensitive data in secure storage
- **API key rotation**: Regular security key updates

### Access Control
```sql
-- Row Level Security example
CREATE POLICY "Users can only access their own data" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only manage their students" ON students
  FOR ALL USING (auth.uid() = user_id);
```

### Content Security
- **Input validation**: All user inputs sanitized
- **XSS prevention**: Content escaping in templates
- **CSRF protection**: Built into Supabase Auth
- **Rate limiting**: API request throttling

## Monitoring & Analytics

### Error Tracking
```typescript
// Comprehensive error boundaries
class WorksheetErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Worksheet generation error:', error, errorInfo);
    // Report to monitoring service
  }
}
```

### Performance Monitoring
- **Core Web Vitals**: Loading performance tracking
- **User interactions**: Button clicks and form submissions
- **API response times**: Generation and download speeds
- **Error rates**: Failed generations and payment issues

### Business Metrics
- **User registration**: Account creation funnel
- **Feature adoption**: Student addition and generation rates
- **Revenue tracking**: Subscription conversions and upgrades
- **Usage patterns**: Worksheets per user and retention

## Deployment & Infrastructure

### Production Environment
- **Vercel/Netlify**: Frontend hosting with global CDN
- **Supabase**: Managed backend with auto-scaling
- **Stripe**: PCI-compliant payment processing
- **Domain management**: Custom domains supported

### Development Workflow
```bash
# Local development
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
```

### Environment Configuration
```typescript
// Environment variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Testing Strategy

### Unit Testing
- **Component testing**: React Testing Library
- **Hook testing**: Custom hook validation
- **Utility testing**: Pure function verification
- **Edge case coverage**: Error handling validation

### Integration Testing
- **API endpoint testing**: Full request/response cycles
- **Database testing**: CRUD operations validation
- **Payment testing**: Stripe test mode integration
- **Email testing**: Supabase email functionality

### User Acceptance Testing
- **User journey testing**: Complete workflows
- **Cross-browser testing**: Major browser compatibility
- **Mobile testing**: Responsive design validation
- **Performance testing**: Load and stress testing

## Maintenance & Updates

### Code Maintenance
- **Dependency updates**: Regular package updates
- **Security patches**: Immediate security fix deployment
- **Performance optimization**: Continuous improvement
- **Refactoring**: Code quality improvement cycles

### Feature Development
- **Feature flags**: Gradual rollout capabilities
- **A/B testing**: User experience optimization
- **Backward compatibility**: Seamless user experience
- **Documentation updates**: Continuous documentation maintenance

---

## ✨ NEW: Advanced Exercise Management System

### Overview
Comprehensive exercise management system allowing teachers to customize worksheet structure in real-time with immediate database persistence.

### Core Features

#### Exercise Reordering
```typescript
// Move exercise up/down with immediate save
const moveExerciseUp = (index: number) => {
  if (index <= 0) return;
  
  const newExercises = [...editableWorksheet.exercises];
  [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
  
  const updatedWorksheet = { ...editableWorksheet, exercises: newExercises };
  setEditableWorksheet(updatedWorksheet);
  saveWorksheetChanges(updatedWorksheet);
};
```

#### Soft Delete System
```typescript
interface Exercise {
  type: string;
  title: string;
  // ... other fields
  // Soft delete support
  deleted?: boolean;
  deletedAt?: string; 
  deletedBy?: string;
}

// Soft delete with metadata
const softDeleteExercise = (index: number) => {
  const updatedExercises = [...editableWorksheet.exercises];
  updatedExercises[index] = {
    ...updatedExercises[index],
    deleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: userId
  };
  // Immediate database save
  saveWorksheetChanges(updatedWorksheet);
};
```

### UI Components

#### ExerciseHeader Enhancement
- **Move Up/Down buttons**: ChevronUp/ChevronDown icons
- **Delete button**: Trash2 icon with confirmation
- **Smart disabling**: First/last exercise buttons disabled appropriately
- **Visual feedback**: Hover states and transitions

#### Deleted Exercises Section
- **Collapsible UI**: Expandable section at bottom of worksheet
- **Restore functionality**: One-click exercise restoration
- **Metadata display**: Deletion timestamp and user info
- **Visual distinction**: Red-themed styling for deleted items

### Database Integration
```typescript
// Automatic saving on all operations
const saveWorksheetChanges = async (updatedWorksheet: any) => {
  if (!worksheetId || !userId) return;
  
  try {
    await updateWorksheet(worksheetId, updatedWorksheet, userId);
    console.log('✅ Worksheet saved successfully');
  } catch (error) {
    console.error('❌ Failed to save worksheet:', error);
    toast.error('Failed to save changes');
  }
};
```

### User Experience
- **Immediate feedback**: Toast notifications for all operations
- **No data loss**: All changes saved instantly to database  
- **Undo capability**: Deleted exercises can be restored
- **Mode awareness**: Management buttons only visible in edit mode
- **Responsive design**: Works on all device sizes

---

## Interactive Homework System (Phase 5-6)

### Overview
Students can now complete homework exercises interactively through the shared homework link. All exercise types support interactive input fields, auto-saving, and submission to the teacher.

### Key Components

#### useInteractiveHomework Hook (`src/hooks/useInteractiveHomework.tsx`)
- Email verification against student_email in database
- Auto-save with 5-second debounce + immediate save on blur
- Progress tracking (answered/total exercises)
- Homework submission with teacher notification

#### Interactive Exercise Props
All 18 exercise components support:
- `isInteractive`: Enables input fields for students
- `studentAnswers`: Record of student responses
- `onAnswerChange`: Callback for answer updates  
- `showCorrectAnswers`: Shows correct answers (teacher view)

#### Submission Flow
1. Student completes exercises → auto-saved every 5s
2. Student clicks "Submit Homework"
3. `submit_homework_answers` RPC sets `is_submitted=true` AND `completed_at` in `homework_assignments`
4. Email notification sent to teacher via `send-homework-email` edge function
5. Teacher sees "Completed" status in Homework tab

### Database Functions Updated
- `submit_homework_answers`: Now also sets `completed_at` in `homework_assignments` table

### Email Templates
- `homework-submission.tsx`: Notification to teacher when student submits

---

**Current Version**: ETAP 2+ - Interactive Homework System  
**Last Updated**: December 2024  
**Next Major Release**: ETAP 3 - Advanced Features  
**Maintenance Schedule**: Continuous deployment with weekly reviews
