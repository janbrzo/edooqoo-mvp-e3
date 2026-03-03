# Plan: Calendar & Booking — Runda napraw #3

---

## Problem 1: Linki do worksheet w emailach + na /book przycisk "Open Worksheet" + Location/Notes + **Location (optional)**

**Analiza:** Na `/book` w `StudentBookingsSection` sekcja "Your Lessons" pokazuje booking z przyciskami Cancel/Reschedule, ale bez linku do shared worksheet. Edge function `get-student-bookings` nie zwraca `worksheet_id` ani `notes`/`location`. `send-calendar-notification-email` już obsługuje `worksheetUrl`, ale nie `sharedWorksheetUrl`.

**Plan:**

**A) get-student-bookings/index.ts** — rozszerzyć SELECT na linii 420:

```sql
.select('id, slot_date, start_time, end_time, status, confirmed_at, student_notes, worksheet_id, notes')
```

**B) Pobierz share_token dla worksheetów** — po pobraniu bookingów, jeśli którykolwiek ma `worksheet_id`, a jeżeli nie ma to wygeneruj. zrób dodatkowy fetch:

```ts
const worksheetIds = bookings.filter(b => b.worksheet_id).map(b => b.worksheet_id);
if (worksheetIds.length > 0) {
  const { data: worksheets } = await supabase.from('worksheets').select('id, share_token').in('id', worksheetIds);
  // Map worksheet_id → share_token
}
```

Dodać do każdego bookinga pole `share_token` i `notes` i location **Location (optional)** w response.

**C) StudentBookingsSection.tsx** — rozszerzyć interfejs `Booking`:

```ts
interface Booking {
  // ...existing...
  worksheet_id?: string | null;
  share_token?: string | null;
  notes?: string | null;
}
```

Dodać przycisk "Open Worksheet" po Reschedule:

```tsx
{booking.share_token && (
  <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => window.open(`/shared/${booking.share_token}`, '_blank')}>
    <FileText className="h-3 w-3 mr-1" /> Open Worksheet
  </Button>
)}
```

Dodać Location i Notes (opcjonalne) pod datą/godziną:

```tsx
{booking.notes && <p className="text-xs text-muted-foreground">{booking.notes}</p>}
```

**D) send-calendar-notification-email/index.ts** — dodać `sharedWorksheetUrl` (opcjonalny parametr). Dla emaili do ucznia renderować link "Open Worksheet" prowadzący do shared worksheet. Dla emaili do nauczyciela — link do `/worksheet/{id}`.

**Pliki:** `supabase/functions/get-student-bookings/index.ts`, `src/components/calendar/StudentBookingsSection.tsx`, `supabase/functions/send-calendar-notification-email/index.ts`

---

## Problem 2: Realtime — zmiany nadal nie widoczne natychmiast

**Analiza:** Polling co 5s jest dodany w `usePublicBooking.tsx`, ale Realtime nie działa dla anonimowych z powodu RLS. Na `/calendar` Realtime jest podpięty i powinien działać (teacher jest zalogowany). Problem może być w `fetchingRef.current` — jeśli fetchSlots jest wywoływany szybciej niż się kończy, to jest blokowany.

**Root cause:** W `useCalendarSlots.tsx` linia 73: `if (!teacherId || fetchingRef.current) return;` — jeśli Realtime event przychodzi w momencie gdy fetch jest w toku, jest ignorowany. Powoduje to brak aktualizacji.

**Fix w `useCalendarSlots.tsx`:** Zamiast ignorować, ustawiać flagę "pending refetch":

```ts
const pendingRefetch = useRef(false);

const fetchSlots = useCallback(async () => {
  if (!teacherId) return;
  if (fetchingRef.current) { pendingRefetch.current = true; return; }
  fetchingRef.current = true;
  // ...existing fetch logic...
  finally {
    setLoading(false);
    fetchingRef.current = false;
    if (pendingRefetch.current) {
      pendingRefetch.current = false;
      fetchSlots(); // re-trigger
    }
  }
}, [...]);
```

**Dla `/book`:** Polling 5s jest backup. Ale dodatkowo w `usePublicBooking`, sprawdzić czy Realtime channel subskrybuje się poprawnie — dodać `console.log` na subscription status i upewnić się że `fetchSlots` jest wywoływany. Ewentualnie zmniejszyć polling do 3s.

