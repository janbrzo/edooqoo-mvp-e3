

# Plan: 5 napraw — Realtime, Recurring checkboxy, Reschedule GCal, Meeting link w GCal, Kolory settings

## Problem 1: Brak realtime na /calendar i /book po zmianach ucznia/nauczyciela

### Diagnoza
- **`useCalendarSlots.tsx` (nauczyciel /calendar)**: Ma realtime subscription na `calendar_slots` z filtrem `teacher_id=eq.${teacherId}` (linia 137-146). Działa poprawnie, ale `fetchSlots` jest w `useCallback` z zależnością od `dateRange` — zmiana widoku (tydzień/miesiąc) tworzy nowy callback i nowy channel, co może powodować krótkie "martwe strefy".
- **`usePublicBooking.tsx` (student /book i /my/.../lessons)**: Ma ZARÓWNO realtime (linia 84-93) JAK I polling co 2s (linia 96-100). Problem: query filtruje `or('status.eq.available,and(status.eq.booked,confirmed_at.is.null)')` — czyli po confirm przez nauczyciela slot znika z widoku (bo ma `confirmed_at`). To jest CELOWE (student widzi tylko available i pending). Ale student nie widzi zmian w swojej sekcji bookingów bo `StudentBookingsSection` fetchuje dane osobno przez edge function `get-student-bookings`.
- **`StudentBookingsSection.tsx`**: Fetchuje dane przez `get-student-bookings` edge function (linia ~60). NIE MA żadnego realtime ani pollingu. Po confirm/reject przez nauczyciela, student musi odświeżyć stronę.

### Rozwiązanie

**Plik: `src/components/calendar/StudentBookingsSection.tsx`**

Dodać realtime subscription na `calendar_slots` z filtrem na `teacher_id` (dostępny z `settings.teacher_id`). Gdy przyjdzie zdarzenie dotyczące slotu należącego do studenta, wywołać `fetchBookings()`.

```tsx
// Po istniejącym useEffect z fetchBookings
useEffect(() => {
  if (!settings?.teacher_id) return;
  const channel = supabase
    .channel(`student-bookings-${settings.teacher_id}-${defaultEmail}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_slots', filter: `teacher_id=eq.${settings.teacher_id}` },
      () => { fetchBookings(); }
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [settings?.teacher_id, fetchBookings]);
```

Uwaga: RLS na `calendar_slots` może blokować realtime events dla anonimowych. Jako fallback, dodać polling co 5s (mniej agresywny niż w usePublicBooking):

```tsx
useEffect(() => {
  if (!settings?.teacher_id) return;
  const interval = setInterval(fetchBookings, 5000);
  return () => clearInterval(interval);
}, [settings?.teacher_id, fetchBookings]);
```

**Pliki do zmiany:** `src/components/calendar/StudentBookingsSection.tsx`

---

## Problem 2: RecurringBookingModal — checkboxy do selektywnej akceptacji/odrzucenia

### Diagnoza
Obecny `RecurringBookingModal` (linia 229-236) ma tylko "Confirm All" i "Reject All". User chce móc zaznaczyć wybrane lekcje z serii.

### Rozwiązanie

**Plik: `src/components/calendar/RecurringBookingModal.tsx`**

a) Dodać stan `selectedIds`:
```tsx
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
```

b) Dodać "Select All" checkbox nad listą i checkbox przy każdym pending slocie:
```tsx
// Nad listą
<div className="flex items-center gap-2 mb-1">
  <Checkbox 
    checked={selectedIds.size === pendingIds.length && pendingIds.length > 0}
    onCheckedChange={(checked) => {
      setSelectedIds(checked ? new Set(pendingIds) : new Set());
    }}
  />
  <span className="text-xs font-medium">Select All ({pendingIds.length} pending)</span>
</div>
```

c) Przy każdym slocie w liście (linia 188-196) dodać checkbox (tylko dla pending):
```tsx
<div key={s.id} className="flex items-center gap-2 text-xs py-1 border-b last:border-b-0">
  {isPending && (
    <Checkbox 
      checked={selectedIds.has(s.id)}
      onCheckedChange={(checked) => {
        setSelectedIds(prev => {
          const next = new Set(prev);
          checked ? next.add(s.id) : next.delete(s.id);
          return next;
        });
      }}
    />
  )}
  <span className="font-medium flex-1">...</span>
  <span className={...}>...</span>
</div>
```

d) Zmienić przyciski na dynamiczne — działają na `selectedIds` (jeśli coś zaznaczone) lub `pendingIds` (jeśli nic):
```tsx
const actionIds = selectedIds.size > 0 ? Array.from(selectedIds) : pendingIds;
const actionCount = actionIds.length;
const isPartial = selectedIds.size > 0 && selectedIds.size < pendingIds.length;
```

```tsx
<Button ... onClick={() => handleConfirmSelected(actionIds)} disabled={actionInProgress || actionCount === 0}>
  <Check /> {isPartial ? `Confirm Selected (${actionCount})` : `Confirm All (${actionCount})`}
