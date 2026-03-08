

# Problem: Hero section jest niewidoczna (opacity: 0)

## Przyczyna

`HeroHeadline.tsx` używa klas CSS `animate-fade-up`, `stagger-1`, `stagger-2`, `stagger-3` na 4 elementach. Te klasy ustawiają `opacity: 0` w CSS. Klasa `.visible` nigdy nie jest dodawana, bo hook `useScrollAnimation` **nie jest użyty** w tym komponencie.

Hero jest **nad foldem** — nie powinien mieć scroll-triggered animation. Powinien być widoczny natychmiast.

## Fix — 1 plik

### `src/components/landing/HeroHeadline.tsx`

Usunąć klasy `animate-fade-up` i `stagger-*` z wszystkich 4 elementów:

- Linia 8: `animate-fade-up` → usunąć
- Linia 14: `animate-fade-up stagger-1` → usunąć
- Linia 20: `animate-fade-up stagger-2` → usunąć
- Linia 25: `animate-fade-up stagger-3` → usunąć

Hero renderuje się od razu, widoczny natychmiast. Zero logiki do zmiany.

## Co działa poprawnie (nie ruszamy)

- `ValueCards.tsx` — używa `useScrollAnimation` + `isVisible` ✅
- `EcosystemSection.tsx` — używa `useScrollAnimation` + `isVisible` ✅
- `TestimonialsRow.tsx` — używa `useScrollAnimation` + `isVisible` ✅
- `StatsBar.tsx` — brak animacji, zawsze widoczny ✅
- `FinalCTA.tsx` — brak animacji, zawsze widoczny ✅

## Efekt

Cała góra strony (pill badge, headline, value props, social proof) będzie widoczna natychmiast po załadowaniu. Reszta sekcji poniżej foldu animuje się poprawnie przy scrollu.

