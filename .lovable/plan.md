

# Plan: Calendar & Booking — Runda napraw #2

## Analiza problemów i rozwiązania

---

### 1. Powiadomienia email — kompletność + ustawienia w Calendar Settings + linki do worksheet

**Co jest:** Edge function `send-calendar-notification-email` obsługuje już większość typów. Brakuje: linków do worksheet/shared worksheet w emailach, ustawień on/off w Calendar Settings per typ emaila.

**Plan:**

**A) Nowe kolumny w `calendar_settings` (migracja SQL):**
```sql
ALTER TABLE calendar_settings
  ADD COLUMN IF NOT EXISTS notify_email_on_booking boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email_on_cancellation boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email_on_reschedule boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email_on_confirmation boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email_on_rejection boolean NOT NULL DEFAULT true;
```

**B) CalendarSettingsPage.tsx** — dodać sekcję "Email Notifications" z 5 switchami:
- Email on new booking (notify_email_on_booking)
- Email on cancellation (notify_email_on_cancellation)
- Email on reschedule request (notify_email_on_reschedule)
- Email on confirmation (notify_email_on_confirmation)
- Email on rejection (notify_email_on_rejection)

Wszystkie domyślnie `true`.

**C) useCalendarSettings.tsx** — dodać te kolumny do interfejsu `CalendarSettings`.

**D) send-calendar-notification-email/index.ts** — dodać opcjonalne parametry `worksheetUrl` i `sharedWorksheetUrl`. W HTML dodać conditional button:
```html
${worksheetUrl ? `<div style="margin-top:12px;"><a href="${worksheetUrl}" style="...">Open Worksheet</a></div>` : ''}
```
Dla nauczyciela: link do `/worksheet/{id}`, dla ucznia: link do shared worksheet (jeśli istnieje share_token).

**E) SlotDetailModal.tsx** — przy wywołaniu `sendCalendarEmail`, przekazywać `worksheetUrl` jeśli `slot.worksheet_id` istnieje. Przed wysłaniem emaila sprawdzać odpowiednie ustawienia z `calendar_settings` (trzeba pobrać settings lub przekazać je jako prop).

**F) usePublicBooking.tsx** — analogicznie, przed wysłaniem emaila sprawdzić settings (settings jest już dostępny w hooku). Dodać parametr `worksheetUrl` gdy `slot.worksheet_id` istnieje.

**G) get-student-bookings/index.ts** — przed `sendEmail` sprawdzać ustawienia nauczyciela z `settingsData`. Dodać fetcha settings z nowymi kolumnami.

**Pliki do zmiany:**
- Migracja SQL (nowe kolumny)
- `src/hooks/useCalendarSettings.tsx` (interfejs)
- `src/pages/CalendarSettingsPage.tsx` (UI switche)
- `supabase/functions/send-calendar-notification-email/index.ts` (worksheet links)
- `src/components/calendar/SlotDetailModal.tsx` (sprawdzanie settings + worksheet URL)
- `src/hooks/usePublicBooking.tsx` (sprawdzanie settings + worksheet URL)
- `supabase/functions/get-student-bookings/index.ts` (sprawdzanie settings)

---

### 2. Realtime — zmiany nie widoczne natychmiast

**Co jest:** Oba hooki (`useCalendarSlots`, `usePublicBooking`) mają już Supabase Realtime listener na `postgres_changes`. Problem polega na tym, że `fetchSlots` w `usePublicBooking` zależy od `weekStart/weekEnd` przez `useCallback` dependency — więc channel resubskrybuje się co zmianę tygodnia, a sam `fetchSlots` jest stabilny. 

**Root cause:** Realtime listener JEST podpięty. Jeśli zmiany nie są widoczne od razu, to prawdopodobnie problem z RLS. Anonimowy użytkownik na `/book` nie ma auth session, więc Realtime **nie dostarcza eventów** bo RLS policies na `calendar_slots` wymagają warunku (np. `status = 'available'` tylko na SELECT, ale Realtime wymaga `SELECT` policy aby dostarczyć event).

**Rozwiązanie:** Dodać RLS policy pozwalającą anonimowemu czytać sloty danego nauczyciela (już mamy `Public can view available slots` i `Public can view pending slots` i `Students can view their booked slots`). Problem może być w tym, że Realtime nie widzi UPDATE'ów bo stary wiersz nie spełnia warunku RLS. 

