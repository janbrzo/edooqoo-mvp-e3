

# Plan SEO Phase 5: Google Search Dominance — MEGA Edition

## Co robimy i dlaczego

Obecna strona ma 35 statycznych landing pages, silne structured data, ale brakuje:
1. **Bloga/Resource Center** — Google premiuje swieze, regularnie aktualizowane tresci
2. **Rozbudowanego footera** — obecny ma 7 linkow, powinien miec 30+
3. **Dluzsych tresci** — statyczne strony maja 300-500 slow, Google chce 1500+
4. **Sygnałów performance** — brak preconnect
5. **Lastmod w sitemap** — Google uzywa tego do priorytetyzacji crawlowania

Plan dzieli sie na 8 blokow. Wszystko wdrazamy na raz.

---

## BLOK A: Resource Center — strona React `/resources`

Nowa strona React ktora dziala jako "Content Hub" — zbiera WSZYSTKIE statyczne landingi i artykuly blogowe w jeden indeks pogrupowany w klastry tematyczne. Google traktuje takie strony jako sygnal "topical authority".

**Plik:** `src/pages/Resources.tsx`

**Meta tagi (ustawiane w useEffect):**
- title: `"English Teaching Resources — AI Worksheets, Guides & Tools | Edooqoo"`
- description: `"Free resources for English teachers: AI worksheet generators, CEFR level guides, exercise tutorials, tool comparisons, blog articles, and teaching tips. Browse 60+ resources."`

**Layout:** Header (taki sam jak About.tsx — logo + Pricing + Sign Up), nastepnie:
- H1: "English Teaching Resources"
- Krotki opis (2 zdania)
- 7 sekcji z kartami:

**Sekcja 1: Worksheet Generators** (pillar: ai-worksheet-generator)
Karty: grammar, vocabulary, fill-in-the-blanks, reading-comprehension, multiple-choice, listening, cefr-worksheet, how-to-create

**Sekcja 2: CEFR Level Guides** (pillar: cefr-worksheet-generator)
Karty: a1, a2, b1, b2, c1, c2

**Sekcja 3: Teaching Tools & Productivity** (pillar: best-ai-tools)
Karty: ai-lesson-planning, online-teaching-tools, how-to-save-time, esl-progress-tracking, esl-homework-grading, ai-grading, spaced-repetition-flashcards

**Sekcja 4: Specialized Teaching** (pillar: business-english)
Karty: business-english, exam-preparation, private-tutors, language-schools, online-esl-teachers

**Sekcja 5: Comparisons**
Karty: vs-islcollective, vs-liveworksheets, vs-twee, vs-magicschool

**Sekcja 6: Guides & References**
Karty linkujace do: /exercise-types, /prompts, /glossary, /how-it-works

**Sekcja 7: Blog Articles** (NOWE — linki do nowych artykulow blogowych)
Karty: 15 artykulow blogowych (szczegoly w BLOKU D)

Kazda karta: tytul, 1-zdaniowy opis, badge kategorii (np. "CEFR", "Tool", "Comparison"), link `<a href="...">`.

**JSON-LD na stronie (w useEffect lub jako element):** `CollectionPage` schema z `hasPart` listujacym wszystkie podstrony.

**Dodac route do App.tsx:** `<Route path="/resources" element={<Resources />} />`

---

## BLOK B: Rozbudowa GlobalFooter

Obecny footer to 1 rzad z 7 linkami. Zamieniamy na profesjonalny 4-kolumnowy footer z 30+ linkami.

**Plik:** `src/components/GlobalFooter.tsx`

