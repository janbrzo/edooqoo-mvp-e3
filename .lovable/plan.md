# Plan: Phase 6 — SEO Total Dominance + Przywrócenie Footera na Homepage

## Dwa zadania

### ZADANIE 1: Przywrócenie footera na stronie głównej

**Problem:** Aktualnie `GlobalFooter.tsx` linia 9-11 robi `return null` gdy `pathname === '/'`. Footer z 30+ linkami jest niewidoczny na stronie głównej.

**Rozwiązanie:** Usunąć warunek `return null` — footer będzie widoczny na WSZYSTKICH stronach, w tym na `/`. Footer renderuje się po sekcji `FinalCTA` w `Index.tsx` (jest montowany globalnie w App.tsx/layout), więc pojawi się naturalnie na dole strony.

**Plik:** `src/components/GlobalFooter.tsx` — usunąć linie 6-11 (hook `useLocation` + warunek `return null`), usunąć import `useLocation`.

---

### ZADANIE 2: SEO Total Dominance — Phase 6

Analiza obecnego stanu: mamy 52 statyczne HTML, 15 blogów, 70 sitemap entries. Brakuje jednak kluczowych klastrów tematycznych, które nauczyciel angielskiego wpisuje w Google. Poniżej lista **25 nowych statycznych stron HTML** pokrywających brakujące zapytania.

#### Nowe klastry tematyczne (25 nowych stron)

**Klaster A: Gramatyka — konkretne tematy (8 stron)**
Nauczyciele szukają materiałów do konkretnych zagadnień gramatycznych. Każda strona 1500+ słów z tabelami, przykładami, FAQ, i linkiem do generatora.

1. `public/present-simple-worksheets.html` — "Present Simple worksheets for ESL"
2. `public/past-simple-worksheets.html` — "Past Simple worksheets English"
3. `public/present-perfect-worksheets.html` — "Present Perfect exercises ESL"
4. `public/conditionals-worksheets-english.html` — "Conditionals worksheets English teaching"
5. `public/passive-voice-worksheets-esl.html` — "Passive voice exercises ESL"
6. `public/reported-speech-worksheets.html` — "Reported speech worksheets"
7. `public/articles-a-an-the-worksheets.html` — "Articles a/an/the worksheets ESL"
8. `public/prepositions-worksheets-english.html` — "Prepositions worksheets English"

**Klaster B: Tematy lekcji (6 stron)**
Nauczyciele szukają materiałów do konkretnych tematów (topics).

9. `public/travel-english-worksheets.html` — "Travel English worksheets"
10. `public/food-and-cooking-english-worksheets.html` — "Food vocabulary worksheets ESL"
11. `public/job-interview-english-worksheets.html` — "Job interview English exercises"
12. `public/health-and-body-english-worksheets.html` — "Health vocabulary worksheets ESL"
13. `public/environment-climate-english-worksheets.html` — "Environment topic English worksheets"
14. `public/technology-english-worksheets.html` — "Technology vocabulary ESL worksheets"

**Klaster C: Grupy wiekowe / konteksty (5 stron)**

15. `public/english-worksheets-for-kids.html` — "English worksheets for kids"
16. `public/english-worksheets-for-teenagers.html` — "English worksheets for teenagers ESL"
17. `public/english-worksheets-for-adults.html` — "English worksheets for adult learners"
18. `public/english-worksheets-for-corporate-training.html` — "Corporate English training worksheets"
19. `public/english-worksheets-for-exam-prep.html` — "English exam preparation worksheets"

**Klaster D: Metody i techniki nauczania (6 stron blog)**

20. `public/blog/communicative-language-teaching-activities.html` — "CLT activities ESL"
21. `public/blog/task-based-language-teaching-worksheets.html` — "TBLT worksheets English"
22. `public/blog/flipped-classroom-english-teaching.html` — "Flipped classroom ESL"
23. `public/blog/gamification-english-classroom.html` — "Gamification ESL classroom"
24. `public/blog/scaffolding-strategies-english-learners.html` — "Scaffolding strategies ELL"
25. `public/blog/formative-assessment-english-teaching.html` — "Formative assessment ESL"

