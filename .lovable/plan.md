

# Plan naprawy kalendarza — FAZA 4

Przeanalizowałem cały kod. Poniżej kompletny plan z dokładnymi rozwiązaniami.

---

## KRYTYCZNY BUG: CHECK CONSTRAINT na `calendar_slots.status`

**Root cause punktu 12A** (nie da się usunąć slota): W bazie jest constraint `valid_slot_status CHECK (status IN ('available','booked','completed','cancelled','no_show'))`. Kod próbuje ustawić `status = 'deleted'` — co łamie constraint. 

**Fix:** Migracja SQL — dodać `'deleted'` do constraintu:
```sql
ALTER TABLE calendar_slots DROP CONSTRAINT valid_slot_status;
ALTER TABLE calendar_slots ADD CONSTRAINT valid_slot_status 
  CHECK (status IN ('available','booked','completed','cancelled','no_show','deleted'));
```

---

## 1. Powiadomienia email — nadawca + reply-to + linki

### 1A: Nadawca i Reply-To
**Plik:** `send-calendar-notification-email/index.ts`

Logika: potrzebujemy imienia nauczyciela. Dodać do body `teacherName`. 

- **Dla nauczyciela:** `from: 'EDOQOO <notifications@edooqoo.com>'` (bez zmian)
- **Dla ucznia:** `from: '[teacherName] via EDOQOO <notifications@edooqoo.com>'`, `reply_to: teacherEmail`

Zmiana w edge function:
```ts
const fromName = ['booking_confirmation','booking_pending','cancellation_student','reschedule_confirmation','reschedule_pending','lesson_reminder']
  .includes(type) 
  ? `${teacherName || 'Your Teacher'} via EDOQOO` 
  : 'EDOQOO';

body: JSON.stringify({
  from: `${fromName} <notifications@edooqoo.com>`,
  reply_to: type.includes('teacher') ? undefined : teacherEmail,
  to: [to], subject, html,
}),
```

### 1B: Linki w emailach
Do każdego HTML dodać przycisk:
- Dla nauczyciela: `<a href="${calendarUrl}">Open Calendar</a>` — calendarUrl to `https://edooqoo-mvp-e3.lovable.app/calendar`
- Dla ucznia: `<a href="${bookUrl}">View Bookings</a>` — bookUrl z tokenu

Dodać parametry `calendarUrl` i `bookUrl` do body wywołań.

**Pliki do zmiany:**
- `send-calendar-notification-email/index.ts` — dodać `teacherName`, `calendarUrl`, `bookUrl`, `reply_to`
- `usePublicBooking.tsx` — dodać `teacherName` do invoke body (pobrać z profiles)
- `useCalendarSlots.tsx` — dodać `teacherName` do invoke (jeśli wysyłamy email przy teacher cancellation)
- `SlotDetailModal.tsx` — dodać `teacherName` do invoke przy cancellation email
- `get-student-bookings/index.ts` — dodać `teacherName` do invoke (pobrać z profiles)

---

## 2. Timezone

**Obecny stan:** Timezone jest zapisywany w `calendar_settings.timezone` ale NIGDZIE nie jest używany do konwersji. Godziny są przechowywane jako `time without time zone`. Sloty widoczne na `/book` pokazują godziny dokładnie jak w bazie — bez konwersji.

**Wniosek:** System jest "naive timezone" — godziny oznaczają czas nauczyciela. Uczeń w innej strefie widzi godziny nauczyciela, nie swoje. To jest OK dla 1:1 lekcji online — uczeń widzi kiedy nauczyciel jest dostępny w jego lokalnym czasie.

**Ale** jeśli chcemy aby uczeń widział godziny w SWOJEJ strefie — trzeba dodać konwersję. Proponuję na razie wyświetlić info na `/book`: "Times shown in teacher's timezone: Europe/Warsaw" i dać opcjonalnie przelicznik. To jest osobny feature, nie implementujemy teraz.

---

## 3. Realtime + miganie + przycisk Add Student

### 3A: Supabase Realtime
**Problem:** Polling co 30s powoduje opóźnienia i miganie.

**Fix:** Użyć Supabase Realtime (channel subscription) zamiast `setInterval`.