**Pliki:** `src/hooks/useCalendarSlots.tsx`, `src/hooks/usePublicBooking.tsx`

---

## Problem 3: Link Worksheet na Available Slot automatycznie zapisuje studenta

**Analiza:** W `SlotDetailModal.tsx` linia 418-432, `handleLinkWorksheetClick` sprawdza czy student się zmienił, i jeśli tak — **natychmiast** robi `await onUpdate(slot.id, updates)` co zapisuje studenta do bazy PRZED otwarciem modalu worksheet. To jest błąd.

**Fix A:** `handleLinkWorksheetClick` NIE powinien zapisywać zmian do bazy. Powinien jedynie przekazać `editStudentId` do `onLinkWorksheet` bez zapisu:

```ts
const handleLinkWorksheetClick = () => {
  // DON'T save to DB yet — just pass the student id to link worksheet modal
  onLinkWorksheet?.(slot, editStudentId !== 'none' ? editStudentId : null);
};
```

Zapis studenta i statusu musi się odbyć DOPIERO gdy użytkownik kliknie "Save Changes" 

**Fix B:** Powiadomienia przy Save Changes — w `handleSave` po `onUpdate`, jeśli student został przypisany (`studentChanged && editStudentId !== 'none'`), dodać powiadomienie na dzwoneczek i wysłać email:

```ts
if (studentChanged && editStudentId !== 'none') {
  // Create notification
  await supabase.from('calendar_notifications').insert({
    teacher_id: slot.teacher_id,
    notification_type: 'lesson_created_by_teacher',
    message: `You added a new lesson on ${editDate} at ${editStartTime}`,
    student_name: students.find(s => s.id === editStudentId)?.name || '',
    slot_id: slot.id,
    metadata: { slot_date: editDate, start_time: editStartTime, end_time: editEndTime },
  } as any);
  // Send email if settings allow
  const canSend = await shouldSendEmail('notify_email_on_booking');
  if (canSend) await sendCalendarEmail('new_booking_teacher', { slotDate: editDate, slotTime: editStartTime });
}
```

**Fix C:** To samo dotyczy sytuacji bez worksheet — kliknięcie "Save Changes" z nowym studentem na Available Slot powinno generować powiadomienie. To jest ten sam fix B.

**Pliki:** `src/components/calendar/SlotDetailModal.tsx`

---

## Problem 4: Anulowana lekcja recurring pokazuje "Available Recurring" zamiast "Available"

**Analiza:** Po anulowaniu lekcji z recurring slot, status zmienia się na `available`, ale `recurrence_rule_id` pozostaje. Dlatego badge "Recurring" się wyświetla.

**Fix:** W `handleTeacherCancellation` i `handleStudentCancellation`, dodać `recurrence_rule_id: null` do updates. Tak samo w edge function `get-student-bookings` w sekcji CANCEL (linia 142-151).

Dodatkowo w `SlotDetailModal.tsx`:

```ts
// W handleTeacherCancellation i handleStudentCancellation:
await onUpdate(slot.id, {
  // ...existing fields...
  recurrence_rule_id: null, // Remove recurring link on cancellation
} as any);
```

W `get-student-bookings/index.ts` linia 144-151:

```ts
await supabase.from('calendar_slots').update({
  // ...existing...
  recurrence_rule_id: null,
}).eq('id', slotId);
```

**Pliki:** `src/components/calendar/SlotDetailModal.tsx`, `supabase/functions/get-student-bookings/index.ts`

---

## Problem 5: Calendar Settings — sidebar z nawigacją sekcji

**Analiza:** Strona CalendarSettingsPage jest prostą listą kart. Trzeba dodać sidebar z linkami do sekcji na tej samej stronie (scroll-to-section).

**Plan:** Dodać po lewej stronie fixed sidebar z linkami do sekcji. Na mobile sidebar jest ukryty, na desktop widoczny.

```tsx
const SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'booking', label: 'Booking Rules' },
  { id: 'public', label: 'Public Calendar' },
  { id: 'vacations', label: 'Vacations' },
  { id: 'payments', label: 'Payment Tracking' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'email-notifications', label: 'Email Notifications' },
];
```

Każda karta dostaje `id={section.id}`. Sidebar ma linki z `onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}`. Aktywna sekcja podświetlona na podstawie `IntersectionObserver`.

Layout: `<div className="flex gap-6">` — sidebar po lewej (200px, sticky top-20), content po prawej.

