
# Development Roadmap - English Worksheet Generator

## Current Status: MVP v1.3 (Complete)

### Recently Completed (Apr 5, 2026) - Permanent Meeting Links + Calendar Stability ✅
- `auto_create_student_meeting_link` toggle in `calendar_settings` — batch + on-add auto-generation
- Deterministic permanent link per student (teacherId+studentId hash)
- `createSlotsBatch` inherits student default_meeting_link
- `gcal-sync` skips conferenceData and never overwrites permanent student links
- Reject comment dialog with `DialogDescription`, closes only on success
- Atomic batch update for Confirm/Reject (fixes 400 error and calendar freeze)
- `getValidBatchSlotIds` validates existence, teacher ownership, pending status
- Lessons sorting: upcoming first (asc), past below (desc)

### Previously Completed (Mar 12, 2026) - SEO Phase 5: Google Search Dominance ✅
- 52 static HTML pages (was 35) — exercise, CEFR, use-case, comparison, blog pages
- FAQPage JSON-LD schema (10 questions) in `index.html`
- `public/.well-known/ai-plugin.json` — AI plugin manifest for agent discovery
- `public/openapi.yaml` — informational OpenAPI spec
- 5 static SEO landing pages targeting key teacher queries
- `src/pages/Prompts.tsx` — `/prompts` page with 50+ teacher prompts (6 categories)
- Extended `sitemap.xml` to 13 pages
- Dynamic meta tags on Pricing, Login, Signup
- "Prompts" link in GlobalFooter

### Previously Completed (Mar 9, 2026) - LLM Optimization Phase 1 ✅
- `public/llms.txt` + `public/llms-full.txt` — AI crawler discovery files
- `public/robots.txt` updated with 12 AI bot user-agents + sitemap
- `public/sitemap.xml` — static sitemap
- `index.html` — JSON-LD structured data (SoftwareApplication + Organization), updated meta tags
- `src/pages/About.tsx` — new `/about` page with product info, exercise types, FAQ, competitor comparison
- `public/about.html` — static HTML backup for non-JS crawlers
- `GlobalFooter.tsx` — added About link

### Previously Completed (Mar 9, 2026) - Landing Page "Product-First" Redesign ✅
- 8 new components: `StickyNav`, `HeroHeadline`, `StatsBar`, `ValueCards`, `EcosystemSection`, `TestimonialsRow`, `FinalCTA`, `useScrollAnimation`
- `Index.tsx` restructured: anonymous landing page flow vs clean authenticated dashboard
- `FormView.tsx` refactored: `variant` prop (landing/dashboard), removed Sidebar/IsometricBackground
- CSS scroll animations with IntersectionObserver and stagger delays
- Removed: inline nav components, progress bar, unused imports

### Previously Completed (Mar 8, 2026) - FAQ & Feature Documentation Update ✅
- Updated all FAQ items to reflect current features
- Added 6 new FAQ entries: Student Hub, Welcome Test, Lesson Booking, Progress, AI Evaluation, Google Calendar

### Previously Completed (Mar 8, 2026) - DSLM Audio Persistence + Welcome Test Fixes ✅
- Audio recordings now persist in DB (`audio_answers` JSONB column on both answer tables)
- Updated RPCs: `save_worksheet_answer`, `save_homework_answer`, getters — all support `audio_answers`
- `HomeworkSpeakingRecorder` ref-based timer (immune to parent re-renders)
- Progress calculation merges text + audio answers in both hooks
- SQL triggers create dual events (written + audio) per exercise with exception handlers
- Fixed `user_id` → `COALESCE(teacher_id, user_id)` in worksheet trigger
- Welcome Test: unified Skill Scores (MC from test_skill_results, Writing/Speaking from AI profile)
- Welcome Test UI: "Preview Test" + "View Results" on Overview, text labels in Tests tab
- Trait mapping: `wt_q3b` → `usage_context`, backfill existing events
- Mastery backfill: MC events with skill_ids get 100/0, profiling events cleared

