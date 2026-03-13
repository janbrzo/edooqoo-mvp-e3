

# Plan: End-to-End Test & Readiness Checklist

## Znalezione problemy

Po dogłębnej analizie kodu zidentyfikowałem następujące problemy, pogrupowane według priorytetu:

---

### PROBLEM 1 (KRYTYCZNY): Masa console.log w produkcji

**Co się dzieje:** W hookach (`useTokenSystem`, `useAuthFlow`, `useWorksheetGeneration`, `useInteractiveHomework` itp.) jest **797+ wywołań console.log** w samych hookach. W produkcji te logi ujawniają wewnętrzne dane: user ID, token balance, subscription status, worksheet IDs, email. To naruszenie bezpieczeństwa i prywatności.

**Rozwiązanie:** Stworzenie utility `src/utils/logger.ts` z funkcją `devLog()` która loguje TYLKO gdy `import.meta.env.DEV === true`. Następnie batch replace `console.log` → `devLog` we wszystkich plikach w `src/hooks/` i `src/components/`. NIE usuwamy logów — po prostu wyciszamy je w produkcji. `console.error` i `console.warn` zostawiamy (są potrzebne do debugowania produkcyjnych problemów).

**Pliki do zmiany:**
- NOWY: `src/utils/logger.ts`
- EDYCJA: ~20 plików w `src/hooks/` i kilka w `src/components/`

---

### PROBLEM 2 (WYSOKI): Wygasła promocja "FREE CHRISTMAS WEEK" wciąż w kodzie

**Co się dzieje:** `src/utils/promoUtils.ts` definiuje daty promocji:
```
FREE_CHRISTMAS_WEEK_START = 2025-12-25
FREE_CHRISTMAS_WEEK_END = 2026-01-04
```

Dziś jest 2026-03-12 — promocja wygasła ponad 2 miesiące temu. Kod sam to obsługuje poprawnie (zwraca `false`), więc nie psuje aplikacji. ALE:
- `FreeWeekBanner` niepotrzebnie sprawdza przy każdym renderze
- Kod promocyjny zaśmieca logikę tokenów
- Nazwy jak "FREE CHRISTMAS WEEK" są hardcoded w wielu plikach

**Rozwiązanie:** NIE usuwamy kodu promocji (może być potrzebny w przyszłości). Ale upewniamy się, że:
1. `isFreeCustomDemoWeek()` zwraca `false` — **już tak jest**, więc nic nie trzeba zmieniać
2. Sprawdzamy czy `FreeWeekBanner` renderuje `null` — **już tak jest**

**Wniosek: Nie wymaga zmian, ale powinno być w checkliście do przeglądu.**

---

### PROBLEM 3 (ŚREDNI): Footer ukryty na "/" ale BLOK B miał dać SEO linki

**Co się dzieje:** W poprzedniej implementacji dodaliśmy `if (location.pathname === '/') return null;` do `GlobalFooter.tsx`. To oznacza, że na głównej stronie Google NIE widzi 30+ wewnętrznych linków z footera. Ale to było świadome życzenie użytkownika — footer nie powinien być widoczny na głównej.

**Rozwiązanie:** Footer jest już ukryty wizualnie za pomocą `return null`. Jeśli chcemy SEO juice z tych linków na stronie głównej bez ich wyświetlania, możemy zamiast `return null` renderować footer z `className="sr-only"` (screen reader only — jest w Tailwind, ukrywa wizualnie ale jest w DOM dla crawlerów). ALE to ryzykowne — Google może uznać to za cloaking. **Zostawiamy obecne rozwiązanie `return null` — jest bezpieczne.**

**Wniosek: Nie wymaga zmian.**

---

### PROBLEM 4 (ŚREDNI): Duplicate `id="worksheet-form"` w FormView

**Co się dzieje:** W `FormView.tsx` (linia 57) jest `<div id="worksheet-form">`, a w `Index.tsx` (linia 213) jest `<div id="worksheet-form">` owijający FormView. To powoduje 2 elementy z tym samym ID w DOM, co łamie standard HTML i może powodować nieprzewidywalne zachowanie `scrollIntoView`.

**Rozwiązanie:** Usunąć `id="worksheet-form"` z `FormView.tsx` linia 57, zostawiając ten w `Index.tsx` linia 213. Scroll do formularza z `HeroHeadline` nadal będzie działać poprawnie.

**Plik:** `src/components/worksheet/FormView.tsx` — usunięcie `id="worksheet-form"` z div na linii 57.

