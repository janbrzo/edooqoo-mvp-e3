# Plan: Pełny audyt systemu + przebudowa dokumentacji RAG + strategia SEO

## Stan obecny — co już istnieje

Aplikacja ma rozbudowaną infrastrukturę SEO:

- **70+ statycznych stron HTML** w `/public/` (landingi per gramatyka, per temat, per persona, porównania z konkurencją)
- **65+ artykułów blogowych** w `public/blog/` (React index + static HTML)
- **510-liniowy sitemap.xml** ze wszystkimi stronami
- **6 plików AI-discovery**: `llms.txt`, `llms-full.txt`, `llms-answers.txt`, `openapi.yaml`, `knowledge-graph.json`, `ai-plugin.json`
- **Structured data**: SoftwareApplication, FAQPage (20 pytań), HowTo, WebSite, BreadcrumbList
- **robots.txt** z Allow dla 15+ botów AI (GPTBot, ClaudeBot, PerplexityBot, etc.)
- **React SEO pages**: `/exercise-types`, `/prompts`, `/glossary`, `/how-it-works`, `/resources`, `/blog`, `/about`

## Problem z obecną dokumentacją

Pliki `docs/llm-context.md` i `llms.txt` (root, NIE public) **opisują tylko moduł kalendarza i meeting linków**. Zero informacji o:

- Worksheet generation engine (29 typów, Gemini 2.5 Flash, streaming)
- Homework system (assign, AI grading, verify-open-answers)
- Flashcards (SM-2 algorithm, sets, sharing)
- Welcome Test (49 pytań, Learning Paths)
- DSLM (Layer A events, nano-skills, mastery)
- Student Hub (portal, dashboard, email-first auth)
- Token/subscription system (Stripe, rollover)
- Drawing canvas
- Live Session mode
- Download system (HTML/PDF)
- Sharing/Interactive worksheets
- Student Knowledge entries
- Admin dashboard
- SEO infrastructure itself

## Plan implementacji — 2 zadania

---

### ZADANIE 1: Pełna przebudowa `docs/llm-context.md`

Struktura nowego pliku (~800-1000 linii):

