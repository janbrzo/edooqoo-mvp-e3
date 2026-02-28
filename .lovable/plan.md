# Plan: Naprawy kalendarza — FAZA 1 kontynuacja

## ANALIZA PROBLEMOW Z BAZY DANYCH

Sprawdzilem dane i znalazlem **krytyczne overbookingi** w bazie:

- `2026-03-02 09:00–10:00` — DWA sloty booked (studenci `8144a198` i `6397b351`) — to sa dwa oddzielne rekordy na ta sama godzine
- `2026-03-02 11:00–12:00` — slot booked + slot available nakladajace sie
- `2026-03-02 14:00–15:00` — DWA sloty booked
- `2026-03-03 10:00–11:00` — booked + available nakladajace sie
- `2026-03-03 12:30–13:30` — available + booked nakladajace sie
- `2026-03-03 16:00–17:00` — booked + available nakladajace sie

**Przyczyna glowna:** `createSlotsBatch` (linia 156 useCalendarSlots) NIE sprawdza konfliktow — komentarz mowi "caller handles conflicts" ale nie wszyscy callers to robia. `generateSlotsForRule` w useCalendarRecurrence sprawdza tylko duplikaty z ta sama `recurrence_rule_id` (linia 142-151), wiec NIE wykrywa konfliktow z innymi slotami. Publiczny booking w `usePublicBooking.bookSlot` sprawdza `.eq('status', 'available')` ale nie blokuje jesli slot zostal juz zarezerwowany przez innego studenta w tym samym momencie (race condition).

---

## KOLEJNOSC IMPLEMENTACJI (13 krokow)

### Krok 1: Grid lines — ponowna poprawka

**Problem:** Uzytkownik twierdzi ze linie pol-godzinne sa nadal mocniejsze. Analizujac kod: grid area ma `border-border/60` (full) vs `border-border/10` (half) — wyglada poprawnie. ALE gutter (lewa kolumna z godzinami) ma `border-border/30` dla full hours i `border-border/10` dla half — to jest zbyt slabe. Gutter powinien byc spojny z gridem.

**Pliki:** `CalendarWeekView.tsx` linia 84, `CalendarDayView.tsx` linia 70

**Fix:** W gutter zamienic `border-border/30` na `border-border/60` zeby bylo spojne z gridem. Dodatkowo w gridzie podniesc kontrast: full hour `border-border/80`, half hour `border-border/15`.

---

### Krok 2: Modal — przezroczyste tlo + mozliwosc przesuwania

**Problem:** DialogOverlay (z shadcn Dialog) uzywa `bg-black/80` co robi ciemne rozmazane tlo.

**Fix w `UnifiedSlotModal.tsx`:**

1. Dodac `className` do DialogContent wylaczajacy overlay blur: uzyc custom Dialog bez overlay lub z `bg-black/20` (przezroczyste).
2. **Przesuwanie modalu:** Dodac stan `dragPosition: {x, y}`, `onMouseDown` na header modalu zeby robic drag. Uzyc CSS `position: fixed; top: Y; left: X; transform: none;` na DialogContent zamiast default centered.

Konkretnie: zmienic DialogOverlay na `className="bg-black/20 backdrop-blur-none"` w Dialog. Dodac drag handle na DialogHeader:

```typescript
const [pos, setPos] = useState<{x:number,y:number}|null>(null);
const dragRef = useRef<{startX:number,startY:number,posX:number,posY:number}|null>(null);

const onMouseDown = (e) => {
  dragRef.current = { startX: e.clientX, startY: e.clientY, posX: pos?.x||0, posY: pos?.y||0 };
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};
```

DialogContent style: `style={pos ? { position:'fixed', left:`50%`, top:`50%`, transform:`translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) `} : undefined}`

**To samo w SlotDetailModal** (tez ma byc przezroczyste + przesuwane).

Aby nie modyfikowac globalnego Dialog z shadcn/ui, zrobimy to przez nadpisanie klas w konkretnych komponentach. Sposob:

- W `src/components/ui/dialog.tsx` — DialogOverlay ma juz klase `bg-black/80`. Nie zmieniamy tego globalnie.
- W UnifiedSlotModal i SlotDetailModal: uzyc `<Dialog>` z `modal={false}` co wylacza overlay, a nastepnie manualnie dodac wlasny overlay z `bg-black/20`. Albo prostszy sposob: uzyc Radix `Dialog` bezposrednio z customowym overlay.