W `useCalendarSlots.tsx`: 
```tsx
useEffect(() => {
  if (!teacherId) return;
  const channel = supabase
    .channel('calendar-slots-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_slots', filter: `teacher_id=eq.${teacherId}` },
      () => { fetchSlots(); }
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [teacherId, fetchSlots]);
```
Usunąć `setInterval(fetchSlots, 30000)`.

W `usePublicBooking.tsx`:
```tsx
useEffect(() => {
  if (!settings) return;
  const channel = supabase
    .channel('public-slots-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_slots', filter: `teacher_id=eq.${settings.teacher_id}` },
      () => { fetchSlots(); }
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [settings, fetchSlots]);
```

W `useCalendarNotifications.tsx` — analogicznie dla tabeli `calendar_notifications`.

### 3B: Weryfikacja przy rezerwacji (optimistic locking)
W `usePublicBooking.bookSlot`: Przed UPDATE dodać SELECT sprawdzający czy slot nadal `available`:
```tsx
const { data: check } = await supabase
  .from('calendar_slots').select('status').eq('id', slotId).single();
if (check?.status !== 'available') {
  toast({ title: 'Slot no longer available', variant: 'destructive' });
  await fetchSlots(); return false;
}
```

### 3C: Miganie i przycisk Add Student
**Problem:** `CalendarPage.tsx` nie ma żadnego przycisku "Add Student" pod kalendarzem. Miganie wynika z `setInterval` odświeżania, które powoduje re-render całego komponentu (nowe referencje `slots`).

**Fix:** Realtime zamiast polling (3A) rozwiąże miganie. Jeśli `AddStudentDialog` z `triggerButton={true}` jest renderowany gdzieś — sprawdzę CalendarPage linia 341-346 — tam jest `<AddStudentDialog>` z `open={addStudentOpen}`. Ma `triggerButton` domyślnie `true`. Ale `open` jest kontrolowane zewnętrznie.

**Problem:** `triggerButton={true}` renderuje przycisk nawet gdy `open` jest zewnętrznie kontrolowane. Fix: dodać `triggerButton={false}` do tego AddStudentDialog na CalendarPage.

---

## 4. Notes — AutoResizeTextarea jednolinijkowe

**Problem:** `AutoResizeTextarea` z `rows={1}` nadal wygląda jak wieloliniowe bo Textarea ma domyślny `min-height`. 

**Fix:** Dodać `className="min-h-[36px]"` żeby textarea startowała z jedną linijką:
```tsx
<AutoResizeTextarea value={notes} onChange={...} rows={1} className="min-h-[36px]" />
```
Dotyczy: `UnifiedSlotModal.tsx` linia 605 i `SlotDetailModal.tsx` linia 364.

---

## 5. Student Combobox — nie da się kliknąć

**Problem:** `cmdk` CommandItem z `onPointerDown={e => e.preventDefault()}` może powodować problem na mobilnych. Prawdopodobny root cause: `PopoverContent` ma `onOpenAutoFocus` który kradnie focus.

**Fix:** Na `PopoverContent` dodać `onOpenAutoFocus={e => e.preventDefault()}`:
```tsx
<PopoverContent className="w-full p-0" align="start" onOpenAutoFocus={e => e.preventDefault()}>
```
Dotyczy: `UnifiedSlotModal.tsx` linia 401 i `SlotDetailModal.tsx` linia 299.

---

## 6. Linkowanie worksheet — znikający student

### 6A+6B: Student znika po podlinkowaniu worksheet
**Root cause:** `handleLinkWorksheetClick` w SlotDetailModal zapisuje studenta PRZED otwarciem LinkWorksheetModal. ALE po `onUpdate` jest wywoływany `refetch` w `useCalendarSlots` co ustawia nowe `slots`. `CalendarPage` re-renderuje i `selectedSlot` wskazuje na STARY obiekt slotu. `SlotDetailModal` dostaje `slot` z nowym stanem (po refetch) ale `open` jest nadal `true` bo `selectedSlot !== null`.

**Prawdziwy problem:** Po `onUpdate` → `refetch` → `slots` się zmieniają → `selectedSlot` jest stary obiekt. `SlotDetailModal` dostaje `open={!!selectedSlot && !linkWorksheetSlot}`. Gdy `linkWorksheetSlot` jest ustawiony, modal szczegółów się zamyka (to OK). Ale po zamknięciu LinkWorksheetModal → `linkWorksheetSlot = null` → `selectedSlot` nadal stary (nie ma w nowych `slots`) → modal otwiera się ze starym stanem.

