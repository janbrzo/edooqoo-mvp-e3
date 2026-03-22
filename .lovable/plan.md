

# Plan: Phase 11 Infrastructure Sync — Dokończenie synchronizacji

## Co zostało do zrobienia

Po Phase 11 mamy 117 artykułów blogowych jako pliki HTML. Trzy pliki infrastrukturalne **nie zostały jeszcze zaktualizowane** o 30 artykułów Phase 11 (Pronunciation, Homework, Motivation, Advanced Grammar, Listening, Communication):

| Plik | Stan | Brakuje |
|------|------|---------|
| `public/openapi.yaml` | Pokrywa Phase 1-10 (87 art.) | +30 paths Phase 11 |
| `public/blog.html` | Pokrywa Phase 1-10 (87 art.) | +30 JSON-LD wpisów + 6 sekcji z kartami |
| `public/resources.html` | Pokrywa Phase 1-10 (87 art.) | +30 linków z badge'ami |

Pliki już zsynchronizowane (nie wymagają zmian): `Blog.tsx` (117), `sitemap.xml` (216), `llms.txt` (33 sekcje).

---

## Plan wdrożenia (1 krok, 3 pliki)

### A. openapi.yaml — +30 paths (po linii 1169)

```yaml
  /blog/teaching-minimal-pairs-esl.html:
    get:
      operationId: getBlogMinimalPairs
      summary: Teaching Minimal Pairs — Pronunciation Activities for ESL
      description: Minimal pair drills, card games, and listening discrimination exercises.
      responses:
        '200':
          description: Blog article HTML
  /blog/teaching-english-intonation-stress.html:
    get:
      operationId: getBlogIntonationStress
      summary: Teaching English Intonation and Stress Patterns
      description: Sentence stress, word stress, rising/falling intonation with practice activities.
      responses:
        '200':
          description: Blog article HTML
  /blog/connected-speech-teaching-activities.html:
    get:
      operationId: getBlogConnectedSpeech
      summary: Teaching Connected Speech — Activities and Exercises
      description: Linking, elision, assimilation, and weak forms with listening tasks.
      responses:
        '200':
          description: Blog article HTML
  /blog/ipa-phonetic-alphabet-esl-teaching.html:
    get:
      operationId: getBlogIPA
      summary: Using the IPA Phonetic Alphabet in ESL Teaching
      description: When and how to introduce IPA symbols with practical classroom activities.
      responses:
        '200':
          description: Blog article HTML
  /blog/accent-reduction-activities-esl.html:
    get:
      operationId: getBlogAccentReduction
      summary: Accent Reduction Activities for ESL Students
      description: Intelligibility vs nativeness, diagnostic tools, and targeted practice.
      responses:
        '200':
          description: Blog article HTML
  /blog/effective-esl-homework-strategies.html:
    get:
      operationId: getBlogHomeworkStrategies
      summary: Effective ESL Homework Strategies
      description: Meaningful homework design, accountability systems, and feedback loops.
      responses:
        '200':
          description: Blog article HTML
  /blog/teaching-study-skills-english-learners.html:
    get:
      operationId: getBlogStudySkills
      summary: Teaching Study Skills to English Learners
      description: Note-taking, time management, vocabulary notebooks, and revision techniques.
      responses:
        '200':
          description: Blog article HTML
  /blog/self-directed-learning-esl.html:
    get:
      operationId: getBlogSelfDirected
      summary: Encouraging Self-Directed Learning in ESL
      description: Learner training, goal setting, and autonomy-building strategies.
      responses:
        '200':
          description: Blog article HTML
  /blog/flipped-homework-esl-classroom.html:
    get:
      operationId: getBlogFlippedHomework
      summary: Flipped Homework — Reversing In-Class and At-Home Tasks
      description: Video-based pre-learning, in-class practice, and blended learning models.
      responses:
        '200':
          description: Blog article HTML
  /blog/digital-homework-tools-esl-teachers.html:
    get:
      operationId: getBlogDigitalHomework
      summary: Best Digital Homework Tools for ESL Teachers
      description: Platform comparison for assigning, tracking, and grading ESL homework online.
      responses:
        '200':
          description: Blog article HTML
  /blog/motivating-reluctant-esl-learners.html:
    get:
      operationId: getBlogMotivatingReluctant
      summary: Motivating Reluctant ESL Learners
      description: Identifying barriers, building rapport, and creating meaningful learning experiences.
      responses:
        '200':
          description: Blog article HTML
  /blog/intrinsic-motivation-language-learning.html:
    get:
      operationId: getBlogIntrinsicMotivation
      summary: Building Intrinsic Motivation in Language Learning
      description: Self-determination theory, autonomy, competence, and relatedness in ESL.
      responses:
        '200':
          description: Blog article HTML
  /blog/student-autonomy-esl-classroom.html:
    get:
      operationId: getBlogStudentAutonomy
      summary: Fostering Student Autonomy in the ESL Classroom
      description: Choice boards, learning contracts, and self-directed projects.
      responses:
        '200':
          description: Blog article HTML
  /blog/using-rewards-esl-classroom.html:
    get:
      operationId: getBlogRewards
      summary: Using Rewards in the ESL Classroom
      description: Token economies, praise strategies, and avoiding reward dependency.
      responses:
        '200':
          description: Blog article HTML
  /blog/growth-mindset-language-learning.html:
    get:
      operationId: getBlogGrowthMindset
      summary: Growth Mindset in Language Learning
      description: Fixed vs growth mindset, error positivity, and effort-based feedback.
      responses:
        '200':
          description: Blog article HTML
  /blog/teaching-subjunctive-english.html:
    get:
      operationId: getBlogSubjunctive
      summary: Teaching the Subjunctive in English
      description: Mandative subjunctive, were-subjunctive, and practice contexts.
      responses:
        '200':
          description: Blog article HTML
  /blog/teaching-inversion-english.html:
    get:
      operationId: getBlogInversion
      summary: Teaching Inversion in English
      description: Negative adverbials, conditional inversion, and formal register practice.
      responses:
        '200':
          description: Blog article HTML
  /blog/teaching-cleft-sentences-english.html:
    get:
      operationId: getBlogCleftSentences
      summary: Teaching Cleft Sentences
      description: Focus and emphasis structures with transformation and production activities.
      responses:
        '200':
          description: Blog article HTML
  /blog/teaching-ellipsis-substitution-english.html:
    get:
      operationId: getBlogEllipsis
      summary: Teaching Ellipsis and Substitution in English
      description: Textual cohesion, so/do substitution, and discourse-level grammar.
      responses:
        '200':
          description: Blog article HTML
  /blog/teaching-mixed-conditionals-esl.html:
    get:
      operationId: getBlogMixedConditionals
      summary: Teaching Mixed Conditionals
      description: Past-present and present-past conditionals with contextualized practice.
      responses:
        '200':
          description: Blog article HTML
  /blog/teaching-listening-strategies-esl.html:
    get:
      operationId: getBlogListeningStrategies
      summary: Teaching Listening Strategies to ESL Students
      description: Top-down, bottom-up, and metacognitive strategies for listening comprehension.
      responses:
        '200':
          description: Blog article HTML
  /blog/dictation-activities-esl-classroom.html:
    get:
      operationId: getBlogDictation
      summary: Dictation Activities for the ESL Classroom
      description: Running dictation, dictogloss, partial dictation, and communicative dictation.
      responses:
        '200':
          description: Blog article HTML
  /blog/using-podcasts-esl-teaching.html:
    get:
      operationId: getBlogPodcasts
      summary: Using Podcasts in ESL Teaching
      description: Podcast selection, pre-listening tasks, and follow-up activities by level.
      responses:
        '200':
          description: Blog article HTML
  /blog/teaching-note-taking-skills-english.html:
    get:
      operationId: getBlogNoteTaking
      summary: Teaching Note-Taking Skills in English Classes
      description: Cornell method, mind maps, abbreviations, and academic listening practice.
      responses:
        '200':
          description: Blog article HTML
  /blog/authentic-listening-materials-esl.html:
    get:
      operationId: getBlogAuthenticListening
      summary: Using Authentic Listening Materials in ESL
      description: TED Talks, news broadcasts, interviews, and grading authentic input.
      responses:
        '200':
          description: Blog article HTML
  /blog/communicating-with-esl-parents.html:
    get:
      operationId: getBlogCommunicatingParents
      summary: Communicating with ESL Parents
      description: Multilingual communication, progress updates, and building home-school partnerships.
      responses:
        '200':
          description: Blog article HTML
  /blog/writing-student-progress-reports-esl.html:
    get:
      operationId: getBlogProgressReports
      summary: Writing Student Progress Reports for ESL Classes
      description: CEFR-aligned descriptors, strengths/areas format, and report templates.
      responses:
        '200':
          description: Blog article HTML
  /blog/parent-teacher-conferences-esl.html:
    get:
      operationId: getBlogParentConferences
      summary: Parent-Teacher Conferences for ESL
      description: Conference structure, visual aids, and navigating language barriers.
      responses:
        '200':
          description: Blog article HTML
  /blog/advocating-for-ell-students.html:
    get:
      operationId: getBlogAdvocating
      summary: Advocating for ELL Students in Your School
      description: Policy awareness, accommodation requests, and data-driven advocacy.
      responses:
        '200':
          description: Blog article HTML
  /blog/collaborating-with-mainstream-teachers-esl.html:
    get:
      operationId: getBlogCollaborating
      summary: Collaborating with Mainstream Teachers as ESL Specialist
      description: Co-teaching models, content-language integration, and shared planning.
      responses:
        '200':
          description: Blog article HTML
```