**Nowy layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Edooqoo                                                     │
│  AI Worksheet Generator for English Teachers                │
│                                                              │
│  Product          Resources         For Teachers    Compare  │
│  ─────────        ──────────        ────────────    ─────── │
│  Home             Prompt Library    Private Tutors  vs ISL   │
│  Pricing          ELT Glossary      Language Schools vs Live │
│  Exercise Types   All Resources     Online ESL      vs Twee │
│  How It Works     Blog              Business Eng    vs Magic │
│  About            CEFR Guide                                 │
│  Sign Up Free                                                │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│  © 2025 Edooqoo. All rights reserved.                       │
│  Privacy Policy · Cookie Policy                              │
└─────────────────────────────────────────────────────────────┘
```

**Kolumna 1 — Product (6 linkow, React routes):**
- Home → `/`
- Pricing → `/pricing`
- Exercise Types → `/exercise-types`
- How It Works → `/how-it-works`
- About → `/about`
- Sign Up Free → `/signup`

**Kolumna 2 — Resources (5 linkow):**
- Prompt Library → `/prompts`
- ELT Glossary → `/glossary`
- All Resources → `/resources`
- Blog → `/blog`
- CEFR Guide → `/cefr-worksheet-generator.html`

**Kolumna 3 — For Teachers (4 linki, statyczne HTML):**
- Private Tutors → `/ai-tools-for-private-english-tutors.html`
- Language Schools → `/worksheet-generator-for-language-schools.html`
- Online ESL Teachers → `/ai-tools-for-online-esl-teachers.html`
- Business English → `/business-english-worksheet-generator.html`

**Kolumna 4 — Compare (4 linki, statyczne HTML):**
- vs ISLCollective → `/edooqoo-vs-islcollective.html`
- vs Liveworksheets → `/edooqoo-vs-liveworksheets.html`
- vs Twee → `/edooqoo-vs-twee.html`
- vs MagicSchool → `/edooqoo-vs-magicschool.html`

**Dolny pasek:** `© 2025 Edooqoo · Privacy Policy · Cookie Policy`

Uzyc Tailwind grid: `grid grid-cols-2 md:grid-cols-4 gap-8`. Linki zewnetrzne (HTML) jako `<a href>`, wewnetrzne jako `<Link to>`.

---

## BLOK C: Blog — React route `/blog` + 15 artykulow jako statyczne HTML

### C1. React route `/blog`

**Plik:** `src/pages/Blog.tsx`

**Meta:**
- title: `"Edooqoo Blog — Tips, Guides & Resources for English Teachers"`
- description: `"Practical articles for English teachers: AI teaching tips, worksheet creation guides, classroom management, CEFR assessment strategies, and ESL/EFL best practices."`

**Layout:** taki sam jak Resources — header, lista artykulow jako karty z tytulami, datami, opisami, kategoriami. Kazda karta linkuje do statycznego HTML w `public/blog/`.

**JSON-LD:** `Blog` schema z `blogPost` listujacym wszystkie artykuly.

**Route w App.tsx:** `<Route path="/blog" element={<Blog />} />`

### C2. 15 artykulow blogowych — statyczne HTML w `public/blog/`

Kazdy artykul: ~1500-2000 slow, H1, 5-7 sekcji H2, 3-5 FAQ, JSON-LD `BlogPosting` schema, cross-linki do relevantnych stron, CTA "Try Edooqoo Free".

**Struktura kazdego pliku:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[TITLE] — Edooqoo Blog</title>
  <meta name="description" content="[DESCRIPTION ~160 chars]">
  <link rel="canonical" href="https://edooqoo.com/blog/[slug].html">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BlogPosting",
   "headline":"[TITLE]",
   "description":"[DESCRIPTION]",
   "url":"https://edooqoo.com/blog/[slug].html",
   "datePublished":"2026-03-11",
   "dateModified":"2026-03-11",
   "author":{"@type":"Organization","name":"Edooqoo","url":"https://edooqoo.com"},
   "publisher":{"@type":"Organization","name":"Edooqoo","logo":{"@type":"ImageObject","url":"https://edooqoo.com/lovable-uploads/2d55c1e0-547e-45aa-a55c-e71479adb602.png"}},
   "mainEntityOfPage":{"@type":"WebPage","@id":"https://edooqoo.com/blog/[slug].html"},
   "inLanguage":"en"}
  </script>
  <style>[ten sam CSS co inne statyczne strony]</style>
</head>
<body>
  <nav><a href="https://edooqoo.com">← Edooqoo Home</a> · <a href="https://edooqoo.com/blog">Blog</a></nav>
  <h1>[TITLE]</h1>
  <p><em>Published March 11, 2026 · [CATEGORY]</em></p>
  [CONTENT — 1500-2000 slow, 5-7 sekcji H2]
  [FAQ — 3-5 pytan w <details>]
  <p><a href="https://edooqoo.com/signup" class="cta">Try Edooqoo Free</a></p>
  <hr>
  <h3>Related Articles</h3>
  <ul>[3 linki do powiazanych artykulow]</ul>
  <h3>Related Resources</h3>
  <ul>[3 linki do powiazanych landingów]</ul>
  <p>[footer z linkami do About, Pricing, Exercise Types, Prompts, Glossary, How It Works, Blog, Resources]</p>
</body>
</html>
```

