

# Plan: Runda napraw #10

---

## Problem 1: Przycisk Calendar w złym miejscu na formularz i worksheet

**Obecny stan:**
- `WorksheetForm/index.tsx` linia 339: `<GCalStatusButton />` jest pod tytułem "Create A Worksheet" (pod opisem)
- `WorksheetToolbar.tsx` linia 266: `<GCalStatusButton />` jest na początku paska z przyciskami Student/Teacher/Live Session — mieszając się z przyciskami widoku

**Wymaganie:** Przycisk ma być na górze obok Dashboard i Profile (tak jak na `/student`)

**Analiza:** Na `/student` (linia 221-222) `GCalStatusButton` jest w headerze obok "Generate New Worksheet". Na formularz i worksheet nie ma przycisków Dashboard/Profile w widocznym miejscu — trzeba je dodać albo umieścić Calendar obok istniejącej nawigacji.

**Fix — WorksheetToolbar.tsx:**
Przenieść `<GCalStatusButton />` z linii 266 (wewnątrz paska Student/Teacher) do nowego wiersza NAD paskiem, na wysokości nagłówka. Dodać mały pasek nawigacyjny na górze z przyciskami: Dashboard | Calendar (tak jak Sidebar robi na desktop, ale inline na toolbar):

```tsx
// Linia 263 — dodać NAD istniejącym divem z przyciskami widoku:
<div className="flex items-center justify-between max-w-[98%] mx-auto mb-1">
  <div className="flex items-center gap-2">
    <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
      <Link to="/dashboard">Dashboard</Link>
    </Button>
    <GCalStatusButton />
  </div>
</div>
```

Usunąć `<GCalStatusButton />` z linii 266.

**Fix — WorksheetForm/index.tsx:**
Przenieść `<GCalStatusButton />` z linii 339 (pod opisem) do poziomu nagłówka formularza. Dodać mały wiersz nawigacyjny nad tytułem "Create A Worksheet":

```tsx
// Przed divem z tytułem (linia 331), dodać:
<div className="flex items-center gap-2 mb-2">
  <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
    <Link to="/dashboard">Dashboard</Link>
  </Button>
  <GCalStatusButton />
</div>
```

Usunąć `<div className="mt-1"><GCalStatusButton /></div>` z linii 339.

**Pliki:**
- `src/components/worksheet/WorksheetToolbar.tsx` — przenieść GCalStatusButton na górę
- `src/components/WorksheetForm/index.tsx` — przenieść GCalStatusButton na górę

---

## Problem 2A: Event colors dropdown za wąski

**Obecny stan:** `CalendarSettingsPage.tsx` linia 313: `<SelectTrigger className="w-40">` — 10rem = ~160px. Z kółkiem kolorowym + nazwą koloru + ikoną selecta jest ciasno.

**Fix:** Zmienić `w-40` na `w-48` (12rem = 192px):
```tsx
<SelectTrigger className="w-48">
```

**Plik:** `src/pages/CalendarSettingsPage.tsx` linia 313

---

## Problem 2B: Usunąć fałszywą informację z emailu

**Obecny stan:** Linia 567-569:
```tsx
<div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground">
  💡 You can customize email preferences for each student individually in their profile page (Student → Overview tab → Payment & Meeting card).
</div>
```

To jest nieprawda bo na profilu ucznia nie ma takich ustawień.

**Fix:** Usunąć ten div (linie 567-569) lub zamienić na:
```tsx
<div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground">
  💡 By default, all students receive email notifications for confirmations, rejections, and new lessons. Per-student email preferences will be available in a future update.
</div>
```

**Plik:** `src/pages/CalendarSettingsPage.tsx` linia 567-569

---

## Problem 2C: Pending bookings nie dodają się do GCal

**Root cause:** Booking studenta odbywa się w `usePublicBooking.tsx` (linia 116-131) — update bezpośrednio przez Supabase client (RLS). Po tym NIE MA żadnego wywołania `gcal-sync`. Analogicznie w `get-student-bookings/index.ts` action `book_batch` — też brak gcal sync.

Nauczycielski `createSlot` w `useCalendarSlots.tsx` MA sync (linia 300-309), ale tam warunek sprawdza `gcal_sync_booked` dla slotów z `student_id`, a `gcal_sync_pending` nigdy nie jest sprawdzane!

