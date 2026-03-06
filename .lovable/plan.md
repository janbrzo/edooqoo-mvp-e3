

# Plan: Runda napraw #8

---

## Problem 1: Przycisk "Connect GCal" na innych stronach

Przycisk "Connect GCal" / "🗓️ Synced with GCal" powinien pojawiać się na:
- Formularz generowania worksheet (WorksheetForm)
- Widok worksheet (WorksheetToolbar)
- Strona studenta (/student)

**Logika:** Jeśli user zalogowany → sprawdź `calendar_gcal_tokens` → jeśli połączony: badge "🗓️ GCal Synced" (nieaktywny, zielony), jeśli nie połączony: przycisk "🗓️ Connect GCal" → link do `/calendar/settings#gcal`. Jeśli user niezalogowany → szary przycisk z tooltip "Log in to sync with Google Calendar".

**Implementacja:** Utworzyć reużywalny komponent `GCalStatusButton.tsx`:
```tsx
// Jeśli zalogowany i połączony: Badge "GCal Synced" (zielony)
// Jeśli zalogowany i nie połączony: Button "Connect GCal" → navigate /calendar/settings#gcal
// Jeśli niezalogowany: Disabled Button + Tooltip "Log in to connect Google Calendar"
```

**Pliki:**
- Nowy: `src/components/calendar/GCalStatusButton.tsx`
- Edycja: `src/components/worksheet/WorksheetToolbar.tsx` — dodać `<GCalStatusButton />` obok istniejących przycisków
- Edycja: `src/components/WorksheetForm/index.tsx` — dodać `<GCalStatusButton />` gdzieś w nagłówku formularza
- Edycja: `src/pages/StudentPage.tsx` — dodać `<GCalStatusButton />` w toolbarze

---

## Problem 2: Dropdown "Assign to Student" w DuplicateWorksheetModal

Aktualny kod (linia 83) już ma `position="popper" className="max-h-60 overflow-y-auto"` — ale to widocznie nie wystarczy. Problem polega na tym że Radix Select virtualnie scrolluje contentem, a `overflow-y-auto` na `SelectContent` nie działa dobrze w pewnych kontekstach.

**Fix:** Zamienić `max-h-60` na `max-h-[200px]` i dodać `sideOffset={5}` i `style={{ maxHeight: '200px' }}` bezpośrednio na scroll area wewnątrz SelectContent. Alternatywnie — dodać `SelectScrollUpButton` i `SelectScrollDownButton` w UI komponentach (standardowe Radix rozwiązanie). Sprawdzmy `src/components/ui/select.tsx`:

Trzeba sprawdzić czy nasz `SelectContent` renderuje `ScrollUpButton` i `ScrollDownButton` — jeśli tak, to problem jest w tym że mouse wheel nie jest przekazywany do scrollable container. Radix Select w trybie `position="popper"` powinien działać z natywnym scrollem. Dodajmy też `avoidCollisions={true}`:

```tsx
<SelectContent position="popper" className="max-h-[200px] overflow-y-auto" avoidCollisions>
```

**Plik:** `src/components/DuplicateWorksheetModal.tsx` linia 83

---

## Problem 3: Google Calendar — Student Cancellation nie synchronizuje z GCal

### 3A i 3B: Student cancellation nie wywołuje gcal-sync

**Root cause:** W `supabase/functions/get-student-bookings/index.ts` linia 112-195, po cancellation (zarówno pending jak i confirmed), NIE MA wywołania `gcal-sync`. Jest tylko log, notification i email. Efekt: event w GCal nie jest aktualizowany/usuwany.

**Fix:** Po linii 164 (po `await resolveNotifications(...)`) i przed tworzeniem notyfikacji, dodać:

```ts
// Trigger GCal sync for cancellation
if (!isPending && slot.gcal_event_id) {
  try {
    const gcalAction = settingsData.gcal_on_cancel_action === 'delete' ? 'delete' : 'cancel';
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/gcal-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ teacherId, slotId, action: gcalAction }),
    });
  } catch (gcalErr) {
    console.error('GCal sync failed for student cancellation:', gcalErr);
  }
}
```

Trzeba też pobrać `gcal_on_cancel_action` w select settings. Akualny select w get-student-bookings (linia ~58) pobiera pola z calendar_settings — dodać `gcal_on_cancel_action` do selecta:

```ts
.select('...existing fields..., gcal_on_cancel_action')
```

### 3C: Complete → ciemnozielony, No Show → pomarańczowy w GCal

W `SlotDetailModal.tsx` `handleStatusChange` (linia 575-586) — po `onUpdate`, dodać GCal sync z odpowiednim kolorem. Ale `gcal-sync` action `'upsert'` używa `gcal_default_color` — potrzebujemy przekazać konkretny kolor dla statusu.

**Rozwiązanie:** Dodać do `gcal-sync` edge function nowy parametr `colorOverride`. W `upsert` action, jeśli `colorOverride` to użyj go zamiast settings default.

W `SlotDetailModal.tsx` `handleStatusChange`:
```ts
const handleStatusChange = async (status: string) => {
  const updates: any = { status };
  if (status === 'cancelled') { updates.cancelled_at = new Date().toISOString(); updates.cancelled_by = 'teacher'; }
  await onUpdate(slot.id, updates);
  // ... existing log ...
  
  // GCal: update color based on status
  if (status === 'completed' || status === 'no_show') {
    const colorMap: Record<string, string> = { completed: '10', no_show: '6' }; // 10=Basil (dark green), 6=Tangerine (orange)
    supabase.functions.invoke('gcal-sync', {
      body: { teacherId: slot.teacher_id, slotId: slot.id, action: 'upsert', colorOverride: colorMap[status] },
    }).catch(console.error);
  }
  onOpenChange(false);
};
```

W `gcal-sync/index.ts` action `'upsert'`:
```ts
const { teacherId, slotId, action, colorOverride } = await req.json();
// ...
if (colorOverride) {
  event.colorId = colorOverride;
} else if (settings?.gcal_default_color) {
  event.colorId = settings.gcal_default_color;
}
```

Dodać też w `upsert` logikę reminderu — jeśli status completed/no_show → bez reminderu:
```ts
if (slot.status === 'completed' || slot.status === 'no_show') {
  event.reminders = { useDefault: false, overrides: [] };
}
```

**Pliki:**
- `supabase/functions/get-student-bookings/index.ts` — dodać gcal-sync call po student cancellation
- `supabase/functions/gcal-sync/index.ts` — dodać `colorOverride` param
- `src/components/calendar/SlotDetailModal.tsx` — dodać GCal sync po Complete/No Show

---

## Problem 4: Google Calendar ustawienia

### 4A: Opcja wyłączenia reminderu

Dodać Switch "Enable reminder" + input minut. Jeśli reminder wyłączony, `gcal_default_reminder_minutes` ustawić na `null`.

W `CalendarSettingsPage.tsx` sekcja GCal (linia 298-301):
```tsx
<div className="flex items-center justify-between">
  <div><Label>Reminder before lesson</Label><p className="text-xs text-muted-foreground">Get notified before each lesson in Google Calendar</p></div>
  <Switch checked={settings.gcal_default_reminder_minutes !== null && settings.gcal_default_reminder_minutes !== undefined}
    onCheckedChange={v => updateSettings({ gcal_default_reminder_minutes: v ? 30 : null })} />
</div>
{settings.gcal_default_reminder_minutes !== null && settings.gcal_default_reminder_minutes !== undefined && (
  <div className="flex items-center justify-between">
    <Label>Minutes before</Label>
    <Input type="number" className="w-24" value={settings.gcal_default_reminder_minutes} onChange={...} />
  </div>
)}
```