**Najlepsza opcja:** Dodac nowy wariant do naszego Dialog w ui/dialog.tsx — `DialogOverlay` z opcjonalnym `variant="transparent"`. Ale to zmieni globalny komponent. Lepiej: w UnifiedSlotModal i SlotDetailModal przekazac `overlayClassName` do DialogContent ktore nadpiszemy.

**Najprostsze rozwiazanie:** Dodac do DialogContent `className` ktory nadpisuje overlay: nie mozemy bezposrednio, ale mozemy uzyc portalu. Najlepiej — stworzyc `DraggableDialog.tsx` wrapper:

```typescript
// src/components/ui/draggable-dialog.tsx
export function DraggableDialog({ children, open, onOpenChange }) {
  // Renders Dialog with transparent overlay + draggable content
}
```

---

### Krok 3: UnifiedSlotModal — poprawki A-F

**3A. Info o ilosci tworzonych lekcji dla Recurring:**
Dodac `useMemo` ktory liczy ile lekcji bedzie utworzonych w recurring mode. Pod sekcja recurring, analogicznie jak w batch, dodac:

```
This will create X lessons (every [Days] from [From] to [To])
```

Obliczenie: iteruj po dniach od `dateFrom` do `dateTo/recurUntilDate`, policz ile razy wybrany dzien tygodnia wystepuje.

**3B. Usunac pole Title (optional):**
W UnifiedSlotModal linie 551-556 — usunac pole Title. Zostaje tylko Notes. Dla lesson trybu `title` bedzie auto-generowany z nazwy studenta (`${student.name} — English lesson`). Dla available — title bedzie null.

Ale uwaga: w SlotDetailModal (edycja) title tez jest. Tam też usunąć pole Title.

**3C. Recurring Lesson — data koncowa inclusive + multi-day + From/To:**

C.1: `generateSlotsForRule` linia 117: `slotDate > new Date(rule.effective_until)` — zmiana na `>=` nie wystarczy bo `new Date('2026-03-16')` tworzy date o polnocy UTC, a `slotDate` tez. Problem: `>` nie wlacza dnia koncowego. Fix: zmiana `>` na `> endOfDay(new Date(rule.effective_until))` lub porownanie stringow: `format(slotDate, 'yyyy-MM-dd') > rule.effective_until`.

Lepszy fix: `if (rule.effective_until && format(slotDate, 'yyyy-MM-dd') > rule.effective_until) continue;`

C.1 drugi problem — "zrobilem od 2-24.03 w poniedzialki a utworzylo sie tylko 2 i 9.03": Bug w `generateSlotsForRule` — petla `for (let w = 0; w < weeksAhead; w++)` iteruje `weeksAhead` razy OD `startDate`. Jesli `startDate = today (28.02)` i `weeksAhead = 4`, to sprawdza: tydzien 0 (28.02), tydzien 1 (07.03), tydzien 2 (14.03), tydzien 3 (21.03). Poniedzialki: 02.03 (diff=2), 09.03 (diff=2), 16.03 (diff=2), 23.03 (diff=2). ALE `weeksAhead` jest ustawiane na `auto_generate_weeks_ahead` z CreateRecurrenceInput, a w `handleSubmit` linia 303: `auto_generate_weeks_ahead: recurEndMode === 'weeks' ? Number(recurWeeks) : 52`. Jesli `recurEndMode === 'date'` to daje `52`. Ale data effective_until = '2026-03-24'. Wiec powinno generowac 52 tygodni i filtrowac po `effective_until`. Problem moze byc w `auto_generate_weeks_ahead: 52` w bazie vs `recurEndMode`. Sprawdzmy: jesli user wybral "Until date" to `auto_generate_weeks_ahead = 52`. 52 tygodni od today = rok. Wiec petla powinna generowac daty 02.03, 09.03, 16.03, 23.03 i dalej, ale filtr `effective_until = '2026-03-24'` odetnie >=24.03. Wiec 02, 09, 16, 23.03 powinny przejsc. Ale user mowi ze tylko 02 i 09.

**Root cause znaleziony:** Linia 107-113 w generateSlotsForRule:

```
for (let w = 0; w < weeksAhead; w++) {
  const weekDate = addWeeks(startDate, w);
  const currentJsDay = getDay(weekDate);
  let diff = targetJsDay - currentJsDay;
  if (diff < 0) diff += 7;
  const slotDate = addDays(weekDate, diff);
```

