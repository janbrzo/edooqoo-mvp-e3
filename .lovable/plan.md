

# Plan: Calendar & Booking — Runda napraw #4

---

## Problem 1 (KRYTYCZNY): Biała strona po kliknięciu slota — React error #310

**Root cause:** W `SlotDetailModal.tsx` na linii 88 jest `if (!slot) return null;` — to jest PRZED hookami `useMemo` (linia 108) i innymi. React wymaga, żeby hooki były wywoływane zawsze w tej samej kolejności. Gdy `slot` zmienia się z `null` na obiekt, React widzi więcej hooków niż poprzednio i rzuca błąd #310 ("Rendered more hooks than during the previous render").

Dodatkowo w konsoli widać `Failed to load resource: 400` na zapytaniu `.in('id', (...))` — to pewnie z `handleNotificationClick` w CalendarPage, ale to nie jest główna przyczyna crashu.

**Fix:** Przenieść `if (!slot) return null;` PONIŻEJ wszystkich hooków. Zamiast early return, ustawić bezpieczne domyślne wartości:

```tsx
// PRZED wszystkimi hookami — NIGDY nie robimy return null
const safeSlot = slot || { slot_date: '', start_time: '00:00', end_time: '01:00', notes: '', student_id: null, status: 'available', teacher_id: '', id: '', recurrence_rule_id: null, cancelled_at: null, cancelled_by: null } as CalendarSlot;

// Wszystkie hooki (useState, useEffect, useMemo) używają safeSlot
// ...

// NA KOŃCU — dopiero w renderze:
if (!slot) return null;
```

Konkretnie:
- Linia 88: usunąć `if (!slot) return null;`
- Wszystkie odwołania do `slot` w hookach (useEffect linia 74, useMemo linia 108) zamienić na `safeSlot`
- Dodać `if (!slot) return null;` tuż przed `return (<DraggableDialog ...>)` na linii 573

**Plik:** `src/components/calendar/SlotDetailModal.tsx`

---

## Problem 2: Brak emaili po dodaniu lekcji z worksheet przez Add Lesson modal

**Analiza:** `useCalendarSlots.createSlot` tworzy powiadomienie na dzwoneczku (linia ~192), ale NIE wysyła emaila do studenta. Email powinien być wysłany do studenta z linkiem do shared worksheet.

**Fix:** W `useCalendarSlots.createSlot`, po insercie slota, jeśli `input.student_id` istnieje i `input.worksheet_id` istnieje:
1. Pobrać `student_email` z tabeli `students` (trzeba zrobić fetch)
2. Pobrać `share_token` z tabeli `worksheets`
3. Wywołać `send-calendar-notification-email` z typem `new_booking_student` i parametrem `sharedWorksheetUrl`

```ts
if (input.student_id && input.worksheet_id) {
  try {
    const { data: studentData } = await supabase.from('students').select('student_email').eq('id', input.student_id).maybeSingle();
    const { data: wsData } = await supabase.from('worksheets').select('share_token').eq('id', input.worksheet_id).maybeSingle();
    const { data: teacherProfile } = await supabase.from('profiles').select('email, first_name, last_name').eq('id', teacherId).maybeSingle();
    const { data: calSettings } = await supabase.from('calendar_settings').select('public_calendar_token, notify_email_on_booking').eq('teacher_id', teacherId).maybeSingle();
    
    if (studentData?.student_email && calSettings?.notify_email_on_booking !== false) {
      const teacherName = [teacherProfile?.first_name, teacherProfile?.last_name].filter(Boolean).join(' ') || 'Your Teacher';
      const bookUrl = calSettings?.public_calendar_token ? `${window.location.origin}/book/${calSettings.public_calendar_token}` : '';
      const sharedWorksheetUrl = wsData?.share_token ? `${window.location.origin}/shared/${wsData.share_token}` : undefined;
      
      supabase.functions.invoke('send-calendar-notification-email', {
        body: {
          type: 'new_booking_student',
          studentEmail: studentData.student_email,
          studentName: input.title?.split(' — ')[0] || 'Student',
          slotDate: input.slot_date,
          slotTime: input.start_time.slice(0, 5),
          teacherName,
          teacherEmail: teacherProfile?.email || '',
          bookUrl,
          sharedWorksheetUrl,
        },
      }).catch(console.error);
    }
  } catch (_) {}
}
```

Analogicznie, jeśli lekcja jest dodawana BEZ worksheet ale z studentem — też wysłać email (bez linku worksheet).

**Plik:** `src/hooks/useCalendarSlots.tsx`

---

## Problem 3: Realtime nadal nie działa

