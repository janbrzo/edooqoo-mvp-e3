

# Plan: Runda napraw #9

## Problem 1A: Flashcards Study → Quit wraca na `/my-flashcards/email` zamiast na Student Hub

**Diagnoza:** W `SessionSummary.tsx` linia 19, `handleBackToDashboard` nawiguje do `/my-flashcards/${encodeURIComponent(studentEmail)}`. Nie wie, że user przyszedł z Student Hub.

**Fix:** Przekazać przez URL parametr `returnTo`. W `StudentHubFlashcards.tsx` (linia 56, 60) dodać `&returnTo=/my/${teacherToken}/flashcards` do linków study/browse. W `FlashcardsLearning.tsx` odczytać `searchParams.get('returnTo')` i przekazać do `SessionSummary`. W `SessionSummary.tsx` — jeśli `returnTo` istnieje, nawigować tam zamiast na `/my-flashcards/...`. Analogicznie przycisk „Quit" (X) w `FlashcardsLearning.tsx` (linia ~95) też powinien nawigować na `returnTo` jeśli jest.

**Pliki:**
- `src/pages/StudentHubFlashcards.tsx` — dodać `&returnTo=...` w URL
- `src/pages/FlashcardsLearning.tsx` — odczytać `returnTo`, przekazać do SessionSummary, użyć w quit
- `src/components/flashcards/SessionSummary.tsx` — dodać prop `returnTo?`, użyć go w `handleBackToDashboard`

---

## Problem 1B: Zakładka Lessons w Student Hub nie ma opcji bookingowych jak /book

**Diagnoza:** `StudentHubLessons.tsx` używa `StudentBookingsSection` ale przekazuje `availableSlots={[]}` i nie ma sekcji z dostępnymi slotami ani formularzem bookingowym. Na `/book` jest pełny widok z dostępnymi slotami, formularzem emailowym, booking dialogiem.

**Fix:** W `StudentHubLessons.tsx` zreużytkować logikę z `PublicBookingPage.tsx`. Ponieważ student hub ma już email, trzeba:
1. Pobrać sloty available z `calendar_slots` dla danego nauczyciela (po tokenie) — użyć istniejącego `usePublicBooking` hooka
2. Przekazać `availableSlots` do `StudentBookingsSection`
3. Dodać sekcję z dostępnymi slotami na górze (grid tygodniowy jak na `/book`) — reużyć logikę renderowania slotów z `PublicBookingPage`
4. Dodać booking dialog (modal potwierdzenia rezerwacji)

Prostsze podejście: zamienić `StudentHubLessons.tsx` na wrapper który renderuje główną część `PublicBookingPage` w kontekście Student Hub Layout. Użyć `usePublicBooking(teacherToken)` i wyrenderować ten sam UI co na `/book/:token`, ale w `StudentHubLayout` i z pre-filled email.

**Pliki:**
- `src/pages/StudentHubLessons.tsx` — przebudowa: użyć `usePublicBooking`, renderować dostępne sloty + bookings

---

## Problem 2: Przycisk GCal — zmiana zachowania

**Obecny stan:** `GCalStatusButton` na stronach worksheet/student:
- Zalogowany + connected: badge "GCal Synced"
- Zalogowany + not connected: przycisk "Connect GCal" → settings
- Niezalogowany: disabled "Google Calendar"

**Nowe wymagania:**
- A) Zalogowany: przycisk **"Calendar"** nawigujący do `/calendar` (NIE sync) — niezależnie od stanu GCal
- B) "Connect GCal" ma być TYLKO na `/calendar` (już jest)
- C) Lokalizacja: na górze obok Dashboard/Profile
- D) Niezalogowany: disabled z ikoną Google + tooltip o sync + info o kalendarzu

**Fix:** Przerobić `GCalStatusButton.tsx`:
```tsx
export function GCalStatusButton() {
  const { user, isRegisteredUser } = useAuthFlow();
  const navigate = useNavigate();

  if (!isRegisteredUser) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" disabled className="opacity-50 text-xs h-8">
            <img src="google-calendar-icon" className="h-3.5 w-3.5 mr-1" /> Calendar
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>Use the Calendar for teachers after logging in. You can also sync it with Google Calendar.</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => navigate('/calendar')}>
      🗓️ Calendar
    </Button>
  );
}
```

