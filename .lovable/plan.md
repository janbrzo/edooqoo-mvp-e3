
# Plan: 4 naprawy — automatyczny stały meeting link per student, prawdziwy Reject comment, freeze po Confirm/Reject, domyślny układ Lessons jak po Today

## Najważniejsza decyzja
Tu problemem nie jest pojedynczy bug, tylko konflikt modeli. Obecnie aplikacja nadal miesza:
- stały link per student
- link generowany per lesson przez GCal
- fallbacki z kilku miejsc

To właśnie rozwala przewidywalność. Jeśli chcesz prostoty dla ucznia, system musi mieć jedną twardą regułę:

```text
1 student = 1 permanent meeting room link
```

I ta reguła musi być ważniejsza niż auto-generated per-lesson Meet link.

---

## 1. Meeting: automatycznie tworzony jeden stały link per student

### Co jest dziś źle
Masz rację: obecna implementacja nie spełnia założenia.
Kod nadal ma włączoną opcję `auto_create_meet_link`, która w `gcal-sync` generuje link per event i zapisuje go do `calendar_slots.meeting_link`.
To powoduje dwa skutki uboczne:
- student bez ręcznie wpisanego linku nie dostaje automatycznie stałego pokoju
- nowe lekcje dalej potrafią dostać inny link niż stary student link

### Finalne zachowanie
Wprowadzamy jeden docelowy model:

```text
Permanent student meeting link = canonical source
calendar_student_settings.default_meeting_link
```

Dla każdego studenta:
- link tworzy się automatycznie po włączeniu tej opcji dla nauczyciela
- link tworzy się automatycznie przy dodaniu nowego studenta, jeśli opcja jest już włączona
- wszystkie nowe lesson slots tego studenta dostają dokładnie ten sam link
- wszystkie przyszłe istniejące slots tego studenta są synchronizowane do tego samego linku
- GCal nie może już nadpisywać tego linku innym per-event meet linkiem

### Jak to wdrożyć
#### A. `calendar_settings`
Dodać lub wykorzystać osobny toggle dla tego modelu, zamiast używać obecnego `auto_create_meet_link` w jego obecnym znaczeniu.
Najbezpieczniej:
- zostawić stary `auto_create_meet_link` dla kompatybilności
- dodać nową logikę UI i kodu opisującą ją jako:
  - `Auto-create permanent student meeting links`

Jeśli nie chcesz nowej kolumny, można przepiąć znaczenie obecnego toggle, ale to jest bardziej ryzykowne, bo dziś ten toggle steruje `gcal-sync` dla per-event Meet. Bezpieczniejszy plan:
- nowa kolumna boolean w `calendar_settings`, np. `auto_create_student_meeting_link`
- nie ruszać starego toggle biznesowo, tylko go wygasić w UI albo opisać jako legacy
- nowy toggle steruje wyłącznie stałym linkiem per student

#### B. Generowanie linku
Nie generujemy prawdziwego Google Meet room przez event-per-slot, bo to z definicji tworzy różne linki.
Są tylko dwa sensowne warianty:
1. generować Edooqoo permanent room URL
2. generować link z własnego wzorca konfiguracyjnego

Ponieważ w aplikacji nie ma własnego systemu video room backendowego, najbezpieczniejszy kompatybilny plan to:
- generować **deterministyczny permanent meeting URL** w domenie Edooqoo lub neutralny permanent room path, np. oparty o teacherId + studentId + sekret/hash
- ten URL jest stały dla pary teacher-student
- zapisujemy go do `calendar_student_settings.default_meeting_link`

To rozwiązuje dokładnie Twój problem: zawsze ten sam link.

#### C. Miejsca, które muszą tworzyć link automatycznie
1. **Po włączeniu opcji w Calendar Settings**
   - batch dla wszystkich istniejących studentów bez linku
   - nie ruszać studentów, którzy już mają ręczny link
2. **Przy dodaniu nowego studenta**
   - `useStudents.addStudent`
   - po insert studenta sprawdzić settings nauczyciela
   - jeśli auto-opcja włączona, utworzyć rekord `calendar_student_settings`
3. **Przy ręcznym usunięciu pustego linku przez nauczyciela**
   - jeśli auto-opcja jest on, system powinien odtworzyć link albo nie pozwalać zostawić pustego pola bez świadomego wyboru
   - najbezpieczniej: zostawić możliwość manual override, ale przy pustym polu pokazać “Generate permanent link”

#### D. Propagacja do slotów
Po wygenerowaniu lub zmianie student linku:
- update wszystkich przyszłych slotów ucznia:
  - `teacher_id = teacher`
  - `student_id = student`
  - `slot_date >= today`
  - status nie w `completed`, `deleted`
- ustawić `meeting_link = default_meeting_link`

#### E. Tworzenie nowych slotów
W `useCalendarSlots.tsx`:
- `createSlot()` już próbuje pobierać link per-student
- `createSlotsBatch()` obecnie **nie kopiuje** meeting linku dla studentów
- trzeba to naprawić, bo to jest jedna z przyczyn „stare miały jeden link, nowe inny albo pusty”