**Analiza:** `pendingRefetch` ref jest już dodany. Ale Realtime na `/book` (anonimowy użytkownik) nie działa z powodu RLS — anon user nie ma `auth.uid()`, więc Realtime listener nie dostarcza eventów zmienionych wierszy. Polling 5s (lub 3s) powinien działać jako fallback.

**Na `/calendar`** (zalogowany teacher): Realtime powinien działać. Jeśli nie — sprawdzić czy `fetchSlots` w `useCalendarSlots` jest stabilny (dependency `fetchingRef`/`pendingRefetch` jest OK).

**Fix:** 
1. W `usePublicBooking` — zmniejszyć polling do **2 sekundy** i dodać `refetchSlots` po każdej akcji bookSlot
2. W `useCalendarSlots` — upewnić się, że Realtime channel jest poprawnie podpięty. Dodać `console.log` w handleru Realtime, żeby potwierdzić że eventy przychodzą
3. W CalendarPage po zamknięciu SlotDetailModal (`onOpenChange(false)`) — wymusić `refetch()`

```tsx
// CalendarPage.tsx — po zamknięciu SlotDetailModal
onOpenChange={(open) => { if (!open) { setSelectedSlot(null); refetch(); } }}
```

**Pliki:** `src/hooks/usePublicBooking.tsx`, `src/pages/CalendarPage.tsx`

---

## Problem 4: Badge C → SC / TC + legenda

**Fix w `CalendarSlotCard.tsx`:**
- Zmienić badge z `C` na `SC` (student cancellation) i `TC` (teacher cancellation)
- Kolor SC: amber, kolor TC: blue (jak jest teraz, ale z inną literą)

```tsx
{showBadgeC ? (
  <div className={cn(
    'absolute top-0 left-0 min-w-[14px] h-[14px] rounded-br text-[8px] font-bold flex items-center justify-center z-10 px-0.5',
    slot.cancelled_by === 'student' ? 'bg-amber-400 text-amber-900' : 'bg-blue-400 text-blue-900'
  )}>
    {slot.cancelled_by === 'student' ? 'SC' : 'TC'}
  </div>
) : (...)}
```

**Fix w `CalendarPage.tsx` — LEGEND_ITEMS:** Dodać:
```ts
{ key: 'student_cancelled', label: 'Student Cancellation', badge: 'SC', color: 'bg-amber-200 border-amber-400' },
{ key: 'teacher_cancelled', label: 'Teacher Cancellation', badge: 'TC', color: 'bg-blue-200 border-blue-400' },
```
Usunąć (lub zostawić) stary generyczny `cancelled`.

**Fix filtrowania legendy** w `filteredSlots`:
```ts
if (legendFilter === 'student_cancelled') return s.status === 'available' && s.cancelled_by === 'student';
if (legendFilter === 'teacher_cancelled') return s.status === 'available' && s.cancelled_by === 'teacher';
```

**Pliki:** `src/components/calendar/CalendarSlotCard.tsx`, `src/pages/CalendarPage.tsx`

---

## Problem 5: Notifications vs Email Notifications + nowy switch

**Analiza:** "Notifications" to powiadomienia na dzwoneczku (in-app). "Email Notifications" to powiadomienia mailowe. Nazwy są niejasne.

**Fix:**
1. Zmienić label "Notifications" na **"In-App Notifications"** z opisem "Bell icon notifications that appear in the calendar toolbar"
2. Zmienić label "Email Notifications" na **"Email Alerts"** z opisem "Emails sent to you and your students when calendar events happen"
3. Dodać nowy switch: **"Email on new lesson created by teacher (to student only)"** — kolumna `notify_email_on_lesson_created` w `calendar_settings` (migracja SQL). Domyślnie `true`.

**Migracja SQL:**
```sql
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS notify_email_on_lesson_created boolean NOT NULL DEFAULT true;
```

**W `useCalendarSettings.tsx`** — dodać do interfejsu `CalendarSettings`:
```ts
notify_email_on_lesson_created: boolean;
```

**W `CalendarSettingsPage.tsx`** — dodać switch w sekcji Email Alerts:
```tsx
<div className="flex items-center justify-between">
  <div><Label>Email on new lesson (to student)</Label><p className="text-xs text-muted-foreground">Send email to student when you create a new lesson for them</p></div>
  <Switch checked={settings.notify_email_on_lesson_created} onCheckedChange={v => updateSettings({ notify_email_on_lesson_created: v })} />
</div>
```

**W `useCalendarSlots.createSlot`** — sprawdzać `notify_email_on_lesson_created` przed wysłaniem emaila (z problemu 2).