</Button>
<Button ... onClick={() => handleRejectSelected(actionIds)} disabled={actionInProgress || actionCount === 0}>
  <Ban /> {isPartial ? `Reject Selected (${actionCount})` : `Reject All (${actionCount})`}
</Button>
```

e) Zmienić `handleConfirmAll` → `handleConfirmSelected(ids: string[])` i `handleRejectAll` → `handleRejectSelected(ids: string[])`. Logika taka sama, tylko operuje na przekazanych `ids` zamiast `pendingIds`. Jeśli po akcji zostają jeszcze niezaakceptowane sloty (partial), NIE zamykać modala — odświeżyć listę slotów. Jeśli wszystkie obsłużone — zamknąć i wywołać `onDone()`.

f) Po partial confirm/reject, jeśli `ids.length < pendingIds.length`:
- NIE oznaczać notification jako resolved
- Odświeżyć listę slotów: ponownie pobrać dane z DB
- Wyczyścić `selectedIds`

g) Import `Checkbox` z `@/components/ui/checkbox`.

**Pliki do zmiany:** `src/components/calendar/RecurringBookingModal.tsx`

---

## Problem 3: Reschedule nie aktualizuje Google Calendar (nauczyciel + uczeń)

### Diagnoza
W `get-student-bookings/index.ts` akcja `reschedule` (linie 232-360):
- **Auto-reschedule** (linia 232-287): aktualizuje stary slot (cancelled) i nowy slot (booked) w DB, ale **NIE wywołuje `gcal-sync`** dla żadnego z nich. Ani dla nauczyciela, ani dla ucznia.
- **Requires confirmation** (linia 288-360): j.w. — brak wywołań GCal.
- Po confirm/reject w `SlotDetailModal` (linia 428-481): wywołuje `onUpdate` co triggeruje `triggerGcalSync` w `useCalendarSlots` — ale to tylko dla nauczyciela. **Brak wywołania `student-gcal-sync`** w `handleConfirm` i `handleReject`.

### Rozwiązanie

**a) Plik: `supabase/functions/get-student-bookings/index.ts`**

Po auto-reschedule (po linii 283, przed `return`), dodać wywołania GCal:

```tsx
// GCal sync — teacher: cancel old slot, upsert new slot
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Teacher GCal
try {
  await fetch(`${supabaseUrl}/functions/v1/gcal-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ teacherId, slotId, action: 'cancel' }),
  });
  await fetch(`${supabaseUrl}/functions/v1/gcal-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ teacherId, slotId: newSlotId, action: 'upsert' }),
  });
} catch (_) {}