---

### PROBLEM 5 (NISKI): Brak ochrony stron React (Resources, Blog) przed wygaśnięciem session

**Co się dzieje:** Strony `/resources` i `/blog` to publiczne strony React. Nie wymagają auth, więc nie ma tu problemu. Ale warto to potwierdzić — obie nie mają żadnej logiki auth, co jest poprawne.

**Wniosek: OK, nie wymaga zmian.**

---

## Kompleksowy plan end-to-end testów

### Test 1: Flow anonimowego użytkownika (niezalogowany)
1. Otworzyć stronę `/` w trybie incognito
2. Sprawdzić: HeroHeadline animuje dni, formularz jest widoczny, badge "No signup needed" jest widoczny
3. Sprawdzić: Footer NIE jest widoczny na głównej
4. Wypełnić formularz: wybrać 45min, wpisać topic "Travel", wybrać B1/B2, wybrać 4-6 ćwiczeń
5. Kliknąć "Generate Custom Worksheet"
6. Sprawdzić: GeneratingModal otwiera się, progress bar działa
7. Po wygenerowaniu: worksheet wyświetla się, ćwiczenia są poprawne
8. Próba download → powinien pojawić się PaymentPopup (paywall $1)
9. Edycja worksheetu → zmiany zapisują się lokalnie
10. Nawigacja: `/resources` → strona Resources ładuje się z kartami
11. Nawigacja: `/blog` → strona Blog ładuje się z artykułami
12. Kliknięcie artykułu blogowego → statyczny HTML ładuje się poprawnie

### Test 2: Rejestracja i pierwszy login
1. Kliknąć "Sign Up Free" → modal rejestracji
2. Wypełnić formularz: imię, nazwisko, email, hasło
3. Po rejestracji: EmailConfirmationModal powinien się pojawić
4. Po potwierdzeniu emaila: redirect do `/` → auto-redirect do `/dashboard`
5. Dashboard: 2 demo tokeny widoczne w nawigacji

### Test 3: Flow zalogowanego użytkownika
1. Zalogować się → redirect do dashboard
2. Dashboard: statystyki, lista studentów, historia worksheetów
3. Kliknąć "Generate Worksheet" na `/` → formularz (variant "dashboard")
4. Wygenerować worksheet → token powinien zmniejszyć się o 1
5. Worksheet wyświetla się poprawnie z toolbar
6. Download → powinien działać bezpłatnie (bez paywall)
7. Powrót do `/dashboard` → worksheet widoczny w historii

### Test 4: Nawigacja i strony statyczne
1. Sprawdzić: `/resources` → ładuje 7 sekcji z kartami, linki prowadzą do poprawnych stron
2. Sprawdzić: `/blog` → ładuje 15 artykułów, linki do `public/blog/*.html` działają
3. Sprawdzić: `/pricing` → strona cenowa
4. Sprawdzić: `/exercise-types` → 29 typów ćwiczeń
5. Sprawdzić: Footer widoczny na `/resources`, `/blog`, `/pricing` itd. (ale NIE na `/`)
6. Sprawdzić: Statyczne landing pages (np. `/ai-worksheet-generator-for-english-teachers.html`) ładują się

### Test 5: Edge cases
1. Podwójne kliknięcie "Generate" → drugie kliknięcie ignorowane (guard w `useWorksheetGeneration`)
2. Utrata połączenia podczas generowania → toast z komunikatem o błędzie sieci
3. Zalogowany bez tokenów → TokenPaywallModal zamiast generowania
4. Niepoprawne URL `/worksheet/fake-id` → toast error + redirect

---

## Readiness Checklist (step-by-step)

### Bezpieczeństwo i prywatność
- [ ] **Console.log cleanup** — wdrożyć `devLog` utility i podmienić we wszystkich hookach
- [ ] **RLS** — potwierdzić że tabele `worksheets`, `profiles`, `students` mają RLS
- [ ] **Anonimowi użytkownicy** — potwierdzić że nie mają dostępu do danych innych

### System płatności
- [ ] **Stripe** — potwierdzić produkcyjne klucze w Supabase secrets
- [ ] **Payment flow** — przetestować $1 payment → download unlock
- [ ] **Payment failure** — przetestować cancel i error

### Token system
- [ ] **Demo tokens** — nowy user dostaje 2 tokeny
- [ ] **Token consumption** — token zużywa się przy generowaniu
- [ ] **Token display** — poprawna liczba w StickyNav

