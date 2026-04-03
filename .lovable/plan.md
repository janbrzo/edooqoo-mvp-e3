

# Plan: 7 napraw — Calendar badge, Meeting links, Book redirect, Lessons UX

## STATUS: ✅ ZAIMPLEMENTOWANE (2026-04-03)

### Zmiany wykonane:

1. **Calendar Badge** — `GCalStatusButton` wyświetla czerwony badge z `unreadCount`
2. **Per-student meeting links** — usunięto globalny link, priorytet: per-student > slot > global fallback
3. **StudentPage description** — uniwersalny tekst o meeting link
4. **Dashboard CTA** — "Book Your First Lesson" + przycisk "Book"
5. **Tab rename** — "Lessons & Booking"
6. **/book redirect** — BookLandingPage → `/my/{token}/lessons`, PublicBookingPage → thin wrapper
7. **Lessons UX** — desc sort, Today offset, Show Cancelled toggle, Available/Pending legenda

### Pliki zmienione:
- `src/components/calendar/GCalStatusButton.tsx`
- `src/pages/CalendarSettingsPage.tsx`
- `src/pages/StudentPage.tsx`
- `src/pages/StudentHubDashboard.tsx`
- `src/pages/StudentHubLessons.tsx`
- `src/pages/BookLandingPage.tsx`
- `src/pages/PublicBookingPage.tsx`
- `src/components/student-hub/StudentHubLayout.tsx`
- `src/components/calendar/StudentBookingsSection.tsx`
- `src/hooks/usePublicBooking.tsx`
- `supabase/functions/get-student-hub-data/index.ts`
- SQL migration: `get_student_meeting_link()` function
