

# Plan naprawy i rozbudowy kalendarza — FAZA 3

Przeanalizowałem cały kod. Oto szczegółowy plan dla każdego problemu.

---

## NOWE TABELE / MIGRACJE SQL

### Tabela `calendar_slot_logs` — historia logów dla slotów (punkty 7, 8)
```sql
CREATE TABLE calendar_slot_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  action text NOT NULL, -- 'created', 'booked', 'confirmed', 'cancelled_by_teacher', 'cancelled_by_student', 'rescheduled', 'student_changed', 'worksheet_linked', 'status_changed', 'deleted', 'updated', 'rejected'
  actor text NOT NULL, -- 'teacher', 'student', 'system'
  details jsonb DEFAULT '{}'::jsonb, -- {old_status, new_status, student_name, student_email, from_date, to_date, ...}
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast slot-level queries
CREATE INDEX idx_slot_logs_slot_id ON calendar_slot_logs(slot_id);
CREATE INDEX idx_slot_logs_teacher_id ON calendar_slot_logs(teacher_id, created_at DESC);

-- RLS
ALTER TABLE calendar_slot_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view their logs" ON calendar_slot_logs FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Anyone can insert logs" ON calendar_slot_logs FOR INSERT WITH CHECK (true);
```

### Tabela `calendar_teacher_vacations` — wakacje nauczyciela (punkt 5)
```sql
CREATE TABLE calendar_teacher_vacations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  label text DEFAULT 'Vacation',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE calendar_teacher_vacations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage vacations" ON calendar_teacher_vacations FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Public can view vacations" ON calendar_teacher_vacations FOR SELECT USING (true);
```

### Nowe pole na `calendar_slots` — blokada prywatna (punkt 4)
```sql
ALTER TABLE calendar_slots ADD COLUMN slot_type text NOT NULL DEFAULT 'slot'; 
-- wartości: 'slot' (domyślny), 'block' (prywatna blokada nauczyciela)
```

### Nowe pole na `calendar_slots` — info o anulowaniu (punkt 11)
Pola `cancelled_by` i `cancellation_reason` już istnieją — wystarczą do wyświetlenia badge C.

### Nowe pole na `calendar_notifications` — metadane dla klikalności (punkt 6)
```sql
ALTER TABLE calendar_notifications ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
-- metadata: {student_email, student_name_raw, slot_date, slot_time, reschedule_new_slot_id, ...}
```

---

## KROK 1: Powiadomienia email — plan kompletny

Obecna edge function `send-calendar-notification-email` obsługuje: `booking_confirmation`, `booking_pending`, `new_booking_teacher`, `cancellation_teacher`, `lesson_reminder`.

**Brakujące typy do dodania:**
- `cancellation_student` — email do ucznia że jego lekcja została odwołana przez nauczyciela
- `reschedule_confirmation` — email do ucznia po zatwierdzeniu reschedule
- `reschedule_pending` — email do ucznia że reschedule czeka na potwierdzenie
- `reschedule_request_teacher` — email do nauczyciela że uczeń prosi o reschedule

**Implementacja:** Dodać nowe `case` w `send-calendar-notification-email/index.ts` z HTML dla każdego typu. Wywołania dodajemy w odpowiednich miejscach: `get-student-bookings` (cancel/reschedule), `SlotDetailModal` (teacher cancellation), `usePublicBooking` (booking).

---

## KROK 2: Modal Add Slot — poprawki

### 2A: Notes — AutoResizeTextarea rows=1
Już jest zaimplementowane (linia 583 UnifiedSlotModal). **Status: OK, brak zmian.**

### 2B: Usuń Link Worksheet z Single Slot (Available)
**Plik:** `UnifiedSlotModal.tsx` linia 530-568.
Warunek `mode === 'single'` renderuje worksheet link zarówno dla Available Slot jak i Lesson. Zmienić na:
```tsx
{mode === 'single' && slotType === 'lesson' && (
  // ... worksheet section ...
)}
```
Czyli worksheet link widoczny TYLKO na trybie Lesson, nie Available Slot.

### 2C: Student Combobox — kliknięcie nie działa
**Analiza:** Linia 400 — `onSelect` callback wygląda OK. Problem prawdopodobnie w `cmdk` — `CommandItem value` jest porównywany lowercase. Gdy `value={s.name__s.id}` i wyszukiwanie zwraca item, `onSelect` dostaje lowercase string. Ale nasz callback ignoruje argument — bezpośrednio robi `setStudentId(s.id)`.