**Fix:** Po `handleWorksheetLinked` → `refetch` → zaktualizować `selectedSlot`:
```tsx
const handleWorksheetLinked = async (worksheetId: string | null) => {
  if (linkWorksheetSlot) {
    const updates: any = { worksheet_id: worksheetId };
    // ... existing logic ...
    await updateSlot(linkWorksheetSlot.id, updates);
    // Re-select the slot to show updated data
    await refetch();
    // Find updated slot and set as selected
    const updatedSlot = slots.find(s => s.id === linkWorksheetSlot.id);
    if (updatedSlot) setSelectedSlot(updatedSlot);
  }
};
```

Ale `slots` nie jest jeszcze zaktualizowany w tym samym render cycle. Lepsze rozwiązanie: po zamknięciu LinkWorksheetModal, NIE otwierać od razu SlotDetailModal — tylko refetchować. Albo: zapisać ID i po refetch znaleźć slot.

**Najlepsze rozwiązanie:** Dodać `useEffect` w CalendarPage:
```tsx
// Sync selectedSlot with fresh slots data
useEffect(() => {
  if (selectedSlot) {
    const fresh = slots.find(s => s.id === selectedSlot.id);
    if (fresh && JSON.stringify(fresh) !== JSON.stringify(selectedSlot)) {
      setSelectedSlot(fresh);
    }
  }
}, [slots]);
```

---

## 7. Calendar Notifications

### 7A: "Add Student" znika po dodaniu
**Plik:** `CalendarNotificationBell.tsx`

Potrzeba sprawdzić czy email z metadata już istnieje w liście studentów. Dodać prop `students` do `CalendarNotificationBell`:
```tsx
interface CalendarNotificationBellProps {
  teacherId?: string;
  students?: Array<{ email?: string }>;
  onNotificationClick?: ...;
  onAddStudentClick?: ...;
}
```

W renderowaniu:
```tsx
const isNewStudent = n.notification_type === 'new_student';
const studentAlreadyAdded = isNewStudent && students?.some(s => 
  s.email && metadata.student_email && s.email.toLowerCase() === metadata.student_email.toLowerCase()
);
```

Jeśli `studentAlreadyAdded`:
- Zamiast "This student is not in your list yet." → "✓ Student added"
- Nie pokazywać przycisku "Add Student"

### 7B: Nauczyciel dodaje lekcję — treść powiadomienia
**Plik:** `useCalendarSlots.tsx` — w `createSlot`, linia z `calendar_notifications.insert`.

Sprawdzę czy notification jest wstawiane przy `createSlot`. Szukam w kodzie...

W `useCalendarSlots.tsx` linia ~logAction po createSlot — logujemy 'created'. Ale notification do `calendar_notifications` NIE jest wstawiane w createSlot. Jest wstawiane TYLKO w `usePublicBooking.bookSlot` (student booking) i w `get-student-bookings` (cancel/reschedule).

Więc skąd pochodzi powiadomienie "New lesson booked on..."? Prawdopodobnie z triggera `notify_on_slot_booking` w bazie.

Sprawdzę trigger:
Trigger `notify_on_slot_booking` na INSERT/UPDATE — jeśli `NEW.status = 'booked'` i `OLD IS NULL OR OLD.status = 'available'`, wstawia notification. Treść: `'New lesson booked on ' || NEW.slot_date || ' at ' || substring(NEW.start_time::text from 1 for 5)`.

