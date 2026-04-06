# Edooqoo — Complete AI Agent Reference Manual

> Internal reference for AI agents extending or supporting the Edooqoo platform. Dense, factual. No marketing.

---

## 1. Architecture Overview

**[Problem]**: No unified reference for full app structure.
**[Solution]**: SPA covering the complete English tutoring workflow — from student onboarding to progress tracking.
**[Technical]**:
- **Stack**: React 18, Vite 5, Tailwind CSS v3, TypeScript 5, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + Realtime + Storage)
- **Auth**: email/password, Google OAuth, anonymous (demo). Supabase Auth.
- **Payments**: Stripe (subscriptions + one-time token purchases)
- **AI**: Gemini 2.5 Flash (worksheet generation via `generateWorksheet` edge fn), `verify-open-answers` (AI grading)
- **Media**: `generate-audio` (TTS), `generate-image` (AI images), `transcribe-audio` (speech-to-text)
- **Calendar**: Google Calendar API — teacher (`gcal-sync`) + student (`student-gcal-sync`)
- **47 pages** in `src/pages/`, **53 hooks** in `src/hooks/`, **49 edge functions** in `supabase/functions/`

### Key Directories
```
src/pages/              — Route pages (47 files)
src/hooks/              — Business logic hooks (53 files)
src/hooks/dslm/         — DSLM event tracking
src/components/         — UI components (19 directories)
  WorksheetForm/        — Worksheet creation form
  worksheet/            — Worksheet display & exercises (58 files)
  homework/             — Homework assign & review
  student-homework/     — Student-facing homework completion
  flashcards/           — Flashcard management & learning
  calendar/             — Calendar slots, booking, modals
  student-hub/          — Student Hub layout & components
  welcome-test/         — Welcome test UI
  dslm/                 — Progress tracking UI
  student-knowledge/    — Knowledge entries
  student-progress/     — Goals & learning elements
  student-tests/        — Test management
  drawing/              — Drawing canvas overlay
  landing/              — Landing page sections
  dashboard/            — Dashboard components
  profile/              — Profile management
  shared/               — Shared utilities
  ui/                   — shadcn base components
supabase/functions/     — 49 Edge Functions
public/                 — Static HTML landings (70+), blog (65+), SEO files
```

**RAG Keywords**: React SPA, Supabase, Edge Functions, Vite, TypeScript, Tailwind, shadcn, Gemini, Google Calendar API, Stripe, PostgreSQL, RLS

---

## 2. Worksheet Generation Engine

**[Problem]**: Manual creation of personalized English materials takes 30-60 min per lesson.
**[Solution]**: AI generates a complete worksheet in <60s using student context, CEFR level, topic, and skill data.
**[Technical]**:
- Flow: `WorksheetForm` → `useWorksheetGeneration` → `formatPromptForAI()` → `streamWorksheetGeneration()` → `generateWorksheet` edge fn → Gemini 2.5 Flash
- Streaming via SSE with `GenerationView` progress tracking
- Post-generation: `processExercises()`, `deepFixTextObjects()`, media generation (`generate-audio`, `generate-image`)
- Storage: `worksheets` table (`ai_response` TEXT, 200K char limit)
- Token consumption: `useTokenSystem` → `consumeToken()`
- Hooks: `useWorksheetGeneration`, `useWorksheetState`, `useWorksheetNavigation`, `useWorksheetHistory`, `useWorksheetStats`, `useWorksheetRating`
- Components: `WorksheetForm/` (form fields, student selector), `FormView`, `GenerationView`, `WorksheetDisplay`, `WorksheetContent`, `WorksheetContainer`
- Edge: `generateWorksheet` (Gemini streaming), `generate-audio` (TTS), `generate-image` (AI images)
- Each exercise item carries `nano_skill: {name, confidence, reason}` for DSLM integration
- Regeneration: `useExerciseRegeneration` (single exercise), `useSectionRegeneration` (section)

**RAG Keywords**: worksheet generator, AI worksheets, ESL materials, CEFR exercises, Gemini 2.5 Flash, streaming SSE, personalized worksheets, lesson materials, exercise generation, EFL worksheet maker

---

## 3. Exercise Types (29)

**[Problem]**: Teachers need varied exercise formats matching exam formats and skill targets.
**[Solution]**: 29 types across 3 categories with dedicated renderers, interactive modes, and AI evaluation.
**[Technical]**:

### Basic (20)
| # | Type | Component | Interactive |
|---|------|-----------|-------------|
| 1 | Reading Comprehension | `ExerciseReading` | ✅ |
| 2 | Fill in the Blanks | `ExerciseFillInBlanks` | ✅ |
| 3 | Multiple Choice | `ExerciseMultipleChoice` | ✅ |
| 4 | True/False | (via MultipleChoice) | ✅ |
| 5 | Matching | `ExerciseMatching` | ✅ |
| 6 | Dialogue Practice | `ExerciseDialogue` | ✅ |
| 7 | Answer Questions | `ExerciseAnswerQuestions` | ✅ |
| 8 | Discussion Questions | (via AnswerQuestions) | ✅ AI-graded |
| 9 | Error Correction | (dedicated) | ✅ |
| 10 | Odd One Out | `ExerciseOddOneOut` | ✅ |
| 11 | Matching Halves | `ExerciseMatchingHalves` | ✅ |
| 12 | Word Order | `ExerciseWordOrder` | ✅ |
| 13 | Gap Text (Cloze) | `ExerciseGapText` | ✅ |
| 14 | Negative Prefixes | `ExerciseNegativePrefixes` | ✅ |
| 15 | Categorization | `ExerciseCategorize` | ✅ |
| 16 | Complete Word | `ExerciseCompleteWord` | ✅ |
| 17 | Paraphrasing | `ExerciseParaphrasing` | ✅ AI-graded |
| 18 | Sentence Transformation | `ExerciseSentenceTransformation` | ✅ AI-graded |
| 19 | Synonyms Matching | `ExerciseSynonymsAntonyms` | ✅ |
| 20 | Antonyms Matching | `ExerciseSynonymsAntonyms` | ✅ |

### Audio (5)
| # | Type | Component |
|---|------|-----------|
| 21 | Listening Comprehension | `ExerciseListeningComprehension` |
| 22 | Fill in the Blanks (Audio) | `ExerciseFillInBlanksAudio` |
| 23 | Multiple Choice (Audio) | `ExerciseMultipleChoiceAudio` |
| 24 | True/False (Audio) | `ExerciseTrueFalseAudio` |
| 25 | Answer Questions (Audio) | `ExerciseAnswerQuestionsAudio` |

### Picture (4)
| # | Type | Component |
|---|------|-----------|
| 26 | Describe Picture | `ExerciseDescribe` |
| 27 | Multiple Choice (Picture) | (via MultipleChoice + image) |
| 28 | True/False (Picture) | (via TrueFalse + image) |
| 29 | Answer Questions (Picture) | (via AnswerQuestions + image) |

- All types have teacher view (worksheet/), student interactive (student-homework/), and homework interactive modes
- Open-ended types (Paraphrasing, Sentence Transformation, Discussion, Describe Picture) use `verify-open-answers` for AI grading
- Each item carries `nano_skill: {name, confidence, reason}` for DSLM

**RAG Keywords**: exercise types, reading comprehension, fill in the blanks, multiple choice, true false, matching, dialogue practice, error correction, paraphrasing, sentence transformation, listening comprehension, picture exercises, ESL exercises, EFL activities

---

## 4. Homework System

**[Problem]**: Manual grading of open-ended exercises is time-consuming (5-10 min per student per homework).
**[Solution]**: AI auto-grades open-ended answers via `verify-open-answers`. Teachers review and adjust.
**[Technical]**:
- **Assign**: `homework_assignments` table, `send-homework-email` edge fn, deadline + reminder
- **Complete**: `useInteractiveHomework` hook, `homework_student_answers` table, per-exercise save
- **Grade**: `verify-open-answers` edge fn → `quality_score`, `writing_score`, `speaking_score` → mastery 0-100
- **Pending evaluations**: `pending_worksheet_ai_evaluations` table → `process-pending-ai-evaluations` edge fn (batch)
- **Review**: `HomeworkReviewPage`, `AiEvaluationBadge`, teacher corrections (`homework_teacher_corrections`), comments (`homework_teacher_comments`)
- **Reminders**: `send-homework-reminders` edge fn, `reminder_hours` + `reminder_scheduled_at` fields
- **Notifications**: `homework_notifications` table
- Hooks: `useInteractiveHomework`, `useAllWorksheetHomework`, `useHomeworkExerciseGeneration`
- Components: `homework/` (assign modal, review), `student-homework/` (interactive completion)
- Pages: `HomeworkPage`, `HomeworkReviewPage`

