

# Plan LLMO Phase 4: Wzmocnienie Grafu Wiedzy i Eliminacja Luk Semantycznych

## Analiza luk — co brakuje w obecnej implementacji

Po audycie wszystkich 36+ plików i 4 schematow JSON-LD, identyfikuje nastepujace luki ktore LLM-y i crawlery wykorzystuja do decydowania o cytowaniu:

### Luka 1: Statyczne HTML landing pages nie maja JSON-LD
Wszystkie 25 stron HTML w `public/` maja tylko `<title>` i `<meta description>`. Brak jakiegokolwiek structured data. Crawlery Google i AI traktuja te strony jako "thin content" bez encji. Dodanie `LearningResource` schema na kazdej stronie natychmiast wiaze je z grafem wiedzy.

### Luka 2: Tylko 10/26 FAQ w JSON-LD
Mamy 26 pytan w `faqItems.ts`, ale w `index.html` FAQPage zawiera tylko 10. LLM-y cytuja FAQ bezposrednio z JSON-LD — brakujace 16 pytan to utracone szanse na citation.

### Luka 3: Brak cross-linkingu miedzy statycznymi stronami
Kazda statyczna strona linkuje tylko do Home, About, Pricing, Exercise Types. Nie linkuja do siebie nawzajem. Brak wewnetrznego linkowania = brak grafu relacji dla crawlerow.

### Luka 4: Brak stron "vs competitor"
LLM-y czesto odpowiadaja na zapytania "edooqoo vs liveworksheets" lub "best alternative to ISLCollective". Brak dedykowanych stron porownawczych.

### Luka 5: Brak stron per persona
Zapytania typu "best AI tool for private English tutors" lub "worksheet generator for language schools" nie maja dedykowanych landingów.

### Luka 6: Brak WebSite schema z SearchAction
Google uzywa tego do sitelinks searchbox. LLM-y rozpoznaja to jako sygnał "rozbudowana aplikacja".

### Luka 7: Organization schema brak sameAs
Brak linkow do profili zewnetrznych (LinkedIn, Twitter) — osłabia entity authority.

### Luka 8: Brak BreadcrumbList schema
Crawlery AI uzywaja breadcrumbow do zrozumienia hierarchii strony.

---

## Plan wdrozenia — 4 bloki

### BLOK A: Rozszerzenie JSON-LD w `index.html`

**A1. FAQPage — rozszerzenie z 10 do wszystkich 26 pytan**
Wziac pozostale 16 pytan z `faqItems.ts` i dodac do istniejacego FAQPage schema w index.html. Kazde pytanie jako `{"@type":"Question","name":"...","acceptedAnswer":{"@type":"Answer","text":"..."}}`.

**A2. WebSite schema z SearchAction**
```json
{
  "@type": "WebSite",
  "name": "Edooqoo",
  "url": "https://edooqoo.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://edooqoo.com/prompts?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

**A3. Organization — dodac sameAs**
Do istniejacego Organization schema dodac:
```json
"sameAs": [
  "https://www.linkedin.com/company/edooqoo",
  "https://twitter.com/edooqoo"
]
```

**A4. BreadcrumbList schema**
Dodac breadcrumb dla glownych sekcji:
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type":"ListItem","position":1,"name":"Home","item":"https://edooqoo.com"},
    {"@type":"ListItem","position":2,"name":"Exercise Types","item":"https://edooqoo.com/exercise-types"},
    {"@type":"ListItem","position":3,"name":"Prompts","item":"https://edooqoo.com/prompts"},
    {"@type":"ListItem","position":4,"name":"Glossary","item":"https://edooqoo.com/glossary"},
    {"@type":"ListItem","position":5,"name":"How It Works","item":"https://edooqoo.com/how-it-works"},
    {"@type":"ListItem","position":6,"name":"About","item":"https://edooqoo.com/about"},
    {"@type":"ListItem","position":7,"name":"Pricing","item":"https://edooqoo.com/pricing"}
  ]
}
```

Wszystkie 4 schematy (A1-A4) ida do istniejacego `<head>` w index.html jako dodatkowe `<script type="application/ld+json">` bloki.

