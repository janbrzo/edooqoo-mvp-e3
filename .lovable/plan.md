

# Plan naprawy 6 problemów — bez regresji

## Problem 1: Label "Default Meeting Link" nie zmienia się na "Custom Meeting Link"

**Plik:** `src/pages/StudentPage.tsx`, linia 160

**Obecny kod:**
```tsx
<label className="text-sm font-medium text-muted-foreground">Default Meeting Link</label>
```

**Rozwiązanie:** Zmienić na dynamiczny label zależny od `mode`:
```tsx
<label className="text-sm font-medium text-muted-foreground">
  {mode === 'custom' ? 'Custom Meeting Link' : 'Default Meeting Link'}
</label>
```

Gdy `autoLinkEnabled` jest `false` (brak GCal), to label powinien mówić "Meeting Link" (bo nie ma rozróżnienia default/custom):
```tsx
<label className="text-sm font-medium text-muted-foreground">
  {!autoLinkEnabled ? 'Meeting Link' : mode === 'custom' ? 'Custom Meeting Link' : 'Default Meeting Link'}
</label>
```

---

## Problem 2: Reschedule nie działa na stronie `/my/.../lessons`

**Diagnoza:** `StudentHubLessons.tsx` (linia 235-241) renderuje `StudentBookingsSection` BEZ propsów `onRescheduleStart` i `rescheduleBookingId`. Te propsy są opcjonalne w komponencie, więc przycisk "Reschedule" jest widoczny, ale po kliknięciu `onRescheduleStart` jest `undefined` i nic się nie dzieje.

**Jak to powinno działać:** Student klika "Reschedule" na booking card → booking zostaje podświetlony → student klika available slot w kalendarzu powyżej → system wywołuje edge function `get-student-bookings` z `action: 'reschedule'`, `slotId` (stary) i `newSlotId` (nowy).

**Rozwiązanie w `StudentHubLessons.tsx`:**

1. Dodać stan `rescheduleBookingId`:
```tsx
const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
```

2. Przekazać propsy do `StudentBookingsSection`:
```tsx
<StudentBookingsSection
  settings={settings as any}
  token={teacherToken}
  availableSlots={availableSlots}
  onBookingChanged={() => refetchSlots()}
  defaultEmail={email}
  onRescheduleStart={(bookingId) => setRescheduleBookingId(bookingId)}
  rescheduleBookingId={rescheduleBookingId}
/>
```

3. Zmienić handler kliknięcia na slot w kalendarzu — jeśli `rescheduleBookingId` jest ustawiony, zamiast otwierać dialog bookingu, wykonać reschedule:
```tsx
const handleSlotClick = (slot: CalendarSlot) => {
  if (rescheduleBookingId) {
    handleReschedule(rescheduleBookingId, slot.id);
    return;
  }
  setSelectedSlot(slot);
};
```

4. Dodać funkcję `handleReschedule`:
```tsx
const handleReschedule = async (oldSlotId: string, newSlotId: string) => {
  if (!email || !teacherToken) return;
  try {
    const { data, error } = await supabase.functions.invoke('get-student-bookings', {
      body: {
        token: teacherToken,
        email: email.trim(),
        action: 'reschedule',
        slotId: oldSlotId,
        newSlotId,
      },
    });
    if (error) throw error;
    if (data?.autoRescheduled) {
      toast({ title: 'Lesson rescheduled successfully' });
    } else if (data?.success) {
      toast({ title: 'Reschedule request sent — awaiting teacher confirmation' });
    } else {
      toast({ title: data?.error || 'Could not reschedule', variant: 'destructive' });
    }
  } catch (err: any) {
    toast({ title: 'Reschedule failed', description: err.message, variant: 'destructive' });
  }
  setRescheduleBookingId(null);
  refetchSlots();
};
```

5. Zmienić `onClick` na slot buttonach w gridzie (linia ~213) z `setSelectedSlot(slot)` na `handleSlotClick(slot)`.

6. Wizualnie oznaczyć, że jesteśmy w trybie reschedule — nad gridem dodać banner:
```tsx
{rescheduleBookingId && (
  <div className="bg-primary/10 border border-primary/30 rounded-md p-2 flex items-center justify-between text-sm">
    <span>Select a new time slot to reschedule your lesson</span>
    <Button variant="ghost" size="sm" onClick={() => setRescheduleBookingId(null)}>Cancel</Button>
  </div>
)}
```

---

## Problem 3: Modale SlotDetailModal (Lesson Pending / Lesson Booked) za długie

