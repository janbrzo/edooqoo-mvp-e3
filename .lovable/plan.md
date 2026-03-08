

# Problem: redirect_uri_mismatch na Student GCal Connect

## Diagnoza

Edge function `student-gcal-auth-start` buduje `redirectUri` z `origin` przekazanego przez frontend:

```
redirectUri = `${origin}/my/${teacherToken}/settings`
```

Na preview URL to daje:
```
https://preview--edooqoo-mvp-e3.lovable.app/my/e7c9641.../settings
```

Ten URL musi być **dokładnie** zarejestrowany w Google Cloud Console jako "Authorized redirect URI" w konfiguracji OAuth Client ID. Jeśli go tam nie ma → `redirect_uri_mismatch`.

## Rozwiązanie

To NIE jest problem w kodzie aplikacji — to konfiguracja w Google Cloud Console.

### Kroki do wykonania (przez Ciebie w Google Cloud Console):

1. Otwórz [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Kliknij na swój OAuth 2.0 Client ID
3. W sekcji **Authorized redirect URIs** dodaj WSZYSTKIE warianty URL-i, z których ktoś może wracać po OAuth:

```
https://preview--edooqoo-mvp-e3.lovable.app/my/e7c9641827134ee4b923f43a11ab7c3b5431fd461bac4eef812571ef12640b3c/settings
```

**Problem**: Każdy nauczyciel ma inny `teacherToken`, więc redirect URI jest dynamiczny. Google wymaga dokładnych URI — nie obsługuje wildcardów w ścieżce.

### Lepsze rozwiązanie (zmiana w kodzie):

Zamiast dynamicznego redirect URI per teacher, użyć **stałego** redirect URI np. `/gcal-student-callback`, a `teacherToken` przekazać przez `state` (już jest w state!). Po powrocie z Google, strona callback odczyta `state`, wyciągnie `teacherToken` i przekieruje do właściwego settings.

### Plan zmian:

| # | Plik | Zmiana |
|---|---|---|
| 1 | `supabase/functions/student-gcal-auth-start/index.ts` | Zmienić `redirectUri` na stały: `${origin}/gcal-student-callback` |
| 2 | `src/pages/GCalStudentCallback.tsx` | **NOWY** — strona która odczytuje `code` + `state` z URL, wywołuje `student-gcal-auth-callback`, potem redirectuje do `/my/${teacherToken}/settings` |
| 3 | `src/App.tsx` | Dodać route `/gcal-student-callback` |
| 4 | `src/pages/StudentHubSettings.tsx` | Usunąć obsługę OAuth callback (code w searchParams) — przeniesiona do osobnej strony |
| 5 | Google Cloud Console | Dodać **jeden** stały redirect URI: `https://edooqoo-mvp-e3.lovable.app/gcal-student-callback` + preview wariant |

### Szczegóły implementacji:

**`student-gcal-auth-start/index.ts`** — linia 29:
```ts
// BYŁO:
const redirectUri = `${origin}/my/${teacherToken}/settings`;
// BĘDZIE:
const redirectUri = `${origin}/gcal-student-callback`;
```

**`GCalStudentCallback.tsx`** (nowy):
```tsx
// Odczytaj ?code= i ?state= z URL
// Z state wyciągnij { email, teacherToken }
// Wywołaj student-gcal-auth-callback z: code, redirectUri=origin+'/gcal-student-callback', email, teacherToken
// Po sukcesie: navigate('/my/${teacherToken}/settings?gcal=connected')
// Po błędzie: pokaż toast z błędem i navigate do settings
```

**`StudentHubSettings.tsx`** — usunąć useEffect z linii ~52-60 (obsługa `code` w searchParams) i `handleOAuthCallback`. Zamiast tego sprawdzać `?gcal=connected` i pokazywać toast.

**Google Cloud Console** — dodać URI:
- `https://edooqoo-mvp-e3.lovable.app/gcal-student-callback`
- `https://preview--edooqoo-mvp-e3.lovable.app/gcal-student-callback`

Analogicznie sprawdzić czy teacher GCal auth (`gcal-auth-start`) ma ten sam problem z dynamicznym redirect URI i potencjalnie naprawić tak samo.