### Previously Completed (Mar 8, 2026) - Permanent Share Links + Auto Token ✅
- Auto share_token in `generateWorksheet`, removed `share_expires_at`, all links permanent
- ShareWorksheetModal simplified, calendar button moved to global nav

### Previously Completed (Mar 3, 2026) - Calendar Fixes Round 4 (Faza 3.1r4) ✅
- React #310 crash fix: `safeSlot` pattern in SlotDetailModal, early return moved below all hooks
- DraggableDialog `modal={false}`: eliminates focus trap blocking Popover portals for student dropdown
- SC/TC badges: Student Cancellation (amber) / Teacher Cancellation (blue) with legend filtering
- Cancel request vs lesson: pending request withdrawal has no `cancelled_at/cancelled_by` record
- Email on teacher-created lesson: `createSlot` sends `new_booking_student` email with shared worksheet URL
- New `notify_email_on_lesson_created` toggle in calendar_settings (default true)
- Settings labels: "In-App Notifications" / "Email Alerts"
- Polling reduced to 2s on /book. Force refetch on SlotDetailModal close
- Student portal: history logs (`get_logs`), status badges, reschedule tracking, past lesson protection
- P badge removed from /book time slots

### Previously Completed (Mar 2026) - Calendar & Booking Overhaul (Faza 3.0) ✅
- Reschedule with confirmation: `reschedule_request_from/to_slot_id` columns + `calendar-handle-reschedule-decision` edge function (atomic confirm/reject)
- Dual timezone display: `date-fns-tz`, `timezoneUtils.ts`, student local time primary + teacher time secondary
- Email-first /book flow: email persisted 7 days in localStorage, auto-load bookings, auto-fill name
- /book landing page: `find-teachers-by-student-email` edge function, teacher list selector
- Complete email notifications: booking_rejected, reschedule_rejected, cancellation_confirmed_by_student
- Student combobox fix: removed preventDefault, added autoFocus
- Book weekly fix: queries full date range instead of single-week cache
- Slot overlap fix: hard-delete available slots without history
- Deleted slots visible by default + restore button
- Log completeness: buildSlotLogDetails helper, full context in all logs
- Notification resolution: is_resolved=true after teacher actions
- Cancellation window: UTC instant calculation (DST-safe) via date-fns-tz

### Previously Completed (Feb 2026) - Teacher Calendar Module (Faza 2.5) ✅
- Overbooking protection (SQL trigger + client checks), DraggableDialog, UnifiedSlotModal overhaul
- Recurring lesson fix, SlotDetailModal improvements, multi-select batch delete
- Calendar Settings (display hours, reschedule toggle, buffer), student filter, student portal on /book
- Email notifications via Resend, public booking improvements

### Previously Completed (Feb 2026) - 5 Critical Fixes ✅
- SharedWorksheet discussion recorder (HomeworkSpeakingRecorder + AutoResizeTextarea)
- Recorder inline layout in 6 single-column exercise components (left of textarea)
- Auto-save recordings: registryKey, global registry, 30s countdown, flush on submit
- Admin dashboard: filter anonymous accounts, cleanup banner + button, config.toml anon=false
- DSLM buildItemEvaluations fix: captures all nano-skills (primary+writing+speaking) after AI eval

### Previously Completed (Feb 2026) - Welcome Test Learning Path Score ✅
- 5 new behavioral questions (Q3b, Q5b, Q13b, Q17b, Q41b) woven into existing sections
- calculateLearningPathScore() deterministic algorithm: 15 signals, 5 overrides, 0-100 score
- LearningPathResult type with component_scores and overrides_applied
- Score saved to raw_answers.learning_path in student_learning_profiles
- Paths: comfort (0-25), guided (26-50), accelerated (51-75), target (76-100)

### Previously Completed (Feb 2026) - DSLM Layer B v5 Phase 2 ✅
- Flashcard trigger generates `ns.[CEFR].vocabulary.definition_[word]` (CEFR from student level)
- back_type mastery modifier: translation=0.85x, definition=1.0x
- Backfilled all flashcard:UUID metrics to new ns.* format
- Period filter always visible in SkillsOverviewPanel (contextual "no data" message)
- CEFR level filter (A1-C2 buttons) in SkillsOverviewPanel
- Student switcher popover on StudentPage header icon
- visual_comprehension added to category labels/order

