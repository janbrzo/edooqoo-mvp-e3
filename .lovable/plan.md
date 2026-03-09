## Analiza obecnego stanu

### Problem 1: Animacja dni tygodnia

W `HeroHeadline.tsx` linia 30: tekst `Sunday` jest statyczny w nagłówku `<h1>`. Chodzi o to, żeby słowo `Sunday` przewijało się pionowo (fade up/down) przez wszystkie dni tygodnia. 

### Problem 2: Generator niewidoczny na pierwszym ekranie

Patrząc na screenie — widać hero (headline + CTA + unlock features) a formularz dopiero po scrollowaniu. Przestrzeń na ekranie 1080px zajmuje:

- Nav: 56px (h-14)
- Hero section: `pt-14 pb-4` + h1 (~7rem font) + p + button + trust badges + unlock features block ≈ ~540px
- Razem hero ≈ 600px, formularz zaczyna się dopiero poniżej

Cel: skrócić hero tak żeby `Create A Worksheet` z przyciskami `45min/60min` i `A1/A2/B1/B2/C1/C2` było widoczne na ekranie bez scrollowania (~100px top form visible).

Formularz sam w sobie zaczyna się od `WorksheetForm/index.tsx` linia 327–373 — ten nagłówek "Create A Worksheet" + przyciski duration/level.

**Unlock features ticker**: zamiast statycznego bloku `flex-wrap`, przewijający się poziomo ticker (marquee/CSS animation) z 6 features. Jeden rząd, nie łamie się, mieści na każdej szerokości.

### Problem 3: Dashboard widok dla zalogowanych

W `Index.tsx` linie 234-242: zalogowani widzą div z h1 "Create a new worksheet" + p "Describe your lesson...". Usunąć ten div - zostawić tylko `<FormView>`.

---

## Plan implementacji

### Zmiana 1: Animacja dni tygodnia w `HeroHeadline.tsx`

**Mechanizm:** `useState` + `useEffect` z `setInterval` co 2000ms, tablica 7 dni, index przełącza się cyklicznie. Animacja CSS: stary dzień wylatuje w górę (`-translate-y-full opacity-0`), nowy wpada od dołu (`translate-y-full → translate-y-0`). Czas trwania animacji: 400ms.

**Implementacja:**

```tsx
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const [dayIndex, setDayIndex] = useState(0);
const [animating, setAnimating] = useState(false);

useEffect(() => {
  const interval = setInterval(() => {
    setAnimating(true);
    setTimeout(() => {
      setDayIndex(i => (i + 1) % 7);
      setAnimating(false);
    }, 350);
  }, 2200);
  return () => clearInterval(interval);
}, []);
```

W JSX zamienić statyczne `Sunday` na:

```tsx
<span className="relative inline-block overflow-hidden h-[1.1em] align-bottom">
  <span
    key={dayIndex}
    className={`inline-block transition-all duration-350 ${
      animating ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
    }`}
  >
    {days[dayIndex]}
  </span>
</span>
```

Nagłówek staje się: `Stop wasting [animowany dzień] evenings`

---

### Zmiana 2a: Skrócenie Hero żeby formularz był widoczny

**Strategia:** Zmniejszyć rozmiary w `HeroHeadline.tsx`:

- Sekcja: `pt-14 pb-4` → `pt-10 pb-2`  
- h1: `text-5xl md:text-6xl lg:text-7xl` → `text-4xl md:text-5xl lg:text-6xl`, `mb-6` → `mb-3`
- Subheadline `p`: `mb-8` → `mb-4`
- CTA area div: `gap-5 mb-6` → `gap-3 mb-3`
- Trust badges div: `gap-6` → `gap-4`
- Unlock features block: zmienić na ticker (patrz 2b), to skróci wysokość

Efekt: hero powinien zmniejszyć się z ~540px do ~380px, a przy nav 56px, formularz zacznie się na ~436px → widoczny na ekranie 768px+.

---

### Zmiana 2b: Ticker poziomy zamiast statycznego gridu features

