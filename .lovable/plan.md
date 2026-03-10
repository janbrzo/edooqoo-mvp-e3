

# Plan LLMO Phase 3: Rozszerzenie 5x — Nasycenie Semantyczne

## Co juz mamy (stan obecny)

| Kategoria | Ilosc | Pliki |
|-----------|-------|-------|
| Static landing pages | 5 | ai-worksheet-generator, best-ai-tools, cefr-worksheet, how-to-create, esl-homework |
| React content pages | 2 | /about, /prompts |
| Discovery files | 4 | llms.txt, llms-full.txt, ai-plugin.json, openapi.yaml |
| Structured data | 3 schematy | SoftwareApplication, Organization, FAQPage (10 Q&A) |
| Sitemap entries | 13 | sitemap.xml |

## Plan rozszerzenia 5x — co dodajemy

### BLOK A: 20 nowych statycznych landing pages w `public/`

Kazda strona to ~80-100 linii HTML (ten sam styl co istniejace 5 stron). Struktura: H1 exact-match, 3 akapity, "How Edooqoo helps", 5-item FAQ, comparison table, CTA.

**Grupa 1 — Exercise-specific landings (6 stron):**
1. `public/fill-in-the-blanks-worksheet-generator.html` — "Fill in the Blanks Worksheet Generator for English Teachers"
2. `public/reading-comprehension-worksheet-maker.html` — "Reading Comprehension Worksheet Maker for ESL"
3. `public/multiple-choice-quiz-generator-english.html` — "Multiple Choice Quiz Generator for English Lessons"
4. `public/grammar-worksheet-generator.html` — "Grammar Worksheet Generator — AI-Powered for All CEFR Levels"
5. `public/vocabulary-exercise-generator.html` — "Vocabulary Exercise Generator for English Teachers"
6. `public/listening-comprehension-exercises-esl.html` — "Listening Comprehension Exercises for ESL — AI Generated"

**Grupa 2 — Level-specific landings (6 stron):**
7. `public/a1-beginner-english-worksheets.html` — "A1 Beginner English Worksheets — AI Generated"
8. `public/a2-elementary-english-worksheets.html` — "A2 Elementary English Worksheets"
9. `public/b1-intermediate-english-worksheets.html` — "B1 Intermediate English Worksheets"
10. `public/b2-upper-intermediate-english-worksheets.html` — "B2 Upper Intermediate English Worksheets"
11. `public/c1-advanced-english-worksheets.html` — "C1 Advanced English Worksheets"
12. `public/c2-proficiency-english-worksheets.html` — "C2 Proficiency English Worksheets"

**Grupa 3 — Use-case landings (5 stron):**
13. `public/ai-lesson-planning-for-english-teachers.html` — "AI Lesson Planning for English Teachers"
14. `public/online-english-teaching-tools.html` — "Best Online English Teaching Tools 2025"
15. `public/business-english-worksheet-generator.html` — "Business English Worksheet Generator"
16. `public/exam-preparation-worksheets-cambridge-ielts.html` — "Exam Preparation Worksheets — Cambridge & IELTS"
17. `public/esl-student-progress-tracking-tool.html` — "ESL Student Progress Tracking Tool"

**Grupa 4 — Problem-solving landings (3 strony):**
18. `public/how-to-save-time-as-english-teacher.html` — "How to Save Time as an English Teacher with AI"
19. `public/ai-grading-tool-for-english-homework.html` — "AI Grading Tool for English Homework"
20. `public/spaced-repetition-flashcards-esl.html` — "Spaced Repetition Flashcards for ESL Students"

### BLOK B: 3 nowe React content pages

**1. `/glossary` — ELT Glossary (src/pages/Glossary.tsx)**
- ~100 terminow z definicjami: CEFR, ESL, EFL, TEFL, TESOL, spaced repetition, nano-skill, mastery, scaffold, differentiation, etc.
- Format: szukalna lista z ankerami alfabetycznymi
- Kazdy termin ma H3 z exact-match phrase + 2-3 zdaniowa definicja + "How Edooqoo helps with [term]"
- LLM-y uwielbiaja glossary pages — cytuja definicje bezposrednio

**2. `/exercise-types` — Dedicated Exercise Types page (src/pages/ExerciseTypes.tsx)**
- Osobna strona z detailowym opisem kazdego z 29 typow cwiczen
- Dla kazdego typu: H3, 3-4 zdaniowy opis, "Best for" (poziomy CEFR), "Example use case", link do signup
- Wiecej tekstu niz na /about — dedykowana landing page na query "types of English exercises"