**Fix 1 — `usePublicBooking.tsx`:** Po linii 220 (po `await fetchSlots()`), dodać GCal sync:

```tsx
// GCal sync for student booking
try {
  const { data: syncSettings } = await supabase.from('calendar_settings')
    .select('gcal_sync_booked, gcal_sync_pending, gcal_integration_enabled')
    .eq('teacher_id', settings.teacher_id).maybeSingle();
  
  if (syncSettings?.gcal_integration_enabled) {
    const isPending = !autoConfirm;
    const shouldSync = isPending 
      ? (syncSettings as any).gcal_sync_pending !== false 
      : (syncSettings as any).gcal_sync_booked !== false;
    if (shouldSync) {
      supabase.functions.invoke('gcal-sync', {
        body: { teacherId: settings.teacher_id, slotId, action: 'upsert' },
      }).catch(console.error);
    }
  }
} catch (e) { console.error('GCal sync error:', e); }
```

**Fix 2 — `useCalendarSlots.tsx`:** Linia 304-308 — dodać sprawdzenie `gcal_sync_pending`. Obecna logika:
```ts
const shouldSync = 
  (input.student_id && (syncSettings as any).gcal_sync_booked !== false) ||
  (!input.student_id && (syncSettings as any).gcal_sync_available_new === true);
```

Zmienić na:
```ts
const isPendingSlot = input.student_id && !input.confirmed_at;
const isBookedSlot = input.student_id && !!input.confirmed_at;
const shouldSync = 
  (isBookedSlot && (syncSettings as any).gcal_sync_booked !== false) ||
  (isPendingSlot && (syncSettings as any).gcal_sync_pending !== false) ||
  (!input.student_id && (syncSettings as any).gcal_sync_available_new === true);
```

Ale UWAGA: `createSlot` z UI nauczyciela zawsze daje `confirmed_at` (bo nauczyciel tworzy potwierdzoną lekcję). Więc istniejąca logika jest OK dla nauczyciela — ale brak `gcal_sync_pending` oznacza że gdyby ktoś w przyszłości tworzył pending z UI, nie syncowałoby się. Dodać ten warunek na wszelki wypadek.

**Fix 3 — `get-student-bookings/index.ts`:** Dodać GCal sync po `book_batch` (linia ~397-402, po każdym udanym bookingu) i po single booking jeśli takie action istnieje. Ale single booking odbywa się przez RLS w `usePublicBooking`, nie przez edge function. Więc wystarczy fix w `usePublicBooking`.

Dla `book_batch` — po linii 402 (po `successIds.push(sid)`), dodać:
```ts
// GCal sync for batch booking
const { data: syncCfg } = await supabase.from('calendar_settings')
  .select('gcal_sync_booked, gcal_sync_pending, gcal_integration_enabled')
  .eq('teacher_id', teacherId).maybeSingle();

if (syncCfg?.gcal_integration_enabled && successIds.length > 0) {
  const shouldSync = autoConfirm 
    ? syncCfg.gcal_sync_booked !== false 
    : syncCfg.gcal_sync_pending !== false;
  if (shouldSync) {
    for (const sid of successIds) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/gcal-sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
          body: JSON.stringify({ teacherId, slotId: sid, action: 'upsert' }),
        });
      } catch (_) {}
    }
  }
}
```

**Pliki:**
- `src/hooks/usePublicBooking.tsx` — dodać GCal sync po booking
- `src/hooks/useCalendarSlots.tsx` — dodać `gcal_sync_pending` check
- `supabase/functions/get-student-bookings/index.ts` — dodać GCal sync po `book_batch`

---

## Problem 3: Usunąć Payment & Meeting z /student overview

**Fix:** W `StudentPage.tsx` usunąć linię 395:
```tsx
<StudentPaymentMeetingCard studentId={student.id} teacherId={student.teacher_id} />
```

Usunąć też import (linia 51).

**3A: Wyszarzyć Payment w Calendar Settings**

W `CalendarSettingsPage.tsx` linia 448-451, zamienić switch Payment na disabled z info:
```tsx
<div className="flex items-center justify-between">
  <div>
    <Label className="text-muted-foreground">Enable Payment Tracking</Label>
    <p className="text-xs text-muted-foreground">Payment tracking is currently in development and will be available soon.</p>
  </div>
  <Switch checked={settings.payment_tracking_enabled} disabled className="opacity-50" />
</div>
```