**RAG Keywords**: homework grading, AI evaluation, open-ended assessment, automatic grading, homework assignment, deadline tracking, email reminders, mastery score, teacher review, ESL homework

---

## 5. Flashcards & Spaced Repetition

**[Problem]**: Vocabulary retention requires systematic review; teachers lack integrated tools.
**[Solution]**: SM-2 algorithm with per-card scheduling, integrated with worksheet vocabulary.
**[Technical]**:
- **Sets**: `flashcard_sets` table, `useFlashcardSets` hook
- **Cards**: `flashcard_cards` table, `useFlashcardCards` hook, `card_position`, `cefr_level`, `source_worksheet_id`
- **Learning**: `useFlashcardLearning` hook → SM-2 `calculateSM2()` function
- **Progress**: `flashcard_progress` table (per card per learner): `easiness_factor`, `interval_days`, `repetition`, `next_review_date`, `direction` (bidirectional)
- **Translation**: `translate-flashcard` edge fn
- **Sharing**: `share_token` on set, Student Hub access, `/flashcards/:token` route
- **Email**: `send-flashcard-email` edge fn
- Components: `flashcards/` directory
- Pages: `FlashcardsLearning`

**RAG Keywords**: flashcards, spaced repetition, SM-2 algorithm, vocabulary retention, flashcard sets, word review, ESL vocabulary, bidirectional study

---

## 6. Welcome Test & Learning Paths

**[Problem]**: Teachers need objective assessment of new students; self-assessment is unreliable.
**[Solution]**: 49-question AI test covering 5 skill areas → detailed Learning Profile.
**[Technical]**:
- **Questions**: `src/data/welcomeTestQuestions.ts` (49 questions, 5 sections: grammar, vocabulary, reading, listening, speaking)
- **Hook**: `useWelcomeTest` (answer submission, timing, trait detection)
- **Audio**: `generate-welcome-test-audio` edge fn (TTS for listening/speaking sections)
- **Processing**: `process-welcome-test` edge fn → AI analysis
- **Result**: `student_learning_profiles` table — CEFR estimate, radar chart data, strengths/weaknesses, skill scores
- **4 Learning Paths**: Comfort, Guided, Accelerated, Target (determined by 15 signals)
- **Email**: `send-test-email` edge fn
- Hooks: `useWelcomeTest`, `useStudentTests`
- Components: `welcome-test/`, `student-tests/`
- Pages: `WelcomeTestPage`, `StudentTestPage`

**RAG Keywords**: placement test, level assessment, CEFR test, diagnostic test, English level, learning profile, learning path, skill assessment, ESL assessment

---

## 7. DSLM (Dynamic Student Learning Model)

**[Problem]**: No granular tracking of what a student knows/doesn't know at the micro-skill level.
**[Solution]**: 4-layer architecture tracking nano-skills with CEFR tags and trend detection.
**[Technical]**:
- **Layer A (Event Log)**: `student_events` table — `event_type`, `event_source`, `skill_ids[]`, `mastery`, `element_type`, `session_id`
- **Layer B (Metrics)**: `useSkillMetrics` hook — aggregated scores per nano-skill using exponential decay weighting
- **Layer C (Profile)**: `student_learning_profiles` + `student_progress_goals` + `student_learning_elements` — goals, preferences, target ratings
- **Layer D (Decision Engine)**: `future_worksheet_suggestions` table, `generate-timeline` edge fn — AI recommendations based on skill gaps
- **Nano-skill format**: `"B1.grammar.present_perfect.negative"` (CEFR.category.topic.subskill)
- **Trend detection**: improving, stable, declining
- **Edge**: `track-student-event` edge fn
- Hooks: `useStudentEvents` (in `src/hooks/dslm/`), `useSkillMetrics`, `useStudentProgress`, `useFutureTimeline`
- Components: `dslm/`, `student-progress/`

**RAG Keywords**: progress tracking, nano-skill, mastery, learning analytics, DSLM, skill metrics, trend detection, CEFR tags, student progress, learning model, exponential decay

---

## 8. Student Hub Portal

