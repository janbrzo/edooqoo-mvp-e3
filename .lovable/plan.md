
# Welcome Test: Placement Test - Pelny Plan Implementacji

## Co to jest i dlaczego jest wazne

Welcome Test to NIE zwykly test poziomowy. To narzedzie do profilowania ucznia - poznania jego stylu uczenia sie, motywacji, preferencji, slabin, a przy okazji weryfikacji poziomu angielskiego. Cel: po ukonczeniu testu system wie o uczniu wiecej niz on sam o sobie wie w kontekscie nauki angielskiego.

Analogia z Facebookiem: Facebook po 10 like'ach przewiduje osobowosc lepiej niz przyjaciel. My po 40-60 pytan bedziemy wiedziec:
- Jak uczen sie uczy (wizualnie? przez powtarzanie? przez kontekst?)
- Co go motywuje (wyniki? zabawa? presja?)
- Gdzie sa jego realne luki (nie deklarowane, ale faktyczne)
- Jaki jest jego "comfort zone" i gdzie zaczyna sie stres jezykowy
- Jakie tematy go angazuja (a jakie nudza)

---

## Architektura: Jak to wpasowuje sie w istniejacy kod

Welcome Test uzywa **istniejacego systemu testow** (`student_tests`, `student_test_questions`, `StudentTestPage`) ale z kluczowymi rozszerzeniami:

1. **Nowy test_type**: `welcome` (obok istniejacych `placement`, `progress_check`, `skill_verification`, `goal_check`)
2. **Predefiniowane pytania** - NIE generowane przez AI, zapisane jako staly plik JSON w kodzie
3. **Nowe typy pytan**: `self_assessment`, `preference_choice`, `scenario_reaction`, `open_reflection` (obok istniejacych `multiple_choice`, `fill_blank`, `true_false`, `matching`, `open_ended`)
4. **Rozszerzony event logging** - kazda odpowiedz logowana do `student_events` z bogatym payloadem
5. **Profil ucznia** - nowa tabela `student_learning_profiles` z wynikami analizy

---

## Struktura Welcome Test: 7 Sekcji (40-60 pytan - wersja FULL)

### SEKCJA 1: "About You" - Samoocena i kontekst (8 pytan)

Cel naukowy: Self-Determination Theory (Deci & Ryan) - poznanie autonomii, kompetencji i relacyjnosci ucznia. Badania pokazuja ze dopasowanie metod do wewnetrznej motywacji ucznia zwieksza efektywnosc nauki 2-3x.

**Q1. How would you describe your English right now?** (self_assessment)
Opcje opisowe zamiast A1/B2:
- "I can handle basic everyday situations like ordering food or asking for directions"
- "I can have simple conversations about familiar topics but struggle with complex ideas"
- "I can discuss most topics but make grammatical mistakes and sometimes lack vocabulary"
- "I speak fluently in most situations but want to sound more natural and precise"
- "I'm comfortable in English but want to master advanced/professional language"

Co to mierzy: Samoswiadomosc jezykowa. Porownanie z faktycznym wynikiem w sekcjach 4-6 pokaze czy uczen przecenia/niedocenia swoj poziom (kluczowe dla planowania).

**Q2. When you speak English, what frustrates you the most?** (preference_choice, multi-select)
- "I know what I want to say but can't find the right words"
- "I make grammar mistakes that I know are wrong"
- "I can't understand native speakers when they talk fast"
- "I feel nervous and forget everything I know"
- "I can't express complex ideas - I simplify too much"
- "My pronunciation makes people ask me to repeat"

Co to mierzy: Samoidentyfikacja glownych barier + emocjonalny stosunek do bledu (fixed vs growth mindset sygnaly).

**Q3. What's your main reason for learning English?** (preference_choice)
- "I need it for my job - meetings, emails, presentations"
- "I'm preparing for an exam (IELTS, Cambridge, etc.)"
- "I want to travel and communicate freely"
- "I want to watch movies/read books without subtitles"
- "I want to feel confident talking to English speakers"
- "Career advancement - I need English for promotion"
- "I'm moving to an English-speaking country"
- Other (free text)