**Lista 15 artykulow z tytulami, slugami, kategoriami i opisami tresci:**

**Kategoria: Worksheet Creation (4 artykuly)**

1. **`public/blog/how-to-create-grammar-worksheets-with-ai.html`**
   - Title: "How to Create Grammar Worksheets with AI in 2026 — Step-by-Step Guide"
   - H2s: Why AI for Grammar, Step-by-Step (5 krokow z Edooqoo), Best Grammar Topics by CEFR Level (tabela A1-C2 z 5 tematami per level), Common Mistakes Teachers Make, How AI Adapts Grammar Difficulty, Tips for Effective Grammar Practice
   - FAQ: 5 pytan o grammar worksheets
   - Cross-links: grammar-worksheet-generator.html, exercise-types, cefr-worksheet-generator.html

2. **`public/blog/vocabulary-teaching-strategies-esl.html`**
   - Title: "10 Vocabulary Teaching Strategies for ESL Teachers — With AI Worksheet Examples"
   - H2s: 10 strategii (Contextual Learning, Word Families, Spaced Repetition, Collocations, Word Maps, Root Analysis, Semantic Fields, Personalized Lists, Active Usage, Review Games), How to Implement Each with Edooqoo
   - Cross-links: vocabulary-exercise-generator.html, spaced-repetition-flashcards-esl.html, prompts

3. **`public/blog/reading-comprehension-activities-english.html`**
   - Title: "15 Reading Comprehension Activities for English Classes — From A1 to C2"
   - H2s: 15 aktywnosci pogrupowanych per level (A1-A2: 5 basic, B1-B2: 5 intermediate, C1-C2: 5 advanced), How to Generate Reading Exercises with AI, Assessing Reading Skills
   - Cross-links: reading-comprehension-worksheet-maker.html, exercise-types, how-it-works

4. **`public/blog/fill-in-the-blanks-exercises-best-practices.html`**
   - Title: "Fill in the Blanks Exercises — Best Practices for English Teachers"
   - H2s: When to Use Gap-Fill, Types of Gap-Fill (grammar-focused, vocabulary-focused, cloze), Creating Effective Distractors, Scaffolding by CEFR Level, AI-Generated vs Manual, Grading Strategies
   - Cross-links: fill-in-the-blanks-worksheet-generator.html, grammar-worksheet-generator.html, ai-grading

**Kategoria: Teaching Methods (4 artykuly)**

5. **`public/blog/differentiated-instruction-english-classroom.html`**
   - Title: "Differentiated Instruction in the English Classroom — A Practical Guide"
   - H2s: What is Differentiated Instruction, Why It Matters in ESL/EFL, 6 Strategies (Content, Process, Product, Environment, Assessment, Pacing), How AI Personalizes Materials, Real Classroom Examples, Assessment Approaches
   - Cross-links: ai-tools-for-private-english-tutors.html, esl-student-progress-tracking-tool.html, cefr-worksheet-generator.html

