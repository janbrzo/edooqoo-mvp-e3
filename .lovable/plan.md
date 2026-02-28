

# Plan naprawy kalendarza — FAZA 2

## Analiza problemów

Przeanalizowałem cały kod kalendarza. Oto znalezione problemy i rozwiązania:

---

## Krok 1: Linie siatki godzin — NADAL ŹLE

**Problem:** Logika `isFullHour = i % 2 === 0` jest błędna. Pierwszy wiersz (`i=0`) to `START_HOUR:00` (pełna godzina), DRUGI (`i=1`) to `START_HOUR:30` (pół). Ale wizualnie: wiersz `i=0` KOŃCZY się na dole border-bottom, który odpowiada linii `START_HOUR:30` — bo border-bottom wiersza `i=0` to linia na dole tego wiersza, czyli w punkcie 30 minut. Więc `i % 2 === 0` — border wiersza 0 = linia na `XX:30`, border wiersza 1 = linia na `XX+1:00`. **To jest odwrócone!**

**Fix:** Zamienić logikę: `i % 2 === 0` → `i % 2 !== 0` dla grid lines (NIE dla gutter).

Dotyczy: `CalendarWeekView.tsx` (linie 87, 111) i `CalendarDayView.tsx` (linie 76, 85).

**Gutter (lewa kolumna z godzinami):** Tu `isFullHour = i % 2 === 0` jest POPRAWNE bo label `HH:00` ma się pojawiać na początku wiersza `i=0`. Ale styl border musi być odwrócony tak jak grid. Wiersz `i=0` (pełna godzina) ma cienką linię na dole (bo to linia `XX:30`), wiersz `i=1` (pół godziny) ma grubą linię na dole (bo to linia `XX+1:00`).

**Konkretne zmiany:**

W **CalendarWeekView.tsx**:
- Linia 87 (gutter): `isFullHour ? 'border-border/80' : 'border-border/15'` → `isFullHour ? 'border-border/15' : 'border-border/80'`
- Linia 111 (grid): `i % 2 === 0 ? 'border-border/80' : 'border-border/15'` → `i % 2 === 0 ? 'border-border/15' : 'border-border/80'`

W **CalendarDayView.tsx**:
- Linia 76 (gutter): tak samo
- Linia 85 (grid): tak samo

---

## Krok 2: Notes — AutoResizeTextarea

**Problem:** Pole Notes używa `<Textarea>` z `rows={2}`. Ma być jednolinijkowe z auto-resize.

**Fix:** W `UnifiedSlotModal.tsx` linia 563 i `SlotDetailModal.tsx` linia 224: zamienić `<Textarea ... rows={2} />` na `<AutoResizeTextarea ... rows={1} />`. Import `AutoResizeTextarea` z `@/components/ui/AutoResizeTextarea`.

---

## Krok 2A: Recurring Lesson — data From z kalendarza

**Problem:** `recurFrom` jest pusty na start, ale ma być ustawiony na klikniętą datę (lub dzisiejszą jeśli przez +Add).

**Fix:** W `UnifiedSlotModal.tsx` linia 155: zmienić `setRecurFrom('')` na `setRecurFrom(format(d, 'yyyy-MM-dd'))`.

---

## Krok 2B: Link Worksheet na Single Lesson — identyczne jak Available Slot

**Problem:** Worksheet link pojawia się TYLKO gdy `studentId !== 'none' && studentWorksheets.length > 0`. Ma być widoczny ZAWSZE (nawet bez studenta), tak jak w SlotDetailModal — "Worksheet: None [ikona linkowania]".

**Fix:** W `UnifiedSlotModal.tsx`:
1. Usunąć warunek `slotType === 'lesson' && lessonMode === 'single' && studentId !== 'none' && studentWorksheets.length > 0` (linia 533)
2. Zamienić na widok identyczny jak w `SlotDetailModal` linia 204-221:
```tsx
{mode === 'single' && (
  <div className="flex justify-between items-center">
    <span className="text-xs text-muted-foreground">Worksheet</span>
    <div className="flex items-center gap-1">
      {worksheetId !== 'none' ? (
        <span className="text-xs font-medium truncate max-w-[200px]">
          {studentWorksheets.find(w => w.id === worksheetId)?.title || 'Linked'}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">None</span>
      )}
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" 
        disabled={studentId === 'none' && slotType === 'lesson'}
        onClick={/* open link worksheet */}>
        <Link2 className="h-3 w-3" />
      </Button>
    </div>
  </div>
)}
```
3. Dla Available Slot: worksheet linking powinno być aktywne bez studenta — w `LinkWorksheetModal` studentId jest null więc pokażą się WSZYSTKIE worksheety nauczyciela.
4. Dla Lesson: worksheet linking aktywne dopiero po wybraniu studenta.