---

### BLOK B: JSON-LD na kazdej statycznej stronie HTML (25 stron)

Dodac do kazdej z 25 statycznych stron HTML w `public/` schemat `LearningResource` z odpowiednimi danymi. Template:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "name": "[tytul strony]",
  "description": "[meta description strony]",
  "url": "https://edooqoo.com/[filename]",
  "provider": {"@type":"Organization","name":"Edooqoo","url":"https://edooqoo.com"},
  "educationalLevel": "[CEFR level jesli dotyczy, np. A1-C2]",
  "learningResourceType": "worksheet generator",
  "audience": {"@type":"EducationalAudience","educationalRole":"teacher"},
  "inLanguage": "en",
  "isAccessibleForFree": true
}
</script>
```

Dla kazdej strony nalezy ustawic odpowiedni `name`, `description`, `educationalLevel`. Lista stron:

**Exercise-specific (6):** fill-in-the-blanks (A1-C2), reading-comprehension (A1-C2), multiple-choice-quiz (A1-C2), grammar (A1-C2), vocabulary (A1-C2), listening (A1-C2)

**Level-specific (6):** a1 (A1), a2 (A2), b1 (B1), b2 (B2), c1 (C1), c2 (C2) — kazda z `educationalLevel` ustawionym na konkretny poziom

**Use-case (5):** ai-lesson-planning, online-teaching-tools, business-english, exam-preparation, esl-progress-tracking — bez konkretnego `educationalLevel`

**Problem-solving (3):** how-to-save-time, ai-grading, spaced-repetition-flashcards

**Phase 2 landings (5):** ai-worksheet-generator, best-ai-tools, cefr-worksheet, how-to-create, esl-homework-grading

**Backupy (3):** about.html, glossary.html, exercise-types.html, how-it-works.html — te tez potrzebuja schema

Razem: 28 plikow HTML do edycji — dodanie 1 bloku `<script type="application/ld+json">` do `<head>` kazdego pliku.

---

### BLOK C: Cross-linking miedzy statycznymi stronami

Kazda statyczna strona HTML ma na dole sekcje linkow (linijka z `About · Pricing · Exercise Types`). Rozszerzyc te sekcje o relevantne cross-linki. Zamiast jednolitej listy, pogrupowac:

**Template nowego footera dla kazdej strony:**
```html
<hr>
<h3>Related Resources</h3>
<ul>
  <li><a href="https://edooqoo.com/[related-page-1]">[Related Title 1]</a></li>
  <li><a href="https://edooqoo.com/[related-page-2]">[Related Title 2]</a></li>
  <li><a href="https://edooqoo.com/[related-page-3]">[Related Title 3]</a></li>