6. **`public/blog/how-to-assess-english-level-cefr.html`**
   - Title: "How to Assess English Level Using CEFR — Complete Teacher's Guide"
   - H2s: What is CEFR, 6 Levels Explained (A1-C2 po 200 slow kazdy), Can-Do Statements per Level, Formal vs Informal Assessment, Placement Testing with AI, Tracking Progress Over Time
   - Cross-links: cefr-worksheet-generator.html, a1 through c2 pages, esl-student-progress-tracking

7. **`public/blog/teaching-english-online-complete-guide.html`**
   - Title: "Teaching English Online in 2026 — Complete Guide for ESL Teachers"
   - H2s: Setting Up Online Classes, Essential Tools, Lesson Structure, Engagement Techniques, Managing Multiple Students, Scheduling & Booking, Assessment Online, Growing Your Online Tutoring Business
   - Cross-links: ai-tools-for-online-esl-teachers.html, online-english-teaching-tools.html, how-to-save-time

8. **`public/blog/spaced-repetition-vocabulary-learning.html`**
   - Title: "Spaced Repetition for Vocabulary Learning — How It Works and Why Teachers Should Use It"
   - H2s: The Science Behind Spaced Repetition, SM-2 Algorithm Explained Simply, Ebbinghaus Forgetting Curve, How to Implement in ESL Classes, Digital vs Paper Flashcards, Tracking Student Retention, Best Practices
   - Cross-links: spaced-repetition-flashcards-esl.html, vocabulary-exercise-generator.html, glossary

**Kategoria: AI in Education (4 artykuly)**

9. **`public/blog/ai-tools-for-english-teachers-2026.html`**
   - Title: "Best AI Tools for English Teachers in 2026 — Complete Guide"
   - H2s: Overview of AI in ELT, Categories (Worksheet Gen, Grading, Flashcards, Lesson Planning, Assessment), Tool Comparison Table (Edooqoo, ChatGPT, Twee, MagicSchool, Quizlet — 8 kryteriow), How to Choose, Getting Started with AI, Future of AI in Teaching
   - Cross-links: best-ai-tools-for-esl-teachers.html, vs-twee, vs-magicschool, ai-lesson-planning

10. **`public/blog/ai-homework-grading-for-english-teachers.html`**
    - Title: "AI Homework Grading for English Teachers — Save Hours Every Week"
    - H2s: The Homework Grading Problem, How AI Grading Works, What AI Can and Cannot Grade, Open-Ended vs Closed Answers, Teacher Review Workflow, Time Savings Calculator, Implementation Guide
    - Cross-links: ai-grading-tool-for-english-homework.html, esl-homework-grading-tool.html, how-to-save-time

11. **`public/blog/ai-generated-listening-exercises-esl.html`**
    - Title: "AI-Generated Listening Exercises for ESL — How Text-to-Speech Changes Language Teaching"
    - H2s: The Listening Gap in ESL, How AI TTS Works, 5 Types of Listening Exercises, Creating Listening Materials with AI, Scaffolding by Level, Assessment Strategies, Comparing AI TTS vs Native Recordings
    - Cross-links: listening-comprehension-exercises-esl.html, exercise-types, how-to-create

12. **`public/blog/personalized-learning-english-teaching.html`**
    - Title: "Personalized Learning in English Teaching — From Theory to AI-Powered Practice"
    - H2s: What is Personalized Learning, Learning Styles in ESL, Student Profiles & Knowledge Mapping, Nano-Skills and Mastery Tracking, AI-Driven Personalization, Implementing in Your Classes, Measuring Impact
    - Cross-links: esl-student-progress-tracking-tool.html, ai-tools-for-private-english-tutors.html, how-it-works

**Kategoria: Exam & Business (3 artykuly)**