**Dodatkowa logika:** Potrzebujemy mechanizmu do otwierania `LinkWorksheetModal` z `UnifiedSlotModal`. Dodać stan `showLinkWorksheet: boolean` i renderować `LinkWorksheetModal` wewnątrz modalu (z-index wyższy).

---

## Krok 2C: Student Combobox — kliknięcie nie działa + dodać na innych modalach

**Problem:** `CommandItem onSelect` nie zamyka popovera poprawnie. Prawdopodobny powód: `value={s.name}` w CommandItem koliduje z wyszukiwaniem.

**Fix:** W `UnifiedSlotModal.tsx` linia 402:
```tsx
<CommandItem key={s.id} value={s.name} onSelect={() => { 
  setStudentId(s.id); 
  setStudentComboOpen(false); 
}}>
```
Problem może być w tym że `onSelect` dostaje lowercase value. Zmienić na:
```tsx
<CommandItem key={s.id} value={`${s.name}_${s.id}`} onSelect={() => { 
  setStudentId(s.id); 
  setStudentComboOpen(false); 
}}>
```

**Dodać Combobox na SlotDetailModal** (linia 181): zamienić `<Select>` na ten sam Combobox pattern.

---

## Krok 2D: Conflicts — pokazywać NA MODALU, nie zamykać

**Problem:** Gdy createSlotsBatch lub createSlot zwraca null (conflict), modal się zamyka bo `handleSubmit` wywołuje `onCreateBatch/onCreateSingle` które pokazują toast i zwracają null. Ale `handleSubmit` nie zamyka modalu (linia 333 `onOpenChange(false)` jest w try na końcu). JEDNAK: conflict check jest PRZED wywołaniem `onCreateBatch` — linia 321-322 ustawia `setConflicts` i `setSaving(false); return;`. Więc modal NIE powinien się zamykać.

**Prawdopodobny problem:** Recurring lesson path (linia 319-332) — `checkConflicts` zwraca `blocked=true`, ustawia `setConflicts(info); setConflictBlocked(true); setSaving(false); return;` — to POWINNO działać i wyświetlać conflicts na modalu.

**ALE:** Sprawdzam: `recurringSlots` jest obliczany przez `useMemo` z zależnością od `recurDays, recurFrom, recurTo, startTime, endTime, studentId`. Jeśli te wartości się zmieniły po pierwszym renderze, `recurringSlots` powinien być aktualny. Conflict check powinien działać.

Możliwy inny problem: jeśli użytkownik używa trybu "single lesson" i klika Create, `handleSubmit` linia 307-318 — to wywołuje `onCreateSingle` (linia 314-318). Jeśli `onCreateSingle` (czyli `createSlot`) pokazuje toast "Time conflict" i zwraca null, modal się nie zamyka (linia 333 `onOpenChange(false)` jest po await, ale null nie rzuca błędu). Ale problem jest taki że toast pokazuje się w prawym dolnym rogu zamiast na modalu.

**Root cause:** `createSlot` w `useCalendarSlots.tsx` (linia 119) sam pokazuje toast. To jest DRUGIE sprawdzenie conflictu. Pierwsze jest w `UnifiedSlotModal.checkConflicts` (client-side, linia 251-288). Ale `checkConflicts` sprawdza `existingSlots` z props — to jest stale dane z momentu otwarcia modalu. Jeśli dane się zmieniły (np. w tle ktoś dodał slot), `existingSlots` jest nieaktualne i `checkConflicts` przepuści, ale `createSlot` (server-side) zablokuje.

**Fix:** W `handleSubmit`: po wywołaniu `onCreateSingle/onCreateBatch`, jeśli zwróci `null`, NIE zamykać modalu i pokazać conflict warning na modalu:
```tsx
const result = await onCreateSingle({...});
if (!result) {
  // Server detected conflict — show on modal
  setConflicts([{ date, time: `${startTime}–${endTime}`, hasStudent: true, type: 'blocked', studentName: 'existing lesson' }]);
  setConflictBlocked(true);
  setSaving(false);
  return; // DON'T close modal
}
onOpenChange(false);
```