Jesli `startDate = 2026-02-28` (piatek, jsDay=5) i target = poniedzialek (jsDay=1):

- w=0: weekDate=28.02, diff=1-5=-4+7=3, slotDate=03.03 ✓
- w=1: weekDate=07.03, diff=1-6=-5+7=2... wait, `getDay(07.03)` — 07.03.2026 jest sobota? Nie, 07.03 to sobota. Wait: `addWeeks(2026-02-28, 1)` = 2026-03-07 (sobota). diff=1-6=-5+7=2, slotDate=09.03 (poniedzialek) ✓
- w=2: weekDate=14.03 (sobota), diff=1-6=-5+7=2, slotDate=16.03 ✓
- w=3: weekDate=21.03 (sobota), diff=1-6=-5+7=2, slotDate=23.03 ✓

Wiec algorytm POWINIEN generowac 4 daty. Problem musi byc w filtrze effective_until: linia 117:

```
if (rule.effective_until && slotDate > new Date(rule.effective_until)) continue;
```

`new Date('2026-03-24')` = 24.03 00:00:00 UTC. `slotDate` dla 16.03 = addDays(addWeeks(Date(28.02), 2), 2). To zalezy od timezone. Jesli local tz jest +1, to `new Date('2026-03-24')` = 23.03 23:00:00 local, a `slotDate` 16.03 moze byc w local time. Mozliwe ze timezone powoduje off-by-one.

Ale user mowi ze 16 i 23 NIE zostaly utworzone. Wiec albo `weeksAhead` jest za maly (nie 52 a np 4), albo `effective_until` porownanie jest bledne.

Najprawdopodobniejsza przyczyna: user nie wybral "Until date" tylko domyslne "For X weeks" = 4 tygodnie. ALE nawet jesli 4 tygodnie, powinno byc 4 daty. Chyba ze `effective_from` = today i `startDate = today (28.02)`, a `today` jest piątkiem, wiec tydzien 0 = 28.02-03.03 (pon 03.03)... hmm to juz sie nie zgadza bo user mowi ze 02.03 sie utworzylo a nie 03.03. 02.03 to niedziela! Nie poniedzialek. 

Chwila — 02.03.2026: sprawdzam... 2026-03-02 to PONIEDZIALEK. OK wiec:

- startDate = 2026-02-28 (sobota)
- w=0: weekDate=28.02 (sobota), diff=1-6=-5+7=2, slotDate=02.03 ✓
- w=1: weekDate=07.03 (sobota), diff=2, slotDate=09.03 ✓  
- w=2: weekDate=14.03, slotDate=16.03 ✓
- w=3: weekDate=21.03, slotDate=23.03 ✓

Ale user mowi tylko 2 i 9 sie utworzyly. Mozliwe ze `auto_generate_weeks_ahead` w bazie to nie 52 a 4, ale linia 116: `if (slotDate < effectiveFrom) continue;` — effectiveFrom moze byc ustawione na biezaca date. I linia 119: `if (slotDate < today) continue;` — to nie powinno filtrowac przyszlych dat.

Hmm, moge tez sprawdzic: duplicate check w liniach 141-154. Sprawdza istniejace sloty z ta sama `recurrence_rule_id`. ALE jesli na te daty juz istnieja sloty z INNEGO recurrence_rule_id (bo user wczesniej tworzyl inne), to nie odfiltrowuje. Ale to nie powinno blokowac — `existingSet` zawiera tylko sloty z tym samym rule_id.

Moze problem jest w innym miejscu... Prawdopodobne: petla generuje 4 sloty, ale INSERT dwoch ostatnich failuje silently (linia 161: `if (error) console.error(...)` — nie rzuca bledu). Moze constraint w bazie? Ale nie ma unique constraint na (slot_date, start_time, teacher_id).

Zmienic podejscie: zamiast petli opartej na `weeksAhead`, iterowac dzien po dniu od `effective_from` do `effective_until` i sprawdzac dzien tygodnia. To prostsza i pewniejsza logika.

C.2: Zmienic Recurring Lesson UI:

- Zamiast `Day of Week` (single select), uzyc checkboxow jak w Batch (7 checkboxow Mon-Sun)
- Zamiast `Repeat until: weeks/date`, uzyc `From/To` date inputs (jak Batch)
- Domyslnie: From = puste (uzytkownik musi swiadomie wybrac), To = puste

To wymaga zmian w:

- State: zamiast `recurDayOfWeek: string` → `recurDays: boolean[]` (7 elementow, jak selectedDays)
- State: zamiast `recurEndMode/recurWeeks/recurUntilDate` → `recurFrom: string` (pusty!) i `recurTo: string` (pusty!)
- `handleSubmit`: zamiast jednego `onCreateRecurring({day_of_week: ...})`, generowac sloty recznie (jak batch) i uzyc `onCreateBatch`. Recurrence rule nadal tworzyc dla kazdego wybranego dnia osobno (lub zmienic architekture na multi-day recurrence — ale to wymaga zmian w bazie).

**Lepsze podejscie:** Zamiast tworzyc recurrence_rule (ktora ma single day_of_week), generowac sloty bezposrednio przez `onCreateBatch`. Recurrence rule tworzyc opcjonalnie tylko jesli uzytkownik chce auto-generowanie w przyszlosci.

**Najlepsze podejscie:** Recurring Lesson generuje batch slotow jak Batch Available, ale z student_id. Logika:

```
for each day from recurFrom to recurTo:
  if day_of_week is in recurDays[]:
    add slot with student_id, status='booked'
```

Uzyc `onCreateBatch` z tymi slotami. NIE uzywac `onCreateRecurring` (ktora tworzy recurrence_rule).

ALE: recurrence_rule jest potrzebna do "Edit Entire Series". Wiec tworzyc rule nadal, ale generowac sloty recznie w modalu (nie w useCalendarRecurrence). Albo: tworzyc rule per dzien tygodnia (jesli user wybral Mon+Wed, tworzyc 2 rules).

**Decyzja:** Dla uproszczenia — recurring lesson z wieloma dniami tworzy osobna rule per dzien. Generowanie slotow przerobic na iteracje dzien-po-dniu (nie tydzien-po-tygodniu).

**3D. Linkowanie Worksheet na modalu tworzenia:**
Obecnie info "You can link after creating". Mozna zrobic linkowanie od razu: dodac `worksheetId` state do modalu, przycisk "Link Worksheet" ktory otwiera `LinkWorksheetModal` inline (ale mamy problem ze modal w modalu). Alternatywa: dropdown z lista worksheetow studenta bezposrednio w formularzu.

**Fix:** Dodac `Select` z worksheetami studenta (fetchowac z bazy po wybraniu studenta). Props: `worksheetId`, `setWorksheetId`. Query: `worksheets WHERE teacher_id AND student_id AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20`.

**3E. Student dropdown — wyszukiwanie:**
Zamiast `<Select>` z shadcn uzyc `<Command>` (cmdk) — combo box z search. Juz mamy cmdk zainstalowane. Uzyc `<Popover>` + `<Command>` pattern (jak w shadcn "Combobox" przykładzie).

**3F. Co jeszcze jak Google Calendar:**

- Kolor slotu per student (opcjonalnie) -to nie
- Location field - to dodaj 
- Notification reminder checkbox  -to później

---

### Krok 4: Worksheet link — Open in new tab

**Plik:** `SlotDetailModal.tsx` linia 282

Zmiana: `onClick={() => navigate(`/worksheet/${slot.worksheet_id}`)}` → `onClick={() => window.open(`/worksheet/${slot.worksheet_id}`, '_blank')}`.

---

### Krok 5: LinkWorksheetModal — poprawki

**5A. Przycisk wstecz do SlotDetailModal:**
Problem: zamykajac LinkWorksheetModal nie wraca do SlotDetailModal. To dlatego ze w CalendarPage linia 70-73: `handleLinkWorksheet` ustawia `setSelectedSlot(null)` ZANIM otwiera LinkWorksheetModal. Po zamknieciu LinkWorksheet nie ma slotu do wyswietlenia.

Fix: NIE zamykac SlotDetailModal przy otwieraniu LinkWorksheet. Zamiast tego: dodac `linkWorksheetSlot` jako osobny stan BEZ zamykania selectedSlot. W LinkWorksheetModal dodac przycisk "← Back" ktory zamyka LinkWorksheet (selectedSlot pozostaje otwarty).

Zmiana w CalendarPage:

```typescript
const handleLinkWorksheet = (slot: CalendarSlot) => {
  // NIE robimy setSelectedSlot(null)
  setLinkWorksheetSlot(slot);
};
```

I w renderowaniu: SlotDetailModal zamykamy visually gdy linkWorksheetSlot jest ustawiony (ale NIE nullujemy selectedSlot). Po zamknieciu LinkWorksheet — SlotDetailModal wraca.