13. **`public/blog/cambridge-exam-preparation-tips-teachers.html`**
    - Title: "Cambridge Exam Preparation — Tips and Worksheet Strategies for Teachers"
    - H2s: Overview of Cambridge Exams (KET, PET, FCE, CAE, CPE), Exercise Types per Exam, Creating Practice Materials, AI-Generated Exam Practice, Common Student Mistakes, Study Schedule Template, Assessment & Mock Tests
    - Cross-links: exam-preparation-worksheets-cambridge-ielts.html, grammar-worksheet-generator.html, reading-comprehension

14. **`public/blog/teaching-business-english-guide.html`**
    - Title: "Teaching Business English — Complete Guide for ESL Tutors and Language Schools"
    - H2s: What Makes Business English Different, Key Topic Areas (Meetings, Emails, Negotiations, Presentations, Reports), Industry-Specific Vocabulary, Role-Play Activities, Assessment for Corporate Clients, Using AI for Business English Materials, Pricing Your Services
    - Cross-links: business-english-worksheet-generator.html, vocabulary-exercise-generator.html, worksheet-generator-for-language-schools.html

15. **`public/blog/ielts-preparation-worksheets-guide.html`**
    - Title: "IELTS Preparation Worksheets — A Teacher's Guide to Effective Practice Materials"
    - H2s: IELTS Format Overview (Listening, Reading, Writing, Speaking), Creating Practice Worksheets per Section, Academic vs General Training, Scoring & Band Descriptors, AI-Generated IELTS Practice, Common Mistakes Students Make, 4-Week Prep Plan Template
    - Cross-links: exam-preparation-worksheets-cambridge-ielts.html, listening-comprehension-exercises-esl.html, reading-comprehension

---

## BLOK D: Rozbudowa tresci 8 istniejacych kluczowych stron do 1500-2500 slow

Kazda z tych stron ma obecnie ~300-500 slow. Dodac 3-5 nowych sekcji H2 + rozszerzone FAQ.

**1. `public/ai-worksheet-generator-for-english-teachers.html`** (obecne ~500 slow → 2000)
Dodac sekcje:
- H2 "Grammar Topics You Can Generate" — tabela: 20 tematow gramatycznych z przykladami per CEFR level
- H2 "Vocabulary Topics & Themes" — lista 30 tematow (Travel, Food, Technology, Environment, Health, etc.)
- H2 "How AI Personalizes Content" — 3 akapity o profilu studenta, knowledge map, learning path
- H2 "What Teachers Say About AI Worksheets" — 5 cytatow/testimoniali (mozna generyczne)
- H2 "Tips for Better AI-Generated Worksheets" — 7 tipow (be specific about level, add context, mix exercise types, etc.)
- 5 dodatkowych FAQ (np. "Can I edit AI-generated content?", "Does AI use my student data?", etc.)

**2. `public/best-ai-tools-for-esl-teachers.html`** (~600 → 2000)
Dodac:
- H2 "How We Evaluated These Tools" — 8 kryteriow oceny
- H2 "Detailed Comparison Table" — wieksza tabela z wiecej narzedziami
- H2 "Getting Started with AI Teaching Tools" — 5-krokowy guide
- H2 "Common Concerns About AI in Teaching" — 5 obaw i odpowiedzi
- 5 dodatkowych FAQ

**3. `public/cefr-worksheet-generator.html`** (~400 → 2000)
Dodac:
- H2 per level (A1 przez C2) — kazdy z 3 akapitami: co uczen umie, jakie cwiczenia, jakie tematy
- H2 "Mixed-Level Classes" — jak obsluzyc rozne poziomy na jednej lekcji
- H2 "Assessing and Reassessing CEFR Level" — jak sprawdzic czy uczen awansowal
- 5 dodatkowych FAQ

**4. `public/how-to-create-english-worksheets-with-ai.html`** (~400 → 1800)
Dodac:
- H2 "Detailed Step-by-Step Tutorial" — 8 krokow z opisami
- H2 "Common Worksheet Design Mistakes" — 6 bledow
- H2 "Adapting Worksheets for Different Learning Styles" — visual, auditory, kinesthetic
- H2 "Worksheet Templates by Lesson Type" — 5 templateow (grammar lesson, vocabulary lesson, conversation class, exam prep, revision)
- 5 dodatkowych FAQ

