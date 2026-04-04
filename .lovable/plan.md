# Plan: 9 napraw — Info dla nauczycieli, Meeting links, Onboarding, Recurring, Reject comment, Scroll, GCal OAuth, Discount

## Problem 1: Info dla nauczycieli o linku /my i /book + ładniejszy URL

### 1A: Info na stronie /calendar/settings

W sekcji "Public Calendar" (linia 256-275 `CalendarSettingsPage.tsx`), po polu z publicznym linkiem `/book/{token}`, dodać:

```
💡 Share the booking link above with students, or direct them to edooqoo.com/my — they can enter their email to access their Student Hub (lessons, flashcards, homework).
```

### 1B: Ładniejszy URL — slug zamiast tokena

Dodać kolumnę `public_calendar_slug TEXT UNIQUE` do `calendar_settings`. Nauczyciel wpisuje np. `john-smith` → URL to `/book/john-smith`.

**Logika:**

- Slug jest opcjonalny — token nadal działa
- Unikalne w DB (`UNIQUE` constraint)
- Walidacja: lowercase, alfanumeryczne + myślnik, 3-50 znaków
- UI: pole input "Custom booking URL" pod głównym linkiem w sekcji Public Calendar
- Routing: w `usePublicBooking` fetchSettings szuka najpierw po `public_calendar_token`, potem po `public_calendar_slug`

**Zmiany:**

- Migracja SQL: `ALTER TABLE calendar_settings ADD COLUMN public_calendar_slug TEXT UNIQUE`
- `CalendarSettingsPage.tsx`: pole input slug + live preview URL + walidacja + info tekst
- `src/hooks/usePublicBooking.tsx`: w `fetchSettings` dodać `.or(...)` żeby szukać po slug LUB token
- Routing w `App.tsx` nie wymaga zmian — oba `/book/:token` i `/book/:slug` używają tego samego parametru