**Pliki:** `src/pages/CalendarSettingsPage.tsx`

---

## Problem 6: Dropdown studentów nie da się kliknąć

**Analiza:** Mamy `modal={false}` na Popover i `onPointerDownOutside={e => e.preventDefault()}` na PopoverContent. Ale `DraggableDialogContent` używa `DialogPrimitive.Content` z Radix, który ma wbudowany focus trap. CommandItem `onSelect` powinien działać — ale może problem jest w tym, że `value` w CommandItem zawiera `__` separator i Radix normalizuje wartość.

**Root cause:** Problem jest prawdopodobnie w `DialogPrimitive.Content` z Radix, który blokuje interakcje z portalowymi elementami (Popover jest wewnątrz portalu dialogu). `PopoverContent` renderuje się w osobnym portalu, ale dialog przechwytuje focus.

**Fix:** Na `DraggableDialogContent` dodać `onPointerDownOutside` i `onInteractOutside` aby nie blokować interakcji:

```tsx
<DialogPrimitive.Content
  onPointerDownOutside={(e) => { 
    // Allow interaction with popovers
    const target = e.target as HTMLElement;
    if (target.closest('[data-radix-popper-content-wrapper]')) {
      e.preventDefault();
    }
  }}
  onInteractOutside={(e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-radix-popper-content-wrapper]')) {
      e.preventDefault();
    }
  }}
>
```

**Alternatywnie:** Jeśli to nie pomoże, zamienić DraggableDialog na zwykły Dialog z `modal={true}` i dodać `Popover` z `side="bottom"` renderowany inline (nie w portalu) — ale to bardziej inwazyjne.

**Test:** Po implementacji, przetestować klikanie na nazwę studenta w dropdown na obu modalach.

**Pliki:** `src/components/ui/draggable-dialog.tsx`

---

## Problem 7: Status powiadomień nie aktualizuje się natychmiast po akcji

**Analiza:** `resolveNotifications` w `SlotDetailModal` robi update, który powinien triggerować Realtime w `useCalendarNotifications`. Ale `calendar_notifications` ma restrictive RLS — `Teachers can update` wymaga `auth.uid() = teacher_id`. Realtime listener nasłuchuje na `teacher_id=eq.${teacherId}`. Powinno działać.

**Root cause:** Prawdopodobnie `resolveNotifications` w SlotDetailModal rozwiązuje po `onOpenChange(false)` — modal się zamyka, ale refetch notyfikacji może nie zostać wyzwolony bo event z Realtime przychodzi z opóźnieniem.

**Fix:** Dodać explicit refetch. W `CalendarPage.tsx`, przekazać `refetchNotifications` callback do `SlotDetailModal`, a po confirm/reject wywołać go ręcznie.

Zmienić `useCalendarNotifications` aby eksportować `refetch`:

```ts
return { notifications, unreadCount, loading, markAllRead, refetch: fetchNotifications };
```

(To już jest — hook zwraca `refetch: fetchNotifications`.)

W `CalendarPage.tsx`:

```tsx
const { notifications, unreadCount, loading: notifLoading, markAllRead, refetch: refetchNotifications } = useCalendarNotifications(user?.id);
```

Ale `CalendarNotificationBell` używa wewnętrznie `useCalendarNotifications`. Trzeba albo:
a) przenieść hook do CalendarPage i przekazywać dane jako props, albo
b) dodać callback `onResolved` do SlotDetailModal, który wywołuje refetch z CalendarPage

Opcja B jest prostsza:

- `CalendarPage` tworzy `useCalendarNotifications(user?.id)` — wyciągnąć go z `CalendarNotificationBell`
- `CalendarNotificationBell` przyjmuje `notifications`, `unreadCount`, `markAllRead` jako props
- `SlotDetailModal` przyjmuje nowy prop `onNotificationsChanged?: () => void`
- Po resolve, wywołać `onNotificationsChanged?.()`

**Pliki:** `src/pages/CalendarPage.tsx`, `src/components/calendar/CalendarNotificationBell.tsx`, `src/components/calendar/SlotDetailModal.tsx`, `src/hooks/useCalendarNotifications.tsx`

---

## Problem 8: Treść powiadomień — zmiana układu

**Analiza:** Treść notification `message` jest tworzona w kilku miejscach:

- `usePublicBooking.bookSlot` linia 148-150 (booking_pending/booking_confirmed)
- `get-student-bookings/index.ts` linia 163 (cancellation), 249/324 (reschedule), 392 (batch)
- `useCalendarSlots.createSlot` linia 211 (lesson_created_by_teacher)

**Plan — zmienić treść `message` w każdym miejscu:**

**A) booking_pending** (`usePublicBooking.bookSlot` linia 148):

```
`${resolvedName} requested a lesson ${slot?.slot_date} at ${slot?.start_time?.slice(0,5)}–${slot?.end_time?.slice(0,5)} — awaiting confirmation`
```

**B) batch booking** (`get-student-bookings/index.ts` linia 392):
Potrzebujemy pierwszy slot date i day name. Pobrać dane pierwszego slota:

```ts
const { data: firstSlot } = await supabase.from('calendar_slots').select('slot_date, start_time, end_time').eq('id', successIds[0]).single();
const dayName = new Date(firstSlot.slot_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() + 's';
```

Message:

```
`${batchStudentName} booked ${successIds.length} weekly lessons since ${firstSlot.slot_date} ${dayName} ${firstSlot.start_time.slice(0,5)}–${firstSlot.end_time.slice(0,5)} — awaiting confirmation`
```

**C) reschedule_request** (`get-student-bookings/index.ts` linia 324):

```
`${studentName} requests to reschedule: ${oldSlot.slot_date} ${oldSlot.start_time.slice(0,5)} → ${newSlotData?.slot_date} ${newSlotData?.start_time?.slice(0,5)} — awaiting confirmation`
```

(To JUŻ jest prawie tak — brakuje "awaiting confirmation")

**D) cancellation** (`get-student-bookings/index.ts` linia 163):

```
`${studentName} cancelled lesson on ${slot.slot_date} at ${slot.start_time.slice(0,5)}`
```

(To JUŻ jest prawie tak.)

**E) lesson_created_by_teacher** (`useCalendarSlots.createSlot` linia 211):

```
`You added a new lesson for ${input.title?.split(' — ')[0] || 'Student'} on ${input.slot_date} at ${input.start_time.slice(0, 5)}`
```

**W `CalendarNotificationBell.tsx**` — zmienić render aby NIE pokazywać duplikatu informacji. Dane z `metadata` (slot_date, start_time, email) będą już w `message`, więc usunąć osobne wyświetlanie `metadata.slot_date`:

```tsx
// Wyświetlać:
// 1. message (zawiera już datę/godzinę)
// 2. Student: {email}
// 3. time ago
```

Ale email wyświetlać pod "Student:" tylko jeśli `showEmailSeparately` jest true. Zmienić logikę na:

```tsx
<p className="text-xs">{n.message}</p>
{displayEmail && <p className="text-xs text-muted-foreground">Student: {displayEmail}</p>}
<p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(...)}</p>
```

**Pliki:** `src/hooks/usePublicBooking.tsx`, `supabase/functions/get-student-bookings/index.ts`, `src/hooks/useCalendarSlots.tsx`, `src/components/calendar/CalendarNotificationBell.tsx`

---

## Problem 9: Zmiana godziny

**A) Auto-przesuwanie end przy zmianie start + dropdown Duration:**

W `SlotDetailModal.tsx`, dodać stan `duration` wyliczany z `editStartTime`/`editEndTime`, i przy zmianie `editStartTime` automatycznie przesuwać `editEndTime`:

```ts
const durationMinutes = useMemo(() => {
  const [sh, sm] = editStartTime.split(':').map(Number);
  const [eh, em] = editEndTime.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}, [editStartTime, editEndTime]);

const handleStartTimeChange = (newStart: string) => {
  setEditStartTime(newStart);
  // Auto-adjust end to keep same duration
  const [h, m] = newStart.split(':').map(Number);
  const totalMin = h * 60 + m + durationMinutes;
  const newEnd = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
  setEditEndTime(newEnd);
};

const handleDurationChange = (newDur: string) => {
  const [h, m] = editStartTime.split(':').map(Number);
  const totalMin = h * 60 + m + parseInt(newDur);
  const newEnd = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
  setEditEndTime(newEnd);
};
```

Zamienić pole Start na input z `onChange={e => handleStartTimeChange(e.target.value)}`.
Dodać dropdown Duration (30/45/60/90/120 min) obok Start/End:

```tsx
<div className="grid grid-cols-3 gap-2">
  <div><Label className="text-xs">Start</Label><Input type="time" ... /></div>
  <div><Label className="text-xs">End</Label><Input type="time" ... /></div>
  <div><Label className="text-xs">Duration</Label>
    <Select value={String(durationMinutes)} onValueChange={handleDurationChange}>...DURATIONS...</Select>
  </div>
</div>
```

**B) Save for Entire Series — przyciski wystające + podwójne sloty:**

Problem z przyciskami: footer ma `flex-col` co powoduje overflow. Fix: dodać `overflow-x-auto` albo zmienić layout buttonów aby się zawijały (`flex-wrap`).

Problem z podwójnymi slotami: `handleEditSeries` (linia 405-416) updatuje wszystkie sloty w serii z `gte('slot_date', today)`, ale NIE usuwa available slotów które kolidują z nowym czasem. 

Fix w `handleEditSeries`:

```ts
const handleEditSeries = async () => {
  if (!slot.recurrence_rule_id) return;
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Get all future slots in this series
  const { data: seriesSlots } = await supabase
    .from('calendar_slots')
    .select('id, slot_date, start_time, end_time')
    .eq('recurrence_rule_id', slot.recurrence_rule_id)
    .gte('slot_date', today)
    .neq('status', 'completed');
  
  // For each series slot, find and delete conflicting available slots at new time
  if (seriesSlots) {
    for (const ss of seriesSlots) {
      const { data: conflicts } = await supabase
        .from('calendar_slots')
        .select('id')
        .eq('teacher_id', slot.teacher_id)
        .eq('slot_date', ss.slot_date)
        .neq('id', ss.id)
        .is('student_id', null) // only available
        .neq('status', 'cancelled')
        .neq('status', 'deleted')
        .lt('start_time', editEndTime + ':00')
        .gt('end_time', editStartTime + ':00');
      
      if (conflicts) {
        for (const c of conflicts) {
          await supabase.from('calendar_slots').delete().eq('id', c.id);
        }
      }
    }
  }
  
  // Now update series
  const updates = { start_time: editStartTime, end_time: editEndTime, notes: editNotes || null };
  // ...rest of existing logic...
};
```

Dodatkowo update recurrence_rule z nowym czasem:

```ts
await supabase.from('calendar_recurrence_rules')
  .update({ start_time: editStartTime, end_time: editEndTime })
  .eq('id', slot.recurrence_rule_id);
```

**Pliki:** `src/components/calendar/SlotDetailModal.tsx`

---

## Problem 10: Na /book "Awaiting confirmation" zajmuje dużo miejsca — legenda z badgami A/P

**Analiza:** Pending sloty na `/book` wyświetlają pełny tekst "Awaiting confirmation". Trzeba zastąpić to legendą (jak na `/calendar`) z badge'ami A (Available) i P (Pending).

**Plan:**

Dodać legendę na górze `/book` (pod navigation):

```tsx
<div className="flex items-center gap-4 justify-center text-xs">
  <button onClick={() => setFilter(filter === 'available' ? null : 'available')} className={cn(...)}>
    <span className="w-4 h-4 rounded border border-green-400 bg-green-200 text-[8px] font-bold flex items-center justify-center">A</span>
    Available
  </button>
  <button onClick={() => setFilter(null)} className={cn(...)}>
    <span className="w-4 h-4 rounded border border-amber-400 bg-amber-200 text-[8px] font-bold flex items-center justify-center">P</span>
    Pending
  </button>
  {filter && <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setFilter(null)}>
    <X className="h-3 w-3 mr-1" /> Clear
  </Button>}
</div>
```

Na slot cards zamiast "Awaiting confirmation" pod godziną, dodać mały badge "P" z lewej strony godziny:

```tsx
<div className="flex items-center justify-center gap-1">
  <span className="w-3 h-3 rounded border border-amber-400 bg-amber-200 text-[7px] font-bold flex items-center justify-center">P</span>
  <Clock className="h-3 w-3" />
  {timeDisplay.primary}
</div>
```

Filtrowanie: jeśli `filter === 'available'` → ukryj pending sloty.

**Pliki:** `src/pages/PublicBookingPage.tsx`

---

## Problem 11: Book weekly — potwierdzenie jednego z trzech terminów