Plan:
- przed budową `rows` zebrać unique `student_id`
- pobrać ich `default_meeting_link`
- podczas mapowania rows ustawić `meeting_link` dla każdego lesson row z uczniem

#### F. GCal sync
To jest krytyczne: obecnie `gcal-sync/index.ts` zapisuje `hangoutLink` do `calendar_slots.meeting_link`.
To łamie model „1 student = 1 link”.

Trzeba zmienić regułę:
- jeśli student ma `calendar_student_settings.default_meeting_link`, to **nie nadpisujemy** `calendar_slots.meeting_link` linkiem z Google
- opcja auto-create per-event Meet nie może wygrywać z permanent student link
- najlepiej:
  - gdy istnieje permanent student link: nie twórz `conferenceData` dla tego eventu
  - albo twórz event bez nadpisywania slot linku
- docelowo student-facing UI ma zawsze brać permanent link per student

#### G. UI / copy
`CalendarSettingsPage.tsx` dziś komunikuje złą logikę:
- mówi, że auto-create robi unikatowy link dla każdej booked lesson
- to jest dokładnie odwrotność Twojego celu

Nowy wording:
- “Automatically create one permanent meeting link per student”
- “All lessons for that student will use the same room”
- “This permanent link is reused across all dates and times”

### Pliki do zmiany
- `src/pages/CalendarSettingsPage.tsx`
- `src/hooks/useStudents.tsx`
- `src/pages/StudentPage.tsx`
- `src/hooks/useCalendarSlots.tsx`
- `src/hooks/usePublicBooking.tsx`
- `src/pages/StudentHubDashboard.tsx`
- `supabase/functions/get-student-bookings/index.ts`
- `supabase/functions/get-student-hub-data/index.ts`
- `supabase/functions/gcal-sync/index.ts`
- migracja SQL dla nowego toggle / ewentualnej helper function

---

## 2. Reject comment nadal nie działa realnie

### Co znalazłem
UI ma już state:
- `showRejectDialog`
- `rejectComment`

i renderuje dialog Reject na dole `SlotDetailModal.tsx`.

Ale dialog jest zrobiony połowicznie:
- używa zwykłego `<p>` zamiast `DialogDescription`, więc stąd warningi
- zamyka dialog **przed** wykonaniem `handleReject()`
- flow błędu jest niestabilny
- wygląda na to, że user experience sprawia wrażenie „braku komentarza”, bo dialog nie jest domknięty poprawnie i akcja się sypie

### Finalne zachowanie
- kliknięcie Reject otwiera modal
- nauczyciel wpisuje optional comment
- dopiero kliknięcie finalnego Reject wykonuje akcję
- komentarz trafia do emaila `booking_rejected`
- modal nie zamyka się przy błędzie

### Konkretna poprawka
#### A. W JSX dialogu
Zamienić opis z:
- zwykły `<p>`
na:
- `DialogDescription`

#### B. Akcja przycisku
Zamiast:
- `setShowRejectDialog(false); handleReject();`

ma być:
- `handleReject()` steruje zamknięciem dopiero po sukcesie

#### C. W `handleReject()`
- przy sukcesie:
  - wyślij mail z `rejectionReason`
  - resolve notifications
  - dopiero wtedy zamknij reject dialog i główny modal
- przy błędzie:
  - nie zamykaj niczego
  - zostaw komentarz w polu
  - pokaż toast

### Pliki
- `src/components/calendar/SlotDetailModal.tsx`
- `supabase/functions/send-calendar-notification-email/index.ts`

---

## 3. Confirm/Reject zawiesza calendar — root cause i bezpieczna naprawa

### Root cause
Tu nie chodzi o sam warning accessibility. Prawdziwy problem to batch branch.

W logach masz:
```text
PATCH /calendar_slots?id=in.(...)
400 Bad Request
```

To znaczy, że `onUpdate()` wykonuje batch `.in('id', ids)` i dostaje zły payload albo złą kombinację pól dla tych slotów.
Z `CalendarPage.tsx` wynika, że `SlotDetailModal` korzysta z `onUpdate={updateSlot}` z `useCalendarSlots`.
To oznacza, że modal przekazuje **pojedynczy `slotId`**, ale gdzieś w środku batch flow dochodzi do aktualizacji wielu rekordów lub do przepływu z błędną walidacją `slot_ids`.

### Najbardziej prawdopodobna przyczyna
`getValidBatchSlotIds()` opiera się na `calendar_notifications.metadata.slot_ids`.
Jeśli metadata są stare, uszkodzone albo zawierają sloty, których nie powinno się ruszać razem, modal nadal wchodzi w batch flow.
Potem:
- część slotów update się nie udaje
- kod mimo błędu nadal częściowo idzie dalej lub pozostawia UI w rozjechanym stanie
- kalendarz wygląda na “zawieszony”

