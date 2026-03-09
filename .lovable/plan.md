
# Plan: LLM Optimization (LLMO) — WDROŻONY ✅

## Podsumowanie

Pełna warstwa AI discovery dla edooqoo.com. Pliki llms.txt, llms-full.txt, robots.txt z AI botami, sitemap.xml, JSON-LD structured data, strona /about z pełnym opisem produktu i FAQ, statyczny about.html dla non-JS crawlerów.

## Pliki utworzone/zmodyfikowane

- `public/llms.txt` — krótki opis produktu dla AI crawlerów
- `public/llms-full.txt` — pełny opis (~3000 słów) z FAQ, ćwiczeniami, porównaniami
- `public/robots.txt` — 12 AI botów + sitemap link
- `public/sitemap.xml` — 7 stron z priorytetami
- `public/about.html` — statyczny HTML backup dla non-JS crawlerów
- `index.html` — JSON-LD (SoftwareApplication + Organization), meta tagi, canonical URL
- `src/pages/About.tsx` — strona /about z opisem produktu, FAQ, porównaniami
- `src/App.tsx` — route /about
- `src/components/GlobalFooter.tsx` — link About
