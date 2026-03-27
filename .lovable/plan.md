

# Plan: Phase 16 — Fix Homework Email + Infrastructure Sync + Blog Expansion (207→237)

---

## PROBLEM 1: Homework email verification — "not associated"

### Diagnoza

Znalazłem przyczynę. W `src/hooks/useInteractiveHomework.tsx` linia 53-71, `verifyStudentEmail` wykonuje **bezpośredni query na tabelę `homework_assignments`**:

```typescript
const { data: homework, error } = await supabase
  .from('homework_assignments')
  .select('student_id, students(student_email)')
  .eq('id', homeworkId)
  .single();
```

**Problem:** Student nie jest zalogowany (odwiedza link `/homework/:token`). RLS na tabeli `homework_assignments` wymaga `auth.uid() = teacher_id`. Unauthenticated user **nie ma uprawnień SELECT** na tej tabeli, więc query zwraca `null` → `registeredEmail === email` → `null === "j4n.brz0+12@gmail.com"` → `false` → "not associated".

**Dowód:** Dla worksheetów istnieje dedykowany RPC `verify_worksheet_student_email` (SECURITY DEFINER), ale dla homework **nie ma odpowiednika**.

### Naprawa

**Plik 1: Nowa migracja SQL** — `verify_homework_student_email` RPC

```sql
CREATE OR REPLACE FUNCTION public.verify_homework_student_email(
    p_homework_id UUID,
    p_email TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_student_email TEXT;
    v_student_id UUID;
BEGIN
    -- Get homework's student info
    SELECT 
        ha.student_id,
        s.student_email
    INTO v_student_id, v_student_email
    FROM public.homework_assignments ha
    LEFT JOIN public.students s ON ha.student_id = s.id
    WHERE ha.id = p_homework_id;
    
    -- Homework must have assigned student
    IF v_student_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Case-insensitive comparison
    RETURN (v_student_email IS NOT NULL AND lower(v_student_email) = lower(p_email));
END;
$$;
```

**Plik 2: `src/hooks/useInteractiveHomework.tsx`** — zmiana `verifyStudentEmail`

```typescript
const verifyStudentEmail = useCallback(async (homeworkId: string, email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('verify_homework_student_email', {
      p_homework_id: homeworkId,
      p_email: email
    });

    if (error) {
      console.error('Error verifying student email:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error verifying student email:', error);
    return false;
  }
}, []);
```

---

## ZADANIE 2: Dokończenie infrastruktury (openapi.yaml, blog.html, resources.html)

### openapi.yaml — +60 paths

60 nowych paths (30 Phase 14 + 30 Phase 15) — dokładna treść podana w zatwierdzonym planie Phase 15. Dodać po ostatnim istniejącym path.

### blog.html — +60 JSON-LD + 12 sekcji kart

- 60 nowych wpisów `BlogPosting` w tablicy JSON-LD (z zaktualizowanymi datami 1/dzień)
- 12 nowych sekcji kart (6 z Phase 14 + 6 z Phase 15): Classroom Management, Writing Skills, ESP by Industry, CLIL & Bilingual, Assessment Design, Inclusive Teaching, Curriculum Design, Drama & Arts, Cooperative Learning, SLA Theory, Professional Dev, Materials Dev
- Zaktualizować daty we wszystkich istniejących JSON-LD wpisach

### resources.html — +60 linków z badge'ami

60 nowych linków z badge'ami kategorii, format identyczny jak istniejące.

---

## ZADANIE 3: Phase 16 — 30 nowych artykułów (207→237)

### Analiza luk

Po 207 artykułach w 41 kategoriach, zidentyfikowałem **6 nowych klastrów**:

### Klaster AK: "Pronunciation & Phonology Advanced" (5)

| # | Plik | H1 |
|---|------|----|
| 1 | `teaching-word-stress-patterns-esl.html` | Teaching Word Stress Patterns to ESL Students |
| 2 | `teaching-rhythm-english-speech.html` | Teaching Rhythm in English Speech — Stress-Timed Language |
| 3 | `teaching-weak-forms-english.html` | Teaching Weak Forms in English — Schwa and Reduced Vowels |
| 4 | `phonemic-awareness-activities-esl.html` | Phonemic Awareness Activities for ESL Learners |
| 5 | `accent-coaching-techniques-esl.html` | Accent Coaching Techniques for ESL Teachers |

