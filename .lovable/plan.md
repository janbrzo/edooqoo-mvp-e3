# Plan wdrozenia - 2 Problemy

---

## Problem 1: Modul Kalendarza Nauczyciela

### Analiza architektoniczna

To jest duzy feature wymagajacy nowych tabel, edge functions, strony publicznej dla uczniow, integracji z Google Calendar API i systemu powiadomien. Musi byc lekki i dzialac plynnie w obecnej aplikacji.

### Zakres MVP kalendarza

Na podstawie Twoich wymagań A-M, dzielę to na **3 fazy wdrozeniowe**:

**Faza 1 (MVP Core):** A, B, C, D, G, I - rdzen kalendarza
**Faza 2 (Payments + Export):** F, H - oplaty i eksport
**Faza 3 (Google Calendar):** E - integracja z GCal

Powod: Faza 1 daje natychmiastowa wartosc. Faza 2 i 3 sa niezalezne i moga byc robione rownoglegle po Fazie 1.

---

### FAZA 1: Rdzen kalendarza

#### 1.1 Nowe tabele w bazie danych

**Tabela `calendar_slots**` - definicja dostepnych slotow nauczyciela:

```sql
CREATE TABLE public.calendar_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL, -- NULL = publiczny slot
  title text,
  slot_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'available', 
    -- available, booked, completed, cancelled, no_show
  booking_type text NOT NULL DEFAULT 'manual',
    -- manual (nauczyciel dodal recznie), student_booked, recurring_instance
  recurrence_rule_id uuid REFERENCES public.calendar_recurrence_rules(id) ON DELETE SET NULL,
  worksheet_id uuid, -- powiazanie z worksheet (punkt I)
  notes text, -- notatki nauczyciela widoczne dla ucznia
  student_notes text, -- notatki od ucznia
  booked_at timestamp with time zone,
  booked_by text, -- 'teacher' | 'student'
  confirmed_at timestamp with time zone, -- NULL = oczekuje potwierdzenia
  cancelled_at timestamp with time zone,
  cancelled_by text,
  cancellation_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_time CHECK (end_time > start_time),
  CONSTRAINT valid_status CHECK (status IN ('available','booked','completed','cancelled','no_show'))
);

CREATE INDEX idx_calendar_slots_teacher_date ON calendar_slots(teacher_id, slot_date);
CREATE INDEX idx_calendar_slots_student ON calendar_slots(student_id);
```

**Tabela `calendar_recurrence_rules**` - cykliczne sloty (punkt C):

```sql
CREATE TABLE public.calendar_recurrence_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  day_of_week integer NOT NULL, -- 0=Mon, 1=Tue, ..., 6=Sun
  start_time time NOT NULL,
  end_time time NOT NULL,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_until date, -- NULL = bezterminowo
  is_active boolean NOT NULL DEFAULT true,
  auto_generate_weeks_ahead integer NOT NULL DEFAULT 4,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

**Tabela `calendar_settings**` - ustawienia kalendarza nauczyciela (punkty B, D, F):

```sql
CREATE TABLE public.calendar_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL UNIQUE,
  
  -- Booking rules (punkt B)
  default_booking_mode text NOT NULL DEFAULT 'requires_confirmation',
    -- 'auto_confirm' | 'requires_confirmation'
  
  -- Per-student trust overrides stored in calendar_student_settings
  
  -- Slot limits (punkt D)
  max_slots_per_student_per_week integer, -- NULL = no limit
  enforce_slot_limit boolean NOT NULL DEFAULT false, -- true=block, false=warning only
  
  -- Lesson defaults
  default_lesson_duration_minutes integer NOT NULL DEFAULT 60,
  
  -- Public calendar
  public_calendar_enabled boolean NOT NULL DEFAULT false,
  public_calendar_token text UNIQUE, -- share token for public URL
  
  -- Notification preferences
  notify_on_booking boolean NOT NULL DEFAULT true,
  notify_on_cancellation boolean NOT NULL DEFAULT true,
  notify_student_reminder_hours integer DEFAULT 24, -- NULL = no reminder
  notify_payment_reminder boolean NOT NULL DEFAULT false,
  
  -- Payment tracking (punkt F - faza 2)
  payment_tracking_enabled boolean NOT NULL DEFAULT false,
  default_lesson_price numeric,
  currency text DEFAULT 'USD',
  
  -- Google Calendar (punkt E - faza 3)
  gcal_integration_enabled boolean NOT NULL DEFAULT false,
  gcal_default_color text DEFAULT '1', -- Google Calendar color ID
  gcal_default_reminder_minutes integer DEFAULT 30,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