**Sidebar SECTIONS** — zmienić labels:
```ts
{ id: 'notifications', label: 'In-App Notifications' },
{ id: 'email-notifications', label: 'Email Alerts' },
```

**Pliki:** migracja SQL, `src/hooks/useCalendarSettings.tsx`, `src/pages/CalendarSettingsPage.tsx`, `src/hooks/useCalendarSlots.tsx`

---

## Problem 6: Dropdown studentów nie da się kliknąć

**Analiza:** `DraggableDialogContent` już ma `onPointerDownOutside` i `onInteractOutside` z obsługą `[data-radix-popper-content-wrapper]`, `[cmdk-list]`, `[cmdk-input]`. Ale problem może być z `focus trapping` — Radix Dialog z `modal=true` (domyślnie) tworzy focus trap, który blokuje interakcje poza dialogiem, a PopoverContent renderuje się w portalu POZA dialogiem.

**Root cause:** `DialogPrimitive.Root` nie ma `modal={false}`. Radix Dialog domyślnie jest `modal={true}` co tworzy focus trap uniemożliwiający interakcje z elementami portalu (Popover).

**Fix:** W `DraggableDialog` ustawić `modal={false}`:
```tsx
export function DraggableDialog({ open, onOpenChange, children }: DraggableDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      {children}
    </DialogPrimitive.Root>
  );
}
```

Jeśli `modal={false}` powoduje inne problemy (np. brak overlay/dismiss) — alternatywnie renderować Popover NIE w portalu, ustawiając `container` na DialogContent div.

**Plik:** `src/components/ui/draggable-dialog.tsx`

---

## Problem 7: Status powiadomienia nie zmienia się natychmiast po akcji

**Analiza:** `onNotificationsChanged` jest przekazywany do `SlotDetailModal`, ale wywoływany jest PRZED `onOpenChange(false)`. Po zamknięciu modalu, CalendarPage powinien refetchować notyfikacje. Hook `useCalendarNotifications` zwraca `refetch`, a CalendarPage go wywołuje.

**Fix:** Upewnić się, że `refetchNotifications` jest wywoływany RÓWNIEŻ po zamknięciu SlotDetailModal, nie tylko wewnątrz handlera. Dodać małe opóźnienie aby baza zdążyła się zaktualizować:

W `SlotDetailModal` — w `handleConfirm`, `handleReject`, `handleTeacherCancellation`, `handleStudentCancellation` — po `resolveNotifications`, dodać `await` i `setTimeout` na `onNotificationsChanged`:
```ts
await resolveNotifications(slot.id, [...], 'approved');
// Small delay to let DB propagate
setTimeout(() => onNotificationsChanged?.(), 300);
```

**Plik:** `src/components/calendar/SlotDetailModal.tsx`

---

## Problem 7b: Anulowanie pending request — treść i badge

**Analiza:** Gdy student anuluje pending request (jeszcze nie potwierdzony), w edge function `get-student-bookings` linia 155 message brzmi "cancelled lesson" — powinno brzmieć "cancelled request for a lesson". Dodatkowo badge C nie powinien się pojawiać na slocie, bo request nie był potwierdzony.

**Fix A — treść:** W `get-student-bookings/index.ts`, sprawdzić `isPending` (linia 123) i zmienić message:
```ts
const messageText = isPending
  ? `${studentName} cancelled request for a lesson on ${slot.slot_date} at ${slot.start_time.slice(0, 5)}`
  : `${studentName} cancelled lesson on ${slot.slot_date} at ${slot.start_time.slice(0, 5)}`;
```

**Fix B — badge:** Gdy student anuluje pending request, slot NIE powinien mieć `cancelled_at`/`cancelled_by` ustawionych, bo to nie jest prawdziwa cancellation — to cofnięcie requestu. Zmienić update w `get-student-bookings`:
```ts
if (isPending) {
  // Just revert to available — no cancellation record
  await supabase.from('calendar_slots').update({
    student_id: null, status: 'available', booking_type: 'manual',
    booked_at: null, booked_by: null, confirmed_at: null,
    student_notes: null, title: null,
    recurrence_rule_id: null,
    // NO cancelled_at, cancelled_by — this is a request withdrawal, not cancellation
  }).eq('id', slotId);
} else {
  // Confirmed lesson cancellation — keep cancellation record
  await supabase.from('calendar_slots').update({
    ...existing cancellation logic...
  }).eq('id', slotId);
}
```

**Plik:** `supabase/functions/get-student-bookings/index.ts`

---