W `gcal-sync/index.ts` `upsert` action:
```ts
reminders: settings?.gcal_default_reminder_minutes
  ? { useDefault: false, overrides: [{ method: 'popup', minutes: settings.gcal_default_reminder_minutes }] }
  : { useDefault: false, overrides: [] },
```

### 4B: Kolory per status zamiast jednego "Event color"

**Migracja SQL:**
```sql
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_color_booked text DEFAULT '9';
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_color_available text DEFAULT '2';
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_color_pending text DEFAULT '5';
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_color_completed text DEFAULT '10';
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_color_no_show text DEFAULT '6';
```

Domyślne kolory GCal:
- Booked: `'9'` (Blueberry = niebieski)
- Available: `'2'` (Sage = zielony)
- Pending: `'5'` (Banana = żółty)
- Completed: `'10'` (Basil = mocny zielony)
- No Show: `'6'` (Tangerine = pomarańczowy)

W `CalendarSettingsPage.tsx` zamienić jeden "Event color" na 5 selectów:
```tsx
{[
  { key: 'gcal_color_booked', label: 'Booked lesson' },
  { key: 'gcal_color_available', label: 'Available slot' },
  { key: 'gcal_color_pending', label: 'Pending booking' },
  { key: 'gcal_color_completed', label: 'Completed lesson' },
  { key: 'gcal_color_no_show', label: 'No Show' },
].map(item => (
  <div key={item.key} className="flex items-center justify-between">
    <Label>{item.label}</Label>
    <Select value={(settings as any)[item.key] || '1'} onValueChange={v => updateSettings({ [item.key]: v } as any)}>
      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
      <SelectContent>{GCAL_COLORS.map(c => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
    </Select>
  </div>
))}
```

Usunąć stary "Event color" select (linia 287-296) i `gcal_default_color`.

W `gcal-sync/index.ts` — pobrać nowe kolumny w select i użyć w upsert/cancel:
```ts
.select('..., gcal_color_booked, gcal_color_available, gcal_color_pending, gcal_color_completed, gcal_color_no_show')
```
W upsert:
```ts
if (!colorOverride) {
  const statusColorMap: Record<string, string> = {
    booked: settings?.gcal_color_booked || '9',
    available: settings?.gcal_color_available || '2',
    pending: settings?.gcal_color_pending || '5',
    completed: settings?.gcal_color_completed || '10',
    no_show: settings?.gcal_color_no_show || '6',
  };
  const isPending = slot.status === 'booked' && !slot.confirmed_at;
  const effectiveStatus = isPending ? 'pending' : slot.status;
  event.colorId = statusColorMap[effectiveStatus] || settings?.gcal_default_color || '9';
}
```

W cancel:
```ts
colorId: settings?.gcal_color_available || '2',
```

W `useCalendarSettings.tsx`:
- Dodać do interface: `gcal_color_booked`, `gcal_color_available`, `gcal_color_pending`, `gcal_color_completed`, `gcal_color_no_show`
- Dodać defaults

### 4C: Ustawienie "On creation Available Slot"

Nowe pole `gcal_sync_mode`:
- `'booked_only'` (domyślne) — sync tylko booked/confirmed lekcji
- `'booked_and_pending'` — sync booked + pending
- `'all'` — sync available + pending + booked

**Migracja SQL:**
```sql
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_sync_mode text DEFAULT 'booked_only';
```

W `CalendarSettingsPage.tsx`:
```tsx
<div className="flex items-center justify-between">
  <div><Label>What to sync</Label><p className="text-xs text-muted-foreground">Which slots appear in Google Calendar</p></div>
  <Select value={(settings as any).gcal_sync_mode || 'booked_only'} onValueChange={v => updateSettings({ gcal_sync_mode: v } as any)}>
    <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="booked_only">Only booked lessons</SelectItem>
      <SelectItem value="booked_and_pending">Booked + pending</SelectItem>
      <SelectItem value="all">All (including available slots)</SelectItem>
    </SelectContent>
  </Select>
</div>
```

