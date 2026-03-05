
Cel: naprawić 4 zgłoszone regresje bez ruszania stabilnych flow i przygotować gotowy, „bez-decyzyjny” plan wdrożenia + testy E2E + checklistę gotowości.

## 1) Diagnoza źródłowa (dlaczego nadal nie działa)

1. Available Slot + Link Worksheet (regresja krytyczna)
- W `CalendarPage.tsx` `handleWorksheetLinked()` od razu robi `updateSlot(...)` (persist do DB).
- W tym samym czasie `selectedSlot` jest synchronizowany z `slots` (efekt w `CalendarPage`), więc niezapisany draft z modala (wybrany student) jest nadpisywany świeżym stanem z DB.
- Skutek: student znika, worksheet zapisuje się „na stałe”, znikają „Save Changes” (bo draft został utracony).

2. Przepełnienie stopki modala przy Recurring edit
- `DraggableDialogFooter` domyślnie ma `sm:flex-row`; w `SlotDetailModal` dodano `flex-col`, ale bez `sm:flex-col`, więc na desktop i tak układ jest w wierszu.
- Po pojawieniu się „Save for Entire Series” przyciski się rozpychają i wychodzą poza modal.

3. `/book/:token` (oraz `/book`) – nadal niespójności
- 3A: ukrywanie „past” działa tylko częściowo w UI; nadal renderują się wyszarzone boxy dni.
- 3B: pending chip ma inny layout niż available (oddzielna gałąź renderu, inne klasy/strukturę).
- 3C: `Show past` w `StudentBookingsSection` wysyła `includePast`, ale edge function `get-student-bookings` ignoruje ten parametr (ma twarde `.gte(today)`).
- 3D: logi są technicznie pobierane, ale prezentacja jest „surowa” i nie ma formatowania semantycznego jak w /calendar.

4. Kafelek rezerwacji na `/book` – brak pełnej funkcjonalności
- History jest tylko dla aktywnych bookingów; cancelled section nie ma historii.
- Filtry obejmują tylko `completed/no_show/needs_review`; brak `cancelled`, `student_cancelled`, `teacher_cancelled`.
- Statusy są częściowo, ale brak pełnej spójności (w tym cancelled jako osobna klasa widokowa i filtrowanie przekrojowe).

---

## 2) Plan wdrożenia (konkretne zmiany, plik po pliku)

### Problem 1 — naprawa draftu Worksheet/Student na Available Slot (bez autosave)
Pliki:
- `src/components/calendar/SlotDetailModal.tsx`
- `src/pages/CalendarPage.tsx`
- (opcjonalnie porządkowo) `src/components/calendar/LinkWorksheetModal.tsx`

Zmiana architektury:
- Dla `SlotDetailModal` przechodzimy na model jak `UnifiedSlotModal` (Add Lesson Single): worksheet jest stanem lokalnym (`editWorksheetId`), NIE zapisuje się do DB przed `Save Changes`.
- Linkowanie worksheet dla edycji istniejącego slota przenosimy do lokalnego selecta w `SlotDetailModal` (z listą worksheetów ucznia), bez zamykania modala i bez przechodzenia przez `CalendarPage.handleWorksheetLinked`.

Dokładne kroki:
1) `SlotDetailModal`:
- Dodać stany:
  - `editWorksheetId` (`'none' | worksheetId`)
  - `studentWorksheets` (lista worksheetów ucznia)
- Inicjalizacja przy otwarciu modala: `editWorksheetId = slot.worksheet_id ?? 'none'`.
- Fetch worksheetów po zmianie `editStudentId` (analogicznie do `UnifiedSlotModal`).
- W sekcji Worksheet:
  - jeśli student wybrany: `Select` z `No worksheet` + worksheety ucznia;
  - jeśli brak studenta: disabled.
- `hasChanges` musi uwzględniać zmianę worksheet.
- `handleSave()` musi wysyłać `updates.worksheet_id` razem z innymi polami.

2) `CalendarPage`:
- Dla `SlotDetailModal` usunąć flow `onLinkWorksheet` (dla existing slot edit).
- `handleWorksheetLinked()` przestaje dotykać existing slot path (zostaje tylko dla innych miejsc lub do usunięcia jeśli nieużywane).
- Utrzymać obecne `Save Changes` jako jedyny punkt utrwalenia draftu.

Efekt oczekiwany:
- Po wyborze studenta i worksheet nic nie zapisuje się automatycznie.
- Dopiero `Save Changes` zapisuje student + worksheet + status.

---

### Problem 2 — footer modala Recurring (przyciski nie mogą wystawać)
Plik:
- `src/components/calendar/SlotDetailModal.tsx`

Kroki:
1) W `DraggableDialogFooter` ustawić responsywnie kolumnę również na `sm`:
- dodać klasy: `sm:flex-col sm:space-x-0`.
2) Ustawić sekcje akcji jako:
- górny rząd: `flex flex-wrap gap-1 w-full`
- przycisk „Save for Entire Series” jako full width `h-7 text-xs`
- dolny rząd: `flex flex-wrap gap-2 w-full justify-end`
3) Spójne wysokości (`h-7`) dla wszystkich buttonów akcji modalowych.

Efekt:
- Na desktop i mobile stopka nie przepełnia się, wszystkie CTA widoczne.

---

### Problem 3 — `/book` (A/B/C/D)

Pliki:
- `src/pages/PublicBookingPage.tsx`
- `src/components/calendar/StudentBookingsSection.tsx`
- `supabase/functions/get-student-bookings/index.ts`