**Konkretny fix:** Dodać **polling fallback** co 5 sekund na `/book` (jako uzupełnienie Realtime), bo Realtime + RLS na publicznych widokach jest zawodny.

W `usePublicBooking.tsx`:
```ts
// Add polling fallback for /book (public, no auth)
useEffect(() => {
  if (!settings) return;
  const interval = setInterval(() => { fetchSlots(); }, 5000);
  return () => clearInterval(interval);
}, [settings, fetchSlots]);
```

Ten polling jest lekki (query na max 7 dni slotów) i gwarantuje świeżość danych.

**Pliki:** `src/hooks/usePublicBooking.tsx`

---

### 3. Booking/Reschedule — modal "Confirm Booking" zasłania toast "Slot no longer available"

**Co jest:** W `PublicBookingPage.tsx`, `handleSlotClick` przy reschedule zwraca `toast.error()`, ale modal Confirm Booking jest osobnym dialogiem. W `handleBook` (booking), `bookSlot` w `usePublicBooking` pokazuje toast, ale modal nie zamyka się automatycznie po failed booking.

**Rozwiązanie:**
- W `handleBook`: jeśli `bookSlot` zwraca `false`, zamknij modal natychmiast (`setSelectedSlot(null)`) i pokaż toast z dłuższym czasem (4 sekundy):
```ts
const success = await bookSlot(selectedSlot.id, name.trim(), email.trim());
setBooking(false);
if (success) { setSelectedSlot(null); ... }
else {
  setSelectedSlot(null);
  toast.error('Slot is no longer available. Please select another time.', { duration: 6000 });
}
```

- W `usePublicBooking.bookSlot`: zmienić toast na wariant z `duration: 6000`:
```ts
toast({ title: 'Slot no longer available', description: 'Please select another time.', variant: 'destructive', duration: 6000 });
```

**Pliki:** `src/pages/PublicBookingPage.tsx`, `src/hooks/usePublicBooking.tsx`

---

### 4. Dropdown studentów nie działa (klik + pisanie)

**Co jest:** Przejrzałem kod — `PopoverContent` w obu modalach NIE ma `onOpenAutoFocus={e => e.preventDefault()}` ani `onPointerDown`. Combobox wygląda poprawnie z `autoFocus` na `CommandInput`.

**Podejrzenie:** Problem może wynikać z faktu, że modale używają `DraggableDialog`, który przechwytuje eventy pointer. `DraggableDialogContent` może mieć focus trap lub pointer capture, który blokuje interakcje z Popover wewnątrz.

**Rozwiązanie:** W obu plikach dodać `modal={false}` do `Popover`, co zapobiega tworzeniu warstwy portalowej z focus trap:
```tsx
<Popover open={studentComboOpen} onOpenChange={setStudentComboOpen} modal={false}>
```

Oraz sprawdzić `DraggableDialog` — jeśli używa `onPointerDownOutside` na `DialogContent`, dodać event propagation handler.

**Dodatkowo** — dodać `onPointerDownOutside={e => e.preventDefault()}` na `PopoverContent`, żeby klik w Popover nie zamykał dialogu.

**Pliki:** 
- `src/components/calendar/SlotDetailModal.tsx` (linia 394)
- `src/components/calendar/UnifiedSlotModal.tsx` (linia 394)

---

### 5. Calendar Notifications — status "Done" rozbudować + natychmiastowa aktualizacja

**A) "Done" ma pokazywać kontekst akcji:**

W `CalendarNotificationBell.tsx`, zamiast:
```tsx
<CheckCircle2 className="h-3 w-3" /> Done
```
Pokazywać:
```tsx
const resolveLabel = (() => {
  if (n.notification_type === 'booking_pending') return 'Done — Approved';
  if (n.notification_type === 'reschedule_request') return 'Done — Resolved';
  if (n.notification_type === 'new_student') return 'Done — Added';
  if (n.notification_type === 'cancellation') return 'Done — Noted';
  return 'Done';
})();
// Ale to nie zadziała, bo is_resolved=true dla booking_pending może oznaczać approved LUB rejected.
```

Lepsze rozwiązanie — dodać `resolved_action` do metadata przy resolve:
- W `SlotDetailModal.handleConfirm` → `resolveNotifications` + update metadata `resolved_action: 'approved'`
- W `SlotDetailModal.handleReject` → `resolveNotifications` + update metadata `resolved_action: 'rejected'`

