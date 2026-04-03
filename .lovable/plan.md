

# Plan: 7 napraw — Calendar badge, Meeting links, Book redirect, Lessons UX

## Problem 1: Badge z liczbą powiadomień na przycisku 🗓️ Calendar

**Obecny stan:** `GCalStatusButton` to prosty przycisk bez żadnych danych o notyfikacjach. Badge z `unreadCount` jest tylko na dzwoneczku `CalendarNotificationBell` na stronie `/calendar`.

**Rozwiązanie:** `GCalStatusButton` musi pobierać `unreadCount` z hooka `useCalendarNotifications`. Hook wymaga `teacherId` — pobierzemy go z `useAuthFlow().user?.id`.

**Zmiana w `src/components/calendar/GCalStatusButton.tsx`:**
- Import `useCalendarNotifications`
- Import `Badge` z UI
- Pobrać `user` z `useAuthFlow()` (już jest)
- Wywołać `useCalendarNotifications(user?.id)` — dostajemy `unreadCount`
- Dodać czerwony badge z liczbą obok tekstu "Calendar" (identyczny jak na dzwoneczku: `absolute -top-1.5 -right-1.5 ...`)
- Przycisk musi mieć `relative` w className

```tsx
export function GCalStatusButton() {
  const { isRegisteredUser, user } = useAuthFlow();
  const { unreadCount } = useCalendarNotifications(user?.id);
  // ... w renderze:
  <Button variant="outline" size="sm" className="text-xs h-8 relative" onClick={...}>
    🗓️ Calendar
    {unreadCount > 0 && (
      <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground">
        {unreadCount}
      </Badge>
    )}
  </Button>
```

**Pliki:** `src/components/calendar/GCalStatusButton.tsx`

---

## Problem 2: Meeting link per-student (nie globalny)

**Obecny stan:** `calendar_settings.default_meeting_link` to jeden globalny link dla WSZYSTKICH studentów. User chce żeby KAŻDY student miał swój unikatowy link.

**Istniejąca infrastruktura:** Tabela `calendar_student_settings` JUŻ MA kolumnę `default_meeting_link` per-student. Na `StudentPage.tsx` jest `MeetingLinkField` który zapisuje do tej tabeli. Problem: ten per-student link nigdzie nie jest używany po stronie studenta.

**Rozwiązanie:**
1. **Usunąć globalny `default_meeting_link` z `CalendarSettingsPage.tsx`** — zamiast globalnego pola, wyświetlić info: "Meeting links are set per-student in each student's profile."
2. **Edge function `get-student-hub-data`** — zmienić żeby zamiast `settingsData.default_meeting_link` pobierał `calendar_student_settings.default_meeting_link` dla danego studenta
3. **Edge function `get-student-bookings`** — zwracać `meeting_link` ze slotu LUB fallback na per-student link z `calendar_student_settings`
4. **`StudentHubLessons.tsx`** — "Your Classroom" card: używać per-student link (zwrócony z edge function jako `defaultMeetingLink`)
5. **`StudentHubDashboard.tsx`** — przycisk Join: fallback na `defaultMeetingLink` (per-student)
6. **Booking cards w `StudentBookingsSection`** — dodać fallback meeting_link z per-student settings
7. **Emaile** — w `usePublicBooking.tsx`, pobierać per-student link przy bookSlot (RPC lub z calendar_student_settings)

**Zmiany w `CalendarSettingsPage.tsx` (sekcja Google Meet):**
- Usunąć pole "Default Meeting Room Link"
- Zmienić opis: "Set a unique meeting room link for each student in their profile page. Students will see a 'Join Lesson' button in their Hub."
- Zachować `auto_create_meet_link` toggle

