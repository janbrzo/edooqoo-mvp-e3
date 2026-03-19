

# Plan: Phase 10 — Infrastruktura Phase 9 + 30 nowych artykułów

## Stan obecny — co jest zsynchronizowane, a co nie

W folderze `public/blog/` mamy **57 plików HTML**, ale infrastruktura SEO zna tylko **27** z nich (Phase 1-8). Oznacza to, że **30 artykułów Phase 9** (Young Learners, Vocabulary, Grammar Deep Dive, Assessment, Activities, Professional Dev) jest "osieroconych" — istnieją fizycznie, ale:

- **sitemap.xml** — 126 entries, brakuje 30 z Phase 9
- **Blog.tsx** — 27 wpisów, brakuje 30 z Phase 9
- **blog.html** — 6 sekcji, brakuje 6 nowych sekcji Phase 9
- **openapi.yaml** — 677 linii, brakuje 30 paths Phase 9
- **llms.txt** — brakuje 6 sekcji Phase 9
- **resources.html** — brak cross-linków do nowych klastrów

**Dwa cele w jednym kroku:**
1. Zsynchronizować infrastrukturę z 30 istniejącymi artykułami Phase 9
2. Stworzyć 30 zupełnie nowych artykułów (Phase 10) + od razu zsynchronizować ich infrastrukturę

---

## 30 nowych artykułów Phase 10

### Klaster G: "Culture & Cross-Cultural" (5 artykułów)

| # | Plik | H1 |
|---|------|----|
| 1 | `teaching-culture-esl-classroom.html` | Teaching Culture in the ESL Classroom |
| 2 | `cross-cultural-communication-activities.html` | Cross-Cultural Communication Activities for ESL |
| 3 | `using-films-english-teaching.html` | Using Films and Videos in English Teaching |
| 4 | `teaching-english-through-literature.html` | Teaching English Through Literature — Practical Guide |
| 5 | `current-events-esl-lessons.html` | Using Current Events in ESL Lessons |

### Klaster H: "Technology in Teaching" (5 artykułów)

| # | Plik | H1 |
|---|------|----|
| 6 | `best-apps-learning-english-2026.html` | Best Apps for Learning English in 2026 |
| 7 | `using-google-workspace-esl-teachers.html` | Using Google Workspace for ESL Teachers |
| 8 | `creating-interactive-worksheets-online.html` | Creating Interactive Worksheets Online — Tools and Tips |
| 9 | `video-conferencing-tips-online-esl.html` | Video Conferencing Tips for Online ESL Teachers |
| 10 | `ai-lesson-planning-strategies.html` | AI Lesson Planning Strategies for English Teachers |

### Klaster I: "Specialized Learner Groups" (5 artykułów)

| # | Plik | H1 |
|---|------|----|
| 11 | `teaching-english-immigrants-refugees.html` | Teaching English to Immigrants and Refugees |
| 12 | `english-for-specific-purposes-guide.html` | English for Specific Purposes (ESP) — Teacher's Guide |
| 13 | `teaching-english-learning-disabilities.html` | Teaching English to Students with Learning Disabilities |
| 14 | `multilevel-esl-classroom-strategies.html` | Managing a Multilevel ESL Classroom |
| 15 | `teaching-english-one-to-one.html` | Teaching English One-to-One — Private Lesson Guide |

### Klaster J: "Writing & Communication" (5 artykułów)

| # | Plik | H1 |
|---|------|----|
| 16 | `teaching-email-writing-esl.html` | Teaching Email Writing to ESL Students |
| 17 | `creative-writing-activities-esl.html` | Creative Writing Activities for ESL Classes |
| 18 | `teaching-presentation-skills-english.html` | Teaching Presentation Skills in English |
| 19 | `discussion-questions-esl-topics.html` | 100 Discussion Questions for ESL Classes — By Topic |
| 20 | `teaching-formal-informal-english.html` | Teaching Formal vs Informal English — Register Guide |

### Klaster K: "Lesson Resources & Seasonal" (5 artykułów)

| # | Plik | H1 |
|---|------|----|
| 21 | `first-day-esl-class-activities.html` | First Day of ESL Class — Activities and Icebreakers |
| 22 | `end-of-term-activities-esl.html` | End-of-Term Activities for ESL Classes |
| 23 | `holiday-themed-esl-activities.html` | Holiday-Themed ESL Activities and Worksheets |
| 24 | `substitute-teacher-esl-lesson-plans.html` | Substitute Teacher ESL Lesson Plans — Ready to Go |
| 25 | `five-minute-filler-activities-esl.html` | 20 Five-Minute Filler Activities for ESL |

### Klaster L: "Language Systems & Analysis