W `CalendarNotificationBell.tsx`:
```tsx
const resolvedAction = metadata.resolved_action;
const resolveLabel = isResolved
  ? `Done — ${resolvedAction === 'approved' ? 'Approved' : resolvedAction === 'rejected' ? 'Rejected' : resolvedAction || 'Resolved'}`
  : null;
```

**B) Natychmiastowa aktualizacja po akcji:**

Problem: `SlotDetailModal` resolve'uje notyfikacje przez Supabase update, ale `CalendarNotificationBell` ładuje je oddzielnie i Realtime listener reaguje z opóźnieniem (albo nie reaguje, bo RLS).

Rozwiązanie: Po `handleConfirm` / `handleReject` / `handleTeacherCancellation` / `handleStudentCancellation` wymusić refetch notyfikacji. Potrzebny jest callback z `CalendarNotificationBell` do refetcha — ale bell jest w CalendarPage, a SlotDetailModal też.

Najprościej: W `useCalendarNotifications` Realtime listener JUŻ JEST. Więc problem jest w tym, że `resolveNotifications` w `SlotDetailModal` robi update **anonimowo** (ale teacher jest zalogowany, więc to powinno działać via RLS `Teachers can update`).

Sprawdzam: `resolveNotifications` robi `supabase.from('calendar_notifications').update({ is_resolved: true }).eq('teacher_id', slot.teacher_id).eq('slot_id', slotId)` — to powinno triggerować Realtime. Ale update z metadata `resolved_action` wymaga dodania tego do update payload.

**Fix:** W `resolveNotifications` helper w `SlotDetailModal`, dodać parametr `resolvedAction`:
```ts
const resolveNotifications = async (slotId: string, types: string[], resolvedAction?: string) => {
  try {
    const updatePayload: any = { is_resolved: true };
    if (resolvedAction) {
      // We need to merge into metadata, but update replaces. 
      // Instead, store resolved_action as a separate approach:
      // Actually, we can't easily merge jsonb in a simple update.
      // Alternative: just update is_resolved and set a new column or use a different approach.
    }
    await supabase.from('calendar_notifications')
      .update(updatePayload)
      .eq('teacher_id', slot.teacher_id)
      .eq('slot_id', slotId)
      .in('notification_type', types);
  } catch (_) {}
};
```

Hmm, merging metadata is complex. **Simpler approach:** Dodać kolumnę `resolved_action text null` do `calendar_notifications` (migracja).

Przy resolve: `update({ is_resolved: true, resolved_action: 'approved' })`.

W bell: `n.resolved_action ? `Done — ${n.resolved_action}` : 'Done'`.

**Pliki:**
- Migracja SQL: `ALTER TABLE calendar_notifications ADD COLUMN IF NOT EXISTS resolved_action text;`
- `src/components/calendar/SlotDetailModal.tsx` (resolve z resolved_action)
- `src/components/calendar/CalendarNotificationBell.tsx` (render resolved_action)
- `src/hooks/useCalendarNotifications.tsx` (interfejs + resolved_action w typie)

---

### 6. Logi "Updated by teacher" — zbyt dużo informacji, brak nazwy akcji

**Co jest:** `SlotDetailModal.handleSave` (linia 122-127) loguje `action: 'updated'` z `details: { changes: updates }`, gdzie `updates` to surowy obiekt ze wszystkimi zmienionymi polami.

**Rozwiązanie:** W `handleSave`, zamiast jednego generycznego `updated`, logować konkretne akcje:
- Jeśli zmienił się `student_id` (z null na kogoś): `action: 'student_assigned'`
- Jeśli zmienił się `student_id` (z kogoś na null): `action: 'student_removed'`
- Jeśli zmienił się `student_id` (z kogoś na kogoś innego): `action: 'student_changed'`
- Jeśli zmieniły się `slot_date`/`start_time`/`end_time`: `action: 'time_changed'`
- Jeśli zmieniły się `notes`: `action: 'notes_updated'`
- Jeśli wiele zmian naraz → logować najważniejszą