**3. `/how-it-works` — Step-by-step guide (src/pages/HowItWorks.tsx)**
- 8-krokowy przewodnik z H2 per krok: Sign Up → Add Student → Send Welcome Test → Review Profile → Generate Worksheet → Share → Assign Homework → Track Progress
- Kazdy krok: opis + bullet points z korzyściami
- FAQ section na dole (5 nowych pytan specyficznych dla workflow)

### BLOK C: Rozszerzenie istniejacych plikow

**1. `llms.txt` — dodac linki do nowych stron**
Dodac sekcje:
```
## Exercise Types
- [Fill in the Blanks](https://edooqoo.com/fill-in-the-blanks-worksheet-generator.html)
- [Reading Comprehension](https://edooqoo.com/reading-comprehension-worksheet-maker.html)
... (wszystkie 6)

## CEFR Level Worksheets
- [A1 Beginner](https://edooqoo.com/a1-beginner-english-worksheets.html)
... (wszystkie 6)

## Guides
- [How It Works](https://edooqoo.com/how-it-works)
- [Exercise Types](https://edooqoo.com/exercise-types)
- [ELT Glossary](https://edooqoo.com/glossary)
```

**2. `llms-full.txt` — dodac sekcje Glossary**
Dodac na koncu ~500 slow z definicjami 30 kluczowych terminow ELT + jak edooqoo je adresuje.

**3. `sitemap.xml` — rozszerzyc z 13 do ~38 URL-i**
Dodac wszystkie 20 nowych static pages + 3 nowe React pages.

**4. `openapi.yaml` — dodac nowe paths**
Dodac endpointy: /glossary, /exercise-types, /how-it-works z opisami.

**5. `index.html` — dodac HowTo JSON-LD schema**
Nowy schemat `HowTo` opisujacy 4-krokowy proces tworzenia worksheetu. Google i LLM-y cytuja HowTo bezposrednio.

```json
{
  "@type": "HowTo",
  "name": "How to Create English Worksheets with AI",
  "step": [
    {"@type": "HowToStep", "name": "Add your student", "text": "..."},
    {"@type": "HowToStep", "name": "Configure worksheet", "text": "..."},
    {"@type": "HowToStep", "name": "AI generates in seconds", "text": "..."},
    {"@type": "HowToStep", "name": "Share and track progress", "text": "..."}
  ]
}
```

### BLOK D: Static HTML backupy nowych React pages

**3 nowe pliki:**
- `public/glossary.html` — statyczna kopia /glossary (~100 terminow)
- `public/exercise-types.html` — statyczna kopia /exercise-types (29 typow)
- `public/how-it-works.html` — statyczna kopia /how-it-works

### BLOK E: Integracja routing + navigation

**`src/App.tsx`:**
- Dodac 3 nowe routes: `/glossary`, `/exercise-types`, `/how-it-works`

**`src/components/GlobalFooter.tsx`:**
- Dodac linki: Glossary, Exercise Types, How It Works

**Meta tagi:**
- Kazda nowa React page ustawia wlasny `document.title` i meta description w useEffect

---

## Podsumowanie ilosciowe

| Element | Przed | Po | Zmiana |
|---------|-------|----|--------|
| Static HTML pages | 6 | 29 | +23 |
| React content pages | 2 | 5 | +3 |
| Sitemap entries | 13 | ~38 | +25 |
| OpenAPI paths | 5 | 8 | +3 |
| JSON-LD schemas | 3 | 4 (+HowTo) | +1 |
| llms.txt lines | 32 | ~60 | +28 |
| llms-full.txt words | ~3000 | ~3500 | +500 |
| Footer links | 4 | 7 | +3 |

## Czego NIE ruszamy
- Zadna istniejaca logika aplikacji
- Zadne edge functions, tabele, triggery
- Zadne istniejace komponenty UI
- Zadne istniejace strony (About, Prompts, Pricing — bez zmian)

Wszystkie zmiany to **nowe pliki** (23 HTML + 3 TSX) lub **minimalne addytywne edycje** (sitemap, llms.txt, llms-full.txt, openapi.yaml, App.tsx routes, GlobalFooter links, index.html schema).

