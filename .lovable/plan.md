

# Plan: Naprawy kalendarza FAZA 1 + plan FAZY 2 i 3

---

## FAZA 1 — Bugi i ulepszenia (do implementacji TERAZ)

### 1. Odwrocone kreski godzinowe (Day + Week view)

**Problem:** W `CalendarWeekView.tsx` linia 107 i `CalendarDayView.tsx` linia 79: `i % 2 === 0` to pelna godzina, ale border-border/40 jest slabszy niz powinien. W gutter (linia 84 CalendarWeekView) jest `border-border/20` dla wszystkiego.

**Fix:** W obu plikach zamienic:
- Pelna godzina (i % 2 === 0): `border-border/60` (mocniejsza)
- Pol godziny (i % 2 !== 0): `border-border/10` (slabsza)
- W gutter tez: pelna godzina `border-border/30`, pol godziny `border-border/10`

---

### 2. Zmiana nazwy modalu: "Batch Add Slots" → "Add Slots"

**Plik:** `UnifiedSlotModal.tsx` linia 282: DialogTitle zmiana z "Add Event" na "Add Slots" (dla available) / "Add Lesson" (dla lesson) — dynamicznie wg `slotType`.

---

### 3A. Batch Slots — zmiana z "Working hours" na listę godzin z +Add

**Problem:** Obecny Batch ma Working hours from/to i auto-generuje sloty. Uzytkownik chce liste godzin (jak pary start-end) z przyciskiem "+Add" do dodawania kolejnych.

**Fix w `UnifiedSlotModal.tsx`:**
- Usunac pola `workStart`/`workEnd` z Batch view
- Dodac state: `timeSlotEntries: TimeSlotEntry[]` (juz zdefiniowany typ w linii 24-28)
- Domyslnie jedna wpis: `[{ id: uuid(), start: '09:00', end: computeEndTime('09:00', duration) }]`
- Przycisk "+Add" dodaje nastepna wpis z start = poprzedni end, end = start + duration
- Kazdy wpis edytowalny (Input type="time") + przycisk X do usuniecia
- `batchSlots` useMemo: zamiast generowac z working hours, iteruj po `timeSlotEntries` × `selectedDays` × date range
- Dodac pelny zakres godzin do selectow From/To (7:00-23:00)

---

### 3B. Title domyslnie pusty

**Plik:** `UnifiedSlotModal.tsx` linia 109: `setTitle('')` — juz jest pusty. Ale linia 131-135: auto-fill title dla lesson. Zachowac auto-fill TYLKO dla lesson, upewnic sie ze dla available title jest zawsze pusty. OK — to juz dziala poprawnie.

---

### 3C. Recurring Lesson tworzy puste sloty zamiast lesson

**Przyczyna root:** Tabela `calendar_recurrence_rules` NIE MA kolumny `student_id` ani `title`. W `useCalendarRecurrence.tsx` linia 60-71 insert do tabeli nie wstawia student_id (bo kolumna nie istnieje). Potem w `generateSlotsForRule` linia 123: `(rule as any).student_id` jest `undefined` bo rule pochodzi z bazy i nie ma tej kolumny.

**Fix:**
1. **Migracja SQL:** Dodac kolumny `student_id uuid`, `title text` do `calendar_recurrence_rules`
2. **`useCalendarRecurrence.tsx` linia 60-71:** Dodac `student_id` i `title` do insert
3. Wtedy `generateSlotsForRule` bedzie prawidlowo czytac `rule.student_id`

---

### 3D. Single Lesson — brak opcji linkowania Worksheet

**Problem:** W `UnifiedSlotModal.tsx` dla Single Lesson nie ma przycisku "Link Worksheet".

**Fix:** Po polach Title/Notes (linia 508-518), jesli `slotType === 'lesson' && lessonMode === 'single' && studentId !== 'none'`, dodac sekcje informacyjna: "You can link a worksheet after creating the lesson, from the slot details view." (Linkowanie wymaga istniejacego slot.id — nie mozna linkowac przed utworzeniem slotu.)

---

### 3E. Conflict detection — bledy logiczne

**Problem 1:** Lesson 11:00-12:00 na wolny slot 11:00-12:00 — system blokuje zamiast auto-replace.

