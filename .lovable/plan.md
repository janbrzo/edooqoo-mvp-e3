

# Plan: Runda napraw #7

## Problem 1: Dropdown "Assign to Student" w DuplicateWorksheetModal nie scrolluje się myszką

**Diagnoza:** Radix `SelectContent` domyślnie używa virtualnego scrollowania ze strzałkami, ale nie obsługuje dobrze mouse wheel w pewnych warunkach. Dodatkowo lista wystaje poza ekran w górę.

**Fix w `src/components/DuplicateWorksheetModal.tsx`:**
- Dodać do `<SelectContent>` prop `position="popper"` + klasy `max-h-60 overflow-y-auto`:
```tsx
<SelectContent position="popper" className="max-h-60 overflow-y-auto">
```
To wymusza popper positioning (nie wypływa poza viewport) i dodaje natywny scroll myszką.

**Plik:** `src/components/DuplicateWorksheetModal.tsx` linia 83

---

## Problem 2: Błąd generowania worksheet — `streamUsedModel is not defined`

**Diagnoza:** W `generateWorksheet/index.ts` zmienna `streamUsedModel` jest zadeklarowana wewnątrz bloku `try` (linia 470: `let streamUsedModel = ""`) ale jest referowana w bloku `catch` (linie 635, 639). W normalnym JS/TS `let` w bloku `try` nie jest widoczny w `catch`. Stąd `ReferenceError`.

Mimo tego erroru generowanie naprawiło się samo (JSON repair succeeded) i worksheet się wygenerował — ale error w `catch` powoduje że:
1. `notifyGenerationFailure` jest wywoływana z niezdefiniowaną zmienną → crash
2. Email o błędzie się NIE wysyła bo sam `catch` crashuje

**Fix w `supabase/functions/generateWorksheet/index.ts`:**
Przenieść deklarację `let streamUsedModel = "";` PRZED blok `try` (na poziom async IIFE, tuż po `let lastExerciseCount = 0;`):

Zmiana: linia 468-470 → przenieść `let streamUsedModel = "";` do linii 467 (przed try):
```ts
let fullContent = "";
let lastExerciseCount = 0;
let streamUsedModel = ""; // ← przenieść tutaj, PRZED try

try {
  console.log("🔵 Trying Gemini 2.5 Flash streaming...");
  streamUsedModel = "gemini-2.5-flash";
```

Dzięki temu `catch` będzie miał dostęp do zmiennej i email z alertem dotrze poprawnie.

**Plik:** `supabase/functions/generateWorksheet/index.ts`

---

## Problem 3: /book — UI fixes

### 3A: Pending w dwóch liniach vs Available w jednej

**Diagnoza:** W `PublicBookingPage.tsx` pending slot (linia 384-399) używa `<div>` z klasą `text-center`, a available (402-418) to `<Button>` z `flex-col`. Obie gałęzie mają tę samą strukturę od ostatnich zmian. Problem to prawdopodobnie brak `flex-col` na divie pending — plik wygląda OK, ale sprawdźmy: pending div NIE ma `h-auto py-1.5 flex-col` jak Button available.

**Fix:** Ujednolicić pending div z available button:
```tsx
// Pending: linia 387-398
<div
  key={slot.id}
  className={`w-full text-xs h-auto py-1.5 rounded-md border ${colorClasses} text-center flex flex-col items-center`}
>
```
Dodać `h-auto flex flex-col items-center` żeby layout był identyczny.

### 3B: Widoki Schedule/Month/Range — dodać napisy zamiast samych ikon + Show past domyślnie ON

**Fix w `StudentBookingsSection.tsx`:**
1. Zmienić switcher widoków (linia 406-416) — dodać teksty:
```tsx
<button className={...} onClick={() => setViewMode('schedule')}>
  <List className="h-3.5 w-3.5 mr-1" /> Schedule
</button>
<button className={...} onClick={() => setViewMode('month')}>
  <CalendarDays className="h-3.5 w-3.5 mr-1" /> Month
</button>
<button className={...} onClick={() => setViewMode('range')}>
  <CalendarRange className="h-3.5 w-3.5 mr-1" /> Date Range
</button>
```

2. Zmienić domyślną wartość `showPast` (linia 85):
```ts
const [showPast, setShowPast] = useState(true); // domyślnie ON
```

### 3C: Cancelled Lessons jako normalne kafelki w głównej liście (nie osobna sekcja)

**Fix:** Zamiast osobnej sekcji "Cancelled Lessons" (linia 462-489), merged cancelled bookings do `viewFilteredBookings`:
1. Gdy `showCancelled=true`, dodać cancelled bookings do głównej listy
2. Usunąć osobną sekcję
3. W `renderBookingCard` dodać obsługę cancelled statusu (badge SC/TC)