Przenieść umiejscowienie na górę obok Dashboard/Profile w: `WorksheetToolbar`, `WorksheetForm/index.tsx`, `StudentPage.tsx`. Usunąć z losowych miejsc.

**Pliki:**
- `src/components/calendar/GCalStatusButton.tsx` — przerobienie
- `src/components/worksheet/WorksheetToolbar.tsx` — przesunięcie na górę
- `src/components/WorksheetForm/index.tsx` — przesunięcie na górę
- `src/pages/StudentPage.tsx` — przesunięcie na górę

---

## Problem 3: Przycisk Export przenieść do Calendar Settings

**Fix:** W `CalendarPage.tsx` usunąć przycisk Export (linia 328-330). W `CalendarSettingsPage.tsx` dodać sekcję "Data Export" z przyciskiem Export CSV (ta sama logika `handleExport`).

**Pliki:**
- `src/pages/CalendarPage.tsx` — usunąć przycisk Export
- `src/pages/CalendarSettingsPage.tsx` — dodać sekcję Export z przyciskiem

---

## Problem 4A: Wizualne kółka kolorowe przy wyborze kolorów GCal

**Fix:** Zdefiniować mapę kolorów GCal → hex:
```ts
const GCAL_COLOR_HEX: Record<string, string> = {
  '1': '#7986cb', '2': '#33b679', '3': '#8e24aa', '4': '#e67c73',
  '5': '#f6bf26', '6': '#f4511e', '7': '#039be5', '9': '#3f51b5',
  '10': '#0b8043', '11': '#d50000',
};
```

W selectach kolorów w `CalendarSettingsPage.tsx` dodać kółko:
```tsx
<SelectItem key={c.v} value={c.v}>
  <span className="flex items-center gap-2">
    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: GCAL_COLOR_HEX[c.v] }} />
    {c.l}
  </span>
</SelectItem>
```

Analogicznie w `SelectTrigger` — pokazać kółko obok wybranej wartości.

**Plik:** `src/pages/CalendarSettingsPage.tsx`

---

## Problem 4B: Sync mode — zamienić dropdown na osobne toggle'e

**Obecny:** Jeden select z opcjami "booked_only", "booked_and_pending", "all".

**Nowy:** 4 osobne toggle/switch:
1. **Booked lessons** — domyślnie ON
2. **Pending bookings** — domyślnie ON  
3. **Available slots (when you create them)** — domyślnie OFF
4. **Available slots (after cancellation)** — domyślnie ON

**Migracja SQL:** Zastąpić kolumnę `gcal_sync_mode text` czterema boolami:
```sql
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_sync_booked boolean DEFAULT true;
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_sync_pending boolean DEFAULT true;
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_sync_available_new boolean DEFAULT false;
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_sync_available_on_cancel boolean DEFAULT true;
```

W `CalendarSettingsPage.tsx` zamienić select na 4 switche z opisami.

W `useCalendarSettings.tsx` dodać nowe pola do interface i defaults.

W `useCalendarSlots.tsx` `createSlot` — sprawdzić odpowiedni flag przed gcal sync:
```ts
const slotStatus = input.student_id ? 'booked' : 'available';
const shouldSync = 
  (slotStatus === 'booked' && settings.gcal_sync_booked) ||
  (slotStatus === 'available' && settings.gcal_sync_available_new);
```

W `gcal-sync/index.ts` cancel action — sprawdzić `gcal_sync_available_on_cancel`.

**Pliki:**
- Migracja SQL
- `src/hooks/useCalendarSettings.tsx`
- `src/pages/CalendarSettingsPage.tsx`
- `src/hooks/useCalendarSlots.tsx`
- `supabase/functions/gcal-sync/index.ts`

---

## Problem 4C: Enable Public Calendar domyślnie ON