**Tabela `calendar_student_settings**` - ustawienia per-uczen (punkt B - trust):

```sql
CREATE TABLE public.calendar_student_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  booking_mode_override text, -- NULL = use teacher default, 'auto_confirm' | 'requires_confirmation'
  
  -- Payment tracking per student (punkt F)
  prepaid_lessons_remaining integer NOT NULL DEFAULT 0,
  lesson_price_override numeric, -- NULL = use teacher default
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, student_id)
);
```

**Tabela `calendar_payment_records**` - historia platnosci (punkt F - faza 2):

```sql
CREATE TABLE public.calendar_payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  student_id uuid NOT NULL,
  slot_id uuid REFERENCES public.calendar_slots(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_type text NOT NULL DEFAULT 'lesson',
    -- 'lesson' | 'prepaid_pack' | 'refund'
  lessons_count integer DEFAULT 1, -- for prepaid packs
  is_confirmed boolean NOT NULL DEFAULT false,
  confirmed_at timestamp with time zone,
  confirmed_by text, -- 'teacher' | 'student'
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### RLS Policies

```sql
-- calendar_slots
ALTER TABLE calendar_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their own slots"
  ON calendar_slots FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Publiczny dostep dla uczniow (booking przez share token - walidacja w kodzie)
CREATE POLICY "Public can view available slots by teacher"
  ON calendar_slots FOR SELECT TO anon, authenticated
  USING (status = 'available' AND student_id IS NULL);

-- calendar_recurrence_rules
ALTER TABLE calendar_recurrence_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage their recurrence rules"
  ON calendar_recurrence_rules FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- calendar_settings
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage their settings"
  ON calendar_settings FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- calendar_student_settings
ALTER TABLE calendar_student_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage student settings"
  ON calendar_student_settings FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- calendar_payment_records
ALTER TABLE calendar_payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage payment records"
  ON calendar_payment_records FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);
```

#### 1.2 Nowe strony i komponenty

**Routing (App.tsx):**

```
/calendar                -> CalendarPage.tsx (widok nauczyciela)
/calendar/settings       -> CalendarSettingsPage.tsx (ustawienia)
/book/:token             -> PublicBookingPage.tsx (widok ucznia - publiczny)
/my-lessons/:token       -> StudentLessonsPage.tsx (widok ucznia - jego lekcje)
```

**Komponenty glowne:**

```
src/pages/CalendarPage.tsx           -- Glowna strona kalendarza nauczyciela
src/pages/CalendarSettingsPage.tsx   -- Ustawienia kalendarza
src/pages/PublicBookingPage.tsx      -- Publiczny kalendarz do rezerwacji
src/pages/StudentLessonsPage.tsx     -- Widok ucznia z lekcjami (punkt G)

src/components/calendar/
  CalendarWeekView.tsx               -- Widok tygodniowy (glowny)
  CalendarMonthView.tsx              -- Widok miesieczny (overview)
  CalendarDayColumn.tsx              -- Kolumna dnia z godzinami
  CalendarSlotCard.tsx               -- Karta slotu (kolor wg statusu)
  AddSlotModal.tsx                   -- Dodawanie pojedynczego slotu
  AddRecurringSlotModal.tsx          -- Dodawanie cyklicznych slotow
  SlotDetailModal.tsx                -- Szczegoly slotu (edycja, notatki, worksheet link)
  BookingConfirmationModal.tsx       -- Potwierdzenie rezerwacji
  CalendarToolbar.tsx                -- Filtrowanie, nawigacja, widoki
  CalendarSettingsForm.tsx           -- Formularz ustawien
  StudentTrustSettings.tsx           -- Ustawienia zaufania per uczen
  PublicCalendarSlotPicker.tsx       -- Picker slotow dla ucznia
  StudentLessonCard.tsx              -- Karta lekcji w widoku ucznia
  LinkWorksheetModal.tsx             -- Laczenie worksheet z lekcja

src/hooks/
  useCalendarSlots.tsx               -- CRUD slotow + realtime
  useCalendarSettings.tsx            -- Ustawienia
  useCalendarRecurrence.tsx          -- Cykliczne sloty
  usePublicBooking.tsx               -- Logika rezerwacji ucznia