**Fix:** Zmienić trigger żeby rozróżniał kto zrobił booking. Jeśli `NEW.booked_by = 'teacher'` → treść "You added a new lesson..." zamiast "New lesson booked...":
```sql
CREATE OR REPLACE FUNCTION notify_on_slot_booking() RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'booked') OR 
     (TG_OP = 'UPDATE' AND NEW.status = 'booked' AND (OLD.status IS NULL OR OLD.status = 'available')) THEN
    
    IF NEW.booked_by = 'teacher' THEN
      INSERT INTO calendar_notifications (teacher_id, notification_type, message, student_name, slot_id)
      VALUES (NEW.teacher_id, 'lesson_created_by_teacher', 
        'You added a new lesson on ' || NEW.slot_date || ' at ' || substring(NEW.start_time::text from 1 for 5),
        COALESCE(NEW.student_notes, ''), NEW.id);
    ELSE
      INSERT INTO calendar_notifications (teacher_id, notification_type, message, student_name, slot_id)
      VALUES (NEW.teacher_id, 'booking_pending', 
        COALESCE(split_part(NEW.student_notes, '(', 1), '') || ' requested a lesson — awaiting confirmation',
        COALESCE(split_part(NEW.student_notes, '(', 1), ''), NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**ALE UWAGA:** Jest problem duplikacji (punkt 7C) — trigger wstawia notification I `usePublicBooking.bookSlot` TEŻ wstawia notification. Dwukrotne powiadomienie.

### 7C: Duplikacja powiadomień
**Root cause:** Booking wstawia notification W KODZIE (usePublicBooking linia 106-115) PLUS trigger bazodanowy `notify_on_slot_booking` RÓWNIEŻ wstawia notification.

**Fix:** Usunąć INSERT do `calendar_notifications` z `usePublicBooking.bookSlot` (linia 104-115 — "Always insert booking notification"). Zostawić TYLKO trigger bazodanowy. Trigger jest lepszy bo jest atomowy z UPDATE.

Ale trigger nie ma kontekstu o `student_name` — zna tylko `student_notes`. Więc modyfikujemy trigger żeby wyciągnąć imię z `student_notes` (format: "Booked by: Name (email)").

Alternatywnie: usunąć trigger i zostawić TYLKO insert z kodu. To prostsze — usuwamy trigger.

**Decyzja:** Usunąć trigger `notify_on_slot_booking`. Powiadomienia zarządzamy WYŁĄCZNIE z kodu (usePublicBooking, useCalendarSlots, get-student-bookings). To daje pełną kontrolę nad treścią i eliminuje duplikację.

### 7D: "New student" mimo że już dodany
**Problem:** `usePublicBooking.bookSlot` sprawdza `existingStudent` przez `student_email`. Jeśli email jest inny niż w bazie (np. case sensitivity lub uczeń wpisał inny email), wstawia `new_student` notification nawet jeśli student istnieje.

**Fix:** Normalizować email do lowercase: `.eq('student_email', studentEmail.toLowerCase())`. I przy dodawaniu studenta zapisywać email lowercase.

### 7E: Powiadomienie "done" po wykonaniu akcji
Dodać pole `is_resolved` do `calendar_notifications`. Po potwierdzeniu/odrzuceniu bookingu — oznaczyć notification jako resolved. Resolved notifications mają szary styl i badge "✓ Done".

---

## 8. Block na /book — nie pokazywać

**Problem:** Na `/book` query filtruje `or('status.eq.available,and(status.eq.booked,confirmed_at.is.null)')`. Bloki mają `status='available'` i `slot_type='block'` — więc przechodzą filtr.

**Fix:** W `usePublicBooking.fetchSlots` dodać `.eq('slot_type', 'slot')` lub `.neq('slot_type', 'block')`:
```tsx
const { data } = await supabase
  .from('calendar_slots')
  .select('*')
  .eq('teacher_id', settings.teacher_id)
  .neq('slot_type', 'block')  // ← DODAĆ
  .gte('slot_date', from)
  ...
