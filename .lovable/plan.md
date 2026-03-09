
# Plan: Student Hub — WDROŻONY ✅

## Podsumowanie

Panel studenta `/my` zaimplementowany. Student wchodzi na `/my`, podaje email, wybiera nauczyciela i widzi dashboard z:
- Quick stats (flashcards, homework, lessons)
- Next lesson z meeting link
- Ostatnie flashcard sety z Browse/Study
- Ostatnie homework z postępem
- Ostatnie shared worksheets

Podstrony: `/my/:token/flashcards`, `/homework`, `/worksheets`, `/lessons`

## Pliki

- `supabase/functions/get-student-hub-data/index.ts` — centralna edge function
- `src/hooks/useStudentHubData.tsx` — hook + localStorage helpers
- `src/components/student-hub/StudentHubLayout.tsx` — shared layout z nav
- `src/components/student-hub/StudentHubStats.tsx` — quick stats cards
- `src/pages/StudentHubLanding.tsx` — email input landing
- `src/pages/StudentHubDashboard.tsx` — dashboard overview
- `src/pages/StudentHubFlashcards.tsx` — full flashcard list
- `src/pages/StudentHubHomework.tsx` — homework z filtrami
- `src/pages/StudentHubWorksheets.tsx` — shared worksheets list
- `src/pages/StudentHubLessons.tsx` — reuse StudentBookingsSection
