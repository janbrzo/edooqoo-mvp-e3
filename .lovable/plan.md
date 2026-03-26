

# Plan: Phase 15 — Infrastruktura Phase 14 + Redystrybucja dat + 30 nowych artykułów

## ZADANIE 1: Dokończenie infrastruktury Phase 14

Brakuje 30 artykułów Phase 14 w trzech plikach. Dokładna treść do dodania:

### openapi.yaml — +30 paths (po linii 1660)

```yaml
  /blog/managing-behavior-esl-classroom.html:
    get:
      operationId: getBlogManagingBehavior
      summary: Managing Behavior in the ESL Classroom
      description: Positive discipline, behavior contracts, and de-escalation.
      responses: { '200': { description: Blog article HTML } }
  /blog/seating-arrangements-esl-classroom.html:
    get:
      operationId: getBlogSeatingArrangements
      summary: Seating Arrangements for the ESL Classroom
      description: U-shape, clusters, rows, and flexible seating.
      responses: { '200': { description: Blog article HTML } }
  /blog/transitions-activities-esl-classroom.html:
    get:
      operationId: getBlogTransitions
      summary: Smooth Transitions Between Activities in ESL
      description: Transition signals, timer techniques, momentum.
      responses: { '200': { description: Blog article HTML } }
  /blog/energy-management-esl-lessons.html:
    get:
      operationId: getBlogEnergyManagement
      summary: Energy Management in ESL Lessons
      description: Stirrers vs settlers, lesson arc, pacing.
      responses: { '200': { description: Blog article HTML } }
  /blog/managing-large-esl-classes.html:
    get:
      operationId: getBlogLargeClasses
      summary: Managing Large ESL Classes
      description: Monitoring, choral work, group roles for 30+ students.
      responses: { '200': { description: Blog article HTML } }
  /blog/teaching-essay-structure-esl.html:
    get:
      operationId: getBlogEssayStructure
      summary: Teaching Essay Structure to ESL Students
      description: Thesis statements, topic sentences, paragraph unity.
      responses: { '200': { description: Blog article HTML } }
  /blog/process-writing-approach-esl.html:
    get:
      operationId: getBlogProcessWriting
      summary: The Process Writing Approach in ESL
      description: Brainstorming, drafting, revising, editing, publishing.
      responses: { '200': { description: Blog article HTML } }
  /blog/peer-editing-workshops-esl.html:
    get:
      operationId: getBlogPeerEditing
      summary: Running Peer Editing Workshops in ESL
      description: Peer review training, feedback forms, protocols.
      responses: { '200': { description: Blog article HTML } }
  /blog/journal-writing-esl-students.html:
    get:
      operationId: getBlogJournalWriting
      summary: Journal Writing for ESL Students
      description: Dialogue journals, reflective journals, prompts.
      responses: { '200': { description: Blog article HTML } }
  /blog/portfolio-assessment-esl-writing.html:
    get:
      operationId: getBlogPortfolioAssessment
      summary: Portfolio Assessment for ESL Writing
      description: Selection criteria, showcase vs working portfolios.
      responses: { '200': { description: Blog article HTML } }
  /blog/teaching-medical-english.html:
    get:
      operationId: getBlogMedicalEnglish
      summary: Teaching Medical English
      description: Medical terminology, patient communication, role-plays.
      responses: { '200': { description: Blog article HTML } }
  /blog/teaching-legal-english.html:
    get:
      operationId: getBlogLegalEnglish
      summary: Teaching Legal English
      description: Legal vocabulary, contracts, moot court.
      responses: { '200': { description: Blog article HTML } }
  /blog/teaching-english-hospitality-tourism.html:
    get:
      operationId: getBlogHospitalityEnglish
      summary: Teaching English for Hospitality and Tourism
      description: Hotel, restaurant, travel scenarios.
      responses: { '200': { description: Blog article HTML } }
  /blog/teaching-english-it-professionals.html:
    get:
      operationId: getBlogITEnglish
      summary: Teaching English for IT Professionals
      description: Technical docs, Agile vocabulary, code review.
      responses: { '200': { description: Blog article HTML } }
  /blog/teaching-aviation-english.html:
    get:
      operationId: getBlogAviationEnglish
      summary: Teaching Aviation English
      description: ICAO Level 4+, radiotelephony, emergency drills.
      responses: { '200': { description: Blog article HTML } }
  /blog/clil-methodology-complete-guide.html:
    get:
      operationId: getBlogCLIL
      summary: CLIL Methodology Complete Guide
      description: 4Cs framework, lesson planning, assessment.
      responses: { '200': { description: Blog article HTML } }
  /blog/teaching-science-through-english.html:
    get:
      operationId: getBlogScienceEnglish
      summary: Teaching Science Through English — CLIL
      description: Lab reports, experiments, scientific vocabulary.
      responses: { '200': { description: Blog article HTML } }
  /blog/emi-english-medium-instruction-guide.html:
    get:
      operationId: getBlogEMI
      summary: English as Medium of Instruction Guide
      description: Lecture scaffolding, academic language support.
      responses: { '200': { description: Blog article HTML } }
  /blog/bilingual-education-models-comparison.html:
    get:
      operationId: getBlogBilingualEducation
      summary: Bilingual Education Models Comparison
      description: Transitional, maintenance, dual-language, immersion.
      responses: { '200': { description: Blog article HTML } }
  /blog/academic-language-functions-clil.html:
    get:
      operationId: getBlogAcademicFunctions
      summary: Academic Language Functions in CLIL
      description: Classifying, hypothesizing, comparing by subject.
      responses: { '200': { description: Blog article HTML } }
  /blog/designing-english-midterm-final-exams.html:
    get:
      operationId: getBlogExamDesign
      summary: Designing English Midterm and Final Exams
      description: Item types, spec tables, difficulty calibration.
      responses: { '200': { description: Blog article HTML } }
  /blog/cloze-test-design-esl.html:
    get:
      operationId: getBlogClozeTest
      summary: Designing Cloze Tests for ESL
      description: Fixed-ratio, rational, C-test, banked cloze.
      responses: { '200': { description: Blog article HTML } }
  /blog/item-analysis-english-tests.html:
    get:
      operationId: getBlogItemAnalysis
      summary: Item Analysis for English Tests
      description: Facility value, discrimination index, distractors.
      responses: { '200': { description: Blog article HTML } }
  /blog/washback-effect-language-testing.html:
    get:
      operationId: getBlogWashback
      summary: The Washback Effect in Language Testing
      description: Positive vs negative washback, test design.
      responses: { '200': { description: Blog article HTML } }
  /blog/alternative-assessment-esl-classroom.html:
    get:
      operationId: getBlogAlternativeAssessment
      summary: Alternative Assessment in ESL
      description: Presentations, podcasts, performance-based rubrics.
      responses: { '200': { description: Blog article HTML } }
  /blog/neurodiversity-esl-classroom.html:
    get:
      operationId: getBlogNeurodiversity
      summary: Neurodiversity in the ESL Classroom
      description: ADHD, autism, dyslexia accommodations.
      responses: { '200': { description: Blog article HTML } }
  /blog/trauma-informed-teaching-esl.html:
    get:
      operationId: getBlogTraumaInformed
      summary: Trauma-Informed Teaching in ESL
      description: Safety, predictability, relationship-building.
      responses: { '200': { description: Blog article HTML } }
  /blog/culturally-responsive-teaching-esl.html:
    get:
      operationId: getBlogCulturallyResponsive
      summary: Culturally Responsive Teaching in ESL
      description: Funds of knowledge, identity texts.
      responses: { '200': { description: Blog article HTML } }
  /blog/gender-inclusive-language-esl.html:
    get:
      operationId: getBlogGenderInclusive
      summary: Teaching Gender-Inclusive Language in ESL
      description: Pronouns, titles, evolving norms.
      responses: { '200': { description: Blog article HTML } }
  /blog/heritage-speakers-esl-classroom.html:
    get:
      operationId: getBlogHeritageSpeakers
      summary: Heritage Speakers in the ESL Classroom
      description: Bidialectal literacy, academic register.
      responses: { '200': { description: Blog article HTML } }
```

