
# Plan: 6 napraw — stały link meeting, jedno powiadomienie recurring, komentarze Confirm/Reject, freeze po Reject, Today scroll, zapis Discount w Add Slot

## Najważniejsza decyzja architektoniczna

Przestajemy mieszać dwa modele meetingów. Finalny model ma być jeden:

- **jedyne źródło prawdy dla ucznia = `calendar_student_settings.default_meeting_link`**
- dla danego ucznia to ma być **jeden stały link**, używany wszędzie:
  - w lesson tiles
  - w Student Hub dashboard
  - w mailach
  - przy ręcznie dodanych lekcjach
  - przy recurring
  - przy confirm/reject flow
- link per-slot (`calendar_slots.meeting_link`) zostaje tylko jako **legacy/migracyjny fallback**, ale nie może już wygrywać z linkiem per-student

To jest krytyczne, bo teraz system nadal ma kilka ścieżek, które potrafią pokazać różne linki dla tego samego ucznia.

---

## 1. Meeting: jeden stały link per student, bez wyjątków

### Root cause
Obecny kod ma już tabelę per-student, ale nadal część widoków i logiki korzysta z:
- `slot.meeting_link`
- `calendar_settings.default_meeting_link`
- różnych fallbacków w różnych miejscach

To powoduje chaos i brak gwarancji „jeden uczeń = jeden pokój”.

### Docelowe zachowanie
Dla ucznia obowiązuje jedna reguła:

```text
effectiveMeetingLink =
calendar_student_settings.default_meeting_link
|| calendar_slots.meeting_link   // tylko fallback dla starych danych
|| calendar_settings.default_meeting_link // tylko fallback kompatybilności
```

Ale w nowym flow:
- **student-facing UI zawsze najpierw bierze per-student**
- przy tworzeniu lekcji dla konkretnego studenta system **kopiuje ten sam link także do slotu**, żeby stare miejsca nadal działały spójnie
- zmiana linku w profilu ucznia ma opcjonalnie/automatycznie ujednolicać przyszłe sloty tego ucznia

### Konkretne zmiany
#### A. `src/pages/StudentPage.tsx`
- zostawić `MeetingLinkField` jako główne miejsce edycji linku ucznia
- poprawić copy tak, żeby jasno komunikowało stały pokój dla tego ucznia
- gdy nauczyciel ma GCal:
  - tekst ma mówić, że to **Google Meet room link**
  - ale nadal można go ręcznie nadpisać własnym linkiem
- gdy nauczyciel nie ma GCal:
  - tekst ma mówić: paste your meeting room link (Google Meet, Zoom itd.)

#### B. `src/pages/StudentPage.tsx` / `MeetingLinkField`
Po zapisaniu linku ucznia:
- poza update `calendar_student_settings`
- wykonać także update wszystkich **przyszłych** slotów tego ucznia, które nie są `completed` / `deleted`, ustawiając im `meeting_link = nowy_link`
- dzięki temu cały kalendarz, hub i stare komponenty będą od razu spójne

To jest ważniejsze niż „ładny kod”, bo eliminuje rozjazdy danych.

#### C. `src/hooks/useCalendarSlots.tsx`
W `createSlot()`:
- już dziś jest pobieranie `calendar_student_settings.default_meeting_link`
- trzeba dopilnować, żeby ten link był realnie zapisywany jako `meeting_link` dla slotu z uczniem
- to ma działać dla ręcznego tworzenia lesson przez nauczyciela

W `createSlotsBatch()`:
- dziś batch insert **nie kopiuje** per-student meeting linku
- trzeba dodać ten sam mechanizm dla batch/series tworzonych przez nauczyciela

#### D. `src/pages/StudentHubDashboard.tsx`
Na Next Lesson:
- zmienić kolejność z:
  `nextLesson.meeting_link || defaultMeetingLink`
- na:
  `defaultMeetingLink || nextLesson.meeting_link`
  
Bo student ma zawsze widzieć swój stały pokój.

#### E. `src/pages/StudentHubLessons.tsx`
Your Classroom card:
- ma dalej używać `defaultMeetingLink` z hub data
- to jest poprawne, ale trzeba utrzymać jako główny przycisk

#### F. `src/hooks/usePublicBooking.tsx`
Przy mailach po bookingu:
- utrzymać per-student lookup
- ale uprościć regułę tak, by per-student link zawsze miał priorytet nad per-slot

#### G. `supabase/functions/get-student-hub-data/index.ts`
Już zwraca per-student link.
Trzeba tylko **nie zmieniać tej logiki w innym kierunku** i traktować ją jako oficjalne źródło dla Student Hub.