Co to mierzy: Motywacja instrumentalna vs integracyjna (Gardner's Motivation Theory). Instrumentalna (praca, egzamin) = potrzebuje szybkich, mierzalnych wynikow. Integracyjna (podroze, filmy, pewnosc siebie) = potrzebuje immersji i naturalnosci.

**Q4. How do you usually react when you don't understand something in English?** (scenario_reaction)
- "I ask the person to repeat or explain"
- "I pretend I understood and hope for the best"
- "I try to guess from context"
- "I get stressed and switch to my language"
- "I look it up immediately on my phone"

Co to mierzy: Tolerance of ambiguity (Ely, 1995) - kluczowy predyktor sukcesu w nauce jezyka. Uczniowie z wysoka tolerancja ucza sie szybciej.

**Q5. How much time can you realistically spend on English per week (outside lessons)?** (preference_choice)
- "Almost none - I only have lesson time"
- "15-30 minutes a few times a week"
- "About 1 hour spread across the week"
- "2-3 hours - I'm committed"
- "More than 3 hours - English is my priority"

Co to mierzy: Dostepny budzet czasowy - bezposrednio wplywa na dobor strategii (spaced repetition intervals, homework load).

**Q6. Which of these learning activities do you enjoy? Pick all that apply.** (preference_choice, multi-select)
- "Watching videos/movies in English"
- "Reading articles or books"
- "Having conversations"
- "Doing grammar exercises"
- "Learning new vocabulary with flashcards"
- "Listening to podcasts"
- "Writing texts (emails, stories)"
- "Playing language games/quizzes"
- "Singing songs in English"

Co to mierzy: Preferred input channels (Visual/Auditory/Kinesthetic + Active/Passive). Badania Krashen'a (Input Hypothesis) pokazuja ze nauka jest najefektywniejsza gdy input jest "comprehensible + interesting".

**Q7. How do you feel about making mistakes in English?** (self_assessment)
- "I don't mind at all - that's how you learn"
- "I prefer not to, but I can handle it"
- "I feel embarrassed but try to push through"
- "I avoid speaking because I'm afraid of mistakes"
- "I get really frustrated with myself"

Co to mierzy: Error anxiety level (Horwitz Foreign Language Anxiety Scale). Bezposrednio wplywa na to ile ryzyka jezykowego uczen podejmie - i jak agresywne zadania mozemy dawac.

**Q8. When you learn a new word, what helps you remember it best?** (preference_choice)
- "Seeing it written down with a definition"
- "Hearing it in a sentence"
- "Using it in my own sentence right away"
- "Connecting it to a picture or image"
- "Repeating it many times"
- "Understanding the word parts (prefix, root, suffix)"

Co to mierzy: Dominant memory encoding strategy (Dual Coding Theory, Paivio). Bezposrednio wplywa na to jak budujemy materialy dla tego ucznia.

---

### SEKCJA 2: "Your English Experience" - Historia nauki (5 pytan)

Cel naukowy: Transfer theory + Fossilization detection. Zrozumienie tla jezykowego ucznia pozwala przewidziec typowe bledy (L1 transfer) i unikac juz "skamieniaiych" bledow.

**Q9. How long have you been learning English?** (preference_choice)
- "Less than 1 year"
- "1-3 years"
- "3-5 years"
- "5-10 years"
- "More than 10 years"

**Q10. Where have you mainly learned English so far?** (preference_choice, multi-select)
- "School (as a subject)"
- "University"
- "Private lessons with a teacher"
- "Language school/course"
- "Self-study (apps, books, YouTube)"
- "Living/working in an English-speaking country"
- "Through work (using English daily)"

Co to mierzy: Kontekst nauki wplywa na "fossilized errors" - ktos kto uczyl sie sam z YouTube ma inne nawyki niz ktos po kursie Cambridge.

**Q11. Have you ever taken an official English exam?** (preference_choice)
- "No, never"
- "Yes - school/university exam"
- "Yes - Cambridge (FCE/CAE/CPE)"
- "Yes - IELTS"
- "Yes - TOEFL"
- "Yes - other (specify)"

**Q12. What's the biggest challenge you've faced learning English?** (open_reflection)
Free text - "In 1-2 sentences, describe your biggest frustration or challenge with English."

Co to mierzy: Narratywna samoocena. Analiza sentymentu + slow kluczowych daje wglad w emocjonalny stosunek do nauki. NLP w przyszlosci moze automatycznie kategoryzowac.

**Q13. Is there anything specific your previous teachers did that worked really well for you?** (open_reflection)
Free text

Co to mierzy: Co dzialalo w przeszlosci = co prawdopodobnie zadziala znowu. Praktyczna intelligence o preferencjach pedagogicznych.

---

### SEKCJA 3: "Real-Life Scenarios" - Reakcje sytuacyjne (6 pytan)

Cel naukowy: Situated cognition (Brown, Collins, Duguid). Zamiast pytac "co umiesz", stawiamy ucznia w sytuacjach i obserwujemy jak reaguje. To ujawnia FAKTYCZNY (nie deklarowany) poziom.

**Q14. You're at a coffee shop abroad. The barista asks you something you don't fully understand. What do you do?** (scenario_reaction)
- "I say 'Sorry, could you repeat that please?' and try again"
- "I just point at the menu and smile"
- "I use Google Translate on my phone"
- "I answer with what I think they asked"

**Q15. Your English-speaking colleague sends you a long email about a project. Some parts are unclear. What do you do?** (scenario_reaction)
- "I read it carefully, look up unknown words, and reply"
- "I reply asking them to clarify the confusing parts"
- "I understand most of it and guess the rest from context"
- "I struggle to understand and need to translate most of it"

**Q16. You need to describe a problem with your hotel room to the reception.** (open_ended)
"Write 2-3 sentences explaining that your room's air conditioning isn't working and you'd like it fixed or to change rooms."

Co to mierzy: Faktyczny writing level - grammar accuracy, vocabulary range, pragmatic appropriateness. Porownanie z Q1 (samoocena) daje insight o self-awareness.

**Q17. You're in a job interview and they ask 'Tell me about a challenge you've faced at work.' How would you answer?** (open_ended)
"Write 3-4 sentences as if you're actually in the interview."

Co to mierzy: Pragmatic competence + discourse management pod presja. Uzycie formalnego/nieformalnego rejestru, koherencja, complexity.

**Q18. Listen to/Read this short dialogue and answer: What is the main problem the speakers are discussing?** (multiple_choice)
(Tekstowy dialog zamiast audio - prostsza implementacja na start)
```
A: "I've been waiting for the delivery for three weeks now."
B: "I understand your frustration. Let me check the tracking number."
A: "I already checked online - it says 'in transit' but nothing has moved since Tuesday."
B: "I see. I'll escalate this to our logistics team and call you back today."
```
Options:
- "A package that hasn't arrived"
- "A broken product"
- "A billing issue"
- "A cancelled order"

Co to mierzy: Reading/listening comprehension - extracting main idea. Difficulty level B1-B2.

**Q19. Read this text and answer the question below:**
(Krotki tekst 80-100 slow o temacie ogolnym, np. remote work)
"According to a recent study, more than 60% of employees prefer a hybrid work model..."
Question: "What does the author suggest is the main benefit of hybrid work?"
(multiple_choice - 4 options)

Co to mierzy: Reading comprehension na wyzszym poziomie - inference, nie tylko surface-level understanding.

---

### SEKCJA 4: "Grammar Check" - Weryfikacja gramatyki (8 pytan)

Cel naukowy: Processability Theory (Pienemann) - gramatyka jest przyswajana w przewidywalnej kolejnosci. Testujemy od prostych do zlozonych struktur, zeby precyzyjnie okreslic "grammar ceiling" ucznia.

**Q20-Q21: Tenses basics** (fill_blank)
- "She ___ (go) to the gym every morning." -> goes (Present Simple 3rd person)
- "I ___ (study) English for three years." -> have been studying (Present Perfect Continuous)

**Q22-Q23: Complex structures** (multiple_choice)
- Conditional: "If I ___ earlier, I wouldn't have missed the train." -> had left (Third Conditional)
- Passive: "The report ___ by the team last week." -> was written

**Q24-Q25: Error correction** (open_ended or multiple_choice)
- "She don't like coffee." -> Identify and fix the error
- "I have went to London last year." -> Identify and fix

**Q26-Q27: Sentence transformation** (fill_blank)
- "It started raining two hours ago." -> "It ___ for two hours." (has been raining)
- "People say he is very smart." -> "He ___ very smart." (is said to be)

Co to mierzy: Kazde pytanie testuje konkretny nano_skill gramatyczny. Progresja trudnosci od A2 do C1 pozwala precyzyjnie umiescic ucznia na skali.

---

### SEKCJA 5: "Vocabulary & Expressions" - Slownictwo (8 pytan)

Cel naukowy: Nation's Vocabulary Size Framework. Testujemy szerokosc (breadth) i glebokosc (depth) slownictwa na roznych czestotliwosciach.

**Q28-Q29: Common collocations** (multiple_choice)
- "Can you ___ me a favour?" -> do (not make)
- "She ___ a deep breath before speaking." -> took (not made/did)

**Q30-Q31: Word formation** (fill_blank)
- "The ___ (decide) was made yesterday." -> decision
- "He spoke very ___ (confident)." -> confidently

**Q32-Q33: Contextual vocabulary** (multiple_choice)
- "The deadline is really tight. We need to ___ up." -> hurry/speed
- "She was ___ about the news." -> thrilled/devastated (test nuance understanding)

**Q34-Q35: Idioms & expressions** (matching or multiple_choice)
- Match idioms to meanings: "break the ice", "hit the nail on the head", "cost an arm and a leg"
- "When she heard the price, she said 'That costs ___'" -> an arm and a leg

Co to mierzy: Szerokosc slownictwa (czestotliwosc slow) + glebokosc (kolokacje, word formation, idiomy). Kazde pytanie ma nano_skill.

---

### SEKCJA 6: "Communication Style" - Styl komunikacji (5 pytan)

Cel naukowy: Communicative Competence (Canale & Swain) - testujemy nie tylko accuracy ale tez fluency, appropriacy i strategic competence.

**Q36. How would you politely decline an invitation to a colleague's party?** (open_ended)
"Write 1-2 sentences."

Co to mierzy: Pragmatic competence - umiejetnosc uzycia jezyka w kontekscie spolecznym. Rejestr, politeness strategies.

**Q37. Rewrite this sentence to sound more formal:** (open_ended)
"Hey, just wanted to check if you got my email about the meeting thing."

Co to mierzy: Register awareness - umiejetnosc przejscia miedzy formalnym a nieformalnym rejestrem.

**Q38. Which of these sounds most natural to you?** (multiple_choice)
- a) "I want that you help me"
- b) "I want you to help me"  
- c) "I want you help me"
- d) "I want for you to help me"