**Prawdopodobna przyczyna:** `Popover` zamyka się i fokus przeskakuje zanim `onSelect` się odpali. Fix: dodać `onPointerDown={e => e.preventDefault()}` na `CommandItem`:
```tsx
<CommandItem 
  key={s.id} 
  value={`${s.name}__${s.id}`} 
  onSelect={() => { setStudentId(s.id); setStudentComboOpen(false); }}
  onPointerDown={(e) => e.preventDefault()}
>
```

---

## KROK 3: Linkowanie worksheet na SlotDetailModal

### 3A: Znikający uczeń po podlinkowaniu worksheet
**Root cause:** `CalendarPage.handleWorksheetLinked` linia 108-122 — kod JUŻ powinien zachowywać studenta (warunek `originalSlot && linkWorksheetSlot.student_id !== originalSlot.student_id`). Ale problem jest w tym że `SlotDetailModal` ZAMYKA się gdy klika się Link Worksheet (`onLinkWorksheet` wywołuje się w momencie gdy modal jest otwarty). Po powrocie z `LinkWorksheetModal`, `SlotDetailModal` jest zamknięty (bo `selectedSlot` był nullowany).

**Fix:** W `SlotDetailModal` — przed wywołaniem `onLinkWorksheet`, najpierw zapisać zmianę studenta:
```tsx
const handleLinkWorksheetClick = async () => {
  // Save student change FIRST before opening link modal
  if (editStudentId !== (slot.student_id || 'none')) {
    const updates: any = {};
    if (editStudentId === 'none') {
      updates.student_id = null; updates.status = 'available';
    } else {
      updates.student_id = editStudentId; updates.status = 'booked';
      updates.booked_at = new Date().toISOString();
      updates.booked_by = 'teacher';
      updates.confirmed_at = new Date().toISOString();
    }
    await onUpdate(slot.id, updates);
  }
  onLinkWorksheet?.(slot, editStudentId !== 'none' ? editStudentId : null);
};
```

### 3B: Worksheet linking nieaktywne bez studenta
**Plik:** `SlotDetailModal.tsx` linia 257. Zmienić `disabled`:
```tsx
disabled={!hasStudent}
```
Tzn. przycisk Link2 jest `disabled` gdy `editStudentId === 'none'`.

### 3C: Treść nie mieści się na modalu po wybraniu ucznia
**Fix:** Dodać `max-h-[85vh] overflow-y-auto` na `DraggableDialogContent`. Już jest na linii 169: `max-h-[85vh] overflow-y-auto`. Jeśli problem jest w wewnętrznej sekcji, dodać `overflow-hidden` na tekst i `truncate` na dłuższe elementy. Sprawdzić czy student info + date + time + worksheet + notes nie wychodzą poza 85vh — na małych ekranach zmienić na `max-h-[90vh]`.

---

## KROK 4: Blokada prywatna (Private Block)

### Nowy slot_type='block'
**W UnifiedSlotModal:** Dodać trzeci tab: `Available Slot | Lesson | Block`
```tsx
<Tabs value={slotType} onValueChange={...}>
  <TabsList className="grid grid-cols-3 w-full">
    <TabsTrigger value="available">Available Slot</TabsTrigger>
    <TabsTrigger value="lesson">Lesson</TabsTrigger>
    <TabsTrigger value="block">Block</TabsTrigger>
  </TabsList>
</Tabs>
```

**Block UI:** Tylko data, start/end, notes. Bez studenta, bez worksheet. Wyświetla się w kalendarzu jako szary blok z ikoną kłódki. Na `/book` jest NIEWIDOCZNY (query już filtruje `status='available'`).

**Typ SlotType** zmienić z `'available' | 'lesson'` na `'available' | 'lesson' | 'block'`.

**handleSubmit dla block:**
```tsx
if (slotType === 'block') {
  await onCreateSingle({
    slot_date: date, start_time: startTime, end_time: endTime,
    notes: notes || undefined, status: 'available',
    // slot_type: 'block' — nowe pole
  });
}
```

**CalendarSlotCard:** Gdy `slot.slot_type === 'block'`:
- Style: `bg-gray-200 border-gray-400 text-gray-600`
- Ikona: 🔒 zamiast Clock
- Nie pokazywać na `/book` (query `eq('slot_type', 'slot')`)

**useCalendarSlots.createSlot:** Dodać `slot_type` do insert.

