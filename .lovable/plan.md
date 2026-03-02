## Cel

Naprawić i dopiąć moduł **/calendar + /book** tak, żeby:

- powiadomienia (UI + email) były kompletne i spójne,
- strefy czasowe działały poprawnie (student widzi swój czas),
- reschedule „requires confirmation” nie powodował podwójnych rezerwacji,
- dropdown studentów w modalach działał (klik + pisanie),
- logi były kompletne (slot + student + kontekst),
- /book był wygodny (email raz na 7 dni, poprawne Book weekly, poprawne godziny).

Poniżej plan wdrożenia w kolejności minimalizującej ryzyko popsucia działającej aplikacji.

---

## 0) Najpierw: krótkie rozpoznanie w kodzie (już zrobione — wnioski)

1. **Brak imienia studenta na slocie po rezerwacji z /book** wynika z tego, że przy bookingu nowego studenta (nieistniejącego w tabeli `students`) zapisujemy `student_id = null`, więc UI na /calendar nie ma czego mapować (`studentMap[student_id]`).  
2. **Combobox studentów jest popsuty** przez kombinację:
  - `onOpenAutoFocus={e => e.preventDefault()}` na `PopoverContent` → input nie dostaje focusu (nie da się pisać),
  - `onPointerDown={e => e.preventDefault()}` na `CommandItem` → potrafi blokować klik (w zależności od przeglądarki/urządzenia).
3. **Reschedule (requires confirmation) robi podwójne lekcje**, bo edge function `get-student-bookings` w trybie wymagającym potwierdzenia:
  - tworzy nowy slot jako pending,
  - **nie aktualizuje starego slota** w sposób jednoznaczny i bezpieczny (brak „transferu”/„locka” starego slota).
4. **Book weekly liczy tylko 1**, bo /book ładuje sloty tylko dla 1 tygodnia (`fetchSlots` w `usePublicBooking`), więc logika `recurringInfo` nie widzi przyszłych tygodni.  
5. **Logi są niekompletne**, bo część insertów do `calendar_slot_logs` wrzuca `details: {}` (np. `deleteSlot`, `hardDeleteSlot`, `confirmed` bez kontekstu) i edge function loguje tylko email.

---

## 1) Email notifications — kompletne typy + kiedy wysyłamy + linki

### 1.1. Ustalamy standard typów eventów (konkretna lista)

Wysyłamy email dla tych sytuacji (minimum, które wskazałeś):
**A) Booking:**

- Student → *booking_pending* (już jest)
- Student → *booking_confirmation* (już jest, ale brak case przy potwierdzaniu przez nauczyciela)
- Student → **booking_rejected** (NOWE)
- Teacher → *new_booking_teacher* (już jest)
**B) Cancellation:**
- Teacher → *cancellation_teacher* (już jest w email function, ale nie jest wywoływane konsekwentnie)
- Student → *cancellation_student* (już jest)
- Student → **cancellation_confirmed_by_student** (NOWE, opcjonalne ale polecam; potwierdza, że cancel „zaskoczył”)
**C) Reschedule:**
- Student → *reschedule_pending* (już jest)
- Student → *reschedule_confirmation* (już jest)
- Student → **reschedule_rejected** (NOWE)
- Teacher → *reschedule_request_teacher* (już jest)
- Teacher → **reschedule_confirmed_teacher** (NOWE, opcjonalne ale polecam jako audyt)

Wszystkie email’e mają:

- button: Teacher → `/calendar`, Student → `/book/...`
- From: Teacher: `EDOQOO`, Student: `[Teacher Name] via EDOQOO`
- Reply-To: w mailach do studenta zawsze teacherEmail.

### 1.2. Gdzie dokładnie wysyłamy email (żeby było deterministycznie)

- **Student booking z /book/:token:** zostaje w `usePublicBooking.bookSlot()` (już jest)  
→ dopinamy brakujące typy: gdy booking auto-confirm vs pending.
- **Teacher confirm/reject booking:** w `SlotDetailModal.handleConfirm()` i `handleReject()`  
→ tam dopinamy:
  - update slot,
  - oznaczenie notyfikacji `is_resolved=true`,
  - wywołanie `send-calendar-notification-email` do studenta:
    - confirm → `booking_confirmation`
    - reject → `booking_rejected`
