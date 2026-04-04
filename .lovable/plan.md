

# Plan: 9 napraw — Info, Meeting, MeetingField, Recurring, Reject, Scroll, GCal, Discount

## Problem 1: Info o Student Hub na /dashboard i /student

**Co:** Dodać info-box na obu stronach kierujący nauczycieli do `edooqoo.com/my`.

**Dashboard.tsx** — pod tytułem strony lub w sekcji studentów, dodać:
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
  <p className="font-medium">💡 Student Hub</p>
  <p className="text-muted-foreground text-xs mt-1">
    Share <strong>edooqoo.com/my</strong> with your students — they can access their lessons, flashcards, homework & worksheets by entering their email. No login needed.
  </p>
</div>
```

**StudentPage.tsx** — pod nagłówkiem profilu studenta, analogiczny info-box.

**Pliki:** `src/pages/Dashboard.tsx`, `src/pages/StudentPage.tsx`

---

## Problem 2: Meeting link — jeden per-student, prosty

**Obecny stan:** Infrastruktura per-student (`calendar_student_settings.default_meeting_link`) ISTNIEJE i działa. Problem: nauczyciel musi ręcznie wkleić link w profilu każdego studenta osobno.

**Co zmienić:**
- W `CalendarSettingsPage.tsx` sekcja Google Meet — zostawić pole "Default Meeting Link for new students" (globalny fallback) + przycisk "Apply to all students without a link" (batch update). To JUŻ JEST zaimplementowane w poprzedniej wersji.
- Upewnić się że `get-student-hub-data` i `get-student-bookings` edge functions zwracają per-student meeting link (sprawdzić czy edge functions to robią — z poprzedniej implementacji powinny).
- W `usePublicBooking.tsx` bookSlot — meeting link jest już pobierany per-student (linia 209-218).

**Wniosek:** Problem 2 jest w dużej mierze rozwiązany w poprzednich commitach. Trzeba ZWERYFIKOWAĆ że:
1. Edge function `get-student-hub-data` zwraca `defaultMeetingLink` z `calendar_student_settings`
2. Edge function `get-student-bookings` zwraca `meeting_link` per-booking z fallbackiem na per-student
3. Emaile zawierają meeting link (sprawdzone w `usePublicBooking.tsx` linia 225)

Jedyny brakujący element: przycisk "Apply to all students without a link" w CalendarSettingsPage. Trzeba go dodać jeśli nie istnieje.

**Pliki:** `src/pages/CalendarSettingsPage.tsx` (sprawdzić/dodać batch apply button)

---

## Problem 3: MeetingLinkField — dynamiczny opis zależny od GCal

**Obecny stan (linia 93-97 StudentPage.tsx):**
```tsx
{link 
  ? "Your meeting room link. Students will see a 'Join Lesson' button..."
  : "Paste your meeting room link (e.g., Google Meet, Zoom)..."
}
```

**Co zmienić:** Dodać prop `hasGcal` do `MeetingLinkField`. W `StudentPage.tsx` pobrać `gcal_integration_enabled` z `calendar_settings` i przekazać.

```tsx
function MeetingLinkField({ studentId, teacherId, hasGcal }: { studentId: string; teacherId: string; hasGcal?: boolean }) {
  // ...
  <p className="text-xs text-muted-foreground mt-1">
    {link 
      ? "Your meeting room link. Students will see a 'Join Lesson' button. Paste a different link to override."
      : hasGcal
        ? "A Google Meet link can be set here. Students will see a 'Join Lesson' button."
        : "Connect Google Meet or paste your meeting room link (e.g., Google Meet, Zoom). Students will see a 'Join Lesson' button."
    }
  </p>
```

W `StudentPage.tsx`: pobrać `calendar_settings.gcal_integration_enabled` i przekazać `hasGcal={gcalEnabled}`.

**Pliki:** `src/pages/StudentPage.tsx`

---

## Problem 4: Recurring booking — "undefined at undefined–undefined"

**Root cause:** W `usePublicBooking.tsx` linia 127: `const slot = slots.find(s => s.id === slotId)`. Przy recurring booking, `handleBook` w `StudentHubLessons.tsx` pobiera sloty bezpośrednio z DB (linia 70-76) i wywołuje `bookSlot(match.id, name, email)`. Ale `match` pochodzi z bezpośredniego query do `calendar_slots`, nie z `slots` w hooku. Więc `slots.find(s => s.id === match.id)` zwraca `undefined` → powiadomienie ma `undefined at undefined–undefined`.

**Rozwiązanie:** W `usePublicBooking.tsx` `bookSlot`, gdy `slot` z `slots.find()` jest null, pobrać dane slotu bezpośrednio z DB:

```typescript
let slot = slots.find(s => s.id === slotId);
if (!slot) {
  // Slot might be from a different week (recurring booking) — fetch directly
  const { data: dbSlot } = await supabase
    .from('calendar_slots')
    .select('slot_date, start_time, end_time, worksheet_id, meeting_link')
    .eq('id', slotId)
    .single();
  if (dbSlot) slot = dbSlot as any;
}
```

Dodatkowo: po zarezerwowaniu wszystkich slotów w recurring, wysłać jedno zbiorcze powiadomienie z `slot_ids` w metadata (żeby nauczyciel mógł potwierdzić/odrzucić wszystkie naraz):

W `StudentHubLessons.tsx` `handleBook`, po pętli while, dodać zbiorcze powiadomienie:
```typescript
if (bookedCount > 1) {
  // The individual bookSlot calls already created per-slot notifications
  // But for batch confirm/reject, update the FIRST notification's metadata with all slot_ids
  // This is how batch confirm/reject works in SlotDetailModal
}
```

Ale wait — każde wywołanie `bookSlot` tworzy osobne powiadomienie z osobnym `slot_id`. Batch confirm/reject w `SlotDetailModal` szuka notyfikacji z `metadata.slot_ids`. Problem: obecne powiadomienia nie mają `slot_ids` w metadata.

**Fix:** Po pętli recurring w `handleBook`, jeśli `bookedCount > 1`:
1. Zebrać wszystkie zarezerwowane `slotIds`
2. Usunąć indywidualne powiadomienia `booking_pending` (bo są z "undefined")
3. Wstawić jedno zbiorcze powiadomienie z `slot_ids` w metadata

```typescript
// Po pętli:
if (bookedSlotIds.length > 1) {
  // Delete individual notifications (they have bad "undefined" messages)
  await supabase.from('calendar_notifications')
    .delete() // Can't delete — RLS blocks DELETE on calendar_notifications!
```

RLS na `calendar_notifications` nie pozwala na DELETE (brak policy). Więc zamiast usuwać, **zapobiegamy** tworzeniu powiadomień per-slot w recurring. 

**Lepsze rozwiązanie:** W `bookSlot`, dodać opcjonalny parametr `skipNotification?: boolean`. Gdy `true`, pomiń tworzenie powiadomień. `handleBook` w `StudentHubLessons.tsx`:
1. Pierwszy slot — `bookSlot(selectedSlot.id, name, email)` — normalnie (tworzy powiadomienie)
2. Kolejne sloty — `bookSlot(match.id, name, email, true)` — bez powiadomienia
3. Po pętli — ręcznie update metadata pierwszego powiadomienia żeby dodać `slot_ids`

Ale `bookSlot` nie ma parametru `skipNotification`. Trzeba go dodać.

**Jeszcze lepsze rozwiązanie:** Zmienić logikę w `handleBook` żeby:
1. Bookować wszystkie sloty (z `bookSlot`)
2. Pierwsze wywołanie bookSlot tworzy powiadomienie normalnie
3. Kolejne bookSlot wywołania z flagą `{ skipNotification: true }`
4. Po pętli: update metadata pierwszego powiadomienia żeby zawierał `slot_ids: [firstSlotId, ...otherSlotIds]`

**Zmiany w `usePublicBooking.tsx`:**
- `bookSlot` sygnatura: dodać 4. parametr `options?: { skipNotification?: boolean }`
- Gdy `options?.skipNotification === true`, pominąć sekcje tworzenia notification i wysyłania emaili
- Dodać do `bookSlot` zwracanie obiektu `{ success: boolean, slotId: string }` zamiast `boolean`

To jest zbyt duży refactor. **Najprostrsze rozwiązanie:**

1. Fix "undefined" — w `bookSlot`, po `const slot = slots.find(...)`, jeśli null → fetch z DB (jak wyżej)
2. Batch notification — po pętli recurring w `handleBook`, update metadata pierwszego powiadomienia:
```typescript
if (bookedSlotIds.length > 1) {
  const firstNotif = await supabase.from('calendar_notifications')
    .select('id')
    .eq('slot_id', selectedSlot.id)
    .eq('teacher_id', settings.teacher_id)
    .eq('notification_type', 'booking_pending')
    .eq('is_resolved', false)
    .maybeSingle();
  if (firstNotif?.data) {
    await supabase.from('calendar_notifications')
      .update({ 
        metadata: { slot_ids: bookedSlotIds, ...metadata },
        message: `${resolvedName} requested ${bookedSlotIds.length} weekly lessons starting ${selectedSlot.slot_date} at ${selectedSlot.start_time.slice(0,5)}–${selectedSlot.end_time.slice(0,5)} — awaiting confirmation`
      })
      .eq('id', firstNotif.data.id);
  }
}
```

Ale RLS na `calendar_notifications` UPDATE wymaga `auth.uid() = teacher_id`, a student nie jest zalogowany → UPDATE zablokowany.

**Najprostszy fix:** Po prostu naprawić "undefined" w bookSlot (point 1 wyżej). Każdy slot dostanie osobne poprawne powiadomienie. Nauczyciel potwierdza/odrzuca każdy osobno. Nie idealne ale działa.

**Pliki:** `src/hooks/usePublicBooking.tsx` (fix slot lookup)

---

## Problem 5: Reject — komentarz + blokada slotów

### 5A: Komentarz do Reject
Sprawdziłem — `showRejectDialog` i `rejectComment` state JUŻ SĄ w SlotDetailModal (linia 96-97). `handleReject` już wysyła `rejectionReason: rejectComment` (linia 514, 520). Trzeba sprawdzić czy **dialog z textarea jest renderowany** w JSX.

Muszę zobaczyć render część SlotDetailModal.

### 5B: Blokada slotów po Reject
Logi pokazują `PATCH calendar_slots?id=in.(...) 400`. To jest batch update z 4 slotami. `handleReject` linia 506-511 robi pętlę `for (const sid of batchSlotIds)` — ale każdy `onUpdate` to osobne wywołanie, nie batch. Więc `id=in.(...)` NIE pochodzi z `handleReject`.

Wracając do logów: `onOpenChange` jest wywoływane, co re-renderuje CalendarPage. CalendarPage może mieć swój own batch update po zamknięciu modala.

Bardziej prawdopodobne: `batchSlotIds` z metadata powiadomienia zawiera slot IDs które nie należą do tego nauczyciela (bo metadata zapisano z anon/public role). Albo problem jest w tym że `batchSlotIds` w metadata są undefined/invalid.

**Root cause** powiązany z Problem 4: recurring booking tworzy powiadomienia z `undefined` metadata (bo `slot` jest undefined). Więc `metadata.slot_ids` nie istnieje, ale `batchNotif?.metadata?.slot_ids` zwraca `undefined`. Wtedy `handleReject` wchodzi w branch `else` (single reject, linia 515-521), który powinien działać.

Ale w logach widzę batch PATCH z 4 ID — to nie pochodzi z reject. To może być z czegoś innego (GCal sync? CalendarPage auto-refetch?).

**Fix:** Po fix Problem 4 (slot lookup), powiadomienia będą miały poprawne dane. Jeśli reject nadal blokuje:
- Sprawdzić czy `onOpenChange(false)` w `handleReject` prawidłowo zamyka modal
- Sprawdzić czy error w `onUpdate` jest łapany (brak try-catch wokół pętli w handleReject)

Dodać try-catch wokół reject:
```typescript
try {
  await onUpdate(slot.id, { status: 'available', ... });
} catch (err) {
  console.error('Reject update failed:', err);
  toast.error('Failed to reject booking');
  return; // Don't close modal on error
}
```

**Pliki:** `src/components/calendar/SlotDetailModal.tsx`

---

## Problem 6: Scroll Today — scrolluje na dół

**Root cause:** `scrollToToday` linia 226-243 w `StudentBookingsSection.tsx`:
```typescript
for (let i = 0; i < allDateEls.length; i++) {
  const d = allDateEls[i].getAttribute('data-date') || '';
  if (d >= todayStr) targetIdx = i;
  else break;
}
```

W desc order: elementy na górze mają PRZYSZŁE daty (największe), na dole PRZESZŁE (najmniejsze). Iteracja od 0 (góra). Pierwszy element ma datę np. 2026-04-15 >= 2026-04-04 → `targetIdx = 0`. Potem 2026-04-10 >= 2026-04-04 → `targetIdx = 1`. Itd. aż trafimy na datę < today → `break`.

Więc `targetIdx` to OSTATNI element z datą >= today = najbliższy do "today" ale w przyszłości. Potem `offsetIdx = max(0, targetIdx - 2)`.

**Problem:** Jeśli jest dużo przyszłych dat, `targetIdx` może być duży. Ale logika wydaje się poprawna — szukamy granicy today/past. 

ALE: `else break` jest problematyczny. W desc order, daty powinny iść 2026-04-15, 2026-04-12, 2026-04-10, 2026-04-05, **2026-04-04** (today), 2026-04-01. Loop: idx=0 (04-15 >= 04-04 ✓, targetIdx=0), idx=1 (04-12 >= ✓, targetIdx=1), ... idx=4 (04-04 >= ✓, targetIdx=4), idx=5 (04-01 < 04-04 → break). Więc targetIdx=4, offsetIdx=2. Element [2] to np. 2026-04-10. scrollIntoView block:'start' — scrolluje element na górę widoku.

To powinno działać poprawnie... Chyba że `allDateEls` nie ma atrybutu `data-date` lub elementy nie mają prawidłowych dat.

Sprawdźmy jak karty są renderowane:

Muszę zobaczyć render booking card z `data-date`:

**Pliki:** `src/components/calendar/StudentBookingsSection.tsx` (sprawdzę render)

---

## Problem 7: Google Calendar OAuth — "nie zweryfikowana przez Google"

**To NIE jest bug w kodzie.** To jest status weryfikacji w Google Cloud Console. Redirect URI jest już dodany (problem 8 z poprzedniego planu). Teraz trzeba zweryfikować aplikację.

**Instrukcja:**
1. Google Cloud Console → APIs & Services → OAuth consent screen
2. Uzupełnij: App name = "Edooqoo", Support email, Logo
3. Dodaj Privacy Policy: `https://edooqoo.com/privacy`
4. Dodaj Terms of Service: `https://edooqoo.com/terms`  
5. Kliknij "Submit for Verification"

**Wymagane strony w aplikacji:** Trzeba stworzyć `/privacy` i `/terms` (proste strony statyczne). Bez nich Google nie zaakceptuje weryfikacji.

**Pliki:** Nowe: `src/pages/PrivacyPolicy.tsx`, `src/pages/TermsOfService.tsx`, + routing w `App.tsx`

---

## Problem 9: Discount % w UnifiedSlotModal

**Obecny stan:** Pole "Discount %" jest renderowane TYLKO dla `slotType === 'available' && mode === 'single'` (linia 592-603). To JEST w Add Slot. Ale na stronie nauczyciela `/calendar` w `CalendarSlotCard` nie ma wizualnego badge z discount.

**Co dodać w CalendarSlotCard.tsx:**
```tsx
{/* Discount badge */}
{(slot as any).discount_percent > 0 && (
  <span className="absolute top-0 right-0 text-[8px] font-bold text-red-600 bg-red-50 rounded-bl px-0.5 z-10">
    -{(slot as any).discount_percent}%
  </span>
)}
```

Dodać po selection checkbox overlay (linia 101).

**Pliki:** `src/components/calendar/CalendarSlotCard.tsx`

---

## Podsumowanie zmian

| Plik | Zmiana |
|------|--------|
| `src/pages/Dashboard.tsx` | Info-box o Student Hub |
| `src/pages/StudentPage.tsx` | Info-box o Student Hub + `hasGcal` prop dla MeetingLinkField + fetch gcal status |
| `src/hooks/usePublicBooking.tsx` | Fix slot lookup (fetch z DB gdy nie w `slots`) |
| `src/components/calendar/SlotDetailModal.tsx` | Try-catch w handleReject, sprawdzić render reject dialog |
| `src/components/calendar/StudentBookingsSection.tsx` | Debug/fix scrollToToday |
| `src/components/calendar/CalendarSlotCard.tsx` | Discount badge |
| `src/pages/PrivacyPolicy.tsx` | NOWY — strona Privacy Policy |
| `src/pages/TermsOfService.tsx` | NOWY — strona Terms of Service |
| `src/App.tsx` | Routes dla /privacy i /terms |

## Co NIE jest zmianą w kodzie
- Problem 7: weryfikacja Google wymaga ręcznej akcji w Google Cloud Console + dodania stron /privacy i /terms
- Problem 2: w dużej mierze rozwiązany w poprzednich commitach, wymaga weryfikacji

## Co NIE zmienia się
- SM-2, flashcards, homework — bez zmian
- RLS — bez zmian
- Tabele DB — bez zmian
- Edge Functions — bez zmian (chyba że weryfikacja wykaże brak meeting link)