Albo prostszef: renderowac oba modale jednoczesnie. LinkWorksheet na z-index wyzszym. Po zamknieciu LinkWorksheet — SlotDetail nadal jest widoczny.

**5B. Nazwy worksheet — data zawsze widoczna:**
W LinkWorksheetModal linia 88-91: zmiana layoutu z inline na dwie linie:

```
<div className="flex flex-col min-w-0">
  <span className="font-medium truncate text-sm">{ws.title || 'Untitled'}</span>
  <span className="text-xs text-muted-foreground">{format(...)}</span>
</div>
```

**5C. LinkWorksheet — filtr po studentId z SlotDetailModal:**
Problem: w CalendarPage linia 163-171, `linkWorksheetSlot.student_id` jest przekazywany do LinkWorksheetModal. ALE jesli uzytkownik WLASNIE przypisal studenta w SlotDetailModal (zmienil `editStudentId` ale jeszcze nie zapisal), to `linkWorksheetSlot.student_id` jest stary (null).

Fix: Przekazac `editStudentId` (z SlotDetailModal state) zamiast `slot.student_id`. To wymaga:

1. SlotDetailModal: onLinkWorksheet przekazuje aktualny editStudentId:
  `onLinkWorksheet?.(slot, editStudentId !== 'none' ? editStudentId : null)`
2. CalendarPage: handleLinkWorksheet przyjmuje studentId:
  `const handleLinkWorksheet = (slot, studentId) => { setLinkWorksheetSlot({...slot, student_id: studentId}); }`

---

### Krok 6: Overbooking — KRYTYCZNA NAPRAWA

**6.1 + 6.2 + 6.3 + 6.4: Kompletna ochrona przed overbookingiem**

**A. Server-side (SQL trigger) — ostatnia linia obrony:**
Utworzyc trigger `before_insert_calendar_slot` ktory sprawdza:

```sql
CREATE OR REPLACE FUNCTION check_slot_overlap()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM calendar_slots
    WHERE teacher_id = NEW.teacher_id
    AND slot_date = NEW.slot_date
    AND status NOT IN ('cancelled')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND start_time < NEW.end_time
    AND end_time > NEW.start_time
    AND student_id IS NOT NULL
    AND NEW.student_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Overbooking: lesson already exists at this time';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

To blokuje wstawienie dwoch lekcji (z student_id) nakladajacych sie. NIE blokuje available+lesson ani available+available.

**B. Client-side — useCalendarSlots.createSlot (juz ma, ale partial overlap):**
Linia 111-118: `lt('start_time', input.end_time).gt('end_time', input.start_time)` — to uzywa Supabase filters na time columns. Problem: czas w bazie to `time without time zone` np `"09:00:00"`, a input to `"09:00"`. Supabase comparison dziala na stringach, wiec `"09:00" < "09:00:00"` = true (bo porownanie stringowe). To moze dawac false positives.

Fix: Normalizowac czasy do `HH:MM:SS` w query: `input.end_time + ':00'` i `input.start_time + ':00'`.

**C. createSlotsBatch — DODAC conflict check:**
Przed insertem sprawdzic KAZDY slot w batch:

```typescript
for (const input of inputs) {
  const { data: existing } = await supabase
    .from('calendar_slots')
    .select('id, student_id')
    .eq('teacher_id', teacherId)
    .eq('slot_date', input.slot_date)
    .neq('status', 'cancelled')
    .lt('start_time', input.end_time + ':00')
    .gt('end_time', input.start_time + ':00');
  
  if (existing?.some(e => e.student_id && input.student_id)) {
    // Lesson na lesson — BLOCK
    toast({ title: 'Overbooking blocked', ... });
    return null;
  }
  // Lesson na available — auto-delete available
  for (const e of (existing || []).filter(e => !e.student_id)) {
    await supabase.from('calendar_slots').delete().eq('id', e.id);
  }
}
```

**D. generateSlotsForRule — DODAC conflict check:**
W useCalendarRecurrence.generateSlotsForRule, przed insertem sprawdzic kazdego slota:

```typescript
// Per slot: check if lesson exists at that time
const { data: conflicts } = await supabase
  .from('calendar_slots')
  .select('id, student_id')
  .eq('teacher_id', teacherId)
  .eq('slot_date', slotDateStr)
  .neq('status', 'cancelled')
  .lt('start_time', rule.end_time)
  .gt('end_time', rule.start_time);

