

# Plan: Naprawa krytycznego bugu + rozbudowa kalendarza

## ANALIZA GLEBOOKA

### Problem 1: Nieskonczona petla requestow (KRYTYCZNY)

**Przyczyna:** W `useCalendarSlots.tsx` linia 49:
```typescript
const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
```
To tworzy **nowy obiekt Date przy kazdym renderze**. `fetchSlots` (linia 51) ma dependency `[teacherId, weekStart, weekEnd]`. Poniewaz `weekEnd` jest nowa referencja przy kazdym renderze:
1. `fetchSlots` zmienia sie → useEffect (linia 76) odpala
2. `fetchSlots()` wywoluje `setSlots()` → re-render
3. Nowy `weekEnd` → nowy `fetchSlots` → useEffect znowu → nieskonczona petla
4. Setki requestow → przegladarka blokuje: `ERR_INSUFFICIENT_RESOURCES`

**Fix:** Uzyc `useMemo` dla `weekEnd` ALBO (lepiej) usunac `weekEnd` z dependencies `fetchSlots` i obliczyc go wewnatrz:

```typescript
// ZMIANA w useCalendarSlots.tsx:
// Linia 49 - dodac useMemo:
const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);
```

To jednolinijkowa zmiana rozwiazujaca problem calkowicie. `weekEnd` zmieni sie tylko gdy `weekStart` sie zmieni.

---

### Problem 2: Widoki Day/Week/Month w toolbarze

**Obecny stan:** Toolbar ma tylko nawigacje tygodniowa (prev/today/next) i zakres dat.

**Rozwiazanie:** Dodac przelacznik widoku (Day / Week / Month) do CalendarToolbar + CalendarPage:

1. **W `useCalendarSlots.tsx`:**
   - Dodac state `viewMode: 'day' | 'week' | 'month'`
   - Dodac state `currentDate: Date` (dla widoku dziennego)
   - Zmienic `navigateWeek` na bardziej ogolne `navigate` ktore dziala dla kazdego trybu
   - `fetchSlots` pobiera dane wg aktywnego widoku:
     - Day: 1 dzien
     - Week: 7 dni (jak teraz)
     - Month: ~35 dni (5 tygodni siatki)

2. **W `CalendarToolbar.tsx`:**
   - Dodac 3 przyciski (Day / Week / Month) obok nawigacji
   - Uzyc ToggleGroup z shadcn/ui
   - Format daty zmienia sie wg widoku:
     - Day: "Wednesday, Feb 26, 2026"
     - Week: "Feb 23 – Mar 1, 2026" (jak teraz)
     - Month: "February 2026"

3. **Nowy komponent `CalendarDayView.tsx`:**
   - Widok godzinowy 7:00-22:00 (jak Google Calendar day view)
   - Godziny po lewej, sloty jako bloki o wysokosci proporcjonalnej do czasu trwania
   - Klikniecie pustego obszaru otwiera AddSlotModal z pre-filled godzina

4. **Nowy komponent `CalendarMonthView.tsx`:**
   - Siatka 7x5 (pon-niedz x 5 tygodni)
   - Kazda komorka pokazuje date + kolorowe kropki/minikarty slotow
   - Klikniecie dnia przelacza na widok dzienny tego dnia
   - Max 3-4 sloty widoczne per komorka + "+X more" link

5. **W `CalendarPage.tsx`:**
   - Warunkowe renderowanie: `viewMode === 'week' ? <CalendarWeekView> : viewMode === 'day' ? <CalendarDayView> : <CalendarMonthView>`

**Pliki do zmiany/utworzenia:**
- `useCalendarSlots.tsx` — dodac viewMode, currentDate, navigate
- `CalendarToolbar.tsx` — dodac ToggleGroup Day/Week/Month
- `CalendarDayView.tsx` — NOWY
- `CalendarMonthView.tsx` — NOWY
- `CalendarPage.tsx` — warunkowe renderowanie

---

### Problem 3A: Recurring slots — student + data koncowa

**Obecny stan:** `AddRecurringSlotModal` pozwala wybrac dzien tygodnia, czas, i "weeks ahead". Brak opcji przypisania studenta i daty koncowej.

**Fix w `AddRecurringSlotModal.tsx`:**
1. Dodac `Select` do wyboru studenta (tak jak w AddSlotModal — "Open slot" / lista studentow)
2. Dodac przelacznik: "Generate for X weeks" / "Until specific date"
   - Jesli "Until date": Input type="date" na `effective_until`
   - Jesli "X weeks": Select jak teraz