```markdown
# Edooqoo — Complete AI Agent Reference Manual

## 1. Architecture Overview
[Problem]: No unified reference for app structure.
[Solution]: SPA (React 18 + Vite 5 + Tailwind v3 + TypeScript 5). 
[Technical]: 
- 47 pages (src/pages/), 55+ hooks (src/hooks/), 45+ edge functions
- Auth: Supabase Auth (email/password, Google OAuth, anonymous)
- DB: Supabase PostgreSQL with RLS
- Payments: Stripe (subscriptions + one-time token purchases)
- AI: Gemini 2.5 Flash (worksheet gen), verify-open-answers (grading)
- Media: generate-audio (TTS), generate-image (AI images), transcribe-audio
- Calendar: Google Calendar API integration (teacher + student)
- File map of key directories

## 2. Worksheet Generation Engine
[Problem]: Manual creation of personalized English materials takes 30-60 min.
[Solution]: AI generates complete worksheet in <60s using student context.
[Technical]:
- FormData → formatPromptForAI() → streamWorksheetGeneration() → Gemini 2.5 Flash
- 29 exercise types (20 basic + 5 audio + 4 picture)
- Streaming via SSE with progress tracking
- Post-gen: processExercises(), deepFixTextObjects(), media generation
- Storage: worksheets table (ai_response TEXT 200K limit)
- Token consumption: useTokenSystem → consumeToken()
- Hooks: useWorksheetGeneration, useWorksheetState, useWorksheetNavigation
- Components: WorksheetForm/, FormView, GenerationView, WorksheetDisplay
- Edge: generateWorksheet, generate-audio, generate-image

## 3. Exercise Types (29)
[Problem]: Teachers need varied exercise formats matching exam and skill needs.
[Solution]: 3 categories with dedicated renderers and interactive modes.
[Technical]:
- Basic (20): Each has renderer in worksheet/exercises/ and homework/exercises/
- Audio (5): Require generate-audio edge function, AudioPlayer component
- Picture (4): Require generate-image edge function, image display
- All types support: teacher view, student interactive, AI evaluation, nano-skill tagging
- Each item carries nano_skill: {name, confidence, reason}

## 4. Homework System
[Problem]: Manual grading of open-ended exercises is time-consuming.
[Solution]: AI auto-grades via verify-open-answers edge function.
[Technical]:
- Assign: homework_assignments table, send-homework-email
- Complete: useInteractiveHomework hook, homework_student_answers table
- Grade: verify-open-answers (quality_score, writing_score, speaking_score → mastery 0-100)
- Review: HomeworkReviewPage, AiEvaluationBadge, teacher can adjust scores
- Reminders: send-homework-reminders edge function
- Components: homework/ (assign modal, review), student-homework/ (interactive)

## 5. Flashcards & Spaced Repetition
[Problem]: Vocabulary retention requires systematic review.
[Solution]: SM-2 algorithm with per-card scheduling.
[Technical]:
- Sets: flashcard_sets table, useFlashcardSets hook
- Cards: flashcard_cards table, useFlashcardCards hook
- Learning: useFlashcardLearning (SM-2 calculateSM2 function)
- Translation: translate-flashcard edge function
- Sharing: via Student Hub or direct link (/flashcards/:token)

## 6. Welcome Test & Learning Paths
[Problem]: Teachers need objective assessment of new student's level.
[Solution]: 49-question AI test covering 5 skill areas.
[Technical]:
- Questions: src/data/welcomeTestQuestions.ts (49 questions, 5 sections)
- Hook: useWelcomeTest (answer submission, timing, trait detection)
- Processing: process-welcome-test edge function
- Result: Learning Profile (CEFR estimate, radar chart, strengths/weaknesses)
- 4 Paths: Comfort, Guided, Accelerated, Target (15 signals)
- Audio: generate-welcome-test-audio edge function

## 7. DSLM (Dynamic Student Learning Model)
[Problem]: No granular tracking of what a student knows/doesn't know.
[Solution]: 4-layer architecture tracking nano-skills.
[Technical]:
- Layer A: student_learning_events table (UTC logs, is_correct, time_spent)
- Layer B: skill_metrics (aggregated scores per nano-skill)
- Layer C: Student profiles (goals, preferences)
- Layer D: Decision engine (AI worksheet suggestions)
- Hook: useStudentEvents, useSkillMetrics
- Nano-skill format: "B1.grammar.present_perfect.negative"

## 8. Student Hub Portal
[Problem]: Students need independent access to materials.
[Solution]: Email-first portal at /my/:teacherToken.
[Technical]:
- Landing: /my (email entry, teacher selection)
- Dashboard: /my/:teacherToken (stats, recent items)
- Pages: flashcards, homework, worksheets, lessons, settings
- Auth: 30-day localStorage session, no password
- Data: get-student-hub-data edge function
- GCal: student-gcal-sync, student-gcal-auth-start/callback

## 9. Lesson Calendar
[Problem]: Scheduling lessons across tools is fragmented.
[Solution]: Integrated calendar with public booking and GCal sync.
[Technical]:
- Teacher: CalendarPage.tsx, useCalendarSlots, useCalendarNotifications
- Booking: public page via teacherToken, weekly recurring
- Statuses: available, booked, pending (needs confirm), completed, no_show, needs_review, deleted
- GCal: gcal-sync (teacher), student-gcal-sync (student)
- Meeting links: create_permanent_room via ghost event
- Reschedule: get-student-bookings action, calendar-handle-reschedule-decision
- Notifications: send-calendar-notification-email
- Bulk Actions: batch confirm/reject/complete/no-show with GCal sync

## 10. Meeting Links
[Existing section — keep as-is but move under Calendar]

## 11. Confirm/Reject & Inline Comments
[Keep existing]

## 12. Reschedule Badge
[Keep existing]

## 13. Recurring Booking Modal
[Keep existing]

## 14. Token & Subscription System
[Problem]: Monetization and usage metering.
[Solution]: Stripe integration with monthly + token model.
[Technical]:
- Hooks: useTokenSystem, usePlanLogic, useSubscriptionSync
- Plans: Free (2 tokens), Side-Gig ($9/15mo), Full-Time ($19-79/30-90mo)
- Rollover: unused monthly → rollover tokens at cycle end
- Edge: create-subscription, stripe-webhook, check-subscription-status, customer-portal
- UI: TokenPaywallModal, PricingSection, PricingCalculator

## 15. Interactive Worksheets & Sharing
[Problem]: Students need to complete exercises online.
[Solution]: Shareable links with interactive mode.
[Technical]:
- Share: /shared/:token, ShareWorksheetModal
- Interactive: useInteractiveSharedWorksheet hook
- Live Session: useLiveSessionAnswers (realtime subscription)
- Student answers: worksheet_student_answers table

## 16. Download System
[Problem]: Teachers need offline materials.
[Solution]: HTML/PDF export.
[Technical]:
- Edge: upload-to-r2, create-export-payment, verify-export-payment
- Hooks: useDownloadStatus, useDownloadTracking

## 17. Student Management
[Problem]: Track individual student data.
[Solution]: Student profiles with knowledge entries.
[Technical]:
- Pages: StudentPage.tsx, useStudents hook
- Knowledge: student_knowledge table, StudentKnowledge component
- Progress: useStudentProgress, student_progress_goals table

## 18. Drawing Canvas
[Problem]: Teachers need to annotate during lessons.
[Solution]: In-browser drawing overlay.
[Technical]:
- Hook: useDrawingCanvas
- Components: drawing/ directory

## 19. Admin Dashboard
[Problem]: Platform monitoring.
[Solution]: AdminDashboardPage with user stats.
[Technical]:
- Edge: admin-impersonate
- UI: AdminImpersonationBanner

## 20. SEO Infrastructure
[Problem]: Organic discovery by English teachers.
[Solution]: Multi-layer SEO.
[Technical]:
- 70+ static HTML landing pages (grammar topics, audience, use-case, comparisons)
- 65+ blog articles (React index + static HTML)
- Structured data: SoftwareApplication, FAQPage, HowTo, WebSite, BreadcrumbList
- AI discovery: llms.txt, llms-full.txt, llms-answers.txt, openapi.yaml, knowledge-graph.json, ai-plugin.json
- React SEO pages: /exercise-types, /prompts, /glossary, /resources, /blog, /about
- sitemap.xml (510 URLs)
- robots.txt (15+ AI bots allowed)

## RAG Keywords (Global)
[comprehensive keyword list at end]
```