### blog.html — +30 JSON-LD + 6 sekcji kart

Dodać do tablicy JSON-LD (przed `]}` na linii 129) 30 nowych wpisów BlogPosting. Następnie dodać 6 nowych sekcji kart (przed CTA na linii 345):

**JSON-LD** (30 wpisów):
```json
{"@type":"BlogPosting","headline":"Managing Behavior in the ESL Classroom","url":"https://edooqoo.com/blog/managing-behavior-esl-classroom.html","datePublished":"2025-11-25"},
...analogicznie wszystkie 30 artykułów Phase 14...
```

**6 sekcji kart** (Classroom Management, Writing Skills, ESP by Industry, CLIL & Bilingual Education, Assessment Design, Inclusive & Diverse Classrooms) — identyczny format jak istniejące sekcje.

### resources.html — +30 linków z badge'ami

Dodać nową sekcję `<h2>Blog Articles — Classroom Management, Writing, ESP, CLIL, Assessment, Inclusive Teaching</h2>` z 30 linkami przed CTA (linia 303). Badges: `Classroom Management`, `Writing`, `ESP`, `CLIL`, `Assessment`, `Inclusive Teaching`.

---

## ZADANIE 2: Redystrybucja dat publikacji (177 → 1/dzień od 1.06.2025)