### Finalna naprawa
#### A. Twarda walidacja batch
`getValidBatchSlotIds()` powinno walidować nie tylko:
- array
- strings
- contains current slot
- length > 1

ale też:
- wszystkie sloty istnieją
- wszystkie sloty należą do tego samego `teacher_id`
- wszystkie sloty mają status `booked`
- wszystkie sloty są pending (`confirmed_at is null`)
- wszystkie sloty mają tego samego `student_id` lub tego samego `student_notes` email
- wszystkie są z tego samego notification batch context

Jeśli nie:
- fallback do single-slot action

#### B. Helper do batch update
Wydzielić helper w `SlotDetailModal`:
- pobiera i waliduje sloty batch
- aktualizuje je sekwencyjnie
- zatrzymuje cały flow na pierwszym błędzie
- zwraca sukces tylko gdy całość się udała

#### C. Early return bez side effects
Na błędzie:
- bez log insert
- bez resolve notifications
- bez `onOpenChange(false)`
- bez reset dialog state

#### D. Confirm dialog też ma ten sam problem
To samo trzeba zrobić dla Confirm, nie tylko Reject.

#### E. Accessibility warnings
Każdy `DialogContent` w tych confirm/reject dialogach ma dostać prawidłowe `DialogDescription`.
To nie naprawia 400, ale usuwa szum i poprawia stabilność renderu.

### Pliki
- `src/components/calendar/SlotDetailModal.tsx`
- opcjonalnie `src/hooks/useCalendarSlots.tsx` jeśli `updateSlot` wymaga dodatkowego guardu

---

## 4. Lessons page: domyślnie ma wyglądać jak po kliknięciu Today

### Co jest dziś źle
`StudentBookingsSection.tsx` buduje `allBookings` i na końcu sortuje je desc:
- najnowsza / najdalsza przyszłość lub ostatnie wpisy są na górze
- dopiero przycisk Today przewija do sensownego miejsca

Ty chcesz, żeby bez kliknięcia Today użytkownik od razu widział najbliższą lekcję.

### Najbezpieczniejsze rozwiązanie
Nie zmieniamy globalnie źródła danych ani widoków month/range.
Zmieniamy tylko sposób budowy listy dla schedule view:

```text
[upcoming + today] rosnąco
[past] malejąco
```

Czyli:
- najbliższa nadchodząca lekcja na górze
- przeszłość pod spodem
- Today dalej działa, ale praktycznie staje się tylko szybkim skrótem, bo domyślny widok już jest poprawny

### Dlaczego to lepsze niż auto-scroll
- nie ruszamy scrolla całej strony
- nie ma skoków layoutu
- użytkownik od razu widzi najważniejsze lekcje
- month/range nie muszą się zmieniać

### Konkretna zmiana
W `StudentBookingsSection.tsx`:
- zostawić obecne pobieranie danych
- zamiast jednego desc sort dla `allBookings`
  rozdzielić:
  - upcoming/today
  - past
  - cancelled jeśli włączone
- złożyć wynik w bardziej naturalnej kolejności dla schedule view

Opcjonalnie:
- jeśli viewMode !== schedule, zostawić obecne sortowanie

### Plik
- `src/components/calendar/StudentBookingsSection.tsx`

---

## Kolejność wdrożenia
1. Naprawa Reject dialog i accessibility (`DialogDescription`, zamykanie dopiero po sukcesie)
2. Utwardzenie Confirm/Reject batch flow i naprawa freeze / 400
3. Zmiana domyślnego układu listy lessons jak po Today
4. Wdrożenie właściwego modelu permanent meeting link per student:
   - settings toggle
   - auto-generation dla existing students
   - auto-generation przy add student
   - createSlotsBatch
   - blokada nadpisywania przez gcal-sync

To jest najlepsza kolejność, bo najpierw naprawia krytyczny błąd operacyjny kalendarza, a dopiero potem większą zmianę architektoniczną meetingów.

---

## Co świadomie robimy i czego nie robimy

### Robimy
- jeden automatycznie tworzony permanent link per student
- komentarz do Reject działający naprawdę
- freeze po Confirm/Reject naprawiony u źródła
- domyślny widok lessons jak po Today

### Nie robimy
- generatora różnych Meet linków per lesson
- przebudowy całego public booking flow poza tym, co konieczne
- zmian w innych modułach aplikacji poza wskazanymi ścieżkami

---

## Ważna uwaga strategiczna
Największy błąd w obecnym podejściu to próba jednoczesnego utrzymania:
- per-student stable room
- per-lesson auto-generated Google Meet

To są sprzeczne modele. Jeśli naprawdę chcesz prostoty dla ucznia, musimy konsekwentnie wybrać pierwszy model i zepchnąć drugi do roli pomocniczej albo legacy. Inaczej problem będzie wracał bez końca, bo system sam sobie generuje nowe linki i niszczy spójność.

