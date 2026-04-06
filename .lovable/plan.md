

# Plan: 3 naprawy — ScrollToToday, Reschedule GCal, Meeting link w mailu

## Problem 1: scrollToToday odpala się przy każdym pollingu/realtime

### Diagnoza
`StudentBookingsSection.tsx` linia 270-277:
```tsx
useEffect(() => {
  if (allBookings.length > 0 && !loading) {
    const timer = setTimeout(() => scrollToToday(), 150);
    return () => clearTimeout(timer);
  }
}, [allBookings.length > 0 && !loading]);
```

Zależność `allBookings.length > 0 && !loading` to **wyrażenie boolean** — React traktuje to jako nową wartość przy KAŻDYM renderze gdy `allBookings` się zmieni (a zmienia się co 5s przez polling). Efektywnie `scrollToToday()` odpala się co 5s.

### Rozwiązanie

Dodać ref `hasScrolledRef` i wykonać scroll tylko RAZ po pierwszym załadowaniu:

```tsx
const hasScrolledRef = React.useRef(false);

useEffect(() => {
  if (allBookings.length > 0 && !loading && !hasScrolledRef.current) {
    hasScrolledRef.current = true;
    const timer = setTimeout(() => scrollToToday(), 150);
    return () => clearTimeout(timer);
  }
}, [allBookings, loading]);
```

**Plik:** `src/components/calendar/StudentBookingsSection.tsx` — linie 270-277.

---

## Problem 2: Reschedule Confirm/Reject nie aktualizuje GCal (obie strony)

### Diagnoza
`calendar-handle-reschedule-decision/index.ts`:
- **Confirm** (linia 119-180): aktualizuje stary i nowy slot w DB, wysyła email, ale **ZERO wywołań `gcal-sync` i `student-gcal-sync`**. Trzeba:
  - Teacher: `cancel` stary slot, `upsert` nowy (Booked)
  - Student: `delete` stary event, `upsert` nowy (Booked)
- **Reject** (linia 182-226): revertuje nowy slot do available, ale **ZERO wywołań GCal**. Trzeba:
  - Teacher: `cancel` nowy slot (z pending na available)
  - Student: `delete` nowy event (pending znika)

### Rozwiązanie

**Plik:** `supabase/functions/calendar-handle-reschedule-decision/index.ts`