Co to mierzy: Intuicja gramatyczna (implicit knowledge vs explicit). Jesli uczen wybiera poprawna odpowiedz ale nie umie wyjasnic dlaczego - ma dobra intuicje ale slaba swiadoma wiedze.

**Q39. You need to explain why you were late to a meeting. Choose the best response:** (scenario_reaction)
- "Sorry I'm late. Traffic."
- "I apologize for being late. There was an accident on the highway."
- "I'm so sorry for the delay. Unfortunately, there was a major traffic jam due to an accident. I left early but couldn't avoid it."
- "My deepest apologies for this unacceptable tardiness."

Co to mierzy: Pragmatic appropriacy - nie za malo, nie za duzo. Opcje sa od "too casual" do "too formal", poprawna jest srodkowa.

**Q40. Read these two versions. Which sounds better and why?** (open_reflection)
Version A: "The meeting was good. We talked about the project. Everyone agreed."
Version B: "The meeting went well - we discussed the project timeline and reached a consensus on the next steps."
"Which version sounds better to you and why? Write 1 sentence."

Co to mierzy: Awareness of discourse quality - czy uczen rozpoznaje lepszy tekst i potrafi wyjasnic dlaczego.

---

### SEKCJA 7: "Your Goals & Preferences" - Zamkniecie (5 pytan)

