# Plan: 4 naprawy — Reschedule badge, Bulk+GCal, Recurring UX, Student GCal sync

## Problem 1: Reschedule pokazuje "cancelled" zamiast "rescheduled"

### Diagnoza

Gdy lekcja jest przesunięta (reschedule), stary slot dostaje `cancelled_by: 'system'` i `cancellation_reason: "Rescheduled to 2026-04-08 14:00"`. W UI:

- `CalendarSlotCard.tsx` linia 79-81: sprawdza `cancelled_by === 'student'` → SC, else → TC. Brak obsługi `cancelled_by === 'system'`.
- `SlotDetailModal.tsx` linia 883: pokazuje "Previous lesson was cancelled" — brak sprawdzenia `cancellation_reason` zawierającego "Rescheduled".
- GCal upsert (linia 244): status "available" + `cancelled_by` → dodaje suffix "Teacher Cancellation" zamiast "Rescheduled".

### Rozwiązanie

**a) Nowy badge "R" w `CalendarSlotCard.tsx`:**
W logice badge (linia 77-82), dodać sprawdzenie:

```tsx
if (slot.cancelled_by === 'system' && slot.cancellation_reason?.includes('Rescheduled')) {
  // Rescheduled badge
  return <badge R, bg-indigo-400 text-indigo-900>
} else if (slot.cancelled_by === 'student') {
  return SC
} else {
  return TC
}
```

**b) Nowy wpis w legendzie `LEGEND_ITEMS` w `CalendarPage.tsx`:**

```tsx
{ key: 'rescheduled', label: 'Rescheduled', badge: 'R', color: 'bg-indigo-200 border-indigo-400' },
```

Oraz filter w `filteredSlots`:

```tsx
if (legendFilter === 'rescheduled') return s.status === 'available' && s.cancelled_by === 'system' && s.cancellation_reason?.includes('Rescheduled');
```

**c) SlotDetailModal linia 878-887:** Zmienić z "Previous lesson was cancelled" na dynamiczny tekst:

```tsx
const isRescheduledSlot = slot.cancelled_by === 'system' && slot.cancellation_reason?.includes('Rescheduled');
// ...
<p className="font-medium">{isRescheduledSlot ? 'Previous lesson was rescheduled' : 'Previous lesson was cancelled'}</p>
```

Kolor tła: `bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200` dla rescheduled.

**d) GCal suffix w `gcal-sync/index.ts` linia 244:**
Dodać warunek:

```tsx
if (effectiveStatus === 'available' && slot.cancelled_by) {
  if (slot.cancelled_by === 'system' && slot.cancellation_reason?.includes('Rescheduled')) {
    summary += ' — Rescheduled';
  } else {
    summary += slot.cancelled_by === 'student' ? ' — Student Cancellation' : ' — Teacher Cancellation';
  }
}
```

---

## Problem 2: Bulk Actions nie synchronizują z Google Calendar

### Diagnoza

`handleBatchConfirm`, `handleBatchReject`, `handleBatchStatusChange` w `CalendarPage.tsx` robią tylko DB update — nie wywołują `gcal-sync`. SlotDetailModal robi to poprawnie (np. linia 644-648 dla status change).

### Rozwiązanie

Po każdym batch DB update, wywołać `gcal-sync` dla każdego slotu. Dodać wywołania po `await supabase.from(...)`:

`**handleBatchConfirm` (po linii 267):**

```tsx
// GCal sync for each confirmed slot
for (const id of ids) {
  supabase.functions.invoke('gcal-sync', {
    body: { teacherId: user?.id, slotId: id, action: 'upsert' },
  }).catch(console.error);
}
```

`**handleBatchReject` (po linii 284):**

```tsx
// GCal: update to available or delete
for (const id of ids) {
  supabase.functions.invoke('gcal-sync', {
    body: { teacherId: user?.id, slotId: id, action: 'cancel' },
  }).catch(console.error);
}
```

`**handleBatchStatusChange` (po linii 294):**

```tsx
// GCal: update color based on status
if (status === 'completed' || status === 'no_show') {
  const colorMap: Record<string, string> = { completed: '10', no_show: '6' };
  for (const id of ids) {
    supabase.functions.invoke('gcal-sync', {
      body: { teacherId: user?.id, slotId: id, action: 'upsert', colorOverride: colorMap[status] },
    }).catch(console.error);
  }
}
```