```

#### 1.3 Widok kalendarza nauczyciela (CalendarPage)

**Layout:** Pelnoekranowy widok tygodniowy (pon-niedz) z kolumnami godzinowymi 7:00-22:00.

**Glowne elementy:**

- **Toolbar:** Strzalki nawigacji tydzien (< This week >) | Widok: Week / Month | Filtr: All students / Konkretny uczen | Button: "Add Slot" | Button: "Settings" | Button: "Share Calendar"
- **Siatka tygodniowa:** 7 kolumn (dni), wiersze co 30 min. Sloty wyswietlane jako kolorowe bloki:
  - Zielony = available (wolny)
  - Niebieski = booked (zarezerwowany, potwierdzony)
  - Zolty = pending confirmation
  - Szary = completed
  - Czerwony = cancelled / no-show
- **Klikniecie slotu:** Otwiera SlotDetailModal z opcjami: edycja, notatki, link do worksheet, oznacz jako completed/no-show, anuluj
- **Klikniecie pustego miejsca:** Otwiera AddSlotModal z pre-filled data i godzina

**Widok miesieczny:** Kompaktowy grid z liczbami slotow per dzien (klikniecie dnia przelacza na widok tygodniowy).

#### 1.4 Publiczny kalendarz (punkt B)

**Generowanie linku:** W CalendarSettings nauczyciel klika "Enable Public Calendar". System generuje `public_calendar_token` (hex, 64 znaki). Link: `/book/{token}`.

**PublicBookingPage.tsx:**

- Wyswietla wolne sloty nauczyciela (filtr: status='available', student_id IS NULL)
- Uczen wpisuje imie + email (lub jest juz zidentyfikowany jesli ma student_email w tabeli students)
- Klika slot -> modal potwierdzenia -> rezerwacja
- Jesli nauczyciel ma `default_booking_mode = 'auto_confirm'` LUB uczen ma `booking_mode_override = 'auto_confirm'` -> slot od razu `status='booked'`, `confirmed_at=now()`
- Jesli `requires_confirmation` -> slot `status='booked'`, `confirmed_at=NULL` -> nauczyciel dostaje powiadomienie

**Limit slotow (punkt D):**

- Przed rezerwacja sprawdz: ile slotow ma uczen w tym tygodniu
- Jesli `max_slots_per_student_per_week` jest ustawiony:
  - `enforce_slot_limit=true` -> blokada, komunikat "You've reached the maximum of X lessons per week"
  - `enforce_slot_limit=false` -> warning modal: "You already have X lessons this week. Are you sure you want to book another?"

#### 1.5 Cykliczne sloty (punkt C)

**AddRecurringSlotModal:**

- Wybor dnia tygodnia + godzina start/end
- Wybor: "Generate for next X weeks" (default 4)
- Po zapisaniu: tworzy `calendar_recurrence_rule` + natychmiast generuje sloty na X tygodni

**Auto-generowanie (cron lub manual):**

- Edge function `generate-recurring-slots` wywoływana raz dziennie (lub recznie przyciskiem)
- Sprawdza aktywne rules i generuje sloty na `auto_generate_weeks_ahead` tygodni do przodu jesli jeszcze nie istnieja

#### 1.6 Powiazanie z Worksheet (punkt I)

W `SlotDetailModal` przycisk "Link Worksheet" otwiera `LinkWorksheetModal`:

- Lista worksheetow nauczyciela dla danego ucznia
- Po wybraniu: `calendar_slots.worksheet_id = selected_id`
- W widoku kalendarza: ikona dokumentu na slocie, klikniecie otwiera worksheet

#### 1.7 Widok ucznia (punkt G)

**StudentLessonsPage.tsx** (dostepny przez link `/my-lessons/{token}`):

- Token generowany per uczen (hash z student_id + teacher_id)
- Pokazuje: przyszle lekcje (sorted by date), przeszle lekcje
- Kazda lekcja: data, godzina, notatki nauczyciela, link do worksheetu jesli jest
- Status platnosci (faza 2)

#### 1.8 Powiadomienia

**Typy powiadomien (reuse `homework_notifications` tabeli):**

- `lesson_booked` - uczen zarezerwował lekcje
- `lesson_confirmed` - nauczyciel potwierdzil
- `lesson_cancelled` - anulowanie
- `lesson_reminder` - przypomnienie X godzin przed

**Edge function `send-calendar-notification`:**

- Wysyla email do ucznia (reuse istniejacego wzorca z `send-homework-email`)
- Nauczyciel kontroluje ktore powiadomienia sa aktywne w `calendar_settings`

#### 1.9 Nawigacja

W `Dashboard.tsx` dodac przycisk/link "Calendar" w gornym pasku obok istniejacych elementow. Ikona: `Calendar` z lucide-react (juz importowany w Dashboard.tsx linia 22).

W `StudentPage.tsx` dodac nowa zakladke "Calendar" w TabsList (po "Skills") - pokazuje sloty tylko dla tego ucznia.

---

### FAZA 2: Platnosci i eksport (punkt F, H)

#### Platnosci (punkt F)

- W `CalendarSettingsForm` sekcja "Payment Tracking": enable/disable, default price, currency
- W `CalendarStudentSettings`: prepaid_lessons_remaining, lesson_price_override
- W `SlotDetailModal`: przycisk "Mark as Paid" / "Mark as Unpaid"
- Auto-dekrementacja `prepaid_lessons_remaining` po zakonczeniu lekcji (status='completed')
- Uczen moze kliknac "I've paid" -> wymaga potwierdzenia nauczyciela
- Powiadomienia o platnosci (jesli wlaczone w ustawieniach)

#### Eksport (punkt H)

- W `CalendarToolbar` przycisk "Export" -> dropdown: "All lessons" / "Selected student" / "Date range"
- Generuje CSV z kolumnami: Date, Time, Student, Status, Paid, Notes, Worksheet Title
- Opcja "Send by email" -> edge function `send-calendar-export` wysyla CSV mailem

---

### FAZA 3: Google Calendar (punkt E)

#### Integracja

- Wymaga Google Calendar API connector (OAuth2)
- Edge function `sync-gcal-event` wywoływana po potwierdzeniu rezerwacji
- Tworzy event w GCal nauczyciela z: tytul (student name + "English lesson"), czas, kolor (z ustawien), reminder (z ustawien)
- Dwukierunkowa sync: jesli nauczyciel usunie event w GCal -> webhook powiadamia nasz system
- Ustawienia w CalendarSettings: kolor, reminder minutes, opis domyslny

**UWAGA:** Faza 3 wymaga connector Google Calendar. Sprawdzilem dostepne connectors - nie ma Google Calendar. Bedzie wymagal albo custom OAuth flow albo dodania connektora w przyszlosci. Na razie planujemy architekture ale nie implementujemy.

---

### Punkty J, K, L, M (dodatkowe elementy)

**J. Konieczne:**

- Timezone support - nauczyciel ustawia swoja strefe czasowa w settings, wszystkie czasy wyswietlane w tej strefie
- Konflikt detection - nie pozwol na overlapping sloty
- Cancellation policy - minimum X godzin przed lekcja

**K. Najlepsze praktyki:**

- Buffer time - automatyczne 5-15 min przerwy miedzy lekcjami (konfigurowalne) - odrzucam pomysł, moze byc nawet 0 min między lekcjami
- Batch operations - "Add 5 slots at once" (np. caly dzien co godzine)
- Undo cancellation - 30 min grace period

**L. Standard:**

- Color coding konsekwentny z reszta aplikacji (purpleDark, green, amber, red)
- Responsive - na mobile widok dzienny zamiast tygodniowego
- Loading states, error handling, optimistic updates

**M. Moje rekomendacje:**

- "Quick Week Setup" wizard - przy pierwszym uzyciu nauczyciel zaznacza typowe godziny pracy i system generuje sloty na 4 tygodnie
- Slot templates - "My typical Monday" - zapisz i wklejaj szablony
- Student attendance stats - % frekwencji per uczen (liczy completed vs no_show)

---

### Kolejnosc implementacji Fazy 1


| Krok | Co                                                                                 | Pliki         |
| ---- | ---------------------------------------------------------------------------------- | ------------- |
| 1    | Migracja SQL - 5 tabel + RLS + indeksy                                             | migration.sql |
| 2    | Hook `useCalendarSettings` + `useCalendarSlots`                                    | 2 pliki hooks |
| 3    | `CalendarPage.tsx` + `CalendarWeekView` + `CalendarDayColumn` + `CalendarSlotCard` | 4 pliki       |
| 4    | `AddSlotModal` + `SlotDetailModal`                                                 | 2 pliki       |
| 5    | `CalendarSettingsPage` + `CalendarSettingsForm`                                    | 2 pliki       |
| 6    | `AddRecurringSlotModal` + `useCalendarRecurrence` + edge function                  | 3 pliki       |
| 7    | `PublicBookingPage` + `usePublicBooking` + `PublicCalendarSlotPicker`              | 3 pliki       |
| 8    | `StudentLessonsPage` + `StudentLessonCard`                                         | 2 pliki       |
| 9    | `LinkWorksheetModal`                                                               | 1 plik        |
| 10   | Powiadomienia - edge function + integracja                                         | 2 pliki       |
| 11   | Nawigacja (Dashboard + StudentPage + App.tsx)                                      | 3 pliki       |
| 12   | Dokumentacja                                                                       | 6 plikow      |


**Szacunek: ~30 plikow, 3-4 sesje implementacji.**

---

## Problem 2: Tlumaczenia 5 nowych pytan na 25 jezykow

### Analiza

Plik `welcomeTestTranslations.ts` zawiera 25 jezykow. Kazdy jezyk ma ~24 pytan przetlumaczonych. Brakuje 5 nowych: `wt_q3b`, `wt_q5b`, `wt_q13b`, `wt_q17b`, `wt_q41b`.

### Pytania do przetlumaczenia (tekst angielski)

```text
wt_q3b:
  question: "Where do you use (or want to use) English the most?"
  options: [
    "At work - emails, meetings, calls",
    "Traveling - airports, hotels, restaurants",
    "Online - social media, forums, gaming",
    "With friends/family who speak English",
    "Consuming content - movies, books, podcasts",
    "In my professional field (medical, legal, IT, etc.)"
  ]

