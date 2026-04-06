
# Plan: Naprawa batch generation meeting linków

## Problem
Migracja ustawiła `meeting_link_mode = 'custom'` dla wszystkich istniejących rekordów w `calendar_student_settings`. Batch generation pomija studentów z `mode = 'custom'`, nawet jeśli NIE mają żadnego linku. Efekt: "Google Meet rooms created for 0 students".

## Rozwiązanie

### Zmiana w `src/pages/CalendarSettingsPage.tsx`, linia 448

**Obecny kod:**
```ts
if ((existing as any)?.meeting_link_mode === 'custom') continue;
```

**Nowy kod:**
```ts
if ((existing as any)?.meeting_link_mode === 'custom' && (existing as any)?.default_meeting_link) continue;
```

Logika: pomijamy studenta TYLKO gdy jest w trybie custom **I** ma ustawiony jakiś link. Jeśli jest w custom ale link jest pusty — to znaczy, że to legacy z migracji i powinien dostać wygenerowany Google Meet room.

### Dodatkowa zmiana: po wygenerowaniu linku, ustaw `meeting_link_mode = 'default'`

Obecnie edge function `gcal-sync` (`create_permanent_room`) przy tworzeniu nowego rekordu `calendar_student_settings` nie ustawia jawnie `meeting_link_mode`. Trzeba upewnić się, że po batch generation student jest w trybie `default`.

To już jest obsłużone w edge function (linia w bloku `if (!css)` — insert z `meeting_link_mode: 'default'`). Ale dla istniejących rekordów z `mode = 'custom'` i pustym linkiem, edge function robi update i NIE zmienia `meeting_link_mode`. 

**Fix w edge function `gcal-sync/index.ts`**, w bloku `create_permanent_room`, po sekcji gdzie `css` istnieje i robimy update — dodać `meeting_link_mode: 'default'` do `updateData` gdy obecny mode to `'custom'` i brak `default_meeting_link`:

**Obecny kod (linia ~146-148 w edge function):**
```ts
const updateData: any = { generated_meeting_link: meetLink };
if (!css || css.meeting_link_mode === 'default') {
  updateData.default_meeting_link = meetLink;
  updateData.meeting_link_mode = 'default';
}
```

**Nowy kod:**
```ts
const updateData: any = { generated_meeting_link: meetLink };
if (!css || css.meeting_link_mode === 'default' || !css.default_meeting_link) {
  updateData.default_meeting_link = meetLink;
  updateData.meeting_link_mode = 'default';
}
```

Dodane `|| !css.default_meeting_link` — jeśli student jest w custom ale nie ma żadnego linku, traktujemy to jako "brak wyboru" i ustawiamy default z wygenerowanym linkiem.

## Pliki do zmiany
| Plik | Linia | Zmiana |
|------|-------|--------|
| `src/pages/CalendarSettingsPage.tsx` | 448 | Dodać `&& (existing as any)?.default_meeting_link` do warunku skip |
| `supabase/functions/gcal-sync/index.ts` | ~146 | Dodać `\|\| !css.default_meeting_link` do warunku ustawiania default |

## Pliki do aktualizacji docs
- `docs/llm-context.md` — dodać info o logice batch skip
- `llms.txt` — j.w.

## Czego NIE ruszamy
- Logiki upsert/delete/cancel w gcal-sync
- StudentPage.tsx (przełączanie Default/Custom działa)
- Żadnych migracji DB
- Żadnych innych plików