**5. `public/esl-homework-grading-tool.html`** (~400 → 1500)
Dodac:
- H2 "Types of Exercises AI Can Grade" — lista z przykladami
- H2 "The Teacher Review Workflow" — jak wyglada review
- H2 "Time Savings Analysis" — tabela: manual grading time vs AI-assisted
- H2 "Setting Up Homework Assignments" — 5 krokow
- 3 dodatkowe FAQ

**6. `public/exam-preparation-worksheets-cambridge-ielts.html`** (~400 → 1800)
Dodac:
- H2 per egzamin: KET, PET, FCE, CAE, CPE, IELTS Academic, IELTS General — po 150 slow
- H2 "Creating Mock Tests with AI" — jak uzyc Edooqoo do mock tests
- H2 "Study Schedule Templates" — 4-week i 8-week plany
- 5 dodatkowych FAQ

**7. `public/business-english-worksheet-generator.html`** (~400 → 1800)
Dodac:
- H2 "Industry-Specific Topics" — Finance, IT, Marketing, HR, Legal, Medical — po 100 slow
- H2 "Business English Exercise Types" — ktore z 29 typow najlepsze
- H2 "Corporate Training Programs" — jak uzywac z grupami firmowymi
- H2 "Assessment for Business English" — jak mierzyc postepy
- 5 dodatkowych FAQ

**8. `public/ai-lesson-planning-for-english-teachers.html`** (~400 → 1500)
Dodac:
- H2 "45-Minute Lesson Plan Template" — szczegolowy plan z AI workshetem
- H2 "60-Minute Lesson Plan Template" — j.w.
- H2 "Planning for Different Class Types" — 1-on-1, small group, large class
- H2 "Integrating AI into Your Existing Curriculum" — 4 kroki
- 3 dodatkowe FAQ

---

## BLOK E: Static HTML backup — `/resources` i `/blog`

**`public/resources.html`** — statyczny backup z pelna lista linkow do wszystkich 50+ zasobow. Canonical → `https://edooqoo.com/resources`. Schemat `CollectionPage` JSON-LD.

**`public/blog.html`** — statyczny backup indeksu bloga z lista 15 artykulow. Canonical → `https://edooqoo.com/blog`. Schemat `Blog` JSON-LD.

---

## BLOK F: Preconnect i performance hints

**Plik:** `index.html` — dodac do `<head>`:
```html
<link rel="preconnect" href="https://bvfrkzdlklyvnhlpleck.supabase.co">
<link rel="dns-prefetch" href="https://bvfrkzdlklyvnhlpleck.supabase.co">
```

---

## BLOK G: Aktualizacja sitemap.xml

Dodac `<lastmod>2026-03-11</lastmod>` do KAZDEGO istniejacego URL.