**Konkretna implementacja w `handleSave`:**
```ts
// Determine specific action
let logActionName = 'updated';
const changedFields: string[] = [];
if (editStudentId !== (slot.student_id || 'none')) {
  if (editStudentId === 'none') logActionName = 'student_removed';
  else if (slot.student_id) logActionName = 'student_changed';
  else logActionName = 'student_assigned';
}
if (editDate !== slot.slot_date || editStartTime !== slot.start_time.slice(0,5) || editEndTime !== slot.end_time.slice(0,5)) {
  if (logActionName === 'updated') logActionName = 'time_changed';
  changedFields.push('time');
}
if (editNotes !== (slot.notes || '')) changedFields.push('notes');

// Log with minimal, readable details
const logDetails: any = {
  slot_date: editDate,
  start_time: editStartTime,
  end_time: editEndTime,
};
if (logActionName.includes('student')) {
  logDetails.student_name = students.find(s => s.id === editStudentId)?.name;
  logDetails.student_id = editStudentId !== 'none' ? editStudentId : null;
  if (slot.student_id) logDetails.previous_student = studentName;
}
if (changedFields.includes('time') && (editDate !== slot.slot_date || editStartTime !== slot.start_time.slice(0,5))) {
  logDetails.previous_date = slot.slot_date;
  logDetails.previous_time = `${slot.start_time.slice(0,5)}-${slot.end_time.slice(0,5)}`;
}
```

**W CalendarLogHistoryPage.tsx** — dodać `'student_assigned', 'student_removed', 'student_changed', 'time_changed', 'notes_updated'` do listy ACTIONS.

**Pliki:**
- `src/components/calendar/SlotDetailModal.tsx` (handleSave — zmiana logowania)
- `src/components/calendar/CalendarLogHistoryPage.tsx` (ACTIONS lista)

---

### 7. Powiadomienia — nie wszystkie klikalne + brak daty/godziny/email

**A) Nie wszystkie klikalne:**

W `CalendarPage.handleNotificationClick` (linia 216-223): szuka `slot` w aktualnych `slots` (widocznych na ekranie). Jeśli slot jest na innym tygodniu — nie znajdzie go i klik nic nie robi.

**Rozwiązanie:** Jeśli slot nie znaleziony w aktualnych `slots`, zrobić bezpośredni fetch z bazy:
```ts
const handleNotificationClick = async (n: CalendarNotification) => {
  if (n.slot_id) {
    let slot = slots.find(s => s.id === n.slot_id);
    if (slot) {
      setSelectedSlot(slot);
    } else {
      // Slot not in current view — fetch it and navigate to its date
      const { data } = await supabase.from('calendar_slots').select('*').eq('id', n.slot_id).single();
      if (data) {
        setCurrentDate(new Date(data.slot_date));
        // Wait for refetch, then open
        setTimeout(() => {
          setSelectedSlot(data as any);
        }, 500);
      }
    }
  }
};
```

Dla powiadomień typu `lesson_created_by_teacher` — to samo, bo mają `slot_id`.

**B) Brak daty/godziny/email na powiadomieniach:**

W `usePublicBooking.bookSlot` i `get-student-bookings/index.ts`, przy insercie notyfikacji dodajemy `metadata` z `slot_date`, `start_time`, `end_time`, `student_email`:

W `usePublicBooking.bookSlot` (linia 129-138), dodać metadata:
```ts
metadata: { 
  student_email: normalizedEmail, 
  slot_date: slot?.slot_date, 
  start_time: slot?.start_time?.slice(0,5), 
  end_time: slot?.end_time?.slice(0,5) 
},
```

W `CalendarNotificationBell.tsx`, wyświetlić te dane:
```tsx
{metadata.slot_date && (
  <p className="text-[10px] text-muted-foreground">
    {metadata.slot_date} at {metadata.start_time || ''}–{metadata.end_time || ''}
  </p>
)}
{metadata.student_email && (
  <p className="text-[10px] text-muted-foreground">{metadata.student_email}</p>
)}
```

**C) Powiadomienie "You added a new lesson" — zmiana tekstu:**

W `useCalendarSlots.createSlot` (linia 192-199), zmienić `notification_type: 'lesson_created_by_teacher'` — to jest OK, ale message powinien zaczynać się od "You added" (już jest). Ale problem w punkcie 9B mówi że wyświetla się "New lesson booked" — trzeba sprawdzić czy nie ma triggera DB. Kod w `createSlot` wyraźnie mówi `You added a new lesson` więc to powinno być ok. Ale jeśli istnieje osobny trigger — do usunięcia.