### Problem
Wszystkie 177 artykułów ma daty skupione w marcu 2026 (11, 16-21, 24-25 marca). Google i LLM preferują naturalny rytm publikacji.

### Rozwiązanie
Rozłożyć 177 artykułów po 1 dziennie, start: **2025-06-01** (niedziela). Artykuł #177 wypadnie na **2025-11-24**. Nowe 30 artykułów (Phase 15) kontynuują od **2025-11-25** do **2025-12-24**.

### Kolejność artykułów (zachowujemy istniejącą kolejność w Blog.tsx)

Artykuł #1 = `2025-06-01`, #2 = `2025-06-02`, ..., #177 = `2025-11-24`, #178 (Phase 15 pierwszy) = `2025-11-25`, ..., #207 = `2025-12-24`.

### Pliki do zmiany

**Mapa dat** — gotowa formuła:
```
date(index) = new Date(2025, 5, 1 + index)  // JS: month=5 = June
```

Konwersja na string: `"June 1, 2025"`, `"June 2, 2025"`, ..., `"November 24, 2025"`.

**6 plików wymaga aktualizacji dat:**

1. **`src/pages/Blog.tsx`** — zmienić pole `date` w każdym z 177 wpisów
2. **`public/blog.html`** — zmienić `datePublished` w JSON-LD (177 wpisów) + `<em>` daty w kartach
3. **`public/sitemap.xml`** — zmienić `<lastmod>` dla 177 artykułów blogowych
4. **30 plików HTML w `public/blog/`** (Phase 14) — zmienić `datePublished`/`dateModified` w JSON-LD
5. **117 plików HTML w `public/blog/`** (Phase 1-13) — zmienić `datePublished`/`dateModified`
6. **`public/llms.txt`** — nie wymaga zmian dat (nie ma tam dat)

**Uwaga**: Nowe 30 artykułów Phase 15 dostaną daty od razu poprawne (2025-11-25 do 2025-12-24).

### Gotowa mapa dat dla Blog.tsx (177 artykułów)

| # | Artykuł (href) | Nowa data |
|---|----------------|-----------|
| 1 | how-to-create-grammar-worksheets-with-ai | June 1, 2025 |
| 2 | vocabulary-teaching-strategies-esl | June 2, 2025 |
| 3 | reading-comprehension-activities-english | June 3, 2025 |
| ... | (1 dziennie) | ... |
| 15 | ielts-preparation-worksheets-guide | June 15, 2025 |
| 16 | communicative-language-teaching-activities | June 16, 2025 |
| ... | | |
| 87 | collaborating-with-mainstream-teachers-esl | August 26, 2025 |
| 88 | toefl-preparation-strategies-teachers | August 27, 2025 |
| ... | | |
| 117 | positive-error-culture-esl | September 25, 2025 |
| 118 | managing-behavior-esl-classroom | September 26, 2025 |
| ... | | |
| 147 | heritage-speakers-esl-classroom | October 25, 2025 |
| ... Phase 15 artykuły ... | |
| 148-177 | Phase 15 nowe 30 | October 26 – November 24, 2025 |

Implementacja: w Blog.tsx zamiast hardkodowania dat, wygenerować je programowo lub po prostu zaktualizować ręcznie każdy wpis.

---

## ZADANIE 3: Phase 15 — 30 nowych artykułów (177→207)

### Analiza luk

Po 177 artykułach w 35 kategoriach, brakuje pokrycia tych kluczowych obszarów:

### Klaster AE: "Curriculum & Course Design" (5 artykułów)

