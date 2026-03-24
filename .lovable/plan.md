

# Plan: Phase 13 — Fix Share Worksheet + Blog Expansion (30 artykułów)

## ZADANIE 1: Naprawa "Failed to load share link"

### Diagnoza

Znalazłem przyczynę. W edge function `generateWorksheet/index.ts` są **dwie ścieżki zapisu do bazy**:

1. **Streaming mode** (linia 588) — używany gdy `useStreaming = true` — **NIE zapisuje `share_token`**
2. **Non-streaming mode** (linia 813) — **zapisuje `share_token`** (dodany wcześniej)

Kiedy worksheet jest wygenerowany w trybie streaming, `share_token` w bazie jest NULL. Potem w `ShareWorksheetModal` fallback wywołuje RPC `generate_worksheet_share_token`, który zwraca 400 (prawdopodobnie problem z uprawnieniami lub kontekstem RPC).

### Naprawa (2 pliki)

**Plik 1: `supabase/functions/generateWorksheet/index.ts`** — dodanie `share_token` do ścieżki streaming

W bloku streaming (przed linią 588), dodać generowanie tokena:
```typescript
// Auto-generate share token at creation time (permanent, no expiration)
const shareToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
```

W insercie na linii 590-611, dodać:
```typescript
share_token: shareToken,
```

W `.select()` na linii 612, zmienić na:
```typescript
.select("id, created_at, title, share_token");
```

Po insercie (ok. linii 618-620), przekazać share_token do worksheetData:
```typescript
worksheetData.share_token = worksheet?.[0]?.share_token;
```

**Plik 2: `src/components/ShareWorksheetModal.tsx`** — ulepszenie fallbacku

Usunąć `as any` cast z RPC call (typy już mają tę funkcję). Dodać lepsze logowanie błędu:
```typescript
const { data: token, error: rpcError } = await supabase.rpc('generate_worksheet_share_token', {
  p_worksheet_id: worksheetId,
  p_teacher_id: user.id,
  p_expires_hours: 240
});

if (rpcError) {
  console.error('[ShareWorksheet] RPC error details:', rpcError);
  throw rpcError;
}
```

Po tym fixie nowo generowane worksheety (streaming i non-streaming) będą miały `share_token` od razu. Stare worksheety bez tokena użyją fallbacku RPC.

---

## ZADANIE 2: 30 nowych artykułów blogowych (Phase 13)

### Analiza luk — co jeszcze nie jest pokryte

Mamy 117 artykułów w 23 kategoriach. Po analizie pozostałych zapytań nauczycieli, zidentyfikowałem **6 nowych klastrów**:

### Klaster S: "TOEFL & Standardized Tests" (5 artykułów)

Mamy Cambridge i IELTS, ale brak TOEFL, TOEIC, Duolingo English Test.

| # | Plik | H1 |
|---|------|----|
| 1 | `toefl-preparation-strategies-teachers.html` | TOEFL Preparation Strategies for ESL Teachers |
| 2 | `toeic-preparation-worksheets-guide.html` | TOEIC Preparation — Worksheets and Practice Guide |
| 3 | `duolingo-english-test-preparation.html` | Duolingo English Test Preparation — Teacher's Guide |
| 4 | `teaching-test-taking-strategies-esl.html` | Teaching Test-Taking Strategies to ESL Students |
| 5 | `standardized-test-comparison-esl.html` | IELTS vs TOEFL vs Cambridge vs TOEIC — Which Test for Your Student? |

### Klaster T: "Classroom Language & Instructions" (5 artykułów)

Fundamentalny klaster — jak dawać instrukcje, classroom language.

| # | Plik | H1 |
|---|------|----|
| 6 | `classroom-language-esl-teachers.html` | Essential Classroom Language for ESL Teachers |
| 7 | `giving-instructions-esl-classroom.html` | Giving Clear Instructions in the ESL Classroom |
| 8 | `concept-checking-questions-esl.html` | Concept Checking Questions (CCQs) — The ESL Teacher's Secret Weapon |
| 9 | `teacher-talking-time-reducing.html` | Reducing Teacher Talking Time — Practical Strategies |
| 10 | `eliciting-techniques-esl-teaching.html` | Eliciting Techniques for ESL Teaching |

