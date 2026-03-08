

# Plan wdrożenia: Landing Page "Product-First" dla edooqoo

## Wizualna struktura — Desktop (anonimowy)

```text
┌─────────────────────────────────────────────────────────────┐
│  STICKY NAV (h-14, white/blur, always visible)               │
│  edooqoo          Pricing          Log in   [Start Free 🟢] │
├─────────────────────────────────────────────────────────────┤
│  HERO HEADLINE — bg gradient violet-50 → white               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         [pill] ✨ AI Worksheet Generator               │  │
│  │                                                        │  │
│  │   "Create personalized English lessons                 │  │
│  │    in 2 minutes"                                       │  │
│  │                                                        │  │
│  │   29 exercise types · Audio & pictures ·               │  │
│  │   Ready in 2 min · No signup needed                    │  │
│  │                                                        │  │
│  │   ★★★★★ "Saves me 10h/week" — 200+ teachers          │  │
│  └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  FORMULARZ w premium karcie (shadow-xl, max-w-5xl)           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  "Describe your lesson — AI handles the rest"          │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │         WorksheetForm (ZERO ZMIAN w logice)      │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  "No signup needed. No credit card. Just try it."      │  │
│  └────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  STATS BAR — 3 liczby w jednej linii                         │
│  2,000+ worksheets  │  29 exercise types  │  15+ countries   │
├─────────────────────────────────────────────────────────────┤
│  VALUE CARDS — "Everything you need to teach better"         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ ✨ 29 Types  │ │ 👥 Student   │ │ 📊 Progress  │         │
│  │              │ │ Hub          │ │ Analytics    │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ECOSYSTEM — "More than a worksheet generator"               │
│  6 mini-kart w grid 2x3                                      │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐      │
│  │ ⚡ Live       │ │ 📝 Homework   │ │ 🧠 Flashcards │      │
│  │ Sessions      │ │ + AI Grading  │ │ SM-2          │      │
│  ├───────────────┤ ├───────────────┤ ├───────────────┤      │
│  │ 📅 Lesson     │ │ 🧪 Welcome    │ │ 📤 Share &    │      │
│  │ Calendar      │ │ Test          │ │ Collaborate   │      │
│  └───────────────┘ └───────────────┘ └───────────────┘      │
├─────────────────────────────────────────────────────────────┤
│  TESTIMONIALS — 3 karty z cytatami                           │
├─────────────────────────────────────────────────────────────┤
│  PRICING — istniejący PricingSection (ZERO ZMIAN)            │
├─────────────────────────────────────────────────────────────┤
│  FINAL CTA — violet gradient                                 │
│  "Ready to save 10+ hours this week?"                        │
│  [Create Your First Worksheet — Free]                        │
├─────────────────────────────────────────────────────────────┤
│  FOOTER (istniejący GlobalFooter, ZERO ZMIAN)                │
└─────────────────────────────────────────────────────────────┘
```

## Zalogowany użytkownik

```text
┌────────────────────────────────────────────────────────────┐
│ NAV: edooqoo  Token:5  Dashboard  Profile  GCal  🔔       │
├────────────────────────────────────────────────────────────┤
│ "Create a new worksheet"                                   │
│ ┌────────────────────────────────────────────────────────┐ │
│ │         WorksheetForm (identyczny)                     │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌──────────────────────────┐
│ edooqoo           [≡]    │
├──────────────────────────┤
│ [pill] AI Generator      │
│ Headline (text-3xl)      │
│ Value props (wrap)       │
│ ★★★★★ social proof      │
├──────────────────────────┤
│ WorksheetForm (full w)   │
├──────────────────────────┤
│ Stats (stacked)          │
├──────────────────────────┤
│ Value Cards (1 col)      │
├──────────────────────────┤
│ Ecosystem (1 col)        │
├──────────────────────────┤
│ Testimonials (1 col)     │
├──────────────────────────┤
│ Pricing                  │
├──────────────────────────┤
│ Final CTA                │
├──────────────────────────┤
│ Footer                   │
└──────────────────────────┘
```

---

## Pliki do STWORZENIA (8)

### 1. `src/components/landing/StickyNav.tsx`
- `sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b h-14`
- **Anonimowy**: "edooqoo" gradient | "Pricing" scroll link | `Log in` → /login | `Start Free` violet rounded-full z badge "2 FREE"
- **Zalogowany**: "edooqoo" | Token badge | Dashboard | Profile | GCalStatusButton | HomeworkNotificationBadge
- **Mobile**: hamburger → Sheet (vaul)

### 2. `src/components/landing/HeroHeadline.tsx`
- `bg-gradient-to-b from-violet-50/80 to-white`, centrowany `pt-16 pb-8`
- Pill badge: "AI Worksheet Generator" + Sparkles icon
- Headline: **"Create personalized English lessons in 2 minutes"** — "2 minutes" w violet
- Value props: "29 exercise types · Audio & picture-based · Ready in 2 minutes · No signup needed"
- Social proof: ★★★★★ + "Saves me 10+ hours every week — Used by 200+ teachers"

### 3. `src/components/landing/StatsBar.tsx`
- `bg-white border-y py-8`, 3 statystyki: **2,000+** worksheets | **29** types | **15+** countries