### Previously Completed (Feb 2026) - DSLM Layer B v5 ✅
- Dual nano_skill system for open-ended exercises (primary + writing skill)
- CEFR-tagged nano_skill naming: ns.[CEFR].[topic].[skill_name] with full English names
- visual_comprehension category for picture exercises
- Updated extract_micro_skill() and extract_skill_category() with 3-format backward compatibility
- NanoSkillBadge displays dual badges with category labels
- masteryCalculator iterates all nano_skills per item

### Previously Completed (Feb 2026) - Welcome Test v2 Round 9 ✅
- Auto-transcription saved to question_data.transcription (no Transcribe button needed)
- AI per-question scoring (0-100) for open-ended and speaking answers
- is_correct set from AI score (≥40 = true), ai_score saved to question_data
- New speaking_score column in student_learning_profiles
- writing_score updated from AI scores instead of binary is_correct
- Communication → Speaking in WelcomeTestResults Skill Scores
- Event payload nano_skill_ratings.mastery updated from -1 to actual AI score
- Trigger log_test_answer_event skips welcome tests (prevents duplicates)
- Deleted duplicate events with event_source='test' for welcome tests
- visibilitychange timer: pauses when tab inactive
- calculate_test_results re-called after AI scoring

### Previously Completed (Feb 2026) - Welcome Test v2 Round 4 ✅

### Previously Completed (Feb 2026) - DSLM Layer A Audit ✅
- Event naming normalized to canonical types via SQL migration
- Flashcard mastery: weighted scale (0/50/70/90/100) replacing binary 0/100
- Mastery column populated for flashcard events in student_events
- Welcome test section_progress bloat cleaned (146→14 events)
- TypeScript events.ts rewritten with canonical types and typed payloads
- EventLogPanel updated with welcome_test source

### Previously Completed (Feb 2026) - Welcome Test v2 Round 3 ✅
- SpeakingRecorder auto-save on question navigation (questionId prop)
- Teacher audio playback with R2 URL detection in TestDetailsView
- Transcribe-audio rewritten to OpenAI Whisper (binary audio processing)
- TTS audio chunked base64 fix (stack overflow prevention)
- Q21 listening audio re-generated with TTS-1 verbatim reading
- AI Analysis includes transcribed speaking answers
- Event dedup: sectionKey simplified to sectionId
- Re-take preserves previous test results (no soft-delete)
- Auto-translate button from student native_language
- Full 10-language translations completed
- Blur modal improved (4 preview questions, opacity 0.50)
- Auth redirect on StudentPage for unauthenticated users

### Previously Completed (Feb 2026) - Welcome Test v2 Round 2 ✅
- Cross-browser SpeakingRecorder (mimeType detection: webm/mp4/fallback)
- Debounced event logging (commitAnswer on blur/navigation only)
- Separate skill vs profiling score display
- Cross-device resume (first unanswered question from DB)
- Server-side trait reconstruction in process-welcome-test
- Teacher access control (blocking screen on student test link)
- Teacher notes per question + Re-take button
- Auto-translation from student native_language profile
- 10 full language translation sets
- Mobile progress bar (replaces 49 dots)
- Tab navigation fix (StudentPage URL sync)
- Edge functions: generate-welcome-test-audio (TTS), transcribe-audio (STT)

### Previously Completed (Feb 2026) - Welcome Test v2 ✅
- Welcome Test with 49 questions across 7 sections
- Speaking recording (SpeakingRecorder) + Listening comprehension (ListeningPlayer)
- AI-powered profiling via Gemini 2.5 Flash (process-welcome-test edge function)
- Multi-language translation toggle (10 languages)
- Real-time progress tracking with 10s polling
- Pause/resume with state persistence
- Auto-email to student (send-test-email) and teacher on completion
- Notification system for welcome_test_completed events
- Welcome Test preview card in Tests tab (before test is sent)

