

# Plan: 4 naprawy — notyfikacje, lekcje, maile, meeting link

## Problem 1: Student rozpoznany jako nowy mimo że istnieje w bazie

**Root cause:** RLS policy na tabeli `students` to: `auth.uid() = teacher_id`. Gdy niezalogowany student (z publicznej strony /book lub /my) wykonuje zapytanie do `students`, `auth.uid()` jest NULL → RLS blokuje SELECT → `existingStudent` zwraca `null` → system traktuje go jako nowego.

To jest bezpośrednia konsekwencja fix security z 18 marca: zamiana otwartej polityki (`USING: true`) na `auth.uid() = teacher_id`.

**Rozwiązanie:** Przenieść lookup studenta z klienta (`usePublicBooking.tsx`) do Edge Function `get-student-bookings` (która używa `SERVICE_ROLE_KEY` i omija RLS). Alternatywnie — dodać dedykowaną RLS policy SELECT-only z `anon` role, ale to osłabia security fix.

Najlepsze rozwiązanie: w `usePublicBooking.tsx` w `bookSlot`, zamiast bezpośredniego query do `students`, wywołać Edge Function. ALE — to duży refactor.

**Prostsze rozwiązanie:** Dodać SQL SECURITY DEFINER function `find_student_by_email(p_teacher_id UUID, p_email TEXT)` która zwraca `id, name` — omija RLS bo jest SECURITY DEFINER. Frontend wywołuje ją przez `.rpc()`.

```sql
CREATE OR REPLACE FUNCTION public.find_student_by_email(p_teacher_id UUID, p_email TEXT)
RETURNS TABLE(id UUID, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name
  FROM public.students s
  WHERE s.teacher_id = p_teacher_id
    AND lower(s.student_email) = lower(trim(p_email))
    AND s.deleted_at IS NULL
  LIMIT 1;
END;
$$;
```

**Zmiana w `usePublicBooking.tsx`** (linie 103-108):
```typescript
// BEFORE: direct query blocked by RLS
const { data: existingStudent } = await supabase
  .from('students').select('id, name')...

// AFTER: RPC call (SECURITY DEFINER, bypasses RLS)
const { data: existingStudentRows } = await supabase
  .rpc('find_student_by_email', { 
    p_teacher_id: settings.teacher_id, 
    p_email: normalizedEmail 
  });
const existingStudent = existingStudentRows?.[0] || null;
```

Reszta logiki (resolvedName, studentId, notification type) zostaje bez zmian — po prostu teraz `existingStudent` będzie poprawnie zwracać dane studenta.

---

## Problem 2: Your Lessons nie pokazuje kart + Today nie scrolluje

**Dwa podproblemy:**

**2A: Karty lekcji nie pojawiają się**
`StudentBookingsSection` pobiera bookings przez `get-student-bookings` Edge Function. Ta edge function **działa z SERVICE_ROLE** więc RLS jej nie blokuje. Problem musi być w filtrach.

Sprawdźmy: edge function (linia 520) filtruje `student_notes ILIKE '%{email}%'` — bo `student_id` może być null (student nie znaleziony). Ale po fix RLS, `student_id` jest null bo booking z `usePublicBooking` nie mógł znaleźć studenta. Więc `student_id` w slocie jest null.

Edge function (linia 518-530) szuka slotów po `student_id` LUB po `student_notes ILIKE`. Jeśli `student_id` jest null w slocie (bo RLS zablokował lookup), to szuka po `student_notes`. Student notes zawiera email, więc powinno znaleźć.

Muszę zobaczyć dokładny query...

Sprawdzę edge function:

Linia 518-530 `get-student-bookings`:
```
.select('id, slot_date, start_time, end_time, status, confirmed_at, student_notes, worksheet_id, notes, meeting_link...')
.eq('teacher_id', teacherId)
.in('status', ['booked', 'completed', 'needs_review', 'no_show'])
```
Ale jak filtruje po studencie? Muszę to sprawdzić.

Potrzebuję zobaczyć pełen query.

**2B: Today nie scrolluje na najbliższe wydarzenie**
`scrollToToday` szuka elementu z `data-date="{dzisiaj}"`. Jeśli dziś nie ma lekcji — nic nie znajduje. Naprawa: jeśli nie ma elementu na dziś, scrollować do najbliższego przyszłego (lub ostatniego przeszłego).

**Zmiana w `StudentBookingsSection.tsx` (linia 225-230):**
```typescript
const scrollToToday = () => {
  if (!listRef.current) return;
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  // Try exact today first
  let targetEl = listRef.current.querySelector(`[data-date="${todayStr}"]`);
  if (!targetEl) {
    // Find closest future booking
    const allDateEls = Array.from(listRef.current.querySelectorAll('[data-date]'));
    targetEl = allDateEls.find(el => (el.getAttribute('data-date') || '') >= todayStr) 
      || allDateEls[allDateEls.length - 1]; // fallback to last
  }
  if (targetEl) targetEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
};
```

Ponadto — wywołać `scrollToToday` automatycznie po załadowaniu bookingów (useEffect po `allBookings`).

---

## Problem 3: Maile — zły subject i złe imię studenta

**3A: Subject "Booking request received" → powinno być "Booking request sent"**
W `send-calendar-notification-email` linia 93: `subject = 'Booking request received';`
Zmienić na: `subject = 'Booking request sent';`

**3B: "Hi j4n.brz0+10" → powinno być "Hi [imię studenta]"**
Problem: `usePublicBooking.tsx` linia 197 wysyła `studentName: resolvedName`. Ale `resolvedName` to `existingStudent?.name || studentName`, a `studentName` to `email.split('@')[0]` (linia 51). Skoro `existingStudent` jest null (Problem 1), `resolvedName` = `j4n.brz0+10`.