Ukryć też resztę sekcji (price, currency) gdy disabled — ale payment_tracking_enabled zachować w bazie.

**3B: Meeting Link — Google Meet auto-create**

Jeśli nauczyciel włączy "Auto-create Google Meet" w settings, każdy student na `/my` ma mieć widoczny `meeting_link` z lekcji. To JUŻ działa — `gcal-sync` tworzy meet link i zapisuje w `calendar_slots.meeting_link`. Na dashboardzie studenta (`StudentHubDashboard.tsx`) jest przycisk "Join Meeting" jeśli `meeting_link` istnieje.

Ale chcesz żeby był **ten sam link** dla danego ucznia (stały pokój). To wymaga `default_meeting_link` z `calendar_student_settings`. Gdy nauczyciel ustawi ten link w profilu studenta, jest on automatycznie wstawiany do nowych slotów (`useCalendarSlots.tsx` już to robi).

**Problem:** Gdzie nauczyciel ustawi `default_meeting_link` skoro usuwamy `StudentPaymentMeetingCard`?

**Rozwiązanie:** Dodać pole "Default Meeting Link" bezpośrednio w sekcji "Student Details" na karcie overview w `/student`. Prosty input pod emailem:

```tsx
// W StudentPage.tsx, w sekcji Student Details (po email field, ~linia 370):
<div className="flex items-center gap-2">
  <Video className="h-4 w-4 text-muted-foreground" />
  <div className="flex-1">
    <Label className="text-xs text-muted-foreground">Default Meeting Link</Label>
    <Input 
      value={defaultMeetingLink} 
      onChange={e => setDefaultMeetingLink(e.target.value)}
      placeholder="https://meet.google.com/..."
      className="h-8 text-sm"
      onBlur={handleSaveMeetingLink}
    />
  </div>
</div>
```

Logika save: upsert do `calendar_student_settings` (student_id + teacher_id).

Na stronie `/my` studenta i na `/book`, jeśli lekcja ma `meeting_link` — przycisk "Join Meeting" jest widoczny (to już działa).

Na emailach i kafelkach lekcji na `/book` — `meeting_link` ze slotu jest już pokazywany (istniejący kod).

**Pliki:**
- `src/pages/StudentPage.tsx` — usunąć `StudentPaymentMeetingCard`, dodać Meeting Link input w Student Details
- `src/pages/CalendarSettingsPage.tsx` — wyszarzyć Payment

---

## Problem 4: Student GCal sync w panelu /my

**Pełna analiza:** Student NIE MA konta Google w naszym systemie. Ale MOŻEMY to zrobić! Potrzebujemy:

### 4A: Nowa tabela `student_gcal_tokens`

```sql
CREATE TABLE student_gcal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email text NOT NULL,
  teacher_id uuid NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  gcal_calendar_id text DEFAULT 'primary',
  settings jsonb DEFAULT '{"reminder_minutes": 30, "color_id": "9", "auto_add": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (student_email, teacher_id)
);

-- RLS: dostęp publiczny do odczytu/zapisu (student nie ma auth usera, edge function używa service role)
ALTER TABLE student_gcal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages student gcal tokens" ON student_gcal_tokens
  FOR ALL USING (true) WITH CHECK (true);
```

### 4B: Nowe Edge Functions

**`student-gcal-auth-start`** — generuje URL OAuth Google dla studenta:
- Parametry: `{ email, teacherToken }`
- Generuje `state` = JSON.stringify({ email, teacherToken })
- Redirect URI: `{origin}/my/{teacherToken}?gcal_callback=true`
- Scope: `https://www.googleapis.com/auth/calendar.events`
- Zwraca URL do Google OAuth

**`student-gcal-auth-callback`** — przetwarza callback:
- Parametry: `{ code, email, teacherToken }`
- Wymienia code na tokeny
- Zapisuje do `student_gcal_tokens`

**`student-gcal-sync`** — dodaje/aktualizuje event w GCal studenta:
- Parametry: `{ email, teacherId, slotId, action }` (upsert/delete)
- Pobiera token studenta, odświeża jeśli expired
- Tworzy event w kalendarzu studenta z ustawieniami (kolor, reminder)
- Wywoływany automatycznie po booking/confirmation/cancellation