### Achieved Features ✅
- AI-powered worksheet generation
- 8 different exercise types
- Student/Teacher dual views
- Real-time editing capability
- Stripe payment integration ($1/download)
- HTML export functionality
- Comprehensive event tracking
- Anonymous user support
- Mobile-responsive design
- Multiple choice answers fix
- Shared worksheet media + PDF margin fixes
- Add Student modal UX fix (form data persistence across browser tab switches)

---

## Stage 1: MVP Optimization (Weeks 1-4)
*Goal: Refine current functionality and improve user experience*

### Week 1: Performance & Reliability
- [ ] **AI Response Optimization**
  - Increase token limit to 6500
  - Improve JSON parsing error handling
  - Add response length monitoring
  - Implement better fallback mechanisms

- [ ] **Payment System Enhancement**
  - Reduce payment processing friction
  - Add payment confirmation feedback
  - Implement retry mechanisms
  - Improve error messaging

### Week 2: User Experience Improvements
- [ ] **Interface Enhancements**
  - Streamline form layout
  - Add progress indicators
  - Improve mobile experience
  - Add keyboard shortcuts

- [ ] **Content Quality Assurance**
  - Implement content validation
  - Add quality scoring system
  - Improve exercise variety algorithms
  - Enhanced mock data fallback

### Week 3: Analytics & Monitoring
- [ ] **Advanced Tracking**
  - Detailed user journey mapping
  - Conversion funnel analysis
  - Geographic usage patterns
  - Performance metrics dashboard

- [ ] **A/B Testing Framework**
  - Pricing experiments ($1.00 vs $1.49)
  - Form layout variations
  - CTA button optimization
  - Payment flow improvements

### Week 4: Bug Fixes & Polish
- [ ] **Quality Assurance**
  - Cross-browser testing
  - Mobile device testing
  - Payment flow validation
  - Content generation testing

---

## Stage 2: User Accounts & Profiles (Weeks 5-11)
*Goal: Add teacher authentication and student profile management*

### Week 5-6: Authentication System
- [ ] **Teacher Registration**
  - Email/password authentication
  - Email verification
  - Password reset functionality
  - Profile management

- [ ] **Database Schema Updates**
  - Create `teacher_profiles` table
  - Create `students` table
  - Add relationships to `worksheets`
  - Migration scripts

### Week 7-8: Student Profile Management
- [ ] **Student CRUD Operations**
  - Add/edit/delete students
  - Student information forms
  - Profile validation
  - Bulk import/export

- [ ] **Student Data Structure**
  - Personal information (name, age, occupation)
  - Learning goals and objectives
  - Current English level (CEFR)
  - Grammar weaknesses tracking
  - Interest areas and preferences
  - Learning style preferences
  - Session history tracking

### Week 9-10: Smart Worksheet Generation
- [ ] **Profile-Based Generation**
  - Auto-populate form fields from student profile
  - Personalized content recommendations
  - Difficulty adjustment based on history
  - Topic suggestions based on interests

- [ ] **Enhanced Form Interface**
  - Student selector dropdown
  - Quick-fill buttons
  - Profile preview panel
  - Generation history

### Week 11: Integration & Testing
- [ ] **System Integration**
  - Anonymous vs registered user flows
  - Data migration for existing users
  - Backwards compatibility
  - Performance optimization

---

## Stage 3: Assessment & Testing (Weeks 12-18)
*Goal: Add student testing capabilities and progress tracking*

### Week 12-13: Test Generation System
- [ ] **Test Builder**
  - Grammar-focused test generation
  - Vocabulary assessment tools
  - Multiple choice quiz creation
  - Automated scoring system

- [ ] **Test Delivery Platform**
  - Shareable test links
  - Time-limited test sessions
  - Progress saving
  - Automatic submission

### Week 14-15: Results & Analytics
- [ ] **Performance Tracking**
  - Individual student progress
  - Weakness identification algorithms
  - Improvement trend analysis
  - Comparative performance metrics

