## Analiza 3 pytań

---

### Pytanie 1: Skąd pochodzi białe tło?

Plik `src/index.css` linia 7:

```css
--background: 0 0% 100%;
```

To HSL `hue=0, saturation=0%, lightness=100%` = czysty biały. W `Index.tsx` linia 196:

```tsx
<div className="min-h-screen bg-background relative">
```

To jest **celowe** — to jest shadcn/ui design system, który domyślnie ustawia `--background` jako biały w trybie jasnym. Nie było to losowe. Jest to jednak bardzo "surowe" — wiele landing pages w tej estetyce ma lekki gradient zamiast czystego białego.

**Możliwości zmiany (3 opcje):**

- A: Zostaw białe — czyste, minimalistyczne ✓ (nie robimy nic)
- B: Bardzo jasny szary `0 0% 98%` — mniej sterylne, branżowy standard (Notion, Linear)
- C: Gradient od `violet-50/20` u góry do białego — kojarzy się z premium AI tool

Bezpieczna zmiana: w `index.css` zamienić `--background: 0 0% 100%` na `0 0% 98.5%`. To daje ledwo zauważalny off-white i nie psuje niczego w aplikacji (wszystkie kolory są relatywne do --background).

---

### Pytanie 2: StatsBar — co zamiast danych z dupy?

`StatsBar.tsx` ma 3 hardcoded liczby: `15,000+`, `29`, `200+`.

**Weryfikacja danych:**

- `29` exercise types — **PRAWDA** (policzono z `ExerciseSelector.tsx`: dokładnie 29 wpisów w `AVAILABLE_EXERCISES`, w tym 1 "coming soon")
- `15,000+` godzin — **WYMYŚLONE**, nie da się tego uzasadnić
- `200+` nauczycieli weekly — **WYMYŚLONE**, używane było już w badge którą usunęliśmy

**Plan:** Zastąpić StatsBar 3 uczciwymi, weryfikowalnymi faktami:

```
29               |  2000+            |  LESS THAN 2 min
exercise types   |  worksheets generatd     |  generation time
```

&nbsp;

Zmiana: edytować tylko `stats` tablicę w `StatsBar.tsx`.

---

### Pytanie 3: StickyNav na wszystkich stronach

**Obecny stan:**

- Tylko `/` (Index) ma StickyNav
- Dashboard.tsx: własny ad-hoc header (linia 173–221) — różny styl
- Profile.tsx: własny header (linia 608–640) — różny styl
- Pricing.tsx: własny header (linia 322–378) — różny styl
- PrivacyPolicy, CookiePolicy: brak headerów

**Które strony NIE dostają StickyNav** (mają własne specjalistyczne navi):

- `/my/*` — StudentHubLayout z własnymi tabami
- `/worksheet/:id` — WorksheetToolbar -tu wyjątkowo nie może byc sticky bo drug apnel z przyciskami jest sticky
- `/shared/:token` — teacher toolbar
- `/calendar`, `/calendar/settings` — własne headery z breadcrumbs
- Login, Signup — modalne dialogi na backgroundzie

---

## Plan implementacji

### Krok 1: Zmiana StickyNav.tsx — opcjonalny `scrollToPricing`

**Problem:** `scrollToPricing: () => void` jest wymaganym propem (brak `?`). Na innych stronach nie ma sekcji #pricing do scrollowania.

**Rozwiązanie:**

1. Zmienić interface: `scrollToPricing?: () => void`
2. Dodać `useNavigate()` hook wewnątrz komponentu
3. W buttonie "Pricing": `onClick={() => scrollToPricing ? scrollToPricing() : navigate('/pricing')}`

To jest **bezpieczna zmiana** — istniejące wywołanie w Index.tsx przekazuje prop bez zmian.

### Krok 2: Dashboard.tsx — zastąpić custom header przez StickyNav

Obecny custom header (linia 173–221):

```tsx
<div className="min-h-screen bg-gradient-to-br ...">
  <FreeWeekBanner />
  <div className="container mx-auto px-4 py-8">
    <div className="flex flex-col sm:flex-row justify-between ...mb-8">
      <h1>GraduationCap + {displayName} Dashboard</h1>
      <div>Badge Tokens + Badge Subscription + HomeworkBadge + Calendar + Generate + Profile buttons</div>
    </div>
    {/* stats cards, list etc. */}
  </div>
</div>
```