**Przyczyna:** `handleSubmit` linia 229-247: sprawdza konflikty, ale logika jest bledna. `checkConflicts` oznacza KAZDY overlap jako conflict. Potem linia 233-237 szuka replaceable (slotow bez studenta), ale JESLI jest tez slot z studentem w overlapping, `blocked=true` i nigdy nie dociera do replace.

**Problem 2:** Single Slot 19:30-12:30 — wykrywa konflikt z 18:30-19:30. To dlatego ze `12:30 < 19:30` jest true (string comparison `"12:30" < "19:30"`), wiec system mysli ze nowy slot 19:30-12:30 pokrywa sie z 18:30-19:30. To jest bug — uzytkownik prawdopodobnie chcial 19:30-20:30 ale wpisal 12:30 co jest blad walidacji. Ale niezaleznie od tego, `"19:30" < "12:30"` jest false wiec `end_time > start_time` wyrazenie `"19:30" > "19:30"` jest false — wiec NIE powinno byc konfliktu. Sprawdzam: `ex.end_time > ns.start_time` = `"19:30" > "19:30"` = false. Hmm wiec nie powinno byc konfliktu. ALE w bazie end_time moze byc "19:30:00" a ns.start_time to "19:30" — string comparison "19:30:00" > "19:30" = true. TO JEST BUG.

**Fix:**
1. W `checkConflicts`: normalizowac czasy do HH:MM przed porownaniem (`.slice(0,5)`)
2. Przerobic logike conflicts — rozdzielic na 3 scenariusze z planu:
   - A. Available na Lesson → BLOCK
   - B. Lesson na Available → AUTO-REPLACE (usun available, dodaj lesson) — NIE BLOKUJ
   - C. Lesson na Lesson → BLOCK
3. Dodac czyszczenie conflictow gdy uzytkownik zmieni date/godziny (reset conflicts on field change)

**Nowa logika checkConflicts:**
```
for each new slot:
  find overlapping existing (normalize times to HH:MM)
  for each overlap:
    if adding available AND overlap has student → BLOCK
    if adding lesson AND overlap has student → BLOCK  
    if adding lesson AND overlap has NO student → REPLACEABLE (not blocked)
    if adding available AND overlap has NO student → REPLACEABLE (not blocked)
return { blocked, replaceable, info }
```

Przy submit: jesli blocked → pokaz error. Jesli nie blocked ale sa replaceable → usun replaceable, potem insert.

**Dodac:** `useEffect` na `[date, startTime, endTime]` ktory resetuje `setConflicts([])` i `setConflictBlocked(false)`.

---

### 4. SlotDetailModal — "Cancel" button usuwa slot

**Problem:** Linia 331: `<Button onClick={() => onOpenChange(false)}>Close</Button>` — to zamyka modal. Ale linia 313: `Cancel Lesson` zmienia status na cancelled — to jest poprawne. Uzytkownik mowi ze "Cancel" usuwa slot. Sprawdzam linie 328-331:
- Delete button (linia 328) — to jest delete, OK
- Close button (linia 331) — to zamyka modal, NIE usuwa

Prawdopodobnie uzytkownik myli "Cancel Lesson" z "Cancel" (Close). Label "Close" moze byc myslacy. Zmienic na:
- "Close" → "Cancel" (zamyka modal bez zmian, ale najpierw resetuj pola do oryginalnych wartosci)
- "Cancel Lesson" → zostawic ale z potwierdzeniem

**Fix:** Zmienic przycisk "Close" (linia 331) na "Cancel" ktory resetuje zmiany i zamyka modal. Przeniesc go obok "Save Changes" i "Delete".

---

### 4A. SlotDetailModal — modal rozjezdza sie po wybraniu ucznia

**Problem:** Prawdopodobnie przyciski status actions (Confirm, Complete, No Show, Cancel Lesson) renderuja sie i rozciagaja modal.

**Fix:** Dodac `overflow-y-auto max-h-[80vh]` na DialogContent. Uzyc `flex-wrap` na przyciskach statusu. Zmniejszyc rozmiary przyciskow.

---

### 5. Powiadomienia kalendarzowe