**Conflict check:** Block blokuje dodawanie slotów i lekcji (jak lesson z studentem).

**Legenda kalendarza:** Dodać `<span>🔒 Block</span>` obok Available/Booked/etc.

---

## KROK 5: Wakacje nauczyciela

### Nowa tabela `calendar_teacher_vacations`
Hook `useCalendarVacations(teacherId)`:
- `vacations: {id, start_date, end_date, label}[]`
- `addVacation(start, end, label)`
- `removeVacation(id)`

### Na /calendar:
- W `CalendarSettings` → nowa sekcja "Vacations" z listą wakacji + dodawanie (date range picker)
- Na widokach Day/Week/Month: dni wakacyjne mają delikatne tło (np. `bg-orange-50`)
- Nauczyciel MOŻE dodawać sloty/lekcje na dni wakacyjne — nic się nie zmienia w logice

### Na /book:
- `usePublicBooking.fetchSlots` — osobny query na `calendar_teacher_vacations` dla teachera
- Na dniach wakacyjnych zamiast "No slots" pokaże się: `"Teacher on vacation"` z ikoną 🏖️
- Slot'y tego dnia się pokazują normalnie jeśli istnieją (nauczyciel może dodać mimo wakacji)

### Pliki:
- NOWY: `src/hooks/useCalendarVacations.tsx`
- EDIT: `CalendarSettingsPage.tsx` — sekcja Vacations
- EDIT: `CalendarDayView.tsx`, `CalendarWeekView.tsx`, `CalendarMonthView.tsx` — tło wakacyjne
- EDIT: `PublicBookingPage.tsx` — info "Teacher on vacation"
- EDIT: `usePublicBooking.tsx` — fetch vacations

---

## KROK 6: Calendar Notifications — klikalne + treść

### 6A: Kliknięcie powiadomienia otwiera modal slotu
**Plik:** `CalendarNotificationBell.tsx` + `CalendarPage.tsx`

Powiadomienie przechowuje `slot_id`. Po kliknięciu:
1. `CalendarNotificationBell` emituje callback `onNotificationClick(notification)`
2. `CalendarPage` pobiera slot z `slots.find(s => s.id === notification.slot_id)` lub fetchuje z bazy
3. Otwiera `SlotDetailModal` z tym slotem

**Props:** Dodać `onNotificationClick?: (n: CalendarNotification) => void` do `CalendarNotificationBell`.

### 6B: Nowy student — dodaj "Add Student" button
Gdy `notification_type === 'new_student'`:
- W `metadata` przechowujemy `{student_email, student_name_raw}`
- Na powiadomieniu wyświetlamy dodatkowy tekst: "This student is not in your list yet."
- Przycisk "Add Student" — otwiera `AddStudentDialog` z pre-fill name + email

**Implementacja:** 
- W `CalendarNotificationBell`: renderować przycisk "Add Student" dla `new_student` type
- `CalendarPage`: stan `addStudentPrefill: {name, email} | null` + `AddStudentDialog` z `open`/`onOpenChange` + pre-fill
- W `usePublicBooking.bookSlot`: dodać `metadata: { student_email: studentEmail, student_name_raw: studentName }` do INSERT calendar_notifications

### 6C: Powiadomienie nauczyciela o własnej lekcji
Gdy nauczyciel sam dodaje lekcję (w `useCalendarSlots.createSlot`), zmienić notification message z "New lesson booked..." na "You added new lesson on {date} at {time}":
```tsx
await supabase.from('calendar_notifications').insert({
  teacher_id: teacherId,
  notification_type: 'lesson_created_by_teacher',
  message: `You added a new lesson on ${input.slot_date} at ${input.start_time.slice(0, 5)}`,
  student_name: studentName,
  slot_id: data.id,
});
```

---

## KROK 7: Historia logów — podstrona /calendar/logs

### Nowy komponent `CalendarLogHistory.tsx`
- Pobiera z `calendar_slot_logs` WHERE `teacher_id = auth.uid()` ORDER BY `created_at DESC`
- Renderuje listę logów z: data, czas, akcja, student name, slot date, opis
- Filtry: typ akcji, data range, student
- Paginacja (LIMIT 50 per page)

### Route
- Dodać w `App.tsx`: `/calendar/logs` → `CalendarLogHistoryPage`
- Na `CalendarPage`: przycisk "Logs" obok Settings