wt_q5b:
  question: "Imagine this: your boss just told you that in 3 weeks, you'll need to lead a meeting in English with international clients. How do you react?"
  options: [
    "I'd panic at first, but then prepare intensively every day until the meeting",
    "I'd feel nervous but would ask a colleague for help and practice the key phrases",
    "I'd ask to postpone or let someone else handle it",
    "I'd feel fairly confident - I'd just review some vocabulary beforehand"
  ]

wt_q13b:
  question: "Think about the last time you tried to learn something new (not English - anything: cooking, a sport, a skill). What happened?"
  options: [
    "I stuck with it and got pretty good at it",
    "I practiced for a while but eventually moved on to something else",
    "I started enthusiastically but lost motivation after a few weeks",
    "I'm still learning it - I haven't given up yet"
  ]

wt_q17b:
  question: "You see a perfect job posting that matches your skills exactly, but it requires 'fluent English.' What goes through your mind?"
  options: [
    "This is exactly why I'm learning English - I need to be ready for opportunities like this",
    "I'd apply anyway and hope my English improves by the time they interview me",
    "I'd skip it - I'm not learning English for work reasons",
    "I'd apply and highlight my other strengths to compensate for my English"
  ]

wt_q41b:
  question: "Which of these situations is closest to yours right now?"
  description: "There are no right or wrong answers."
  options: [
    "I have a specific event coming up soon where I need English (trip, interview, presentation)",
    "I need English regularly for my work/life, and I want to get noticeably better in the next few months",
    "I'm learning English for the long term - there's no rush, but I want steady progress",
    "English is something I enjoy learning - it's more about personal growth than a specific need"
  ]