---

## Krok 3: Linkowanie worksheet — znikający student

**Problem:** W `CalendarPage.handleWorksheetLinked` (linia 109-113) — robi `updateSlot(linkWorksheetSlot.id, { worksheet_id })`. To aktualizuje TYLKO worksheet_id. Ale `linkWorksheetSlot` ma `student_id` z `handleLinkWorksheet` (linia 106). Problem: `updateSlot` nie aktualizuje studenta.

**Prawdziwy problem:** Na modalu `SlotDetailModal` użytkownik edytuje `editStudentId`. Klikając "Link Worksheet", wywołuje `onLinkWorksheet(slot, editStudentId)`. `handleLinkWorksheet` tworzy nowy obiekt `{...slot, student_id: studentId}`. Ale `slot` to oryginalny slot (bez studenta). `LinkWorksheetModal` otwiera się, slot w tle nadal nie ma studenta (bo nie zapisano zmian).

Po podlinkowaniu, `handleWorksheetLinked` robi `updateSlot(id, {worksheet_id})` — nie zapisuje studenta! Następnie modal się zamyka, slot w bazie ma worksheet ale nie ma studenta.

**Fix:** W `handleWorksheetLinked`: jeśli `linkWorksheetSlot.student_id` różni się od oryginalnego slotu, też zaktualizować student_id:
```tsx
const handleWorksheetLinked = async (worksheetId: string | null) => {
  if (linkWorksheetSlot) {
    const updates: any = { worksheet_id: worksheetId };
    // Also save student if changed
    const originalSlot = slots.find(s => s.id === linkWorksheetSlot.id);
    if (originalSlot && linkWorksheetSlot.student_id !== originalSlot.student_id) {
      updates.student_id = linkWorksheetSlot.student_id;
      updates.status = linkWorksheetSlot.student_id ? 'booked' : 'available';
      if (linkWorksheetSlot.student_id) {
        updates.booked_at = new Date().toISOString();
        updates.booked_by = 'teacher';
        updates.confirmed_at = new Date().toISOString();
      }
    }
    await updateSlot(linkWorksheetSlot.id, updates);
  }
};
```

**Dodatkowe:** Worksheet linking nieaktywne bez studenta na modalu LESSON — dodać `disabled` prop do przycisku Link na `SlotDetailModal` i `UnifiedSlotModal` jeśli `student_id === 'none'` i to jest lesson.

---

## Krok 4: Cancel Lesson — potwierdzenie + zachowanie slotu

**Problem:** "Cancel Lesson" (linia 257-259) wywołuje `handleStatusChange('cancelled')` co ustawia `status=cancelled, cancelled_at, cancelled_by='teacher'` ale NIE odłącza studenta. To jest częściowo OK.

**Wymagane zmiany:**

1. **Potwierdzenie przed Cancel:** Dodać `AlertDialog` lub `window.confirm()`:
```tsx
const handleCancelLesson = async () => {
  if (!window.confirm('Cancel this lesson? The student will be detached and the slot will be marked as cancelled.')) return;
  await onUpdate(slot.id, {
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancelled_by: 'teacher',
    cancellation_reason: `Cancelled by teacher. Student: ${students.find(s => s.id === slot.student_id)?.name || 'unknown'}`,
  } as any);
  onOpenChange(false);
};
```

2. **Cancelled slot info na dole:** Gdy `slot.status === 'cancelled'`, dodać sekcję:
```tsx
{slot.status === 'cancelled' && (
  <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-xs space-y-1">
    <p className="font-medium text-red-700">Cancelled</p>
    {slot.cancelled_at && <p>When: {format(new Date(slot.cancelled_at), 'MMM d, yyyy HH:mm')}</p>}
    {slot.cancelled_by && <p>By: {slot.cancelled_by}</p>}
    {slot.cancellation_reason && <p>{slot.cancellation_reason}</p>}
  </div>
)}
```

3. **Rename Delete → Delete Slot** — linia 269: zmienić tekst z `'Delete'` na `'Delete Slot'`.

---

## Krok 5: Conflicts info — nie pokazywać "Available slot (will be replaced)"