| # | Plik | H1 |
|---|------|----|
| 1 | `syllabus-design-esl-courses.html` | Syllabus Design for ESL Courses — A Complete Guide |
| 2 | `needs-analysis-esl-students.html` | Conducting Needs Analysis for ESL Students |
| 3 | `selecting-esl-textbooks-guide.html` | How to Select and Evaluate ESL Textbooks |
| 4 | `course-evaluation-esl-programs.html` | Evaluating ESL Course Effectiveness — Methods and Tools |
| 5 | `lesson-sequencing-scaffolding-curriculum.html` | Lesson Sequencing and Scaffolding in Curriculum Design |

### Klaster AF: "Drama & Creative Arts in ESL" (5 artykułów)

| # | Plik | H1 |
|---|------|----|
| 6 | `drama-techniques-esl-classroom.html` | Drama Techniques for the ESL Classroom |
| 7 | `improvisation-activities-esl.html` | Improvisation Activities for ESL Students |
| 8 | `readers-theatre-esl-activities.html` | Reader's Theatre in ESL — Scripts and Activities |
| 9 | `art-based-language-activities-esl.html` | Art-Based Language Activities for ESL Classes |
| 10 | `using-comics-graphic-novels-esl.html` | Using Comics and Graphic Novels in ESL Teaching |

### Klaster AG: "Cooperative & Collaborative Learning" (5 artykułów)

| # | Plik | H1 |
|---|------|----|
| 11 | `cooperative-learning-structures-esl.html` | Cooperative Learning Structures for ESL Classes |
| 12 | `jigsaw-activities-esl-classroom.html` | Jigsaw Activities for the ESL Classroom |
| 13 | `think-pair-share-esl-variations.html` | Think-Pair-Share and Variations for ESL |
| 14 | `group-dynamics-esl-classroom.html` | Managing Group Dynamics in the ESL Classroom |
| 15 | `collaborative-writing-activities-esl.html` | Collaborative Writing Activities for ESL Students |

### Klaster AH: "Second Language Acquisition Theory" (5 artykułów)

| # | Plik | H1 |
|---|------|----|
| 16 | `krashen-hypotheses-esl-teaching.html` | Krashen's Hypotheses Applied to ESL Teaching |
| 17 | `interlanguage-fossilization-esl.html` | Interlanguage and Fossilization — What Teachers Need to Know |
| 18 | `input-output-hypotheses-classroom.html` | Input and Output Hypotheses in the ESL Classroom |
| 19 | `critical-period-hypothesis-language.html` | The Critical Period Hypothesis — Implications for Teaching |
| 20 | `motivation-theories-language-learning.html` | Motivation Theories in Language Learning — From Gardner to Dornyei |

### Klaster AI: "Teacher Professional Development Advanced" (5 artykułów)

| # | Plik | H1 |
|---|------|----|
| 21 | `action-research-esl-teachers.html` | Action Research for ESL Teachers — A Practical Guide |
| 22 | `reflective-practice-language-teaching.html` | Reflective Practice in Language Teaching |
| 23 | `peer-observation-esl-teachers.html` | Peer Observation for ESL Teachers — Protocols and Feedback |
| 24 | `mentoring-new-esl-teachers.html` | Mentoring New ESL Teachers — A Guide for Experienced Educators |
| 25 | `cpd-planning-esl-teachers.html` | CPD Planning for ESL Teachers — Building Your Development Path |

### Klaster AJ: "Materials Development & Adaptation" (5 artykułów)

| # | Plik | H1 |
|---|------|----|
| 26 | `adapting-textbooks-esl-classroom.html` | Adapting Textbooks for the ESL Classroom |
| 27 | `creating-authentic-materials-esl.html` | Creating Authentic Materials for ESL Teaching |
| 28 | `supplementing-coursebooks-activities.html` | Supplementing Coursebooks — Activities and Resources |
| 29 | `digital-resource-curation-esl.html` | Digital Resource Curation for ESL Teachers |
| 30 | `materials-design-principles-elt.html` | Materials Design Principles for ELT |

### Specyfikacja techniczna

Identyczny format jak Phase 9-14. Daty: `2025-10-26` do `2025-11-24` (kontynuacja 1/dzień). JSON-LD `BlogPosting`, 1500+ słów, 4-6 H2, FAQ, 6-8 cross-linków, CTA `/signup`.

### Wpisy Blog.tsx — gotowe

