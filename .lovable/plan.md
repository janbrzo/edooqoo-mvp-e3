

# Plan: Naprawa Meeting Link — deploy edge function + fix logiki create_permanent_room

## Diagnoza

Znaleziono 3 bugi, które razem powodują, że generowanie meeting linków w ogóle nie działa:

### Bug 1: Edge function `gcal-sync` nie jest zdeployowana
Konsola pokazuje `POST .../functions/v1/gcal-sync 404 (Not Found)`. Funkcja istnieje w kodzie, ale nie została zdeployowana po ostatnich zmianach. Trzeba ją zdeployować.

### Bug 2: Slot fetch blokuje `create_permanent_room`
W `supabase/functions/gcal-sync/index.ts` linie 72-82:
```
const { data: slot } = await supabase.from('calendar_slots')
  .select('*').eq('id', slotId).single();
if (!slot) return 404 "Slot not found"
```
Ten kod wykonuje się **PRZED** sprawdzeniem `action`. Dla `create_permanent_room` frontend wysyła `slotId: studentId` (bo nie ma prawdziwego slota). Student ID nie jest slotem, więc zapytanie zwraca null i funkcja zwraca 404 zanim w ogóle dojdzie do logiki tworzenia roomu.

### Bug 3: `studentId` nigdy nie jest odczytany
Linia 58: `const { teacherId, slotId, action, colorOverride } = await req.json();` — brak `studentId` w destrukturyzacji.
Linia 134: `const studentId = (await req.clone().json()).studentId;` — `req.body` już skonsumowane na linii 58, `clone()` po konsumpcji nie zadziała poprawnie.

## Rozwiazanie

### Zmiana 1: Fix `gcal-sync/index.ts` — restrukturyzacja flow

Linia 58 — dodac `studentId` do destrukturyzacji:
```ts
const { teacherId, slotId, action, colorOverride, studentId } = await req.json();
```

Przenieść check `action === 'create_permanent_room'` **PRZED** fetch slota (linia 72). Ten action nie potrzebuje slota, potrzebuje tylko `teacherId`, `studentId` i tokenu GCal.

Nowa struktura (pseudokod):
```
parse body → { teacherId, slotId, action, colorOverride, studentId }
create supabase client
get GCal token (early return if missing)

IF action === 'create_permanent_room':
  → validate studentId
  → check existing generated_meeting_link
  → create ghost event → get hangoutLink → delete event
  → save to calendar_student_settings
  → return { success, meetLink }

// Reszta akcji (upsert, delete, cancel) wymaga slota:
fetch slot by slotId
if (!slot) return 404
fetch settings
... reszta logiki bez zmian
```

Usunąć linię 134 (`req.clone().json()`).

### Zmiana 2: Deploy edge function
Po zmianie kodu — zdeployować `gcal-sync`.

### Zmiana 3: Weryfikacja
Przetestować edge function curlem z akcją `create_permanent_room`.

## Pliki do zmiany

| Plik | Co |
|------|-----|
| `supabase/functions/gcal-sync/index.ts` | Dodac `studentId` do destrukturyzacji, przeniesc `create_permanent_room` przed slot fetch, usunac `req.clone()` |

### Zakres zmian — NIE ruszamy:
- Logiki `upsert`, `delete`, `cancel` (działają poprawnie)
- Frontendu (`StudentPage.tsx`, `CalendarSettingsPage.tsx`) — wywołania są poprawne, problem jest po stronie edge function
- Żadnych innych plików

## Kolejnosc implementacji
1. Fix `gcal-sync/index.ts`
2. Deploy `gcal-sync`
3. Test curlem z `create_permanent_room`
4. Update `docs/llm-context.md` i `llms.txt`