W `useCalendarSlots.tsx` `triggerGcalSync` — sprawdzić sync mode przed sync:
```ts
// W createSlot po upsert:
if (gcalEnabled) {
  const slotStatus = updates.student_id ? (updates.confirmed_at ? 'booked' : 'pending') : 'available';
  const shouldSync = syncMode === 'all' || 
    (syncMode === 'booked_and_pending' && slotStatus !== 'available') ||
    (syncMode === 'booked_only' && slotStatus === 'booked');
  if (shouldSync) triggerGcalSync(slotId, 'upsert');
}
```

### 4D: Dodatkowe ustawienia

Nic więcej nie jest teraz konieczne — obecny zestaw (kolory per status, reminder on/off, sync mode, on cancel action) to kompletna konfiguracja. W przyszłości można dodać "Sync existing slots" (jednorazowy bulk sync) ale to inny feature.

**Pliki do zmiany:**
- Migracja SQL (kolory per status, gcal_sync_mode)
- `src/hooks/useCalendarSettings.tsx` — nowe pola w interface i defaults
- `src/pages/CalendarSettingsPage.tsx` — nowe selecty kolorów, reminder toggle, sync mode
- `supabase/functions/gcal-sync/index.ts` — colorOverride, kolory per status, reminder null handling
- `supabase/functions/get-student-bookings/index.ts` — gcal sync po cancellation
- `src/components/calendar/SlotDetailModal.tsx` — gcal sync po Complete/No Show

---

## Problem 5: "Add to Google Calendar" w emailach do ucznia

Standardowe rozwiązanie: wygenerować link `.ics` lub użyć Google Calendar URL API.

**Google Calendar URL format:**
```
https://calendar.google.com/calendar/render?action=TEMPLATE&text=English+Lesson&dates=20260306T110000Z/20260306T120000Z&details=...
```

W `send-calendar-notification-email/index.ts` — dodać helper:
```ts
const generateGcalLink = (title: string, slotDate: string, startTime: string, endTime: string, timezone: string) => {
  // Convert to UTC ISO format for GCal URL
  const start = `${slotDate.replace(/-/g, '')}T${startTime.replace(':', '')}00`;
  const end = `${slotDate.replace(/-/g, '')}T${(endTime || '').replace(':', '')}00`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    ctz: timezone,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
```

W każdym emailu do studenta (booking_confirmation, new_booking_student, reschedule_confirmation, lesson_reminder) dodać przycisk:
```ts
const addToCalendarButton = `<div style="margin-top: 12px;">
  <a href="${generateGcalLink('English Lesson with ' + teacherName, slotDate, slotTime, endTime, timezone)}" 
     target="_blank"
     style="display: inline-block; padding: 8px 20px; background: #4285f4; color: white; border-radius: 6px; text-decoration: none; font-weight: 500;">
    📅 Add to Google Calendar
  </a>
</div>`;
```

Trzeba przekazać `endTime` i `timezone` do edge function — dodać te parametry do wywołań emaili w `SlotDetailModal` i `useCalendarSlots`.

**Pliki:**
- `supabase/functions/send-calendar-notification-email/index.ts` — helper + przycisk w emailach studenckich
- `src/components/calendar/SlotDetailModal.tsx` — dodać `endTime` do parametrów emaili
- `src/hooks/useCalendarSlots.tsx` — dodać `endTime` do email params

---

## Problem 6: Eksport CSV — porządne formatowanie

Aktualny CSV jest minimalistyczny i nie escapuje poprawnie pól. Wszystko ląduje w jednej kolumnie bo separator jest `,` ale Excel w polskich ustawieniach oczekuje `;` lub BOM + UTF-8.

**Fix w `calendar-export-csv/index.ts`:**

1. Dodać BOM na początku (UTF-8 BOM żeby Excel poprawnie rozpoznał encoding):
```ts
const BOM = '\uFEFF';
const csv = BOM + [headers.join(';'), ...rows].join('\r\n');
```