```

### Plan implementacji

**Plik:** `src/data/welcomeTestTranslations.ts`

**Metoda:** Dodac 5 wpisow do kazdego z 25 obiektow jezykowych. Kazdy wpis zawiera `question`, `options` i opcjonalnie `description`.

**25 jezykow:**
Polish, Spanish, German, French, Portuguese, Italian, Turkish, Russian, Czech, Ukrainian, Dutch, Japanese, Korean, Chinese, Arabic, Hungarian, Romanian, Greek, Croatian, Swedish, Hindi, Vietnamese, Thai, Norwegian, Danish

**Lacznie:** 5 pytan × 25 jezykow = **125 wpisow translacyjnych**

### Gotowe tlumaczenia (wszystkie 125)

Ze wzgledu na ogrom danych, ponizej podaje tlumaczenia pogrupowane per pytanie. Implementacja polega na dodaniu tych wpisow do kazdego obiektu jezykowego w pliku.

#### POLISH (juz istnieje, dodac 5 nowych):

```typescript
'wt_q3b': {
  question: 'Gdzie najczesciej uzywasz (lub chcesz uzywac) angielskiego?',
  options: [
    'W pracy - maile, spotkania, rozmowy telefoniczne',
    'W podrozy - lotniska, hotele, restauracje',
    'Online - media spolecznosciowe, fora, gry',
    'Z przyjaciolmi/rodzina, ktorzy mowia po angielsku',
    'Konsumowanie tresci - filmy, ksiazki, podcasty',
    'W mojej dziedzinie zawodowej (medycyna, prawo, IT itp.)',
  ],
},
'wt_q5b': {
  question: 'Wyobraz sobie: szef wlasnie powiedzial Ci, ze za 3 tygodnie bedziesz musial/a poprowadzic spotkanie po angielsku z miedzynarodowymi klientami. Jak reagujesz?',
  options: [
    'Najpierw bym spanikowal/a, ale potem przygotowywal/a sie intensywnie kazdego dnia',
    'Bylbym/bylabym zdenerwowany/a, ale poprosil/a kolege o pomoc i cwiczy/la kluczowe frazy',
    'Poprosil/a bym o przesuniecie lub zeby ktos inny to poprowadzil',
    'Czulbym/czulabym sie dosyc pewnie - tylko przejrzal/a bym slownictwo wczesniej',
  ],
},
'wt_q13b': {
  question: 'Pomysl o ostatnim razie, gdy probowal/as nauczyc sie czegos nowego (nie angielskiego - czegokolwiek: gotowania, sportu, umiejetnosci). Co sie stalo?',
  options: [
    'Wytrwalam/em i stal/am sie w tym calkiem dobry/a',
    'Cwiczylem/am przez jakis czas, ale w koncu przeszedlem/przeszlam do czegos innego',
    'Zaczynalem/am z entuzjazmem, ale stracilem/am motywacje po kilku tygodniach',
    'Nadal sie tego ucze - nie poddajem/am sie',
  ],
},
'wt_q17b': {
  question: 'Widzisz idealna oferte pracy, ktora pasuje do Twoich umiejetnosci, ale wymaga "plynnego angielskiego." Co myslisz?',
  options: [
    'Wlasnie dlatego ucze sie angielskiego - musze byc gotowy/a na takie mozliwosci',
    'Zaaplikowalbym/zaaplikowalabym i mial/a nadzieje, ze moj angielski sie poprawi do rozmowy',
    'Pominal/a bym to - nie ucze sie angielskiego z powodow zawodowych',
    'Zaaplikowalbym/zaaplikowalabym i podkreslil/a inne mocne strony',
  ],
},
'wt_q41b': {
  question: 'Ktora z tych sytuacji jest najblizsza Twojej obecnej?',
  description: 'Nie ma dobrych ani zlych odpowiedzi.',
  options: [
    'Mam konkretne wydarzenie wkrotce, gdzie potrzebuje angielskiego (podroz, rozmowa kwalifikacyjna, prezentacja)',
    'Potrzebuje angielskiego regularnie w pracy/zyciu i chce zauwazyc poprawe w najblizszych miesiacach',
    'Ucze sie angielskiego dlugoterminowo - nie ma pospiech, ale chce starego postepu',
    'Angielski to cos, co lubie sie uczyc - bardziej chodzi o rozwoj osobisty niz konkretna potrzebe',
  ],
},
```

#### Pozostale 24 jezyki

Ponizej kompletne tlumaczenia dla KAZDEGO jezyka. Format jest identyczny - 5 kluczy (wt_q3b, wt_q5b, wt_q13b, wt_q17b, wt_q41b) do dodania do kazdego obiektu.

**SPANISH:**

```
wt_q3b: q:"¿Dónde usas (o quieres usar) más el inglés?" opts:["En el trabajo - correos, reuniones, llamadas","Viajando - aeropuertos, hoteles, restaurantes","Online - redes sociales, foros, juegos","Con amigos/familia que hablan inglés","Consumiendo contenido - películas, libros, podcasts","En mi campo profesional (medicina, derecho, IT, etc.)"]
wt_q5b: q:"Imagina esto: tu jefe acaba de decirte que en 3 semanas tendrás que dirigir una reunión en inglés con clientes internacionales. ¿Cómo reaccionas?" opts:["Primero entraría en pánico, pero luego me prepararía intensivamente cada día","Me pondría nervioso/a pero pediría ayuda a un colega y practicaría las frases clave","Pediría posponerlo o que otra persona se encargue","Me sentiría bastante seguro/a - solo repasaría vocabulario antes"]
wt_q13b: q:"Piensa en la última vez que intentaste aprender algo nuevo (no inglés - cualquier cosa). ¿Qué pasó?" opts:["Persistí y me volví bastante bueno/a","Practiqué un tiempo pero al final pasé a otra cosa","Empecé con entusiasmo pero perdí la motivación después de unas semanas","Todavía lo estoy aprendiendo - no me he rendido"]
wt_q17b: q:"Ves una oferta de trabajo perfecta que coincide con tus habilidades, pero requiere 'inglés fluido.' ¿Qué piensas?" opts:["Por esto estoy aprendiendo inglés - necesito estar listo/a para oportunidades así","Aplicaría y esperaría que mi inglés mejore para la entrevista","Lo pasaría - no estoy aprendiendo inglés por razones laborales","Aplicaría y destacaría mis otras fortalezas"]
wt_q41b: q:"¿Cuál de estas situaciones es más cercana a la tuya?" desc:"No hay respuestas correctas ni incorrectas." opts:["Tengo un evento específico pronto donde necesito inglés (viaje, entrevista, presentación)","Necesito inglés regularmente y quiero mejorar notablemente en los próximos meses","Estoy aprendiendo inglés a largo plazo - sin prisa, pero con progreso constante","El inglés es algo que disfruto aprender - más sobre crecimiento personal que una necesidad específica"]
```

**GERMAN:**

```
wt_q3b: q:"Wo verwenden Sie (oder möchten Sie) Englisch am meisten?" opts:["Bei der Arbeit - E-Mails, Meetings, Anrufe","Auf Reisen - Flughäfen, Hotels, Restaurants","Online - soziale Medien, Foren, Gaming","Mit Freunden/Familie, die Englisch sprechen","Inhalte konsumieren - Filme, Bücher, Podcasts","In meinem Fachgebiet (Medizin, Recht, IT usw.)"]
wt_q5b: q:"Stellen Sie sich vor: Ihr Chef hat Ihnen gerade gesagt, dass Sie in 3 Wochen ein Meeting auf Englisch mit internationalen Kunden leiten müssen. Wie reagieren Sie?" opts:["Ich würde zuerst in Panik geraten, mich dann aber jeden Tag intensiv vorbereiten","Ich wäre nervös, würde aber einen Kollegen um Hilfe bitten und die Schlüsselphrasen üben","Ich würde bitten, es zu verschieben oder jemand anderen übernehmen zu lassen","Ich wäre ziemlich zuversichtlich - würde nur vorher Vokabeln wiederholen"]
wt_q13b: q:"Denken Sie an das letzte Mal, als Sie etwas Neues lernen wollten (nicht Englisch). Was ist passiert?" opts:["Ich bin drangeblieben und ziemlich gut darin geworden","Ich habe eine Weile geübt, bin dann aber zu etwas anderem übergegangen","Ich habe enthusiastisch angefangen, aber nach ein paar Wochen die Motivation verloren","Ich lerne es noch - ich habe nicht aufgegeben"]
wt_q17b: q:"Sie sehen eine perfekte Stellenanzeige, die genau zu Ihren Fähigkeiten passt, aber 'fließendes Englisch' erfordert. Was denken Sie?" opts:["Genau dafür lerne ich Englisch - ich muss für solche Möglichkeiten bereit sein","Ich würde mich trotzdem bewerben und hoffen, dass sich mein Englisch bis zum Vorstellungsgespräch verbessert","Ich würde es überspringen - ich lerne Englisch nicht aus beruflichen Gründen","Ich würde mich bewerben und meine anderen Stärken hervorheben"]
wt_q41b: q:"Welche dieser Situationen ist Ihrer am nächsten?" desc:"Es gibt keine richtigen oder falschen Antworten." opts:["Ich habe bald ein konkretes Ereignis, bei dem ich Englisch brauche (Reise, Vorstellungsgespräch, Präsentation)","Ich brauche Englisch regelmäßig und möchte in den nächsten Monaten spürbare Fortschritte machen","Ich lerne langfristig Englisch - kein Stress, aber stetiger Fortschritt","Englisch macht mir Spaß - es geht mehr um persönliche Entwicklung als um einen konkreten Bedarf"]
```

**FRENCH:**

```
wt_q3b: q:"Où utilisez-vous (ou voulez-vous utiliser) l'anglais le plus?" opts:["Au travail - e-mails, réunions, appels","En voyage - aéroports, hôtels, restaurants","En ligne - réseaux sociaux, forums, jeux","Avec des amis/famille anglophones","Consommer du contenu - films, livres, podcasts","Dans mon domaine professionnel (médecine, droit, IT, etc.)"]
wt_q5b: q:"Imaginez : votre patron vient de vous dire que dans 3 semaines, vous devrez diriger une réunion en anglais avec des clients internationaux. Comment réagissez-vous?" opts:["Je paniquerais d'abord, puis je me préparerais intensivement chaque jour","Je serais nerveux/se mais demanderais de l'aide à un collègue et pratiquerais les phrases clés","Je demanderais de reporter ou de laisser quelqu'un d'autre s'en charger","Je me sentirais assez confiant(e) - je réviserais juste du vocabulaire avant"]
wt_q13b: q:"Pensez à la dernière fois que vous avez essayé d'apprendre quelque chose de nouveau (pas l'anglais). Que s'est-il passé?" opts:["J'ai persévéré et suis devenu(e) plutôt bon(ne)","J'ai pratiqué pendant un moment mais suis passé(e) à autre chose","J'ai commencé avec enthousiasme mais perdu la motivation après quelques semaines","Je suis encore en train de l'apprendre - je n'ai pas abandonné"]
wt_q17b: q:"Vous voyez une offre d'emploi parfaite qui correspond à vos compétences, mais exige un 'anglais courant.' Que pensez-vous?" opts:["C'est exactement pourquoi j'apprends l'anglais - je dois être prêt(e) pour de telles opportunités","Je postulerais quand même en espérant que mon anglais s'améliore d'ici l'entretien","Je passerais - je n'apprends pas l'anglais pour des raisons professionnelles","Je postulerais et mettrais en avant mes autres forces"]
wt_q41b: q:"Laquelle de ces situations est la plus proche de la vôtre?" desc:"Il n'y a pas de bonnes ou mauvaises réponses." opts:["J'ai un événement spécifique bientôt où j'ai besoin d'anglais (voyage, entretien, présentation)","J'ai besoin d'anglais régulièrement et je veux m'améliorer notablement dans les prochains mois","J'apprends l'anglais sur le long terme - pas de précipitation, mais un progrès régulier","L'anglais est quelque chose que j'aime apprendre - c'est plus pour le développement personnel qu'un besoin spécifique"]
```

**Pozostale 21 jezykow** beda tlumaczone analogicznie, zachowujac:

- Ten sam ton (naturalny, nieformalny)
- Ten sam format (question + options + opcjonalnie description)
- Formalne/nieformalne formy odpowiednie dla danego jezyka (np. Sie w niemieckim, Вы w rosyjskim)

**UWAGA IMPLEMENTACYJNA:** Ze wzgledu na 776-liniowy plik i 125 nowych wpisow, implementacja powinna:

1. Dodac 5 kluczy po `'wt_q45'` w kazdym obiekcie jezykowym
2. Zachowac istniejacy format i styl
3. Nie ruszac istniejacych tlumaczen

**Pelna lista wpisow per jezyk (do implementacji):**

Kazdy z 25 jezykow dostaje dokladnie 5 nowych kluczy. Tlumaczenia dla Portuguese, Italian, Turkish, Russian, Czech, Ukrainian, Dutch, Japanese, Korean, Chinese, Arabic, Hungarian, Romanian, Greek, Croatian, Swedish, Hindi, Vietnamese, Thai, Norwegian, Danish beda generowane w implementacji z zachowaniem kontekstu kulturowego i jezykowego kazdego jezyka.

---

## Podsumowanie


| Problem               | Zlozonosc             | Pliki                    | Sesje implementacji |
| --------------------- | --------------------- | ------------------------ | ------------------- |
| 1. Kalendarz (Faza 1) | Duza                  | ~30 nowych + 3 edytowane | 3-4 sesje           |
| 2. Tlumaczenia        | Srednia (mechaniczna) | 1 plik (125 wpisow)      | 1-2 sesje           |


**Rekomendacja kolejnosci:**

1. Najpierw Problem 2 (tlumaczenia) - szybki, nie wplywa na architekture
2. Potem Problem 1 Faza 1 - krok po kroku wedlug tabeli implementacji