### 4C: Sekcja Settings w Student Hub

Nowa podstrona `/my/:teacherToken/settings` lub sekcja w dashboardzie:

```
🗓️ Google Calendar Sync

Connect your Google Calendar to automatically add lessons to your calendar.

[Connect Google Calendar]  ← przycisk uruchamiający OAuth flow

--- jeśli połączony: ---

✅ Connected to Google Calendar

Settings:
- Auto-add lessons to calendar: [Toggle ON/OFF]
- Reminder before lesson: [Input: 30] minutes
- Event color: [Color picker - same as teacher's]
- Calendar: [Primary / Other calendars - future]

[Disconnect]
```

### 4D: Automatyczny sync

Po każdym booking/confirmation/cancellation, oprócz nauczycielskiego `gcal-sync`, wywołać `student-gcal-sync` jeśli student ma połączone konto:

W `usePublicBooking.tsx` po booking:
```ts
// Student GCal auto-sync
supabase.functions.invoke('student-gcal-sync', {
  body: { email: normalizedEmail, teacherId: settings.teacher_id, slotId, action: 'upsert' },
}).catch(console.error);
```

W `SlotDetailModal.tsx` po confirmation/rejection.
W `get-student-bookings/index.ts` po cancellation.

### 4E: Routing i nawigacja

Dodać "Settings" do `NAV_ITEMS` w `StudentHubLayout.tsx`:
```ts
{ key: 'settings', label: 'Settings', icon: Settings },
```

Nowa strona: `src/pages/StudentHubSettings.tsx`
Nowy route: `/my/:teacherToken/settings`

### Jakie jeszcze ustawienia dla studenta?

- **Timezone** — żeby daty i godziny były wyświetlane w strefie studenta (przydatne gdy student jest w innej strefie niż nauczyciel)
- **Language** — w przyszłości, preferencja języka interfejsu
- **Notification preferences** — email on/off per event type

Ale na MVP wystarczą: GCal sync + reminder + kolor + auto-add toggle.

---

## Pliki do zmiany — podsumowanie

| Plik | Zmiana |
|---|---|
| `src/components/worksheet/WorksheetToolbar.tsx` | Przenieść GCalStatusButton na górę z Dashboard |
| `src/components/WorksheetForm/index.tsx` | Przenieść GCalStatusButton na górę z Dashboard |
| `src/pages/CalendarSettingsPage.tsx` | Dropdown w-48, usunąć fałszywą info, wyszarzyć Payment |
| `src/hooks/usePublicBooking.tsx` | Dodać GCal sync po booking (pending + confirmed) |
| `src/hooks/useCalendarSlots.tsx` | Dodać `gcal_sync_pending` check |
| `supabase/functions/get-student-bookings/index.ts` | Dodać GCal sync po `book_batch` |
| `src/pages/StudentPage.tsx` | Usunąć `StudentPaymentMeetingCard`, dodać Meeting Link input |
| Migracja SQL | Tabela `student_gcal_tokens` |
| Nowy: `supabase/functions/student-gcal-auth-start/index.ts` | OAuth start dla studenta |
| Nowy: `supabase/functions/student-gcal-auth-callback/index.ts` | OAuth callback |
| Nowy: `supabase/functions/student-gcal-sync/index.ts` | Sync lekcji do GCal studenta |
| Nowy: `src/pages/StudentHubSettings.tsx` | Strona ustawień studenta |
| `src/components/student-hub/StudentHubLayout.tsx` | Dodać Settings do nav |
| `src/App.tsx` | Dodać route `/my/:teacherToken/settings` |

## Kolejność wdrożenia

1. Migracja SQL (student_gcal_tokens)
2. GCalStatusButton pozycja (Problem 1)
3. Color dropdown width + fałszywa info (Problem 2A, 2B)
4. Payment wyszarzenie + usunięcie z /student (Problem 3)
5. Meeting Link input na /student (Problem 3B)
6. Pending GCal sync fix (Problem 2C) — usePublicBooking, useCalendarSlots, get-student-bookings
7. Student GCal edge functions (Problem 4B)
8. Student Hub Settings page (Problem 4C)
9. Auto-sync hooks (Problem 4D)
10. Deploy edge functions + docs update