**Problem:** Linia 580 w UnifiedSlotModal: `{c.type === 'replaceable' && ' (will be replaced)'}` — te sloty nie powinny wyświetlać się w conflictach w ogóle, bo to nie jest problem. Użytkownik widzi "conflict" a to normalna operacja.

**Fix:** W `checkConflicts` (linia 276-284): gdy `isAddingLesson && !hasStudent` (available slot pod lesson), dodawać do `replaceable` ale NIE do `info[]`:
```tsx
if (isAddingLesson) {
  replaceable.push(ov);
  // DON'T add to info — silent replacement
}
```

---

## Krok 7: Multi-select — wizualne zaznaczenie

**Problem:** Zaznaczone sloty nie mają żadnego wizualnego oznaczenia.

**Fix:** W `CalendarSlotCard.tsx`: dodać props `isSelected?: boolean` i `selectionMode?: boolean`:
```tsx
interface CalendarSlotCardProps {
  slot: CalendarSlot;
  studentName?: string;
  onClick: (slot: CalendarSlot) => void;
  compact?: boolean;
  isSelected?: boolean;
  selectionMode?: boolean;
}
```
W renderowaniu: jeśli `isSelected`, dodać styl `ring-2 ring-primary bg-primary/20` i checkbox overlay:
```tsx
{selectionMode && !slot.student_id && (
  <div className="absolute top-0.5 right-0.5">
    <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center',
      isSelected ? 'bg-primary border-primary text-white' : 'border-muted-foreground/50 bg-background'
    )}>
      {isSelected && <Check className="h-3 w-3" />}
    </div>
  </div>
)}
```

**Propagacja props:** W `CalendarWeekView` i `CalendarDayView` przekazać `selectionMode` i `selectedIds` do `CalendarSlotCard`:
```tsx
<CalendarSlotCard 
  slot={slot} 
  studentName={...} 
  onClick={onSlotClick} 
  compact={...}
  selectionMode={selectionMode}
  isSelected={selectedIds?.has(slot.id)}
/>
```

---

## Krok 8: Powiadomienia przy rezerwacji z /book

**Problem:** Trigger `notify_on_slot_booking` działa na INSERT i UPDATE. Booking z `/book` robi UPDATE (z `available` na `booked`). Trigger sprawdza `TG_OP = 'UPDATE' AND NEW.status = 'booked' AND (OLD.status IS NULL OR OLD.status = 'available')` — to POWINNO wstawić notification.

Sprawdźmy czy RLS nie blokuje INSERT do calendar_notifications. Policy: "Anyone can insert notifications" z `WITH CHECK (true)` — ale to jest `RESTRICTIVE` (nie PERMISSIVE). W PostgreSQL RESTRICTIVE policy oznacza że MUSI spełnić warunek `true` — co zawsze jest true. ALE: trigger działa z SECURITY DEFINER? Nie — trigger jest zwykły, działa w kontekście użytkownika. Jeśli booking jest robiony przez ANONIMOWEGO użytkownika (bez JWT), to `auth.uid()` = NULL. RLS na calendar_slots pozwala anon na UPDATE? Nie — policy "Teachers can manage their own slots" wymaga `auth.uid() = teacher_id`. 

**AHA!** To jest problem. Anon user z `/book` nie ma `auth.uid()`. Ale `bookSlot` w `usePublicBooking` robi `.update().eq('id', slotId).eq('status', 'available')` — to wymaga UPDATE permission. RLS policy wymaga `auth.uid() = teacher_id`. Anon NIE jest teacher. 

**ALE:** Jest `useAnonymousAuth` — sprawdźmy... Użytkownik na `/book` nie jest zalogowany jako teacher, ale Supabase client ma anon key. RLS pozwala na SELECT dla available slotów ("Public can view available slots"), ale NIE na UPDATE.

**Prawdopodobnie booking DZIAŁA** bo jest inna policy lub Supabase ma domyślny anon access. Sprawdzę policies na calendar_slots... Są 3 policies, wszystkie RESTRICTIVE. Anon user spełnia "Public can view available slots" (SELECT) ale nie ma UPDATE policy dla anon. Więc `bookSlot` update powinien FAILOWAĆ.

**ALE** użytkownik mówi że booking działa ale powiadomienia nie pojawiają się. Może booking jest w kontekście `useAnonymousAuth` — sprawdzę. Hook `useAnonymousAuth` robi `signInAnonymously()` co daje anonimowy Supabase user z uid. Ale ten uid ≠ teacher_id, więc RLS "Teachers can manage" nie pasuje.