```typescript
// Phase 15: Curriculum & Course Design (5)
{ title: "Syllabus Design for ESL Courses — A Complete Guide", description: "Structural, notional-functional, and task-based syllabi with planning templates.", href: "/blog/syllabus-design-esl-courses.html", category: "Curriculum Design", date: "October 26, 2025" },
{ title: "Conducting Needs Analysis for ESL Students", description: "Questionnaires, interviews, placement data, and learning objectives mapping.", href: "/blog/needs-analysis-esl-students.html", category: "Curriculum Design", date: "October 27, 2025" },
{ title: "How to Select and Evaluate ESL Textbooks", description: "Evaluation criteria, piloting strategies, and textbook adaptation frameworks.", href: "/blog/selecting-esl-textbooks-guide.html", category: "Curriculum Design", date: "October 28, 2025" },
{ title: "Evaluating ESL Course Effectiveness — Methods and Tools", description: "Pre/post testing, student feedback, observation, and outcome analysis.", href: "/blog/course-evaluation-esl-programs.html", category: "Curriculum Design", date: "October 29, 2025" },
{ title: "Lesson Sequencing and Scaffolding in Curriculum Design", description: "Spiral curriculum, task complexity grading, and coherent lesson chains.", href: "/blog/lesson-sequencing-scaffolding-curriculum.html", category: "Curriculum Design", date: "October 30, 2025" },

// Phase 15: Drama & Creative Arts (5)
{ title: "Drama Techniques for the ESL Classroom", description: "Hot-seating, freeze-frame, conscience alley, and forum theatre for language practice.", href: "/blog/drama-techniques-esl-classroom.html", category: "Drama & Arts", date: "October 31, 2025" },
{ title: "Improvisation Activities for ESL Students", description: "Yes-and, status games, character switches, and spontaneous dialogue building.", href: "/blog/improvisation-activities-esl.html", category: "Drama & Arts", date: "November 1, 2025" },
{ title: "Reader's Theatre in ESL — Scripts and Activities", description: "Script selection, fluency practice, intonation work, and performance preparation.", href: "/blog/readers-theatre-esl-activities.html", category: "Drama & Arts", date: "November 2, 2025" },
{ title: "Art-Based Language Activities for ESL Classes", description: "Drawing dictation, gallery walks, visual storytelling, and art response writing.", href: "/blog/art-based-language-activities-esl.html", category: "Drama & Arts", date: "November 3, 2025" },
{ title: "Using Comics and Graphic Novels in ESL Teaching", description: "Panel analysis, speech bubble writing, story creation, and visual literacy.", href: "/blog/using-comics-graphic-novels-esl.html", category: "Drama & Arts", date: "November 4, 2025" },

// Phase 15: Cooperative & Collaborative Learning (5)
{ title: "Cooperative Learning Structures for ESL Classes", description: "Kagan structures, numbered heads, round robin, and rally coach for ESL.", href: "/blog/cooperative-learning-structures-esl.html", category: "Cooperative Learning", date: "November 5, 2025" },
{ title: "Jigsaw Activities for the ESL Classroom", description: "Expert groups, information sharing, and accountability in jigsaw reading/listening.", href: "/blog/jigsaw-activities-esl-classroom.html", category: "Cooperative Learning", date: "November 6, 2025" },
{ title: "Think-Pair-Share and Variations for ESL", description: "Write-pair-share, think-pair-square, and rally robin adaptations.", href: "/blog/think-pair-share-esl-variations.html", category: "Cooperative Learning", date: "November 7, 2025" },
{ title: "Managing Group Dynamics in the ESL Classroom", description: "Role assignment, participation balancing, and conflict resolution in group work.", href: "/blog/group-dynamics-esl-classroom.html", category: "Cooperative Learning", date: "November 8, 2025" },
{ title: "Collaborative Writing Activities for ESL Students", description: "Round-robin stories, wiki writing, peer drafting, and collaborative essays.", href: "/blog/collaborative-writing-activities-esl.html", category: "Cooperative Learning", date: "November 9, 2025" },

// Phase 15: SLA Theory (5)
{ title: "Krashen's Hypotheses Applied to ESL Teaching", description: "Acquisition-learning, input hypothesis, monitor model, and affective filter in practice.", href: "/blog/krashen-hypotheses-esl-teaching.html", category: "SLA Theory", date: "November 10, 2025" },
{ title: "Interlanguage and Fossilization — What Teachers Need to Know", description: "Developmental stages, error analysis, and preventing fossilization strategies.", href: "/blog/interlanguage-fossilization-esl.html", category: "SLA Theory", date: "November 11, 2025" },
{ title: "Input and Output Hypotheses in the ESL Classroom", description: "Comprehensible input, pushed output, noticing hypothesis, and interaction.", href: "/blog/input-output-hypotheses-classroom.html", category: "SLA Theory", date: "November 12, 2025" },
{ title: "The Critical Period Hypothesis — Implications for Teaching", description: "Age effects, neuroplasticity, ultimate attainment, and pedagogical adaptations.", href: "/blog/critical-period-hypothesis-language.html", category: "SLA Theory", date: "November 13, 2025" },
{ title: "Motivation Theories in Language Learning — From Gardner to Dornyei", description: "Integrative/instrumental motivation, L2 Motivational Self System, and classroom strategies.", href: "/blog/motivation-theories-language-learning.html", category: "SLA Theory", date: "November 14, 2025" },

// Phase 15: Professional Development Advanced (5)
{ title: "Action Research for ESL Teachers — A Practical Guide", description: "Research questions, data collection, analysis cycles, and classroom implementation.", href: "/blog/action-research-esl-teachers.html", category: "Professional Dev", date: "November 15, 2025" },
{ title: "Reflective Practice in Language Teaching", description: "Reflective journals, critical incidents, Kolb's cycle, and peer reflection groups.", href: "/blog/reflective-practice-language-teaching.html", category: "Professional Dev", date: "November 16, 2025" },
{ title: "Peer Observation for ESL Teachers — Protocols and Feedback", description: "Pre-observation meetings, focus areas, observation tools, and post-observation dialogue.", href: "/blog/peer-observation-esl-teachers.html", category: "Professional Dev", date: "November 17, 2025" },
{ title: "Mentoring New ESL Teachers — A Guide for Experienced Educators", description: "Mentoring models, scaffolded autonomy, feedback frameworks, and mentor development.", href: "/blog/mentoring-new-esl-teachers.html", category: "Professional Dev", date: "November 18, 2025" },
{ title: "CPD Planning for ESL Teachers — Building Your Development Path", description: "SMART goals, conference selection, online courses, and portfolio documentation.", href: "/blog/cpd-planning-esl-teachers.html", category: "Professional Dev", date: "November 19, 2025" },

// Phase 15: Materials Development (5)
{ title: "Adapting Textbooks for the ESL Classroom", description: "Adding, deleting, modifying, and extending textbook activities for your context.", href: "/blog/adapting-textbooks-esl-classroom.html", category: "Materials Dev", date: "November 20, 2025" },
{ title: "Creating Authentic Materials for ESL Teaching", description: "Realia, news articles, menus, and real-world texts with grading techniques.", href: "/blog/creating-authentic-materials-esl.html", category: "Materials Dev", date: "November 21, 2025" },
{ title: "Supplementing Coursebooks — Activities and Resources", description: "When and how to go beyond the book with complementary materials.", href: "/blog/supplementing-coursebooks-activities.html", category: "Materials Dev", date: "November 22, 2025" },
{ title: "Digital Resource Curation for ESL Teachers", description: "Organizing bookmarks, evaluating online resources, and building a teaching library.", href: "/blog/digital-resource-curation-esl.html", category: "Materials Dev", date: "November 23, 2025" },
{ title: "Materials Design Principles for ELT", description: "Tomlinson's principles, task design, sequencing, and piloting new materials.", href: "/blog/materials-design-principles-elt.html", category: "Materials Dev", date: "November 24, 2025" },
```