**Zmiany w `get-student-hub-data/index.ts`:**
```typescript
// Po znalezieniu studentId:
const { data: studentSettings } = await supabaseAdmin
  .from('calendar_student_settings')
  .select('default_meeting_link')
  .eq('student_id', studentId)
  .eq('teacher_id', teacherId)
  .maybeSingle();

// W response:
defaultMeetingLink: studentSettings?.default_meeting_link || settingsData?.default_meeting_link || null,
```
(Zachowujemy fallback na globalny link dla kompatybilności)

**Zmiany w `usePublicBooking.tsx`** — przy `bookSlot`, po znalezieniu studenta (`find_student_by_email`), pobierać per-student meeting link i dołączać do emaila:
```typescript
// Po RPC find_student_by_email:
if (existingStudent) {
  const { data: studentSettings } = await supabase.functions.invoke('get-student-meeting-link', {
    body: { teacherId: settings.teacher_id, studentId: existingStudent.id }
  });
  // ... meetingLink = studentSettings?.meeting_link || settings.default_meeting_link;
}
```
Ale to wymaga nowej edge function. Prostsze rozwiązanie: dodać SQL SECURITY DEFINER function `get_student_meeting_link(p_teacher_id UUID, p_student_id UUID)` analogicznie do `find_student_by_email`:
```sql
CREATE OR REPLACE FUNCTION public.get_student_meeting_link(p_teacher_id UUID, p_student_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_link TEXT;
BEGIN
  SELECT default_meeting_link INTO v_link
  FROM calendar_student_settings
  WHERE teacher_id = p_teacher_id AND student_id = p_student_id;
  RETURN v_link;
END;
$$;
```

**Pliki:**
- Migracja SQL — `get_student_meeting_link()` function
- `src/pages/CalendarSettingsPage.tsx` — zmiana sekcji Google Meet
- `supabase/functions/get-student-hub-data/index.ts` — per-student meeting link
- `src/hooks/usePublicBooking.tsx` — pobieranie meeting link per-student
- `supabase/functions/get-student-bookings/index.ts` — fallback meeting_link z student settings

---

## Problem 3.1: Info o Meeting Link gdy nauczyciel nie ma GCal

**Obecny stan:** `MeetingLinkField` w `StudentPage.tsx` linia 93 zawsze mówi: "This link will be auto-filled for new lessons with this student."

**Rozwiązanie:** Zmienić tekst na: "Paste your meeting room link (e.g., Google Meet, Zoom). Students will see a 'Join Lesson' button." — uniwersalny, nie zakładający Google Meet.

**Plik:** `src/pages/StudentPage.tsx` linia 93

---

## Problem 3.2: Brak "Join Lesson" na stronie studenta

**Root cause:** `get-student-hub-data` zwraca `defaultMeetingLink` z `calendar_settings.default_meeting_link`, ale per-student link z `calendar_student_settings` nie jest sprawdzany. Fix w Problem 2 to rozwiązuje.

**Dodatkowo:** email z potwierdzeniem nie zawiera meeting link — fix w `usePublicBooking.tsx` (Problem 2) dołączy per-student link do emaila.

---

## Problem 4: "Book" przycisk na Dashboard

**Obecny stan:** Gdy `nextLesson` jest null, wyświetla się "None scheduled" bez żadnego CTA.

**Zmiana w `StudentHubDashboard.tsx`:**

A) Gdy brak `nextLesson`:
```tsx
{!nextLesson && (
  <section>
    <h2 className="text-lg font-semibold flex items-center gap-2 mb-3"><Calendar className="h-4 w-4" /> Next Lesson</h2>
    <Card>
      <CardContent className="p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">None scheduled</p>
        <Button onClick={() => navigate(`/my/${teacherToken}/lessons`)}>
          Book Your First Lesson
        </Button>
      </CardContent>
    </Card>
  </section>
)}
```

B) Gdy jest `nextLesson` — dodać przycisk "Book" obok "View all":
```tsx
<div className="flex items-center gap-2">
  <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate(`/my/${teacherToken}/lessons`)}>
    Book <ArrowRight className="h-3 w-3 ml-1" />
  </Button>
</div>
```

