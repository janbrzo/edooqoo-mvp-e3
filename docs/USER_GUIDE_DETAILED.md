
# English Worksheet Generator - Complete User Guide

**Latest Update (March 8, 2026):** FAQ & Feature Documentation Update — Updated all FAQ items to reflect current features. Added 6 new FAQ entries: Student Hub, Welcome Test & Learning Path, Lesson Booking, Student Progress tracking, AI Evaluation, Google Calendar integration.

**Previous Update (March 8, 2026):** Audio recordings on shared worksheets and homework now persist after page refresh. The auto-save countdown (30s) no longer resets during interactions. Progress tracking includes both written and audio answers. Welcome Test results show unified Skill Scores (MC scores for Grammar/Vocab/Reading/Listening, AI scores for Writing/Speaking). "Preview Test" and "View Results" buttons added to student Overview tab.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Account Management](#account-management)
3. [Student Management](#student-management)
4. [Worksheet Generation](#worksheet-generation)
5. [Token & Subscription System](#token--subscription-system)
6. [Download System](#download-system)
7. [Editing & Customization](#editing--customization)
8. [Subscription Management](#subscription-management)
9. [Calendar Module](#calendar-module)
10. [Troubleshooting](#troubleshooting)

## Calendar Module

### Overview
The Calendar module (`/calendar`) lets teachers manage their lesson schedule with Day, Week, and Month views.

### Adding Events (UnifiedSlotModal)
Click the **+ Add** button to open the draggable, transparent modal with two main tabs:
- **Available Slot**: Create open slots for students to book
  - *Single Slot*: One date + time range + optional location
  - *Batch Slots*: Select days of the week, date range, and a list of editable time entries with + Add / remove
- **Lesson**: Create lessons assigned to a student
  - *Single Lesson*: Pick student (searchable combobox), date, time. Link worksheet directly from dropdown
  - *Recurring Lesson*: Pick student, select multiple days (Mon-Sun checkboxes), From/To date range, time. Creates one recurrence rule per selected day

**Note:** Title field removed — lessons auto-titled from student name. Slot count preview shown for all batch/recurring modes.

### Conflict Detection & Overbooking Protection
The system prevents double-bookings at multiple levels:
- **SQL trigger** (`check_slot_overlap`): Database-level block on overlapping lessons
- **Client-side checks**: Every create/batch/recurring operation checks for time overlaps
- **Rules**: Available over Lesson → Blocked | Lesson over Available → Auto-replaces | Lesson over Lesson → Blocked
- **Public booking**: Race condition protection via optimistic lock on slot status

### Slot Details & Editing
Click any slot/lesson to open the draggable SlotDetailModal:
- Inline edit date, time, notes, location
- Assign, change, or remove student
- Status actions: Confirm, Complete, No Show, Cancel Lesson, **Reject** (for pending bookings)
- "Save for Entire Series" for recurring events
- Link/unlink worksheets (opens in new tab)

### Multi-Select & Batch Delete
Toggle selection mode from toolbar → click available slots to select → floating bar shows count with "Delete All" button → confirmation dialog → batch delete.

### Student Filter
CalendarToolbar includes a student dropdown — filter the entire calendar view to show only one student's lessons.

### Public Booking (/book)

#### Email-First Flow (New)
When visiting `/book/:token`, students enter their email first (saved for 7 days). The system automatically loads their existing bookings and auto-fills their name if found in the teacher's student database. No need for the "Already have a booking?" section.

#### /book Landing Page (New)
Students can visit `/book` without a teacher token:
1. Enter email address (saved 7 days)
2. System finds all teachers associated with that email
3. Student selects their teacher from the list
4. Redirected to the teacher's booking page

#### Booking Features
- **Time range display**: Shows start–end time (e.g., 15:00–16:00) instead of just start time
- **Dual timezone**: Student sees their local time as primary, teacher's timezone shown as secondary label
- **Book weekly**: Select a recurring day and end date — system finds all available matching slots across weeks
- **Email notifications**: Students receive emails for booking confirmation, pending, rejected, reschedule confirmation/rejection, and cancellation

### Reschedule (Requires Confirmation)
When "Allow student rescheduling without confirmation" is OFF:
- **Pending slot reschedule**: Old pending slot immediately freed; new slot becomes pending
- **Confirmed slot reschedule**: Old slot stays booked with "CR" (Change Request) indicator; new slot pending until teacher confirms
- **Teacher confirm**: Old slot freed, new slot confirmed, student notified
- **Teacher reject**: New slot freed, old slot unchanged, student notified
- No double-bookings possible — atomic edge function handles both slot updates

### Notifications
- **Bell icon**: Shows unread notifications with actionable items (confirm/reject)
- **Auto-resolve**: Notifications marked as done after teacher takes action
- **Content**: Reschedule notifications show "From date → To date"
- **Student info**: Name shown prominently, email shown separately (no duplication)

### Calendar Settings
- **Display hours**: Configure start/end hours for the grid (default 7-22)
- **Student reschedule**: Allow students to reschedule automatically or require teacher approval
- **Buffer minutes**: Set minimum gap between lessons
- **Cancellation window**: `min_cancellation_hours` calculated using UTC instants (DST-safe)
- **Deleted slots**: Visible by default (toggle "Hide Deleted"). Restore button available on deleted slots
- **All existing**: Booking mode, confirmation type, notification preferences

## Getting Started

**Latest Improvements (Permanent Share Links - March 8, 2026):**
- **Permanent share links**: All shared worksheet, homework, and flashcard links are now permanent — they never expire
- **Auto share token**: When you generate a worksheet, a share link is automatically created. No need to click "Generate Share Link" anymore
- **Simplified sharing modal**: Opens with the link ready to copy or email immediately

**Previous Improvements (5 Critical Fixes):**
- **SharedWorksheet discussion recorder**: Students can now record audio answers for discussion questions in shared worksheets (was text-only)
- **Inline recorder layout**: Audio recorder appears to the left of the text input for better space usage in single-column exercises
- **Auto-save recordings**: Unsaved recordings auto-save after 30 seconds; all pending recordings are flushed before homework submission
- **Admin cleanup**: Admin dashboard hides anonymous accounts and provides a one-click cleanup button
- **DSLM nano-skill capture**: AI evaluations now properly capture all nano-skills (primary + writing + speaking)

**Previous Improvements (Welcome Test Learning Path Score):**
- **5 behavioral questions**: New scenario-based questions (Q3b, Q5b, Q13b, Q17b, Q41b) detect deadline urgency, persistence, career importance, usage context, and learning timeline
- **Learning Path Score**: Deterministic 0-100 score from 15 signals determines optimal learning path (Comfort/Guided/Accelerated/Target)
- **Override rules**: Urgent deadline + critical career = always Target Path; lazy + hobby = always Comfort Path

**Previous Improvements (DSLM Layer B v5 Phase 2):**
- **Flashcard CEFR naming**: Flashcard reviews now tracked as `ns.[CEFR].vocabulary.definition_[word]` instead of `flashcard:UUID`
- **Translation vs Definition**: Translation-based flashcards get 0.85x mastery modifier (easier), English definitions get full mastery
- **Period filter fix**: Filter stays visible even when no data exists for selected period, with helpful message
- **CEFR filter**: New A1-C2 buttons to filter skills by CEFR level in Skills panel
- **Student switcher**: Click the user icon on any student page to quickly switch between students

**Previous Improvements (DSLM Layer B v5):**
- **CEFR-tagged skills**: Each nano_skill now includes CEFR level (A1-C2) reflecting actual item difficulty
- **Dual nano_skills**: Open-ended exercises track both primary skill (reading/listening/speaking) and writing ability
- **Visual comprehension**: Picture exercises correctly categorized as visual_comprehension instead of reading
- **Richer Skills panel**: Shows more granular skill data with accurate category mapping

**Previous Improvements (Welcome Test v2 Round 9):**
- **Auto-transcription**: Speaking answers transcribed automatically after test completion — no manual button needed
- **AI per-question scoring**: Each open/speaking answer scored 0-100 individually by AI
- **Speaking score**: New skill score in learning profile, calculated from AI analysis of speaking answers
- **Timer precision**: Tab-inactive time excluded from question timers
- **Event data quality**: Mastery values in event payloads updated from placeholder -1 to actual AI scores

**Previous Improvements (DSLM Layer A Audit):**
- **Event normalization**: All student learning events now use consistent canonical naming across worksheet, homework, flashcard, and welcome test sources
- **Flashcard mastery**: Weighted mastery scoring (0→50→70→90→100) based on spaced repetition progress instead of binary pass/fail
- **Data integrity**: Mastery column populated for all event types; duplicate/bloated events cleaned up

**Previous Improvements (Round 3):**
- **Auto-save recordings**: Speaking answers auto-save when navigating to next question (no need to click Save)
- **Teacher playback**: Teachers can listen to student recordings directly in test results
- **AI transcription**: Speaking answers are transcribed (OpenAI Whisper) and included in AI analysis
- **Correct listening audio**: Q21 café dialogue re-generated with exact verbatim text via TTS-1
- **Re-take preserves results**: Previous test results remain visible after re-take
- **Auto-translate button**: One-click translation using student's native language from profile
- **Complete translations**: All 10 languages now have full question coverage
- **Better email links**: Clicking "View Results" in email redirects to login if needed, then back to results

**Previous Improvements (Round 2):**
- **Cross-browser recording**: Speaking recorder works on Safari/iOS with automatic mimeType detection
- **Teacher notes**: Add notes per question in test results view
- **Smart resume**: Cross-device resume finds first unanswered question automatically
- **Teacher access control**: Teachers can't accidentally answer student's test
- **Mobile optimized**: Compact progress bar replaces question dots on mobile
- **Accurate scoring**: Skill questions scored separately from profiling questions

**Previous Improvements:**
- **Welcome Test v2**: Comprehensive student profiling with speaking, listening, AI analysis, multi-language translations
- **Welcome Test Preview**: Teachers can preview all test questions in Tests tab before sending to student
- **Auto-notifications**: Teachers receive email + in-app notification when student completes Welcome Test
- **Progress tracking**: Real-time progress bar showing student's test completion status
- **Pause & Resume**: Students can close browser and resume test later with all answers preserved

**Previous Improvements:**
- **Live Session Done Button**: Teachers can mark exercises as completed in Live Session mode with elegant gray styling
- **Share Button on Worksheets Tab**: Quick share access on worksheet cards in /student page with green border when active
- **Share Links 10 Days**: Extended from 7 days for more flexibility
- **Deterministic Matching Shuffle**: Matching exercises maintain consistent order across sessions (teacher and student see same order)
- **Next Lesson Ideas Category**: New Student Knowledge category with dedicated lightbulb button for quick lesson planning notes
- **Email Template Fixes**: Worksheet/homework notification emails no longer overflow on desktop

### Account Creation (Required)
- **Registration required**: You must create an account to generate worksheets
- **Email confirmation**: Verify your email to access all features
- **2 free tokens**: Automatically added on successful signup
- **Student requirement**: Must add at least one student before generating

### First Steps
1. Sign up with email and password
2. Confirm your email address via verification link
3. Add your first student from the dashboard
4. Navigate to the generator and select your student
5. Create your first worksheet using one of your free tokens

## Account Management

### Account Types
- **Free Demo**: 2 free tokens, no monthly allowance
- **Side-Gig Plan**: $9/month, 15 monthly worksheets
- **Full-Time Plans**: $19-79/month, 30-120 monthly worksheets

### Profile Features
- **Personal information**: Name, email management
- **Subscription status**: Current plan and billing details
- **Token balance**: Available tokens and monthly worksheets remaining
- **Account deletion**: Full data removal option

## Student Management

### Dashboard Features
- **Search bar**: Filter students by name in real-time (instant results as you type)
- **Sort options**: Toggle A-Z / Z-A alphabetical sorting, or keep default "Recent" order
- **Default sorting**: Students are ordered by most recent activity (worksheet creation, duplication, or student addition)

### Adding Students
- **Unlimited students**: No restrictions on number of students
- **Required fields**: Student name, English level (A1-C2), learning goal
- **Learning goals**: Work, Exam preparation, General English
- **Quick access**: Generate worksheets directly from student cards

### Student Information
- **English levels**: A1 (Beginner) through C2 (Proficient)
- **Learning contexts**: Tailored content based on goals
- **Worksheet history**: View all worksheets created for each student
- **Easy management**: Edit student information anytime

## Worksheet Generation

### Generation Process
1. **Select student**: Required before generation (dropdown selection)
2. **Auto-fill**: Student level and goal automatically populated
3. **Customize**: Add lesson topic and specific learning objectives
4. **Generate**: AI creates worksheet in 30-60 seconds
5. **Review**: Preview both Student and Teacher versions

### Exercise Types Available
1. **Vocabulary Sheets**: Key terms with definitions and examples
2. **Grammar Exercises**: Context-specific grammar practice
3. **Reading Comprehension**: Custom passages with questions
4. **Fill-in-the-Blanks**: Targeted vocabulary and grammar gaps
5. **Multiple Choice**: Various difficulty levels and topics
6. **Matching Exercises**: Terms, definitions, concepts
7. **Dialogue Practice**: Real conversation scenarios
8. **Mixed Exercises**: Combination of multiple types

### Customization Options
- **Lesson topics**: Any subject area or theme
- **Learning objectives**: Specific skills to focus on
- **Exercise selection**: Choose preferred types
- **Difficulty adjustment**: Based on student level
- **Context relevance**: Professional or general content

## Token & Subscription System

### Consumption Priority
1. **Monthly worksheets used first**: From current subscription
2. **Available tokens used second**: Purchased or rollover tokens
3. **Generation blocked**: When no resources available

### Rollover System
- **Automatic conversion**: Unused monthly worksheets → rollover tokens
- **At billing cycle**: Happens automatically each month
- **Never expire**: Rollover tokens preserved indefinitely
- **Usage priority**: After purchased tokens, before new monthly allowance

### Token Management
- **Starting balance**: 2 free tokens on signup
- **Monthly reset**: Subscription worksheets reset each billing cycle
- **Token purchase**: Additional tokens available for purchase
- **Balance tracking**: Real-time display in profile and dashboard

## Download System

### Automatic Unlock for Registered Users
- **Immediate access**: Downloads unlocked automatically
- **Both versions**: Student and Teacher files available
- **No additional payment**: Included with account
- **Multiple downloads**: Re-download anytime

### File Formats
- **HTML (Recommended)**: Best quality, works offline, preserves formatting
- **PDF**: Universal format, slightly lower quality due to conversion
- **Timestamped filenames**: Easy organization and identification
- **View-specific naming**: Clear distinction between Student/Teacher versions

## Editing & Customization

### Built-in Editor
- **Full text editing**: Modify any worksheet content
- **Exercise adjustment**: Add, remove, or change exercises
- **Real-time preview**: See changes immediately
- **Save before download**: Preserve modifications

### Format Options

Two formats are available:

#### PDF Export Instructions
When printing HTML to PDF:
1. Open the downloaded HTML file in your browser
2. Click the Print button
3. In the print dialog, set margins to **"None" or "Minimum"**
4. Choose "Save as PDF"
5. Save the file

This ensures proper margins (0.5cm top/bottom, 1cm sides) in the final PDF.

### Student vs Teacher Views
- **Student version**: Clean, answer-free format
- **Teacher version**: Includes answers, notes, teaching tips
- **Easy switching**: Toggle between views instantly
- **Separate downloads**: Distinct files for each version

## Subscription Management

### Plan Changes
- **Upgrades**: Immediate effect, prorated billing
- **Downgrades**: Effective at next billing cycle
- **Unused preservation**: Monthly worksheets become rollover tokens
- **Flexible billing**: Change plans anytime

### Stripe Customer Portal
- **Access via Profile**: "Manage Subscription" button
- **Full management**: Cancel, modify payment, view invoices
- **Secure handling**: All payments processed by Stripe
- **Immediate updates**: Changes reflected in real-time

### Billing Details
- **Monthly billing**: Automatic renewal
- **Prorated pricing**: Fair calculation for plan changes
- **Email confirmations**: Stripe sends all receipts
- **Grace period**: Access continues until period end after cancellation

## Troubleshooting

### Common Issues

#### Cannot Generate Worksheets
- **Cause**: No students added to account
- **Solution**: Add at least one student from dashboard

#### Generation Failed
- **Cause**: Server error or invalid parameters
- **Solution**: Form data preserved, try again (no token consumed)

#### Email Not Confirmed
- **Cause**: Haven't clicked verification link
- **Solution**: Check spam folder, request new verification

#### Subscription Issues
- **Cause**: Payment declined or billing problem
- **Solution**: Check Stripe Customer Portal, update payment method

#### Download Problems
- **Cause**: Browser restrictions or network issues
- **Solution**: Try different browser, check ad blockers

### Best Practices

#### For Efficiency
1. **Pre-add students**: Set up student profiles before generating
2. **Use specific topics**: More targeted content generation
3. **Edit before downloading**: Customize to exact needs
4. **Download both versions**: Always get Student and Teacher files
5. **Organize systematically**: Use timestamped filenames

#### For Cost Effectiveness
- **Choose appropriate plan**: Based on actual monthly usage
- **Utilize rollover**: Unused monthly worksheets never expire
- **Plan ahead**: Upgrade before running out of resources

### Error Recovery
- **Generation failures**: Form data preserved, retry without token loss
- **Payment issues**: Contact support with Stripe transaction ID
- **Account problems**: Use password reset or contact support

## Advanced Features

### Dashboard Integration
- **Student overview**: Quick access to all students
- **Recent worksheets**: Latest generations displayed
- **Direct generation**: Create worksheets from student cards
- **Usage tracking**: Monitor token and worksheet consumption

### Worksheet History
- **Per-student tracking**: All worksheets organized by student
- **Generation details**: Date, topic, and download access
- **Re-download capability**: Access previous worksheets anytime
- **Progress monitoring**: Track teaching materials over time

## Flashcards System

### Overview
The flashcards system uses **Spaced Repetition** with the **SM-2 algorithm** to optimize learning and memory retention. Students access flashcard sets via shared links and track their progress automatically.

### How Spaced Repetition Works (SM-2 Algorithm)

The SM-2 (SuperMemo 2) algorithm schedules card reviews based on how well you know them:

1. **New Cards**: Start with a 1-day interval
2. **Correct Answer**: Interval increases (1 day → 6 days → multiplied by easiness factor)
3. **Wrong Answer**: Card resets to 1-day interval
4. **Easiness Factor**: Adjusts based on review quality (2.5 default, range 1.3-2.5)

### Review Quality Impact

When reviewing a card, you choose from 2 options:
- **😰 Again** (Quality 0): Complete failure - resets to 1-day interval
- **✅ I Know This** (Quality 2): Correct answer - increases interval significantly

### Next Review Date (`flashcard_progress.next_review_date`)

This column stores when each card should appear again for review:
- **Calculation**: `current_date + interval_days`
- **Automatic filtering**: Only cards with `next_review_date <= today` appear in learning sessions
- **Dynamic adjustment**: Recalculated after every review based on your answer quality

### Bidirectional Cards

If **Bidirectional Cards** is enabled when creating a set:
- Each card creates **two learning directions**:
  - Direction 1: English → Native Language
  - Direction 2: Native Language → English
- Progress tracked separately for each direction
- Doubles the learning opportunities

### Translation vs Definition

When creating a flashcard set, choose the back side content type:
- **Translation to native language**: Back shows word translation (e.g., Spanish: "perro")
- **English definition**: Back shows English explanation (e.g., "a domesticated animal")

### Student Learning Experience

1. **Access**: Teacher shares link → Student enters email
2. **Session Start**: System loads cards due for review + new cards
3. **Study**: Card flips on click, student rates difficulty
4. **Progress Saved**: Automatically tracked by email
5. **Completion**: Summary shows stats and allows restart
6. **Return**: Next session shows only due cards based on SM-2 schedule

### Teacher Features

- **Create Sets**: From scratch or import from worksheet vocabulary
- **Manage Cards**: Add, edit, delete, reorder flashcards
- **Share Links**: Generate links valid for 1 year
- **Language Settings**: Set student's native language
- **Bidirectional**: Enable/disable two-way learning

*This guide reflects the current application state after ETAP 2 implementation - MVP Accounts and Subscriptions.*
