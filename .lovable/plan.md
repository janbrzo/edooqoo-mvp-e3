# Plan: Konsolidacja modali kalendarza + naprawy

## ANALIZA PROBLEMOW

### Problem 1: Freeze strony po kliknieciu "Add"

**Przyczyna:** `usePublicBooking.tsx` linia 16 — `weekEnd` jest obliczany na nowo przy kazdym renderze (identyczny bug jak wczesniej naprawiony w `useCalendarSlots`). To powoduje nieskonczona petle `fetchSlots` (linia 67 ma `weekEnd` w dependencies). To samo dotyczy **mrugania slotow na stronie /book/** (problem 8).

Ale freeze na `/calendar` po kliknieciu "Add" to inny problem — `AddSlotModal` otwiera `Dialog` ktory moze kolidowac z innym otwartym dialogiem. Sprawdzam: w CalendarPage wszystkie modale moga sie otworzyc jednoczesnie. Freeze moze wynikac z renderowania listy studentow w Select wewnatrz modalu (jesli lista jest duza lub pusta z undefined).

**Prawdziwa przyczyna freeze:** Dialog renderuje sie, ale `students` moze byc pusta tablica co powoduje problem z `SelectContent` renderujacym puste children. Albo — bardziej prawdopodobne — freeze wynika z nieprawidlowego stanu `open` i `onOpenChange` — modal otwiera sie ale kalendarzu nadal probuje renderowac siatke z setkami elementow DOM.

Po analizie: Najprawdopodobniej freeze to efekt renderowania calej siatki godzinowej (30 rows × 7 columns × grid lines) + jednoczesne otwarcie modalu. Rozwiazanie: dodac `React.memo` na widoki + lazy rendering modali.

### Problem 2-5: Konsolidacja modali

Uzytkownik chce **JEDEN modal** zamiast 4 (AddSlot, AddRecurring, BatchAdd, QuickSetup). Ten modal musi:

- Miec zakladki: **Available Slot** / **Lesson**
- Pod Available Slot: **Single Slot** / **Batch Slots**
- Pod Lesson: **Single Lesson** / **Recurring Lesson**
- Byc otwierany we wszystkich scenariuszach (toolbar, klikniecie siatki, itp)

### Problem 6: SlotDetailModal — edycja + attach/detach studenta

- Trzeba dodac: edycja daty, czasu, tytulu
- Mozliwosc dodania/zmiany/usuniecia studenta
- "Cancel" button = zamkniecie modalu (nie anulowanie slotu)
- Rozny wyglad dla slotu z/bez studenta
- Edycja calej serii recurring

### Problem 7: Nadpisywanie slotow — logika konfliktow

3 scenariusze z roznymi zachowaniami

### Problem 8: Mruganie na /book/

Identyczny bug jak Problem 1 z infinite loop w `usePublicBooking.tsx`

---

## SZCZEGOLOWY PLAN IMPLEMENTACJI

### Krok 1: Fix `usePublicBooking.tsx` — infinite loop (Problem 1 & 8)

**Plik:** `src/hooks/usePublicBooking.tsx`

Linia 16: 

```typescript
// PRZED:
const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

// PO:
const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);
```

Dodac `useMemo` do importow.

---

### Krok 2: Usunac stare modale, stworzyc UnifiedSlotModal

**Pliki do USUNIECIA:**

- `src/components/calendar/AddSlotModal.tsx`
- `src/components/calendar/AddRecurringSlotModal.tsx`  
- `src/components/calendar/QuickWeekSetupModal.tsx`

**Plik `BatchAddSlotsModal.tsx**` — **zachowac** ale zrefaktorowac i wchłonąć do nowego modalu.

**NOWY plik:** `src/components/calendar/UnifiedSlotModal.tsx`

**Struktura UI modalu:**

```
┌─────────────────────────────────────────┐
│  Add Event                         [X]  │
├─────────────────────────────────────────┤
│  [Available Slot]  [Lesson]        ← Tabs │
├─────────────────────────────────────────┤
│  [Single Slot]  [Batch Slots]    ← Sub  │
│  ─ lub ─                                │
│  [Single Lesson]  [Recurring Lesson]    │
├─────────────────────────────────────────┤
│  << Pola formularza wg trybu >>         │
│                                         │
│  Preview: "This will create X slots"    │
├─────────────────────────────────────────┤
│               [Cancel]  [Create]        │
└─────────────────────────────────────────┘
```

**Tryby i ich pola:**

**A. Available Slot > Single Slot:**

- Date (date input)
- Start Time / End Time
- Lesson Duration (select: 30/45/60/90/120 → auto-oblicza End Time)
- Title (optional)
- Notes (optional)

**B. Available Slot > Batch Slots:**

- Days of the week (7 checkboxow — layout rozciagniety jak w QuickWeekSetup: `flex gap-3 flex-wrap`, pelne nazwy "Mon", "Tue" itd)
- Date range: From / To
- Lesson Duration (select)
- Working hours: Start / End (selecty jak w QuickSetup)
- Time slots list z +Add / -Remove (jak w obecnym BatchAdd) — **LUB** auto-generuj z working hours + duration (przelacznik: "Auto-fill from working hours" / "Custom time slots")
- Preview: "This will create X slots"

**C. Lesson > Single Lesson:**

- Student (wymagany — Select)
- Date
- Start Time / End Time
- Lesson Duration (select)
- Title (auto-fill: "{Student} — English lesson")
- Link Worksheet (opcjonalny — przycisk "Link Worksheet" → inline lista worksheetow lub LinkWorksheetModal)
- Notes (optional)

**D. Lesson > Recurring Lesson:**

- Student (wymagany — Select)
- Day of Week (select)
- Start Time / End Time
- Lesson Duration (select)
- Repeat until: "For X weeks" (select) / "Until date" (date input) — radio toggle
- Title (optional)
- Preview: "This will create X lessons"

**Props UnifiedSlotModal:**

```typescript
interface UnifiedSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSingle: (input: CreateSlotInput) => Promise<any>;
  onCreateBatch: (inputs: CreateSlotInput[]) => Promise<any>;
  onCreateRecurring: (input: CreateRecurrenceInput) => Promise<any>;
  students: Student[];
  defaultDuration: number;
  defaultDate?: Date;
  defaultStartTime?: string;
  currentDate: Date;
  existingSlots: CalendarSlot[]; // do conflict detection (Problem 7)
}
```

**Stan wewnetrzny:**

```typescript
const [slotType, setSlotType] = useState<'available' | 'lesson'>('available');
const [mode, setMode] = useState<'single' | 'batch'>('single'); // dla available
// lub
const [mode, setMode] = useState<'single' | 'recurring'>('single'); // dla lesson
```

Kiedy `slotType` zmienia sie, `mode` resetuje sie do 'single'.

---

### Krok 3: Refaktor CalendarPage — usunac stare modale

**Plik:** `src/pages/CalendarPage.tsx`

Zmiany:

1. Usunac importy: `AddSlotModal`, `AddRecurringSlotModal`, `QuickWeekSetupModal`, `BatchAddSlotsModal`
2. Dodac import: `UnifiedSlotModal`
3. Usunac stanu: `recurringModalOpen`, `batchModalOpen`, `quickSetupOpen`
4. Jeden modal state: `addModalOpen` (juz istnieje)
5. Zastapic 4 renderowania modali jednym `<UnifiedSlotModal>`
6. Przekazac `existingSlots={slots}` do modalu (do conflict detection)

**CalendarToolbar:** Uproscic — zamiast dropdown "Add" z 4 opcjami, jeden przycisk "Add" ktory otwiera UnifiedSlotModal. Usunac props: `onAddRecurring`, `onBatchAdd`, `onQuickSetup`.

**Nowy CalendarToolbar props:**

```typescript
interface CalendarToolbarProps {
  currentDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNavigate: (dir: 'prev' | 'next' | 'today') => void;
  onAddSlot: () => void;
  onSettings: () => void;
  onShare?: () => void;
}
```

Toolbar HTML: zamiast DropdownMenu z Plus, prosty Button "+" Add.

---

### Krok 4: Rozbudowa SlotDetailModal — edycja + student management

**Plik:** `src/components/calendar/SlotDetailModal.tsx`

**Nowy layout:**

Widok rozni sie w zaleznosci od tego czy slot ma studenta:

**A. Slot BEZ studenta (Available):**

```
┌─────────────────────────────────────────┐
│  Available Slot              [Badge]    │
├─────────────────────────────────────────┤
│  Date:    [editable date input]         │
│  Time:    [start] – [end]               │
│  Title:   [editable input]              │
│  Notes:   [editable textarea]           │
│  Worksheet: None [Link]                 │
│                                         │
│  ── Assign Student ──                   │
│  [Select student dropdown]  [Assign]    │
├─────────────────────────────────────────┤
│  [Close]  [Save Changes]  [Delete]      │
└─────────────────────────────────────────┘
```

**B. Slot Z studentem (Lesson):**

```
┌─────────────────────────────────────────┐
│  Lesson with {Student}       [Badge]    │
├─────────────────────────────────────────┤
│  Student: {Name}     [Change] [Remove]  │
│  Date:    [editable date input]         │
│  Time:    [start] – [end]               │
│  Title:   [editable input]              │
│  Notes:   [editable textarea]           │
│  Worksheet: {Title} [Open] [Change]     │
│                                         │
│  ── Status Actions ──                   │
│  [Confirm] [Complete] [No Show]         │
│  [Cancel Lesson]                        │
│                                         │
│  {Jesli recurring:}                     │
│  [Edit Entire Series]                   │
├─────────────────────────────────────────┤
│  [Close]  [Save Changes]  [Delete]      │
└─────────────────────────────────────────┘
```

**Kluczowe zmiany w kodzie:**

1. **Edycja wszystkich pol:** Dodac stan edycji:

```typescript
const [editDate, setEditDate] = useState(slot.slot_date);
const [editStartTime, setEditStartTime] = useState(slot.start_time.slice(0,5));
const [editEndTime, setEditEndTime] = useState(slot.end_time.slice(0,5));
const [editTitle, setEditTitle] = useState(slot.title || '');
const [editNotes, setEditNotes] = useState(slot.notes || '');
const [editStudentId, setEditStudentId] = useState(slot.student_id || 'none');
```

2. **Przycisk "Cancel"** = zamknij modal (`onOpenChange(false)`), NIE anuluj slot.
3. **Przycisk "Cancel Lesson"** = zmien status na cancelled (obecna logika).
4. **"Save Changes"** = bulk update: `onUpdate(slot.id, { slot_date, start_time, end_time, title, notes, student_id })`.
5. **"Remove Student"** = `setEditStudentId('none')` → po Save: `student_id: null, status: 'available'`.
6. **"Change Student"** = Select dropdown z lista studentow.
7. **"Edit Entire Series"** = jesli `slot.recurrence_rule_id`, pokaz opcje: "Update all future slots in this series" → query all slots with same `recurrence_rule_id` i `slot_date >= today` → batch update.

**Nowe props:**

```typescript
interface SlotDetailModalProps {
  // ...istniejace
  students: Student[]; // NOWE — do zmiany studenta
  onUpdateBatch?: (ruleId: string, updates: Partial<CalendarSlot>) => Promise<void>; // dla serii
}
```

---

### Krok 5: Logika konfliktow (Problem 7)

**Implementacja w UnifiedSlotModal** (przed submit):

```typescript
const checkConflicts = (newSlots: CreateSlotInput[]): ConflictResult => {
  const conflicts: ConflictInfo[] = [];
  
  for (const newSlot of newSlots) {
    const overlapping = existingSlots.filter(existing => 
      existing.slot_date === newSlot.slot_date &&
      existing.status !== 'cancelled' &&
      existing.start_time < newSlot.end_time &&
      existing.end_time > newSlot.start_time
    );
    
    if (overlapping.length > 0) {
      conflicts.push({
        newSlot,
        overlapping,
        hasStudentAssigned: overlapping.some(s => s.student_id !== null),
      });
    }
  }
  
  return conflicts;
};
```

**3 scenariusze:**

**A. Dodajemy puste sloty na istniejace lekcje (z studentem):**

- BLOKADA. Toast: "Cannot add available slots over existing lessons. Please remove the lessons first or edit them to unassign the student."
- Submit zablokowany.

**B. Dodajemy lekcje (z studentem) na puste sloty:**

- AUTO-REPLACE. Usun puste sloty (`deleteSlot` dla kazdego) → dodaj nowe lekcje.
- Toast: "X available slots were replaced with lessons."

**C. Dodajemy lekcje na istniejace lekcje (inny student):**

- BLOKADA. Toast: "Cannot add lessons over existing lessons. Please remove or edit the existing lessons first."
- Submit zablokowany.

**UI:** Przed submitem wyswietlic conflict summary w modalu:

```
⚠️ 3 time conflicts detected:
- Mon Feb 26, 09:00-10:00 — Lesson with Anna (will be replaced)
- Tue Feb 27, 10:00-11:00 — Lesson with John (BLOCKED)
[Cancel] [Create anyway (non-conflicting only)]
```

---

### Krok 6: CalendarToolbar — uproszczenie

**Plik:** `src/components/calendar/CalendarToolbar.tsx`

Usunac: `onAddRecurring`, `onBatchAdd`, `onQuickSetup` props i caly DropdownMenu.
Zamiast tego: prosty `<Button onClick={onAddSlot}>`.

```typescript
<Button size="sm" className="h-8" onClick={onAddSlot}>
  <Plus className="h-3.5 w-3.5 mr-1" /> Add
</Button>
```

---

### Krok 7: Fix freeze (Problem 1)

Dwa podejscia rownolegle:

**A.** W `CalendarWeekView` dodac `React.memo`:

```typescript
export const CalendarWeekView = React.memo(function CalendarWeekView(...) { ... });
```

**B.** W `CalendarSlotCard` dodac `React.memo`:

```typescript
export const CalendarSlotCard = React.memo(function CalendarSlotCard(...) { ... });
```

**C.** W `UnifiedSlotModal` renderowac content tylko gdy `open=true` (Dialog juz to robi, ale upewnic sie ze ciezkie obliczenia typu `generatedSlots` nie odpalaja sie gdy modal jest zamkniety).

---

### KROK 8 wygląd calendar  
1. na widoku day i week zmniejsz o 55% wysokość tych kafelek ze slotami na kalendarzu. Dzięki temu zmeści się nam cały dzień na ekranie laptopa deskopt dodatkowo są 2  różne kreski na pełną godzinę n. 12:00 i na poł godizny np 12:30, Kreska na pół godziny obecnie jest mocniejsza niż na pełną a pwinno być odwrotnie więc popraw  
  
  
Krok 9 Dokumentacja

Zaktualizowac:

- `docs/TECHNICAL_DOCUMENTATION.md` — nowa architektura modali
- `docs/USER_GUIDE_SHORT.md` — zmieniony flow dodawania slotow
- `docs/USER_GUIDE_DETAILED.md` — szczegoly UnifiedSlotModal
- `docs/CURRENT_STATE_ANALYSIS.md` — aktualny stan kalendarza

---

## KOLEJNOSC IMPLEMENTACJI


| Krok | Co                                               | Pliki                                          |
| ---- | ------------------------------------------------ | ---------------------------------------------- |
| 1    | Fix `usePublicBooking` infinite loop             | `usePublicBooking.tsx` (1 linia)               |
| 2    | Stworzyc `UnifiedSlotModal`                      | `UnifiedSlotModal.tsx` (NOWY, ~300 linii)      |
| 3    | Refaktor `CalendarPage` — usunac stare modale    | `CalendarPage.tsx`                             |
| 4    | Uproscic `CalendarToolbar`                       | `CalendarToolbar.tsx`                          |
| 5    | Rozbudowac `SlotDetailModal` — edycja + studenci | `SlotDetailModal.tsx`                          |
| 6    | Dodac conflict detection do UnifiedSlotModal     | `UnifiedSlotModal.tsx`                         |
| 7    | Dodac `React.memo` na widoki                     | `CalendarWeekView.tsx`, `CalendarSlotCard.tsx` |
| 8    | Usunac stare pliki modali                        | 3 pliki do usuniecia                           |
| 9    | Dokumentacja                                     | 4 pliki docs                                   |


**Szacunek:** 1-2 sesje implementacji. ~10 plikow zmienionych/utworzonych, 3 usuniete.