**[Problem]**: Students need independent access to materials without requiring a teacher account.
**[Solution]**: Email-first portal at `/my/:teacherToken` with dashboard, flashcards, homework, worksheets, lessons, settings.
**[Technical]**:
- **Landing**: `/my` (`StudentHubLanding`) — email entry → `find-teachers-by-student-email` edge fn → teacher selection
- **Auth**: 30-day `localStorage` session (`hub_email`, `hub_teacher_token`), no password
- **Dashboard**: `/my/:teacherToken` (`StudentHubDashboard`) — quick stats, recent items
- **Pages**: `StudentHubFlashcards`, `StudentHubHomework`, `StudentHubWorksheets`, `StudentHubLessons`, `StudentHubSettings`
- **Data**: `get-student-hub-data` edge fn (aggregates student data from multiple tables)
- **GCal**: `student-gcal-auth-start` → `student-gcal-auth-callback` → `student-gcal-sync`
- **Settings**: per-status calendar colors (JSONB in `student_gcal_tokens.settings`), sync toggles (`sync_booked`, `sync_pending`), "Sync all existing lessons"
- Hook: `useStudentHubData`
- Layout: `StudentHubLayout` component (shows logged-in email)

**RAG Keywords**: student portal, student dashboard, self-study, independent learning, Student Hub, email login, student access, lesson booking, student settings

---

## 9. Lesson Calendar & Booking

**[Problem]**: Scheduling lessons across separate tools (Google Calendar, email, spreadsheets) is fragmented.
**[Solution]**: Integrated calendar with public booking page, recurring slots, GCal sync, and meeting links.
**[Technical]**:
- **Teacher calendar**: `CalendarPage.tsx`, `useCalendarSlots` hook (realtime subscription on `calendar_slots` filtered by `teacher_id`)
- **Slot statuses**: `available`, `booked`, `pending`, `completed`, `no_show`, `needs_review`, `deleted`
- **Public booking**: `PublicBookingPage` → `usePublicBooking` hook, teacher's public URL via `calendar_settings.public_calendar_slug`
- **Recurring**: `calendar_recurrence_rules` table, `useCalendarRecurrence` hook, auto-generation weeks ahead
- **Settings**: `CalendarSettingsPage`, `useCalendarSettings` hook, `calendar_settings` table
- **GCal teacher**: `gcal-auth-start` → `gcal-auth-callback` → `gcal-sync` edge fn (upsert/delete/cancel/create_permanent_room)
- **GCal student**: `student-gcal-auth-start` → `student-gcal-auth-callback` → `student-gcal-sync` edge fn
- **Notifications**: `calendar_notifications` table, `useCalendarNotifications` hook, `send-calendar-notification-email` edge fn
- **Slot logs**: `calendar_slot_logs` table, `useCalendarSlotLogs` hook
- **Vacations**: `calendar_teacher_vacations` table, `useCalendarVacations` hook
- **Payment**: `calendar_payment_records` table, `usePaymentTracking` hook
- **CSV Export**: `calendar-export-csv` edge fn

### Meeting Links — GCal-Only Model
- Auto-generated = real Google Meet via GCal API ghost event. No Jitsi, no lookup URLs.
- `calendar_student_settings`: `generated_meeting_link` (auto), `meeting_link_mode` ('default'|'custom'), `default_meeting_link` (canonical)
- `create_permanent_room` action in `gcal-sync`: creates ghost event → extracts `hangoutLink` → deletes event → saves link
- Student-facing: `slot.meeting_link` > `student_settings.default_meeting_link` (no global fallback when per-student active)
- `MeetingLinkField` in `StudentPage.tsx`: reads `meeting_link_mode` from DB

### Bulk Actions
- Selection restricted to one slot type (`selectionType` state)
- Actions: Delete (available), Confirm/Reject (pending), Complete/No Show (booked/needs_review)
- Atomic `.update().in('id', ids)` + loop `gcal-sync` per slot

### Reschedule
- Student initiates via Student Hub → `get-student-bookings` edge fn (action: reschedule)
- Teacher decides via `calendar-handle-reschedule-decision` edge fn
- Confirm: GCal upsert old+new (teacher), delete old + upsert new (student)
- Reject: GCal cancel new (teacher), delete new (student)
- "R" badge (indigo) on rescheduled slots (`cancelled_by='system'` + reason contains "Rescheduled")
- Loading state blocks UI during processing (`rescheduling` state in `StudentHubLessons`)

### Recurring Booking Modal
- `RecurringBookingModal.tsx`: for notifications with `slot_ids.length > 1`
- Checkboxes per slot + "Select All" for selective confirm/reject
- Partial actions keep modal open, refresh slot list