- [ ] **Teacher Dashboard**
  - Student performance overview
  - Test results visualization
  - Progress reports generation
  - Recommendation engine

### Week 16-17: Integration with Worksheets
- [ ] **Adaptive Content Generation**
  - Test results inform worksheet content
  - Weakness-focused exercise selection
  - Difficulty adjustment based on performance
  - Personalized learning paths

### Week 18: Polish & Testing
- [ ] **Quality Assurance**
  - Test accuracy validation
  - Progress tracking verification
  - Report generation testing
  - User experience optimization

---

## Stage 4: Batch Operations &Organization (Weeks 19-24)
*Goal: Enable bulk worksheet creation and organization*

### Week 19-20: Series Generation
- [ ] **Batch Worksheet Creation**
  - Multi-lesson series planning
  - Coherent content progression
  - Topic continuity management
  - Difficulty scaling

- [ ] **Series Management**
  - Template-based series creation
  - Custom series builder
  - Progress tracking across series
  - Completion monitoring

### Week 21-22: Content Organization
- [ ] **Folder System**
  - Student-specific folders
  - Topic-based organization
  - Date-based sorting
  - Search and filter capabilities

- [ ] **Worksheet Library**
  - Personal worksheet collection
  - Favorite worksheets
  - Recently used materials
  - Sharing capabilities

### Week 23-24: Export & Backup
- [ ] **Bulk Export Features**
  - Multiple worksheet downloads
  - Series export as ZIP files
  - Progress report exports
  - Backup and restore functionality

---

## Stage 5: Intelligent Planning (Weeks 25-30)
*Goal: AI-powered curriculum planning and recommendations*

### Week 25-26: Learning Path Analysis
- [ ] **Progress Analysis Engine**
  - Multi-dimensional skill tracking
  - Learning velocity calculations
  - Optimal difficulty progression
  - Gap identification algorithms

### Week 27-28: Curriculum Recommendations
- [ ] **AI Curriculum Planner**
  - Weekly lesson suggestions
  - Long-term learning objectives
  - Skill progression mapping
  - Adaptive timeline adjustments

### Week 29-30: Teacher Decision Support
- [ ] **Planning Interface**
  - Visual curriculum timeline
  - Drag-and-drop lesson planning
  - Alternative path suggestions
  - Progress prediction modeling

---

## Stage 6: Calendar & Scheduling (Weeks 31-35)
*Goal: Comprehensive lesson planning and scheduling tools*

### Week 31-32: Calendar System
- [ ] **Lesson Calendar**
  - Multi-student view
  - Drag-and-drop scheduling
  - Recurring lesson support
  - Conflict detection

### Week 33-34: Schedule Management
- [ ] **Advanced Scheduling**
  - Time zone support
  - Reminder notifications
  - Cancellation/rescheduling
  - Availability management

### Week 35: Integration & Polish
- [ ] **Workflow Integration**
  - Calendar-to-worksheet connection
  - Automatic material preparation
  - Session preparation checklists
  - Post-lesson follow-up

---

## Stage 7: Multimedia Enhancement (Weeks 36-40)
*Goal: Add audio, visual, and interactive elements*

### Week 36-37: Audio Integration
- [ ] **Text-to-Speech System**
  - Multiple voice options
  - Pronunciation guides
  - Dialogue narration
  - Exercise instructions

### Week 38-39: Visual Enhancements
- [ ] **Slide Generation**
  - Auto-generated presentations
  - Visual vocabulary cards
  - Infographic creation
  - Interactive diagrams

### Week 40: Multimedia Polish
- [ ] **Integration & Testing**
  - Quality assurance
  - Performance optimization
  - Cross-platform compatibility
  - User experience refinement

---

## Stage 8: Visual Templates (Weeks 41-44)
*Goal: Professional document design and branding*

### Week 41-42: Template System
- [ ] **Design Templates**
  - Professional layouts
  - Customizable themes
  - Brand consistency
  - Print optimization