3. W `useCalendarRecurrence.tsx` `createRule`: przekazac `student_id` do generowanych slotow (aktualnie wszystkie sa `student_id: null`)

**Zmiany w `CreateRecurrenceInput`:**
```typescript
export interface CreateRecurrenceInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
  effective_from?: string;
  effective_until?: string | null;
  auto_generate_weeks_ahead?: number;
  student_id?: string | null;  // NOWE
  title?: string;              // NOWE
}
```

**Props `AddRecurringSlotModal`:** Dodac `students: Student[]` (przekazac z CalendarPage tak jak do AddSlotModal).

---

### Problem 3B: Szybkie dodawanie wielu slotow (Batch Add)

**Rozwiazanie:** Nowy modal `BatchAddSlotsModal.tsx` dostepny z toolbara (przycisk "Batch Add" lub w menu "Add Slot ▼"):

**UI modalu BatchAddSlotsModal:**
1. **Sekcja "Select Days":** Checkboxy dla kazdego dnia tygodnia (Mon-Sun). Mozna zaznaczyc wiele.
2. **Sekcja "Time Slots":** Lista par start/end z przyciskiem "+Add time". Np.:
   - 09:00-10:00 [x]
   - 10:00-11:00 [x]
   - 14:00-15:00 [x]
   - [+ Add time slot]
3. **Sekcja "Date Range":** Od (date) - Do (date). Default: biezacy tydzien.
4. **Sekcja "Type":** Radio: "Available slots" / "Assigned to student" + select studenta.
5. **Preview:** "This will create 15 slots" (dynamic count).
6. **Button:** "Create X slots"

**Logika:** Dla kazdego zaznaczonego dnia w zakresie dat × kazdy time slot → wygeneruj CreateSlotInput. Sprawdz konflikty zbiorczo. Wstaw batch jednym INSERT.

**Plik:** `src/components/calendar/BatchAddSlotsModal.tsx` — NOWY

---

### Problem 3C: Opcje jak w Google Calendar przy dodawaniu

**Rozwiazanie:** Rozbudowac `AddSlotModal` o dodatkowe pola i rozdzielic na dwa tryby:

**Nowy layout AddSlotModal:**
Na gorze modalu 2 zakladki (Tabs):
- **"Available Slot"** — tworzenie pustego slotu do rezerwacji
- **"Lesson"** — tworzenie slotu z przypisanym studentem

**Zakladka "Available Slot":**
- Date (date picker)
- Start Time / End Time
- Repeat: None / Weekly / Custom (opcja cyklicznosci inline)
- Title (optional)
- Notes (optional)

**Zakladka "Lesson":**
- Student (wymagany — Select z lista studentow)
- Date (date picker)
- Start Time / End Time
- Repeat: None / Weekly / Custom
- Title (auto-fill: "{Student name} — English lesson")
- Notes (optional)
- Color (opcjonalny — dropdown z kolorami Google Calendar)

**Dodatkowe opcje obu zakladek (inspirowane GCal):**
- **Repeat dropdown:** None / Every week / Every 2 weeks / Custom → jesli Custom to otwiera mini-formularz jak Google Calendar (dzien tygodnia + ile tygodni / do daty)
- Notification (checkbox): "Send email notification to student"

---

### Problem 3D: Dodawanie slotow przez klikniecie na kalendarz

**Obecny stan:** W `CalendarDayColumn` jest przycisk "+ Add" na dole kolumny. Klikniecie otwiera modal z pre-filled data ale bez godziny.

**Rozwiazanie dla widoku tygodniowego (CalendarWeekView):**
- Klikniecie "+ Add" na dole kolumny juz dziala (problem 1 blokuje wyswietlanie)
- Po naprawie problemu 1, to bedzie dzialac

**Rozwiazanie dla widoku dziennego (CalendarDayView — nowy):**
- Siatka godzinowa 7:00-22:00, kazda godzina to klikalny wiersz
- Klikniecie pustego miejsca → `onAddSlot(date, clickedHour)` → AddSlotModal z pre-filled data I godzina
- Drag to select (przyszlosc) — na razie single click

**Rozwiazanie dla widoku miesiecznego (CalendarMonthView — nowy):**
- Klikniecie dnia → przelacza na widok dzienny (lub otwiera AddSlotModal)
- Przycisk "+" w rogu komorki dnia → AddSlotModal z data

---

### Problem 3E: Rozroznienie trybow w modalu