### Realtime
- Teacher: Supabase realtime on `calendar_slots` (filter `teacher_id`)
- Student: realtime subscription + 5s polling fallback
- `hasScrolledRef` ensures `scrollToToday()` runs only once after initial load

**RAG Keywords**: lesson calendar, booking system, Google Calendar sync, Google Meet, recurring bookings, public booking page, meeting link, reschedule, bulk actions, slot management, needs review, calendar notifications, teacher availability

---

## 10. Token & Subscription System

**[Problem]**: Monetization and fair usage metering for AI-generated content.
**[Solution]**: Stripe integration with monthly worksheet allowance + purchasable tokens + rollover.
**[Technical]**:
- **Plans**: Free (2 tokens), Side-Gig ($9/15 worksheets/mo), Full-Time ($19/30 worksheets/mo), Full-Time Pro ($79/90 worksheets/mo)
- **Token flow**: monthly allowance consumed first → purchased tokens → rollover tokens
- **Rollover**: unused monthly worksheets → rollover tokens at billing cycle end
- **Hooks**: `useTokenSystem` (consumeToken, checkAvailability), `usePlanLogic`, `useSubscriptionSync`
- **Edge**: `create-subscription`, `stripe-webhook` (handles subscription lifecycle), `check-subscription-status`, `customer-portal`, `downgrade-subscription`, `finalize-upgrade`
- **DB**: `profiles` table fields: `available_tokens`, `rollover_tokens`, `monthly_worksheet_limit`, `monthly_worksheets_used`, `subscription_type`, `subscription_status`, `subscription_expires_at`
- **Processed upgrades**: `processed_upgrade_sessions` table (idempotency)
- **UI**: `TokenPaywallModal`, `TokenPaywall`, `PricingSection`, `PricingCalculator`, `PaymentPopup`, `PaymentSuccess` page

**RAG Keywords**: pricing, subscription, Stripe, tokens, monthly worksheets, rollover, free plan, Side-Gig, Full-Time, payment, upgrade, downgrade

---

## 11. Interactive Worksheets & Sharing

**[Problem]**: Students need to complete exercises online; teachers need to monitor progress live.
**[Solution]**: Permanent shareable links with interactive mode and realtime answer tracking.
**[Technical]**:
- **Share**: `/shared/:token` (`SharedWorksheet` page), `ShareWorksheetModal`
- **Interactive**: `useInteractiveSharedWorksheet` hook, `worksheet_student_answers` table
- **Live Session**: `useLiveSessionAnswers` hook (Supabase realtime subscription on `worksheet_student_answers`)
- **Live Session UI**: `NanoSkillMasteryModal` for per-exercise mastery rating, `LiveSessionQuickNotes`, `AddExerciseModal` (up to 12)
- **Pending AI eval**: `pending_worksheet_ai_evaluations` table → `process-pending-ai-evaluations` edge fn
- **Worksheet tracking**: `WorksheetViewTracking` component

**RAG Keywords**: interactive worksheet, shareable link, live session, real-time answers, online exercises, student answers, worksheet sharing

---

## 12. Student Management

**[Problem]**: Track individual student data, knowledge, and learning context.
**[Solution]**: Student profiles with knowledge entries that feed into AI generation.
**[Technical]**:
- **Students**: `students` table, `useStudents` hook, `StudentPage` page
- **Knowledge**: `student_knowledge_entries` table, `useStudentKnowledge` hook, `StudentKnowledge` component
- **Categories**: strengths, weaknesses, interests, goals, preferences
- **AI integration**: knowledge entries injected into worksheet generation prompts via `formatPromptForAI()`
- **Student selector**: `StudentSelector`, `StudentSwitcherPopover`, `useStudentSelector` hook
- **Edit**: `StudentEditDialog` component

**RAG Keywords**: student management, student profile, knowledge base, personalization, student data, learning context

---

## 13. Drawing Canvas

**[Problem]**: Teachers need to annotate worksheets during online lessons.
**[Solution]**: In-browser drawing overlay on worksheets.
**[Technical]**:
- Hook: `useDrawingCanvas` (`src/hooks/useDrawingCanvas.ts`)
- Components: `drawing/` directory
- Integrated into worksheet view toolbar

**RAG Keywords**: drawing canvas, annotation, whiteboard, worksheet annotation, online teaching tools

---

## 14. Download System