- **Student cancel/reschedule:** w edge function `get-student-bookings`  
→ dopinamy wywołania email:
  - cancel → teacher `cancellation_teacher` + student `cancellation_confirmed_by_student`
  - reschedule (auto) → student `reschedule_confirmation` + teacher (opcjonalnie)
  - reschedule (pending) → student `reschedule_pending` + teacher `reschedule_request_teacher`
- **Teacher cancellations w /calendar:** w `SlotDetailModal.handleTeacherCancellation()`  
→ wysyłamy student `cancellation_student` + (opcjonalnie) teacher confirmation

**Pliki do zmiany:**

- `supabase/functions/send-calendar-notification-email/index.ts` (dodać nowe case’y typów + jednolity HTML)
- `src/hooks/usePublicBooking.tsx` (wypełnić brakujące parametry/typy)
- `src/components/calendar/SlotDetailModal.tsx` (confirm/reject/cancellation → email + resolve)
- `supabase/functions/get-student-bookings/index.ts` (cancel/reschedule → email + resolve)

---

## 2) Timezone — pełny, poprawny i „kompleksowy” plan (Dual display)

Wybrałeś wariant: **Dual timezone display**.

### 2.1. Założenie architektoniczne (żeby nie rozwalić bazy)

Nie migrujemy teraz bazy na UTC-timestamp. Zostajemy przy:

- `slot_date` (date) + `start_time/end_time` (time)
- `calendar_settings.timezone` jako timezone nauczyciela (źródło prawdy)
- student timezone bierzemy z przeglądarki (`Intl.DateTimeFormat().resolvedOptions().timeZone`)

### 2.2. Nowy util do konwersji (jeden punkt prawdy)

Dodajemy mały moduł utils (np. `src/utils/timezoneUtils.ts`) z funkcjami:

- `getStudentTimeZone(): string`
- `toStudentLocalTimeRange(slot_date, start_time, end_time, teacherTz, studentTz)` → zwraca:
  - `studentStartHHMM`, `studentEndHHMM`
  - `teacherStartHHMM`, `teacherEndHHMM` (oryginał)
- `toUtcInstant(slot_date, start_time, teacherTz)` (do obliczeń cancellation window)

Żeby to było niezawodne (DST), w implementacji **dodamy bibliotekę `date-fns-tz**` (minimalna i standardowa do tego problemu).  
To jest jedyna „większa” zależność, ale jest uzasadniona: własne ręczne liczenie offsetów dla DST jest proszeniem się o bugi.

### 2.3. Zmiany w UI /book

- W gridzie slotów i w Confirm dialogu pokazujemy:
  - duży tekst: **student local time** (np. `14:00–15:00`)
  - mały dopisek: `Teacher time: 20:00–21:00 (Europe/Warsaw)`
- Dodatkowo w headerze /book: `Times shown in: <StudentTZ> (your time)`

### 2.4. Zmiany w logice cancellation hours (żeby nie było „o 1h”)

`get-student-bookings` przy sprawdzaniu `min_cancellation_hours` musi liczyć różnicę względem **prawdziwego instant**:

- zbudować datetime z `slot_date+start_time` w `teacherTz`,
- przeliczyć na UTC,
- porównać z `Date.now()`.

**Pliki do zmiany:**

- `src/pages/PublicBookingPage.tsx` (render czasu)
- `src/components/calendar/StudentBookingsSection.tsx` (render czasu już ma range — dopinamy dual display)
- `supabase/functions/get-student-bookings/index.ts` (cancellation check w teacher timezone)
- `src/utils/timezoneUtils.ts` (NOWY)

---

## 3) Realtime + weryfikacja dostępności (booking i reschedule)

Realtime w hookach już jest. Tu dopinamy 2 krytyczne elementy:

### 3.1. Reschedule też musi mieć „availability check”

W `/book` reschedule teraz wywołuje `get-student-bookings` i próbuje update’ować `newSlotId` z `.eq('status','available')`.  
To jest dobre, ale musimy jeszcze:

- jeśli update nie zmienił żadnego wiersza → zwracamy jasny błąd „Slot no longer available” (teraz jest silent).  
Czyli edge function ma zwracać `success=false` gdy `update` nie zrobił update’u.

### 3.2. Eliminacja double-bookingu przy reschedule (requires confirmation) — nowy, jednoznaczny model

Tu potrzebujemy jawnego „łącza” między starym i nowym slotem. Bez tego zawsze będą edge-case’y.

**Minimalna zmiana schematu (bez przebudowy):**
Dodajemy kolumny do `calendar_slots`:

- `reschedule_request_from_slot_id uuid null` (na nowym pending slocie)
- `reschedule_request_to_slot_id uuid null` (na starym slocie, jeśli stary był confirmed)

**Reguły:**

- Jeśli student reschedule i **stary slot był pending** (confirmed_at null):  
→ stary slot natychmiast wraca do `available` (bo student „zmienił prośbę”), a jego powiadomienie `booking_pending` oznaczamy `is_resolved=true`.  
→ nowy slot staje się pending i ma `reschedule_request_from_slot_id=oldSlotId`.
- Jeśli student reschedule i **stary slot był confirmed**:  
→ stary slot zostaje `booked`, ale ustawiamy `reschedule_request_to_slot_id=newSlotId` (UI pokaże „CR”),  
→ nowy slot jest pending i ma `reschedule_request_from_slot_id=oldSlotId`.  
→ dopiero nauczyciel confirmation przenosi booking.

**Teacher CONFIRM na nowym slocie z `reschedule_request_from_slot_id`:**

- nowy slot: `confirmed_at=now()`, czyścimy `reschedule_request_from_slot_id`
- stary slot: wraca do `available`, czyścimy `reschedule_request_to_slot_id`, czyścimy booking fields (student_id, booked_at/by, confirmed_at, student_notes itd.)
- powiadomienia: `reschedule_request` i `booking_pending` związane z tym flow → `is_resolved=true`
- email: `reschedule_confirmation` do studenta

**Teacher REJECT na nowym slocie (reschedule pending):**

- nowy slot: wraca do `available`, czyścimy `reschedule_request_from_slot_id`
- stary slot:
  - jeśli miał `reschedule_request_to_slot_id` → czyścimy to
  - pozostaje booked (jeśli był confirmed) lub available (jeśli był pending i już został zwolniony wg reguły)
- email: `reschedule_rejected` do studenta
- notifications → resolved

**Gdzie implementujemy logikę confirm/reject reschedule?**
Żeby nie robić 2 update’ów z frontu i nie ryzykować połowicznego stanu:  
→ dodajemy nową edge function (np. `calendar-handle-reschedule-decision`) z `verify_jwt=true` i service-role w środku, która robi oba update’y i resolve notifications w jednym przebiegu.

**Pliki do zmiany / dodania:**

- migracja SQL: dodać 2 kolumny do `calendar_slots`
- `supabase/functions/get-student-bookings/index.ts` (tworzenie requestu reschedule wg reguł + lepsza treść powiadomień)
- `supabase/functions/calendar-handle-reschedule-decision/index.ts` (NOWA)
- `src/components/calendar/SlotDetailModal.tsx` (Confirm/Reject: jeśli slot ma `reschedule_request_from_slot_id` → invoke edge function zamiast prostego onUpdate)

---

## 4) Dropdown studentów w modalach — fix bez zgadywania

To jest krytyczny UX bug, więc robimy to „na twardo”, deterministycznie:

### 4.1. Popover/CommandInput focus

- Usuwamy `onOpenAutoFocus={e => e.preventDefault()}` z PopoverContent (bo to blokuje możliwość pisania).
- Dodajemy `autoFocus` do `CommandInput`.
- Usuwamy `onPointerDown={e => e.preventDefault()}` z `CommandItem` (żeby klik działał normalnie).