Opisane w 3C powyzej — zakladki "Available Slot" / "Lesson" na gorze modalu AddSlotModal.

---

### Problem 3 (ogolny): Zblizenie do Google Calendar UX

**Kluczowe elementy do odwzorowania:**

1. **Typografia i spacing:**
   - Uzyc font-family: `'Google Sans', Roboto, Arial, sans-serif` — ale my juz uzywamy Inter ktory jest bardzo podobny. Zachowac Inter.
   - Zmniejszyc padding w slotach, bardziej kompaktowe karty
   - Kolory GCal: tla biale, tekst ciemnoszary, akcenty kolorowe per status

2. **Day view (priorytet):**
   - Siatka godzinowa z liniami poziomymi co 30 min (cienkie linie) i co 1h (grubsze)
   - Czerwona linia "teraz" przesuwajaca sie w czasie
   - Sloty jako kolorowe bloki o wysokosci proporcjonalnej do czasu trwania
   - Bloki lekko zaokraglone (rounded-lg), cien (shadow-sm)

3. **Week view:**
   - Obecny widok jest listowy (sloty jako buttony w kolumnie). Google Calendar ma siatke godzinowa.
   - **Zmiana:** Zamiast listy slotow, widok tygodniowy tez powinien byc siatka godzinowa (jak GCal week view)
   - Kazda kolumna ma godziny 7:00-22:00, sloty jako pozycjonowane absolutnie bloki wg start_time/end_time

4. **Animacje:**
   - Transition miedzy widokami (fade/slide)
   - Hover na slotach: scale(1.02) + shadow
   - Modal otwieranie: juz mamy z Dialog (animowane)

5. **Toolbar:**
   - Lewo: `< Today >` + data
   - Srodek/prawo: Day | Week | Month (toggle group)
   - Prawo: Settings, Share, Add

**UWAGA:** Pelne odwzorowanie GCal wymagaloby znacznego nakladu pracy. Proponuje iteracyjne podejscie:
- Krok 1: Naprawic bug + dodac Day/Month views (funkcjonalnosc)
- Krok 2: Przerobic week/day view na siatke godzinowa (UX upgrade)
- Krok 3: Polish — animacje, kolory, hover efekty

---

### Problem 5J: Timezone — select zamiast input

**Obecny stan:** W CalendarSettingsPage (linia 58) jest zwykly Input tekstowy na timezone.

**Fix:** Zamienic na Select z lista popularnych stref czasowych:

```typescript
const TIMEZONES = [
  'Europe/Warsaw', 'Europe/London', 'Europe/Berlin', 'Europe/Paris',
  'Europe/Madrid', 'Europe/Rome', 'Europe/Prague', 'Europe/Bucharest',
  'Europe/Athens', 'Europe/Istanbul', 'Europe/Moscow',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Sao_Paulo', 'America/Mexico_City', 'America/Buenos_Aires',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Seoul', 'Asia/Kolkata',
  'Asia/Dubai', 'Asia/Bangkok', 'Asia/Singapore',
  'Australia/Sydney', 'Australia/Melbourne',
  'Pacific/Auckland',
  'Africa/Cairo', 'Africa/Johannesburg',
];
```

Zmiana w `CalendarSettingsPage.tsx`: zamienic `<Input>` na `<Select>` z powyzszymi wartosciami + opcja "Other (type manually)" z fallback na Input.

---

### Problem 5J: Conflict detection

**Juz istnieje** w `useCalendarSlots.tsx` linia 82-94 w `createSlot`. Sprawdza overlapping sloty przed utworzeniem. To jest poprawne.

---

### Problem 5K: Batch operations

Opisane w 3B powyzej — `BatchAddSlotsModal.tsx`.

---

### Problem 5K: Undo cancellation

**Co to znaczy:** Jesli nauczyciel przypadkowo anuluje slot, ma 30 minut na cofniecie. Po anulowaniu slot zmienia status na 'cancelled'. Przez 30 minut jest widoczny w kalendarzu z przyciskiem "Undo Cancel". Po 30 minutach ten przycisk znika.

**Implementacja:**
- W `SlotDetailModal.tsx`: jesli `slot.status === 'cancelled'` i `slot.cancelled_at` < 30 min temu → pokaz przycisk "Undo Cancellation"
- Klikniecie → `updateSlot(id, { status: 'available', cancelled_at: null, cancelled_by: null })`
- Nie wymaga zmian w bazie — logika frontendowa

---