#### H. `supabase/functions/get-student-bookings/index.ts`
Przy zwracaniu bookingów dla ucznia:
- dodać fallback per-student meeting link, jeśli slot nie ma własnego linku
- dzięki temu Join Meeting będzie spójny także na liście lekcji

### Co świadomie NIE robimy
- nie budujemy teraz automatycznego generatora unikatowych Google Meet rooms per student
- nie usuwamy kolumn legacy z DB
- nie przebudowujemy całego GCal sync

To byłoby ryzykowne i niepotrzebne. Stabilna naprawa to: **jedna reguła priorytetu + propagacja do slotów**.

---

## 2. Book weekly recurring ma znowu tworzyć jedno powiadomienie i jedną akcję Confirm/Reject

### Root cause
Frontend `StudentHubLessons.tsx` robi recurring przez pętlę:
- wyszukuje sloty tydzień po tygodniu
- dla każdego wywołuje `bookSlot()`

To tworzy:
- osobne notyfikacje
- osobne maile
- brak `metadata.slot_ids`
- rozjazd względem starego działającego flow batchowego

Tymczasem w backendzie już istnieje gotowy batch flow w:
- `supabase/functions/get-student-bookings/index.ts`
- action: **`book_batch`**

Ta funkcja już:
- bookuje wiele slotów
- tworzy **jedno** `booking_pending`
- zapisuje `metadata.slot_ids`
- przygotowuje serię pod zbiorczy Confirm/Reject

### Docelowe rozwiązanie
Recurring w Student Hub przestaje robić wiele `bookSlot()`.

Nowy flow:
1. Frontend liczy listę pasujących slotów w kolejnych tygodniach
2. Zbiera ich `slotIds`
3. Wywołuje **jedną** edge function `get-student-bookings` z:
   - `action: 'book_batch'`
   - `slotIds`
   - `email`
   - `studentName`
4. Backend robi cały batch i tworzy jedno powiadomienie

### Konkretne zmiany
#### A. `src/pages/StudentHubLessons.tsx`
W `handleBook()`:
- dla single booking:
  - można zostawić obecny `bookSlot()` żeby nie ruszać stabilnego flow
- dla recurring:
  - najpierw zebrać wszystkie pasujące sloty
  - jeśli `slotIds.length > 1`, wywołać edge function `get-student-bookings` zamiast wielu `bookSlot()`
  - jeden toast podsumowujący: ile zarezerwowano / ile pominięto

Dodatkowo:
- pod datą końcową zostawić licznik preview
- ale licznik ma pokazywać **rzeczywistą liczbę znalezionych slotów**, a nie samą liczbę tygodni, jeśli chcemy pełną precyzję
- minimalna bezpieczna wersja: zostawić „up to X lessons”, ale po submit pokazać dokładny wynik z backendu

#### B. `supabase/functions/get-student-bookings/index.ts`
Batch flow już istnieje, ale trzeba go dopracować:
- dopilnować, żeby message był czytelny
- utrzymać `metadata.slot_ids`
- dopisać ewentualnie `first_slot_date`, `start_time`, `end_time`, `count` dla wygodniejszego UI i maili

### Efekt
- jedno powiadomienie
- jedno kliknięcie Confirm/Reject
- brak regresji do wielu pendingów
- zgodność z wcześniejszym działającym modelem

---

## 3. Confirm i Reject mają mieć komentarz i ten komentarz ma iść do maila

### Root cause
- jest tylko dialog Reject
- nie ma dialogu Confirm
- mail ma obsługę `rejectionReason`, ale nie ma pełnego flow dla komentarza przy Confirm
- dodatkowo dialogi nie mają `DialogDescription`, stąd warningi accessibility

### Docelowe zachowanie
Przy `Lesson Pending`:
- kliknięcie **Confirm** otwiera modal z opcjonalnym komentarzem
- kliknięcie **Reject** otwiera modal z opcjonalnym komentarzem
- komentarz trafia do maila dla ucznia
- dla batch recurring komentarz ma dotyczyć całej serii

### Konkretne zmiany
#### A. `src/components/calendar/SlotDetailModal.tsx`
Dodać:
- `showConfirmDialog`
- `confirmComment`
- osobny confirm dialog analogiczny do reject dialog
- oba dialogi z:
  - `DialogTitle`
  - `DialogDescription`
  - textarea
  - Cancel / Confirm action

#### B. `handleConfirm()`
- nie wykonywać akcji od razu z przycisku
- przycisk ma otwierać confirm dialog
- właściwe potwierdzenie dopiero po zatwierdzeniu modala
- komentarz przekazać do maila

#### C. `handleReject()`
- zostawić dialog reject, ale dopiąć go w pełni
- komentarz przekazać do maila
- dodać poprawny opis dialogu, żeby zniknęły warningi