### Klaster U: "Reading Skills Deep Dive" (5 artykułów)

Mamy 1 artykuł o reading comprehension, ale brak pokrycia sub-tematów.

| # | Plik | H1 |
|---|------|----|
| 11 | `teaching-skimming-scanning-esl.html` | Teaching Skimming and Scanning — Reading Strategies for ESL |
| 12 | `teaching-critical-reading-esl.html` | Teaching Critical Reading Skills to ESL Students |
| 13 | `graded-readers-guide-esl-teachers.html` | Graded Readers — A Complete Guide for ESL Teachers |
| 14 | `teaching-reading-fluency-esl.html` | Teaching Reading Fluency in ESL Classes |
| 15 | `newspaper-articles-esl-lessons.html` | Using Newspaper Articles in ESL Lessons |

### Klaster V: "Online & Hybrid Teaching" (5 artykułów)

Mamy 1 ogólny artykuł o online teaching, ale brak pokrycia specyficznych aspektów.

| # | Plik | H1 |
|---|------|----|
| 16 | `hybrid-teaching-esl-strategies.html` | Hybrid Teaching Strategies for ESL Classes |
| 17 | `breakout-rooms-esl-activities.html` | Breakout Room Activities for Online ESL Classes |
| 18 | `digital-whiteboard-activities-esl.html` | Digital Whiteboard Activities for ESL Teachers |
| 19 | `asynchronous-learning-esl.html` | Asynchronous Learning Activities for ESL Students |
| 20 | `building-community-online-esl-class.html` | Building Community in Online ESL Classes |

### Klaster W: "Speaking & Fluency Development" (5 artykułów)

Mamy 1 artykuł o teaching speaking, ale brak pokrycia fluency drills, conversation, pronunciation integration.

| # | Plik | H1 |
|---|------|----|
| 21 | `fluency-activities-esl-classroom.html` | Fluency Activities for the ESL Classroom |
| 22 | `conversation-classes-esl-structure.html` | Structuring Conversation Classes for ESL Students |
| 23 | `teaching-functional-language-esl.html` | Teaching Functional Language — Requests, Complaints, Suggestions |
| 24 | `shadowing-technique-esl.html` | The Shadowing Technique — Improving Pronunciation and Fluency |
| 25 | `impromptu-speaking-activities-esl.html` | Impromptu Speaking Activities for ESL Classes |

### Klaster X: "Feedback & Correction Strategies" (5 artykułów)

Mamy 1 artykuł o error correction, ale brak pokrycia written feedback, oral correction timing, marking codes.

| # | Plik | H1 |
|---|------|----|
| 26 | `giving-written-feedback-esl.html` | Giving Effective Written Feedback to ESL Students |
| 27 | `oral-correction-timing-techniques.html` | When and How to Correct Speaking Errors in ESL |
| 28 | `marking-codes-esl-writing.html` | Using Marking Codes for ESL Writing Correction |
| 29 | `conferencing-with-esl-students.html` | One-on-One Conferencing with ESL Students — Feedback Guide |
| 30 | `positive-error-culture-esl.html` | Creating a Positive Error Culture in the ESL Classroom |

---

## Specyfikacja techniczna artykułów

Identyczny format jak Phase 9-11: `datePublished: 2026-03-24`, schemat `BlogPosting` JSON-LD, 1500+ słów, 4-6 H2, FAQ `<details>/<summary>`, 6-8 cross-linków wewnętrznych, CTA `/signup`, identyczny CSS.

---

## Aktualizacje infrastruktury

### Blog.tsx — +30 wpisów (117 → 147)