Hmm, ale jest policy "Students can view their booked slots" (SELECT) z `student_id IS NOT NULL`. A dla UPDATE nie ma policy studenta.

**Root cause:** Booking z `/book` prawdopodobnie nie aktualizuje slotu w bazie bo RLS blokuje UPDATE. Albo działa na poziomie service_role. Sprawdzę supabase client — `@/integrations/supabase/client` — to anon key client. Bez service_role.

**Fix:** Trzeba albo:
1. Dodać RLS policy na UPDATE dla publicznego bookingu
2. Albo przenieść booking do edge function (bezpieczniejsze)

**Lepsze rozwiązanie:** Dodać RLS policy:
```sql
CREATE POLICY "Public can book available slots" ON calendar_slots
FOR UPDATE USING (status = 'available' AND student_id IS NULL)
WITH CHECK (status = 'booked');
```
To pozwoli anon na zmianę statusu z `available` na `booked` ale TYLKO dla slotów bez studenta.

---

## Krok 9: Pending booking — żółty kolor na /book

**Problem:** Na `/book` sloty pending (status='booked' bez confirmed_at) NIE są widoczne bo `fetchSlots` filtruje `eq('status', 'available')`. Po zarezerwowaniu slot znika.

**Fix na /book:** Po udanej rezerwacji, jeśli booking_mode='requires_confirmation', pokazać info: "Your booking request was sent. Waiting for teacher confirmation."

Na liście slotów: sloty pending pokazywać jako żółte i zablokowane:
- W `usePublicBooking.fetchSlots`: pobierać też sloty `status = 'booked'` BEZ `confirmed_at`:
```sql
.or('status.eq.available,and(status.eq.booked,confirmed_at.is.null)')
```
- Na `/book` renderowaniu: sloty pending oznaczać żółto z tekstem "Awaiting confirmation" i `disabled`.

---

## Krok 10: Widok Schedule (harmonogram)

**Opis:** Nowy widok typu "Schedule" — pionowa lista zabookowanych lekcji, dzień po dniu. Jak Google Calendar Schedule view.

**Implementacja:**
1. Dodać nowy `ViewMode = 'day' | 'week' | 'month' | 'schedule'`
2. Nowy komponent `CalendarScheduleView.tsx`:
```tsx
// Grupuje sloty po dniu, filtruje tylko booked/completed, renderuje cards pod sobą
interface CalendarScheduleViewProps {
  slots: CalendarSlot[];
  studentMap: Record<string, string>;
  onSlotClick: (slot: CalendarSlot) => void;
}
```
Layout:
```
March 3, 2026 (Monday)
  ┌─────────────────────────┐
  │ 09:00–10:00  Jan Kowalski│
  └─────────────────────────┘
  ┌─────────────────────────┐
  │ 14:00–15:00  Anna Nowak  │
  └─────────────────────────┘

March 4, 2026 (Tuesday)
  ┌─────────────────────────┐
  │ 10:00–11:00  Piotr Zieliński│
  └─────────────────────────┘
```

3. W `CalendarToolbar`: dodać "Schedule" do ToggleGroup.
4. W `CalendarPage`: obsłużyć `viewMode === 'schedule'`.

---

## Krok 11: Student portal na /book — rebuild od zera

**Problem:** `StudentBookingsSection` jest brzydki i wolny — `supabase.functions.invoke` za każdym razem.

**Rebuild plan:**

1. **Nowy komponent `StudentPortal.tsx`** zamiast `StudentBookingsSection`:
   - Czysty, przyjazny UI z kartami lekcji
   - Email input + przycisk "Check my schedule"
   - Po weryfikacji: tabela/lista lekcji z datą, godziną, statusem
   - Przyciski Cancel / Reschedule z inline UI (nie modal w modalu)
   
2. **Cache email w localStorage** — po pierwszym wyszukaniu, zapamiętać email żeby nie wpisywać za każdym razem

3. **Szybsze ładowanie:** Zamiast edge function, użyć bezpośredniego query z RLS:
   - Dodać policy na SELECT: `student_notes LIKE '%email%'` — NIE, to niebezpieczne.
   - Lepiej: zostać przy edge function ale dodać cache i loading skeleton.