### Logowanie zdarzeń
Wszędzie gdzie robimy `updateSlot`, `createSlot`, `deleteSlot` — dodać INSERT do `calendar_slot_logs`:
- `createSlot` → log 'created'
- `updateSlot` z `status: 'booked'` → log 'booked'
- `updateSlot` z `status: 'cancelled'` → log 'cancelled_by_teacher' / 'cancelled_by_student'
- `deleteSlot` → log 'deleted'
- `onUpdate` z student change → log 'student_changed'
- `handleWorksheetLinked` → log 'worksheet_linked'
- Booking z `/book` → log 'booked' (w `get-student-bookings`)
- Cancel z `/book` → log 'cancelled_by_student' (w `get-student-bookings`)

**W edge function `get-student-bookings`:** Po każdej akcji (cancel, reschedule) — INSERT do `calendar_slot_logs`.

**W `useCalendarSlots`:** Wrapper functions `createSlotWithLog`, `updateSlotWithLog`, `deleteSlotWithLog`.

---

## KROK 8: Historia logów na każdym slocie + show deleted

### Na SlotDetailModal — sekcja "History"
Na dole modalu dodać rozwijalną sekcję (Collapsible):
```tsx
<Collapsible>
  <CollapsibleTrigger className="text-xs flex items-center gap-1">
    <History className="h-3 w-3" /> History
  </CollapsibleTrigger>
  <CollapsibleContent>
    {slotLogs.map(log => (
      <div className="text-xs border-l-2 pl-2 py-1">
        <span className="font-medium">{log.action}</span>
        <span className="text-muted-foreground ml-1">{format(log.created_at, 'MMM d HH:mm')}</span>
        <span className="text-muted-foreground ml-1">by {log.actor}</span>
        {log.details.student_name && <span> — {log.details.student_name}</span>}
      </div>
    ))}
  </CollapsibleContent>
</Collapsible>
```

### Show Deleted
Na `CalendarPage`: przycisk "Show Deleted" toggle.
- Gdy aktywny: `useCalendarSlots.fetchSlots` zmienia query — nie filtruje cancelled (albo fetchuje soft-deleted).
- ALE: Usunięte sloty (`deleteSlot`) są fizycznie usunięte z `calendar_slots`. Więc nie da się ich pokazać.

**Zmiana:** Zamiast fizycznego DELETE, robimy soft delete — `status = 'deleted'`. Zmieniamy `deleteSlot`:
```tsx
// Zamiast:
await supabase.from('calendar_slots').delete().eq('id', slotId);
// Robimy:
await supabase.from('calendar_slots').update({ status: 'deleted' }).eq('id', slotId);
```
Domyślny fetch wyklucza `status = 'deleted'`. "Show Deleted" je dołącza.

**Na CalendarSlotCard:** `status === 'deleted'` → styl: szare, przekreślone, z ikoną kosza.

**ViewMode update:** Dodać `'deleted'` do CalendarSlot status type.

---

## KROK 9: Pole Search na /calendar

Na `CalendarPage` — nad toolbarem dodać Input search:
```tsx
<Input placeholder="Search students, notes..." value={searchQuery} onChange={...} className="h-8 w-60" />
```
Filtruje `filteredSlots` po: `studentMap[slot.student_id]?.includes(query)` || `slot.notes?.includes(query)` || `slot.title?.includes(query)`.

---

## KROK 10: Modal Lesson Booked — przebudowa przycisków

### 10A: Usunąć Cancel Lesson (obecny przycisk)
### 10B: Usunąć Delete Slot (ma być TYLKO na Available Slot)
### 10C: Dodać "Teacher Cancellation" i "Student Cancellation"

**Plik:** `SlotDetailModal.tsx` linia 288-328.

**Nowa logika przycisków:**

```
JEŚLI slot jest Available (brak studenta, status available):
  - [Delete Slot] — fizycznie usuwa (soft delete)
  - [Save Changes] — edycja

JEŚLI slot jest Booked (ma studenta):
  - [Teacher Cancellation] — potwierdza → status='available', cancelled_by='teacher', log
  - [Student Cancellation] — potwierdza → status='available', cancelled_by='student', log  
  - [Complete] / [No Show] — zmienia status
  - [Save Changes] — edycja
  - NIE MA Delete Slot
  - NIE MA Cancel Lesson (zastąpiony dwoma nowymi)
```