// Skip if lesson conflict
if (conflicts?.some(c => c.student_id && rule.student_id)) continue;
// Auto-replace available slots
for (const c of (conflicts || []).filter(c => !c.student_id)) {
  if (rule.student_id) {
    await supabase.from('calendar_slots').delete().eq('id', c.id);
  }
}
```

**E. bookSlot w usePublicBooking — race condition protection:**
Dodac optimistic lock: po `update().eq('status', 'available')` sprawdzic `count`. Jesli 0 — slot juz zarezerwowany.

**F. UI — wyswietlanie overbookow side-by-side:**
W CalendarDayView i CalendarWeekView: przy renderowaniu slotow per dzien, wykryc overlapping sloty i podzielic je na kolumny:

```typescript
// Detect overlaps
const processed = detectOverlaps(daySlots);
// Each slot gets: columnIndex (0 or 1) and columnCount (1 or 2)

// Render: width = 100% / columnCount, left = columnIndex * (100% / columnCount)
```

Sloty z overbookingiem: dodac czerwona ramke `border-red-500 border-2` i label "⚠️ Overbooking".

**6.5. Reset conflicts on field change:**
Juz zaimplementowane w useEffect linia 131-136, ale brakuje `recurDays` i `recurFrom/recurTo` w dependencies. Dodac.

---

### Krok 7: Multi-select i zbiorowe usuwanie pustych slotow

**UI:** Na CalendarDayView i CalendarWeekView:

1. Dodac przycisk "Select" na toolbarze (lub toggle mode).
2. W select mode: klikniecie slotu (tylko available, bez studenta) toggleuje zaznaczenie (checkbox/overlay z ✓).
3. Na dole ekranu pojawia sie floating bar: "X slots selected — [Delete All] [Cancel]".
4. Klikniecie "Delete All" pokazuje potwierdzenie: "Delete X available slots?" → tak → batch delete.

**Implementacja:**

- State w CalendarPage: `selectionMode: boolean`, `selectedSlotIds: Set<string>`.
- Przekazac do view komponentow.
- Slot card w select mode: dodatkowy checkbox overlay, klikniecie = toggle selection (bez otwierania SlotDetailModal).
- Floating bar: sticky na dole z przyciskami.
- Batch delete: `Promise.all(ids.map(id => deleteSlot(id)))` lub lepiej batch DELETE w Supabase.

**Nowa funkcja w useCalendarSlots:**

```typescript
const deleteSlotsBatch = useCallback(async (slotIds: string[]) => {
  const { error } = await supabase
    .from('calendar_slots')
    .delete()
    .in('id', slotIds);
  if (error) throw error;
  await fetchSlots();
  toast({ title: `${slotIds.length} slots deleted` });
}, [fetchSlots, toast]);
```

---

### Krok 8: Powiadomienia przy rezerwacji z /book

**Problem:** Trigger `trg_notify_on_slot_booking` w bazie wstawia powiadomienie, ale `slot_id` jest null w niektorych. Sprawdzmy trigger.

Trigger sprawdza `NEW.status = 'booked' AND (OLD.status IS NULL OR OLD.status = 'available')`. To powinno dzialac. ALE — RLS policy na calendar_notifications: "Anyone can insert notifications" = `WITH CHECK (true)`. OK to jest permissive. Problem moze byc w tym ze trigger nie ma dostep do nazwy studenta.

Sprawdzam powiadomienie: `slot_id: nil` w jednym z nich. Trigger powinien ustawiac `slot_id = NEW.id`. Jesli nie — bug w trigger.

**Fix:** Sprawdzic i naprawic trigger SQL. Upewnic sie ze `slot_id = NEW.id` i `student_name` jest poprawnie pobierane (moze z `student_notes` lub z tabeli students).

**Dodatkowe powiadomienia email:**
Dodac edge function `send-calendar-notification` wywolywaną przez trigger (database webhook) lub z kodu po bookingu. Wysyla email do nauczyciela z informacja o nowej rezerwacji. Uzyc istniejacego wzorca z `send-homework-email`.

---

### Krok 9: Pending status — zolty kolor na /calendar i /book

**Na /calendar:** Juz zaimplementowane w CalendarSlotCard — `isPending` daje amber style.

**Na /book:** Sloty pending NIE powinny byc widoczne jako "available". W usePublicBooking.fetchSlots linia 54: filtruje `eq('status', 'available')` — wiec pending (status=booked) nie sa pokazywane. OK.

ALE: jesli booking_mode = 'requires_confirmation', slot zmienia status na 'booked' ale bez `confirmed_at`. Na /book ten slot znika (bo status != available). Student ktory zabrokowal powinien widziec komunikat "Waiting for teacher confirmation".

**Fix na /book:**
Po udanej rezerwacji, zamiast po prostu znikac slota, pokazac komunikat: "Your booking request has been sent. The teacher will confirm your booking soon." Jesli auto_confirm: "Your lesson is confirmed!"

**Fix na /calendar nauczyciela:**
Slot pending (amber) jest juz klikalny. W SlotDetailModal juz jest przycisk "Confirm" (linia 312). I "Cancel Lesson" (linia 327). Dziala OK.

**Dodac przycisk "Reject"** w SlotDetailModal dla pending slotow — zmienia status z powrotem na 'available', nulluje student_id.

---

### Krok 10: Calendar Settings — uzupelnienie

Obecne sekcje: General, Booking Rules, Public Calendar, Payment, Notifications.

Brakujace opcje:

1. **Working hours display** — start_hour / end_hour widoczne na siatce kalendarza (zamiast hardcoded 7-22). Dodac do tabeli `calendar_settings`: `display_start_hour integer DEFAULT 7`, `display_end_hour integer DEFAULT 22`.
2. **Auto-reschedule approval** — dla punktu 14 (student proponuje zmiane godziny): `allow_student_reschedule boolean DEFAULT false`.
3. **Buffer time between lessons** — `buffer_minutes integer DEFAULT 0` — nie implementujemy teraz, ale dodajemy pole do ustawien.

**Migracja SQL:** Dodac kolumny do `calendar_settings`:

```sql
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS display_start_hour integer NOT NULL DEFAULT 7;
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS display_end_hour integer NOT NULL DEFAULT 22;
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS allow_student_reschedule boolean NOT NULL DEFAULT false;
ALTER TABLE calendar_settings ADD COLUMN IF NOT EXISTS buffer_minutes integer NOT NULL DEFAULT 0;
```

**UI w CalendarSettingsPage:** Dodac pola do sekcji General.

---

### Krok 11: Email ucznia — uzyc imienia z bazy nauczyciela

**Plik:** `usePublicBooking.tsx` linia 76-83

Obecna logika: `const { data: existingStudents } = await supabase.from('students').select('id').eq('teacher_id', settings.teacher_id).eq('student_email', studentEmail).maybeSingle();`

Zmiana: rowniez pobrac `name` z tabeli students. Jesli znaleziono — uzyc `existingStudents.name` zamiast `studentName` podanego przez studenta w `student_notes`.

```typescript
const { data: existingStudent } = await supabase
  .from('students')
  .select('id, name')
  .eq('teacher_id', settings.teacher_id)
  .eq('student_email', studentEmail)
  .maybeSingle();