**Analiza:** Notification z batch booking ma `slot_id: successIds[0]` (pierwszy slot) i `metadata.slot_ids: successIds`. Ale `handleConfirm` w `SlotDetailModal` potwierdza tylko jeden slot (`slot.id`). Nie sprawdza czy to batch.

**Fix:** W `handleConfirm`, sprawdzić metadata powiadomienia. Ale `SlotDetailModal` nie ma dostępu do metadata notyfikacji — ma dostęp do `slot`.

Lepsze podejście: W `handleConfirm`, po potwierdzeniu/odrzuceniu, sprawdzić w `calendar_notifications` czy istnieje batch notification dla tego slota i potwierdzić/odrzucić wszystkie sloty z `metadata.slot_ids`:

```ts
const handleConfirm = async () => {
  // Check if this is a batch booking
  const { data: batchNotif } = await supabase
    .from('calendar_notifications')
    .select('metadata')
    .eq('slot_id', slot.id)
    .eq('teacher_id', slot.teacher_id)
    .eq('is_resolved', false)
    .in('notification_type', ['booking_pending'])
    .maybeSingle();
  
  const batchSlotIds = batchNotif?.metadata?.slot_ids;
  
  if (batchSlotIds && Array.isArray(batchSlotIds) && batchSlotIds.length > 1) {
    // Confirm all slots in batch
    for (const sid of batchSlotIds) {
      await onUpdate(sid, { confirmed_at: new Date().toISOString() } as any);
    }
    toast.success(`Confirmed ${batchSlotIds.length} lessons`);
  } else {
    // Single confirm (existing logic)
    await onUpdate(slot.id, { confirmed_at: new Date().toISOString() } as any);
  }
  
  // ...rest of existing logic (email, log, resolve)...
};
```

Analogicznie dla `handleReject` — odrzucić wszystkie sloty z batch.

**Pliki:** `src/components/calendar/SlotDetailModal.tsx`

---

## Kolejność wdrożenia

1. **Fix DraggableDialog** (pkt 6 — dropdown studentów)
2. **Fix handleLinkWorksheetClick** (pkt 3 — nie zapisywać przed link worksheet)
3. **Realtime fix** (pkt 2 — pendingRefetch)
4. **Treść powiadomień** (pkt 8)
5. **Notifications refresh** (pkt 7 — explicit refetch)
6. **Zmiana godziny** (pkt 9 — auto-end, duration dropdown, series conflicts)
7. **Cancel recurring → remove recurrence_rule_id** (pkt 4)
8. **Book weekly batch confirm/reject** (pkt 11)
9. **Worksheet links na /book + emails** (pkt 1)
10. **Legenda A/P na /book** (pkt 10)
11. **Calendar Settings sidebar** (pkt 5)
12. **Deploy edge functions + docs update**

## Pliki (podsumowanie)


| Plik                                                           | Zmiany                                                                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/draggable-dialog.tsx`                       | onPointerDownOutside + onInteractOutside                                                                                                                                                                        |
| `src/components/calendar/SlotDetailModal.tsx`                  | handleLinkWorksheetClick (no save), handleSave (notifications), handleStartTimeChange + duration dropdown, handleEditSeries (conflict cleanup), handleConfirm/Reject (batch), recurrence_rule_id null on cancel |
| `src/hooks/useCalendarSlots.tsx`                               | pendingRefetch logic                                                                                                                                                                                            |
| `src/hooks/usePublicBooking.tsx`                               | message format, polling 3s                                                                                                                                                                                      |
| `src/pages/PublicBookingPage.tsx`                              | legenda A/P, filter                                                                                                                                                                                             |
| `src/components/calendar/StudentBookingsSection.tsx`           | Open Worksheet button, notes                                                                                                                                                                                    |
| `src/components/calendar/CalendarNotificationBell.tsx`         | simplified message render, accept props from parent                                                                                                                                                             |
| `src/pages/CalendarPage.tsx`                                   | useCalendarNotifications elevated, pass to bell + slot modal                                                                                                                                                    |
| `src/pages/CalendarSettingsPage.tsx`                           | sidebar navigation                                                                                                                                                                                              |
| `supabase/functions/get-student-bookings/index.ts`             | worksheet data in response, batch message, recurrence_rule_id null                                                                                                                                              |
| `supabase/functions/send-calendar-notification-email/index.ts` | sharedWorksheetUrl                                                                                                                                                                                              |
| Docs (7 plików)                                                | update                                                                                                                                                                                                          |