```typescript
// Phase 13: TOEFL & Standardized Tests (5)
{ title: "TOEFL Preparation Strategies for ESL Teachers", description: "Section-by-section strategies, practice materials, and score improvement techniques.", href: "/blog/toefl-preparation-strategies-teachers.html", category: "Standardized Tests", date: "March 24, 2026" },
{ title: "TOEIC Preparation — Worksheets and Practice Guide", description: "Listening and reading sections, business vocabulary, and test-day strategies.", href: "/blog/toeic-preparation-worksheets-guide.html", category: "Standardized Tests", date: "March 24, 2026" },
{ title: "Duolingo English Test Preparation — Teacher's Guide", description: "Adaptive format, question types, and preparation activities for students.", href: "/blog/duolingo-english-test-preparation.html", category: "Standardized Tests", date: "March 24, 2026" },
{ title: "Teaching Test-Taking Strategies to ESL Students", description: "Time management, elimination techniques, and anxiety reduction strategies.", href: "/blog/teaching-test-taking-strategies-esl.html", category: "Standardized Tests", date: "March 24, 2026" },
{ title: "IELTS vs TOEFL vs Cambridge vs TOEIC — Which Test for Your Student?", description: "Format comparison, scoring, acceptance, and choosing the right exam.", href: "/blog/standardized-test-comparison-esl.html", category: "Standardized Tests", date: "March 24, 2026" },

// Phase 13: Classroom Language & Instructions (5)
{ title: "Essential Classroom Language for ESL Teachers", description: "Grading language, checking understanding, and managing interaction patterns.", href: "/blog/classroom-language-esl-teachers.html", category: "Classroom Language", date: "March 24, 2026" },
{ title: "Giving Clear Instructions in the ESL Classroom", description: "ICQs, staging instructions, and demonstration techniques.", href: "/blog/giving-instructions-esl-classroom.html", category: "Classroom Language", date: "March 24, 2026" },
{ title: "Concept Checking Questions (CCQs) — The ESL Teacher's Secret Weapon", description: "Writing effective CCQs for grammar, vocabulary, and functional language.", href: "/blog/concept-checking-questions-esl.html", category: "Classroom Language", date: "March 24, 2026" },
{ title: "Reducing Teacher Talking Time — Practical Strategies", description: "Student-centered activities, wait time, and minimizing unnecessary TTT.", href: "/blog/teacher-talking-time-reducing.html", category: "Classroom Language", date: "March 24, 2026" },
{ title: "Eliciting Techniques for ESL Teaching", description: "Visuals, prompts, context, and question types for effective elicitation.", href: "/blog/eliciting-techniques-esl-teaching.html", category: "Classroom Language", date: "March 24, 2026" },

// Phase 13: Reading Skills (5)
{ title: "Teaching Skimming and Scanning — Reading Strategies for ESL", description: "Timed reading tasks, gist questions, and specific information hunting.", href: "/blog/teaching-skimming-scanning-esl.html", category: "Reading", date: "March 24, 2026" },
{ title: "Teaching Critical Reading Skills to ESL Students", description: "Identifying bias, evaluating sources, and analyzing argument structure.", href: "/blog/teaching-critical-reading-esl.html", category: "Reading", date: "March 24, 2026" },
{ title: "Graded Readers — A Complete Guide for ESL Teachers", description: "Publisher comparison, level selection, and reading program implementation.", href: "/blog/graded-readers-guide-esl-teachers.html", category: "Reading", date: "March 24, 2026" },
{ title: "Teaching Reading Fluency in ESL Classes", description: "Repeated reading, timed reading, and fluency assessment techniques.", href: "/blog/teaching-reading-fluency-esl.html", category: "Reading", date: "March 24, 2026" },
{ title: "Using Newspaper Articles in ESL Lessons", description: "Headline analysis, jigsaw reading, and news-based discussion activities.", href: "/blog/newspaper-articles-esl-lessons.html", category: "Reading", date: "March 24, 2026" },

// Phase 13: Online & Hybrid (5)
{ title: "Hybrid Teaching Strategies for ESL Classes", description: "Simultaneous in-person and online instruction with engagement techniques.", href: "/blog/hybrid-teaching-esl-strategies.html", category: "Online Teaching", date: "March 24, 2026" },
{ title: "Breakout Room Activities for Online ESL Classes", description: "Structured pair and group tasks for Zoom, Meet, and Teams breakout rooms.", href: "/blog/breakout-rooms-esl-activities.html", category: "Online Teaching", date: "March 24, 2026" },
{ title: "Digital Whiteboard Activities for ESL Teachers", description: "Jamboard, Miro, and Whiteboard.fi activities for interactive online lessons.", href: "/blog/digital-whiteboard-activities-esl.html", category: "Online Teaching", date: "March 24, 2026" },
{ title: "Asynchronous Learning Activities for ESL Students", description: "Self-paced tasks, video assignments, and discussion boards for ESL.", href: "/blog/asynchronous-learning-esl.html", category: "Online Teaching", date: "March 24, 2026" },
{ title: "Building Community in Online ESL Classes", description: "Ice-breakers, social activities, and fostering connection in virtual classrooms.", href: "/blog/building-community-online-esl-class.html", category: "Online Teaching", date: "March 24, 2026" },

// Phase 13: Speaking & Fluency (5)
{ title: "Fluency Activities for the ESL Classroom", description: "4/3/2 technique, speed dating, and information gap fluency drills.", href: "/blog/fluency-activities-esl-classroom.html", category: "Speaking", date: "March 24, 2026" },
{ title: "Structuring Conversation Classes for ESL Students", description: "Topic selection, scaffolding, and managing mixed-level conversation groups.", href: "/blog/conversation-classes-esl-structure.html", category: "Speaking", date: "March 24, 2026" },
{ title: "Teaching Functional Language — Requests, Complaints, Suggestions", description: "Speech act worksheets, role-plays, and appropriacy practice.", href: "/blog/teaching-functional-language-esl.html", category: "Speaking", date: "March 24, 2026" },
{ title: "The Shadowing Technique — Improving Pronunciation and Fluency", description: "Step-by-step shadowing method with audio selection and progress tracking.", href: "/blog/shadowing-technique-esl.html", category: "Speaking", date: "March 24, 2026" },
{ title: "Impromptu Speaking Activities for ESL Classes", description: "1-minute talks, opinion chains, and spontaneous speaking confidence builders.", href: "/blog/impromptu-speaking-activities-esl.html", category: "Speaking", date: "March 24, 2026" },

// Phase 13: Feedback & Correction (5)
{ title: "Giving Effective Written Feedback to ESL Students", description: "Focused vs comprehensive feedback, margin notes, and feedforward techniques.", href: "/blog/giving-written-feedback-esl.html", category: "Feedback", date: "March 24, 2026" },
{ title: "When and How to Correct Speaking Errors in ESL", description: "On-the-spot vs delayed correction, recasting, and reformulation.", href: "/blog/oral-correction-timing-techniques.html", category: "Feedback", date: "March 24, 2026" },
{ title: "Using Marking Codes for ESL Writing Correction", description: "Standard marking codes, student self-correction, and error logs.", href: "/blog/marking-codes-esl-writing.html", category: "Feedback", date: "March 24, 2026" },
{ title: "One-on-One Conferencing with ESL Students — Feedback Guide", description: "Conference structure, questioning techniques, and goal-setting dialogue.", href: "/blog/conferencing-with-esl-students.html", category: "Feedback", date: "March 24, 2026" },
{ title: "Creating a Positive Error Culture in the ESL Classroom", description: "Normalizing mistakes, growth language, and error-as-learning activities.", href: "/blog/positive-error-culture-esl.html", category: "Feedback", date: "March 24, 2026" },
```