Uwaga: wywołania są fire-and-forget (`catch(console.error)`), tak jak w SlotDetailModal. Nie blokują UI.

---

## Problem 3: Recurring booking — nauczyciel nie wie czy akceptuje serię czy pojedynczy slot

### Diagnoza

Obecny flow:

- **Przez powiadomienie**: klik otwiera SlotDetailModal dla pierwszego slotu z `metadata.slot_ids`. `getValidBatchSlotIds` wykrywa batch → Confirm/Reject działa na całą serię. ALE modal wygląda identycznie jak dla single slota ("Lesson Pending").
- **Przez klik na slot w kalendarzu**: otwiera SlotDetailModal dla tego konkretnego slotu. `getValidBatchSlotIds` sprawdza notification dla `slot.id` — jeśli to jest pierwszy slot z serii, znów znajdzie batch i zadziała na serię. Jeśli to inny slot, NIE znajdzie notification (bo notification `slot_id` = pierwszy slot) → działa na single.

To jest mylące i niespójne.

### Rozwiązanie

**a) Nowy modal `RecurringBookingModal` dla powiadomień recurring:**

Kliknięcie powiadomienia `booking_pending` z `metadata.slot_ids.length > 1` NIE otwiera `SlotDetailModal`. Zamiast tego otwiera nowy dedykowany `RecurringBookingModal`:

Props:

```tsx
interface RecurringBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: CalendarNotification;
  teacherId: string;
  onDone: () => void;
}
```

Treść modala:

- Tytuł: "Recurring Booking Request"
- Info: student name, email, data pierwszej i ostatniej lekcji, count
- Lista dat: wszystkie sloty z `metadata.slot_ids` (pobrane z DB)
- Dwa przyciski: "Confirm All ({count})" / "Reject All ({count})"
- dodatkowa informacja że moze pojedynczo Confirm  /  Reject otwierajac kazdy slot ososbno
- Opcja inline comment (jak w SlotDetailModal)
- Logika confirm/reject: taka sama jak `handleConfirm`/`handleReject` z batchSlotIds, plus GCal sync

**b) Zmiana w `CalendarPage.tsx` → `handleNotificationClick`:**

```tsx
const handleNotificationClick = async (n: CalendarNotification) => {
  const slotIds = (n.metadata as any)?.slot_ids;
  if (n.notification_type === 'booking_pending' && Array.isArray(slotIds) && slotIds.length > 1 && !n.is_resolved) {
    setRecurringNotification(n);
    return;
  }
  // ...existing single slot logic
};
```

Nowy state: `const [recurringNotification, setRecurringNotification] = useState<CalendarNotification | null>(null);`

**c) SlotDetailModal — usunąć logikę batch z `getValidBatchSlotIds`:**
Zmienić `getValidBatchSlotIds` by zawsze zwracać `null`. Dzięki temu kliknięcie na DOWOLNY slot w kalendarzu (pending, z serii czy nie) ZAWSZE działa na ten jeden slot. Batch jest obsługiwany wyłącznie przez RecurringBookingModal z poziomu powiadomienia.

Albo lepiej — zostawić `getValidBatchSlotIds` ale dodać jasny komunikat w UI modala:

```tsx
{batchSlotCount > 1 && isPending && (
  <div className="bg-primary/10 border border-primary/30 rounded-md p-2 text-xs">
    This is part of a recurring booking ({batchSlotCount} lessons).
    Confirm/Reject will apply to all {batchSlotCount} lessons.
  </div>
)}
```

Ostatecznie — prostsze i bezpieczniejsze podejście: **usunąć batch logic z SlotDetailModal** i obsługiwać batch wyłącznie przez RecurringBookingModal. W SlotDetailModal confirm/reject = zawsze single slot.

**d) Zmiana w `getValidBatchSlotIds**` → zwraca zawsze `null`:

```tsx
const getValidBatchSlotIds = async (): Promise<string[] | null> => {
  return null; // Batch handled exclusively via RecurringBookingModal
};
```

---

## Problem 4: Student GCal Sync — statusy, kolory, togglesy, meeting link