---

### ZADANIE 2: Przebudowa `llms.txt` (root)

Obecny plik opisuje **tylko kalendarz i meeting linki**. Nowy plik będzie mapą do `docs/llm-context.md`, z sekcjami odpowiadającymi 1:1 rozdziałom w context.md.

Struktura:

```markdown
# Edooqoo — LLMs Reference

> AI-powered ecosystem for English tutors. 1-on-1 adult education.

## Application Architecture
- SPA: React 18 + Vite 5 + Tailwind v3 + TypeScript 5
- Backend: Supabase (PostgreSQL + Auth + Edge Functions + Realtime)
- Payments: Stripe
- AI: Gemini 2.5 Flash (generation), verify-open-answers (grading)
- Calendar: Google Calendar API (teacher + student sync)

## Feature Modules

### Worksheet Generation Engine
- 29 exercise types (20 basic + 5 audio + 4 picture)
- Gemini 2.5 Flash, streaming SSE, 200K char limit
- Key files: useWorksheetGeneration, generateWorksheet edge fn, WorksheetForm/
- RAG: worksheet generator, AI worksheets, ESL materials, CEFR exercises

### Homework System
- Assign exercises → student completes online → AI grades open-ended
- Key files: useInteractiveHomework, verify-open-answers, HomeworkReviewPage
- RAG: homework grading, AI evaluation, open-ended assessment

### Flashcards
- SM-2 spaced repetition, sets from worksheet vocabulary
- Key files: useFlashcardLearning, translate-flashcard
- RAG: flashcards, spaced repetition, vocabulary retention

### Welcome Test & Learning Paths
- 49 questions, 5 skill areas, 4 Learning Paths
- Key files: useWelcomeTest, process-welcome-test
- RAG: placement test, level assessment, CEFR test

### DSLM (Student Progress)
- 4-layer model: Events → Metrics → Profiles → Decisions
- Nano-skill tracking with CEFR tags and mastery trends
- Key files: useStudentEvents, useSkillMetrics
- RAG: progress tracking, nano-skill, mastery, learning analytics

### Student Hub
- Email-first portal at /my/:teacherToken
- Dashboard, flashcards, homework, worksheets, lessons, settings
- Key files: get-student-hub-data, StudentHub* pages
- RAG: student portal, student dashboard, self-study

### Lesson Calendar
[keep existing calendar sections but more concise]

### Meeting Links — GCal-Only Model
[keep existing]

### Token & Subscription System
- Stripe: Free/Side-Gig/Full-Time/Pro plans
- Rollover tokens, monthly worksheets
- Key files: useTokenSystem, create-subscription, stripe-webhook

### Interactive Worksheets & Live Sessions
- Shareable links, student interactive mode, realtime answers
- Key files: useInteractiveSharedWorksheet, useLiveSessionAnswers

### SEO Infrastructure
- 70+ HTML landings, 65+ blog articles, sitemap 510 URLs
- AI discovery: llms.txt, llms-full.txt, llms-answers.txt, openapi.yaml
- Structured data: 5 JSON-LD schemas in index.html

## Edge Functions (complete list)
[list all 45+ edge functions with one-line description each]

## File Map
[expanded file map covering all key directories]

## RAG Keywords
[comprehensive keyword block]
```