**Fix Problem 1 automatycznie naprawi 3B** — bo po naprawie `existingStudent` będzie prawidłowo rozpoznany i `resolvedName` będzie prawdziwym imieniem.

**3C: "Hi Student" w booking_confirmation**
To samo — `studentName` jest wysyłane jako "Student" gdy student jest rozpoznany ale imię nie zostało poprawnie przekazane. Po fix Problem 1, `resolvedName` będzie prawidłowe.

Ale jest drugie źródło: gdy nauczyciel ręcznie potwierdza booking, email wysyłany jest z `get-student-bookings` edge function. Sprawdźmy jak tam jest ustawiane `studentName` — linia 51: `const studentName = student?.name || email;`. To jest poprawne (bo edge function używa service_role).

---

## Problem 4: Meeting link — brak "Join Lesson" na stronie /my i w emailach

**4A: Brak "Join Lesson" na stronie StudentHub (/my/{token}/lessons)**

Na stronie `StudentHubLessons.tsx` nie ma żadnego globalnego przycisku "Join Lesson". Komponent `StudentBookingsSection` ma przycisk "Join Meeting" per-booking (linia 312-314), ale tylko gdy `booking.meeting_link` jest ustawiony na danym slocie.

Problem: nauczyciel ma `auto_create_meet_link` w `calendar_settings` ale to generuje link dopiero przy GCal sync (w `gcal-sync` edge function). Jeśli GCal sync nie został wykonany, `meeting_link` na slocie jest null.

Dodatkowo: na dashboardzie `StudentHubDashboard` przycisk "Join" wyświetla się tylko gdy `nextLesson.meeting_link` istnieje (linia 91). Edge function `get-student-hub-data` pobiera `meeting_link` z `calendar_slots`. Jeśli slot nie ma meeting_link — brak przycisku.

**Rozwiązanie:**
1. Na stronie `/my/{token}/lessons` (StudentHubLessons) dodać sekcję "Your Classroom" z uniwersalnym linkiem do pokoju nauczyciela, pobranym z `calendar_settings.default_meeting_link`
2. Gdy `calendar_settings` nie ma `default_meeting_link` ale ma `auto_create_meet_link` = true, i slot ma `meeting_link` → używać meeting_link ze slotu
3. W edge function `get-student-hub-data` — zwracać `defaultMeetingLink` z `calendar_settings`
4. W emailach (`usePublicBooking.tsx`) — pobierać `default_meeting_link` z `calendar_settings` i dołączać do emaila jako `meetingLink`

Sprawdźmy co jest w calendar_settings:

Kolumna `default_meeting_link` NIE istnieje w `calendar_settings`. Jest w `calendar_student_settings` (per-student setting). Ale to jest link ustawiony per-student przez nauczyciela, nie globalny.

Ale widzę kolumnę `auto_create_meet_link` w `calendar_settings`. GCal sync (`gcal-sync` edge function) tworzy Meet link per-event.

**Wniosek:** Brakuje kolumny `default_meeting_link` w `calendar_settings` (globalny link pokoju nauczyciela). Trzeba ją dodać.

**Plan implementacji:**
1. Dodać kolumnę `default_meeting_link TEXT` do `calendar_settings`
2. Dodać UI w `CalendarSettingsPage.tsx` — pole input "Default Meeting Room Link" w sekcji Google Meet
3. W `get-student-hub-data` — zwracać `defaultMeetingLink` z `calendar_settings`
4. W `StudentHubLessons.tsx` i `StudentHubDashboard.tsx` — wyświetlać przycisk "Join Your Classroom" gdy jest `defaultMeetingLink`
5. W `usePublicBooking.tsx` bookSlot — pobierać `default_meeting_link` z settings i dołączać do emaila
6. W `send-calendar-notification-email` — meetingButton jest już obsługiwany (linia 62-64), wystarczy że `meetingLink` zostanie przekazane

---

## Podsumowanie zmian

| Plik | Zmiana |
|------|--------|
| Migracja SQL | Nowa fn `find_student_by_email()` + kolumna `default_meeting_link` w `calendar_settings` |
| `src/hooks/usePublicBooking.tsx` | Zamiana `.from('students')` na `.rpc('find_student_by_email')` + dodanie `meetingLink` do emaili |
| `supabase/functions/send-calendar-notification-email/index.ts` | Subject "Booking request sent" zamiast "received" |
| `supabase/functions/get-student-hub-data/index.ts` | Zwracać `defaultMeetingLink` z `calendar_settings` |
| `src/pages/StudentHubLessons.tsx` | Sekcja "Your Classroom" z uniwersalnym Join Lesson |
| `src/pages/StudentHubDashboard.tsx` | Fallback na `defaultMeetingLink` gdy slot nie ma meeting_link |
| `src/components/calendar/StudentBookingsSection.tsx` | Fix scrollToToday — najbliższe przyszłe, auto-scroll po load |
| `src/pages/CalendarSettingsPage.tsx` | Input "Default Meeting Room Link" w sekcji Meet |
| Deploy Edge Functions | `send-calendar-notification-email`, `get-student-hub-data` |

## Pliki które muszę jeszcze zbadać przed implementacją

Muszę sprawdzić `get-student-bookings` linie ~510-540 żeby potwierdzić jak filtruje po studencie (czy Problem 2A to RLS czy inny bug). To zrobię w kroku implementacji.

## Co NIE zmienia się

- SM-2, flashcards, homework — bez zmian
- Routing — bez zmian  
- Inne Edge Functions — bez zmian
- RLS na `students` — zostaje `auth.uid() = teacher_id` (security fix zachowany)
- `calendar_student_settings.default_meeting_link` — to per-student, zostaje bez zmian, nowa kolumna jest w `calendar_settings` (globalna)