### B. blog.html — +30 JSON-LD wpisów + 6 sekcji z kartami

**JSON-LD** — dodanie 30 wpisów do tablicy `blogPost` (przed `]}` w linii 99):
```json
    {"@type":"BlogPosting","headline":"Teaching Minimal Pairs — Pronunciation Activities for ESL","url":"https://edooqoo.com/blog/teaching-minimal-pairs-esl.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Teaching English Intonation and Stress Patterns","url":"https://edooqoo.com/blog/teaching-english-intonation-stress.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Teaching Connected Speech — Activities and Exercises","url":"https://edooqoo.com/blog/connected-speech-teaching-activities.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Using the IPA Phonetic Alphabet in ESL Teaching","url":"https://edooqoo.com/blog/ipa-phonetic-alphabet-esl-teaching.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Accent Reduction Activities for ESL Students","url":"https://edooqoo.com/blog/accent-reduction-activities-esl.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Effective ESL Homework Strategies","url":"https://edooqoo.com/blog/effective-esl-homework-strategies.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Teaching Study Skills to English Learners","url":"https://edooqoo.com/blog/teaching-study-skills-english-learners.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Encouraging Self-Directed Learning in ESL","url":"https://edooqoo.com/blog/self-directed-learning-esl.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Flipped Homework — Reversing In-Class and At-Home Tasks","url":"https://edooqoo.com/blog/flipped-homework-esl-classroom.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Best Digital Homework Tools for ESL Teachers","url":"https://edooqoo.com/blog/digital-homework-tools-esl-teachers.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Motivating Reluctant ESL Learners","url":"https://edooqoo.com/blog/motivating-reluctant-esl-learners.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Building Intrinsic Motivation in Language Learning","url":"https://edooqoo.com/blog/intrinsic-motivation-language-learning.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Fostering Student Autonomy in the ESL Classroom","url":"https://edooqoo.com/blog/student-autonomy-esl-classroom.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Using Rewards in the ESL Classroom","url":"https://edooqoo.com/blog/using-rewards-esl-classroom.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Growth Mindset in Language Learning","url":"https://edooqoo.com/blog/growth-mindset-language-learning.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Teaching the Subjunctive in English","url":"https://edooqoo.com/blog/teaching-subjunctive-english.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Teaching Inversion in English","url":"https://edooqoo.com/blog/teaching-inversion-english.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Teaching Cleft Sentences","url":"https://edooqoo.com/blog/teaching-cleft-sentences-english.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Teaching Ellipsis and Substitution in English","url":"https://edooqoo.com/blog/teaching-ellipsis-substitution-english.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Teaching Mixed Conditionals","url":"https://edooqoo.com/blog/teaching-mixed-conditionals-esl.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Teaching Listening Strategies to ESL Students","url":"https://edooqoo.com/blog/teaching-listening-strategies-esl.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Dictation Activities for the ESL Classroom","url":"https://edooqoo.com/blog/dictation-activities-esl-classroom.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Using Podcasts in ESL Teaching","url":"https://edooqoo.com/blog/using-podcasts-esl-teaching.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Teaching Note-Taking Skills in English","url":"https://edooqoo.com/blog/teaching-note-taking-skills-english.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Using Authentic Listening Materials in ESL","url":"https://edooqoo.com/blog/authentic-listening-materials-esl.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Communicating with ESL Parents","url":"https://edooqoo.com/blog/communicating-with-esl-parents.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Writing Student Progress Reports for ESL","url":"https://edooqoo.com/blog/writing-student-progress-reports-esl.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Parent-Teacher Conferences for ESL","url":"https://edooqoo.com/blog/parent-teacher-conferences-esl.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Advocating for ELL Students","url":"https://edooqoo.com/blog/advocating-for-ell-students.html","datePublished":"2026-03-21"},
    {"@type":"BlogPosting","headline":"Collaborating with Mainstream Teachers","url":"https://edooqoo.com/blog/collaborating-with-mainstream-teachers-esl.html","datePublished":"2026-03-21"}
```