### Klaster AL: "Vocabulary Acquisition Advanced" (5)

| # | Plik | H1 |
|---|------|----|
| 6 | `teaching-word-families-morphology-esl.html` | Teaching Word Families and Morphology in ESL |
| 7 | `phrasal-verbs-teaching-strategies.html` | Phrasal Verbs Teaching Strategies — From Avoidance to Mastery |
| 8 | `lexical-approach-language-teaching.html` | The Lexical Approach in Language Teaching — Chunks and Collocations |
| 9 | `vocabulary-notebook-strategies-esl.html` | Vocabulary Notebook Strategies for ESL Students |
| 10 | `teaching-abstract-vocabulary-esl.html` | Teaching Abstract Vocabulary to ESL Students |

### Klaster AM: "Grammar Teaching Advanced" (5)

| # | Plik | H1 |
|---|------|----|
| 11 | `teaching-aspect-english-grammar.html` | Teaching Aspect in English Grammar — Perfect and Progressive |
| 12 | `teaching-modality-english-esl.html` | Teaching Modality in English — Must, Might, Could, Should |
| 13 | `teaching-relative-clauses-esl.html` | Teaching Relative Clauses to ESL Students |
| 14 | `consciousness-raising-grammar-tasks.html` | Consciousness-Raising Grammar Tasks for ESL |
| 15 | `teaching-determiners-quantifiers-esl.html` | Teaching Determiners and Quantifiers in ESL |

### Klaster AN: "Listening Skills Advanced" (5)

| # | Plik | H1 |
|---|------|----|
| 16 | `bottom-up-top-down-listening-esl.html` | Bottom-Up vs Top-Down Listening Strategies in ESL |
| 17 | `teaching-note-taking-from-lectures.html` | Teaching Note-Taking from Lectures — ESL Academic Skills |
| 18 | `podcast-based-listening-lessons-esl.html` | Podcast-Based Listening Lessons for ESL Classes |
| 19 | `dictogloss-technique-esl-teaching.html` | The Dictogloss Technique in ESL Teaching |
| 20 | `teaching-listening-for-gist-detail.html` | Teaching Listening for Gist and Detail — Practical Activities |

### Klaster AO: "Young Learners & Teens Advanced" (5)

| # | Plik | H1 |
|---|------|----|
| 21 | `teaching-english-preschoolers-guide.html` | Teaching English to Preschoolers — Complete Guide |
| 22 | `tpr-total-physical-response-activities.html` | Total Physical Response (TPR) Activities for Young Learners |
| 23 | `teen-engagement-strategies-esl.html` | Teen Engagement Strategies for ESL Classes |
| 24 | `content-based-instruction-young-learners.html` | Content-Based Instruction for Young ESL Learners |
| 25 | `teaching-literacy-young-esl-learners.html` | Teaching Literacy to Young ESL Learners — Phonics and Beyond |

### Klaster AP: "Technology Integration Advanced" (5)

| # | Plik | H1 |
|---|------|----|
| 26 | `ai-powered-differentiation-esl.html` | AI-Powered Differentiation in the ESL Classroom |
| 27 | `using-chatbots-language-practice.html` | Using Chatbots for Language Practice — Teacher's Guide |
| 28 | `screen-free-tech-activities-esl.html` | Screen-Free Technology Activities for ESL Classes |
| 29 | `data-driven-learning-esl-corpora.html` | Data-Driven Learning with Corpora in ESL Teaching |
| 30 | `learning-management-systems-esl.html` | Choosing a Learning Management System for ESL Teaching |

### Daty publikacji

Kontynuacja 1/dzień: artykuł #208 = `November 25, 2025`, ..., #237 = `December 24, 2025`.

### Wpisy Blog.tsx