2. Zmienić separator na `;` (uniwersalny dla Excela):
```ts
return [...fields].join(';');
```

3. Dodać więcej kolumn:
```
Date;Day;Start;End;Duration (min);Student;Student Email;Status;Lesson Title;Notes;Paid;Amount;Currency;Payment Method;Confirmed;Confirmed Date;Cancelled By;Cancellation Reason;Meeting Link;Worksheet;Recurring
```

4. Pobrać dodatkowe pola: `cancellation_reason`, `title`, `booking_type`, `recurrence_rule_id` + payment records:
```ts
const { data: payments } = await supabase
  .from('calendar_payment_records')
  .select('slot_id, amount, currency, payment_method')
  .eq('teacher_id', teacherId)
  .in('slot_id', slotIds);
```

5. Dodać dzień tygodnia, czas trwania, kwotę płatności.

6. Dodać `Content-Type: text/csv; charset=utf-8`.

**Plik:** `supabase/functions/calendar-export-csv/index.ts` — pełna przebudowa

---

## Problem 7: Payment Tracking — co brakuje i jak powinno działać

**Obecny stan:** Włączony payment tracking + default price = pojawia się przycisk "💰 28 unpaid" ale:
- Nie ma widoku listy płatności
- Nie widać ile student jest winien
- Nie ma summary

**Plan wdrożenia Payment Dashboard:**

### A. Sekcja w SlotDetailModal — już jest (Mark Paid/Unpaid)

To jest główny mechanizm. Nauczyciel klika slot → widzi sekcję Payment → klika Mark Paid. To już działa (linia 830+). Sprawdźmy:

W `SlotDetailModal.tsx` linia ~830-860 — payment section jest renderowana warunkowo gdy `paymentTrackingEnabled && isBooked`. OK.

### B. Brakuje: Payment Summary Widget na CalendarPage

Dodać rozwijalny panel (Collapsible) pod toolbarem z podsumowaniem:
```tsx
{settings?.payment_tracking_enabled && (
  <Collapsible>
    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
      💰 Payment Summary
    </CollapsibleTrigger>
    <CollapsibleContent className="mt-2 grid grid-cols-3 gap-4">
      <Card className="p-3">
        <p className="text-xs text-muted-foreground">Unpaid lessons</p>
        <p className="text-2xl font-bold text-red-600">{unpaidCount}</p>
        <p className="text-xs text-muted-foreground">Total: {unpaidTotal} {currency}</p>
      </Card>
      <Card className="p-3">
        <p className="text-xs text-muted-foreground">Paid this month</p>
        <p className="text-2xl font-bold text-emerald-600">{paidThisMonth}</p>
        <p className="text-xs text-muted-foreground">Total: {paidAmount} {currency}</p>
      </Card>
      <Card className="p-3">
        <p className="text-xs text-muted-foreground">Total lessons</p>
        <p className="text-2xl font-bold">{totalLessons}</p>
      </Card>
    </CollapsibleContent>
  </Collapsible>
)}
```

Dane: policzyć z `slots` (unpaid = booked+completed+needs_review bez is_paid), pobrać `calendar_payment_records` dla paid count i amount.

### C. Brakuje: Per-student payment info

Na stronie studenta (`/student/:id`) dodać mini-sekcję "Payment":
- Prepaid lessons remaining: X
- Lesson price: Y (override lub default)
- Unpaid lessons: Z
- Link "Mark all as paid"

To wymaga fetchu z `calendar_student_settings` i `calendar_slots`.

### D. Wyjaśnienie dla użytkownika (w UI)

W sekcji Payment Tracking w settings dodać:
```tsx
<p className="text-xs text-muted-foreground">
  When enabled, each lesson shows a "Mark Paid / Unpaid" button. 
  Unpaid lessons appear in the 💰 counter in the calendar toolbar. 
  You can set per-student prices in each student's profile page.
</p>
```