C) Zmiana nazwy zakładki "Lessons" → "Lessons & Booking" w `StudentHubLayout.tsx`:
```tsx
{ key: 'lessons', label: 'Lessons & Booking', icon: Calendar },
```

**Pliki:** `src/pages/StudentHubDashboard.tsx`, `src/components/student-hub/StudentHubLayout.tsx`

---

## Problem 5: /book przekierowanie do /my jeśli student ma nauczyciela

**Obecny stan:** `BookLandingPage` wpisuje email, szuka nauczycieli, i kieruje na `/book/:token`.

**Rozwiązanie:** W `BookLandingPage`, po znalezieniu nauczycieli:
- Jeśli 1 nauczyciel → sprawdzić czy student ma zapisany `teacherToken` w hub localStorage → redirect na `/my/{teacherToken}/lessons`
- Jeśli więcej nauczycieli → pokazać listę, a po kliknięciu redirect na `/my/{teacherToken}/lessons`

Ale skąd wiemy `teacherToken`? Edge function `find-teachers-by-student-email` zwraca `token` (= `public_calendar_token`). To jest ten sam `teacherToken` co w `/my/:teacherToken`.

**Zmiana w `BookLandingPage.tsx`:**
```tsx
const handleSelectTeacher = (token: string) => {
  // Save hub email too for seamless hub experience
  saveHubEmail(email);  // from useStudentHubData
  navigate(`/my/${token}/lessons`);
};
```

I w `useEffect` po auto-znalezieniu 1 nauczyciela:
```tsx
useEffect(() => {
  if (teachers.length === 1 && !loading) {
    saveHubEmail(email);
    navigate(`/my/${teachers[0].token}/lessons`);
  }
}, [teachers, loading]);
```

Trzeba zaimportować `saveHubEmail` z `@/hooks/useStudentHubData`.

**Plik:** `src/pages/BookLandingPage.tsx`

---

## Problem 6: Unifikacja /book/:token i /my/:teacherToken/lessons

**Obecny stan:** Dwa osobne komponenty:
- `PublicBookingPage` (522 linii) — pełna strona z grid, email input, legendą statusów
- `StudentHubLessons` (213 linii) — prostsza wersja w hubie, BEZ legendy

User chce: **jeden kod**, preferuje wersję z huba (`StudentHubLessons`), ale z legendą.

**Rozwiązanie:** 
1. W `PublicBookingPage.tsx` — zamienić na wrapper który renderuje `StudentHubLessons` (lub redirect)
2. Ale `PublicBookingPage` wymaga email input (student się identyfikuje), a `StudentHubLessons` ma email z huba.

**Lepsze podejście:** Skoro Problem 5 kieruje z `/book` → `/my/{token}/lessons`, a `/book/:token` jest bezpośredni link, to:
- `/book/:token` → sprawdzić czy student ma email w localStorage → jeśli tak, redirect na `/my/{token}/lessons`
- Jeśli nie ma emaila → pokazać email input → po wpisaniu redirect na `/my/{token}/lessons`

To oznacza że `PublicBookingPage` staje się thin wrapper:
```tsx
const PublicBookingPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const hubEmail = getSavedHubEmail();
  const bookEmail = getSavedValue(EMAIL_STORAGE_KEY);
  
  useEffect(() => {
    const email = hubEmail || bookEmail;
    if (email && token) {
      saveHubEmail(email);
      navigate(`/my/${token}/lessons`, { replace: true });
    }
  }, []);
  
  // Jeśli brak emaila — pokaż email form
  // Po submit → saveHubEmail → navigate
};
```

Dodać legendę do `StudentHubLessons.tsx`:
```tsx
<div className="flex gap-3 text-xs text-muted-foreground">
  <div className="flex items-center gap-1">
    <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
    <span>Available</span>
  </div>
  <div className="flex items-center gap-1">
    <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
    <span>Pending</span>
  </div>
</div>
```