**Diagnoza:** Modal zawiera: Student selector, Date, Start/End/Duration (3 kolumny), Worksheet, Notes, Discount, Meeting Link, Student booking info, Cancellation info, History, Footer buttons. Na ekranie 754px to za dużo.

**Rozwiązanie — oszczędność ~25-30% wysokości bez usuwania niczego:**

**Plik:** `src/components/calendar/SlotDetailModal.tsx`

a) **Date + Start/End/Duration w jednym wierszu** (linie 794-811):
Zamiast osobnego wiersza na Date i osobnego na Start/End/Duration, połączyć w jeden wiersz `grid-cols-4`:
```tsx
<div className="grid grid-cols-4 gap-2">
  <div><Label className="text-xs">Date</Label><Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="h-8 text-xs" /></div>
  <div><Label className="text-xs">Start</Label><Input type="time" value={editStartTime} onChange={e => handleStartTimeChange(e.target.value)} className="h-8 text-xs" /></div>
  <div><Label className="text-xs">End</Label><Input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} className="h-8 text-xs" /></div>
  <div><Label className="text-xs">Duration</Label>
    <Select ...><SelectTrigger className="h-8 text-xs">...</SelectTrigger>...</Select>
  </div>
</div>
```
**Oszczędność:** ~36px (cały wiersz Date).

b) **Worksheet + Discount w jednym wierszu** (linie 813-846):
```tsx
<div className="grid grid-cols-[1fr_80px] gap-2">
  <div>
    <Label className="text-xs">Worksheet</Label>
    {/* existing worksheet select */}
  </div>
  <div>
    <Label className="text-xs">Discount %</Label>
    <Input type="number" ... className="h-8 text-xs" />
  </div>
</div>
```
**Oszczędność:** ~36px (cały wiersz Discount).

c) **Notes i Meeting Link w jednym wierszu** (linie 841, 848-857):
```tsx
<div className="grid grid-cols-2 gap-2">
  <div><Label className="text-xs">Notes</Label><AutoResizeTextarea ... rows={1} className="min-h-[32px] text-xs" /></div>
  {!isBlock && hasStudent && (
    <div><Label className="text-xs">Meeting Link</Label><Input ... className="h-8 text-xs" /></div>
  )}
</div>
```
**Oszczędność:** ~36px (cały wiersz Meeting Link).

d) **Zmniejszyć `space-y-3` na `space-y-2`** (linia 735) i zmniejszyć inputs z `h-9` na `h-8`.

e) **Dodać `max-h-[85vh] overflow-y-auto`** do `DraggableDialogContent` jako safety net, żeby przy małych ekranach zawsze dało się scrollować.

**Łączna oszczędność:** ~108px + drobne marginesy = ~120px, co daje ok. 25% redukcji.

---

## Problem 4: Sortowanie lesson cards na `/my/.../lessons`

**Diagnoza:** W `StudentBookingsSection.tsx` linia 220-226 sortowanie dzieli bookingi na upcoming i past:
```tsx
const todayStr = format(new Date(), 'yyyy-MM-dd');
const upcoming = result.filter(b => `${b.slot_date}${b.start_time}` >= `${todayStr}00:00`);
const past = result.filter(b => `${b.slot_date}${b.start_time}` < `${todayStr}00:00`);
upcoming.sort((a, b) => a... ascending);
past.sort((a, b) => b... descending);
return [...upcoming, ...past];
```

**Problem:** Upcoming sortowane ascending = na górze najwcześniejsze (6 Apr), potem późniejsze (13 Apr). Past sortowane descending. To daje kolejność: `6, 6, 7, 10, 11, 11, 12, 13, 13 | 5, 5, 5, 4, 4` — dokładnie to co user widzi.

**Wymaganie usera:** "Na samej górze najnowsze, na dole najstarsze" — czyli **descending** (13→12→11→...→4→3→2→1).

**Ale uwaga** — memory mówi: "Widok lekcji sortuje bookingi chronologicznie rosnąco, auto-scroll do Today". To był świadomy wybór. Teraz user chce odwrotnie.

**Rozwiązanie:** Zmienić sortowanie na jednolite descending (najnowsze na górze):
```tsx
// Single descending sort — newest first
result.sort((a: any, b: any) => 
  `${b.slot_date}${b.start_time}`.localeCompare(`${a.slot_date}${a.start_time}`)
);
return result;
```

Usunąć podział na upcoming/past z sortowania. Auto-scroll do "Today" nadal zadziała, bo `data-date` atrybuty pozostają na elementach.