### Problem 5L: Mobile — widok shared dla ucznia

**Obecny stan:** `PublicBookingPage` ma responsywny grid (2 cols mobile → 7 cols desktop). OK ale mozna poprawic.

**Fix:**
- Na mobile (`use-mobile` hook): zamiast gridu tygodniowego, pokazac liste dostepnych slotow zgrupowana per dzien (vertical scroll)
- Kazdy dzien to sekcja z naglowkiem "Wednesday, Feb 26" i lista buttonow ze slotami
- Przelacznik tygodniowy na gorze (< This Week >)
- Przycisk "Book" wiekszy na mobile (pelna szerokosc)

---

### Problem 5M: Quick Week Setup wizard

**Nowy komponent `QuickWeekSetupModal.tsx`:**

**Kiedy sie pokazuje:** Pierwszy raz gdy nauczyciel wchodzi na /calendar i nie ma zadnych slotow ani recurrence rules.

**UI:**
1. **Krok 1:** "What are your typical working hours?"
   - Suwak lub 2 selecty: Start hour (7:00-12:00) / End hour (15:00-22:00)
   - Default: 9:00-18:00

2. **Krok 2:** "Which days do you usually teach?"
   - 7 checkboxow (Mon-Sun), default: Mon-Fri zaznaczone

3. **Krok 3:** "How long is a typical lesson?"
   - Select: 30 / 45 / 60 / 90 / 120 min
   - Default: z settings (60)

4. **Krok 4:** "Generate schedule for:"
   - Select: 2 / 4 / 6 / 8 weeks
   - Default: 4

5. **Preview:** "This will create 40 available slots (Mon-Fri, 9:00-18:00, 60min each, 4 weeks)"

6. **Button:** "Create Schedule"

**Logika:** Generuje sloty: dla kazdego dnia w wybranych dniach tygodnia × zakres dat × co (duration) min od start do end hour. Np. 9:00-10:00, 10:00-11:00, ..., 17:00-18:00 = 9 slotow/dzien × 5 dni × 4 tygodnie = 180 slotow.

**Wazne:** Insert batchowy (jedno zapytanie). Sprawdzanie konfliktow zbiorcze przed insertem.

---

### Problem 5M: Slot templates

**Nowa tabela `calendar_slot_templates`:**
```sql
CREATE TABLE public.calendar_slot_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  name text NOT NULL, -- np. "My Typical Monday"
  day_of_week integer, -- opcjonalne, 0-6
  slots jsonb NOT NULL DEFAULT '[]', -- [{start_time, end_time, title}]
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE calendar_slot_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage templates" ON calendar_slot_templates
  FOR ALL TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
```

**UI:**
- W CalendarToolbar: dropdown "Templates ▼" → lista zapisanych szablonow + "Save current day as template"
- "Save current day as template": bierze wszystkie sloty z wybranego dnia, zapisuje ich start_time/end_time jako szablon
- "Apply template": generuje sloty na wybrany dzien/tydzien wg szablonu

---

### Problem 5M: Student attendance stats

**Implementacja:** Widok w `StudentPage.tsx` tab "Calendar":
- Liczy sloty per student: completed / no_show / cancelled / total booked
- Wyswietla: "Attendance rate: 95% (19/20 lessons attended)"
- Wykres sparkline (opcjonalnie) z ostatnich 10 lekcji

**SQL query:**
```sql
SELECT 
  status, count(*) 
FROM calendar_slots 
WHERE student_id = $1 AND teacher_id = $2 AND status IN ('completed','no_show','cancelled')
GROUP BY status
```

Nie wymaga nowej tabeli — agregacja na istniejacych danych.

---

## PELNA KOLEJNOSC IMPLEMENTACJI