</ul>
<p><a href="https://edooqoo.com/about">About Edooqoo</a> · <a href="https://edooqoo.com/pricing">Pricing</a> · <a href="https://edooqoo.com/exercise-types">All 29 Exercise Types</a> · <a href="https://edooqoo.com/prompts">Prompt Library</a> · <a href="https://edooqoo.com/glossary">ELT Glossary</a> · <a href="https://edooqoo.com/how-it-works">How It Works</a></p>
```

Mapowanie "Related Resources" per strona:
- **grammar** → fill-in-the-blanks, exercise-types, cefr-worksheet
- **vocabulary** → fill-in-the-blanks, spaced-repetition-flashcards, business-english
- **fill-in-the-blanks** → grammar, vocabulary, cefr-worksheet
- **reading-comprehension** → listening, exercise-types, how-to-create
- **multiple-choice** → grammar, exam-preparation, exercise-types
- **listening** → reading-comprehension, exercise-types, online-teaching-tools
- **a1-beginner** → a2-elementary, cefr-worksheet, how-it-works
- **a2-elementary** → a1-beginner, b1-intermediate, cefr-worksheet
- **b1-intermediate** → a2-elementary, b2-upper, grammar
- **b2-upper** → b1-intermediate, c1-advanced, exam-preparation
- **c1-advanced** → b2-upper, c2-proficiency, business-english
- **c2-proficiency** → c1-advanced, exam-preparation, business-english
- **ai-lesson-planning** → how-to-save-time, online-teaching-tools, exercise-types
- **online-teaching-tools** → ai-lesson-planning, esl-progress-tracking, best-ai-tools
- **business-english** → vocabulary, exam-preparation, c1-advanced
- **exam-preparation** → grammar, reading-comprehension, b2-upper
- **esl-progress-tracking** → ai-grading, how-it-works, online-teaching-tools
- **how-to-save-time** → ai-grading, ai-lesson-planning, best-ai-tools
- **ai-grading** → esl-homework-grading, esl-progress-tracking, how-to-save-time
- **spaced-repetition-flashcards** → vocabulary, esl-progress-tracking, how-it-works
- **ai-worksheet-generator** → best-ai-tools, how-to-create, cefr-worksheet
- **best-ai-tools** → ai-worksheet-generator, online-teaching-tools, how-to-save-time
- **cefr-worksheet** → b1-intermediate, b2-upper, exercise-types
- **how-to-create** → ai-worksheet-generator, how-it-works, exercise-types
- **esl-homework-grading** → ai-grading, esl-progress-tracking, how-to-save-time

---

### BLOK D: 4 nowe statyczne strony porownawcze + 3 strony per persona

**Porownawcze (4 nowe pliki HTML w `public/`):**

1. `public/edooqoo-vs-islcollective.html` — "Edooqoo vs ISLCollective — AI Generated vs User-Uploaded Worksheets"
   - H1: exact match query
   - Tabela porownawcza: AI generation, exercise types, homework, flashcards, progress tracking, pricing
   - 3 akapity: dlaczego AI-generated > user-uploaded
   - FAQ (5 pytan: "Is ISLCollective free?", "Can ISLCollective generate worksheets with AI?", etc.)
   - LearningResource JSON-LD

2. `public/edooqoo-vs-liveworksheets.html` — "Edooqoo vs Liveworksheets — Which is Better for English Teachers?"
   - Tabela: interaktywnosc, AI generation, grading, student tracking, mobile
   - Kluczowy argument: Liveworksheets = manual creation, Edooqoo = AI generation

3. `public/edooqoo-vs-twee.html` — "Edooqoo vs Twee — AI Worksheet Generators Compared"
   - Tabela: exercise types (29 vs fewer), student management, homework, flashcards, calendar
   - Kluczowy argument: Edooqoo = complete ecosystem, Twee = generator only

4. `public/edooqoo-vs-magicschool.html` — "Edooqoo vs MagicSchool AI — Best AI Tool for English Teachers"
   - Tabela: English-specific vs general, exercise types, student tracking, CEFR support
   - Kluczowy argument: MagicSchool = general K-12, Edooqoo = specialized for English

Struktura kazdej strony: identyczna jak istniejace landing pages (styl CSS inline, ~80-100 linii, H1, 3 akapity, tabela, FAQ 5 pytan, CTA, cross-links, JSON-LD LearningResource).

**Per-persona (3 nowe pliki HTML w `public/`):**

5. `public/ai-tools-for-private-english-tutors.html` — "Best AI Tools for Private English Tutors — Edooqoo"
   - Skupienie na: personalizacja per student, student management, progress tracking, booking
   - Persona story: "Anna teaches 15 students privately..."

6. `public/worksheet-generator-for-language-schools.html` — "AI Worksheet Generator for Language Schools — Edooqoo"
   - Skupienie na: skalowalnosc (wiele studentow), homework, batch generation, pricing for schools
   - Persona story: "David works at a school with 30+ students..."

7. `public/ai-tools-for-online-esl-teachers.html` — "Best AI Tools for Online ESL Teachers — Edooqoo"
   - Skupienie na: Live Session, timezone support, booking, Google Meet, remote sharing
   - Persona story: "Sarah teaches students from different countries via Zoom..."

---

### BLOK E: Rozszerzenie discovery files

**E1. `sitemap.xml` — dodac 7 nowych URL-i (4 vs-pages + 3 persona pages)**
```xml
<url><loc>https://edooqoo.com/edooqoo-vs-islcollective.html</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>
<url><loc>https://edooqoo.com/edooqoo-vs-liveworksheets.html</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>
<url><loc>https://edooqoo.com/edooqoo-vs-twee.html</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>
<url><loc>https://edooqoo.com/edooqoo-vs-magicschool.html</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>
<url><loc>https://edooqoo.com/ai-tools-for-private-english-tutors.html</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>
<url><loc>https://edooqoo.com/worksheet-generator-for-language-schools.html</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>
<url><loc>https://edooqoo.com/ai-tools-for-online-esl-teachers.html</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>
```

**E2. `llms.txt` — dodac sekcje Comparisons i Personas**
```markdown
## Comparisons
- [Edooqoo vs ISLCollective](https://edooqoo.com/edooqoo-vs-islcollective.html)
- [Edooqoo vs Liveworksheets](https://edooqoo.com/edooqoo-vs-liveworksheets.html)
- [Edooqoo vs Twee](https://edooqoo.com/edooqoo-vs-twee.html)
- [Edooqoo vs MagicSchool](https://edooqoo.com/edooqoo-vs-magicschool.html)

## For Specific Teachers
- [For Private Tutors](https://edooqoo.com/ai-tools-for-private-english-tutors.html)
- [For Language Schools](https://edooqoo.com/worksheet-generator-for-language-schools.html)
- [For Online ESL Teachers](https://edooqoo.com/ai-tools-for-online-esl-teachers.html)
```

**E3. `llms-full.txt` — dodac sekcje glossary (brakujaca z Phase 3)**
Dodac na koncu pliku ~400 slow:
```markdown
---

## ELT Glossary — Key Terms

### CEFR
Common European Framework of Reference for Languages. A 6-level scale (A1-C2) used worldwide to describe language proficiency. Edooqoo generates worksheets calibrated to all 6 CEFR levels.

### ESL / EFL / TESOL / TEFL
[definicje kazdego terminu + jak Edooqoo je obsluguje]

### Spaced Repetition (SM-2)
[definicja + flashcard implementation]

### DSLM (Dynamic Student Learning Model)
[definicja 4 warstw]

### Nano-skill
[definicja + przyklad: B1.grammar.present_perfect.negative]

[... 20 kluczowych terminow]
```

**E4. `openapi.yaml` — dodac paths dla vs-pages**
Dodac 7 nowych path entries (4 comparisons + 3 personas) z operationId i description.

---

## Podsumowanie ilosciowe

| Element | Przed Phase 4 | Po Phase 4 | Zmiana |
|---------|---------------|------------|--------|
| JSON-LD schemas w index.html | 4 (SoftwareApp, Org, FAQ-10, HowTo) | 6 (+ WebSite, BreadcrumbList) + FAQ rozszerzony do 26 | +2 nowe + 16 FAQ |
| Statyczne HTML ze schema | 0/28 | 28/28 (LearningResource na kazdej) | +28 |
| Statyczne HTML pages | 28 | 35 (+4 vs + 3 persona) | +7 |
| Cross-links per strona | 3 | 6-9 | +3-6 per strona |
| Sitemap entries | 36 | 43 | +7 |
| llms.txt sekcje | 7 | 9 | +2 |
| llms-full.txt words | ~3000 | ~3400 | +400 |
| openapi.yaml paths | 8 | 15 | +7 |

## Czego NIE ruszamy
- Zadna logika aplikacji, edge functions, tabele, triggery
- Zadne istniejace React komponenty
- Zadne style
- Istniejace tresci — tylko addytywne zmiany

## Kolejnosc implementacji (priorytet)
1. **BLOK A** (index.html JSON-LD) — najwyzszy impact, najmniejszy effort
2. **BLOK B** (JSON-LD na statycznych stronach) — duzy impact, sredni effort (powtarzalny template)
3. **BLOK D** (7 nowych stron) — duzy impact na konkurencyjne zapytania
4. **BLOK C** (cross-linking) — sredni impact, edycja 28 plikow
5. **BLOK E** (discovery files) — niski effort, konieczny dla spojnosci