**handleTeacherCancellation:**
```tsx
const handleTeacherCancellation = async () => {
  if (!window.confirm('Cancel this lesson as teacher cancellation? The slot will become available again.')) return;
  const studentName = students.find(s => s.id === slot.student_id)?.name || 'unknown';
  await onUpdate(slot.id, {
    status: 'available',
    student_id: null,
    cancelled_at: new Date().toISOString(),
    cancelled_by: 'teacher',
    cancellation_reason: `Teacher cancellation. Student was: ${studentName}`,
    booked_at: null, booked_by: null, confirmed_at: null, student_notes: null,
  });
  // Log to calendar_slot_logs
  await supabase.from('calendar_slot_logs').insert({
    slot_id: slot.id, teacher_id: slot.teacher_id,
    action: 'cancelled_by_teacher', actor: 'teacher',
    details: { student_name: studentName, student_id: slot.student_id },
  });
  onOpenChange(false);
};
```

**handleStudentCancellation:** Analogicznie z `cancelled_by: 'student'`.

---

## KROK 11: Badge C na slotach po cancellation

Na `CalendarSlotCard.tsx`:
- Jeśli `slot.status === 'available'` ALE `slot.cancelled_at` i `slot.cancelled_by`:
  - Badge "C" w rogu:
    - Żółty jeśli `cancelled_by === 'student'`
    - Niebieski jeśli `cancelled_by === 'teacher'`

```tsx
{slot.status === 'available' && slot.cancelled_at && slot.cancelled_by && (
  <div className={cn(
    'absolute top-0 left-0 w-4 h-4 rounded-br text-[9px] font-bold flex items-center justify-center',
    slot.cancelled_by === 'student' ? 'bg-amber-400 text-amber-900' : 'bg-blue-400 text-blue-900'
  )}>
    C
  </div>
)}
```

---

## KROK 12: Calendar Settings — zmiany

### 12A: Rename
`"Allow student rescheduling"` → `"Allow student rescheduling without your confirmation"`

### 12B: Gdy `allow_student_reschedule=true` — toast na /book
W `StudentBookingsSection.handleReschedule` linia 78:
```tsx
toast.success(settings.allow_student_reschedule ? 'Lesson rescheduled successfully!' : 'Reschedule request sent to teacher');
```
Już jest OK. Problem w tym że `get-student-bookings` edge function linia 143-146 robi `confirmed_at: oldSlot.confirmed_at ? new Date().toISOString() : null`. Jeśli previous booking miał confirmed_at, nowy też dostaje — więc od razu widoczny jako confirmed. **Toast powinien być "Lesson rescheduled successfully!"** — to jest ok. Sprawdzić frontend.

### 12C: Gdy `allow_student_reschedule=false` — reschedule pending
W `get-student-bookings` linia 159-167: Obecnie tylko wstawia notification, nie zmienia slotu.

**Fix:** 
1. Na OLD slocie: zmienić status na "pending" (booked, confirmed_at=null) — ale to zmieni oryginalny slot
2. **Lepsza opcja:** Na NEW slocie: zarezerwować go jako pending:
```tsx
// Book new slot as pending
await supabase.from('calendar_slots').update({
  student_id: oldSlot.student_id,
  status: 'booked',
  booking_type: 'student_booked',
  booked_at: new Date().toISOString(),
  booked_by: 'student',
  confirmed_at: null, // PENDING
  student_notes: `Reschedule request from ${oldSlot.slot_date} ${oldSlot.start_time.slice(0,5)}. Original booking: ${oldSlot.student_notes || ''}`,
}).eq('id', newSlotId).eq('status', 'available');
```
3. Old slot: oznaczamy jako "reschedule_pending" w notatkach ale NIE zwalniamy — dopiero po potwierdzeniu przez nauczyciela stary slot staje się available
4. Na `/calendar` nauczyciela: notification klikalne → otwiera modal nowego slotu z Confirm/Reject
5. Na `/book`: nowy slot jest żółty (pending), stary nadal booked

**W powiadomieniu:** metadata z `oldSlotId` i `newSlotId` żeby nauczyciel mógł zatwierdzić:
```tsx
await supabase.from('calendar_notifications').insert({
  teacher_id: teacherId,
  notification_type: 'reschedule_request',
  message: `Student ${email} requests to reschedule from ${oldSlot.slot_date} ${oldSlot.start_time.slice(0,5)} to new slot`,
  student_name: email,
  slot_id: newSlotId,
  metadata: { old_slot_id: slotId, new_slot_id: newSlotId, student_email: email },
});
```

---

## KROK 13: Pending bookings/reschedules — edytowalne