**A. Dashboard — ikonka z numerkiem na przycisku Calendar:**
- Nowa tabela `calendar_notifications` (teacher_id, type, message, slot_id, student_name, is_read, created_at)
- Hook `useCalendarNotifications` — fetchuje unread count
- Na Dashboard.tsx: `<Badge>` z liczbą unread na przycisku Calendar

**B. Na /calendar — dzwoneczek z dropdownem:**
- Komponent `CalendarNotificationBell` z Popover
- Pokazuje ostatnie powiadomienia (nowa rezerwacja, anulowanie, itp.)
- Mark as read on open

---

### 6. Rezerwacja ucznia nie pojawia sie w kalendarzu nauczyciela

**Problem:** `usePublicBooking.bookSlot` (linia 87-99) aktualizuje slot w bazie. Ale na stronie `/calendar` nauczyciel widzi tylko sloty z `fetchSlots` ktory filtruje po `teacher_id`. Aktualizacja powinna byc widoczna.

**Przyczyna prawdopodobna:** Slot po rezerwacji ma `status: 'booked'`. Calendar fetchSlots pobiera WSZYSTKIE statusy. Wiec powinno dzialac. Problem moze byc w tym ze `bookSlot` aktualizuje tylko sloty z `status: 'available'` (linia 99: `.eq('status', 'available')`). Jesli slot juz nie jest available (np. ktos inny zabrokowal) — aktualizacja sie nie powiedzie bez bledu.

**Bardziej prawdopodobna przyczyna:** Nauczyciel musi odswiezyc strone. Brak real-time subscription. 

**Fix:** Dodac tymczasowe rozwiazanie — auto-refetch co 30 sekund w `useCalendarSlots`. Lub dodac przycisk "Refresh". Docelowo Supabase Realtime subscription na `calendar_slots`.

Dodatkowo: wstawiac rekord do `calendar_notifications` po udanej rezerwacji (INSERT trigger lub edge function).

---

### 7. Calendar Settings — brakujace opcje

Obecne sekcje: General, Booking Rules, Public Calendar, Notifications. Brakuje:
- **Payment Tracking** (juz jest tabela `calendar_payment_records` i `calendar_student_settings`): enable/disable, default price, currency
- **Wyswietlanie working hours** w widoku kalendarza (start/end hour)

**Fix:** Dodac sekcje "Payment" do CalendarSettingsPage z: payment_tracking_enabled switch, default_lesson_price input, currency select.

---

### 8. Komunikaty — "slot created" zamiast "lesson created"

**Plik:** `useCalendarSlots.tsx` `createSlot` callback — toast mowi "Slot created" niezaleznie od tego czy to slot czy lesson.

**Fix:** Zmienic toast w `createSlot`:
```typescript
toast({ title: input.student_id ? 'Lesson created' : 'Slot created' });
```
Analogicznie w batch: `${inputs.length} lessons created` vs `${inputs.length} slots created`.

---

### 9. Public Booking — opcja recurring booking

**Plik:** `PublicBookingPage.tsx` — modal Confirm Booking.

**Dodac:**
- Checkbox/switch: "Book weekly at this time"
- Jesli zaznaczone: date picker "Until" (data koncowa)
- Ostrzezenie: "⚠️ You are booking a weekly recurring lesson every [Day] at [Time] until [Date]. This will book X lessons."
- Logika: po zatwierdzeniu, book all available slots at same weekday/time w zakresie dat

---

### 10-11. Test end-to-end + readiness checklist

To zrobie po implementacji. Plan:
1. Przetestowac: dodawanie single slot, batch, single lesson, recurring lesson
2. Edycja slotu — assign/remove student
3. Public booking — single + recurring
4. Conflict detection — 3 scenariusze
5. Powiadomienia
6. Responsywnosc mobile

**Readiness checklist** (do dodania do dokumentacji):
- [ ] Single slot creation works
- [ ] Batch slot creation works  
- [ ] Single lesson creation works (with student)
- [ ] Recurring lesson creation works (with student)
- [ ] Slot editing — change time/date/student
- [ ] Conflict detection — all 3 scenarios
- [ ] Public booking page loads
- [ ] Student can book a slot
- [ ] Teacher sees booked slots
- [ ] Notifications on booking
- [ ] Calendar Settings complete
- [ ] Day/Week/Month views work
- [ ] Mobile responsive