Cel naukowy: Goal Setting Theory (Locke & Latham). Konkretne, ambitne cele zwiększaja wyniki o 20-25%.

**Q41. If you could achieve ONE thing in English in the next 3 months, what would it be?** (open_reflection)
Free text

**Q42. How do you prefer to receive feedback on your mistakes?** (preference_choice)
- "Correct me immediately, every time"
- "Note them down and discuss at the end"
- "Only correct major mistakes, ignore small ones"
- "Write corrections for me to review later"
- "I prefer to self-correct with hints"

Co to mierzy: Feedback preference = jak budowac interakcje na Live Session i jak formulowac AI feedback.

**Q43. What topics interest you the most? Pick up to 3.** (preference_choice, multi-select max 3)
- Technology & Innovation
- Business & Finance
- Travel & Culture
- Health & Lifestyle
- Science & Nature
- Entertainment & Pop Culture
- Sports
- Food & Cooking
- Psychology & Self-improvement
- Politics & Current Events
- Art & Literature
- History

Co to mierzy: Content preferences dla generowania worksheetow, flashcard sets i tematow lekcji.

**Q44. How would you rate your confidence in these areas?** (self_assessment matrix)
Skala 1-5 dla kazdego:
- Speaking with strangers
- Writing formal emails
- Understanding movies without subtitles
- Reading news articles
- Giving presentations
- Small talk at parties