### Infrastruktura Phase 15

Wszystkie te pliki aktualizujemy w jednym kroku razem z ZADANIEM 1 i 2:

- **openapi.yaml** — +30 paths Phase 14 + 30 paths Phase 15 = +60 paths
- **blog.html** — +30 JSON-LD Phase 14 + 30 JSON-LD Phase 15 + 12 sekcji kart + aktualizacja dat
- **resources.html** — +60 linków + aktualizacja
- **sitemap.xml** — +30 entries Phase 15 (276→306) + aktualizacja dat
- **llms.txt** — +6 sekcji Phase 15
- **Blog.tsx** — +30 wpisów + aktualizacja dat wszystkich 177 istniejących
- **30 nowych plików HTML** w `public/blog/`
- **177 istniejących plików HTML** — aktualizacja dat w JSON-LD

### llms.txt — 6 nowych sekcji Phase 15

```markdown
## Curriculum & Course Design (Blog)
- [Syllabus Design](https://edooqoo.com/blog/syllabus-design-esl-courses.html)
- [Needs Analysis](https://edooqoo.com/blog/needs-analysis-esl-students.html)
- [Textbook Selection](https://edooqoo.com/blog/selecting-esl-textbooks-guide.html)
- [Course Evaluation](https://edooqoo.com/blog/course-evaluation-esl-programs.html)
- [Lesson Sequencing](https://edooqoo.com/blog/lesson-sequencing-scaffolding-curriculum.html)

## Drama & Creative Arts (Blog)
- [Drama Techniques ESL](https://edooqoo.com/blog/drama-techniques-esl-classroom.html)
- [Improvisation Activities](https://edooqoo.com/blog/improvisation-activities-esl.html)
- [Reader's Theatre](https://edooqoo.com/blog/readers-theatre-esl-activities.html)
- [Art-Based Activities](https://edooqoo.com/blog/art-based-language-activities-esl.html)
- [Comics & Graphic Novels](https://edooqoo.com/blog/using-comics-graphic-novels-esl.html)

## Cooperative Learning (Blog)
- [Cooperative Structures](https://edooqoo.com/blog/cooperative-learning-structures-esl.html)
- [Jigsaw Activities](https://edooqoo.com/blog/jigsaw-activities-esl-classroom.html)
- [Think-Pair-Share](https://edooqoo.com/blog/think-pair-share-esl-variations.html)
- [Group Dynamics](https://edooqoo.com/blog/group-dynamics-esl-classroom.html)
- [Collaborative Writing](https://edooqoo.com/blog/collaborative-writing-activities-esl.html)

## SLA Theory (Blog)
- [Krashen's Hypotheses](https://edooqoo.com/blog/krashen-hypotheses-esl-teaching.html)
- [Interlanguage & Fossilization](https://edooqoo.com/blog/interlanguage-fossilization-esl.html)
- [Input & Output Hypotheses](https://edooqoo.com/blog/input-output-hypotheses-classroom.html)
- [Critical Period Hypothesis](https://edooqoo.com/blog/critical-period-hypothesis-language.html)
- [Motivation Theories](https://edooqoo.com/blog/motivation-theories-language-learning.html)

## Professional Development Advanced (Blog)
- [Action Research](https://edooqoo.com/blog/action-research-esl-teachers.html)
- [Reflective Practice](https://edooqoo.com/blog/reflective-practice-language-teaching.html)
- [Peer Observation](https://edooqoo.com/blog/peer-observation-esl-teachers.html)
- [Mentoring New Teachers](https://edooqoo.com/blog/mentoring-new-esl-teachers.html)
- [CPD Planning](https://edooqoo.com/blog/cpd-planning-esl-teachers.html)

## Materials Development (Blog)
- [Adapting Textbooks](https://edooqoo.com/blog/adapting-textbooks-esl-classroom.html)
- [Creating Authentic Materials](https://edooqoo.com/blog/creating-authentic-materials-esl.html)
- [Supplementing Coursebooks](https://edooqoo.com/blog/supplementing-coursebooks-activities.html)
- [Digital Resource Curation](https://edooqoo.com/blog/digital-resource-curation-esl.html)
- [Materials Design Principles](https://edooqoo.com/blog/materials-design-principles-elt.html)
```

---

## Podsumowanie zmian

| Plik | Akcja |
|------|-------|
| 30 nowych `public/blog/*.html` | NOWE — Phase 15 |
| 177 istniejących `public/blog/*.html` | EDYCJA — daty |
| `src/pages/Blog.tsx` | EDYCJA — +30 wpisów + daty 207 artykułów |
| `public/openapi.yaml` | EDYCJA — +60 paths (30 Ph14 + 30 Ph15) |
| `public/blog.html` | EDYCJA — +60 JSON-LD + 12 sekcji kart + daty |
| `public/resources.html` | EDYCJA — +60 linków |
| `public/sitemap.xml` | EDYCJA — +30 entries + daty (276→306) |
| `public/llms.txt` | EDYCJA — +6 sekcji Ph15 + update article count |

| Element | Przed | Po |
|---------|-------|----|
| Blog articles | 177 | 207 |
| Sitemap entries | 276 | 306 |
| Blog categories | 35 | 41 |
| Date range | March 11-25, 2026 | June 1 – Nov 24, 2025 |
| Publication rhythm | Batched | 1/day natural |