---

## FAZA 2 — Platnosci i eksport (PLAN)

### Platnosci:

1. **CalendarSettingsPage** — nowa sekcja "Payment Tracking":
   - Switch: `payment_tracking_enabled`
   - Input: `default_lesson_price` 
   - Select: `currency` (USD, EUR, PLN, GBP)

2. **SlotDetailModal** — przycisk "Mark as Paid" / "Mark as Unpaid":
   - Toggle `is_paid` na `calendar_slots`
   - Widoczny tylko gdy payment_tracking_enabled

3. **Prepaid packs** — `calendar_student_settings.prepaid_lessons_remaining`:
   - Auto-dekrementacja po `status='completed'` (trigger SQL)
   - Warning gdy prepaid_lessons_remaining <= 2

4. **Uczen "I've paid"** — w Public Booking / StudentLessonsPage:
   - Przycisk tworzy rekord w `calendar_payment_records` z `is_confirmed=false`
   - Nauczyciel widzi w SlotDetailModal i moze potwierdzic

### Eksport:

1. **CalendarToolbar** — przycisk "Export":
   - Dropdown: All lessons / Selected student / Date range
   - Generuje CSV: Date, Time, Student, Status, Paid, Notes, Worksheet Title
   - Pobiera jako plik .csv

2. **Opcja "Send by email"** — edge function `send-calendar-export`:
   - Generuje CSV
   - Wysyla email z attachment

---

## FAZA 3 — Google Calendar (PLAN ARCHITEKTURY)

**Status:** Brak Google Calendar connector w Lovable. Wymaga custom OAuth2 flow.

### Architektura:

1. **OAuth2 flow:**
   - Edge function `gcal-auth-start` — generuje URL do Google consent screen
   - Callback endpoint — zapisuje refresh_token w `calendar_settings` (encrypted)

2. **Sync flow:**
   - Edge function `sync-gcal-event` — wywoływana po potwierdzeniu rezerwacji
   - Tworzy event w GCal z: title, time, color, reminder
   - Zapisuje `gcal_event_id` w `calendar_slots`

3. **Dwukierunkowa sync:**
   - Webhook / cron sprawdza zmiany w GCal
   - Jesli usuniety event → anuluj slot w naszym systemie

4. **Ustawienia w CalendarSettings:**
   - Przycisk "Connect Google Calendar" → OAuth flow
   - Kolor, reminder minutes, domyslny opis

**UWAGA:** Implementacja wymaga Google Cloud Console setup + OAuth credentials. Na razie dokumentujemy architekture, nie implementujemy.

---

## KOLEJNOSC IMPLEMENTACJI FAZY 1

| Krok | Co | Pliki |
|---|---|---|
| 1 | Migracja SQL: dodac student_id, title do calendar_recurrence_rules + tabela calendar_notifications | migration |
| 2 | Fix kreski godzinowe (Day+Week) | CalendarDayView.tsx, CalendarWeekView.tsx |
| 3 | Fix conflict detection — normalizacja czasow + 3 scenariusze + reset on change | UnifiedSlotModal.tsx |
| 4 | Batch Slots — lista godzin zamiast Working hours | UnifiedSlotModal.tsx |
| 5 | Recurring Lesson fix — student_id w insert + generate | useCalendarRecurrence.tsx |
| 6 | SlotDetailModal — fix Cancel/overflow/komunikaty | SlotDetailModal.tsx |
| 7 | Dynamic modal title + toast messages | UnifiedSlotModal.tsx, useCalendarSlots.tsx |
| 8 | Public Booking — recurring option | PublicBookingPage.tsx, usePublicBooking.tsx |
| 9 | Notifications — tabela + hook + badge na Dashboard + bell na Calendar | migration, hook, Dashboard.tsx, CalendarPage.tsx |
| 10 | Calendar Settings — Payment sekcja | CalendarSettingsPage.tsx |
| 11 | Single Lesson — info o linkowaniu worksheet | UnifiedSlotModal.tsx |
| 12 | Auto-refetch slots (30s interval) | useCalendarSlots.tsx |
| 13 | Dokumentacja | 4 pliki docs |

