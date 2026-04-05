
# English Worksheet Generator - Quick Start Guide

## What is it?
AI-powered tool that creates personalized English worksheets for teachers working with adult students one-on-one.

**Latest Update (April 5, 2026):** **Permanent Meeting Links** — Each student automatically gets one permanent meeting room link (same link for all lessons). **Reject Comment** — Teachers can add a comment when rejecting a booking request; comment included in student email. **Confirm/Reject Stability** — Fixed calendar freeze after confirming/rejecting pending lessons. **Lessons View** — Student Hub lessons page now shows upcoming lessons first by default.

**Previous Update:** **SEO Phase 5 (March 12, 2026)** — 52 static HTML pages, 70 sitemap entries, 15 blog articles, 30+ footer links (hidden on homepage). Key pages expanded to 1500-2500 words. Performance: preconnect for Supabase. "No signup needed" badge on form. Form widened for single-line labels.

**Previous Update:** **LLM Optimization / About Page (March 9, 2026)** — New `/about` page with full product description, 29 exercise types, FAQ, competitor comparison. AI discovery files (llms.txt, llms-full.txt) and structured data (JSON-LD) added for search engine and AI crawler visibility.

**Previous Update:** **Unified Navigation + Stats Fix (March 9, 2026)** — Same edooqoo navigation bar now appears on all main pages (Dashboard, Profile, Pricing, Privacy Policy, Cookie Policy). Dashboard now shows a quick-actions bar with Generate Worksheet button and Calendar with notification count. StatsBar updated to real data: 29 exercise types, 2,000+ worksheets generated, <2 min generation time. Background changed from pure white to subtle off-white.

**Previous Update:** **FAQ & Feature Documentation Update (March 8, 2026)** — Updated all FAQ items to reflect current app features. Added 6 new FAQ entries.

**Previous Update:** **DSLM Audio + Welcome Test Fixes (March 8, 2026)** — Audio recordings now persist after page refresh (saved to DB). Auto-save countdown timer no longer resets. Progress bar includes audio answers. Separate event logs for written and audio responses. Welcome Test: unified Skill Scores section (MC + AI scores merged), "Preview Test" and "View Results" buttons on student Overview. Mastery data backfilled for accuracy.

**Previous Update:** **Permanent Share Links (March 8, 2026)** — Share links permanent, auto-generated at creation. Calendar button in top nav.