Co to mierzy: Self-efficacy map (Bandura) - percepcja wlasnych umiejetnosci w roznych kontekstach. Porownanie z faktycznymi wynikami daje precision insight.

**Q45. Is there anything else you'd like your teacher to know about you or your learning?** (open_reflection)
Free text - optional

---

## Dane zbierane do student_events

Kazda odpowiedz generuje event w `student_events`:

```typescript
{
  event_type: 'test_answer_submitted',
  event_source: 'test',
  source_id: test_id,
  element_type: 'grammar' | 'vocabulary' | 'reading' | null,
  event_payload: {
    test_type: 'welcome',
    question_index: 0-44,
    question_type: 'self_assessment' | 'preference_choice' | 'scenario_reaction' | 'open_reflection' | 'multiple_choice' | 'fill_blank' | 'open_ended' | 'matching',
    section: 'about_you' | 'experience' | 'scenarios' | 'grammar' | 'vocabulary' | 'communication' | 'goals',
    student_answer: "...",
    is_correct: true/false/null,  // null dla self_assessment/preference
    time_spent_seconds: 45,
    nano_skill_ratings: [{ name: "ns.grammar.third_person_s", reason: "...", mastery: 100 }],
    // Dodatkowe meta-dane wynikajace z odpowiedzi:
    detected_traits: {
      anxiety_level?: 'low' | 'medium' | 'high',
      motivation_type?: 'instrumental' | 'integrative',
      ambiguity_tolerance?: 'low' | 'medium' | 'high',
      learning_style?: 'visual' | 'auditory' | 'kinesthetic',
      feedback_preference?: string,
      self_assessment_accuracy?: 'overestimates' | 'accurate' | 'underestimates'
    }
  },
  skill_ids: ['ns.grammar.third_person_s'],  // jesli dotyczy
  mastery: 100  // jesli mozna obliczyc
}
```

Po ukonczeniu testu - dodatkowy event sumaryczny:

```typescript
{
  event_type: 'test_completed',
  event_source: 'test',
  source_id: test_id,
  event_payload: {
    test_type: 'welcome',
    total_questions: 45,
    completed_questions: 43,
    time_total_seconds: 1800,
    grammar_score: 62,    // % z sekcji 4
    vocabulary_score: 71, // % z sekcji 5
    estimated_level: 'B1+',
    self_assessed_level: 'B2',  // z Q1
    level_gap: 'overestimates',  // B2 deklarowane vs B1+ faktyczne
    profile_summary: {
      motivation_type: 'instrumental',
      anxiety_level: 'medium',
      preferred_activities: ['conversations', 'videos', 'vocabulary'],
      interest_topics: ['technology', 'business', 'travel'],
      feedback_preference: 'note_and_discuss',
      learning_time_weekly: '1_hour',
      ambiguity_tolerance: 'medium',
      strongest_skill: 'reading',
      weakest_skill: 'speaking',
      self_awareness: 'overestimates'
    }
  }
}
```

---

## Nowa tabela: student_learning_profiles