#### Struktura każdej nowej strony HTML

Każda strona będzie miała identyczną strukturę jak istniejące strony (np. `present-simple-worksheets.html`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Keyword] — Edooqoo AI Worksheet Generator</title>
  <meta name="description" content="[160 chars max, keyword-rich]">
  <meta name="keywords" content="[5-8 relevant keywords]">
  <link rel="canonical" href="https://edooqoo.com/[filename]">
  <script type="application/ld+json">{LearningResource schema}</script>
  <style>[identyczny styl jak w istniejących stronach]</style>
</head>
<body>
  <nav><a href="https://edooqoo.com">← Edooqoo Home</a></nav>
  <h1>[Primary keyword]</h1>
  <!-- 1500-2000 słów: intro, sekcje H2/H3, tabele, FAQ, CTA -->
  <h2>Related Resources</h2>
  <!-- cross-links do 6-8 powiązanych stron -->
  <a class="cta" href="https://edooqoo.com">Try Edooqoo Free →</a>
</body>
</html>
```

#### Aktualizacja powiązanych plików

`**public/sitemap.xml**` — dodanie 25 nowych URL (łącznie ~95 entries):

- 19 nowych landing pages z `priority` 0.7-0.8
- 6 nowych blog articles z `priority` 0.7
- `lastmod` = `2026-03-15` na nowych, update na starych

`**public/llms.txt**` — dodanie nowych sekcji:

- "Grammar Topic Worksheets" z 8 linkami
- "Topic-Based Worksheets" z 6 linkami  
- "Audience-Specific Worksheets" z 5 linkami
- "Teaching Methods (Blog)" z 6 linkami

`**public/openapi.yaml**` — dodanie 25 nowych paths

`**src/components/GlobalFooter.tsx**` — rozszerzenie footera:

- Nowa kolumna "Grammar" z 4 top linkami (Present Simple, Past Simple, Conditionals, Passive Voice)
- Zamiana layoutu na 5 kolumn (`grid-cols-2 md:grid-cols-5`)
- Alternatywnie: dodanie linków do istniejących kolumn "Resources"

`**index.html**` — dodanie `meta keywords` (brakuje aktualnie na stronie głównej)

**Cross-linking w istniejących stronach:**

- Dodanie sekcji "Related Grammar Worksheets" w `grammar-worksheet-generator.html`
- Dodanie linków do nowych stron w `resources.html` i `blog.html`

---

## Podsumowanie zmian


| Element                      | Przed                  | Po       |
| ---------------------------- | ---------------------- | -------- |
| GlobalFooter na `/`          | ukryty (`return null`) | widoczny |
| Statyczne HTML landing pages | 37                     | 56       |
| Blog articles                | 15                     | 21       |
| Sitemap entries              | 70                     | ~95      |
| Footer kolumny               | 4                      | 5        |
| Pokryte klastry tematyczne   | 5                      | 9        |


## Kolejność implementacji (implementację wykonaj w 2 krokach)

1. **GlobalFooter** — usunięcie warunku `return null` (1 plik, 3 linie)
2. **8 stron Grammar** — `public/present-simple-worksheets.html` itd.
3. **6 stron Topics** — `public/travel-english-worksheets.html` itd.
4. **5 stron Audience** — `public/english-worksheets-for-kids.html` itd.
5. **6 stron Blog (metody)** — `public/blog/communicative-language-teaching-activities.html` itd.
6. **Sitemap** — rozszerzenie do ~95 entries
7. **llms.txt + openapi.yaml** — dodanie nowych sekcji
8. **Footer rozszerzenie** — 5. kolumna "Grammar"
9. **index.html** — dodanie `meta keywords`
10. **Cross-linking** — aktualizacja `resources.html`, `blog.html`, `grammar-worksheet-generator.html`

**Ryzyko:** ZEROWE dla aplikacji — wszystkie zmiany to statyczne pliki HTML w `public/` + kosmetyczne zmiany w footerze i meta tagach. Żadna logika biznesowa się nie zmienia.