3A (znikanie past available):
1) W `PublicBookingPage` wyliczać `visibleDaySlots`:
- `available` ukrywać jeśli `slot_start <= now` (nie tylko dla today, ale wynikowo dla każdego dnia).
2) Nie nakładać „past opacity” na cały card dnia.
3) Dzień bez `visibleDaySlots` pokazuje „No slots” bez wyszarzania.

3B (Pending ma wyglądać jak Available):
1) Wyrównać render pending i available do jednej struktury komponentu/chipu.
2) Różnić tylko kolorem/borderem.
3) Wymusić jednoliniowy primary time (bez skoków typografii).

3C (Show past + widoki Schedule/Month/Date Range):
1) Edge function:
- w default query użyć `includePast`:
  - `if (!includePast) .gte(today)`
  - `if (includePast) bez ograniczenia`.
2) `StudentBookingsSection`:
- dodać `viewMode` (`schedule` domyślnie, `month`, `range`);
- dodać przełącznik widoków obok „Your Lessons”;
- `schedule`: obecna lista;
- `month`: siatka miesięczna z count/status dot, klik dzień => lista z tego dnia;
- `range`: od/do + lista filtrowana.
3) Domyślnie `schedule`.

3D (pełniejsze logi):
1) Edge `get_logs`:
- zwiększyć limit (np. 30),
- dodać walidację, że student (email/token) ma dostęp do slotu.
2) UI `StudentBookingsSection`:
- dodać formatowanie semantyczne akcji (np. `time_changed`, `student_assigned`, `status_changed`),
- pokazywać komplet detali (old/new status, old/new time, student, email, actor, timestamp),
- czytelny separator i spacing.

---

### Problem 4 — kafelki rezerwacji `/book` (A/B/C/D)
Pliki:
- `src/components/calendar/StudentBookingsSection.tsx`
- `supabase/functions/get-student-bookings/index.ts`

A) History button:
- utrzymać dla aktywnych + dodać dla `Cancelled Lessons`.
- cancelled card ma własny toggle historii (ten sam fetch logs po slot_id).

B) Statusy równoległe + tooltip:
- aktywny slot może mieć jednocześnie np. `Confirmed` + `✓ Completed`.
- tooltipy na każdym badge (Pending/Confirmed/Completed/No Show/Needs Review/SC/TC).

C) Przycisk cancelled:
- istnieje, ale utrwalić i nie ukrywać przy filtrach; odświeżanie listy po toggle.

D) Filtry:
- rozszerzyć `statusFilter` o:
  - `completed`, `no_show`, `cancelled`, `student_cancelled`, `teacher_cancelled`, `needs_review`.
- logika:
  - aktywne bookingi filtrują statusy aktywne,
  - cancelled sekcja filtruje `cancelled/student_cancelled/teacher_cancelled`.

---

## 3) Kolejność implementacji (bezpieczna)

1. Fix krytyczny draft/worksheet (Problem 1).
2. Fix footer overflow (Problem 2).
3. Edge `includePast` + `get_logs` access/format payload (Problem 3C/3D).
4. PublicBooking UI: 3A/3B.
5. StudentBookingsSection: viewMode (schedule/month/range), status/filter/history dla active+cancelled (3C + 4A-D).
6. Smoke test + pełny E2E + checklist update.

---

## 4) Plan testów end-to-end (obowiązkowy)

Scenariusze krytyczne:
1) `/calendar` Available Slot:
- wybierz studenta -> wybierz worksheet -> NIE klikaj Save -> zamknij modal -> brak zapisu.
- powtórz i kliknij Save -> student + worksheet zapisane razem.
2) Recurring Booked edit:
- zmień godzinę -> pojawia się „Save for Entire Series” -> wszystkie przyciski widoczne, nic nie wychodzi poza modal.
3) `/book/:token`:
- available znika po minięciu start_time,
- pending ma identyczny layout jak available (tylko kolor inny).
4) `Your Lessons`:
- `Show past` OFF: brak historycznych,
- `Show past` ON: historyczne widoczne,
- widoki `Schedule/Month/Date Range` działają, domyślnie `Schedule`.
5) Kafelki lekcji:
- History działa dla active i cancelled,
- badge równoległe (np. Confirmed + Completed),
- filtry: Completed, No Show, Cancelled, Student Cancellation, Teacher Cancellation.
6) Regresja:
- booking, confirm/reject, cancel, reschedule nadal działają i logują poprawnie.

---

## 5) Step-by-step Calendar Readiness Checklist (do wdrożenia i odhaczenia)

Dodać/uzupełnić `docs/CALENDAR_READINESS_CHECKLIST.md` o sekwencję:
1. Data integrity precheck (overlap, recurring detach, cancellation semantics).
2. Teacher flow validation (`/calendar`).
3. Public booking flow validation (`/book/:token`).
4. Student lesson history + filters + views validation.
5. Notifications/logs validation (in-app + audit completeness).
6. Regression sweep (booking/confirmation/cancellation/reschedule).
7. Release gate: „all critical scenarios pass twice (desktop + mobile viewport)”.

---

## 6) Ryzyka i zabezpieczenia (żeby nie popsuć działającej appki)

- Największe ryzyko: utrata draftu przez synchronizację `selectedSlot` z DB.
  - Mitigacja: worksheet i student zmiany trzymane lokalnie w `SlotDetailModal`, brak autosave.
- Ryzyko UI overflow:
  - Mitigacja: wymuszenie `sm:flex-col` + jednolity sizing buttonów.
- Ryzyko data leak w `get_logs`:
  - Mitigacja: walidacja dostępu do slotu po email+token przed zwrotem logów.
- Ryzyko regresji booking flow:
  - Mitigacja: E2E matrix + smoke testy po każdym etapie.