**[Problem]**: Teachers need offline copies of worksheets.
**[Solution]**: HTML/PDF export with optional payment for non-subscribers.
**[Technical]**:
- Edge: `upload-to-r2` (file storage), `create-export-payment`, `verify-export-payment`
- Hooks: `useDownloadStatus`, `useDownloadTracking`
- DB: `export_payments` table, `download_sessions` table
- Formats: HTML (preserves all formatting), PDF

**RAG Keywords**: worksheet download, PDF export, HTML export, offline worksheets, printable materials

---

## 15. Admin Dashboard

**[Problem]**: Platform monitoring and user management.
**[Solution]**: Admin dashboard with stats and impersonation.
**[Technical]**:
- Page: `AdminDashboardPage`
- Edge: `admin-impersonate` (view as teacher)
- UI: `AdminImpersonationBanner`
- DB: `admin_activity_log` table

**RAG Keywords**: admin dashboard, user management, impersonation, platform monitoring

---

## 16. SEO Infrastructure

**[Problem]**: Organic discovery by English teachers searching for teaching tools and materials.
**[Solution]**: Multi-layer SEO with static HTML landings, blog, structured data, and AI discovery files.
**[Technical]**:
- **70+ static HTML landing pages** in `/public/`: grammar topics (15), exercise types (6), audience (5), skills (4), CEFR levels (6), comparisons (8), teacher types (3), core landings (4+)
- **65+ blog articles** in `public/blog/`: React index (`Blog.tsx`) + static HTML articles
- **React SEO pages**: `/exercise-types`, `/prompts`, `/glossary`, `/how-it-works`, `/resources`, `/blog`, `/about`
- **Structured data** (in `index.html`): `SoftwareApplication`, `FAQPage` (20 Q&A), `HowTo`, `WebSite`, `BreadcrumbList`
- **AI discovery files**: `llms.txt`, `llms-full.txt`, `llms-answers.txt`, `openapi.yaml`, `knowledge-graph.json`, `ai-plugin.json`
- **sitemap.xml**: 510 URLs with priority and changefreq
- **robots.txt**: Allow for 15+ AI bots (GPTBot, ClaudeBot, PerplexityBot, GoogleOther, etc.)
- Pages: `Index`, `About`, `Pricing`, `HowItWorks`, `ExerciseTypes`, `Prompts`, `Glossary`, `Resources`, `Blog`

**RAG Keywords**: SEO, landing pages, blog, structured data, JSON-LD, sitemap, robots.txt, AI discovery, llms.txt, organic traffic, English teacher SEO

---

## 17. Auth & Profile

**[Problem]**: Teacher account management.
**[Solution]**: Supabase Auth with email/password and Google OAuth.
**[Technical]**:
- Pages: `Auth`, `Login`, `Signup`, `ForgotPassword`, `ResetPassword`
- Hooks: `useAuthFlow`, `useAnonymousAuth`, `useProfile`, `useOnboardingProgress`
- Profile: `profiles` table, `Profile` page
- Onboarding: `OnboardingChecklist` component, `onboarding_progress` JSONB field
- Components: `GoogleSignInButton`, `EmailConfirmationModal`

**RAG Keywords**: authentication, login, signup, Google OAuth, teacher profile, onboarding

---

## 18. Edge Functions — Complete List