## Problem 8: Treść powiadomienia "You added a new lesson"

**Analiza:** `useCalendarSlots.createSlot` linia ~210 message: `You added a new lesson for ${studentLabel} on ${input.slot_date} at ${input.start_time.slice(0, 5)}`. 

Trzeba dodać email studenta do metadata:
```ts
metadata: { 
  slot_date: input.slot_date, 
  start_time: input.start_time.slice(0, 5), 
  end_time: input.end_time.slice(0, 5),
  student_email: studentEmail, // pobrany z tabeli students
},
```

Trzeba pobrać email studenta z tabeli `students` przed insertem notyfikacji.

**Plik:** `src/hooks/useCalendarSlots.tsx`

---

## Problem 9: Na /book badge P na godzinie — usunąć

**Fix:** W `PublicBookingPage.tsx` linia 368, usunąć badge `P` z wyświetlania godziny pending slota:
```tsx
// Zmienić z:
<span className="w-3 h-3 rounded border border-amber-400 bg-amber-200 ...">P</span>
// Na: usunąć tę linię
```

Cała reszta (legenda, filtrowanie) ma zostać.

**Plik:** `src/pages/PublicBookingPage.tsx`

---

## Problem 10: /book — rozbudowa kafelka rezerwacji

**A) Minęła lekcja → ukryć Reschedule:**
```tsx
const isPast = isBefore(parseISO(`${booking.slot_date}T${booking.end_time}`), new Date());
// ...
{!isPast && <Button ... onClick={() => handleRescheduleClick(booking.id)}>Reschedule</Button>}
```

**B) Brak Cancel + info o min_cancellation_hours:**
```tsx
const hoursUntil = differenceInHours(parseISO(`${booking.slot_date}T${booking.start_time}`), new Date());
const canCancelResult = canCancel(booking);
// ...
{!canCancelResult && !isPast && (
  <p className="text-xs text-muted-foreground">
    Cancellation window closed ({settings.min_cancellation_hours}h before lesson)
  </p>
)}
```

**C) Przycisk History — logi:**
Dodać przycisk "History" przy każdym booking. Kliknięcie otwiera mały collapsible z logami. Potrzeba fetcha logów:
```tsx
const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
const [historyLogs, setHistoryLogs] = useState<Record<string, any[]>>({});

const fetchLogs = async (slotId: string) => {
  const { data } = await supabase.functions.invoke('get-student-bookings', {
    body: { token, email: email.trim(), action: 'get_logs', slotId },
  });
  setHistoryLogs(prev => ({ ...prev, [slotId]: data?.logs || [] }));
};
```

W edge function `get-student-bookings` dodać nowy action `get_logs`:
```ts
if (action === 'get_logs' && slotId) {
  const { data: logs } = await supabase
    .from('calendar_slot_logs')
    .select('action, actor, details, created_at')
    .eq('slot_id', slotId)
    .order('created_at', { ascending: false })
    .limit(10);
  return new Response(JSON.stringify({ logs: logs || [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
```

**D) Statusy widoczne dla studenta:**
Edge function `get-student-bookings` (action domyślny — lista bookingów) powinien zwracać `status` i `confirmed_at`. Teraz zwraca te pola (linia ~400 SELECT). W `StudentBookingsSection` dodać badge dla statusów:
- `needs_review` → `? Needs Review` (purple)
- `completed` → `✓ Completed` (green)
- `no_show` → `NS No Show` (red)
- `available` + `cancelled_by='student'` → `SC Student Cancellation`
- `available` + `cancelled_by='teacher'` → `TC Teacher Cancellation`

Ale uwaga — slot po cancellation ma status `available` i nie jest już powiązany z tym studentem (student_id=null), więc nie pojawi się w bookings. Trzeba zmienić query w edge function aby zwracać również anulowane sloty dla tego studenta:

```ts
// Oprócz aktualnych bookingów, pobrać też ostatnie cancellation z logów
const { data: cancelledLogs } = await supabase
  .from('calendar_slot_logs')
  .select('slot_id, action, details, created_at')
  .eq('teacher_id', teacherId)
  .in('action', ['cancelled_by_student', 'cancelled_by_teacher', 'status_changed'])
  .order('created_at', { ascending: false })
  .limit(20);
```

To skomplikowane. Prostsze podejście: dodać `cancelled_student_email` do `calendar_slots` przy cancellation, i potem filtrować po nim. ALE to zmiana schematu.

**Najprostsze podejście:** W response dodać pole `status` (już jest), i dla aktywnych bookingów wyświetlać badge. Cancelled bookings nie będą widoczne bo student_id jest null po cancellation — i to jest OK. Wystarczy dodać badgery dla: `needs_review`, `completed`, `no_show`.

