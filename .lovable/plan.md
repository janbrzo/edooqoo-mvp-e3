
# Plan: LLM Optimization (LLMO) — Phase 1 + Phase 2 + Phase 3 WDROŻONE ✅

## Podsumowanie

Pełna warstwa AI discovery dla edooqoo.com w trzech fazach:

### Phase 1 (wdrożone)
- `public/llms.txt` — krótki opis produktu dla AI crawlerów
- `public/llms-full.txt` — pełny opis (~3000 słów) z FAQ, ćwiczeniami, porównaniami
- `public/robots.txt` — 12+ AI botów + sitemap link
- `public/sitemap.xml` — strony z priorytetami
- `public/about.html` — statyczny HTML backup dla non-JS crawlerów
- `index.html` — JSON-LD (SoftwareApplication + Organization), meta tagi, canonical URL
- `src/pages/About.tsx` — strona /about z opisem produktu, FAQ, porównaniami
- `src/App.tsx` — route /about
- `src/components/GlobalFooter.tsx` — link About

### Phase 2 (wdrożone)
- `index.html` — FAQPage JSON-LD schema (10 pytań) dla bezpośrednich cytatów w LLM
- `public/.well-known/ai-plugin.json` — manifest pluginu AI (entity authority)
- `public/openapi.yaml` — specyfikacja OpenAPI opisująca capabilities edooqoo
- 5 statycznych landing pages w `public/` na kluczowe queries
- `src/pages/Prompts.tsx` — strona /prompts z 50+ gotowymi promptami dla nauczycieli
- Dynamiczne meta tagi na Pricing, Login, Signup

### Phase 3 (wdrożone) — Nasycenie Semantyczne 5x
- `index.html` — HowTo JSON-LD schema (4-krokowy proces tworzenia worksheetu)
- 20 nowych statycznych landing pages w `public/`:
  - 6 exercise-specific (fill-in-blanks, reading, MCQ, grammar, vocabulary, listening)
  - 6 CEFR level-specific (A1, A2, B1, B2, C1, C2)
  - 5 use-case (lesson planning, online tools, business english, exam prep, progress tracking)
  - 3 problem-solving (save time, AI grading, flashcards)
- 3 nowe React content pages:
  - `/glossary` — 50 terminów ELT z definicjami
  - `/exercise-types` — opisy 29 typów ćwiczeń z CEFR levels i use cases
  - `/how-it-works` — 8-krokowy przewodnik workflow
- Rozszerzony `public/sitemap.xml` — 36 URL-i (z 13)
- Rozszerzony `public/llms.txt` — z linkami do nowych stron
- Rozszerzony `public/openapi.yaml` — 3 nowe paths
- 3 nowe linki w GlobalFooter (Exercise Types, How It Works, Glossary)
- 3 nowe routes w App.tsx

## Statystyki końcowe

| Element | Phase 1 | Phase 2 | Phase 3 | Razem |
|---------|---------|---------|---------|-------|
| Static HTML pages | 1 | 5 | 20 | 26 |
| React content pages | 1 | 1 | 3 | 5 |
| Sitemap entries | 7 | 13 | 36 | 36 |
| JSON-LD schemas | 2 | 3 | 4 | 4 |
| Footer links | 2 | 4 | 7 | 7 |