Jeśli pojawi się pierwotny problem, dla którego to było dodane (np. zamykanie modala, focus trap):

- zamiast `preventDefault` użyjemy `onOpenAutoFocus={(e)=>{/* allow */}}` i ewentualnie `CommandInput` ref + ręczne focus, ale dopiero gdy faktycznie wróci błąd.

**Pliki do zmiany:**

- `src/components/calendar/SlotDetailModal.tsx`
- `src/components/calendar/UnifiedSlotModal.tsx`

---

## 5) Calendar Notifications — „done”, lepszy tekst, mniej duplikacji

### 5.1. Oznaczanie jako done (is_resolved)

Dodajemy funkcję pomocniczą (front lub edge) do resolve:

- booking: `booking_pending` → resolved po Confirm/Reject
- reschedule: `reschedule_request` → resolved po Confirm/Reject
- „stary” pending slot w scenariuszu A → resolved automatycznie przy reschedule

Implementacja:

- w `SlotDetailModal` po wykonaniu akcji: update `calendar_notifications` where `slot_id = slot.id` i `notification_type in (...)`
- w edge function przy reschedule: resolve stare i nowe powiadomienia

### 5.2. Treść powiadomień reschedule (From + To, bez dubli email)

Zmiana w `get-student-bookings`:

- `student_name` ma być imieniem (jeśli umiemy znaleźć), a email idzie do `metadata.student_email`.
- message: `"{StudentName} requests to reschedule: {oldDate} {oldTime} → {newDate} {newTime}"`
- UI w bell pokazuje:
  - `Student: {student_name}`
  - poniżej (mniejszym): `Email: {metadata.student_email}`

### 5.3. Brak imienia na slocie po booking_pending (problem z /calendar widok)

W `usePublicBooking.bookSlot` ustawiamy `title` zawsze:

- `title = "${resolvedName} — English lesson"`  
Dzięki temu /calendar pokaże tytuł nawet bez `student_id`.  
Dodatkowo w Teacher Confirm/Reject logach i emailach mamy name.

**Pliki do zmiany:**

- `src/hooks/usePublicBooking.tsx` (ustawianie `title`)
- `src/components/calendar/CalendarNotificationBell.tsx` (render: imię vs email)
- `supabase/functions/get-student-bookings/index.ts` (message + metadata + resolve)

---

## 6) /calendar/logs i historia slota — kompletność logów

### 6.1. Standard `details` dla logAction (jeden format)

Wprowadzamy zasadę: każdy log ma mieć przynajmniej:

- `slot_date`, `start_time`, `end_time`
- `student_id` (jeśli był)
- `student_name` (jeśli umiemy)
- `student_email` (jeśli umiemy)
- `old_status`, `new_status` (gdy zmiana statusu)
- `source` (np. `calendar_ui`, `public_booking`, `edge_reschedule`)

### 6.2. Gdzie dopisać brakujące `details`

- `useCalendarSlots.tsx`:
  - `deleteSlot`, `hardDeleteSlot`, `updateSlot` → logi muszą dostać snapshot slota (a nie `{}`)
  - stworzyć helper `buildSlotLogDetails(slot, extra)` i zawsze go używać
- `SlotDetailModal.tsx`:
  - `confirmed`, `rejected`, `status_changed` → dopisać pełne details
- `get-student-bookings` edge:
  - `reschedule_requested`, `cancelled_by_student`, `rescheduled`, `booked` → dopisać `student_name` (jeśli student istnieje) i slot times

---

## 8) Deleted slots — domyślnie widoczne + restore + re-aktywacja

Wymagania:

- Deleted widoczne domyślnie, przycisk ma być „Hide Deleted”.
- slot `deleted` po przypisaniu studenta ma się aktywować.
- w modalu dla deleted: przycisk restore „Turn available”.

Plan:

1. `useCalendarSlots`: ustaw `showDeleted` domyślnie na `true`.
2. `CalendarPage`: przycisk ma pokazywać:
  - gdy showDeleted true → „Hide Deleted”
  - gdy false → „Show Deleted”
3. `SlotDetailModal`:
  - jeśli `slot.status==='deleted'`: pokaż przycisk **Restore (Turn available)**:
    - update `{ status:'available' }` (nie kasujemy historii cancel, jeśli istnieje)
    - log action `restored`
  - jeśli user przypisze studentId i zapisze → status i tak przejdzie na booked (już istnieje), dopisać log `reactivated_from_deleted`

---

## 9) Reschedule (requires confirmation) — naprawa dwóch scenariuszy A/B + notyfikacje

To jest krytyczne i jest w 3.2, ale tu mapuję dokładnie do Twoich punktów:

### 9A (pending → reschedule zanim teacher potwierdzi)

- Stary slot (pending) → natychmiast `available` (czyścimy booking fields)
- Nowy slot → pending
- Notification dla starego slota `booking_pending` → `is_resolved=true`
- Nie może istnieć „pending” na dwóch slotach dla jednego studenta jednocześnie.

### 9B (confirmed → reschedule request)

- Stary slot → dalej booked, ale UI pokazuje „CR” (na podstawie `reschedule_request_to_slot_id`)
- Nowy slot → pending (reschedule_request_from_slot_id)
- Po teacher confirm:
  - stary slot → available
  - nowy slot → booked+confirmed

### 9C treść notification: From + To

Zmieniamy w edge function (jak w 5.2).

### 9D email w 2 miejscach

Zmieniamy UI `CalendarNotificationBell`: student line = name, email w drugiej linii (metadata).

---

## 10) /book UX + zakres godzin + email zapamiętany 7 dni

Masz dwa elementy: poprawa /book/:token i nowa /book.

### 10.1. /book/:token (obecny public link nauczyciela) — flow „email first”

- Dodajemy etap startowy: jeśli brak ważnego emaila w localStorage → pokaż tylko prosty ekran z polem email.
- Po wpisaniu email:
  - zapis do localStorage z TTL 7 dni (np. `{email, expiresAt, token}`),
  - automatycznie ładujemy „Twoje lekcje” (invoke `get-student-bookings`) i pokazujemy je bez sekcji „Already have a booking?”
  - booking dialog nie pyta już o email (bierze z zapisanego), a name:
    - jeśli student istnieje w `students` → auto-fill name
    - jeśli nie istnieje → prosimy o name raz (i też zapisujemy na 7 dni)

### 10.2. /book (bez tokenu) — „teacher list selector” (Twoja decyzja)

Dodajemy nową stronę `/book`:

- Student wpisuje email → zapis na 7 dni
- Front wywołuje edge function `find-teachers-by-student-email` (NOWA, verify_jwt=false):
  - zwraca listę nauczycieli (teacherName) + ich `public_calendar_token`
- Student wybiera nauczyciela z listy → przejście do `/book/:token`
- Dla wygody zapisujemy „lastTeacherToken” per email na 7 dni.

**Pliki do zmiany/dodania:**

- `src/App.tsx` (Route `/book` → nowa strona)
- `src/pages/BookLandingPage.tsx` (NOWY)
- `supabase/functions/find-teachers-by-student-email/index.ts` (NOWY)
- `src/pages/PublicBookingPage.tsx` (email-first + TTL + range everywhere)

---

## 11) Book weekly — naprawa liczenia i faktycznego bookingu wielu tygodni

Root cause: mamy tylko sloty z bieżącego tygodnia w `slots`.

Plan:

- Po wybraniu `untilDate` robimy dodatkowe zapytanie do Supabase:
  - zakres: od `selectedSlot.slot_date` do `untilDate`
  - filtr: teacher_id, slot_type != block, status=available, ten sam weekday i ta sama godzina start