**Fix:** W `useCalendarSettings.tsx` zmienić default `public_calendar_enabled: true` (linia w DEFAULT_SETTINGS). Ponadto w `fetchSettings` przy tworzeniu nowych settings (`insert`) automatycznie generować token:
```ts
const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
const { data: newData } = await supabase.from('calendar_settings')
  .insert({ teacher_id: teacherId, ...DEFAULT_SETTINGS, public_calendar_enabled: true, public_calendar_token: token })
  .select().single();
```

**Plik:** `src/hooks/useCalendarSettings.tsx`

---

## Problem 5A: GCal sync dla pending i available slots

**Diagnoza:** W `useCalendarSlots.tsx` `createSlot` (linia 287): `if (input.student_id) triggerGcalSync(data.id, 'upsert')` — sync TYLKO gdy jest student. Available sloty nie są syncowane. Pending sloty (booked bez confirmed_at) też powinny.

**Fix:** Zmienić warunek w `createSlot`:
```ts
// Po await fetchSlots()
const slotStatus = input.student_id ? (input.status === 'booked' ? 'booked' : 'booked') : 'available';
// Fetch settings to check sync flags
const { data: syncSettings } = await supabase.from('calendar_settings')
  .select('gcal_sync_booked, gcal_sync_pending, gcal_sync_available_new, gcal_integration_enabled')
  .eq('teacher_id', teacherId).maybeSingle();
  
if (syncSettings?.gcal_integration_enabled) {
  const shouldSync = 
    (input.student_id && syncSettings.gcal_sync_booked) ||
    (!input.student_id && syncSettings.gcal_sync_available_new);
  if (shouldSync) triggerGcalSync(data.id, 'upsert');
}
```

Analogicznie w `createSlotsBatch`.

**Plik:** `src/hooks/useCalendarSlots.tsx`

---

## Problem 5B: Status suffix w nazwie GCal eventu

**Fix:** W `gcal-sync/index.ts` action `upsert`, dodać suffix statusu do `summary`:
```ts
const statusSuffix: Record<string, string> = {
  booked: '— Booked',
  completed: '— Complete',
  no_show: '— No Show',
  cancelled: '— Teacher Cancellation',
  available: '', // brak suffixu
};
// Jeśli slot miał cancellation
if (slot.cancelled_by === 'student') statusSuffix['available'] = '— Student Cancellation';
if (slot.cancelled_by === 'teacher') statusSuffix['available'] = '— Teacher Cancellation';

const isPending = slot.status === 'booked' && !slot.confirmed_at;
const effectiveStatus = isPending ? 'pending' : slot.status;
const suffix = effectiveStatus === 'available' && slot.cancelled_by 
  ? (slot.cancelled_by === 'student' ? ' — Student Cancellation' : ' — Teacher Cancellation')
  : (statusSuffix[effectiveStatus] || '');

summary = summary + suffix;
```

W cancel action:
```ts
summary: `Available Slot — English Lesson — ${slot.cancelled_by === 'student' ? 'Student' : 'Teacher'} Cancellation`,
```

**Plik:** `supabase/functions/gcal-sync/index.ts`

---

## Problem 5.1: Email "Add to Google Calendar" — zły end time

**Diagnoza:** W `send-calendar-notification-email/index.ts` linia 68: `endTime || slotTime` — jeśli `endTime` nie jest przekazany, używa `slotTime` (start = end → 0 minut). Problem: `endTime` NIE JEST PRZEKAZYWANY w wielu wywołaniach email.

**Fix:** We wszystkich wywołaniach `send-calendar-notification-email` dodać `endTime`:

1. `SlotDetailModal.tsx` `sendCalendarEmail` (linia 385): dodać `endTime: slot.end_time.slice(0, 5)` do body
2. `SlotDetailModal.tsx` `new_booking_student` email (linia 319): dodać `endTime: editEndTime`
3. `useCalendarSlots.tsx` `new_booking_student` email (linia 273): dodać `endTime: input.end_time.slice(0, 5)`
4. `get-student-bookings/index.ts` — wszelkie emaile tam wywoływane: dodać `endTime: slot.end_time`

Dodać też `timezone` ze settings do każdego wywołania.