**Pliki:** `src/pages/PublicBookingPage.tsx` (uproszczenie do redirect), `src/pages/StudentHubLessons.tsx` (legenda)

---

## Problem 7: Your Lessons — kolejność i Show Cancelled toggle

**7A: Odwrotna kolejność (najnowsze na górze)**

W `StudentBookingsSection.tsx` linia 219:
```tsx
result.sort((a, b) => `${b.slot_date}${b.start_time}`.localeCompare(`${a.slot_date}${a.start_time}`));
```
(Zamiana `a` i `b` — descending zamiast ascending)

Przycisk "Today" ma scrollować na 3. kartę od góry. Po odwróceniu, karty od góry to najnowsze/przyszłe → "Today" powinien scrollować do dzisiejszej lub najbliższej przyszłej. Offset o 2 pozycje w górę:
```tsx
const scrollToToday = useCallback(() => {
  if (!listRef.current) return;
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const allDateEls = Array.from(listRef.current.querySelectorAll('[data-date]'));
  // W porządku desc, szukamy ostatniego elementu >= today (bo desc)
  let targetEl = allDateEls.find(el => (el.getAttribute('data-date') || '') <= todayStr) || allDateEls[0];
  // Offset — cofnij się 2 pozycje w górę
  if (targetEl) {
    const idx = allDateEls.indexOf(targetEl);
    const offsetIdx = Math.max(0, idx - 2);
    targetEl = allDateEls[offsetIdx];
  }
  if (targetEl) targetEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
}, []);
```

**7B: Show Cancelled jako Switch/toggle**

Linia 459-465, zamienić `Button` na `Switch` + `Label` (identycznie jak `showPast`):
```tsx
<div className="flex items-center gap-1.5">
  <Switch checked={showCancelled} onCheckedChange={setShowCancelled} id="show-cancelled" />
  <Label htmlFor="show-cancelled" className="text-xs cursor-pointer">Show cancelled</Label>
</div>
```

Domyślnie `showCancelled` jest już `false` (linia 85) — OK.

**Plik:** `src/components/calendar/StudentBookingsSection.tsx`

---

## Podsumowanie zmian

| Plik | Zmiana |
|------|--------|
| `src/components/calendar/GCalStatusButton.tsx` | Badge z unreadCount z `useCalendarNotifications` |
| Migracja SQL | `get_student_meeting_link()` SECURITY DEFINER function |
| `src/pages/CalendarSettingsPage.tsx` | Usunąć globalny meeting link, info o per-student |
| `supabase/functions/get-student-hub-data/index.ts` | Per-student meeting link z `calendar_student_settings` |
| `supabase/functions/get-student-bookings/index.ts` | Fallback meeting_link z student settings |
| `src/hooks/usePublicBooking.tsx` | Per-student meeting link w emailach |
| `src/pages/StudentPage.tsx` | Zmiana opisu MeetingLinkField |
| `src/pages/StudentHubDashboard.tsx` | "Book Your First Lesson" CTA + przycisk "Book" |
| `src/components/student-hub/StudentHubLayout.tsx` | Zakładka "Lessons & Booking" |
| `src/pages/BookLandingPage.tsx` | Redirect do `/my/{token}/lessons` |
| `src/pages/PublicBookingPage.tsx` | Uproszczenie do redirect + email form |
| `src/pages/StudentHubLessons.tsx` | Legenda Available/Pending |
| `src/components/calendar/StudentBookingsSection.tsx` | Desc sort, Today offset, Show Cancelled toggle |
| Deploy Edge Functions | `get-student-hub-data`, `get-student-bookings` |

## Co NIE zmienia się
- Tabele DB (poza nowa function) — `calendar_student_settings.default_meeting_link` już istnieje
- SM-2, flashcards, homework — bez zmian
- Routing w `App.tsx` — bez zmian (oba routes `/book` i `/book/:token` zostają, po prostu robią redirect)
- RLS — bez zmian