**Mechanizm:** CSS `@keyframes marquee` — duplikujemy listę 2x i animujemy `translateX(-50%)` w pętli. Standardowy pattern "infinite marquee" używany przez setki stron. Nie wymaga żadnego nowego pakietu.

**Dodać do `HeroHeadline.tsx**` lub globalnego CSS:

```css
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee 18s linear infinite;
}
```

Ponieważ tailwind nie ma `animate-marquee` out-of-the-box, dodamy inline style lub rozszerzymy `tailwind.config.ts`.

**W `tailwind.config.ts**` dodać:

```js
keyframes: {
  marquee: {
    '0%': { transform: 'translateX(0)' },
    '100%': { transform: 'translateX(-50%)' },
  },
},
animation: {
  'marquee': 'marquee 20s linear infinite',
},
```

**JSX w `HeroHeadline.tsx**` — zamienić `div className="inline-flex flex-col..."` na:

```tsx
<div className="w-full max-w-2xl mx-auto overflow-hidden border border-border rounded-2xl bg-secondary/60 py-2.5">
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-1.5 px-4">
    Create a free account to unlock
  </p>
  <div className="flex overflow-hidden">
    <div className="flex animate-marquee whitespace-nowrap gap-0">
      {[...unlockFeatures, ...unlockFeatures].map(({ icon: Icon, label }, i) => (
        <div key={i} className="flex items-center gap-1.5 text-sm text-foreground/80 mx-4 shrink-0">
          <Icon className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
          <span>{label}</span>
          <span className="ml-4 text-border">·</span>
        </div>
      ))}
    </div>
  </div>
</div>
```

---

### Zmiana 3: Usunąć nagłówek dla zalogowanych w `Index.tsx`

**Lokalizacja:** `Index.tsx` linie 234–251

**Przed:**

```tsx
<div className="max-w-5xl mx-auto px-4 pt-8 pb-16">
  <div className="text-center mb-6">
    <h1 className="text-2xl font-bold text-foreground">
      Create a new worksheet
    </h1>
    <p className="text-muted-foreground text-sm mt-1">
      Describe your lesson and AI will generate exercises
    </p>
  </div>
  <FormView ... />
</div>
```

**Po:**

```tsx
<div className="max-w-5xl mx-auto px-4 pt-4 pb-16">
  <FormView 
    onSubmit={handleGenerateWorksheet} 
    userId={user?.id || null} 
    onStudentChange={setSelectedStudentId}
    preSelectedStudent={preSelectedStudent}
    isRegisteredUser={true}
    variant="dashboard"
  />
</div>
```

Formularz sam z siebie renderuje "Create A Worksheet" w swoim nagłówku (linia 334 WorksheetForm/index.tsx), więc użytkownik nie traci kontekstu.

---

## Pliki do edycji


| Plik                                      | Zmiana                                              |
| ----------------------------------------- | --------------------------------------------------- |
| `src/components/landing/HeroHeadline.tsx` | Animacja dni, ticker, skrócenie paddings            |
| `tailwind.config.ts`                      | Dodanie keyframes `marquee` i `animation`           |
| `src/pages/Index.tsx`                     | Usunięcie nagłówka dla zalogowanych (linie 235–242) |


**Zero zmian w:** WorksheetForm logice, ExerciseSelector, auth, generowaniu, EcosystemSection.

---

## Szczegóły techniczne — bezpieczeństwo zmian

1. **Animacja dni:** czysta React state + CSS transition — nie dotyka żadnej logiki formularza ani routingu
2. **Ticker:** czysty CSS animation na elemencie dekoracyjnym — nie dotyka logiki aplikacji
3. **Usunięcie nagłówka:** usunięcie 2 linii tekstu z `<div>` który nie ma żadnego id, ref ani event handlera — zero efektów ubocznych
4. **tailwind.config.ts:** dodanie nowych kluczy `keyframes/animation` — bezpieczne, nie usuwa istniejących wartości