**Pliki:**
- `src/components/calendar/SlotDetailModal.tsx`
- `src/hooks/useCalendarSlots.tsx`
- `supabase/functions/get-student-bookings/index.ts`

---

## Problem 5.2: Student Hub — ustawienia GCal dla studenta

**Diagnoza:** Student nie ma konta Google w naszym systemie. NIE MOŻEMY zrobić pełnej integracji OAuth GCal dla studenta (wymagałoby to osobnego flow OAuth, tabeli tokenów dla studentów, itd.).

**Realistyczne rozwiązanie:** Sekcja "Settings" w Student Hub z:
- Przycisk/toggle "Auto-add lessons to Google Calendar" — NIE jest prawdziwym sync, tylko dodaje `?openExternalBrowser=1` do linków "Add to GCal" w emailach
- Link do instrukcji jak manualnie dodawać wydarzenia
- Kolor i minuty powiadomień — te mogą być parametrami w linku GCal URL (parametr `reminder` nie jest wspierany w URL API, ale `dates` i `text` tak)

**Prostsze rozwiązanie:** Na dashboardzie studenta w sekcji "Next Lesson" dodać przycisk "📅 Add to Google Calendar" generujący link GCal URL (ten sam co w emailu). W Settings dodać notę: "To automatically sync lessons with Google Calendar, use the 'Add to Google Calendar' button on each lesson card."

**Pliki:**
- `src/pages/StudentHubDashboard.tsx` — dodać przycisk "Add to GCal" na lesson cards
- Nowa podstrona `src/pages/StudentHubSettings.tsx` — settings placeholder z instrukcją

---

## Problem 5 (Payment Tracking): Kompletna przebudowa

**Obecny stan:** 
- Settings: Enable, Default Price, Currency ✓
- SlotDetailModal: Mark Paid/Unpaid, payment record ✓
- CalendarPage: "💰 X unpaid" button ✓
- Payment Summary widget (collapsible) ✓
- **Brakuje:** widoku listy płatności, per-student balance, mark batch as paid, payment history

**Plan pełnego Payment Tracking:**

### A. Dodać link Meeting w modalu lekcji (obecne) — meeting link input jest w stanie ale NIE JEST renderowany
W `SlotDetailModal.tsx` dodać pole Meeting Link:
```tsx
<div>
  <Label className="text-xs">Meeting Link</Label>
  <Input value={editMeetingLink} onChange={e => setEditMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." className="h-9 text-xs" />
</div>
```

### B. Payment Summary na CalendarPage — już istnieje, sprawdzić czy działa

### C. Per-student payment mini-sekcja na StudentPage
Na `/student/:id` dodać kartę "Payment":
```
Lesson price: 50 USD (override: 60 USD)
Prepaid lessons: 3
Unpaid lessons: 5 (total: 250 USD)
[Mark all as paid] [Payment history]
```

### D. Payment History — nowa karta/sekcja w CalendarSettings
Lista ostatnich `calendar_payment_records` z filtrami per student, sortowanie, sumy.

### E. Bulk "Mark as Paid" 
W CalendarPage — po kliknięciu "💰 X unpaid" otworzyć modal z listą unpaid lekcji + checkbox + "Mark selected as paid".

**Pliki:**
- `src/components/calendar/SlotDetailModal.tsx` — dodać Meeting Link input
- `src/pages/StudentPage.tsx` — dodać payment sekcję
- `src/pages/CalendarPage.tsx` — bulk mark paid modal
- Nowy komponent: `src/components/calendar/PaymentHistoryModal.tsx`

---

## Problem 10: Email Alerts — rozdzielenie nauczyciel/student

**Fix:** W `CalendarSettingsPage.tsx` sekcja Email:
- Zmienić tytuł na "Your Email Notifications"
- Podzielić switche na dwie grupy:
  - **"Emails to you"**: on booking, on cancellation, on reschedule
  - **"Emails to students" (global default)**: on confirmation, on rejection, on lesson created
- Dodać notę: "You can customize email preferences per student in their profile. By default all students receive all notifications."

**Plik:** `src/pages/CalendarSettingsPage.tsx`