### sitemap.xml — +30 entries (216 → 246)

30 nowych `<url>` z `lastmod=2026-03-24`, priority 0.7.

### llms.txt — +6 sekcji

```markdown
## Standardized Tests (Blog)
- [TOEFL Preparation](https://edooqoo.com/blog/toefl-preparation-strategies-teachers.html)
- [TOEIC Preparation](https://edooqoo.com/blog/toeic-preparation-worksheets-guide.html)
- [Duolingo English Test](https://edooqoo.com/blog/duolingo-english-test-preparation.html)
- [Test-Taking Strategies](https://edooqoo.com/blog/teaching-test-taking-strategies-esl.html)
- [Test Comparison Guide](https://edooqoo.com/blog/standardized-test-comparison-esl.html)

## Classroom Language (Blog)
- [Classroom Language](https://edooqoo.com/blog/classroom-language-esl-teachers.html)
- [Giving Instructions](https://edooqoo.com/blog/giving-instructions-esl-classroom.html)
- [CCQs](https://edooqoo.com/blog/concept-checking-questions-esl.html)
- [Reducing TTT](https://edooqoo.com/blog/teacher-talking-time-reducing.html)
- [Eliciting Techniques](https://edooqoo.com/blog/eliciting-techniques-esl-teaching.html)

## Reading Skills (Blog)
- [Skimming and Scanning](https://edooqoo.com/blog/teaching-skimming-scanning-esl.html)
- [Critical Reading](https://edooqoo.com/blog/teaching-critical-reading-esl.html)
- [Graded Readers Guide](https://edooqoo.com/blog/graded-readers-guide-esl-teachers.html)
- [Reading Fluency](https://edooqoo.com/blog/teaching-reading-fluency-esl.html)
- [Newspaper Articles ESL](https://edooqoo.com/blog/newspaper-articles-esl-lessons.html)

## Online & Hybrid Teaching (Blog)
- [Hybrid Teaching ESL](https://edooqoo.com/blog/hybrid-teaching-esl-strategies.html)
- [Breakout Room Activities](https://edooqoo.com/blog/breakout-rooms-esl-activities.html)
- [Digital Whiteboard](https://edooqoo.com/blog/digital-whiteboard-activities-esl.html)
- [Asynchronous Learning](https://edooqoo.com/blog/asynchronous-learning-esl.html)
- [Online Community](https://edooqoo.com/blog/building-community-online-esl-class.html)

## Speaking & Fluency (Blog)
- [Fluency Activities](https://edooqoo.com/blog/fluency-activities-esl-classroom.html)
- [Conversation Classes](https://edooqoo.com/blog/conversation-classes-esl-structure.html)
- [Functional Language](https://edooqoo.com/blog/teaching-functional-language-esl.html)
- [Shadowing Technique](https://edooqoo.com/blog/shadowing-technique-esl.html)
- [Impromptu Speaking](https://edooqoo.com/blog/impromptu-speaking-activities-esl.html)

## Feedback & Correction (Blog)
- [Written Feedback ESL](https://edooqoo.com/blog/giving-written-feedback-esl.html)
- [Oral Correction Timing](https://edooqoo.com/blog/oral-correction-timing-techniques.html)
- [Marking Codes](https://edooqoo.com/blog/marking-codes-esl-writing.html)
- [Student Conferencing](https://edooqoo.com/blog/conferencing-with-esl-students.html)
- [Positive Error Culture](https://edooqoo.com/blog/positive-error-culture-esl.html)
```