Po bloku confirm (po linii 176, przed `return`), dodać:
```tsx
// GCal sync — teacher
try {
  if (oldSlotId) {
    await fetch(`${supabaseUrl}/functions/v1/gcal-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({ teacherId: user.id, slotId: oldSlotId, action: 'upsert' }),
    });
  }
  await fetch(`${supabaseUrl}/functions/v1/gcal-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ teacherId: user.id, slotId: newSlotId, action: 'upsert' }),
  });
} catch (_) {}
// Student GCal sync
if (studentEmail) {
  try {
    if (oldSlotId) {
      await fetch(`${supabaseUrl}/functions/v1/student-gcal-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({ email: studentEmail, teacherId: user.id, slotId: oldSlotId, action: 'delete' }),
      });
    }
    await fetch(`${supabaseUrl}/functions/v1/student-gcal-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({ email: studentEmail, teacherId: user.id, slotId: newSlotId, action: 'upsert' }),
    });
  } catch (_) {}
}
```

Po bloku reject (po linii 221, przed `return`), dodać:
```tsx
// GCal sync — remove pending from both calendars
try {
  await fetch(`${supabaseUrl}/functions/v1/gcal-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ teacherId: user.id, slotId: newSlotId, action: 'cancel' }),
  });
} catch (_) {}
if (studentEmail) {
  try {
    await fetch(`${supabaseUrl}/functions/v1/student-gcal-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
      body: JSON.stringify({ email: studentEmail, teacherId: user.id, slotId: newSlotId, action: 'delete' }),
    });
  } catch (_) {}
}
```

### Problem 2B: Reschedule UI — brak feedbacku i blokady podczas procesowania

**Plik:** `src/pages/StudentHubLessons.tsx`

Dodać stan `rescheduling`:
```tsx
const [rescheduling, setRescheduling] = useState(false);
```

W `handleReschedule` — ustawić `setRescheduling(true)` na początku, `setRescheduling(false)` na końcu (w finally).

W `handleSlotClick`:
```tsx
const handleSlotClick = (slot: CalendarSlot) => {
  if (rescheduling) return; // block clicks during processing
  if (rescheduleBookingId) {
    handleReschedule(rescheduleBookingId, slot.id);
    return;
  }
  setSelectedSlot(slot);
};
```

Zmienić reschedule banner na dynamiczny:
```tsx
{rescheduleBookingId && (
  <div className="bg-primary/10 border border-primary/30 rounded-md p-2 flex items-center justify-between text-sm">
    {rescheduling ? (
      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing reschedule...</span>
    ) : (
      <span>Select a new time slot to reschedule your lesson</span>
    )}
    <Button variant="ghost" size="sm" onClick={() => setRescheduleBookingId(null)} disabled={rescheduling}>Cancel</Button>
  </div>
)}
```

---

## Problem 3: Mail reschedule_confirmation nie ma linku i przycisku Join Meeting

### Diagnoza
W `calendar-handle-reschedule-decision/index.ts` linia 166-175, email `reschedule_confirmation` jest wysyłany bez `meetingLink`. Template (`send-calendar-notification-email`) generuje `meetingButton` tylko gdy `meetingLink` jest w body. Podobnie w `get-student-bookings/index.ts` linia 278-283 — `sendEmail('reschedule_confirmation', ...)` nie przekazuje `meetingLink`.

### Rozwiązanie

**a) Plik: `supabase/functions/calendar-handle-reschedule-decision/index.ts`**

Przed wysłaniem emaila (linia 161-175), pobrać meeting link z nowego slotu lub per-student settings:

```tsx
// Get meeting link for new slot
let meetingLink = newSlot.meeting_link || '';
if (!meetingLink && newSlot.student_id) {
  const { data: css } = await supabase.from('calendar_student_settings')
    .select('default_meeting_link')
    .eq('student_id', newSlot.student_id)
    .eq('teacher_id', user.id)
    .maybeSingle();
  if (css?.default_meeting_link) meetingLink = css.default_meeting_link;
}
```

I dodać `meetingLink` do body emaila:
```tsx
body: JSON.stringify({
  type: 'reschedule_confirmation', studentEmail, studentName,
  slotDate: newSlot.slot_date, slotTime: newSlot.start_time.slice(0, 5),
  teacherName, teacherEmail, bookUrl, calendarUrl,
  oldSlotDate: oldSlotData?.slot_date, oldSlotTime: oldSlotData?.start_time?.slice(0, 5),
  meetingLink, // ← DODANE
}),
```

**b) Plik: `supabase/functions/get-student-bookings/index.ts`**

W `sendEmail('reschedule_confirmation', ...)` (linia 278-283), analogicznie pobrać meeting link z nowego slotu i dodać do parametrów:

```tsx
// Get meeting link
let meetingLink = '';
if (newSlotData) {
  meetingLink = newSlotData.meeting_link || '';
  if (!meetingLink && oldSlot.student_id) {
    const { data: css } = await supabase.from('calendar_student_settings')
      .select('default_meeting_link')
      .eq('student_id', oldSlot.student_id)
      .eq('teacher_id', teacherId)
      .maybeSingle();
    if (css?.default_meeting_link) meetingLink = css.default_meeting_link;
  }
}

await sendEmail('reschedule_confirmation', {
  studentEmail: email, studentName,
  slotDate: newSlotData?.slot_date, slotTime: newSlotData?.start_time?.slice(0, 5),
  teacherName, teacherEmail, bookUrl, calendarUrl,
  oldSlotDate: oldSlot.slot_date, oldSlotTime: oldSlot.start_time.slice(0, 5),
  meetingLink, // ← DODANE
});
```

Uwaga: `newSlotData` musi zawierać `meeting_link` — sprawdzić że select po upsert nowego slotu pobiera to pole. Obecny select na linia 258 to `.select()` (all fields) — OK.

---

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/components/calendar/StudentBookingsSection.tsx` | `hasScrolledRef` — scroll only once |
| `supabase/functions/calendar-handle-reschedule-decision/index.ts` | GCal sync (teacher+student) w confirm i reject + meetingLink w emailu |
| `src/pages/StudentHubLessons.tsx` | Stan `rescheduling`, loader, blokada kliknięć |
| `supabase/functions/get-student-bookings/index.ts` | meetingLink w reschedule_confirmation email |
| `docs/llm-context.md` | Aktualizacja |
| `llms.txt` | Aktualizacja |

## Czego NIE ruszamy
- Template emaila (już obsługuje `meetingLink` przez `meetingButton`)
- Logiki booking/cancel
- Frontend kalendarza nauczyciela
- Worksheet engine