- Dopiero na podstawie tego setu budujemy listę `slotIds` do masowego bookingu.
- UI w confirm pokazuje realny count.
- W book loop:
  - iterujemy po slotIds,
  - jeśli część się nie uda (bo ktoś zabrał) → pokazujemy wynik: `Booked X/Y lessons` i wyświetlamy listę dat, które się nie udały.

**Pliki:**

- `src/pages/PublicBookingPage.tsx` (recurringInfo ma używać query, nie tylko `slots` z tygodnia)
- ewentualnie `src/hooks/usePublicBooking.tsx` (helper `fetchRecurringAvailableSlots(...)`)

---

## 12) Overlap dwóch available slotów — naprawa „nadpisywania”

Najbardziej prawdopodobna przyczyna w tym kodzie: w `UnifiedSlotModal` replaceable sloty są usuwane przez `onDeleteSlot`, które aktualnie jest podpięte do **soft delete** (`deleteSlot`), więc stare sloty mogą dalej istnieć jako `deleted` albo nie zostać usunięte jak trzeba (i potem widać „dwa”).

Plan:

1. Zmieniamy mechanikę „replaceable”:
  - jeśli slot replaceable **nigdy nie był bookingiem** (np. `cancelled_at IS NULL` i status available) → robimy HARD DELETE,
  - jeżeli miał historię → soft delete (jak w Twojej regule).
2. Dodatkowo dopinamy w `useCalendarSlots.createSlot()` i `createSlotsBatch()` logikę:
  - gdy `existing` to available slot bez historii → hard delete
  - nie opieramy się na `UnifiedSlotModal` jako jedynym miejscu kontroli.

**Pliki:**

- `src/components/calendar/UnifiedSlotModal.tsx` (replaceable deletions → hard vs soft)
- `src/hooks/useCalendarSlots.tsx` (usunąć duplikację logiki i zrobić helper `deleteReplaceableSlots(...)`)

---

## 13) Cancellation zgodnie z calendar settings (min_cancellation_hours)

- Po wdrożeniu timezone (sekcja 2.4) edge function będzie liczyć cancellation ok.
- Dodatkowo dopinamy: jeśli slot jest pending → zawsze można cancel (to już jest).

**Plik:**

- `supabase/functions/get-student-bookings/index.ts`

---

## Kolejność wdrożenia (żeby minimalizować ryzyko)  
Zaimlpementuj od razu całość zgodnie z planem 

1. **Fix combobox** (żeby dało się testować resztę UX)  
2. **Imię na slocie po /book** (`title` podczas bookingu)  
3. **Reschedule requires confirmation: schema + edge + teacher confirm/reject flow** (krytyczne spójności)  
4. **Notifications done (is_resolved) + lepsze treści (From→To)**  
5. **Book weekly: fetch full range**  
6. **/book UX**: email-first na /book/:token + nowy /book (teacher selector)  
7. **Timezone dual display + poprawa cancellation window**  
8. **Log completeness** (ułatwia utrzymanie, ale nie blokuje krytycznych przepływów)  
9. **Deleted default visible + restore**

---

## Test plan (E2E — konkretne scenariusze)

1. /book/:token:
  - booking pending → teacher confirm → student dostaje confirmation email + notification done + slot pokazuje imię
  - booking pending → teacher reject → student dostaje rejected email + notification done + slot available
2. Reschedule requires confirmation:
  - A) pending → reschedule → stary slot available, nowy pending, brak podwójnych
  - B) confirmed → reschedule request → stary slot booked + CR, nowy pending → teacher confirm → stary available, nowy confirmed
  - reject reschedule → nowy available, stary wraca do normalnego stanu, notification done
3. Book weekly:
  - zaznacz 3 poniedziałki w przyszłości → UI pokazuje 3 i bookuje 3
4. Timezone:
  - porównaj wyświetlane czasy (student local vs teacher) na /book
5. Dropdown studentów:
  - w SlotDetailModal i UnifiedSlotModal: można pisać i wybierać kliknięciem

---

## Pytania (już rozstrzygnięte)

- /book bez tokenu: **Teacher list selector** (wdrażamy)
- Timezone UX: **Dual timezone display** (wdrażamy)