```sql
CREATE TABLE student_learning_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  welcome_test_id UUID REFERENCES student_tests(id),
  
  -- Poziom
  estimated_level TEXT,           -- 'A1', 'A2', 'B1', 'B1+', 'B2', etc.
  self_assessed_level TEXT,
  level_confidence TEXT,          -- 'overestimates', 'accurate', 'underestimates'
  
  -- Motywacja i osobowosc
  motivation_type TEXT,           -- 'instrumental', 'integrative', 'mixed'
  anxiety_level TEXT,             -- 'low', 'medium', 'high'
  ambiguity_tolerance TEXT,       -- 'low', 'medium', 'high'
  error_attitude TEXT,            -- 'comfortable', 'cautious', 'avoidant'
  
  -- Preferencje nauki
  preferred_activities TEXT[],    -- ['conversations', 'videos', 'flashcards']
  preferred_input_channel TEXT,   -- 'visual', 'auditory', 'kinesthetic'
  feedback_preference TEXT,       -- 'immediate', 'delayed', 'self_correct'
  interest_topics TEXT[],         -- ['technology', 'business']
  weekly_study_time TEXT,         -- '15_30_min', '1_hour', '2_3_hours'
  
  -- Umiejetnosci
  grammar_score NUMERIC,
  vocabulary_score NUMERIC,
  reading_score NUMERIC,
  writing_score NUMERIC,
  communication_score NUMERIC,
  strongest_skill TEXT,
  weakest_skill TEXT,
  
  -- Self-efficacy (z Q44)
  confidence_speaking SMALLINT,
  confidence_writing SMALLINT,
  confidence_listening SMALLINT,
  confidence_reading SMALLINT,
  confidence_presenting SMALLINT,
  confidence_small_talk SMALLINT,
  
  -- Meta
  raw_answers JSONB,             -- pelne odpowiedzi jako backup
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, teacher_id)
);
```

---

## Implementacja techniczna - krok po kroku

### Krok 1: Typy i stale

**Pliki:**
- `src/types/studentTests.ts` - dodac `'welcome'` do `TestType`, nowe `QuestionType` wartosci (`self_assessment`, `preference_choice`, `scenario_reaction`, `open_reflection`)
- `src/types/dslm/events.ts` - dodac `'welcome_test_completed'` do `StudentEventType`
- `src/types/welcomeTest.ts` - NOWY plik z typami specyficznymi dla Welcome Test (WelcomeTestQuestion, WelcomeTestSection, LearningProfile)

### Krok 2: Pytania Welcome Test

**Plik:** `src/data/welcomeTestQuestions.ts` - NOWY plik
- Staly plik JSON z wszystkimi 45 pytaniami
- Kazde pytanie ma: id, section, question_type, question_text, options (jesli dotyczy), correct_answer (jesli dotyczy), nano_skill (jesli dotyczy), element_type, difficulty_level, scoring_logic (opis co mierzymy)
- Pytania pogrupowane w 7 sekcji

### Krok 3: Baza danych

- Nowa tabela `student_learning_profiles` (SQL powyzej)
- Dodac `welcome` do dozwolonych wartosci `test_type` w `student_tests` (jesli jest CHECK constraint)
- RLS policies na nowa tabele (identyczne jak na `student_tests`)

### Krok 4: Edge Function - przetwarzanie wynikow

**Plik:** `supabase/functions/process-welcome-test/index.ts` - NOWY
- Pobiera wszystkie odpowiedzi z `student_test_questions` dla danego testu
- Oblicza grammar_score, vocabulary_score itd.
- Analizuje odpowiedzi z sekcji 1-3 i 7 (preferencje, motywacja)
- Generuje `student_learning_profiles` record
- Loguje sumaryczny event do `student_events`
- Opcjonalnie: uzywa AI (Lovable AI Gateway) do analizy odpowiedzi open_reflection i generowania insights

### Krok 5: UI - Strona Welcome Test dla ucznia

**Plik:** `src/pages/WelcomeTestPage.tsx` - NOWY
- Bazuje na istniejacym `StudentTestPage.tsx` ale z rozszerzeniami:
- Sekcjowy layout (7 sekcji z naglowkami i progress bar na gorze)
- Nowe typy renderowania odpowiedzi: self_assessment (skala opisowa), preference_choice (multi-select chips), scenario_reaction (karty ze scenariuszami), open_reflection (textarea z zacheta)
- Ladny, przyjazny design (nie "testowy" ale "conversational")
- Pasek postepu po sekcjach, nie po pytaniach
- Auto-save odpowiedzi
- Timer na pytanie (ukryty - uczen go nie widzi, ale logujemy czas)