// Student GCal
try {
  await fetch(`${supabaseUrl}/functions/v1/student-gcal-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ email, teacherId, slotId, action: 'delete' }),
  });
  await fetch(`${supabaseUrl}/functions/v1/student-gcal-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ email, teacherId, slotId: newSlotId, action: 'upsert' }),
  });
} catch (_) {}
```

Analogicznie po requires-confirmation reschedule (po linii 358, przed `return`) — GCal upsert nowego slotu jako pending:
```tsx
try {
  await fetch(`${supabaseUrl}/functions/v1/gcal-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ teacherId, slotId: newSlotId, action: 'upsert' }),
  });
  await fetch(`${supabaseUrl}/functions/v1/student-gcal-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify({ email, teacherId, slotId: newSlotId, action: 'upsert' }),
  });
} catch (_) {}
```

**b) Plik: `src/components/calendar/SlotDetailModal.tsx`**

W `handleConfirm` (po linii 453 — po `sendCalendarEmail`), dodać student GCal sync:
```tsx
// Student GCal sync — update from Pending to Booked
const studentEmail = extractStudentEmail(slot.student_notes);
if (studentEmail) {
  supabase.functions.invoke('student-gcal-sync', {
    body: { email: studentEmail, teacherId: slot.teacher_id, slotId: slot.id, action: 'upsert' },
  }).catch(console.error);
}
```

W `handleReject` (po linii 512 — po `sendCalendarEmail`), dodać student GCal delete:
```tsx
const studentEmail = extractStudentEmail(slot.student_notes);
if (studentEmail) {
  supabase.functions.invoke('student-gcal-sync', {
    body: { email: studentEmail, teacherId: slot.teacher_id, slotId: slot.id, action: 'delete' },
  }).catch(console.error);
}
```

W `handleTeacherCancellation` (po linii 570), dodać student GCal delete:
```tsx
const studentEmail = extractStudentEmail(slot.student_notes) || '';
if (studentEmail) {
  supabase.functions.invoke('student-gcal-sync', {
    body: { email: studentEmail, teacherId: slot.teacher_id, slotId: slot.id, action: 'delete' },
  }).catch(console.error);
}
```

**c) Plik: `src/components/calendar/RecurringBookingModal.tsx`**

W `handleConfirmSelected` i `handleRejectSelected` — dodać student GCal sync per slot (analogicznie jak powyżej). Student email dostępny z `notification.metadata.student_email`.

**d) Plik: `src/pages/CalendarPage.tsx`**

W `handleBatchConfirm` i `handleBatchReject` — dodać student GCal sync. Wymaga pobrania student email z slots. Pobierać emaile z `student_notes` każdego slotu lub z tablicy slotów.

**Pliki do zmiany:** `get-student-bookings/index.ts`, `SlotDetailModal.tsx`, `RecurringBookingModal.tsx`, `CalendarPage.tsx`

---

## Problem 4: Meeting link w GCal — uczeń ma 3x, nauczyciel 0x

### Diagnoza
- **Nauczyciel (`gcal-sync`)**: W bloku `upsert` (linia 277-341) buduje `event` BEZ `description` i `location`. Meeting link NIE jest dodawany.
- **Uczeń (`student-gcal-sync`)**: Linia 183-186 dodaje meeting link do `description` I `location`. Ale `description` ma duplikat — "Meeting link: X\n\nJoin: X" = link w 2 miejscach + Google Calendar sam dodaje link z `location`. Daje 3 miejsca.

### Rozwiązanie

**a) Plik: `supabase/functions/gcal-sync/index.ts`** — w bloku `upsert` po linii 282 (po budowie `event`):

```tsx
// Add meeting link to description & location
let meetingLink = slot.meeting_link;
if (!meetingLink && slot.student_id) {
  const { data: studentSettings } = await supabase.from('calendar_student_settings')
    .select('default_meeting_link').eq('student_id', slot.student_id).eq('teacher_id', teacherId).maybeSingle();
  if (studentSettings?.default_meeting_link) meetingLink = studentSettings.default_meeting_link;
}
if (meetingLink) {
  event.description = `Join: ${meetingLink}`;
  event.location = meetingLink;
}
```

**b) Plik: `supabase/functions/student-gcal-sync/index.ts`** — linia 183-186, uprościć:

Zmienić z:
```tsx
eventBody.description = `Meeting link: ${meetingLink}\n\nJoin: ${meetingLink}`;
eventBody.location = meetingLink;
```
Na:
```tsx
eventBody.description = `Join: ${meetingLink}`;
eventBody.location = meetingLink;
```

To da 1 miejsce z linkiem (`location` wyświetla się natywnie w GCal jako "lokalizacja" z klikalnym linkiem). `description` ma tylko "Join: link" jako backup.

**Pliki do zmiany:** `gcal-sync/index.ts`, `student-gcal-sync/index.ts`

---

## Problem 5: Kolory w StudentHubSettings — nazwa się nie mieści w SelectTrigger

### Diagnoza
`SelectTrigger` ma `className="w-36 h-8 text-xs"` (linia 233). W środku jest kółko + `<SelectValue />`. `SelectValue` renderuje pełną treść `SelectItem` (kółko + nazwa), co podwaja kółko i nazwa się ucina.

### Rozwiązanie

**Plik: `src/pages/StudentHubSettings.tsx`**

Zmienić SelectTrigger z `w-36` na `w-40` i usunąć manualne kółko z triggera (bo `SelectValue` już je renderuje):

```tsx
<SelectTrigger className="w-40 h-8 text-xs">
  <SelectValue />
</SelectTrigger>
```

Albo odwrotnie — zostawić manualne kółko w triggerze i użyć `placeholder` w SelectValue:

```tsx
<SelectTrigger className="w-40 h-8 text-xs">
  <span className="flex items-center gap-2 truncate">
    <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: GCAL_COLOR_HEX[getColorValue(item.key)] || '#3f51b5' }} />
    <span className="truncate">{GCAL_COLORS.find(c => c.v === getColorValue(item.key))?.l || 'Color'}</span>
  </span>
</SelectTrigger>
```

I w `SelectItem` NIE renderować kółka+nazwy w `<SelectItem>` value — to rozwiąże problem podwójnego kółka.

Prostsze rozwiązanie: `w-40` + `text-xs` + `truncate` na treści `SelectValue`.

**Pliki do zmiany:** `src/pages/StudentHubSettings.tsx`

---

## Podsumowanie zmian w plikach

| Plik | Zmiana |
|------|--------|
| `src/components/calendar/StudentBookingsSection.tsx` | Realtime subscription + polling fallback 5s |
| `src/components/calendar/RecurringBookingModal.tsx` | Checkboxy per-slot, Select All, Confirm/Reject Selected |
| `supabase/functions/get-student-bookings/index.ts` | GCal sync (nauczyciel + uczeń) przy reschedule |
| `src/components/calendar/SlotDetailModal.tsx` | Student GCal sync przy confirm/reject/cancel |
| `src/pages/CalendarPage.tsx` | Student GCal sync w batch confirm/reject |
| `supabase/functions/gcal-sync/index.ts` | Meeting link w description+location dla nauczyciela |
| `supabase/functions/student-gcal-sync/index.ts` | Uprościć meeting link do 1 miejsca |
| `src/pages/StudentHubSettings.tsx` | Fix szerokości SelectTrigger i podwójnego kółka |
| `docs/llm-context.md` | Nowe sekcje |
| `llms.txt` | Aktualizacja |

## Czego NIE ruszamy
- Logiki booking/reschedule (poza dodaniem GCal wywołań)
- Migracji DB
- Worksheet engine
- Meeting link generation
- Logiki useCalendarSlots (nauczyciel realtime działa)