const studentId = existingStudent?.id || null;
const resolvedName = existingStudent?.name || studentName;
// Use resolvedName in student_notes
```

---

### Krok 12: Nowy uczen — dodatkowe powiadomienie

W `usePublicBooking.bookSlot`: jesli `existingStudent === null` (nowy email), dodac powiadomienie:

```typescript
if (!existingStudent) {
  await supabase.from('calendar_notifications').insert({
    teacher_id: settings.teacher_id,
    notification_type: 'new_student',
    message: `New student signed up: ${studentName} (${studentEmail})`,
    student_name: studentName,
    slot_id: slotId,
  });
}
```

---

### Krok 13: Filtr studenta na /calendar

**UI:** W CalendarToolbar dodac `Select` z lista studentow + opcja "All students". Przekazac `selectedStudentFilter` do view komponentow.

**Logika:** W CalendarPage: `const filteredSlots = useMemo(() => selectedStudentFilter ? slots.filter(s => s.student_id === selectedStudentFilter) : slots, [slots, selectedStudentFilter]);`

Przekazac `filteredSlots` zamiast `slots` do widokow.

**Nowe props CalendarToolbar:** `students: Student[]`, `selectedStudent: string | null`, `onStudentFilterChange: (id: string | null) => void`.

---

### Krok 14: Student portal na /book — sprawdzenie kalendarza + zmiana terminu

**Nowa sekcja na PublicBookingPage:** Pod naglowkiem "Already have a booking?" z:

1. Input email
2. Przycisk "Check my bookings"
3. Po weryfikacji: lista zarezerwowanych lekcji studenta z przyciskami:
  - "Cancel" (jesli min_cancellation_hours pozwala)
  - "Request reschedule" → lista dostepnych slotow do wyboru → jesli `allow_student_reschedule` = true → automatyczne przesuniecie; jesli false → request wysylany do nauczyciela jako powiadomienie

**Implementacja:**
Nowy komponent `StudentBookingsSection.tsx` renderowany na dole PublicBookingPage.

Query: `calendar_slots WHERE student_notes LIKE '%studentEmail%' AND status IN ('booked','completed') ORDER BY slot_date`.

ALE: RLS policy na calendar_slots: "Students can view their booked slots" = `student_id IS NOT NULL`. To nie filtruje po email — kazdy zalogowany user moze widziec sloty z student_id. Problem: studenci na /book NIE SA zalogowani (anonimowi). Wiec musmy uzyc innego podejscia.

**Rozwiazanie:** Stworzyc edge function `get-student-bookings` ktora:

1. Przyjmuje `{ token, email }` (token publicznego kalendarza + email studenta)
2. Weryfikuje ze token jest prawidlowy
3. Zwraca sloty z `student_notes LIKE '%email%'` lub `student_id` matching student record
4. Nie wymaga autentykacji (publiczny endpoint)

---

### Krok 15-16: E2E test + readiness checklist — po implementacji

---

## POWIADOMIENIA EMAIL (Krok dodatkowy)

Potrzebne powiadomienia email:

1. **Nauczyciel:** nowa rezerwacja od studenta
2. **Nauczyciel:** anulowanie przez studenta
3. **Student:** potwierdzenie rezerwacji (auto lub reczne)
4. **Student:** odrzucenie rezerwacji
5. **Student:** reminder X godzin przed lekcja

**Implementacja:** Edge function `send-calendar-notification-email` + email templates w `_shared/email-templates/`:

- `booking-confirmation.tsx` — do studenta
- `booking-request.tsx` — do nauczyciela
- `lesson-reminder.tsx` — do studenta

Trigger: w `usePublicBooking.bookSlot` po udanym update — invoke edge function. Reminder: cron (juz mamy `send-homework-reminders` — podobny wzorzec).

---

## KOLEJNOSC IMPLEMENTACJI


| Krok | Co                                                                                                    | Pliki                                                                 |
| ---- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1    | Migracja SQL: trigger overbooking + kolumny settings                                                  | migration.sql                                                         |
| 2    | Grid lines — fix kontrastu gutter+grid                                                                | CalendarWeekView.tsx, CalendarDayView.tsx                             |
| 3    | Modal przezroczysty + draggable                                                                       | DraggableDialog.tsx (NOWY), UnifiedSlotModal.tsx, SlotDetailModal.tsx |
| 4    | UnifiedSlotModal: usunac Title, recurring info, multi-day recurring, worksheet link, combobox student | UnifiedSlotModal.tsx                                                  |
| 5    | generateSlotsForRule — fix date-inclusive + conflict check                                            | useCalendarRecurrence.tsx                                             |
| 6    | Overbooking protection — createSlotsBatch + side-by-side render                                       | useCalendarSlots.tsx, CalendarDayView.tsx, CalendarWeekView.tsx       |
| 7    | SlotDetailModal — worksheet new tab, reject button                                                    | SlotDetailModal.tsx                                                   |
| 8    | LinkWorksheetModal — back button, truncate names, studentId filter                                    | LinkWorksheetModal.tsx, CalendarPage.tsx                              |
| 9    | Multi-select + batch delete                                                                           | CalendarPage.tsx, views, useCalendarSlots.tsx                         |
| 10   | Notifications fix + new student notification                                                          | usePublicBooking.tsx, trigger SQL                                     |
| 11   | Email z bazy ucznia + Calendar Settings uzupelnienie                                                  | usePublicBooking.tsx, CalendarSettingsPage.tsx                        |
| 12   | Student filter na /calendar                                                                           | CalendarToolbar.tsx, CalendarPage.tsx                                 |
| 13   | Student portal na /book                                                                               | StudentBookingsSection.tsx (NOWY), edge function                      |
| 14   | Email notifications                                                                                   | send-calendar-notification-email (NOWY)                               |
| 15   | Dokumentacja                                                                                          | 4 pliki docs                                                          |