| Edge Function | Purpose |
|---------------|---------|
| `generateWorksheet` | AI worksheet generation via Gemini 2.5 Flash |
| `generate-audio` | TTS for audio exercises |
| `generate-image` | AI image generation for picture exercises |
| `transcribe-audio` | Speech-to-text for speaking exercises |
| `verify-open-answers` | AI grading of open-ended answers |
| `process-pending-ai-evaluations` | Batch AI evaluation processing |
| `process-welcome-test` | Welcome test result analysis |
| `generate-welcome-test-audio` | TTS for welcome test |
| `generate-timeline` | AI worksheet suggestions (DSLM Layer D) |
| `track-student-event` | DSLM event logging |
| `track-user-event` | General user event tracking |
| `send-homework-email` | Homework assignment notification |
| `send-homework-reminders` | Homework deadline reminders |
| `send-flashcard-email` | Flashcard set sharing email |
| `send-test-email` | Welcome test invitation email |
| `send-worksheet-email` | Worksheet sharing email |
| `send-calendar-notification-email` | Booking/confirmation/rejection emails |
| `translate-flashcard` | Flashcard translation |
| `get-student-hub-data` | Student Hub data aggregation |
| `get-student-bookings` | Student booking list + reschedule |
| `find-teachers-by-student-email` | Student Hub teacher lookup |
| `gcal-auth-start` | Teacher GCal OAuth start |
| `gcal-auth-callback` | Teacher GCal OAuth callback |
| `gcal-sync` | Teacher GCal sync (upsert/delete/cancel/create_permanent_room) |
| `student-gcal-auth-start` | Student GCal OAuth start |
| `student-gcal-auth-callback` | Student GCal OAuth callback |
| `student-gcal-sync` | Student GCal sync with per-status colors |
| `calendar-handle-reschedule-decision` | Teacher confirm/reject reschedule |
| `calendar-export-csv` | Calendar data CSV export |
| `create-subscription` | Stripe subscription creation |
| `stripe-webhook` | Stripe webhook handler |
| `check-subscription-status` | Subscription status check |
| `customer-portal` | Stripe customer portal |
| `downgrade-subscription` | Plan downgrade |
| `finalize-upgrade` | Plan upgrade finalization |
| `create-export-payment` | Worksheet export payment |
| `verify-export-payment` | Export payment verification |
| `upload-to-r2` | File upload to R2 storage |
| `add-tokens` | Manual token addition (admin) |
| `admin-impersonate` | Admin impersonation |
| `add-rls-policies` | RLS policy management |
| `delete-account` | Account deletion |
| `cleanup-anonymous-users` | Remove stale anonymous accounts |
| `notify-generation-failure` | Alert on worksheet generation failure |
| `submitFeedback` | User feedback submission |
| `test-send-reminder` | Test reminder endpoint |
| `test-webhook` | Test webhook endpoint |

---

## 19. Database Tables — Key Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Teacher profiles, tokens, subscription |
| `students` | Student records |
| `worksheets` | Generated worksheets |
| `homework_assignments` | Homework assignments |
| `homework_student_answers` | Student homework responses |
| `homework_teacher_comments` | Teacher comments on homework |
| `homework_teacher_corrections` | Teacher corrections |
| `homework_notifications` | Homework notifications |
| `flashcard_sets` | Flashcard collections |
| `flashcard_cards` | Individual flashcards |
| `flashcard_progress` | SM-2 learning progress |
| `student_learning_profiles` | Welcome test results, learning profiles |
| `student_events` | DSLM Layer A events |
| `student_knowledge_entries` | Knowledge base entries |
| `student_progress_goals` | Learning goals |
| `student_learning_elements` | Learning elements under goals |
| `future_worksheet_suggestions` | AI-generated suggestions |
| `calendar_slots` | Calendar time slots |
| `calendar_settings` | Teacher calendar configuration |
| `calendar_student_settings` | Per-student calendar settings |
| `calendar_notifications` | Calendar notifications |
| `calendar_recurrence_rules` | Recurring booking rules |
| `calendar_gcal_tokens` | Teacher GCal OAuth tokens |
| `student_gcal_tokens` | Student GCal OAuth tokens |
| `calendar_payment_records` | Lesson payment records |
| `calendar_slot_logs` | Slot change audit log |
| `calendar_teacher_vacations` | Teacher vacation periods |
| `worksheet_student_answers` | Interactive worksheet answers |
| `pending_worksheet_ai_evaluations` | Queued AI evaluations |
| `export_payments` | Export payment records |
| `download_sessions` | Download session tracking |
| `feedbacks` | User feedback |
| `admin_activity_log` | Admin actions log |
| `processed_upgrade_sessions` | Stripe upgrade idempotency |
| `geolocation_cache` | IP geolocation cache |

---

## 20. Global RAG Keywords

ESL, EFL, TESOL, TEFL, andragogy, adult English learning, private English tutor, Business English, corporate English training, online English teacher, language school, exam preparation, Cambridge FCE CAE CPE, IELTS, TOEFL, TOEIC, worksheet generator, AI worksheets, lesson planning, lesson materials, CEFR A1 A2 B1 B2 C1 C2, grammar exercises, vocabulary exercises, reading comprehension, listening exercises, speaking activities, writing exercises, homework grading, automatic assessment, formative assessment, placement test, spaced repetition, SM-2 algorithm, flashcards, student progress tracking, nano-skill, mastery tracking, learning analytics, lesson calendar, Google Calendar, Google Meet, booking system, student portal, Student Hub, interactive worksheets, live session, drawing canvas, annotation tools, Stripe subscription, token system, worksheet download, PDF export