**6 nowych sekcji z kartami** — dodanie po ostatniej sekcji (Language Systems, ~linia 233), przed CTA:

- **Pronunciation & Phonology** (5 kart: Minimal Pairs, Intonation & Stress, Connected Speech, IPA Phonetic Alphabet, Accent Reduction)
- **Homework & Independent Learning** (5 kart: Homework Strategies, Study Skills, Self-Directed Learning, Flipped Homework, Digital Tools)
- **Motivation & Engagement** (5 kart: Motivating Reluctant Learners, Intrinsic Motivation, Student Autonomy, Using Rewards, Growth Mindset)
- **Advanced Grammar** (5 kart: Subjunctive, Inversion, Cleft Sentences, Ellipsis & Substitution, Mixed Conditionals)
- **Listening Skills** (5 kart: Listening Strategies, Dictation Activities, Using Podcasts, Note-Taking, Authentic Materials)
- **Parent & Stakeholder Communication** (5 kart: Communicating with Parents, Progress Reports, Conferences, Advocating for ELL, Collaborating with Teachers)

### C. resources.html — +30 linków z badge'ami

Dodanie po linii 190 (po Extensive Reading / Language Systems), przed sekcją "Grammar Worksheets":

```html
    <li><a href="https://edooqoo.com/blog/teaching-minimal-pairs-esl.html">Teaching Minimal Pairs</a> <span class="badge">Pronunciation</span></li>
    <li><a href="https://edooqoo.com/blog/teaching-english-intonation-stress.html">Intonation and Stress Patterns</a> <span class="badge">Pronunciation</span></li>
    <li><a href="https://edooqoo.com/blog/connected-speech-teaching-activities.html">Connected Speech Activities</a> <span class="badge">Pronunciation</span></li>
    <li><a href="https://edooqoo.com/blog/ipa-phonetic-alphabet-esl-teaching.html">IPA Phonetic Alphabet ESL</a> <span class="badge">Pronunciation</span></li>
    <li><a href="https://edooqoo.com/blog/accent-reduction-activities-esl.html">Accent Reduction Activities</a> <span class="badge">Pronunciation</span></li>
    <li><a href="https://edooqoo.com/blog/effective-esl-homework-strategies.html">ESL Homework Strategies</a> <span class="badge">Homework</span></li>
    <li><a href="https://edooqoo.com/blog/teaching-study-skills-english-learners.html">Teaching Study Skills</a> <span class="badge">Homework</span></li>
    <li><a href="https://edooqoo.com/blog/self-directed-learning-esl.html">Self-Directed Learning</a> <span class="badge">Homework</span></li>
    <li><a href="https://edooqoo.com/blog/flipped-homework-esl-classroom.html">Flipped Homework ESL</a> <span class="badge">Homework</span></li>
    <li><a href="https://edooqoo.com/blog/digital-homework-tools-esl-teachers.html">Digital Homework Tools</a> <span class="badge">Homework</span></li>
    <li><a href="https://edooqoo.com/blog/motivating-reluctant-esl-learners.html">Motivating Reluctant Learners</a> <span class="badge">Motivation</span></li>
    <li><a href="https://edooqoo.com/blog/intrinsic-motivation-language-learning.html">Intrinsic Motivation</a> <span class="badge">Motivation</span></li>
    <li><a href="https://edooqoo.com/blog/student-autonomy-esl-classroom.html">Student Autonomy ESL</a> <span class="badge">Motivation</span></li>
    <li><a href="https://edooqoo.com/blog/using-rewards-esl-classroom.html">Using Rewards in ESL</a> <span class="badge">Motivation</span></li>
    <li><a href="https://edooqoo.com/blog/growth-mindset-language-learning.html">Growth Mindset</a> <span class="badge">Motivation</span></li>
    <li><a href="https://edooqoo.com/blog/teaching-subjunctive-english.html">Teaching Subjunctive</a> <span class="badge">Advanced Grammar</span></li>
    <li><a href="https://edooqoo.com/blog/teaching-inversion-english.html">Teaching Inversion</a> <span class="badge">Advanced Grammar</span></li>
    <li><a href="https://edooqoo.com/blog/teaching-cleft-sentences-english.html">Teaching Cleft Sentences</a> <span class="badge">Advanced Grammar</span></li>
    <li><a href="https://edooqoo.com/blog/teaching-ellipsis-substitution-english.html">Ellipsis and Substitution</a> <span class="badge">Advanced Grammar</span></li>
    <li><a href="https://edooqoo.com/blog/teaching-mixed-conditionals-esl.html">Mixed Conditionals</a> <span class="badge">Advanced Grammar</span></li>
    <li><a href="https://edooqoo.com/blog/teaching-listening-strategies-esl.html">Listening Strategies</a> <span class="badge">Listening</span></li>
    <li><a href="https://edooqoo.com/blog/dictation-activities-esl-classroom.html">Dictation Activities</a> <span class="badge">Listening</span></li>
    <li><a href="https://edooqoo.com/blog/using-podcasts-esl-teaching.html">Using Podcasts ESL</a> <span class="badge">Listening</span></li>
    <li><a href="https://edooqoo.com/blog/teaching-note-taking-skills-english.html">Note-Taking Skills</a> <span class="badge">Listening</span></li>
    <li><a href="https://edooqoo.com/blog/authentic-listening-materials-esl.html">Authentic Listening Materials</a> <span class="badge">Listening</span></li>
    <li><a href="https://edooqoo.com/blog/communicating-with-esl-parents.html">Communicating with ESL Parents</a> <span class="badge">Communication</span></li>
    <li><a href="https://edooqoo.com/blog/writing-student-progress-reports-esl.html">Student Progress Reports</a> <span class="badge">Communication</span></li>
    <li><a href="https://edooqoo.com/blog/parent-teacher-conferences-esl.html">Parent-Teacher Conferences</a> <span class="badge">Communication</span></li>
    <li><a href="https://edooqoo.com/blog/advocating-for-ell-students.html">Advocating for ELL Students</a> <span class="badge">Communication</span></li>
    <li><a href="https://edooqoo.com/blog/collaborating-with-mainstream-teachers-esl.html">Collaborating with Teachers</a> <span class="badge">Communication</span></li>
```

---

## Podsumowanie

| Plik | Akcja |
|------|-------|
| `public/openapi.yaml` | EDYCJA — +30 paths |
| `public/blog.html` | EDYCJA — +30 JSON-LD + 6 sekcji kart |
| `public/resources.html` | EDYCJA — +30 linków |

Po tym kroku **cała infrastruktura SEO będzie w 100% zsynchronizowana** z wszystkimi 117 artykułami (Phase 1-11). Ryzyko: ZEROWE.

