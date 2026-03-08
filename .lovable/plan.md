

# Plan: Update FAQ Content & Add New FAQ Items

## Summary

Update existing FAQ answers to reflect current app features (Student Hub, Welcome Test, GCal, AI Evaluation, etc.) and add new FAQ items for features that exist but have no FAQ entry.

## Changes — Single file: `src/constants/faqItems.ts`

### Update existing FAQ items:

1. **"How do Flashcards work?"** — Add that students can also access and study flashcards through the Student Hub portal (`/my`).

2. **"How does Homework Assignments work?"** — Add that students can view and complete homework through the Student Hub portal. Mention AI evaluation of open-ended answers.

3. **"What is Live Session mode?"** — Add that teacher sees real-time nano-skill mastery ratings and AI evaluation assists with scoring open-ended exercises.

4. **"How does student management work?"** — Add Welcome Test & Learning Path (49-question AI assessment, automatic profiling, 4 learning paths). Mention Student Knowledge tracking feeds AI for personalized worksheets.

5. **"What is Share Interactive Worksheet?"** — Mention students can access shared worksheets through the Student Hub portal.

### Add new FAQ items:

6. **"What is the Student Hub?"** — Student portal at `/my` where students enter their email, select teacher, and access: dashboard with stats, shared worksheets, flashcards with spaced repetition, homework assignments, lesson booking & calendar, Google Calendar sync, settings.

7. **"What is the Welcome Test & Learning Path?"** — AI-powered 49-question assessment covering grammar, vocabulary, reading, and listening. AI analyzes results to create a student profile with strengths/weaknesses. Determines one of 4 learning paths (comfort/guided/accelerated/target). Teacher can review and use for personalized worksheet generation.

8. **"How does Lesson Booking work?"** — Teachers get a public booking page link to share with students. Students can book available slots, book weekly recurring lessons, reschedule (if allowed), and cancel. Integrated with Google Calendar for automatic sync. Teachers set availability rules, buffer times, and booking limits in Calendar Settings.

9. **"How does Student Progress tracking work?"** — Skills are tracked at nano-skill level with CEFR tags. Mastery metrics auto-refresh from worksheet completions, homework, flashcards, and teacher evaluations. Teachers see trends (improving/stable/declining), filter by time period and CEFR level. Categories: grammar, vocabulary, speaking, listening, reading, writing.

10. **"How does AI Evaluation work?"** — AI automatically evaluates open-ended student answers (sentence transformation, paraphrasing, discussion, etc.) and pre-fills mastery scores. Teachers can review and adjust AI scores. Works in worksheet review, homework submissions, and live sessions.

11. **"What is Google Calendar integration?"** — Teachers can connect Google Calendar to sync lesson bookings automatically. Students can also connect via Student Hub. Supports Google Meet link auto-generation for online lessons. Configure calendar colors, sync preferences in Calendar Settings.

### Documentation updates:
- `docs/USER_GUIDE_SHORT.md`
- `docs/USER_GUIDE_DETAILED.md`
- `docs/BUSINESS_ANALYSIS.md`
- `docs/CURRENT_STATE_ANALYSIS.md`
- `docs/TECHNICAL_DOCUMENTATION.md`
- `README.md`