---

### ZADANIE 3: SEO — analiza luk i plan rozszerzenia

Po audycie obecnego stanu SEO, identyfikuję następujące luki:

#### 3A. Brakujące strony (luki tematyczne)

Obecne strony pokrywają dobrze gramatykę, tematy i porównania. **Brakuje**:

- Stron per exercise type (np. `/error-correction-exercises-esl.html`, `/sentence-transformation-worksheets.html`)
- Stron per exam (np. `/toefl-preparation-worksheets.html`, `/toeic-worksheets.html`)
- Strony `/student-hub` publicznej (landing opisujący portal studenta)
- Strony `/live-session` (landing opisujący tryb live)
- Strony `/welcome-test` publicznej (landing opisujący test plasujący)

tworzenie nowych stron HTML to zadanie któy wykonam w tym planie 

#### 3B. Brakujące elementy w istniejących stronach

- `sitemap.xml` ma `lastmod: 2026-03-15` na wszystkim — powinien być zaktualizowany do `2026-04-06`
- `public/llms.txt` (ten serwowany publicznie, NIE root) opisuje produkty dobrze, ale nie wspomina o Live Sessions ani Drawing Canvas
- `llms-full.txt` nie wspomina o GCal sync, meeting links, reschedule, bulk actions
- `knowledge-graph.json` nie ma `featureList` dla nowych feature'ów (calendar, student hub)

#### 3C. Plan aktualizacji plików publicznych SEO

**public/llms.txt** — dodać sekcje:

- Live Session Mode
- Drawing Canvas
- Lesson Calendar & Google Calendar sync
- Student Hub Google Calendar integration

**public/llms-full.txt** — dodać sekcje:

- Lesson Calendar (public booking, recurring, reschedule, GCal sync)
- Meeting Links (per-student, auto-generation)
- Student Hub Settings (GCal per-status colors, sync toggles)

**public/knowledge-graph.json** — dodać do featureList:

- "Lesson calendar with public booking page and weekly recurring slots"
- "Google Calendar sync for teachers and students"
- "Live Session mode with real-time student answer monitoring"
- "Drawing canvas for worksheet annotation"

**public/sitemap.xml** — aktualizować `lastmod` na `2026-04-06`

**public/llms-answers.txt** — dodać Q&A:

- "How does lesson booking work in Edooqoo?"
- "Does Edooqoo integrate with Google Calendar?"
- "What is Live Session mode?"
- "Can students book lessons independently?"

---

## Podsumowanie plików do zmiany


| Plik                          | Operacja         | Opis                                                                 |
| ----------------------------- | ---------------- | -------------------------------------------------------------------- |
| `docs/llm-context.md`         | **PRZEBUDOWA**   | Z ~300 linii (tylko kalendarz) → ~800 linii (pełny audyt 20 modułów) |
| `llms.txt` (root)             | **PRZEBUDOWA**   | Z ~78 linii (tylko kalendarz) → ~200 linii (mapa wszystkich modułów) |
| `public/llms.txt`             | **ROZSZERZENIE** | Dodanie sekcji Calendar, Live Session, Drawing                       |
| `public/llms-full.txt`        | **ROZSZERZENIE** | Dodanie sekcji Calendar, Meeting Links, Student GCal                 |
| `public/llms-answers.txt`     | **ROZSZERZENIE** | Dodanie 5-6 Q&A o calendar, booking, GCal                            |
| `public/knowledge-graph.json` | **UPDATE**       | Dodanie 4 pozycji do featureList                                     |
| `public/sitemap.xml`          | **UPDATE**       | lastmod → 2026-04-06                                                 |


## Czego NIE ruszamy

- Żadnego kodu aplikacji (hooks, components, pages, edge functions)
- Żadnych migracji DB
- Worksheet generation engine
- Plików `index.html` (structured data jest już kompletne)