```typescript
// Phase 16: Pronunciation & Phonology Advanced (5)
{ title: "Teaching Word Stress Patterns to ESL Students", description: "Primary/secondary stress, compound nouns, stress shift rules, and drilling activities.", href: "/blog/teaching-word-stress-patterns-esl.html", category: "Pronunciation", date: "November 25, 2025" },
{ title: "Teaching Rhythm in English Speech — Stress-Timed Language", description: "Stress timing, content vs function words, and rhythm-based practice activities.", href: "/blog/teaching-rhythm-english-speech.html", category: "Pronunciation", date: "November 26, 2025" },
{ title: "Teaching Weak Forms in English — Schwa and Reduced Vowels", description: "Common weak forms, schwa identification, and natural speech listening practice.", href: "/blog/teaching-weak-forms-english.html", category: "Pronunciation", date: "November 27, 2025" },
{ title: "Phonemic Awareness Activities for ESL Learners", description: "Sound discrimination, phoneme segmentation, and minimal pair activities.", href: "/blog/phonemic-awareness-activities-esl.html", category: "Pronunciation", date: "November 28, 2025" },
{ title: "Accent Coaching Techniques for ESL Teachers", description: "Individual coaching, accent modification goals, and intelligibility focus.", href: "/blog/accent-coaching-techniques-esl.html", category: "Pronunciation", date: "November 29, 2025" },

// Phase 16: Vocabulary Acquisition Advanced (5)
{ title: "Teaching Word Families and Morphology in ESL", description: "Prefixes, suffixes, roots, and productive word-building strategies.", href: "/blog/teaching-word-families-morphology-esl.html", category: "Vocabulary", date: "November 30, 2025" },
{ title: "Phrasal Verbs Teaching Strategies — From Avoidance to Mastery", description: "Particle meaning, context-based teaching, and systematic phrasal verb coverage.", href: "/blog/phrasal-verbs-teaching-strategies.html", category: "Vocabulary", date: "December 1, 2025" },
{ title: "The Lexical Approach in Language Teaching", description: "Chunks, collocations, Lewis's framework, and classroom implementation.", href: "/blog/lexical-approach-language-teaching.html", category: "Vocabulary", date: "December 2, 2025" },
{ title: "Vocabulary Notebook Strategies for ESL Students", description: "Organization systems, example sentences, visual associations, and review cycles.", href: "/blog/vocabulary-notebook-strategies-esl.html", category: "Vocabulary", date: "December 3, 2025" },
{ title: "Teaching Abstract Vocabulary to ESL Students", description: "Concept mapping, context clues, metaphor, and graded definition techniques.", href: "/blog/teaching-abstract-vocabulary-esl.html", category: "Vocabulary", date: "December 4, 2025" },

// Phase 16: Grammar Teaching Advanced (5)
{ title: "Teaching Aspect in English Grammar — Perfect and Progressive", description: "Aspect vs tense, timeline visuals, and common L1 interference patterns.", href: "/blog/teaching-aspect-english-grammar.html", category: "Grammar", date: "December 5, 2025" },
{ title: "Teaching Modality in English — Must, Might, Could, Should", description: "Epistemic vs deontic modality, probability scale, and modal verb activities.", href: "/blog/teaching-modality-english-esl.html", category: "Grammar", date: "December 6, 2025" },
{ title: "Teaching Relative Clauses to ESL Students", description: "Defining vs non-defining, reduced relatives, and common errors by L1.", href: "/blog/teaching-relative-clauses-esl.html", category: "Grammar", date: "December 7, 2025" },
{ title: "Consciousness-Raising Grammar Tasks for ESL", description: "Discovery-based grammar, noticing activities, and guided induction.", href: "/blog/consciousness-raising-grammar-tasks.html", category: "Grammar", date: "December 8, 2025" },
{ title: "Teaching Determiners and Quantifiers in ESL", description: "Articles, demonstratives, quantifiers — common errors and practice activities.", href: "/blog/teaching-determiners-quantifiers-esl.html", category: "Grammar", date: "December 9, 2025" },

// Phase 16: Listening Skills Advanced (5)
{ title: "Bottom-Up vs Top-Down Listening Strategies in ESL", description: "Decoding skills, schema activation, and integrated listening lesson design.", href: "/blog/bottom-up-top-down-listening-esl.html", category: "Listening", date: "December 10, 2025" },
{ title: "Teaching Note-Taking from Lectures — ESL Academic Skills", description: "Cornell method, abbreviation systems, and lecture comprehension scaffolding.", href: "/blog/teaching-note-taking-from-lectures.html", category: "Listening", date: "December 11, 2025" },
{ title: "Podcast-Based Listening Lessons for ESL Classes", description: "Podcast selection criteria, pre/while/post activities, and graded tasks.", href: "/blog/podcast-based-listening-lessons-esl.html", category: "Listening", date: "December 12, 2025" },
{ title: "The Dictogloss Technique in ESL Teaching", description: "Procedure, variations, grammar focus, and collaborative reconstruction.", href: "/blog/dictogloss-technique-esl-teaching.html", category: "Listening", date: "December 13, 2025" },
{ title: "Teaching Listening for Gist and Detail — Practical Activities", description: "Gist questions, detail scanning, and graded listening task sequences.", href: "/blog/teaching-listening-for-gist-detail.html", category: "Listening", date: "December 14, 2025" },

// Phase 16: Young Learners & Teens Advanced (5)
{ title: "Teaching English to Preschoolers — Complete Guide", description: "Routine-based learning, songs, stories, and play-based language exposure.", href: "/blog/teaching-english-preschoolers-guide.html", category: "Young Learners", date: "December 15, 2025" },
{ title: "Total Physical Response (TPR) Activities for Young Learners", description: "Action commands, TPR storytelling, and extended TPR for vocabulary building.", href: "/blog/tpr-total-physical-response-activities.html", category: "Young Learners", date: "December 16, 2025" },
{ title: "Teen Engagement Strategies for ESL Classes", description: "Relevance, autonomy, social media integration, and project-based learning for teens.", href: "/blog/teen-engagement-strategies-esl.html", category: "Young Learners", date: "December 17, 2025" },
{ title: "Content-Based Instruction for Young ESL Learners", description: "Theme-based units, language through content, and cross-curricular planning.", href: "/blog/content-based-instruction-young-learners.html", category: "Young Learners", date: "December 18, 2025" },
{ title: "Teaching Literacy to Young ESL Learners — Phonics and Beyond", description: "Synthetic phonics, sight words, guided reading, and emergent literacy stages.", href: "/blog/teaching-literacy-young-esl-learners.html", category: "Young Learners", date: "December 19, 2025" },

// Phase 16: Technology Integration Advanced (5)
{ title: "AI-Powered Differentiation in the ESL Classroom", description: "Adaptive worksheets, automatic leveling, and personalized learning paths with AI.", href: "/blog/ai-powered-differentiation-esl.html", category: "Technology", date: "December 20, 2025" },
{ title: "Using Chatbots for Language Practice — Teacher's Guide", description: "ChatGPT, character.ai, and custom bots for speaking and writing practice.", href: "/blog/using-chatbots-language-practice.html", category: "Technology", date: "December 21, 2025" },
{ title: "Screen-Free Technology Activities for ESL Classes", description: "QR hunts, audio journals, and tech-enhanced activities without screen dependency.", href: "/blog/screen-free-tech-activities-esl.html", category: "Technology", date: "December 22, 2025" },
{ title: "Data-Driven Learning with Corpora in ESL Teaching", description: "Concordance lines, COCA/BNC, and student corpus investigation activities.", href: "/blog/data-driven-learning-esl-corpora.html", category: "Technology", date: "December 23, 2025" },
{ title: "Choosing a Learning Management System for ESL Teaching", description: "Google Classroom, Moodle, Canvas comparison with ESL-specific requirements.", href: "/blog/learning-management-systems-esl.html", category: "Technology", date: "December 24, 2025" },
```