jeszcze gdzień może na stronie /dashboard i /student dodać info że istnieje student hub z worksheetami homeworkami bookings flashcards na stornie [https://edooqoo.com/my i nie ma potrzeby logowania się wystarczy że uczeń wpisze swojego maila](https://edooqoo.com/my)

## Problem 2: Meeting links — auto-generowanie per-student + wyświetlanie w mailach

### 2A: Auto-generowanie meeting linku per-student

Gdy nauczyciel włączy opcję `auto_create_meet_link` w settings, system powinien automatycznie generować unikatowy Google Meet link per-student.

**Problem:** Google Meet wymaga Google Calendar API do tworzenia linków — nie da się wygenerować linku "z powietrza". Jedyne podejście to:

1. Ustawić ręczny link (Zoom/Meet) per-student — **to już działa** w `calendar_student_settings.default_meeting_link`
2. Lub generować link przy pierwszym bookingu przez GCal API — **to robi `gcal-sync**`

**Prostsze rozwiązanie:** W `CalendarSettingsPage.tsx` sekcja Google Meet, dodać wyraźne info:

- "When Auto-create Meet links is ON, each new booked lesson automatically gets a unique Google Meet link via Google Calendar."
- "For a permanent meeting room per student, set a link in each student's profile → Default Meeting Link."
- Przycisk "Generate permanent Meet rooms for all students" — wywołuje edge function która dla każdego studenta bez meeting link tworzy Google Meet room (via GCal API: createEvent z conferenceData → weź meetLink → zapisz w `calendar_student_settings.default_meeting_link` → deleteEvent).

**ALE** — to jest skomplikowane i ryzykowne. Lepsze podejście:

Nauczyciel ręcznie tworzy jeden Google Meet link (np. `meet.google.com/abc-def-ghi`) i wkleja go w profilu każdego studenta. Lub: dodać przycisk "Copy to all students without a link" przy wklejaniu linku w profilu jednego studenta.

**Końcowe rozwiązanie:** Dodać w `CalendarSettingsPage.tsx` sekcję Google Meet:

- Input: "Default Meeting Link for new students" — ten link automatycznie uzupełni `calendar_student_settings.default_meeting_link` dla NOWEGO studenta gdy jest dodawany
- Kolumna w DB: `calendar_settings.default_meeting_link` — **JUŻ ISTNIEJE**
- Logika: gdy nauczyciel dodaje studenta (w `useStudents.addStudent`), jeśli `calendar_settings.default_meeting_link` jest ustawiony → automatycznie tworzyć wpis w `calendar_student_settings` z tym linkiem
- Przycisk: "Apply to all students without a link" — batch update

### 2B: Meeting link w mailach — BRAK w booking_pending

W `usePublicBooking.tsx` linia 208-215, email `booking_pending` nie zawiera `meetingLink` bo jest wysyłany z `meetingLink` w body. ALE w `send-calendar-notification-email` case `booking_pending` (linia 92-101) **nie renderuje** `meetingButton`. Trzeba dodać `${meetingButton}` do HTML.

### 2C: View Bookings link → /my zamiast /book

W `usePublicBooking.tsx` linia 181: `bookUrl = .../book/${token}`. Zmienić na `/my/${token}/lessons`.

Ale `bookUrl` jest też używany w emailach do nauczyciela (linia 222). Trzeba dwa osobne URL:

- `studentBookUrl` = `/my/${token}/lessons` (dla studenta)
- `calendarUrl` = `/calendar` (dla nauczyciela)

W `send-calendar-notification-email`, `bookUrl` jest używany w `studentButton` (linia 51-53). Zmienić na `/my/${token}/lessons`.

### 2D: Meeting link wyświetlanie w SlotDetailModal (sendCalendarEmail)

W `SlotDetailModal.tsx` linia 362-393, `sendCalendarEmail` **nie wysyła** `meetingLink` — trzeba pobrać per-student meeting link z `calendar_student_settings`:

```typescript
// W sendCalendarEmail, po pobraniu teacherProfile:
let meetingLink: string | undefined = (slot as any).meeting_link;
if (!meetingLink && slot.student_id) {
  const { data: studentSettings } = await supabase
    .from('calendar_student_settings')
    .select('default_meeting_link')
    .eq('student_id', slot.student_id)
    .eq('teacher_id', slot.teacher_id)
    .maybeSingle();
  meetingLink = studentSettings?.default_meeting_link || undefined;
}
```

## Problem 3: Info o Meeting Link na stronie StudentPage

W `MeetingLinkField` (linia 79-95 `StudentPage.tsx`), zmienić opis w zależności od tego czy nauczyciel ma GCal:

**Potrzebujemy** wiedzieć czy nauczyciel ma GCal. Dodać prop `hasGcal` do `MeetingLinkField`:

```tsx
function MeetingLinkField({ studentId, teacherId, hasGcal }: { studentId: string; teacherId: string; hasGcal: boolean }) {
  // ...
  return (
    <div>
      <label>Default Meeting Link</label>
      {/* input... */}
      <p className="text-xs text-muted-foreground mt-1">
        {link 
          ? "Your meeting room link. Students will see a 'Join Lesson' button. Paste a different link to override."
          : hasGcal
            ? "A Google Meet link can be set here. Students will see a 'Join Lesson' button."
            : "Connect Google Meet or paste your meeting room link (e.g., Google Meet, Zoom). Students will see a 'Join Lesson' button."
        }
      </p>
    </div>
  );
}
```

W `StudentPage.tsx` pobrać `gcal_integration_enabled` z `calendar_settings` i przekazać jako `hasGcal`.

## Problem 4: "Get started with Edooqoo 🚀" nie powinno się wyświetlać na stronie studenta

`OnboardingChecklist` jest renderowany globalnie w `App.tsx` (linia 125). Hook `useOnboardingProgress` sprawdza `shouldShow` — ale student hub nie wymaga logowania, więc `shouldShow` powinno zwracać `false` gdy user nie jest zalogowany.

Sprawdźmy `useOnboardingProgress`:

Muszę sprawdzić czy `shouldShow` zależy od auth. Jeśli nie — trzeba dodać warunek.

**Rozwiązanie:** W `OnboardingChecklist.tsx`, dodać sprawdzenie URL — jeśli path zaczyna się od `/my/` → nie renderować:

```tsx
const location = useLocation();
if (location.pathname.startsWith('/my/') || location.pathname.startsWith('/my')) return null;
```

## Problem 5: Recurring booking nie działa

**Root cause:** `getSlotsForDay(d)` w `handleBook` (linia 57) zwraca sloty z `usePublicBooking.slots`, które są **ograniczone do aktualnie wyświetlanego tygodnia** (`weekStart`–`weekEnd`). Przyszłe tygodnie nie mają załadowanych slotów → `match` jest zawsze `null` → żadne dodatkowe bookowania nie następują.

**Rozwiązanie:** W `handleBook` zamiast używać `getSlotsForDay(d)`, bezpośrednio query do bazy po slotach na konkretny dzień i godzinę:

```typescript
if (success && bookWeekly && untilDate) {
  let d = addWeeks(parseISO(selectedSlot.slot_date), 1);
  const end = parseISO(untilDate);
  let bookedCount = 1; // first one already booked
  let skippedCount = 0;
  
  while (!isBefore(end, d)) {
    const dateStr = format(d, 'yyyy-MM-dd');
    // Query directly from DB for this specific date
    const { data: daySlots } = await supabase
      .from('calendar_slots')
      .select('id, start_time, status, student_id')
      .eq('teacher_id', settings.teacher_id)
      .eq('slot_date', dateStr)
      .eq('status', 'available')
      .is('student_id', null);
    
    const match = (daySlots || []).find(s => s.start_time.slice(0, 5) === selectedSlot.start_time.slice(0, 5));
    if (match) {
      const ok = await bookSlot(match.id, name, email);
      if (ok) bookedCount++;
      else skippedCount++;
    } else {
      skippedCount++;
    }
    d = addWeeks(d, 1);
  }
  
  toast({ title: `Recurring booking: ${bookedCount} lessons booked`, description: skippedCount > 0 ? `${skippedCount} weeks had no available slot at this time` : undefined });
}
```

**Dodatkowo:** W dialogu bookowania, po wybraniu `untilDate`, pokazać ile lekcji zostanie zarezerwowanych (preview):

```tsx
const recurringCount = useMemo(() => {
  if (!bookWeekly || !untilDate || !selectedSlot) return 0;
  let d = addWeeks(parseISO(selectedSlot.slot_date), 1);
  const end = parseISO(untilDate);
  let count = 1;
  while (!isBefore(end, d)) { count++; d = addWeeks(d, 1); }
  return count;
}, [bookWeekly, untilDate, selectedSlot]);
```

I wyświetlić pod input date: `{recurringCount > 1 && <p className="text-xs text-muted-foreground">This will book up to {recurringCount} lessons (weekly)</p>}`

**Pliki:** `src/pages/StudentHubLessons.tsx`

## Problem 6: Komentarz do Reject

W `SlotDetailModal.tsx`, zamienić bezpośrednie wywołanie `handleReject` na dialog z textarea:

1. Dodać state: `const [rejectComment, setRejectComment] = useState('');` i `const [showRejectDialog, setShowRejectDialog] = useState(false);`
2. Przycisk Reject → `setShowRejectDialog(true)` zamiast `handleReject()`
3. Dialog:

```tsx
<Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader><DialogTitle>Reject Booking</DialogTitle></DialogHeader>
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Add an optional note for the student:</p>
      <AutoResizeTextarea value={rejectComment} onChange={e => setRejectComment(e.target.value)} placeholder="e.g., This time doesn't work, please try Thursday..." rows={2} />
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
      <Button variant="destructive" onClick={() => { setShowRejectDialog(false); handleReject(); }}>Reject</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

4. W `handleReject`, przekazać `rejectComment` do `sendCalendarEmail`:

```typescript
if (canSend) await sendCalendarEmail('booking_rejected', { rejectionReason: rejectComment });
```

5. W `send-calendar-notification-email` case `booking_rejected`, dodać `rejectionReason`:

```typescript
const { rejectionReason } = extraParams || {};
// W HTML:
${rejectionReason ? `<p><strong>Teacher's note:</strong> ${rejectionReason}</p>` : ''}
```

Ale `sendCalendarEmail` nie przyjmuje `rejectionReason` w body — trzeba dodać destructuring w edge function.

**Zmiana w `send-calendar-notification-email`:** Dodać `rejectionReason` do destructuring (linia 27). W case `booking_rejected`, dodać blok z komentarzem.

**Pliki:** `src/components/calendar/SlotDetailModal.tsx`, `supabase/functions/send-calendar-notification-email/index.ts`

## Problem 7: Today scroll działa błędnie (scrolluje na dół)

**Root cause:** Bookings posortowane desc (najnowsze na górze). `scrollToToday` szuka elementu z `data-date <= todayStr` — ale w desc order, elementy na górze mają PRZYSZŁE daty, a na dole PRZESZŁE. Więc `data-date <= todayStr` trafia na elementy z przeszłości = na dole.

**Naprawa:** W desc order, dzisiejsza lekcja lub najbliższa przyszła jest **blisko góry** (bo przyszłe > today > przeszłe). Szukamy:

- Pierwszego elementu z `data-date <= todayStr` (to jest dziś lub ostatni przeszły)
- **ALE** w desc, elementy idą: future future future TODAY past past past
- Więc szukamy ostatniego elementu z `data-date >= todayStr` (to jest dziś lub najbliższa przyszła)

```typescript
const scrollToToday = useCallback(() => {
  if (!listRef.current) return;
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const allDateEls = Array.from(listRef.current.querySelectorAll('[data-date]'));
  // In desc order: future dates first, past last
  // Find last element with date >= today (= today or nearest future)
  let targetIdx = -1;
  for (let i = 0; i < allDateEls.length; i++) {
    const d = allDateEls[i].getAttribute('data-date') || '';
    if (d >= todayStr) targetIdx = i;
    else break; // past dates start here
  }
  if (targetIdx === -1) targetIdx = 0; // all past, go to top
  // Offset 2 up for context
  const offsetIdx = Math.max(0, targetIdx - 2);
  const targetEl = allDateEls[offsetIdx];
  if (targetEl) targetEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
}, []);
```

**Plik:** `src/components/calendar/StudentBookingsSection.tsx`

## Problem 8: Connect Google Calendar na /my/{token}/settings — redirect_uri_mismatch

**Root cause:** `student-gcal-auth-start` edge function (linia 29) buduje `redirectUri = ${origin}/gcal-student-callback`. Na preview to jest `https://preview--edooqoo-mvp-e3.lovable.app/gcal-student-callback`. Na production: `https://edooqoo.com/gcal-student-callback`.

Błąd mówi: `redirect_uri: https://edooqoo.com/gcal-student-callback` nie jest zarejestrowane w Google Cloud Console.

**Rozwiązanie:** Trzeba dodać `https://edooqoo.com/gcal-student-callback` do Authorized redirect URIs w Google Cloud Console (OAuth 2.0 Client ID).

**To nie jest zmiana w kodzie — to konfiguracja w Google Cloud Console.**

Instrukcja dla ciebie:

1. Idź do [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. Kliknij OAuth 2.0 Client ID (ten z `client_id: 37984924905-...`)
3. W "Authorized redirect URIs" dodaj:
  - `https://edooqoo.com/gcal-student-callback`
  - `https://preview--edooqoo-mvp-e3.lovable.app/gcal-student-callback`
4. Zapisz

**Plik:** Brak zmian w kodzie. Informacja dla usera.

## Problem 9: Zniżka na slot (discount)

Dodać kolumnę `discount_percent SMALLINT` do `calendar_slots` (nullable, default NULL).

**Zmiany:**

1. **Migracja SQL:** `ALTER TABLE calendar_slots ADD COLUMN discount_percent SMALLINT CHECK (discount_percent >= 0 AND discount_percent <= 100)`
  (Ale CHECK constraints mogą powodować problemy — użyjmy trigger walidacyjny zamiast CHECK)
2. **UnifiedSlotModal.tsx** (tworzenie slotu): dodać pole "Discount %" — opcjonalny input number 0-100. Przekazywać `discount_percent` do `onCreateSingle`.
3. **SlotDetailModal.tsx** (edycja slotu): dodać pole "Discount %" w sekcji edycji.
4. **StudentHubLessons.tsx** (grid slotów): przy slotach z `discount_percent > 0`, wyświetlać badge `-{discount_percent}%`:

```tsx
{slot.discount_percent && (
  <span className="text-[10px] text-red-600 font-bold">-{slot.discount_percent}%</span>
)}
```

5. **StudentBookingsSection.tsx** (karty lekcji): wyświetlać discount badge na kartach zarezerwowanych lekcji.
6. **CalendarSlot type** (`useCalendarSlots.ts`): dodać `discount_percent?: number`.

**Pliki:**

- Migracja SQL
- `src/hooks/useCalendarSlots.ts` — typ
- `src/components/calendar/UnifiedSlotModal.tsx` — pole discount przy tworzeniu
- `src/components/calendar/SlotDetailModal.tsx` — pole discount przy edycji
- `src/pages/StudentHubLessons.tsx` — badge na grid
- `src/components/calendar/StudentBookingsSection.tsx` — badge na kartach

---

## Podsumowanie zmian


| Plik                                                           | Zmiana                                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Migracja SQL**                                               | `public_calendar_slug` kolumna + `discount_percent` kolumna             |
| `src/pages/CalendarSettingsPage.tsx`                           | Pole slug URL, info o /my, info w sekcji Google Meet                    |
| `src/hooks/usePublicBooking.tsx`                               | Fetch po slug OR token, bookUrl → /my/{token}/lessons                   |
| `src/pages/StudentPage.tsx`                                    | `MeetingLinkField` opis zależny od hasGcal + pobranie gcal status       |
| `src/components/OnboardingChecklist.tsx`                       | Ukrycie na ścieżkach /my/*                                              |
| `src/pages/StudentHubLessons.tsx`                              | Fix recurring booking (direct DB query), preview count, discount badge  |
| `src/components/calendar/SlotDetailModal.tsx`                  | Reject dialog z komentarzem, meetingLink w emailach                     |
| `supabase/functions/send-calendar-notification-email/index.ts` | `rejectionReason` w booking_rejected, `meetingButton` w booking_pending |
| `src/components/calendar/StudentBookingsSection.tsx`           | Fix scrollToToday dla desc order                                        |
| `src/components/calendar/UnifiedSlotModal.tsx`                 | Pole discount_percent                                                   |
| `src/hooks/useCalendarSlots.ts`                                | Typ discount_percent                                                    |
| Deploy Edge Functions                                          | `send-calendar-notification-email`                                      |


## Co NIE zmienia się w kodzie (Problem 8)

- **Google Cloud Console** — musisz ręcznie dodać redirect URI `https://edooqoo.com/gcal-student-callback`

## Co NIE zmienia się

- SM-2, flashcards, homework — bez zmian
- Routing w `App.tsx` — bez zmian
- RLS — bez zmian
- Inne Edge Functions — bez zmian