### openapi.yaml — +30 paths

30 nowych paths w identycznym formacie jak Phase 11.

### blog.html — +30 JSON-LD + 6 sekcji z kartami

6 nowych sekcji (Standardized Tests, Classroom Language, Reading Skills, Online & Hybrid, Speaking & Fluency, Feedback & Correction) z po 5 kartami.

### resources.html — +30 cross-linków z badge'ami

---

## Podsumowanie zmian

| Plik | Akcja |
|------|-------|
| `supabase/functions/generateWorksheet/index.ts` | FIX — +share_token w streaming path |
| `src/components/ShareWorksheetModal.tsx` | FIX — usunięcie `as any`, lepsze logowanie |
| 30 plików `public/blog/*.html` | NOWE |
| `src/pages/Blog.tsx` | EDYCJA — +30 wpisów (117→147) |
| `public/sitemap.xml` | EDYCJA — +30 entries (216→246) |
| `public/llms.txt` | EDYCJA — +6 sekcji |
| `public/openapi.yaml` | EDYCJA — +30 paths |
| `public/blog.html` | EDYCJA — +30 JSON-LD + 6 sekcji |
| `public/resources.html` | EDYCJA — +30 linków |

**Łącznie: 39 plików** (30 nowych + 9 edytowanych)

| Element | Przed | Po |
|---------|-------|----|
| Blog articles | 117 | 147 |
| Sitemap entries | 216 | 246 |
| Blog categories | 23 | 29 |
| Share worksheet bug | Broken (streaming) | Fixed |

**Ryzyko:** MINIMALNE — fix share_token to dodanie 3 linii do istniejącej ścieżki (pattern skopiowany z non-streaming path). Reszta to statyczne pliki HTML + meta.