### llms.txt — 6 nowych sekcji

```markdown
## Pronunciation Advanced (Blog)
- [Word Stress Patterns](https://edooqoo.com/blog/teaching-word-stress-patterns-esl.html)
- [English Speech Rhythm](https://edooqoo.com/blog/teaching-rhythm-english-speech.html)
- [Weak Forms & Schwa](https://edooqoo.com/blog/teaching-weak-forms-english.html)
- [Phonemic Awareness](https://edooqoo.com/blog/phonemic-awareness-activities-esl.html)
- [Accent Coaching](https://edooqoo.com/blog/accent-coaching-techniques-esl.html)

## Vocabulary Advanced (Blog)
- [Word Families & Morphology](https://edooqoo.com/blog/teaching-word-families-morphology-esl.html)
- [Phrasal Verbs Strategies](https://edooqoo.com/blog/phrasal-verbs-teaching-strategies.html)
- [Lexical Approach](https://edooqoo.com/blog/lexical-approach-language-teaching.html)
- [Vocabulary Notebooks](https://edooqoo.com/blog/vocabulary-notebook-strategies-esl.html)
- [Abstract Vocabulary](https://edooqoo.com/blog/teaching-abstract-vocabulary-esl.html)

## Grammar Advanced (Blog)
- [Aspect — Perfect & Progressive](https://edooqoo.com/blog/teaching-aspect-english-grammar.html)
- [Modality — Modal Verbs](https://edooqoo.com/blog/teaching-modality-english-esl.html)
- [Relative Clauses](https://edooqoo.com/blog/teaching-relative-clauses-esl.html)
- [Consciousness-Raising Tasks](https://edooqoo.com/blog/consciousness-raising-grammar-tasks.html)
- [Determiners & Quantifiers](https://edooqoo.com/blog/teaching-determiners-quantifiers-esl.html)

## Listening Advanced (Blog)
- [Bottom-Up vs Top-Down](https://edooqoo.com/blog/bottom-up-top-down-listening-esl.html)
- [Lecture Note-Taking](https://edooqoo.com/blog/teaching-note-taking-from-lectures.html)
- [Podcast-Based Lessons](https://edooqoo.com/blog/podcast-based-listening-lessons-esl.html)
- [Dictogloss Technique](https://edooqoo.com/blog/dictogloss-technique-esl-teaching.html)
- [Listening for Gist & Detail](https://edooqoo.com/blog/teaching-listening-for-gist-detail.html)

## Young Learners & Teens (Blog)
- [Teaching Preschoolers](https://edooqoo.com/blog/teaching-english-preschoolers-guide.html)
- [TPR Activities](https://edooqoo.com/blog/tpr-total-physical-response-activities.html)
- [Teen Engagement](https://edooqoo.com/blog/teen-engagement-strategies-esl.html)
- [Content-Based Instruction](https://edooqoo.com/blog/content-based-instruction-young-learners.html)
- [Teaching Literacy YL](https://edooqoo.com/blog/teaching-literacy-young-esl-learners.html)

## Technology Integration (Blog)
- [AI Differentiation](https://edooqoo.com/blog/ai-powered-differentiation-esl.html)
- [Chatbots for Practice](https://edooqoo.com/blog/using-chatbots-language-practice.html)
- [Screen-Free Tech](https://edooqoo.com/blog/screen-free-tech-activities-esl.html)
- [Data-Driven Learning](https://edooqoo.com/blog/data-driven-learning-esl-corpora.html)
- [LMS for ESL](https://edooqoo.com/blog/learning-management-systems-esl.html)
```