---

## Problem 11: Google Meet — brak widoczności w modalu i emailu

**Diagnoza:**
1. Meeting Link input NIE JEST renderowany w `SlotDetailModal` (state istnieje ale brak UI)
2. W emailu `meetingLink` jest przekazywany tylko z `SlotDetailModal.sendCalendarEmail` — ale meeting link jest generowany przez `gcal-sync` DOPIERO PO zapisaniu slotu. Więc w momencie wysyłania emaila meeting link jeszcze nie istnieje.
3. Na `/book` meeting link jest widoczny (istniejący kod)

**Fix A: Dodać Meeting Link input do SlotDetailModal UI**
Po polu Notes (linia 784), dodać:
```tsx
{hasStudent && (
  <div>
    <Label className="text-xs flex items-center gap-1">
      <Video className="h-3 w-3" /> Meeting Link
    </Label>
    <Input value={editMeetingLink} onChange={e => setEditMeetingLink(e.target.value)} 
      placeholder="https://meet.google.com/..." className="h-9 text-xs" />
    {editMeetingLink && (
      <Button variant="link" size="sm" className="h-6 p-0 text-xs" onClick={() => window.open(editMeetingLink, '_blank')}>
        Join Meeting ↗
      </Button>
    )}
  </div>
)}
```

**Fix B: Stały link Meet per student**
Google Meet nie wspiera "pokojów" bez Google Workspace. Alternatywa: w `calendar_student_settings` dodać kolumnę `default_meeting_link text` — nauczyciel ustawia stały link meet/zoom/teams per student. Ten link jest automatycznie wstawiany do nowych slotów przy tworzeniu.

**Migracja SQL:**
```sql
ALTER TABLE calendar_student_settings ADD COLUMN IF NOT EXISTS default_meeting_link text;
```

W `useCalendarSlots.tsx` `createSlot` — jeśli `student_id` i brak explicit `meeting_link`, pobrać `default_meeting_link` z `calendar_student_settings` i wstawić:
```ts
if (input.student_id && !input.meeting_link) {
  const { data: studentSettings } = await supabase.from('calendar_student_settings')
    .select('default_meeting_link').eq('student_id', input.student_id).eq('teacher_id', teacherId).maybeSingle();
  if (studentSettings?.default_meeting_link) {
    insertData.meeting_link = studentSettings.default_meeting_link;
  }
}
```

**Fix C: Przycisk "Join Meeting" na Student Hub i /book**
Na dashboardzie studenta (`StudentHubDashboard.tsx`) w sekcji "Next Lesson", jeśli `meeting_link` istnieje:
```tsx
<Button onClick={() => window.open(lesson.meeting_link, '_blank')}>
  <Video className="h-3.5 w-3.5 mr-1" /> Join Meeting
</Button>
```

Na `/book` — przycisk "Have a lesson now? Join Meeting" jeśli istnieje upcoming lesson z meeting_link w ciągu 15 minut.

**Pliki:**
- `src/components/calendar/SlotDetailModal.tsx` — dodać Meeting Link input
- Migracja SQL (default_meeting_link)
- `src/hooks/useCalendarSlots.tsx` — auto-fill meeting link z student settings
- `src/pages/StudentHubDashboard.tsx` — Join Meeting button
- `src/pages/StudentPage.tsx` — pole default meeting link w ustawieniach studenta

---

## Problem 12: Auto-create Google Meet — osobna sekcja w settings

**Fix:** W `CalendarSettingsPage.tsx` przenieść switch "Auto-create Google Meet" do osobnej karty/sekcji z obszernym opisem:

```tsx
<Card id="google-meet">
  <CardHeader>
    <CardTitle className="text-lg">Google Meet Integration</CardTitle>
    <CardDescription>Automatically generate video meeting links for lessons</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <Label>Auto-create Google Meet links</Label>
        <p className="text-xs text-muted-foreground">Disabled by default. Enable to auto-generate a unique Google Meet room for every booked lesson.</p>
      </div>
      <Switch checked={settings.auto_create_meet_link} onCheckedChange={v => updateSettings({ auto_create_meet_link: v })} />
    </div>
    <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground space-y-2">
      <p><strong>How it works:</strong></p>
      <ul className="list-disc pl-4 space-y-1">
        <li>When enabled, every time a lesson is booked (by you or a student), a new Google Meet link is automatically created and attached to the lesson.</li>
        <li>The link appears in the lesson details modal, in student notification emails, and on the student's booking page.</li>
        <li>Requires Google Calendar to be connected. Meet links are generated through Google Calendar events.</li>
        <li>Each lesson gets its own unique Meet room. If you prefer a fixed meeting room per student, you can set a "Default Meeting Link" in each student's profile.</li>
        <li>Students can join the meeting directly from their Student Hub dashboard or booking page.</li>
      </ul>
    </div>
  </CardContent>
</Card>
```

Dodać "Google Meet" do sidebar SECTIONS. Usunąć switch z sekcji Google Calendar.

**Plik:** `src/pages/CalendarSettingsPage.tsx`

---

## Migracja SQL (wszystko w jednej)

```sql
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_sync_booked boolean DEFAULT true;
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_sync_pending boolean DEFAULT true;
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_sync_available_new boolean DEFAULT false;
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS gcal_sync_available_on_cancel boolean DEFAULT true;
ALTER TABLE calendar_student_settings ADD COLUMN IF NOT EXISTS default_meeting_link text;
```

---

## Kolejność wdrożenia

1. Migracja SQL
2. GCalStatusButton przerobienie (Problem 2)
3. Export → Settings (Problem 3)
4. Kolory wizualne w settings (Problem 4A)
5. Sync toggles zamiast dropdown (Problem 4B)
6. Public Calendar domyślnie ON (Problem 4C)
7. GCal sync pending/available (Problem 5A)
8. Status suffix w nazwie (Problem 5B)
9. Fix endTime w emailach (Problem 5.1)
10. Meeting Link input w SlotDetailModal (Problem 11)
11. Default meeting link per student (Problem 11)
12. Auto-create Meet osobna sekcja (Problem 12)
13. Flashcards returnTo fix (Problem 1A)
14. Lessons booking w Student Hub (Problem 1B)
15. Student Hub GCal buttons (Problem 5.2)
16. Payment tracking rozbudowa (Problem 5/Payment)
17. Email Alerts rozdzielenie (Problem 10)
18. Deploy edge functions + docs

## Pliki do zmiany

| Plik | Zmiany |
|---|---|
| Migracja SQL | sync bools, default_meeting_link |
| `src/components/calendar/GCalStatusButton.tsx` | Przerobienie: Calendar button zamiast sync |
| `src/components/worksheet/WorksheetToolbar.tsx` | Pozycja GCalStatusButton |
| `src/components/WorksheetForm/index.tsx` | Pozycja GCalStatusButton |
| `src/pages/StudentPage.tsx` | Pozycja + payment sekcja + default meeting link |
| `src/pages/CalendarPage.tsx` | Usunąć Export, bulk paid modal |
| `src/pages/CalendarSettingsPage.tsx` | Export sekcja, kolory wizualne, sync toggles, Meet sekcja, Email podział |
| `src/hooks/useCalendarSettings.tsx` | Nowe pola, Public Calendar default ON |
| `src/hooks/useCalendarSlots.tsx` | Sync logic, endTime w emailach, auto-fill meeting link |
| `supabase/functions/gcal-sync/index.ts` | Status suffix, sync flags check |
| `supabase/functions/send-calendar-notification-email/index.ts` | endTime fix (już OK, trzeba przekazywać) |
| `src/components/calendar/SlotDetailModal.tsx` | Meeting Link UI, endTime w emailach |
| `src/pages/StudentHubFlashcards.tsx` | returnTo param |
| `src/pages/FlashcardsLearning.tsx` | returnTo odczyt + przekazanie |
| `src/components/flashcards/SessionSummary.tsx` | returnTo prop |
| `src/pages/StudentHubLessons.tsx` | Pełny booking UI |
| `src/pages/StudentHubDashboard.tsx` | Join Meeting button, Add to GCal |