### Krok 6: UI - Panel nauczyciela

**Plik:** `src/components/student-tests/WelcomeTestResults.tsx` - NOWY
- Widok wynikow Welcome Test w panelu nauczyciela
- Dashboard z: estimated level, self-assessment gap, motivation profile, anxiety level, preferred activities, interest topics
- Sekcja "Recommendations" - na podstawie profilu, sugestie jak prowadzic lekcje
- Integracja z istniejacym `TestDetailsView` - jesli test_type === 'welcome', pokaz WelcomeTestResults zamiast standardowego widoku

### Krok 7: Trigger - sugestia wyslania Welcome Test

**Plik:** `src/components/dashboard/WelcomeTestSuggestion.tsx` - NOWY
- Po utworzeniu nowego studenta, na `StudentPage` (tab overview) pokaz banner:
  "Send a Welcome Test to [Student Name] to understand their learning profile"
  z przyciskiem "Send Welcome Test"
- Przycisk automatycznie: tworzy test w `student_tests` (type=welcome), dodaje predefiniowane pytania, generuje share token, otwiera modal z linkiem/emailem
- Banner znika gdy Welcome Test jest completed

### Krok 8: Routing

**Plik:** `src/App.tsx`
- Dodac route: `<Route path="/welcome-test/:token" element={<WelcomeTestPage />} />`

### Krok 9: Logowanie eventow

**Plik:** `src/hooks/useWelcomeTest.tsx` - NOWY
- Hook do obslugi Welcome Test session (bazujacy na useStudentTestSession)
- Logowanie kazdej odpowiedzi do student_events z pelnym payloadem (sekcja, detected_traits)
- Po zakonczeniu: wywolanie edge function `process-welcome-test`

---

## Podsumowanie plikow do utworzenia/zmiany

| # | Plik | Typ | Opis |
|---|------|-----|------|
| 1 | `src/types/welcomeTest.ts` | NOWY | Typy dla Welcome Test |
| 2 | `src/data/welcomeTestQuestions.ts` | NOWY | 45 predefiniowanych pytan |
| 3 | `src/types/studentTests.ts` | ZMIANA | Dodac 'welcome' do TestType, nowe QuestionType |
| 4 | `src/types/dslm/events.ts` | ZMIANA | Dodac 'welcome_test_completed' |
| 5 | `src/pages/WelcomeTestPage.tsx` | NOWY | Strona testu dla ucznia |
| 6 | `src/hooks/useWelcomeTest.tsx` | NOWY | Hook do obslugi sesji testu |
| 7 | `src/components/student-tests/WelcomeTestResults.tsx` | NOWY | Wyniki w panelu nauczyciela |
| 8 | `src/components/dashboard/WelcomeTestSuggestion.tsx` | NOWY | Banner sugestii |
| 9 | `supabase/functions/process-welcome-test/index.ts` | NOWY | Edge function przetwarzania |
| 10 | `src/App.tsx` | ZMIANA | Nowy route |
| 11 | `src/pages/StudentPage.tsx` | ZMIANA | Dodac WelcomeTestSuggestion |
| 12 | `src/components/student-tests/TestDetailsView.tsx` | ZMIANA | Obsluga welcome test results |
| 13 | SQL migration | NOWY | Tabela student_learning_profiles |
| 14 | Dokumentacja | ZMIANA | Aktualizacja docs |

### Bezpieczenstwo zmian

- Nowy `test_type: 'welcome'` jest addytywny - zero wplywu na istniejace testy
- Nowe `QuestionType` wartosci sa addytywne - istniejace typy dzialaja bez zmian
- Nowa tabela `student_learning_profiles` nie wplywa na zadne istniejace zapytania
- Nowa strona `/welcome-test/:token` nie koliduje z istniejacym `/test/:token`
- Predefiniowane pytania sa w stalym pliku - brak zaleznosci od AI przy tworzeniu
- Event logging uzywa istniejacego `add_student_event` RPC - zero zmian w bazie eventow