**Previous Update:** **Calendar Fixes Round 4 (March 3, 2026)** — Fixed white screen crash (React #310). Student dropdown now clickable (modal={false}). SC/TC cancellation badges with legend filtering. Cancel request vs lesson distinction. Email sent to student on teacher-created lesson. New `notify_email_on_lesson_created` setting. Labels: "In-App Notifications" / "Email Alerts". Polling 2s on /book. History logs, status badges, reschedule info on student portal. Past lesson protection (hide Reschedule).

**Previous Update:** **Calendar & Booking Overhaul (March 2026)** — Reschedule with confirmation now prevents double-bookings (atomic edge function). Dual timezone display (student local + teacher time). Email-first /book flow (email saved 7 days). New /book landing page (enter email → select teacher). Complete email notifications (booking rejected, reschedule rejected, cancellation confirmed). Student combobox fix. Book weekly fix (full date range query). Deleted slots visible by default with restore button. Complete slot logs.

**Previous Update:** **Welcome Test Learning Path Score** — 5 new behavioral questions detect student's learning timeline, persistence, deadline response, career importance, and usage context. Deterministic algorithm calculates Learning Path Score (0-100) from 15 signals, mapping to 4 paths: Comfort, Guided, Accelerated, Target.

**Previous Update:** **DSLM + UX Phase 3** — NanoSkill badges now show in all exercise types including dual badges (reading+writing). [V]/[G] focus tags visible on worksheet. "Add Exercise" button in Live Session (max 12 exercises). Delete worksheets from Overview. Period+CEFR filters side-by-side. Student switcher scroll fixed with blue icon. Toolbar labels shortened in Live Session.

**Previous Update:** **Welcome Test v2 Round 9** — transcriptions now auto-generated and displayed (no manual Transcribe button), AI scores each open/speaking answer 0-100 individually, Speaking score added to Skill Scores (replacing Communication), timer pauses when tab is inactive, duplicate events cleaned, event payload mastery updated from -1 to actual AI scores.

**Previous Update:** **Welcome Test v2 Round 3** — speaking recorder auto-saves on navigation, teacher can play back student recordings, AI analysis includes transcribed speaking answers (Whisper), Q21 listening audio re-generated with correct dialogue, re-take preserves old test results, auto-translate button from student profile, full 10-language translations, improved blur modal, and auth redirect for email links.

**Previous Update:** **Welcome Test v2** with speaking recording, listening comprehension, multi-language translations, AI-powered student profiling, and real-time progress tracking. Teachers can preview all questions before sending, receive email notifications on completion, and see AI-generated learning profiles.

**Previous Update:** New **Progress** tab on student page! Track learning goals, rate student skills (1-5 stars), and get AI-generated worksheet suggestions. Unified Main Goals across all dialogs with 3 new options: Social Conversation, Personal Development, Fun & Entertainment.

## How it works?
1. **Create account** - Sign up and get 2 free tokens
2. **Add students** - Manage your student list
3. **Fill the form** - Enter lesson topic, student level, and goals
4. **Generate** - AI creates a complete worksheet in 30-60 seconds
5. **Review & Edit** - Switch between Student and Teacher views, make modifications
6. **✨ NEW: Manage exercises** - Reorder with ↑/↓ buttons, delete/restore exercises
7. **Download** - Export as HTML or PDF files

## Key Features
- ✅ **Account required** - Sign up to start generating worksheets
- ✅ **Student management** - Add unlimited students to your account
- ✅ **8 exercise types** - Multiple choice, fill-in-blanks, reading, dialogue, matching
- ✅ **Two versions** - Clean student version + teacher version with answers
- ✅ **Context-aware content** - Grammar examples use lesson-specific vocabulary
- ✅ **Instant generation** - Ready in under a minute
- ✅ **Professional quality** - Print-ready, offline-capable HTML files
- ✅ **Fully editable** - Modify any content before downloading
- ✅ **✨ Exercise management** - Reorder, delete, and restore exercises easily
- ✅ **Auto-download unlock** - No payment required for registered users

## Account Plans

### Free Demo Plan
- **Cost**: $0/forever
- **Tokens**: 2 free tokens on signup
- **Monthly Worksheets**: None
- **Perfect for**: Testing the service

### Side-Gig Plan
- **Cost**: $9/month
- **Monthly Worksheets**: 15 per month
- **Rollover**: Unused worksheets carry forward as tokens
- **Perfect for**: Part-time tutors, 1-3 students per week

### Full-Time Plans
- **30 worksheets/month**: $19/month ($0.63 per worksheet)
- **60 worksheets/month**: $39/month ($0.65 per worksheet)
- **90 worksheets/month**: $59/month ($0.66 per worksheet)
- **120 worksheets/month**: $79/month ($0.66 per worksheet)
- **Perfect for**: Professional teachers, language schools

## Token & Subscription Logic
- **Usage priority**: Monthly worksheets used first, then available tokens
- **Rollover system**: Unused monthly worksheets automatically become tokens
- **Never expire**: Rollover tokens and purchased tokens never expire
- **Upgrade/downgrade**: Prorated pricing, unused worksheets preserved

## Getting Started
1. **Sign up** for your free account
2. **Confirm your email** to activate full features
3. **Add your first student** to unlock the generator
4. **Create your first worksheet** using 1 of your 2 free tokens
5. **Choose a plan** when you need more worksheets

## Perfect for:
- Private English tutors
- Language schools
- Corporate trainers
- Online English teachers

*All content is in English. Designed specifically for adult learners.*