**Pliki:**
- `src/pages/CalendarPage.tsx` (handleNotificationClick — fetch z bazy)
- `src/hooks/usePublicBooking.tsx` (metadata w notyfikacjach)
- `src/hooks/useCalendarSlots.tsx` (metadata w notyfikacji lesson_created_by_teacher)
- `src/components/calendar/CalendarNotificationBell.tsx` (render daty/godziny/email)

---

### 8. Auto-zmiana statusu po minięciu lekcji — nowy status "needs_review"

**Co jest:** Obecnie lekcje `booked+confirmed` pozostają w statusie `booked` na zawsze, nawet po upłynięciu terminu.

**Rozwiązanie:**

**A) Nowy status `needs_review`** — NIE dodajemy go jako kolumnę/enum (bo status jest textem). Po prostu używamy tej wartości.

**B) Logika:** Na froncie w `CalendarPage`, po załadowaniu slotów, sprawdzamy które sloty `booked + confirmed` mają datę+czas w przeszłości i oznaczamy je jako `needs_review`. Ale zmiana statusu bezpośrednio w bazie z frontu jest lepsza (jednorazowo).

**Lepsze podejście:** W `useCalendarSlots.fetchSlots`, po pobraniu slotów, sprawdzamy lokalne sloty i dla tych co minęły aktualizujemy status:
```ts
// Auto-mark past booked lessons as needs_review
const now = new Date();
const pastBooked = (data || []).filter(s => {
  if (s.status !== 'booked' || !s.confirmed_at) return false;
  const slotEnd = new Date(`${s.slot_date}T${s.end_time}`);
  return slotEnd < now;
});
if (pastBooked.length > 0) {
  for (const s of pastBooked) {
    supabase.from('calendar_slots').update({ status: 'needs_review' }).eq('id', s.id).then(() => {});
  }
}
```

**C) Legend:** Dodać do `LEGEND_ITEMS`:
```ts
{ key: 'needs_review', label: 'Needs Review', badge: '?', color: 'bg-purple-200 border-purple-400' },
```

**D) SlotDetailModal:** Gdy `status === 'needs_review'`, pokazać 4 przyciski: Complete, No Show, Teacher Cancellation, Student Cancellation (te same co teraz dla booked+confirmed, ale bardziej widoczne).

**E) CalendarSlotCard** i inne widoki: dodać rendering dla `needs_review`.

**F) STATUS_BADGES w SlotDetailModal:** Dodać:
```ts
needs_review: { label: 'Needs Review', variant: 'secondary' },
```

**G) CalendarSlot type:** Dodać `'needs_review'` do statusu.

**Pliki:**
- `src/hooks/useCalendarSlots.tsx` (auto-mark + typ)
- `src/pages/CalendarPage.tsx` (LEGEND_ITEMS)
- `src/components/calendar/SlotDetailModal.tsx` (STATUS_BADGES + buttons)
- `src/components/calendar/CalendarSlotCard.tsx` (rendering)
- Wszelkie inne pliki renderujące statusy

---

### 9. Zmiana godziny edytując slot — "Error updating slot" + powiadomienia

**Co jest:** `SlotDetailModal.handleSave` (linia 107-129) robi `onUpdate(slot.id, updates)` który wywołuje `useCalendarSlots.updateSlot`. Ten robi `supabase.from('calendar_slots').update(updates).eq('id', slotId)`. Jeśli jest trigger `check_slot_overlap` w bazie, to blokuje update gdy nowy czas koliduje z innym slotem.

**Rozwiązanie A (zmiana godziny):** Przed `onUpdate`, sprawdzić czy nowy czas koliduje. Jeśli koliduje z available slotem — usunąć go. Jeśli koliduje z lesson — pokazać błąd. Jeśli nie koliduje — pozwolić na update.