### Diagnoza

`student-gcal-sync/index.ts`:

- Linia 108: zawsze `summary = "English Lesson with {teacher}"` — brak suffiksu statusu
- Linia 98: zawsze `colorId = studentSettings.color_id || '9'` — jeden kolor dla wszystkiego
- Linia 128-130: meeting link tylko w `description`, nie jako conferenceData
- Brak toggles "co synchronizować"
- Brak przycisku "sync all existing lessons"
- Brak obsługi per-status kolorów

### 4A: Status suffix i per-status kolory w `student-gcal-sync/index.ts`

Zmienić `summary` na dynamiczny:

```tsx
const isPending = slot.status === 'booked' && !slot.confirmed_at;
const effectiveStatus = isPending ? 'pending' : slot.status;
const statusSuffix: Record<string, string> = {
  booked: ' — Booked',
  pending: ' — Pending',
  completed: ' — Completed',
  no_show: ' — No Show',
};
let summary = `English Lesson with ${teacherName}`;
if (slot.cancelled_by) {
  summary += slot.cancelled_by === 'student' ? ' — Student Cancellation' : ' — Teacher Cancellation';
} else if (statusSuffix[effectiveStatus]) {
  summary += statusSuffix[effectiveStatus];
}
```

Per-status kolory z settings:

```tsx
const statusColorMap: Record<string, string> = {
  booked: studentSettings.color_booked || '3',   // Grape
  pending: studentSettings.color_pending || '5',  // Banana
  completed: studentSettings.color_completed || '10', // Basil
  no_show: studentSettings.color_no_show || '6',  // Tangerine
};
const colorId = statusColorMap[effectiveStatus] || studentSettings.color_id || '9';
```

### 4B: Settings UI — per-status kolory w `StudentHubSettings.tsx`

Zmienić z jednego `color_id` na osobne kolory per status:

Usunąć obecne "Event color" (jednokolorowe). Dodać sekcję:

```tsx
<div className="space-y-2">
  <Label className="text-sm">Event colors by status</Label>
  {[
    { key: 'color_booked', label: 'Booked lesson', defaultV: '3' },
    { key: 'color_pending', label: 'Pending booking', defaultV: '5' },
    { key: 'color_completed', label: 'Completed lesson', defaultV: '10' },
    { key: 'color_no_show', label: 'No Show', defaultV: '6' },
  ].map(item => (
    <div key={item.key} className="flex items-center justify-between">
      <span className="text-sm">{item.label}</span>
      <Select value={settings[item.key] || item.defaultV} onValueChange={v => updateSetting(item.key, v)}>
        <SelectTrigger className="w-36 h-8">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: GCAL_COLOR_HEX[settings[item.key] || item.defaultV] }} />
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {GCAL_COLORS.map(c => (
            <SelectItem key={c.v} value={c.v}>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: GCAL_COLOR_HEX[c.v] }} />
                {c.l}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ))}
</div>
```

### 4C: Fix wyświetlania kolorów — SelectTrigger za wąski

Zmienić `w-40` na `w-36` i dodać `truncate` do nazwy koloru. Albo lepiej — w SelectTrigger custom render:

```tsx
<SelectTrigger className="w-36 h-8 text-xs">
```

To wystarczy — z `text-xs` nazwa koloru się zmieści.

### 4D: Przycisk "Sync all existing lessons"

Dodać w `StudentHubSettings.tsx` po sekcji toggles:

```tsx
<Button variant="outline" size="sm" onClick={handleSyncAllLessons} disabled={syncing}>
  {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
  Sync all existing lessons to calendar
</Button>
```

Handler `handleSyncAllLessons`:

```tsx
const handleSyncAllLessons = async () => {
  setSyncing(true);
  try {
    const { data, error } = await supabase.functions.invoke('get-student-hub-data', {
      body: { token: teacherToken, email, action: 'sync_all_lessons_gcal' },
    });
    if (error) throw error;
    toast.success(`Synced ${data?.count || 0} lessons to your calendar`);
  } catch (err) {
    toast.error('Failed to sync lessons');
  } finally {
    setSyncing(false);
  }
};
```

W edge function `get-student-hub-data` dodać obsługę akcji `sync_all_lessons_gcal`:

- Pobrać wszystkie sloty studenta z `calendar_slots` gdzie `student_id` pasuje do emaila
- Dla każdego slotu wywołać `student-gcal-sync` z `action: 'upsert'`
- Zwrócić `{ count }`.

### 4E: Meeting link w wydarzeniu

W `student-gcal-sync/index.ts` zmienić sposób dodawania meeting link:

```tsx
if (slot.meeting_link) {
  eventBody.description = `Meeting link: ${slot.meeting_link}\n\nJoin: ${slot.meeting_link}`;
  eventBody.location = slot.meeting_link;
}

// Also check per-student meeting link
if (!slot.meeting_link && slot.student_id) {
  const { data: css } = await supabase.from('calendar_student_settings')
    .select('default_meeting_link')
    .eq('student_id', slot.student_id)
    .eq('teacher_id', teacherId)
    .maybeSingle();
  if (css?.default_meeting_link) {
    eventBody.description = `Meeting link: ${css.default_meeting_link}`;
    eventBody.location = css.default_meeting_link;
  }
}
```

### 4F: Togglesy "What to sync"

Dodać do settings state i UI:

```tsx
const defaultSettings = {
  auto_add: true,
  reminder_minutes: 30,
  color_booked: '3',
  color_pending: '5',
  color_completed: '10',
  color_no_show: '6',
  sync_booked: true,
  sync_pending: true,
};
```

UI toggles:

```tsx
<div className="space-y-2">
  <Label className="text-sm">What to sync to Google Calendar</Label>
  <div className="flex items-center justify-between">
    <span className="text-sm">Booked lessons</span>
    <Switch checked={settings.sync_booked !== false} onCheckedChange={v => updateSetting('sync_booked', v)} />
  </div>
  <div className="flex items-center justify-between">
    <span className="text-sm">Pending bookings</span>
    <Switch checked={settings.sync_pending !== false} onCheckedChange={v => updateSetting('sync_pending', v)} />
  </div>
</div>
```

W `student-gcal-sync/index.ts` — sprawdzić toggle:

```tsx
const isPending = slot.status === 'booked' && !slot.confirmed_at;
if (isPending && studentSettings.sync_pending === false) {
  return { skipped: true, reason: 'pending sync disabled' };
}
if (!isPending && slot.status === 'booked' && studentSettings.sync_booked === false) {
  return { skipped: true, reason: 'booked sync disabled' };
}
```

---

## Pliki do zmiany


| Plik                                                | Zmiany                                                                                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/calendar/CalendarSlotCard.tsx`      | Badge "R" dla rescheduled (`cancelled_by === 'system'` + `cancellation_reason` contains "Rescheduled")                                          |
| `src/pages/CalendarPage.tsx`                        | Legend entry "Rescheduled", legend filter, GCal sync w batch handlers, RecurringBookingModal state + rendering, handleNotificationClick routing |
| `src/components/calendar/SlotDetailModal.tsx`       | Dynamic text "rescheduled" vs "cancelled", usunięcie batch logic z confirm/reject (= zawsze single slot), kolor indigo dla rescheduled info box |
| `src/components/calendar/RecurringBookingModal.tsx` | **NOWY** — dedykowany modal dla batch confirm/reject z powiadomień                                                                              |
| `supabase/functions/gcal-sync/index.ts`             | Rescheduled suffix w cancel action                                                                                                              |
| `supabase/functions/student-gcal-sync/index.ts`     | Status suffixes, per-status colors, meeting link w description+location, sync toggles                                                           |
| `src/pages/StudentHubSettings.tsx`                  | Per-status color selectors, sync toggles, "Sync all existing lessons" button, fix wyświetlania kolorów                                          |
| `supabase/functions/get-student-hub-data/index.ts`  | Obsługa akcji `sync_all_lessons_gcal`                                                                                                           |
| `docs/llm-context.md`                               | Nowe sekcje                                                                                                                                     |
| `llms.txt`                                          | Aktualizacja                                                                                                                                    |


## Czego NIE ruszamy

- Logiki booking/reschedule w edge functions
- Migracji DB (kolory i toggles studenckie są w jsonb `settings` w `student_gcal_tokens`)
- Worksheet engine
- Meeting link generation (gcal-sync create_permanent_room)