Jeśli booking/reschedule jest pending (nie potwierdzony), uczeń POWINIEN móc go zmienić/anulować niezależnie od ustawień. 

**W `StudentBookingsSection`:** Dla bookingów `isPending` — przyciski Cancel i Reschedule są zawsze aktywne (ignorujemy `canCancel` check).

**W `get-student-bookings`:** Przy cancel — jeśli slot jest pending (no confirmed_at), pozwalamy cancel bez sprawdzenia `min_cancellation_hours`.

---

## KROK 14: Reschedule na /book — wybór z kalendarza

**Problem:** Po kliknięciu "Reschedule" w StudentBookingsSection pojawiają się mini-buttony slotów pod spodem. Ma być inaczej — informacja "Select a new time from the calendar above" i wybór bezpośredni z siatki kalendarza na górze strony.

**Fix:**
1. W `StudentBookingsSection`: Zamiast listy slotów, pokazać info: `"Click on an available slot in the calendar above to reschedule"`
2. W `PublicBookingPage`: Stan `rescheduleBookingId: string | null`. Gdy ustawiony:
   - Na górnym kalendarzu wyświetlić banner "Select a new slot to reschedule your lesson"
   - Kliknięcie available slot → zamiast otwierać dialog bookingu, wywołać `handleReschedule(rescheduleBookingId, slot.id)`
   - Po udanym reschedule → reset `rescheduleBookingId`

**Komunikacja między komponentami:**
- `StudentBookingsSection` props: `onRescheduleStart?: (bookingId: string) => void`
- `PublicBookingPage`: `rescheduleMode` state + banner + modyfikacja onClick logiki na slotach

---

## PODSUMOWANIE PLIKÓW

### NOWE PLIKI:
1. `src/hooks/useCalendarVacations.tsx` — hook wakacji
2. `src/hooks/useCalendarSlotLogs.tsx` — hook logów slotów
3. `src/components/calendar/CalendarLogHistoryPage.tsx` — pełna historia logów
4. `src/components/calendar/SlotLogHistory.tsx` — logi na modalu slotu (Collapsible)
5. Migration SQL — calendar_slot_logs, calendar_teacher_vacations, calendar_slots.slot_type, calendar_notifications.metadata

### MODYFIKOWANE PLIKI:
1. `UnifiedSlotModal.tsx` — usunąć worksheet z Available Slot, dodać tab Block, fix combobox
2. `SlotDetailModal.tsx` — nowe przyciski cancellation, save student before link, historia logów, disabled link bez studenta
3. `CalendarSlotCard.tsx` — badge C, block style, deleted style
4. `CalendarPage.tsx` — search, show deleted, notification click handler, add student prefill
5. `CalendarNotificationBell.tsx` — klikalne notyfikacje, Add Student button, callback
6. `CalendarSettingsPage.tsx` — rename rescheduling, sekcja Vacations
7. `CalendarToolbar.tsx` — przycisk Logs
8. `PublicBookingPage.tsx` — reschedule z kalendarza, wakacje info
9. `StudentBookingsSection.tsx` — reschedule via calendar, pending editable
10. `useCalendarSlots.tsx` — soft delete, slot_type='block', logowanie
11. `usePublicBooking.tsx` — fetch vacations
12. `useCalendarNotifications.tsx` — metadata support
13. `get-student-bookings/index.ts` — reschedule pending, logs, cancel hours bypass for pending
14. `send-calendar-notification-email/index.ts` — nowe typy email
15. `App.tsx` — route /calendar/logs
16. Dokumentacja — TECHNICAL_DOCUMENTATION.md, USER_GUIDE_SHORT.md, USER_GUIDE_DETAILED.md, CURRENT_STATE_ANALYSIS.md

### KOLEJNOŚĆ IMPLEMENTACJI:
1. **Migration SQL** — nowe tabele i kolumny
2. **Krok 2** — Modal fixes (worksheet, combobox, block)
3. **Krok 3** — Worksheet linking fix
4. **Krok 10** — Lesson Booked modal buttons
5. **Krok 11** — Badge C
6. **Krok 4** — Block feature
7. **Krok 5** — Vacations
8. **Krok 6** — Notifications clickable + Add Student
9. **Krok 7+8** — Logging system + history
10. **Krok 9** — Search
11. **Krok 12+13** — Settings + pending editable
12. **Krok 14** — Reschedule z kalendarza
13. **Krok 1** — Email notifications types
14. **Dokumentacja**