**Pliki:**
- `src/pages/CalendarPage.tsx` — Payment Summary widget
- `src/pages/StudentPage.tsx` — payment mini-section (to jest mniejszy feature, dla MVP wystarczy CalendarPage)
- `src/pages/CalendarSettingsPage.tsx` — dodać opis jak działa

---

## Problem 8: Sticky nagłówek w CalendarSettingsPage

W `CalendarSettingsPage.tsx` linia 149-154 — nagłówek z "← Calendar" i "Calendar Settings":

**Fix:** Dodać `sticky top-0 z-10 bg-background` do diva nagłówka:
```tsx
<div className="flex items-center gap-3 mb-6 sticky top-0 z-10 bg-background py-3 border-b">
```

**Plik:** `src/pages/CalendarSettingsPage.tsx` linia 149

---

## Problem 9: Zmienić etykietę "Select" na "Bulk Delete"

W `CalendarPage.tsx` linia 308:
```tsx
<Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSelectionMode(true)}>
  Bulk Delete
</Button>
```

**Plik:** `src/pages/CalendarPage.tsx` linia 309

---

## Problem 10: Email Alerts — osobne dla nauczyciela i per-student

**Obecny stan:** Sekcja "Email Alerts" w settings ma switche dla obu stron naraz. To powinno być:
- W Calendar Settings: tylko alerty dla nauczyciela (co dostaje nauczyciel)
- Per-student: w profilu studenta, z domyślnie "all on"

### A. Przebudowa Calendar Settings Email section

Zmienić nagłówek na "Your Email Notifications" i dodać info:
```tsx
<CardDescription>
  Email notifications sent to you when calendar events happen. 
  Student email preferences can be configured individually in each student's profile. 
  By default, all students receive all notifications.
</CardDescription>
```

Switche zostawiamy takie same — one kontrolują CZY w ogóle system wysyła maile (dotyczy obu stron). Ale semantycznie powinniśmy rozdzielić:
- `notify_email_on_booking` → do nauczyciela
- `notify_email_on_cancellation` → do nauczyciela
- `notify_email_on_reschedule` → do nauczyciela
- `notify_email_on_confirmation` → do studenta
- `notify_email_on_rejection` → do studenta
- `notify_email_on_lesson_created` → do studenta

Lepsze podejście: nie zmieniać logiki teraz, tylko zaktualizować opisy i dodać notę o per-student settings w przyszłości.

### B. Per-student email settings (future)

Wymagałoby nowej tabeli `calendar_student_email_prefs` i rozbudowy. Na ten moment: dodać info w UI że "By default all students receive notifications. Per-student email preferences coming soon."

**Plik:** `src/pages/CalendarSettingsPage.tsx` linia 398-400 — zmienić opis

---

## Problem 11: Google Meet integration

Google Meet wymaga Google Calendar API z `conferenceDataVersion=1` i `conferenceData` w event body. Gdy nauczyciel ma połączony GCal, możemy automatycznie tworzyć Google Meet link.

### Implementacja:

1. **Migracja SQL:**
```sql
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS auto_create_meet_link boolean DEFAULT false;
```

2. **W `gcal-sync/index.ts`** przy action `'upsert'`, jeśli slot ma studenta i `auto_create_meet_link=true`:
```ts
if (settings?.auto_create_meet_link && slot.student_id) {
  event.conferenceData = {
    createRequest: {
      requestId: slotId,
      conferenceSolutionKey: { type: 'hangoutsMeet' },
    },
  };
}
// I w fetch URL dodać parametr:
const url = slot.gcal_event_id
  ? `...events/${slot.gcal_event_id}?conferenceDataVersion=1`
  : `...events?conferenceDataVersion=1`;
```