---

## Podsumowanie zmian

| Plik | Akcja |
|------|-------|
| Nowa migracja SQL | NOWE — `verify_homework_student_email` RPC |
| `src/hooks/useInteractiveHomework.tsx` | EDYCJA — zamiana direct query na RPC |
| `public/openapi.yaml` | EDYCJA — +60 paths (Ph14) + +30 (Ph16) = +90 |
| `public/blog.html` | EDYCJA — +90 JSON-LD + 18 sekcji kart |
| `public/resources.html` | EDYCJA — +90 linków |
| 30 nowych `public/blog/*.html` | NOWE — Phase 16 |
| `src/pages/Blog.tsx` | EDYCJA — +30 wpisów (207→237) |
| `public/sitemap.xml` | EDYCJA — +30 entries (306→336) |
| `public/llms.txt` | EDYCJA — +6 sekcji |

| Element | Przed | Po |
|---------|-------|----|
| Blog articles | 207 | 237 |
| Sitemap entries | 306 | 336 |
| Blog categories | 41 | 47 |
| Homework email bug | Broken (RLS blocks) | Fixed (SECURITY DEFINER RPC) |
| openapi.yaml sync | 60 paths behind | Fully synced |
| blog.html sync | 60 entries behind | Fully synced |
| resources.html sync | 60 links behind | Fully synced |