Zmiana logiki:
```ts
const allBookings = useMemo(() => {
  let result = [...viewFilteredBookings];
  if (showCancelled && filteredCancelled.length > 0) {
    // Map cancelled to Booking format and merge
    const cancelledMapped = filteredCancelled.map((cb: any) => ({
      ...cb,
      status: cb.cancelled_by === 'student' ? 'student_cancelled' : 'teacher_cancelled',
      confirmed_at: null,
    }));
    result = [...result, ...cancelledMapped];
  }
  // Sort all by slot_date + start_time
  result.sort((a, b) => `${a.slot_date}${a.start_time}`.localeCompare(`${b.slot_date}${b.start_time}`));
  return result;
}, [viewFilteredBookings, showCancelled, filteredCancelled]);
```

W `renderBookingCard` dodać badge cancelled:
```tsx
{(booking.status === 'student_cancelled' || booking.cancelled_by === 'student') && (
  <Badge ... title={STATUS_TOOLTIPS.student_cancelled}>SC Cancelled</Badge>
)}
{(booking.status === 'teacher_cancelled' || booking.cancelled_by === 'teacher') && (
  <Badge ... title={STATUS_TOOLTIPS.teacher_cancelled}>TC Cancelled</Badge>
)}
```

### 3D: Usunąć filtr "Needs Review" — uczeń nie powinien widzieć

**Fix:** Linia 42-48, usunąć z `STATUS_FILTERS`:
```ts
const STATUS_FILTERS = [
  { key: 'completed', label: 'Completed' },
  { key: 'no_show', label: 'No Show' },
  { key: 'student_cancelled', label: 'Student Cancellation' },
  { key: 'teacher_cancelled', label: 'Teacher Cancellation' },
];
```
Usunąć też `needs_review` z `filteredBookings` logic (linia 181).

### 3E: Scrollowalny box z lekcjami + przycisk "Today"

**Fix w `StudentBookingsSection.tsx`:**
W schedule view (linia 453-457), zawinąć w scrollowalny kontener z max-height na ~7 lekcji (~560px) i ref do scroll:
```tsx
const listRef = useRef<HTMLDivElement>(null);

const scrollToToday = () => {
  if (!listRef.current) return;
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayEl = listRef.current.querySelector(`[data-date="${todayStr}"]`);
  if (todayEl) todayEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
};

// W renderBookingCard dodać data-date:
<div key={booking.id} data-date={booking.slot_date} className={...}>

// Schedule view:
<div className="flex gap-2">
  <Button variant="outline" size="sm" className="text-xs h-7 shrink-0 self-start" onClick={scrollToToday}>
    Today
  </Button>
  <div ref={listRef} className="space-y-2 max-h-[560px] overflow-y-auto flex-1 pr-1">
    {allBookings.map(renderBookingCard)}
  </div>
</div>
```

### 3F: Filtry wyżej — na poziomie sterowania tygodniami

**Fix:** Przenieść filtry statusów z `CardHeader` (linia 431-443) do `PublicBookingPage.tsx`, na poziomie toolbar tygodniowego.

To wymaga wyciągnięcia state filtrów do parenta. Prostsze rozwiązanie: w `StudentBookingsSection` przenieść filtry z `CardHeader` do poziomu PRZED `CardContent`, bezpośrednio po nagłówku "Your Lessons":

W `CardHeader` wstawić filtry w jednej linii z tygodniowym toolbarem — ale StudentBookingsSection nie ma dostępu do toolbaru tygodniowego. Prostsze: przenieść slot filtery `Available/Pending` z `PublicBookingPage` na poziom nagłówka obok toolbaru dat.

W `PublicBookingPage.tsx` przenieść `slotFilter` buttons (linie z Available/Pending) do pozycji obok "Today Mar 16 – Mar 22" zamiast pod spodem.

**Plik:** `src/pages/PublicBookingPage.tsx` — przenieść `slotFilter` do toolbara dat

---

## Problem 4: Google Calendar

### 4A: "Connect Google Calendar" poza ustawieniami

**Fix w `CalendarPage.tsx`:** Dodać w toolbarze (obok Share, Export) przycisk "Connect GCal" jeśli `!gcalConnected`:
```tsx
{!gcalConnected && (
  <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => navigate('/calendar/settings#gcal')}>
    🗓️ Connect GCal
  </Button>
)}
```
Wymaga pobrania `gcalConnected` stanu — dodać prosty fetch z `calendar_gcal_tokens`.

### 4B: Ustawienia GCal — domyślny kolor niebieski + opcja wyłączenia