Dodac nowe URL-e:
```xml
<!-- Phase 5: Hub pages -->
<url><loc>https://edooqoo.com/resources</loc><priority>0.9</priority><changefreq>weekly</changefreq><lastmod>2026-03-11</lastmod></url>
<url><loc>https://edooqoo.com/blog</loc><priority>0.9</priority><changefreq>weekly</changefreq><lastmod>2026-03-11</lastmod></url>
<!-- Phase 5: Blog articles -->
<url><loc>https://edooqoo.com/blog/how-to-create-grammar-worksheets-with-ai.html</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>2026-03-11</lastmod></url>
<url><loc>https://edooqoo.com/blog/vocabulary-teaching-strategies-esl.html</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>2026-03-11</lastmod></url>
<url><loc>https://edooqoo.com/blog/reading-comprehension-activities-english.html</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>2026-03-11</lastmod></url>
<url><loc>https://edooqoo.com/blog/fill-in-the-blanks-exercises-best-practices.html</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>2026-03-11</lastmod></url>
<url><loc>https://edooqoo.com/blog/differentiated-instruction-english-classroom.html</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>2026-03-11</lastmod></url>
<url><loc>https://edooqoo.com/blog/how-to-assess-english-level-cefr.html</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>2026-03-11</lastmod></url>
<url><loc>https://edooqoo.com/blog/teaching-english-online-complete-guide.html</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>2026-03-11</lastmod></url>
<url><loc>https://edooqoo.com/blog/spaced-repetition-vocabulary-learning.html</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>2026-03-11</lastmod></url>
<url><loc>https://edooqoo.com/blog/ai-tools-for-english-teachers-2026.html</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>2026-03-11</lastmod></url>
<url><loc>https://edooqoo.com/blog/ai-homework-grading-for-english-teachers.html</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>2026-03-11</lastmod></url>
<url><loc>https://edooqoo.com/blog/ai-generated-listening-exercises-esl.html</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>2026-03-11</lastmod></url>
<url><loc>https://edooqoo.com/blog/personalized-learning-english-teaching.html</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>2026-03-11</lastmod></url>
<url><loc>https://edooqoo.com/blog/cambridge-exam-preparation-tips-teachers.html</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>2026-03-11</lastmod></url>
<url><loc>https://edooqoo.com/blog/teaching-business-english-guide.html</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>2026-03-11</lastmod></url>
<url><loc>https://edooqoo.com/blog/ielts-preparation-worksheets-guide.html</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>2026-03-11</lastmod></url>
```

Razem: 53 istniejace + 17 nowych = **70 URL-i** w sitemap.

---

## BLOK H: Aktualizacja discovery files

### H1. `llms.txt` — dodac sekcje Blog i Resources
```markdown
## Resource Center
- [All Resources](https://edooqoo.com/resources)
- [Blog](https://edooqoo.com/blog)

## Blog Articles
- [How to Create Grammar Worksheets with AI](https://edooqoo.com/blog/how-to-create-grammar-worksheets-with-ai.html)
- [10 Vocabulary Teaching Strategies for ESL](https://edooqoo.com/blog/vocabulary-teaching-strategies-esl.html)
- [15 Reading Comprehension Activities](https://edooqoo.com/blog/reading-comprehension-activities-english.html)
- [Fill in the Blanks Best Practices](https://edooqoo.com/blog/fill-in-the-blanks-exercises-best-practices.html)
- [Differentiated Instruction in English](https://edooqoo.com/blog/differentiated-instruction-english-classroom.html)
- [How to Assess English Level Using CEFR](https://edooqoo.com/blog/how-to-assess-english-level-cefr.html)
- [Teaching English Online Complete Guide](https://edooqoo.com/blog/teaching-english-online-complete-guide.html)
- [Spaced Repetition for Vocabulary](https://edooqoo.com/blog/spaced-repetition-vocabulary-learning.html)
- [Best AI Tools for English Teachers 2026](https://edooqoo.com/blog/ai-tools-for-english-teachers-2026.html)
- [AI Homework Grading Guide](https://edooqoo.com/blog/ai-homework-grading-for-english-teachers.html)
- [AI-Generated Listening Exercises](https://edooqoo.com/blog/ai-generated-listening-exercises-esl.html)
- [Personalized Learning in English Teaching](https://edooqoo.com/blog/personalized-learning-english-teaching.html)
- [Cambridge Exam Preparation Tips](https://edooqoo.com/blog/cambridge-exam-preparation-tips-teachers.html)
- [Teaching Business English Guide](https://edooqoo.com/blog/teaching-business-english-guide.html)
- [IELTS Preparation Worksheets Guide](https://edooqoo.com/blog/ielts-preparation-worksheets-guide.html)
```

### H2. `openapi.yaml` — dodac paths
Dodac `/resources`, `/blog`, i kazdy z 15 artykulow blogowych jako path z operationId i description.