**Plan:**

- Dodać `<StickyNav isRegisteredUser={true} tokenLeft={tokenLeft} user={user} />` na górze returnu (po `<FreeWeekBanner />`)
- Usunąć custom header div (linie ~180–221)
- Zmienić container: `pt-8` → `pt-4` (mniej miejsca bo StickyNav już jest)
- **ZACHOWAĆ:** "Generate Worksheet" button i Calendar button — przenieść je do wewnątrz strony (np. jako floating action bar pod StickyNav, lub inline w content area)

Uwaga: Dashboard ma `calendarUnread` badge na Calendar buttonie. StickyNav nie ma Calendar linku. Dlatego Calendar button zostanie przeniesiony do content area, nie do StickyNav.

### Krok 3: Profile.tsx — zastąpić custom header przez StickyNav

Obecny header (linia 608–640): `User icon + displayName + Profile title + nav buttons`.

**Plan:**

- Dodać `<StickyNav isRegisteredUser={true} tokenLeft={tokensAvailableForUse} user={user} />`
- Usunąć custom header div
- Dostosować `pt-8` → `pt-4`

### Krok 4: Pricing.tsx — zastąpić custom header przez StickyNav

Obecny header (linia 322–378): linki Dashboard/Profile dla zalogowanych, Login/GetStarted dla niezalogowanych + Badge Balance.

**Plan:**

- Dodać `<StickyNav isRegisteredUser={!!isRegisteredUser} tokenLeft={tokenLeft} user={user} />`
- Usunąć custom header div (linie ~322–378)
- Pricing.tsx ma `useAuthFlow` i `useTokenSystem` — już są, bez dodatkowych importów

### Krok 5: PrivacyPolicy.tsx i CookiePolicy.tsx

Sprawdzić czy mają własny nav. Jeśli nie — dodać StickyNav (anon version: Pricing, Log in, Start Free).

### Krok 6: StatsBar.tsx — zmiana danych

```tsx
const stats = [
  { value: '29', label: 'exercise types available' },
  { value: '$0', label: 'to start, no card needed' },
  { value: '~2 min', label: 'average generation time' },
];
```

### Krok 7: index.css — opcjonalnie złagodzić białe tło

Zmiana `--background: 0 0% 100%` → `0 0% 98.5%` dla trybu jasnego. To jest kosmetyczna zmiana, nie psuje niczego.

---

## Pliki do edycji


| Plik                                   | Zmiana                                           |
| -------------------------------------- | ------------------------------------------------ |
| `src/components/landing/StickyNav.tsx` | `scrollToPricing?` opcjonalne, navigate fallback |
| `src/pages/Dashboard.tsx`              | Dodać StickyNav, usunąć custom header            |
| `src/pages/Profile.tsx`                | Dodać StickyNav, usunąć custom header            |
| `src/pages/Pricing.tsx`                | Dodać StickyNav, usunąć custom header            |
| `src/pages/PrivacyPolicy.tsx`          | Sprawdzić + dodać StickyNav jeśli brak           |
| `src/pages/CookiePolicy.tsx`           | Sprawdzić + dodać StickyNav jeśli brak           |
| `src/components/landing/StatsBar.tsx`  | Zmienić 3 dane na uczciwe                        |
| `src/index.css` (opcjonalne)           | `--background` off-white                         |


**Zero zmian:** WorksheetForm, generowanie, ExerciseSelector, auth logika, StudentHub, WorksheetPage, CalendarPage.

---

## Uwaga na temat Dashboard.tsx

Dashboard ma kilka elementów które są w obecnym custom headerze a nie ma ich w StickyNav:

- "Generate Worksheet" button (+ Plus icon)
- Calendar button z unread badge
- Subscription type badge

Plan dla tych elementów: przenieść do **inline quick-actions bar** tuż pod StickyNav, zamiast w header:

```tsx
<div className="border-b bg-background/80 backdrop-blur-sm py-2 px-6 flex items-center gap-3">
  <Button onClick={handleGenerateWorksheet}><Plus /> Generate Worksheet</Button>
  <Button asChild><Link to="/calendar">Calendar {badge}</Link></Button>
  <Badge>{subscriptionType}</Badge>
</div>
```

Ten pasek jest inline (nie sticky), naturalnie wpada pod nawigację.