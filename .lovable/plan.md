
# Plan: LLM Optimization (LLMO) — Phase 1 + Phase 2 WDROŻONE ✅

## Podsumowanie

Pełna warstwa AI discovery dla edooqoo.com w dwóch fazach:

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
- 5 statycznych landing pages w `public/` na kluczowe queries:
  - `ai-worksheet-generator-for-english-teachers.html`
  - `best-ai-tools-for-esl-teachers.html`
  - `cefr-worksheet-generator.html`
  - `how-to-create-english-worksheets-with-ai.html`
  - `esl-homework-grading-tool.html`
- `src/pages/Prompts.tsx` — strona /prompts z 50+ gotowymi promptami dla nauczycieli
- Rozszerzony `public/sitemap.xml` — 13 stron (z 7)
- Dynamiczne meta tagi na Pricing, Login, Signup
- Link "Prompts" w GlobalFooter
