

## DIAGNOZA — Dlaczego przyciski wyglądają niespójnie

### Główny problem: kolor `--primary` jest za jasny

W pliku `src/index.css` zmienna `--primary` jest ustawiona na `255 85% 76%` — to **jasny, pastelowy lawendowy kolor** (`#9b87f5`). Przez to każdy standardowy przycisk (`Button` bez jawnie podanego koloru) wygląda na wypłowiały i nieprzemyślany, zamiast deep violet jakiego się spodziewamy.

### Trzy różne odcienie fioletu w aplikacji (źródło chaosu):

```
1. --primary (bg-primary) = HSL 255 85% 76% = #9b87f5  ← JASNY pastelowy
2. bg-worksheet-purple    = #9b87f5                    ← IDENTYCZNY z primary!
3. bg-violet-600 Tailwind = #7c3aed                    ← GŁĘBOKI, nasycony violet
```

- **StickyNav "Start Free"** → używa `bg-violet-600` (głęboki)
- **Hero CTA "Generate Your First Worksheet"** → używa `default` variant → `bg-primary` (pastelowy)
- **Pricing buttons** → `default` variant → `bg-primary` (pastelowy)
- **Login button** → `default` variant → `bg-primary` (pastelowy)
- **Signup button** → `bg-worksheet-purple` (pastelowy, = primary)

**Wniosek**: Użytkownik słusznie zauważył, że Hero CTA wygląda "inaczej" — bo jest `rounded-full` (pill shape) zamiast `rounded-md`, PLUS ma pastelowy kolor zamiast głębokiego. Różni się też od "Start Free" w navbarze, który ma `bg-violet-600`.

---

## PLAN WDROŻENIA — 5 zmian, 4 pliki

### Zmiana 1: Naprawić kolor `--primary` w `src/index.css`
**Najbardziej impaktowa zmiana — naprawia WSZYSTKIE przyciski naraz**

Zmienić `--primary` z pastelowego na głęboki violet odpowiadający dokładnie `violet-600` (`#7c3aed` ≈ HSL 262, 83%, 58%):

```css
/* LIGHT MODE - przed */
--primary: 255 85% 76%;
--ring: 255 85% 76%;

/* LIGHT MODE - po */
--primary: 262 83% 58%;
--ring: 262 83% 58%;

/* DARK MODE - przed */
--primary: 255 85% 76%;
--primary-foreground: 222.2 47.4% 11.2%; /* ciemny tekst na jasnym tle - BUG! */
--ring: 212.7 26.8% 83.9%;

/* DARK MODE - po */
--primary: 262 83% 58%;
--primary-foreground: 210 40% 98%;  /* biały tekst na ciemnym tle - poprawne! */
--ring: 262 83% 58%;
```

> Uwaga: W dark mode zmiana `--primary-foreground` z ciemnego na biały jest konieczna — ciemny tekst na głębokim fiolecie jest nieczytelny.

**Efekt**: Automatycznie naprawia:
- Pricing buttons (Free/Side-Gig/Full-Time)
- Login button
- Dashboard "Generate Worksheet" button
- "Add Student" button
- Wszystkie inne przyciski `default` variant

---

### Zmiana 2: Gradient na Hero CTA w `src/components/landing/HeroHeadline.tsx`

Aktualny button line 70-77 używa `default` variant — po zmianie primary będzie głęboki fiolet (dobrze), ale **można go ulepszyć** do nowoczesnego gradientu:

```tsx
// PRZED (line 70-77):
<Button
  onClick={scrollToForm}
  size="lg"
  className="h-14 px-8 text-lg font-semibold rounded-full shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200"
>

// PO:
<Button
  onClick={scrollToForm}
  size="lg"
  className="h-14 px-8 text-lg font-semibold rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all duration-200"
>
```

Gradient `violet-600 → indigo-600` to współczesny standard (jak Notion, Linear, Vercel). Spójny z gradientem w logo "edooqoo" i tekście nagłówka.

---

### Zmiana 3: Naprawić Signup button w `src/pages/Signup.tsx`

Linia 187-190 używa `bg-worksheet-purple hover:bg-worksheet-purpleDark` — pastelowy kolor, niezgodny z identity. Po zmianie primary ten button powinien po prostu używać `default` variant:

```tsx
// PRZED:
<Button 
  type="submit" 
  className="w-full bg-worksheet-purple hover:bg-worksheet-purpleDark"
  disabled={loading}
>

// PO:
<Button 
  type="submit" 
  className="w-full"
  disabled={loading}
>
```

---

### Zmiana 4: Naprawić PaymentSuccess.tsx buttons

Dwa miejsca (`line 147` i `line 186`) używają `bg-worksheet-purple hover:bg-worksheet-purpleDark`. Po zmianie primary usunąć override:

```tsx
// PRZED:
<Button onClick={handleReturnToWorksheet} className="bg-worksheet-purple hover:bg-worksheet-purpleDark">

// PO:
<Button onClick={handleReturnToWorksheet}>
```

---

### Zmiana 5: Uprościć StickyNav "Start Free" w `src/components/landing/StickyNav.tsx`

Aktualnie hardcoded `bg-violet-600` — po zmianie primary (`--primary` = violet-600) można to uprościć do `default` variant z `rounded-full`, ale skoro `bg-violet-600` daje dokładnie ten sam efekt — **zostawiamy bez zmian** (zero ryzyka regresji).

---

## CO NIE JEST ZMIENIANE (celowo)

| Element | Dlaczego zostawiamy |
|---|---|
| `FinalCTA.tsx` white button | Białe tło na ciemnym sekcji — intentional, piękne |
| `outline` / `ghost` buttons | Spójne i dobre as-is |
| `WorksheetContainer.tsx` floating buttons | Wewnętrzne narzędzia worksheet — mają `worksheet-purple` celowo |
| `StudyModeButton.tsx` | Specjalny duży circular button — `worksheet-purple` celowo |
| Wszystkie inne `worksheet-purple` w wewnętrznej app | Spójna identyfikacja wizualna edytora |

---

## Podsumowanie plików do edycji

| Plik | Zmiana |
|---|---|
| `src/index.css` | Fix `--primary` + `--ring` + dark mode `--primary-foreground` |
| `src/components/landing/HeroHeadline.tsx` | Dodać gradient do Hero CTA |
| `src/pages/Signup.tsx` | Usunąć `bg-worksheet-purple` override |
| `src/pages/PaymentSuccess.tsx` | Usunąć `bg-worksheet-purple` override (x2) |

**Zero ryzyka dla funkcjonalności** — zmieniamy wyłącznie klasy CSS, żadnej logiki.