```

---

## 9+10. Logi — więcej informacji

### 9: CalendarLogHistoryPage — rozbudowa
**Plik:** `CalendarLogHistoryPage.tsx`

Zmienić renderowanie logów — zamiast 2-3 pól, pełny opis:
```tsx
{filteredLogs.map(log => (
  <div key={log.id} className="...">
    <div>{format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}</div>
    <div>
      <span className="font-medium">{humanizeAction(log.action)}</span>
      <span> by {log.actor}</span>
      {log.details?.student_name && <span> — Student: {log.details.student_name}</span>}
      {log.details?.slot_date && <span> — Date: {log.details.slot_date}</span>}
      {log.details?.start_time && <span> at {log.details.start_time.slice(0,5)}</span>}
      {log.details?.old_status && <span> — {log.details.old_status} → {log.details.new_status}</span>}
      {log.details?.student_email && <span> ({log.details.student_email})</span>}
      {log.details?.changes && <pre className="text-[10px] mt-1">{JSON.stringify(log.details.changes, null, 2)}</pre>}
    </div>
  </div>
))}
```

Dodać filtry: student selector (dropdown z uczniami), date range (od-do).

### 10: Historia na slocie — więcej info
**Plik:** `SlotDetailModal.tsx` linie 404-411 — ten sam format co powyżej.

Dodatkowo: upsertować bogatsze `details` w logach — we WSZYSTKICH miejscach gdzie robimy `calendar_slot_logs.insert`, dodawać pełne info:
```tsx
details: { 
  student_name, student_id: slot.student_id, student_email,
  slot_date: slot.slot_date, start_time: slot.start_time, 
  old_status: slot.status, new_status: 'available',
  ...
}
```

---

## 11. Cancellation — czyszczenie tytułu, notatek, worksheet

### 11A+11B: Po Teacher/Student Cancellation
W `handleTeacherCancellation` i `handleStudentCancellation` — dodać czyszczenie:
```tsx
await onUpdate(slot.id, {
  status: 'available', student_id: null,
  title: null,           // ← DODAĆ
  worksheet_id: null,     // ← DODAĆ — odpinanie worksheet
  cancelled_at: new Date().toISOString(), cancelled_by: 'teacher',
  cancellation_reason: `Teacher cancellation. Student was: ${cancelledStudentName}`,
  booked_at: null, booked_by: null, confirmed_at: null, student_notes: null,
});
```

---

## 12. Usuwanie slotów — constraint fix + logika

### 12A: Constraint fix
Migracja SQL (opisana na początku) — dodać 'deleted' do CHECK constraint.

### 12B: Logika usuwania
- **Available bez historii rezerwacji** (`cancelled_at IS NULL`): hard delete (fizycznie usunąć z bazy)
- **Available z historią** (`cancelled_at IS NOT NULL`): soft delete (`status = 'deleted'`)

W `SlotDetailModal.handleDelete`:
```tsx
const handleDelete = async () => {
  if (confirming) {
    const hasHistory = slot.cancelled_at !== null;
    if (hasHistory) {
      // Soft delete
      await onUpdate(slot.id, { status: 'deleted' } as any);
    } else {
      // Hard delete
      await onDelete(slot.id);
    }
    // Log...
    onOpenChange(false);
  } else setConfirming(true);
};
```

Batch delete w CalendarPage: analogicznie — sprawdzić `cancelled_at` każdego slotu.

Deleted slots: kliknięcie otwiera modal z opcją "Restore" i historią.

---

## 13. Legenda kolorów z badge'ami i filtrowanie

**Plik:** `CalendarPage.tsx` linie 277-284.

Nowa legenda z badge literami:
```tsx
const LEGEND_ITEMS = [
  { key: 'available', label: 'Available', badge: 'A', color: 'bg-green-200 border-green-400' },
  { key: 'booked', label: 'Booked', badge: 'B', color: 'bg-blue-200 border-blue-400' },
  { key: 'pending', label: 'Pending', badge: 'P', color: 'bg-amber-200 border-amber-400' },
  { key: 'completed', label: 'Completed', badge: '✓', color: 'bg-emerald-200 border-emerald-400' },
  { key: 'no_show', label: 'No Show', badge: 'NS', color: 'bg-red-200 border-red-400' },
  { key: 'block', label: 'Block', badge: 'B', color: 'bg-gray-200 border-gray-400' },
  { key: 'deleted', label: 'Deleted', badge: 'D', color: 'bg-muted/50 border-border/50' },
];
```

Stan `legendFilter: string | null`. Kliknięcie na legendzie ustawia filtr. Przycisk "Clear filter" resetuje.

Na `CalendarSlotCard.tsx` — dodać badge literkę w lewym górnym rogu (jeśli nie ma badge C):
```tsx
{!showBadgeC && (
  <div className="absolute top-0 left-0 ...">
    {statusBadgeLetter}
  </div>
)}
```

Zmiana `completed` z `bg-muted` na `bg-emerald-100 border-emerald-300` żeby różnił się od deleted.

---

## 12 (Settings). Reschedule bez potwierdzenia — stary slot nadal Pending

**Problem:** W `get-student-bookings` linia 144-187: Gdy `allow_student_reschedule=false` (wymaga potwierdzenia), nowy slot jest `confirmed_at: null` (pending). ALE stary slot NIE jest zmieniany — nadal jest `booked` z `confirmed_at`. Powinien być pending.

Nie — stary slot powinien nadal być aktywny dopóki nauczyciel nie potwierdzi reschedule. Po potwierdzeniu stary slot staje się available.

**Ale** user mówi że nawet gdy `allow_student_reschedule=true` (automatycznie), stary slot jest Pending. Sprawdzam linia 147-155: stary slot dostaje `status: 'available'`, `cancelled_at`, `cancelled_by: 'student'`. To jest poprawne — powinien być available nie pending.

**Problem może być w UI:** Po reschedule, `refetchSlots` na `/book` pobiera sloty `or('status.eq.available,and(status.eq.booked,confirmed_at.is.null)')`. Stary slot ma status `available` z `cancelled_at` — więc jest widoczny jako available. Ale nowy slot ma `confirmed_at` (auto-reschedule) — więc NIE jest pending. UI powinien pokazywać nowy slot jako `booked` z zielonym badge.

Ale query nie pobiera `booked` z `confirmed_at` — tylko `available` i pending. Więc nowy slot (booked + confirmed) jest NIEWIDOCZNY na `/book`. To jest bug — student nie widzi swojej rezerwacji po reschedule.

**Fix:** Dodać do query na `/book` również sloty booked z confirmed_at (ale tylko studenta). ALE bieżący query jest client-side z anon key — nie wie kto jest studentem. Rozwiązanie: zostawić jak jest, student zobaczy swoje booking w sekcji "Already have a booking?" (StudentBookingsSection).

---

## 13. Pending edytowalne
Już zaimplementowane w `get-student-bookings` (linia 82-92) i `StudentBookingsSection` (linia 80-86). Nie wymaga zmian.

---

## 14. Duplikacja emaili studentów

**Plik:** `useStudents.tsx` — w `addStudent` dodać sprawdzenie:
```tsx
const { data: existing } = await supabase
  .from('students')
  .select('id')
  .eq('teacher_id', user.id)
  .eq('student_email', email.toLowerCase())
  .maybeSingle();