#### D. `supabase/functions/send-calendar-notification-email/index.ts`
Rozszerzyć payload o:
- `confirmationComment`
- zachować `rejectionReason`

Dodać render komentarza:
- w `booking_confirmation`
- w `booking_rejected`

Jeżeli zatwierdzamy/odrzucamy batch recurring:
- najlepiej dodać osobne typy maili:
  - `batch_booking_confirmed`
  - `batch_booking_rejected`
- z jednym mailem podsumowującym serię i komentarzem nauczyciela

To jest lepsze niż wysyłanie maila „o jednej lekcji”, gdy nauczyciel potwierdził 6 terminów naraz.

---

## 4. Reject zawiesza calendar i blokuje otwieranie slotów

### Root cause
Tu są dwa realne problemy jednocześnie:

### Problem A — błędny batch branch
`SlotDetailModal` wykrywa batch po `metadata.slot_ids`.
Jeśli metadata są stare/uszkodzone/albo flow nie był prawidłowo batchowy, modal może wejść w batch branch mimo że dane są niespójne.

### Problem B — obsługa błędu jest zbyt miękka
W `handleReject()`:
- przy błędzie batch update kod nadal schodzi niżej
- loguje `calendar_slot_logs`
- resolve’uje notyfikacje
- zamyka modal

To może zostawić UI w stanie „pozornie zamknięte, ale logicznie zepsute”.

### Problem C — warningi dialogu
Brak `DialogDescription` generuje spam warningów, który utrudnia diagnozę, choć sam nie jest główną przyczyną freeze.

### Docelowe rozwiązanie
#### A. Uodpornić batch detection
W `SlotDetailModal`:
- `batchSlotIds` uznać za prawidłowe tylko jeśli:
  - to tablica
  - wszystkie elementy są stringami
  - zawiera aktualny `slot.id`
  - długość > 1

Jeśli nie:
- fallback do single-slot confirm/reject

#### B. Twarde przerwanie flow przy błędzie
W `handleReject()` i `handleConfirm()`:
- cały batch branch w `try/catch`
- na błędzie:
  - `toast.error(...)`
  - **return**
  - bez resolve notifications
  - bez `onOpenChange(false)`

To jest kluczowe. Teraz kod po błędzie idzie dalej, a nie powinien.

#### C. Jeden wspólny helper do batch updates
Warto wydzielić lokalnie helper:
- `applyBatchSlotUpdate(slotIds, updates)`
- waliduje wejście
- wykonuje aktualizacje sekwencyjnie
- jeśli cokolwiek padnie, przerywa i zwraca błąd

#### D. Nie zamykać modala przed sukcesem
Dialog Confirm/Reject zamykać dopiero po:
- udanym update slotów
- udanym resolve notifications
- odpaleniu maila (asynchronicznie może zostać fire-and-forget, ale update i resolve muszą przejść)

#### E. Dodać `DialogDescription`
Do confirm/reject dialogów, żeby wyczyścić warningi.

### Dodatkowe utwardzenie
W `src/hooks/useCalendarSlots.tsx`:
- przejrzeć wszystkie batch update `.in('id', ids)` i zabezpieczyć przed pustą / błędną tablicą
- szczególnie side-effect auto-mark `needs_review` nie może nigdy destabilizować kalendarza po zamknięciu modala

Nie zmieniamy logiki biznesowej kalendarza — tylko usuwamy możliwość rozjechania stanu UI.

---

## 5. Today scroll ma przestać przewijać stronę na dół

### Root cause
Błąd nie jest tylko w wyborze targetu.
Główne problemy są dwa:

1. **auto-scroll na wejściu**
   - `useEffect(... setTimeout(scrollToToday, 100))`
   - powoduje samoczynne zjazdy po wejściu na `/my/.../lessons`

2. **`scrollIntoView()` przewija nie tylko listę, ale potrafi ruszyć całą stronę**
   - dlatego po kliknięciu Today potrafi lecieć cały page layout

### Docelowe zachowanie
- po wejściu na `/lessons` strona ma stać normalnie od góry:
  - tytuł
  - “Book new lessons and view your upcoming schedule”
  - legenda
- przycisk **Today** ma przewijać tylko wewnętrzną listę “Your Lessons”
- nie może ruszać całej strony

### Konkretne zmiany
#### A. `src/components/calendar/StudentBookingsSection.tsx`
Usunąć auto-scroll on load:
- skasować `useEffect`, który odpala `scrollToToday()` po załadowaniu bookingów

#### B. Zmienić implementację `scrollToToday()`
Zamiast:
- `targetEl.scrollIntoView(...)`

użyć:
- obliczenia pozycji elementu względem kontenera `listRef`
- `listRef.current.scrollTo({ top, behavior: 'smooth' })`