### H3. `BreadcrumbList` w `index.html` — dodac Resources i Blog
```json
{"@type":"ListItem","position":8,"name":"Resources","item":"https://edooqoo.com/resources"},
{"@type":"ListItem","position":9,"name":"Blog","item":"https://edooqoo.com/blog"}
```

---

## Podsumowanie ilosciowe

| Element | Przed Phase 5 | Po Phase 5 | Zmiana |
|---------|---------------|------------|--------|
| GlobalFooter links | 7 | 30 | +23 |
| React routes (publiczne) | 7 | 9 (+/resources, /blog) | +2 |
| Statyczne HTML pages | 35 | 52 (+15 blog + resources.html + blog.html) | +17 |
| Sitemap entries | 53 | 70 | +17 |
| Slowa na 8 kluczowych stronach | 300-500 | 1500-2500 | x3-5 |
| Blog articles | 0 | 15 | +15 |
| Internal links per page (footer) | 7 | 30 | x4 |

## Lista plikow do utworzenia/edycji

**Nowe pliki (19):**
- `src/pages/Resources.tsx`
- `src/pages/Blog.tsx`
- `public/resources.html`
- `public/blog.html`
- `public/blog/how-to-create-grammar-worksheets-with-ai.html`
- `public/blog/vocabulary-teaching-strategies-esl.html`
- `public/blog/reading-comprehension-activities-english.html`
- `public/blog/fill-in-the-blanks-exercises-best-practices.html`
- `public/blog/differentiated-instruction-english-classroom.html`
- `public/blog/how-to-assess-english-level-cefr.html`
- `public/blog/teaching-english-online-complete-guide.html`
- `public/blog/spaced-repetition-vocabulary-learning.html`
- `public/blog/ai-tools-for-english-teachers-2026.html`
- `public/blog/ai-homework-grading-for-english-teachers.html`
- `public/blog/ai-generated-listening-exercises-esl.html`
- `public/blog/personalized-learning-english-teaching.html`
- `public/blog/cambridge-exam-preparation-tips-teachers.html`
- `public/blog/teaching-business-english-guide.html`
- `public/blog/ielts-preparation-worksheets-guide.html`

**Edytowane pliki (14):**
- `src/components/GlobalFooter.tsx` (BLOK B)
- `src/App.tsx` (2 nowe routes)
- `index.html` (preconnect + BreadcrumbList update)
- `public/sitemap.xml` (70 entries + lastmod)
- `public/llms.txt` (+2 sekcje)
- `public/openapi.yaml` (+17 paths)
- `public/ai-worksheet-generator-for-english-teachers.html` (rozbudowa)
- `public/best-ai-tools-for-esl-teachers.html` (rozbudowa)
- `public/cefr-worksheet-generator.html` (rozbudowa)
- `public/how-to-create-english-worksheets-with-ai.html` (rozbudowa)
- `public/esl-homework-grading-tool.html` (rozbudowa)
- `public/exam-preparation-worksheets-cambridge-ielts.html` (rozbudowa)
- `public/business-english-worksheet-generator.html` (rozbudowa)
- `public/ai-lesson-planning-for-english-teachers.html` (rozbudowa)

**Razem: 33 pliki** (19 nowych + 14 edytowanych)

## Kolejnosc implementacji
1. BLOK B (GlobalFooter) — 1 plik, natychmiastowy efekt na calej stronie
2. BLOK F (preconnect w index.html) + BLOK H3 (BreadcrumbList) — 1 plik
3. BLOK A (Resources.tsx) + route w App.tsx
4. BLOK C1 (Blog.tsx) + route w App.tsx
5. BLOK E (resources.html + blog.html backupy)
6. BLOK C2 (15 artykulow blogowych) — po 3 pliki na raz
7. BLOK D (rozbudowa 8 stron) — po 2 pliki na raz
8. BLOK G (sitemap.xml)
9. BLOK H1+H2 (llms.txt + openapi.yaml)