```tsx
{booking.status === 'needs_review' && <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">? Needs Review</Badge>}
{booking.status === 'completed' && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">✓ Completed</Badge>}
{booking.status === 'no_show' && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">NS No Show</Badge>}
```

**E) Reschedule info na kafelku:**
Edge function `get-student-bookings` powinien w response dodawać info o pending reschedule. Przy query bookingów:
```ts
// Check for pending reschedule requests
const bookingsWithReschedule = await Promise.all(bookings.map(async (b) => {
  // Check if this slot has outgoing reschedule
  const { data: outgoing } = await supabase.from('calendar_slots')
    .select('slot_date, start_time, end_time')
    .eq('reschedule_request_from_slot_id', b.id)
    .maybeSingle();
  // Check if this slot is a reschedule target
  const { data: incoming } = await supabase.from('calendar_slots')
    .select('slot_date, start_time, end_time')
    .eq('reschedule_request_to_slot_id', b.id)
    .maybeSingle();
  return {
    ...b,
    reschedule_to: outgoing ? { slot_date: outgoing.slot_date, start_time: outgoing.start_time, end_time: outgoing.end_time } : null,
    reschedule_from: incoming ? { slot_date: incoming.slot_date, start_time: incoming.start_time, end_time: incoming.end_time } : null,
  };
}));
```

W `StudentBookingsSection`:
```tsx
{booking.reschedule_to && (
  <div className="flex items-start gap-1 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
    <ArrowRightLeft className="h-3 w-3 mt-0.5 shrink-0" />
    <span>You requested to reschedule this to {booking.reschedule_to.slot_date} {booking.reschedule_to.start_time.slice(0,5)}–{booking.reschedule_to.end_time.slice(0,5)}</span>
  </div>
)}
{booking.reschedule_from && (
  <div className="flex items-start gap-1 text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
    <ArrowRightLeft className="h-3 w-3 mt-0.5 shrink-0" />
    <span>This is a reschedule from {booking.reschedule_from.slot_date} {booking.reschedule_from.start_time.slice(0,5)}–{booking.reschedule_from.end_time.slice(0,5)}</span>
  </div>
)}
```

**Pliki:** `src/components/calendar/StudentBookingsSection.tsx`, `supabase/functions/get-student-bookings/index.ts`

---

## Kolejność wdrożenia

1. **KRYTYCZNY: Fix białej strony** (problem 1 — early return before hooks)
2. **Fix dropdown studentów** (problem 6 — `modal={false}` na DraggableDialog)
3. **Badge SC/TC + legenda** (problem 4)
4. **Treść powiadomień** (problem 7b — cancelled request vs lesson + brak badge C)
5. **Powiadomienie "You added"** (problem 8 — email w metadata)
6. **Email po Add Lesson** (problem 2) + nowy switch w settings (problem 5)
7. **Realtime force refetch** (problem 3)
8. **Status powiadomień instant update** (problem 7)
9. **Badge P na /book — usunąć** (problem 9)
10. **Rozbudowa kafelka /book** (problem 10 — past/cancel info/history/statusy/reschedule info)
11. **Deploy edge functions + docs**

## Pliki (podsumowanie)

| Plik | Zmiany |
|---|---|
| `src/components/calendar/SlotDetailModal.tsx` | Fix hooks order (early return), timeout na onNotificationsChanged |
| `src/components/ui/draggable-dialog.tsx` | `modal={false}` na DialogPrimitive.Root |
| `src/components/calendar/CalendarSlotCard.tsx` | Badge SC/TC zamiast C |
| `src/pages/CalendarPage.tsx` | Legend SC/TC + filter + refetch on modal close |
| `src/hooks/useCalendarSlots.tsx` | Email do studenta po createSlot, email studenta w metadata |
| `src/hooks/usePublicBooking.tsx` | Polling 2s |
| `src/pages/PublicBookingPage.tsx` | Usunąć badge P z godziny |
| `src/components/calendar/StudentBookingsSection.tsx` | Past check, cancel info, history, statusy, reschedule info |
| `src/pages/CalendarSettingsPage.tsx` | Labels In-App/Email Alerts, nowy switch |
| `src/hooks/useCalendarSettings.tsx` | Nowe pole notify_email_on_lesson_created |
| `supabase/functions/get-student-bookings/index.ts` | Cancel request vs lesson, get_logs action, reschedule info w response |
| Migracja SQL | notify_email_on_lesson_created |
| Docs (7 plików) | update |