3. **Po utworzeniu eventu** — odczytać `created.hangoutLink` i zapisać do `calendar_slots.meeting_link`:
```ts
if (res.ok) {
  const created = await res.json();
  const meetLink = created.hangoutLink || null;
  await supabase.from('calendar_slots').update({ 
    gcal_event_id: created.id,
    meeting_link: meetLink,
  }).eq('id', slotId);
}
```

4. **W CalendarSettingsPage** sekcja GCal:
```tsx
<div className="flex items-center justify-between">
  <div><Label>Auto-create Google Meet</Label><p className="text-xs text-muted-foreground">Automatically generate a Google Meet link for each booked lesson</p></div>
  <Switch checked={(settings as any).auto_create_meet_link || false} onCheckedChange={v => updateSettings({ auto_create_meet_link: v } as any)} />
</div>
```

5. Meeting link automatycznie pojawi się w SlotDetailModal (pole meeting_link już istnieje) i w emailach (meetingButton już jest).

**Pliki:**
- Migracja SQL (`auto_create_meet_link`)
- `supabase/functions/gcal-sync/index.ts` — conferenceData + save meetLink
- `src/pages/CalendarSettingsPage.tsx` — switch
- `src/hooks/useCalendarSettings.tsx` — interface

---

## Migracja SQL (wszystko w jednej)

```sql
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_color_booked text DEFAULT '9';
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_color_available text DEFAULT '2';
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_color_pending text DEFAULT '5';
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_color_completed text DEFAULT '10';
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_color_no_show text DEFAULT '6';
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_sync_mode text DEFAULT 'booked_only';
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS auto_create_meet_link boolean DEFAULT false;
```

---

## Kolejność wdrożenia

1. Migracja SQL
2. Fix dropdown DuplicateWorksheetModal (Problem 2)
3. Sticky header CalendarSettings (Problem 8)
4. "Bulk Delete" label (Problem 9)
5. Email Alerts opis (Problem 10)
6. GCal student cancellation sync (Problem 3A/3B)
7. GCal kolory per status + colorOverride + Complete/NoShow sync (Problem 3C + 4B)
8. GCal reminder toggle + sync mode (Problem 4A/4C)
9. GCal settings UI przebudowa (Problem 4)
10. Google Meet auto-create (Problem 11)
11. GCalStatusButton component + dodanie na stronach (Problem 1)
12. "Add to Google Calendar" w emailach (Problem 5)
13. CSV eksport przebudowa (Problem 6)
14. Payment Summary widget (Problem 7)
15. Deploy edge functions + docs

## Pliki do zmiany

| Plik | Zmiany |
|---|---|
| Migracja SQL | Kolory per status, sync_mode, auto_create_meet_link |
| `src/components/DuplicateWorksheetModal.tsx` | Fix scroll |
| `src/pages/CalendarSettingsPage.tsx` | Sticky header, kolory per status, reminder toggle, sync mode, Meet toggle, email opis |
| `src/pages/CalendarPage.tsx` | "Bulk Delete" label, Payment Summary widget |
| `src/hooks/useCalendarSettings.tsx` | Nowe pola interface + defaults |
| `src/components/calendar/SlotDetailModal.tsx` | GCal sync po Complete/NoShow, endTime w emailach |
| `supabase/functions/gcal-sync/index.ts` | colorOverride, kolory per status, reminder null, conferenceData, meetLink save |
| `supabase/functions/get-student-bookings/index.ts` | GCal sync po student cancellation |
| `supabase/functions/send-calendar-notification-email/index.ts` | "Add to Google Calendar" button |
| `supabase/functions/calendar-export-csv/index.ts` | Przebudowa CSV (BOM, separator, więcej kolumn) |
| Nowy: `src/components/calendar/GCalStatusButton.tsx` | Reużywalny przycisk |
| `src/components/worksheet/WorksheetToolbar.tsx` | GCalStatusButton |
| `src/components/WorksheetForm/index.tsx` | GCalStatusButton |
| `src/pages/StudentPage.tsx` | GCalStatusButton |