W `handleSave`:
```ts
// Check for time change conflicts
if (editDate !== slot.slot_date || editStartTime !== slot.start_time.slice(0,5) || editEndTime !== slot.end_time.slice(0,5)) {
  const { data: conflicts } = await supabase
    .from('calendar_slots')
    .select('id, student_id, status')
    .eq('teacher_id', slot.teacher_id)
    .eq('slot_date', editDate)
    .neq('id', slot.id)
    .neq('status', 'cancelled')
    .neq('status', 'deleted')
    .lt('start_time', editEndTime + ':00')
    .gt('end_time', editStartTime + ':00');

  if (conflicts && conflicts.length > 0) {
    const hasLesson = conflicts.some(c => c.student_id);
    if (hasLesson) {
      toast.error('Cannot change time — conflicts with an existing lesson.');
      setSaving(false);
      return;
    }
    // Delete available slots that conflict
    for (const c of conflicts) {
      await supabase.from('calendar_slots').delete().eq('id', c.id);
    }
  }
}
```

Dodatkowo, jeśli slot ma studenta i zmieniono czas → wysłać email do studenta o zmianie godziny. Nowy typ emaila: `lesson_time_changed`.

**Rozwiązanie B (powiadomienie "You added" vs "New lesson booked"):**

W `useCalendarSlots.createSlot` (linia 192), message jest `You added a new lesson on...`. Sprawdzam czy nie ma DB triggera tworzącego osobne powiadomienie z innym tekstem. Jeśli jest — usunąć trigger.

Jeśli trigera nie ma, to znaczy że ta notyfikacja wyświetla się poprawnie. Problem mógł dotyczyć starego kodu. Ale aby upewnić się — wstawiam message z wyraźnym "You added":
```ts
message: `You added a new lesson on ${input.slot_date} at ${input.start_time.slice(0, 5)}`,
```
To JUŻ jest tak w kodzie. Jeśli user widzi "New lesson booked" to możliwe że to osobna notyfikacja z `booking_confirmed` typu. Trzeba dodać warunek — jeśli `booked_by === 'teacher'`, NIE tworzyć notyfikacji `booking_confirmed` (bo nauczyciel sam to zrobił).

**Pliki:**
- `src/components/calendar/SlotDetailModal.tsx` (conflict check + email)
- `supabase/functions/send-calendar-notification-email/index.ts` (nowy typ `lesson_time_changed`)
- `src/hooks/useCalendarSlots.tsx` (warunek na notyfikację)

---

### 10. /book — usunąć "Already have a booking?" + email readonly + logout

**Co jest:** `StudentBookingsSection` (linia 100-180) ma header "Already have a booking?" z polem email i przyciskiem Check.

**Rozwiązanie:**
- W `PublicBookingPage.tsx`, przekazać `defaultEmail={email}` (już jest, linia 378).
- W `StudentBookingsSection.tsx`:
  - Jeśli `defaultEmail` jest podany → ukryć sekcję email input, auto-fetch.
  - Zmienić header na "Your Lessons".
  - Email wyświetlić jako readonly text (nie input).

- W `PublicBookingPage.tsx`, pole "Your Email" w Confirm Booking dialog (linia 411-412) → `readOnly={true}` + zmienić style na disabled look.

- Dodać przycisk **Logout** w headerze `/book/:token`:
```tsx
{emailVerified && (
  <Button variant="ghost" size="sm" className="text-xs" onClick={() => {
    localStorage.removeItem(EMAIL_STORAGE_KEY);
    localStorage.removeItem(NAME_STORAGE_KEY);
    setEmailVerified(false);
    setEmail('');
    setName('');
  }}>
    Log out
  </Button>
)}
```

**Pliki:**
- `src/pages/PublicBookingPage.tsx` (email readonly + logout button)
- `src/components/calendar/StudentBookingsSection.tsx` (auto-show bookings, hide email field when defaultEmail present)

---

### 11. Book weekly — jeden zbiorczy request zamiast wielu

**Co jest:** `handleBook` w `PublicBookingPage` (linia 224-238) iteruje po `weeklySlotIds` i wywołuje `bookSlot` osobno dla każdego. Każdy booking tworzy osobną notyfikację.

**Rozwiązanie:** Dodać nowy action `book_batch` do `get-student-bookings` edge function, który przyjmuje tablicę `slotIds`, bookuje wszystkie atomowo i tworzy jedną zbiorczą notyfikację.