### Week 43-44: Customization Tools
- [ ] **Design Controls**
  - Color scheme selection
  - Font customization
  - Logo integration
  - Layout modifications

---

## Stage 9: Progress Analytics (Weeks 45-48)
*Goal: Comprehensive learning analytics and reporting*

### Week 45-46: Advanced Analytics
- [ ] **Learning Analytics Engine**
  - Multi-dimensional progress tracking
  - Predictive performance modeling
  - Comparative analysis tools
  - Trend identification

### Week 47-48: Reporting System
- [ ] **Comprehensive Reports**
  - Visual progress dashboards
  - Detailed skill assessments
  - Parent/supervisor reports
  - Historical trend analysis

---

## Stage 10: Smart Recommendations (Weeks 49-52)
*Goal: AI-powered teaching assistance and optimization*

### Week 49-50: Recommendation Engine
- [ ] **AI Teaching Assistant**
  - Next-lesson suggestions
  - Skill gap identification
  - Optimal timing recommendations
  - Content difficulty optimization

### Week 51-52: System Optimization
- [ ] **Performance Tuning**
  - Recommendation accuracy improvement
  - System response optimization
  - User experience refinement
  - Final testing and deployment

---

## Stage 11: Community Features (Weeks 53-58)
*Goal: Teacher collaboration and resource sharing*

### Week 53-54: Sharing Platform
- [ ] **Community Worksheets**
  - Public worksheet sharing
  - Rating and review system
  - Search and discovery
  - Usage analytics

### Week 55-56: Collaboration Tools
- [ ] **Teacher Networking**
  - Peer connections
  - Discussion forums
  - Best practice sharing
  - Mentorship programs

### Week 57-58: Community Management
- [ ] **Moderation & Quality**
  - Content quality control
  - Community guidelines
  - Reward systems
  - Feature refinement

---

## Stage 12: Gamification (Weeks 59-64)
*Goal: Engagement through game mechanics*

### Week 59-60: Student Gamification
- [ ] **Achievement System**
  - Progress badges
  - Skill certifications
  - Milestone celebrations
  - Personal records

### Week 61-62: Teacher Incentives
- [ ] **Professional Recognition**
  - Community contributions
  - Quality ratings
  - Usage milestones
  - Platform loyalty rewards

### Week 63-64: System Integration
- [ ] **Gamification Balance**
  - Motivation optimization
  - Progress visualization
  - Social features
  - Final system integration

---

## Technical Milestones

### Infrastructure Scaling
- **Month 3**: Database optimization for user accounts
- **Month 6**: Content delivery network implementation
- **Month 9**: Advanced caching strategies
- **Month 12**: Multi-region deployment

### AI/ML Enhancements
- **Month 4**: Improved content personalization
- **Month 8**: Predictive analytics implementation
- **Month 12**: Advanced recommendation algorithms
- **Month 16**: Natural language processing upgrades

### Security & Compliance
- **Month 2**: Enhanced data protection
- **Month 6**: GDPR compliance audit
- **Month 10**: Educational data privacy standards
- **Month 14**: Advanced security monitoring

---

## Success Metrics by Stage

### Stage 2 (User Accounts)
- 500+ registered teachers
- 2,000+ student profiles created
- 25% increase in user retention

### Stage 3 (Testing)
- 1,000+ tests administered
- 80% test completion rate
- 40% improvement in targeted learning

### Stage 4 (Organization)
- 5,000+ worksheets in organized collections
- 60% increase in multi-worksheet sessions
- 30% reduction in preparation time

### Stage 5 (Planning)
- 1,000+ curriculum plans generated
- 70% teacher adoption of AI recommendations
- 25% improvement in learning outcomes

### Stages 6-12 (Advanced Features)
- 10,000+ active teachers
- 50,000+ student profiles
- $500K+ annual recurring revenue
- Market leadership in AI-powered educational tools

---

*This roadmap represents a comprehensive 18-month development plan. Priorities may be adjusted based on user feedback, market conditions, and technical discoveries during implementation.*