### 4. `src/components/landing/ValueCards.tsx`
- `bg-slate-50 py-12`, nagłówek "Everything you need to teach better"
- 3 karty: **29 Exercise Types** | **Student Hub** | **Progress Analytics**

### 5. `src/components/landing/EcosystemSection.tsx`
- `bg-white py-12`, nagłówek **"More than a worksheet generator"**
- 6 kompaktowych kart w `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`:

| Ikona | Tytuł | Opis |
|-------|-------|------|
| Zap | Live Sessions | Real-time scoring, AI eval |
| BookOpen | Homework + AI Grading | Assign, submit, auto-score |
| Brain | Smart Flashcards | SM-2, auto-generated |
| Calendar | Lesson Calendar | Book + Google Calendar sync |
| ClipboardCheck | Welcome Test | AI placement assessment |
| Share2 | Share & Collaborate | Interactive worksheet links |

### 6. `src/components/landing/TestimonialsRow.tsx`
- `bg-slate-50 py-12`, 3 karty z gwiazdkami + cytat + autor
- Anna K. / Mark T. / Sarah L.

### 7. `src/components/landing/FinalCTA.tsx`
- `bg-gradient-to-br from-violet-600 to-indigo-700 py-12`
- "Ready to save 10+ hours this week?" + white button scroll to form

### 8. `src/hooks/useScrollAnimation.ts`
- IntersectionObserver, zwraca `{ ref, isVisible }`, jednorazowy trigger

---

## Pliki do EDYCJI (3)

### `src/pages/Index.tsx`

**Usuwamy** (linie 220-261): inline `AuthenticatedNav` i `AnonymousNav`
**Usuwamy** (linie 282-322): progress bar Demo→Free→Side-Gig→Full-Time
**Usuwamy importy**: `Lock`, `CheckCircle` (z lucide), `TooltipProvider/Tooltip/TooltipContent/TooltipTrigger`, `DollarSign`

**Nowy return** gdy `!bothWorksheetsReady`:
```
Anonimowy:
  FreeWeekBanner → StickyNav → HeroHeadline →
  div#worksheet-form { FormView variant="landing" } →
  StatsBar → ValueCards → EcosystemSection →
  TestimonialsRow → div#pricing-section { PricingSection } →
  FinalCTA

Zalogowany:
  FreeWeekBanner → StickyNav →
  div max-w-5xl { nagłówek + FormView variant="dashboard" }
```

Tło strony zmiana z `bg-gray-100` na `bg-white`.

`GenerationView`, modale, Welcome Back dialog — **ZERO ZMIAN**.

### `src/components/worksheet/FormView.tsx`

**Nowy prop**: `variant?: 'landing' | 'dashboard'` (default `'dashboard'`)

**Usuwamy importy**: `Sidebar`, `IsometricBackground`, `Link`, `User`, `GraduationCap`

**variant="landing"**:
- `max-w-5xl mx-auto px-4`
- Tekst nad: "Describe your lesson — AI handles the rest"
- Formularz w `bg-white rounded-2xl shadow-xl border p-1`
- Tekst pod: "No signup needed. No credit card. Just try it."

**variant="dashboard"**:
- `max-w-5xl mx-auto`
- WorksheetForm bez shadow/border wrappera

**WorksheetForm** — ZERO ZMIAN. TrackingFormWrapper — zostaje. Coupon dialog — zostaje.

### `src/index.css` — dodajemy na końcu (~12 linii)

```css
.animate-fade-up {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.animate-fade-up.visible { opacity: 1; transform: translateY(0); }
.stagger-1 { transition-delay: 0.1s; }
.stagger-2 { transition-delay: 0.2s; }
.stagger-3 { transition-delay: 0.3s; }
.stagger-4 { transition-delay: 0.4s; }
.stagger-5 { transition-delay: 0.5s; }
.stagger-6 { transition-delay: 0.6s; }
```

---

## Gwarancja stabilności

| Element | Status |
|---|---|
| `WorksheetForm` (639 linii) | **ZERO ZMIAN** |
| `useWorksheetGeneration`, `useWorksheetState` | **ZERO ZMIAN** |
| `useTokenSystem`, `useAuthFlow` | **ZERO ZMIAN** |
| `GenerationView` | **ZERO ZMIAN** |
| `GeneratingModal`, `TokenPaywallModal` | **ZERO ZMIAN** |
| `PricingSection` (411 linii) | **ZERO ZMIAN** |
| Welcome Back Modal | **ZERO ZMIAN** |
| Routing w App.tsx | **ZERO ZMIAN** |
| `GlobalFooter` | **ZERO ZMIAN** |
| `Sidebar.tsx`, `IsometricBackground.tsx` | Pliki zostają, po prostu nie importowane |

## Dokumentacja do aktualizacji (7)
README.md, TECHNICAL_DOCUMENTATION.md, USER_GUIDE_SHORT.md, USER_GUIDE_DETAILED.md, BUSINESS_ANALYSIS.md, DEVELOPMENT_ROADMAP.md, CURRENT_STATE_ANALYSIS.md