Czyli scrollujemy **kontener listy**, a nie dokument.

#### C. Logika targetu
W schedule view z desc sort:
- znaleźć pierwszą sensowną granicę dla dziś / najbliższej przyszłości
- ale bez offsetu, który spycha za daleko
- offset ma być mały i liczony w obrębie kontenera, nie przez `scrollIntoView`

To da przewidywalne zachowanie:
- zero auto-scroll na wejściu
- Today działa tylko wewnątrz listy

---

## 6. Discount z Add Slot jest wpisywany, ale nie zapisuje się do bazy

### Root cause
UI przekazuje `discount_percent` z `UnifiedSlotModal`, ale hook zapisujący slot go nie obsługuje:

- `UnifiedSlotModal` wysyła `discount_percent`
- `CreateSlotInput` w `useCalendarSlots.tsx` **nie ma tego pola**
- `createSlot()` **nie insertuje** `discount_percent`
- `createSlotsBatch()` też go nie insertuje

Czyli pole jest w UI, ale backend hook je gubi.

### Konkretne zmiany
#### A. `src/hooks/useCalendarSlots.tsx`
Rozszerzyć `CreateSlotInput` o:
- `discount_percent?: number | null`

#### B. `createSlot()`
W `.insert(...)` dopisać:
- `discount_percent: input.discount_percent ?? null`

#### C. `createSlotsBatch()`
W mapowaniu `rows` dopisać:
- `discount_percent: input.discount_percent ?? null`

To daje pełną zgodność:
- Add Slot single
- batch create
- ewentualne przyszłe reuse tego samego inputu

#### D. Display
Wyświetlanie badge już w większości istnieje:
- Student Hub slot grid
- Student bookings
- teacher `CalendarSlotCard`

Po naprawie zapisu badge po prostu zaczną działać także dla slotów tworzonych przez Add Slot.

---

## Pliki do zmiany

### Meeting / spójność linku
- `src/pages/StudentPage.tsx`
- `src/hooks/useCalendarSlots.tsx`
- `src/hooks/usePublicBooking.tsx`
- `src/pages/StudentHubDashboard.tsx`
- `supabase/functions/get-student-bookings/index.ts`
- opcjonalnie: `src/components/dashboard/StudentPaymentMeetingCard.tsx` tylko jeśli chcemy utrzymać spójny wording

### Recurring batch notification
- `src/pages/StudentHubLessons.tsx`
- `supabase/functions/get-student-bookings/index.ts`

### Confirm/Reject comments + freeze fix
- `src/components/calendar/SlotDetailModal.tsx`
- `supabase/functions/send-calendar-notification-email/index.ts`

### Today scroll
- `src/components/calendar/StudentBookingsSection.tsx`

### Discount save
- `src/hooks/useCalendarSlots.tsx`

---

## Co wdrażamy świadomie, a czego nie ruszamy

### Wdrażamy
- stały, jeden link per student
- recurring jako prawdziwy batch
- komentarze dla Confirm i Reject
- twarde zabezpieczenie przed freeze po błędzie
- brak auto-scroll na wejściu
- zapis `discount_percent` z Add Slot

### Nie ruszamy
- innych funkcji calendar poza tym promptem
- schema DB
- promptów AI / innych modułów
- pełnego refaktoru całego booking flow single booking
- generatora Google Meet rooms

---

## Dokumentacja do aktualizacji po implementacji
Po wdrożeniu trzeba zaktualizować:
- `docs/TECHNICAL_DOCUMENTATION.md`
- `docs/USER_GUIDE_SHORT.md`
- `docs/USER_GUIDE_DETAILED.md`
- `docs/BUSINESS_ANALYSIS.md`
- `docs/DEVELOPMENT_ROADMAP.md`
- `docs/CURRENT_STATE_ANALYSIS.md`
- `README.md`

Zakres opisu w dokumentacji:
- finalna zasada „one student = one permanent meeting link”
- recurring batch notification flow
- confirm/reject comments
- Today button behavior
- Add Slot discount persistence

---

## Kolejność wdrożenia, żeby niczego nie popsuć
1. Naprawa `discount_percent` persistence w `useCalendarSlots`
2. Wyłączenie auto-scroll i zmiana Today na scroll kontenera
3. Twarde zabezpieczenie `SlotDetailModal` (batch validation + early return on error + dialogs)
4. Dodanie confirm comment + mail templates
5. Przełączenie recurring z wielu `bookSlot()` na jedno `book_batch`
6. Ujednolicenie meeting link rule i propagacja per-student linku do przyszłych slotów

Taka kolejność minimalizuje ryzyko regresji:
- najpierw prosty zapis danych
- potem lokalny UX
- potem krytyczne akcje modalowe
- na końcu batch booking i meeting model
