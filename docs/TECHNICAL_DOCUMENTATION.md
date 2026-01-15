
# English Worksheet Generator - Technical Documentation

## System Overview - ETAP 2+

The English Worksheet Generator is a full-featured SaaS platform built on React, TypeScript, and Supabase. After completing ETAP 2 and adding advanced exercise management, the application provides comprehensive account management, student organization, subscription-based worksheet generation, and advanced exercise manipulation capabilities for English teachers.

**Latest Update (January 2026) - 5 New UX Fixes:**
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