**Edge function `get-student-bookings/index.ts`** — dodać handler:
```ts
if (action === 'book_batch' && Array.isArray(slotIds)) {
  const successIds = [];
  const failedIds = [];
  
  for (const sid of slotIds) {
    const { data: check } = await supabase
      .from('calendar_slots').select('status').eq('id', sid).single();
    if (!check || check.status !== 'available') {
      failedIds.push(sid);
      continue;
    }
    const { error } = await supabase
      .from('calendar_slots')
      .update({ student_id, status: 'booked', ... })
      .eq('id', sid).eq('status', 'available');
    if (!error) successIds.push(sid);
    else failedIds.push(sid);
  }
  
  // One notification for all
  if (successIds.length > 0) {
    await supabase.from('calendar_notifications').insert({
      teacher_id, notification_type: autoConfirm ? 'booking_confirmed' : 'booking_pending',
      message: `${studentName} booked ${successIds.length} weekly lessons — awaiting confirmation`,
      student_name: studentName, slot_id: successIds[0],
      metadata: { student_email: email, slot_ids: successIds, count: successIds.length },
    });
  }
  
  // One email to teacher
  // One email to student
  
  return { success: true, booked: successIds.length, failed: failedIds.length };
}
```

**Frontend `PublicBookingPage.tsx`** — zamiast pętli `bookSlot`, wywołać:
```ts
if (bookWeekly && untilDate && weeklySlotIds.length > 0) {
  const { data, error } = await supabase.functions.invoke('get-student-bookings', {
    body: { token, email: email.trim(), action: 'book_batch', slotIds: weeklySlotIds, studentName: name.trim() },
  });
  if (data?.booked > 0) toast.success(`Booked ${data.booked} lessons!`);
  if (data?.failed > 0) toast.info(`${data.failed} slots were no longer available.`);
  refetchSlots();
}
```

**Pliki:**
- `supabase/functions/get-student-bookings/index.ts` (nowy action `book_batch`)
- `src/pages/PublicBookingPage.tsx` (zmiana handleBook)

---

## Kolejność wdrożenia

1. **Migracja SQL** (nowe kolumny w `calendar_settings` + `calendar_notifications`)
2. **Fix dropdown studentów** (punkt 4 — `modal={false}` na Popover)
3. **Logi "Updated"** (punkt 6 — konkretne akcje zamiast generycznego "updated")
4. **Powiadomienia klikalne + metadata** (punkt 7)
5. **Notifications "Done — Approved/Rejected"** (punkt 5)
6. **Zmiana godziny slota** (punkt 9)
7. **Realtime polling fallback** (punkt 2)
8. **Modal booking — zamykanie po błędzie** (punkt 3)
9. **Email ustawienia + worksheet linki** (punkt 1)
10. **/book — email readonly + logout + StudentBookingsSection** (punkt 10)
11. **Book weekly zbiorczy** (punkt 11)
12. **Status needs_review** (punkt 8)
13. **Deploy edge functions + docs update**

## Pliki (podsumowanie)

| Plik | Akcja |
|---|---|
| Migracja SQL | NOWA (kolumny w calendar_settings, calendar_notifications) |
| `src/hooks/useCalendarSettings.tsx` | EDIT (interfejs) |
| `src/pages/CalendarSettingsPage.tsx` | EDIT (email notification switches) |
| `src/components/calendar/SlotDetailModal.tsx` | EDIT (dropdown fix, logi, conflict check, resolve action) |
| `src/components/calendar/UnifiedSlotModal.tsx` | EDIT (dropdown fix) |
| `src/components/calendar/CalendarNotificationBell.tsx` | EDIT (resolved_action, metadata display) |
| `src/hooks/useCalendarNotifications.tsx` | EDIT (typ resolved_action) |
| `src/hooks/useCalendarSlots.tsx` | EDIT (needs_review auto-mark, notyfikacja metadata) |
| `src/hooks/usePublicBooking.tsx` | EDIT (polling, metadata, toast duration) |
| `src/pages/PublicBookingPage.tsx` | EDIT (modal close on fail, email readonly, logout, batch book) |
| `src/components/calendar/StudentBookingsSection.tsx` | EDIT (auto-show, hide email) |
| `src/pages/CalendarPage.tsx` | EDIT (legend needs_review, notification click fetch) |
| `src/components/calendar/CalendarLogHistoryPage.tsx` | EDIT (ACTIONS lista) |
| `supabase/functions/send-calendar-notification-email/index.ts` | EDIT (worksheet links, lesson_time_changed) |
| `supabase/functions/get-student-bookings/index.ts` | EDIT (book_batch, settings check) |
| Docs (7 plików) | EDIT |

