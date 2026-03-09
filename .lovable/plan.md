

## Analiza 4 problemów

### Problem 1: Za mało przestrzeni między trust badges a tickerem
`HeroHeadline.tsx` linia 66: CTA area div ma `gap-3 mb-3`. Margines `mb-3` (12px) między przyciskiem/badges a tickerem jest za mały. Fix: zmienić `gap-3 mb-3` → `gap-4 mb-5`.

### Problem 2: "evenings" nie zawsze w 2 liniach
Linia 53 w `HeroHeadline.tsx`:
```tsx
{' '}evenings <br className="hidden md:block" />
```
`hidden md:block` ukrywa `<br>` na mobilnych — przez co `on lesson prep.` nie łamie się na nową linię. Fix: usunąć `hidden md:block`, zostawić tylko `<br />` — zawsze wymusi zaraz po "evenings".

### Problem 3: Białe tło dla zalogowanych — zweryfikowanie
Użytkownik ma rację. Dla niezalogowanych `HeroHeadline` zawiera absolutnie pozycjonowany `radial-gradient` od violet-100/50 do tła — tworzy ciepły efekt. Dla zalogowanych `FormView` renderuje się na czystym `bg-background` (off-white) bez żadnej dekoracji. Sterylne.

Outer wrapper w `Index.tsx` linia 196: `<div className="min-h-screen bg-background relative">`. Fix: zmienić na `bg-gradient-to-br from-background to-secondary/20` — subtelny gradient taki sam jak na Dashboard.tsx i Profile.tsx. Nie zakłóci landing page bo `HeroHeadline` i tak ma własny nadpisujący gradient (`-z-10`).

### Problem 4: Free Demo — nieprawdziwa lista features
Wg użytkownika: **wszystkie plany mają wszystkie funkcje**, różni się tylko liczba tokenów.
Aktualny stan (linie 353–379): Free Demo ma 6 features — brakuje: Live Session mode, Homework Assignments, Student Knowledge tracking.
Badge linia 346: `"2 free tokens + limited access"` — nieprawdziwe.

Fix:
1. Badge: `"2 free tokens + limited access"` → `"2 free worksheets to start"`
2. Dodać 3 brakujące features do Free Demo karty (po "Draw on Worksheet")
3. Description karty (linia 338): `"Try our worksheet generator"` → `"Start teaching smarter today"` (nie sugeruje ograniczeń)

---

## Pliki do edycji

| Plik | Zmiana |
|------|--------|
| `src/components/landing/HeroHeadline.tsx` | `gap-3 mb-3` → `gap-4 mb-5` na CTA div; usunąć `hidden md:block` z `<br>` |
| `src/pages/Index.tsx` | `bg-background` → `bg-gradient-to-br from-background to-secondary/20` (1 zmiana) |
| `src/pages/Pricing.tsx` | Badge text, card description, dodać 3 features do Free Demo |

**Zero zmian:** logika formularza, auth, generowanie, WorksheetForm, Dashboard, StickyNav, tailwind.config.ts