| Krok | Co | Pliki | Priorytet |
|---|---|---|---|
| 1 | **Fix nieskonczonej petli** — useMemo weekEnd | `useCalendarSlots.tsx` (1 linia) | KRYTYCZNY |
| 2 | **Timezone Select** w ustawieniach | `CalendarSettingsPage.tsx` | Szybki fix |
| 3 | **AddSlotModal** — 2 zakladki (Available/Lesson), repeat opcja | `AddSlotModal.tsx` | Wazny UX |
| 4 | **AddRecurringSlotModal** — student + data koncowa | `AddRecurringSlotModal.tsx`, `useCalendarRecurrence.tsx` | Wazny UX |
| 5 | **CalendarToolbar** — Day/Week/Month toggle | `CalendarToolbar.tsx` | Wazny UX |
| 6 | **CalendarDayView** — siatka godzinowa, klikanie | `CalendarDayView.tsx` (NOWY) | Nowy widok |
| 7 | **CalendarMonthView** — siatka miesieczna | `CalendarMonthView.tsx` (NOWY) | Nowy widok |
| 8 | **CalendarPage** — viewMode routing miedzy widokami | `CalendarPage.tsx`, `useCalendarSlots.tsx` | Integracja |
| 9 | **CalendarWeekView** — przerobienie na siatke godzinowa (GCal style) | `CalendarWeekView.tsx`, `CalendarDayColumn.tsx` | UX upgrade |
| 10 | **BatchAddSlotsModal** — masowe dodawanie | `BatchAddSlotsModal.tsx` (NOWY) | Produktywnosc |
| 11 | **QuickWeekSetupModal** — wizard pierwszego uzycia | `QuickWeekSetupModal.tsx` (NOWY) | Onboarding |
| 12 | **Undo cancellation** — przycisk w SlotDetailModal | `SlotDetailModal.tsx` | Quick fix |
| 13 | **Mobile PublicBookingPage** — lista zamiast gridu | `PublicBookingPage.tsx` | Mobile UX |
| 14 | **Slot templates** — migracja SQL + UI | migration.sql, `CalendarToolbar.tsx` | Produktywnosc |
| 15 | **Attendance stats** — tab Calendar w StudentPage | `StudentCalendarTab.tsx` | Analityka |
| 16 | **Dokumentacja** | 6 plikow docs | Standard |

**SZACUNEK: Kroki 1-2 = natychmiastowy fix. Kroki 3-9 = 2-3 sesje. Kroki 10-16 = 2 sesje.**

## SZCZEGOLY TECHNICZNE KLUCZOWYCH ZMIAN

### CalendarDayView — siatka godzinowa (krok 6):

```typescript
// Struktura:
// - Lewa kolumna: godziny 7:00, 7:30, 8:00, ...
// - Prawa: pozycjonowane absolutnie bloki slotow
// - Slot height = (duration_minutes / 30) * ROW_HEIGHT
// - Slot top = ((start_hour - 7) * 60 + start_min) / 30 * ROW_HEIGHT

const ROW_HEIGHT = 48; // px per 30min slot
const START_HOUR = 7;
const END_HOUR = 22;
const TOTAL_ROWS = (END_HOUR - START_HOUR) * 2; // 30 rows

// Slot positioning:
const getSlotStyle = (slot: CalendarSlot) => {
  const [sh, sm] = slot.start_time.split(':').map(Number);
  const [eh, em] = slot.end_time.split(':').map(Number);
  const startMin = (sh - START_HOUR) * 60 + sm;
  const endMin = (eh - START_HOUR) * 60 + em;
  return {
    top: `${(startMin / 30) * ROW_HEIGHT}px`,
    height: `${((endMin - startMin) / 30) * ROW_HEIGHT}px`,
  };
};

// "Now" line:
const nowMin = (currentHour - START_HOUR) * 60 + currentMinute;
const nowTop = (nowMin / 30) * ROW_HEIGHT;
// <div className="absolute w-full h-0.5 bg-red-500 z-20" style={{ top: nowTop }} />
```

### CalendarWeekView upgrade na siatke godzinowa (krok 9):

Taka sama logika jak DayView ale 7 kolumn obok siebie z wspolna osia godzinowa po lewej stronie. Kazda kolumna to wzglednie pozycjonowany kontener ze slotami.

### useCalendarSlots — rozszerzenie o viewMode (krok 8):

```typescript
const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
const [currentDate, setCurrentDate] = useState(new Date());

// Zakres dat zalezy od viewMode:
const dateRange = useMemo(() => {
  if (viewMode === 'day') {
    return { from: currentDate, to: currentDate };
  } else if (viewMode === 'week') {
    return { from: startOfWeek(currentDate, {weekStartsOn:1}), to: endOfWeek(currentDate, {weekStartsOn:1}) };
  } else {
    return { from: startOfMonth(currentDate), to: endOfMonth(currentDate) };
  }
}, [viewMode, currentDate]);

// navigate zmienia currentDate wg viewMode
const navigate = (dir: 'prev' | 'next' | 'today') => {
  if (dir === 'today') return setCurrentDate(new Date());
  const delta = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30;
  setCurrentDate(prev => addDays(prev, dir === 'next' ? delta : -delta));
};
```