### Worksheet flow
- [ ] **Generowanie** — działa dla 45min i 60min
- [ ] **Walidacja** — incomplete/invalid worksheets są obsługiwane
- [ ] **Edycja** — zmiany zapisują się (lokalnie dla anon, DB dla zalogowanych)
- [ ] **Download** — PDF generuje się poprawnie

### SEO i content
- [ ] **Resources page** — `/resources` ładuje się, JSON-LD poprawny
- [ ] **Blog page** — `/blog` ładuje się, JSON-LD poprawny
- [ ] **15 artykułów** — każdy z `public/blog/*.html` ładuje się
- [ ] **Rozbudowane strony** — 8 stron z 1500+ słów ładuje się
- [ ] **Sitemap** — 70 entries, `lastmod` na wszystkich
- [ ] **Footer** — 4 kolumny, 30+ linków, widoczny wszędzie oprócz `/`
- [ ] **Static backups** — `resources.html` i `blog.html` ładują się

### UX i nawigacja
- [ ] **Mobile** — responsive na telefonie
- [ ] **Loading states** — spinner przy auth loading, GeneratingModal przy generowaniu
- [ ] **Error messages** — toast przy błędach
- [ ] **Onboarding checklist** — wyświetla się dla nowych użytkowników

---

## Implementacja — dokładne kroki

### Krok 1: Stworzenie `src/utils/logger.ts`

```typescript
export const devLog = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
};
```

### Krok 2: Batch replace w hookach

Zamienić `console.log(` na `devLog(` w następujących plikach:
- `src/hooks/useTokenSystem.tsx` (~15 wystąpień)
- `src/hooks/useAuthFlow.tsx` (~1 wystąpienie)
- `src/hooks/useWorksheetGeneration.tsx` (~40 wystąpień)
- `src/hooks/useWorksheetState.tsx`
- `src/hooks/useStudentSelector.tsx`
- `src/hooks/useExerciseRegeneration.tsx`
- `src/hooks/useSectionRegeneration.tsx`
- `src/hooks/useInteractiveHomework.tsx` (~20 wystąpień)
- `src/hooks/useEventTracking.tsx`

Dodać import na górze każdego: `import { devLog } from '@/utils/logger';`

**NIE zamieniamy:** `console.error` i `console.warn` — te zostawiamy.

### Krok 3: Fix duplicate ID

W `src/components/worksheet/FormView.tsx` linia 57:
- Zmienić `<div id="worksheet-form" className="scroll-mt-24 pb-8 pt-0">` na `<div className="scroll-mt-24 pb-8 pt-0">`

### Krok 4: Aktualizacja PRE_LAUNCH_CHECKLIST.md

Zaktualizować `docs/PRE_LAUNCH_CHECKLIST.md` o nowe elementy z checklisty (SEO, blog, resources).

---

## Podsumowanie pliku zmian

| Plik | Akcja | Co robimy |
|------|-------|-----------|
| `src/utils/logger.ts` | NOWY | devLog/devWarn utility |
| `src/hooks/useTokenSystem.tsx` | EDYCJA | console.log → devLog |
| `src/hooks/useAuthFlow.tsx` | EDYCJA | console.log → devLog |
| `src/hooks/useWorksheetGeneration.tsx` | EDYCJA | console.log → devLog |
| `src/hooks/useWorksheetState.tsx` | EDYCJA | console.log → devLog |
| `src/hooks/useStudentSelector.tsx` | EDYCJA | console.log → devLog |
| `src/hooks/useExerciseRegeneration.tsx` | EDYCJA | console.log → devLog |
| `src/hooks/useSectionRegeneration.tsx` | EDYCJA | console.log → devLog |
| `src/hooks/useInteractiveHomework.tsx` | EDYCJA | console.log → devLog |
| `src/hooks/useEventTracking.tsx` | EDYCJA | console.log → devLog |
| `src/components/worksheet/FormView.tsx` | EDYCJA | Usunięcie duplicate ID |
| `docs/PRE_LAUNCH_CHECKLIST.md` | EDYCJA | Aktualizacja checklisty |

**Łącznie: 12 plików** (1 nowy + 11 edytowanych)

**Ryzyko:** MINIMALNE — zamieniamy tylko console.log na devLog (identyczne zachowanie w dev mode, cisza w produkcji). Fix duplicate ID nie wpływa na żadną funkcjonalność. Żadna logika biznesowa się nie zmienia.