**Zaktualizować scroll logic** (linia 236-261): przy descending order najnowsze daty są na górze, więc "today" jest gdzieś w środku/na górze. Logika szukania elementu z `data-date >= todayStr` musi być odwrócona — szukamy **pierwszego** elementu z datą <= today (bo lista jest descending):

```tsx
const scrollToToday = useCallback(() => {
  if (!listRef.current) return;
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const allDateEls = Array.from(listRef.current.querySelectorAll('[data-date]'));
  if (allDateEls.length === 0) return;
  // Descending: find first element with date <= today
  let targetIdx = -1;
  for (let i = 0; i < allDateEls.length; i++) {
    const d = allDateEls[i].getAttribute('data-date') || '';
    if (d <= todayStr) { targetIdx = i; break; }
  }
  if (targetIdx === -1) {
    listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    return;
  }
  const scrollIdx = Math.max(0, targetIdx - 1);
  const targetEl = allDateEls[scrollIdx] as HTMLElement;
  if (targetEl && listRef.current) {
    const containerTop = listRef.current.getBoundingClientRect().top;
    const elTop = targetEl.getBoundingClientRect().top;
    const offset = elTop - containerTop + listRef.current.scrollTop;
    listRef.current.scrollTo({ top: offset, behavior: 'smooth' });
  }
}, []);
```

---

## Problem 5: Wyświetlić email zalogowanego użytkownika na `/my/`

**Plik:** `src/components/student-hub/StudentHubLayout.tsx`, linia 50

**Obecny kod:**
```tsx
<Button variant="ghost" size="sm" className="text-xs" onClick={handleLogout}>
  <LogOut className="h-3.5 w-3.5 mr-1" /> Log out
</Button>
```

**Rozwiązanie:** Importować `getSavedHubEmail` i wyświetlić email obok Log out:
```tsx
import { clearHubEmail, getSavedHubEmail } from '@/hooks/useStudentHubData';
```

```tsx
<div className="flex items-center gap-2">
  <span className="text-xs text-muted-foreground hidden sm:inline">{getSavedHubEmail()}</span>
  <Button variant="ghost" size="sm" className="text-xs" onClick={handleLogout}>
    <LogOut className="h-3.5 w-3.5 mr-1" /> Log out
  </Button>
</div>
```

---

## Problem 6: Zmiana "Bulk Delete" na "Bulk Actions" z ograniczeniem zaznaczania do jednego typu slotów

**Plik:** `src/pages/CalendarPage.tsx`

### 6a. Zmiana nazwy i rozszerzenie akcji

**Linia 311-312:** Zmienić label:
```tsx
Bulk Actions
```

### 6b. Ograniczenie zaznaczania do jednego typu slotu

Obecny kod (linia 162-170) w `handleSlotClick` pozwala zaznaczać tylko sloty bez studenta (`if (slot.student_id) return`). Trzeba zmienić logikę:

Dodać stan `selectionType`:
```tsx
const [selectionType, setSelectionType] = useState<string | null>(null);
```

Zmienić `handleSlotClick` w trybie selekcji:
```tsx
if (selectionMode) {
  // Determine slot type for selection grouping
  const slotType = getSlotSelectionType(slot);
  
  if (selectionType && slotType !== selectionType) return; // different type — ignore
  
  setSelectedSlotIds(prev => {
    const next = new Set(prev);
    if (next.has(slot.id)) {
      next.delete(slot.id);
      if (next.size === 0) setSelectionType(null); // reset when empty
    } else {
      next.add(slot.id);
      if (!selectionType) setSelectionType(slotType); // lock type on first selection
    }
    return next;
  });
  return;
}
```

Funkcja `getSlotSelectionType`:
```tsx
const getSlotSelectionType = (slot: CalendarSlot): string => {
  if ((slot.status as any) === 'needs_review') return 'needs_review';
  if (slot.status === 'booked' && !slot.confirmed_at) return 'pending';
  if (slot.status === 'booked' && slot.confirmed_at) return 'booked';
  if (slot.status === 'available') return 'available';
  if (slot.status === 'completed') return 'completed';
  if (slot.status === 'no_show') return 'no_show';
  return slot.status;
};
```

### 6c. Dynamiczne akcje w zależności od typu zaznaczonych slotów

Zamiast tylko "Delete (N)" button, wyświetlić akcje pasujące do zaznaczonego typu:

```tsx
{selectionMode && (
  <div className="flex items-center gap-1">
    {selectionType === 'available' && (
      <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={handleBatchDelete} disabled={selectedSlotIds.size === 0}>
        Delete ({selectedSlotIds.size})
      </Button>
    )}
    {selectionType === 'pending' && (
      <>
        <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={handleBatchConfirm} disabled={selectedSlotIds.size === 0}>
          Confirm ({selectedSlotIds.size})
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs text-destructive" onClick={handleBatchReject} disabled={selectedSlotIds.size === 0}>
          Reject ({selectedSlotIds.size})
        </Button>
      </>
    )}
    {selectionType === 'needs_review' && (
      <>
        <Button size="sm" className="h-8 text-xs" onClick={() => handleBatchStatusChange('completed')} disabled={selectedSlotIds.size === 0}>
          Complete ({selectedSlotIds.size})
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleBatchStatusChange('no_show')} disabled={selectedSlotIds.size === 0}>
          No Show ({selectedSlotIds.size})
        </Button>
      </>
    )}
    {selectionType === 'booked' && (
      <>
        <Button size="sm" className="h-8 text-xs" onClick={() => handleBatchStatusChange('completed')} disabled={selectedSlotIds.size === 0}>
          Complete ({selectedSlotIds.size})
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleBatchStatusChange('no_show')} disabled={selectedSlotIds.size === 0}>
          No Show ({selectedSlotIds.size})
        </Button>
      </>
    )}
    {selectedSlotIds.size > 0 && (
      <span className="text-xs text-muted-foreground ml-1">
        {selectionType} selected
      </span>
    )}
    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exitSelectionMode}>Cancel</Button>
  </div>
)}
```

### 6d. Nowe handlery batch

```tsx
const handleBatchConfirm = async () => {
  if (selectedSlotIds.size === 0) return;
  if (!window.confirm(`Confirm ${selectedSlotIds.size} pending bookings?`)) return;
  const ids = Array.from(selectedSlotIds);
  await supabase.from('calendar_slots')
    .update({ confirmed_at: new Date().toISOString() })
    .in('id', ids);
  // Log
  for (const id of ids) {
    supabase.from('calendar_slot_logs').insert({
      slot_id: id, teacher_id: user?.id, action: 'confirmed', actor: 'teacher', details: { batch: true },
    } as any).catch(() => {});
  }
  toast.success(`Confirmed ${ids.length} bookings`);
  exitSelectionMode();
  refetch();
};

const handleBatchReject = async () => {
  if (selectedSlotIds.size === 0) return;
  if (!window.confirm(`Reject ${selectedSlotIds.size} pending bookings?`)) return;
  const ids = Array.from(selectedSlotIds);
  await supabase.from('calendar_slots')
    .update({ status: 'available', student_id: null, booked_at: null, booked_by: null, confirmed_at: null, student_notes: null, title: null } as any)
    .in('id', ids);
  toast.success(`Rejected ${ids.length} bookings`);
  exitSelectionMode();
  refetch();
};

const handleBatchStatusChange = async (status: string) => {
  if (selectedSlotIds.size === 0) return;
  if (!window.confirm(`Mark ${selectedSlotIds.size} slots as ${status}?`)) return;
  const ids = Array.from(selectedSlotIds);
  const updates: any = { status };
  await supabase.from('calendar_slots').update(updates).in('id', ids);
  toast.success(`${ids.length} slots marked as ${status}`);
  exitSelectionMode();
  refetch();
};
```

Reset `selectionType` w `exitSelectionMode`:
```tsx
const exitSelectionMode = () => {
  setSelectionMode(false);
  setSelectedSlotIds(new Set());
  setSelectionType(null);
};
```

---

## Pliki do zmiany

| Plik | Zmiany |
|------|--------|
| `src/pages/StudentPage.tsx` | Dynamiczny label Default/Custom Meeting Link |
| `src/pages/StudentHubLessons.tsx` | Dodanie stanu reschedule, handler, przekazanie propsów, banner |
| `src/components/calendar/SlotDetailModal.tsx` | Kompaktowy layout: Date+Time w 1 wierszu, Worksheet+Discount w 1 wierszu, Notes+Meeting w 1 wierszu, mniejsze inputy |
| `src/components/calendar/StudentBookingsSection.tsx` | Jednolite sortowanie descending, fix scrollToToday |
| `src/components/student-hub/StudentHubLayout.tsx` | Wyświetlenie emaila obok Log out |
| `src/pages/CalendarPage.tsx` | Bulk Actions: nowy label, selectionType, dynamiczne akcje, handlery batch |
| `docs/llm-context.md` | Aktualizacja sekcji calendar, student hub, meeting links |
| `llms.txt` | Aktualizacja RAG keywords i mechanik |

## Czego NIE ruszamy
- Edge functions (logika reschedule działa poprawnie)
- Żadnych migracji DB
- Worksheet engine
- Logiki GCal sync