**Fix w `CalendarSettingsPage.tsx`:**
- Domyślny kolor: zmienić w `useCalendarSettings.tsx` wartość `gcal_default_color` z `'1'` (Lavender) na `'9'` (Blueberry = niebieski)
- Opcja wyłączenia sync jest już zaimplementowana (`gcal_integration_enabled` switch). OK.

### 4C: Teacher Cancellation → GCal event zmienia się na "Available Slot"

**Fix w `gcal-sync/index.ts`:**
Dodać obsługę action `'cancel'` (obok `'upsert'` i `'delete'`):
```ts
} else if (action === 'cancel' && slot.gcal_event_id) {
  // Update to Available Slot — green, no reminder
  const event = {
    summary: 'Available Slot — English Lesson',
    colorId: '2', // Sage (green)
    reminders: { useDefault: false, overrides: [] },
    start: { dateTime: `${slot.slot_date}T${slot.start_time}`, timeZone: timezone },
    end: { dateTime: `${slot.slot_date}T${slot.end_time}`, timeZone: timezone },
  };
  await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${slot.gcal_event_id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
}
```

W `SlotDetailModal.tsx` → `handleTeacherCancellation` — po cancellation, wywołać:
```ts
supabase.functions.invoke('gcal-sync', { body: { teacherId: slot.teacher_id, slotId: slot.id, action: 'cancel' } }).catch(console.error);
```

### 4D: Usunięcie lekcji → usunięcie z GCal

**Fix w `useCalendarSlots.tsx`:**
W `deleteSlot` (linia 382-392) i `hardDeleteSlot` (linia 369-379) dodać:
```ts
triggerGcalSync(slotId, 'delete');
```
przed `fetchSlots()`.

Analogicznie w `deleteSlotsBatch` — dla każdego slotId.

### 4E: Ustawienia GCal w settings

Już zaimplementowane — karta "Google Calendar" w `CalendarSettingsPage` z color, reminder, enable/disable. Jedyne brakujące: opcja "Sync available slots to GCal" (osobny switch) i "On cancellation: update to Available / delete". To dodatkowe opcje.

Dodać w settings:
```tsx
<div className="flex items-center justify-between">
  <div><Label>On cancellation</Label><p className="text-xs text-muted-foreground">What happens to the GCal event when lesson is cancelled</p></div>
  <Select value={settings.gcal_on_cancel_action || 'update'} onValueChange={v => updateSettings({ gcal_on_cancel_action: v })}>
    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="update">Update to Available Slot</SelectItem>
      <SelectItem value="delete">Delete event</SelectItem>
    </SelectContent>
  </Select>
</div>
```

Wymaga dodania kolumny `gcal_on_cancel_action text DEFAULT 'update'` do `calendar_settings`.

---

## Migracja SQL

```sql
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_on_cancel_action text DEFAULT 'update';
```

---

## Kolejność wdrożenia

1. Migracja SQL (gcal_on_cancel_action)
2. Fix `streamUsedModel` scoping w generateWorksheet (Problem 2)
3. Fix dropdown scroll w DuplicateWorksheetModal (Problem 1)
4. Fix PublicBookingPage: pending layout, slot filter position (Problem 3A, 3F)
5. Fix StudentBookingsSection: napisy w widokach, showPast=true, cancelled merged, usunięcie Needs Review, scrollowalny box + Today (Problem 3B-E)
6. Fix GCal: cancel action, delete sync, default color, connect button (Problem 4A-E)
7. Deploy edge functions
8. Update docs

## Pliki do zmiany

| Plik | Zmiany |
|---|---|
| Migracja SQL | `gcal_on_cancel_action` |
| `src/components/DuplicateWorksheetModal.tsx` | `position="popper" className="max-h-60 overflow-y-auto"` |
| `supabase/functions/generateWorksheet/index.ts` | Przenieść `let streamUsedModel` przed try |
| `src/pages/PublicBookingPage.tsx` | Pending layout fix, slot filter position |
| `src/components/calendar/StudentBookingsSection.tsx` | Napisy widoków, showPast=true, cancelled merged, Needs Review usunięty, scrollowalny box + Today |
| `supabase/functions/gcal-sync/index.ts` | Dodać action `'cancel'` |
| `src/hooks/useCalendarSlots.tsx` | GCal delete sync w deleteSlot/hardDeleteSlot, default color '9' |
| `src/hooks/useCalendarSettings.tsx` | Default `gcal_default_color: '9'` |
| `src/pages/CalendarSettingsPage.tsx` | gcal_on_cancel_action select |
| `src/pages/CalendarPage.tsx` | Connect GCal button w toolbarze |
| `src/components/calendar/SlotDetailModal.tsx` | GCal cancel trigger |