if (existing) {
  toast.error('Student with this email already exists');
  return null;
}
```

Plus: migracja SQL dodająca UNIQUE constraint:
```sql
CREATE UNIQUE INDEX idx_students_teacher_email ON students(teacher_id, lower(student_email)) 
WHERE student_email IS NOT NULL AND deleted_at IS NULL;
```

---

## PODSUMOWANIE PLIKÓW

### Migracja SQL:
1. Dodać 'deleted' do CHECK constraint `valid_slot_status`
2. Dodać `is_resolved boolean DEFAULT false` do `calendar_notifications`
3. Usunąć trigger `notify_on_slot_booking`
4. Dodać UNIQUE index na `students(teacher_id, lower(student_email))`

### Modyfikowane pliki:
1. `useCalendarSlots.tsx` — Realtime zamiast polling, usunąć setInterval
2. `usePublicBooking.tsx` — Realtime, filtr `slot_type != block`, weryfikacja przy booking, usunąć duplikat notification
3. `useCalendarNotifications.tsx` — Realtime
4. `UnifiedSlotModal.tsx` — Notes min-h, PopoverContent onOpenAutoFocus fix
5. `SlotDetailModal.tsx` — Notes min-h, combobox fix, cancellation czyści title/worksheet, delete logika (hard vs soft), bogatsze logi
6. `CalendarSlotCard.tsx` — badge literki, nowy kolor completed
7. `CalendarPage.tsx` — useEffect sync selectedSlot, legenda z filtrami, AddStudentDialog triggerButton=false
8. `CalendarNotificationBell.tsx` — sprawdzanie czy student dodany, is_resolved style
9. `CalendarLogHistoryPage.tsx` — bogatsze logi, filtr student/date range
10. `send-calendar-notification-email/index.ts` — nadawca, reply_to, linki
11. `get-student-bookings/index.ts` — dodać teacherName do email invoke, bogatsze logi
12. `useStudents.tsx` — sprawdzanie duplikatów emaili

### KOLEJNOŚĆ:
1. Migracja SQL (constraint + trigger + unique index)
2. Realtime (useCalendarSlots, usePublicBooking, useCalendarNotifications)
3. Bug fixy (combobox, notes, blocks na /book, cancellation cleanup)
4. Worksheet linking fix (selectedSlot sync)
5. Notifications (duplikacja, treść, is_resolved)
6. Delete logika (hard vs soft)
7. Legenda z badge'ami i filtrami
8. Logi rozbudowa
9. Email nadawca + linki
10. Duplikacja studentów