4. **UI:**
```
┌──────────────────────────────────────┐
│  📅 My Lessons                       │
│                                       │
│  Email: [john@example.com     ] [Go]  │
│                                       │
│  ┌─ Upcoming ────────────────────┐   │
│  │ Mon, Mar 3  09:00–10:00  ✅   │   │
│  │ [Cancel] [Reschedule]          │   │
│  │                                │   │
│  │ Wed, Mar 5  14:00–15:00  ⏳   │   │
│  │ Awaiting confirmation          │   │
│  └────────────────────────────────┘   │
│                                       │
│  ┌─ Past ─────────────────────────┐  │
│  │ Mon, Feb 24  09:00–10:00  ✓   │   │
│  └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

5. **Reschedule inline:** Zamiast osobnego modalu, rozwijana sekcja z dostępnymi slotami + przycisk Confirm.

---

## Krok 12: Powiadomienia email

Istniejąca edge function `send-calendar-notification-email` jest wywoływana w `usePublicBooking.bookSlot`. Potrzeba:
1. Sprawdzić czy RESEND_API_KEY jest skonfigurowany
2. Dodać typy: `booking_confirmation`, `booking_pending`, `new_booking_teacher`, `cancellation_student`, `cancellation_teacher`
3. Upewnić się że teacher dostaje email przy nowej rezerwacji

---

## KOLEJNOŚĆ IMPLEMENTACJI

| Krok | Co | Pliki |
|---|---|---|
| 1 | Grid lines — odwrócić logikę full/half hour | CalendarWeekView.tsx, CalendarDayView.tsx |
| 2 | Notes → AutoResizeTextarea rows=1 | UnifiedSlotModal.tsx, SlotDetailModal.tsx |
| 2A | Recurring From = clicked date | UnifiedSlotModal.tsx |
| 2B | Worksheet link na Single (Available + Lesson) | UnifiedSlotModal.tsx |
| 2C | Student Combobox fix + dodać na SlotDetailModal | UnifiedSlotModal.tsx, SlotDetailModal.tsx |
| 2D | Conflicts na modalu, nie toast | UnifiedSlotModal.tsx |
| 3 | Worksheet link — nie tracić studenta | CalendarPage.tsx |
| 4 | Cancel Lesson — potwierdzenie + zachowanie + info | SlotDetailModal.tsx |
| 5 | Conflicts — ukryć "will be replaced" | UnifiedSlotModal.tsx |
| 7 | Multi-select — wizualne zaznaczenie | CalendarSlotCard.tsx, CalendarWeekView.tsx, CalendarDayView.tsx |
| 8 | RLS policy UPDATE dla bookingu + powiadomienia | migration SQL |
| 9 | Pending na /book — żółty + info | usePublicBooking.tsx, PublicBookingPage.tsx |
| 10 | Schedule view | CalendarScheduleView.tsx (NOWY), CalendarToolbar.tsx, CalendarPage.tsx, useCalendarSlots.tsx |
| 11 | Student portal rebuild | StudentPortal.tsx (NOWY), PublicBookingPage.tsx |
| 12 | Sprawdzić email notifications | send-calendar-notification-email |

---

## NOWE PLIKI

1. `src/components/calendar/CalendarScheduleView.tsx` — widok harmonogram
2. `src/components/calendar/StudentPortal.tsx` — nowy portal ucznia na /book

## MODYFIKOWANE PLIKI

1. `src/components/calendar/CalendarWeekView.tsx` — grid lines fix
2. `src/components/calendar/CalendarDayView.tsx` — grid lines fix  
3. `src/components/calendar/UnifiedSlotModal.tsx` — Notes, recurFrom, worksheet link, combobox, conflicts
4. `src/components/calendar/SlotDetailModal.tsx` — Notes, combobox, cancel lesson, delete slot rename, cancelled info
5. `src/components/calendar/CalendarSlotCard.tsx` — selection mode visual
6. `src/components/calendar/CalendarToolbar.tsx` — Schedule toggle
7. `src/pages/CalendarPage.tsx` — worksheet link fix, schedule view
8. `src/pages/PublicBookingPage.tsx` — pending slots, student portal
9. `src/hooks/usePublicBooking.tsx` — fetch pending slots
10. `src/hooks/useCalendarSlots.tsx` — ViewMode + 'schedule'
11. Migration SQL — RLS policy for public booking UPDATE

