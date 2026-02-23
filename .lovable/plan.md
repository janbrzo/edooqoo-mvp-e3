

# Plan wdrozenia - 6 problemow (Subskrypcje + DSLM + Speaking + Admin)

---

## Problem 1: Przedluzenie subskrypcji nie dodaje tokenow

### Przyczyna

W `stripe-webhook/index.ts` linia 171, tokeny sa ZAWSZE ustawiane na 0:

```text
tokens_added: 0,
```

Webhook NIE rozroznia miedzy przedluzeniem (renewal) a innymi zdarzeniami `customer.subscription.updated`. Nigdy nie wywoluje `add_tokens`.

### Rozwiazanie

**A. Naprawa webhook** - dodac detekcje renewal PRZED insertom do `subscription_events`:

```text
Warunek renewal:
  event_type === 'customer.subscription.updated'
  AND old_plan_type === new_plan_type (ten sam plan)
  AND cancel_at_period_end === false
  AND status === 'active'
  AND NIE jest duplikatem (brak eventu 'subscription_renewed' w ciagu 25 dni dla tego teacher_id)
  AND NIE jest upgrade'em (brak eventu 'upgraded' w ciagu 1 godziny)

Jesli renewal:
  1. Oblicz tokeny (Side-Gig=15, FT30=30, FT60=60, FT90=90, FT120=120)
  2. Wywolaj RPC add_tokens
  3. Ustaw tokens_added = wartosc
  4. Zmien event_type na 'subscription_renewed'
```

**B. Zabezpieczenie przed duplikatami** - na poczatku webhooka:

```text
SELECT id FROM subscription_events WHERE stripe_event_id = event.id
Jesli istnieje -> return 200 (already processed)
```

**C. Backfill zalegych tokenow**

Analiza WSZYSTKICH rekordow gdzie `old_plan = new_plan, cancel_end=false, status=active, tokens_added=0`:

**j4n.brz0+44 (4ee84131)**:
- 2025-11-24 23:11 Side-Gig=Side-Gig -- NIE renewal: upgrade do FT30 nastapil 8 min pozniej (23:19)
- 2025-11-24 23:19 FT30=FT30 -- NIE: to jest echo upgrade'u (ten sam timestamp)
- 2025-11-24 23:34 FT30=FT30 -- NIE: duplikat Stripe (kilka minut po upgrade)
- 2025-11-24 23:49 FT30=FT30 -- NIE: duplikat Stripe
- 2025-11-25 00:20 FT30=FT30 -- NIE: duplikat Stripe
- 2025-12-21 12:15 FT30=FT30 -- TAK RENEWAL: 27 dni po subskrypcji, brak upgrade w poblizu -> **+30 tokenow**
- 2026-01-13 08:56 FT60=FT60 -- NIE: upgrade do FT60 w tej samej sekundzie
- 2026-01-21 12:15 FT60=FT60 -- TAK RENEWAL: 8 dni po upgrade, cykl miesięczny 21-go -> **+60 tokenow**
- 2026-02-21 12:15 FT60=FT60 -- TAK RENEWAL: dokladnie miesiac pozniej -> **+60 tokenow**
- 2026-02-21 19:38 FT90=FT90 -- NIE: upgrade do FT90 w tej samej sekundzie

**Podsumowanie j4n.brz0+44: +150 tokenow** (30+60+60)

**mobilingo.biuro (38a9fae8)**:
- 2025-12-23 19:02 FT30=FT30 -- TAK RENEWAL: 30 dni po start (11-23) -> **+30 tokenow**
- 2026-01-12 12:22 FT60=FT60 -- NIE: to moze byc echo upgrade'u... sprawdzam. Brak eventu 'upgraded' w poblizu w danych! Ale to 20 dni po poprzednim renewal, co jest nietypowe. Sprawdzam event timeline:
  - 2025-11-23 created FT30 (start)
  - 2025-12-23 renewal FT30 (30 dni)
  - 2026-01-12 FT60=FT60 -- ale nie ma upgraded event! To oznacza ze upgrade nastapil bez finalize-upgrade. To jest RENEWAL po upgrade. -> **+60 tokenow**
- 2026-01-23 19:02 FT60=FT60 -- TAK RENEWAL: dokladnie miesiac od 12-23 -> **+60 tokenow**
- 2026-02-09 08:04 FT30=FT30 -- to jest po downgrade (event 2026-02-09 08:03 old=FT60 new=Side-Gig). Ale event_data mowi FT30=FT30... to jest echo downgrade'u, NIE renewal

**Podsumowanie mobilingo.biuro: +150 tokenow** (30+60+60)

**j4n.brz0+50 (3db65411)**:
- 2025-12-24 23:50 SG=SG -- TAK RENEWAL: 30 dni po start (11-24) -> **+15 tokenow**
- 2026-01-24 23:50 SG=SG -- TAK RENEWAL: dokladnie miesiac -> **+15 tokenow**

**Podsumowanie j4n.brz0+50: +30 tokenow** (15+15)

**esl.biery (5e7853ad)**:
- 2025-12-16 14:42 SG=SG -- TAK RENEWAL: 30 dni po start (12-16... hmm, created 2025-12-16. To jest tego samego dnia! NIE renewal, to echo tworzenia)
  - Sprawdzam: created event jest o 14:41:58, a ten updated o 14:42:10 (12 sekund pozniej). NIE RENEWAL, duplikat.
- 2026-01-16 14:42 SG=SG -- TAK RENEWAL: dokladnie miesiac po start -> **+15 tokenow**

**Podsumowanie esl.biery: +15 tokenow** (15)

### CALKOWITY BACKFILL

| Nauczyciel | Email | Tokeny do dodania | Szczegoly |
|---|---|---|---|
| 4ee84131 | j4n.brz0+44 | **150** | 30 (12-21 FT30) + 60 (01-21 FT60) + 60 (02-21 FT60) |
| 38a9fae8 | mobilingo.biuro | **150** | 30 (12-23 FT30) + 60 (01-12 FT60) + 60 (01-23 FT60) |
| 3db65411 | j4n.brz0+50 | **30** | 15 (12-24 SG) + 15 (01-24 SG) |
| 5e7853ad | esl.biery | **15** | 15 (01-16 SG) |

Backfill: SQL migration z UPDATE profiles SET available_tokens = available_tokens + X, total_tokens_received = total_tokens_received + X. Plus UPDATE subscription_events SET event_type = 'subscription_renewed' dla tych rekordow.

---

## Problem 2: Audyt flow subskrypcji

Glowny bug to Problem 1. Dodatkowe zabezpieczenie: duplikat check na `stripe_event_id` na poczatku webhooka.

Reszta flow (create-subscription, finalize-upgrade, check-subscription-status) dziala poprawnie - tokeny sa dodawane przy pierwszym zakupie i przy upgrade'ach.

---

## Problem 3.1: Discussion nano_skill edit traci drugi skill

### Przyczyna

W `ExerciseSection.tsx` linia 1028:
```js
onEdit={(newSkill) => {
  newQuestions[qIndex] = { ...question, nano_skill: newSkill };
```

Callback NIE przyjmuje `skillIndex` i NIE uzywa `updateNanoSkillValue`. Nadpisuje cala tablice `[sp, wr]` jednym obiektem.

### Rozwiazanie

Zmienic na (linia 1028):
```js
onEdit={(newSkill, skillIndex) => {
  ...
  newQuestions[qIndex] = { 
    ...question, 
    nano_skill: updateNanoSkillValue(question, newSkill, skillIndex) 
  };
```

Ten sam fix dla WSZYSTKICH pozostalych callbackow w ExerciseSection ktore jeszcze nie uzywaja `updateNanoSkillValue`:
- Fill-in-blanks (linia 893): `nano_skill: newSkill` -> `nano_skill: updateNanoSkillValue(newSentences[sIndex], newSkill, skillIndex)`
- Multiple-choice (linia 936): analogicznie
- Dialogue (linia 965-971): analogicznie
- Discussion (linia 1028): glowny bug
- Answer-questions i inne dalsze bloki: sprawdzic i naprawic

---

## Problem 3.2: Badge label "ns" zamiast konkretnego skrotu

### Rozwiazanie

Dodac do `getBadgeLabel` w `NanoSkillBadge.tsx`:
```js
if (/\bgrammar\b/.test(name)) return "gr";
if (/\bvocabulary\b/.test(name)) return "vo";
```

---

## Problem 4: Speaking (nagrywanie) w homework i shared worksheet

### Rozwiazanie techniczne

**A. Nowy komponent `HomeworkSpeakingRecorder.tsx`**:
- Adaptacja istniejacego `SpeakingRecorder.tsx` z Welcome Test
- Uzywa tego samego `uploadBlobToR2()` (juz wyeksportowane)
- Prostszy interfejs: Record / Stop / Re-record / przycisk Play
- Wynik: audio_url zapisywany w `audioAnswers` (osobny obiekt obok `studentAnswers`)

**B. Zmiany w UI - 8 komponentow cwiczen**:
Pod kazdym polem tekstowym w trybie interaktywnym dodac toggle:
```text
[Write ✏️] [Speak 🎤]    lub oba jednoczesnie
```
Jesli Speak: pokazuje HomeworkSpeakingRecorder zamiast/obok textarea

**C. Transkrypcja przed AI eval**:

W `useInteractiveHomework.tsx` - w funkcji `handleSubmit`, PRZED wywolaniem `verify-open-answers`:

```text
1. Zbierz wszystkie audioAnswers ktore nie maja transkrypcji
2. Dla kazdego: wywolaj transcribe-audio edge function
3. Zapisz transkrypcje w audioAnswers[exerciseIndex][questionIndex].transcription
4. Przekaz do verify-open-answers jako dodatkowe dane
```

**D. Modyfikacja verify-open-answers prompt**:

Obecny system prompt (linia 54-77) zostanie rozszerzony o sekcje SPEAKING EVALUATION:

```text
FULL SYSTEM PROMPT (zmienione czesci oznaczone >>>):

You are a STRICT English language teacher evaluating student answers.
The student's English level is: ${english_level || "Intermediate"}

Your task is to evaluate each answer based on:
1. Relevance - Does it answer the question?
2. Language quality - Is the grammar and vocabulary appropriate for the student's level?
3. Completeness - Is the answer sufficiently developed?

>>> NEW SECTION:
4. SPEAKING EVALUATION (only when audio_transcription is provided):
   - Fluency: Calculate words per second (audio_word_count / audio_duration_seconds). 
     A2 target: 1.0-1.5 wps. B1 target: 1.5-2.0 wps. B2+: 2.0+ wps.
     Score 0.9+ if above target, 0.7-0.9 if near target, below 0.5 if very slow (<0.5 wps).
   - Coherence: Does the transcribed speech form logical, complete sentences?
   - Grammar accuracy: Are sentences grammatically correct for the level?
   - Task completion: Does the spoken response address the question/prompt?
   - Pronunciation proxy: Whisper transcription accuracy suggests pronunciation clarity.

For each answer, provide:
- quality_score: A number from 0.0 to 1.0 (0.7+ is acceptable)
- is_acceptable: true if quality_score >= 0.7
- feedback: Specific, constructive feedback in English (max 40 words).
>>> NEW:
- writing_score: (0.0-1.0) Score for the WRITTEN answer only. Omit if no written answer.
- speaking_score: (0.0-1.0) Score for the SPOKEN answer (from transcription). Omit if no audio.

[... reszta STRICT SCORING RULES pozostaje bez zmian ...]

>>> NEW at end:
SPEAKING-SPECIFIC SCORING:
- If audio_transcription is provided but is empty/gibberish: speaking_score 0.0-0.1
- If audio is very short (<3 words for 10+ seconds): speaking_score 0.1-0.3 (hesitant/minimal)
- If audio has good content but slow pace: speaking_score 0.5-0.7
- If audio is fluent with correct grammar: speaking_score 0.7-0.9
- If audio is fluent, accurate, and natural: speaking_score 0.9-1.0

CRITICAL: Return ONLY a valid JSON array. No markdown code blocks. No extra text. Just the array.
```

User prompt zostanie rozszerzony (linia 79-94):

```text
Evaluate these ${answers.length} student answers:

${answers.map((a, i) => `[Answer ${i + 1}]
Question: ${a.question_text}
Student's written answer: ${a.student_answer || "(no written answer)"}
${a.audio_transcription ? `Student's spoken answer (transcription): ${a.audio_transcription}` : ""}
${a.audio_duration_seconds ? `Audio duration: ${a.audio_duration_seconds} seconds` : ""}
${a.audio_word_count ? `Spoken word count: ${a.audio_word_count}` : ""}
${a.suggested_answer ? `Suggested answer: ${a.suggested_answer}` : ""}
Exercise type: ${a.exercise_type}
`).join("\n")}

Return exactly ${answers.length} evaluation objects in a JSON array:
[{"question_index": 0, "quality_score": 0.85, "is_acceptable": true, "feedback": "...", "writing_score": 0.80, "speaking_score": 0.75}]
```

**E. Zmiany w interface `AnswerToEvaluate`** (linia 9-16):

```text
interface AnswerToEvaluate {
  question_index: number;
  question_text: string;
  student_answer: string;
  suggested_answer?: string;
  exercise_type: string;
  exercise_index?: number;
  // NEW: Speaking data
  audio_transcription?: string;
  audio_duration_seconds?: number;
  audio_word_count?: number;
}
```

**F. Zmiany w `EvaluationResult`** (linia 18-24):

```text
interface EvaluationResult {
  question_index: number;
  exercise_index?: number;
  quality_score: number;
  is_acceptable: boolean;
  feedback: string;
  // NEW:
  writing_score?: number;
  speaking_score?: number;
}
```

---

## Problem 5.1: Nano skills dla zadan ze speaking - pelny zestaw

Ponizej OBECNE nano skille z template'ow i PLANOWANE zmiany po dodaniu opcji nagrywania.

### reading (Reading Comprehension)
Kazde pytanie ma juz 2 ns. Po dodaniu speaking:

| Przyklad | Obecny ns1 | Obecny ns2 | Nowy ns3 (speaking) |
|---|---|---|---|
| Q1 "Why is there such a wide variety..." | rd (0.95) `ns.A2.reading.main_idea_extraction` | wr (0.90) `ns.A2.writing.cause_effect_response` | sp (0.40) `ns.A2.speaking.cause_effect_explanation` |
| Q2 "What are some typical examples..." | rd (0.92) `ns.A2.reading.detail_extraction` | wr (0.88) `ns.A2.writing.listing_from_text` | sp (0.40) `ns.A2.speaking.listing_from_text` |
| Q3 "What is special about NY pizza?" | rd (0.92) `ns.A2.reading.detail_extraction` | wr (0.88) `ns.A2.writing.descriptive_response` | sp (0.40) `ns.A2.speaking.descriptive_response` |
| Q4 "What are popular cuisines?" | rd (0.92) `ns.A2.reading.detail_extraction` | wr (0.88) `ns.A2.writing.listing_from_text` | sp (0.40) `ns.A2.speaking.listing_from_text` |
| Q5 "Common complaints?" | rd (0.92) `ns.A2.reading.detail_extraction` | wr (0.88) `ns.A2.writing.listing_from_text` | sp (0.40) `ns.A2.speaking.listing_from_text` |

**Zmiana w template**: kazde pytanie dostaje trzeci element w tablicy `nano_skill`

### dialogue (Dialogue Practice)
Expressions juz maja 2 ns (sp + wr). BEZ ZMIAN - te sa kompletne:

| Przyklad | ns1 (speaking) | ns2 (writing) |
|---|---|---|
| "I'd like to order..." | sp (0.40) `ns.A2.speaking.polite_request` | wr (0.90) `ns.A2.writing.polite_request_structure` |
| "Can I see the menu?" | sp (0.40) `ns.A2.speaking.asking_for_information` | wr (0.90) `ns.A2.writing.question_formation` |
| itd. | sp (0.40) | wr (0.90) |

**BEZ ZMIAN** - juz kompletne

### answer-questions (Answer Questions)
Kazde pytanie ma juz 2 ns. Trzeba dodac trzeci (speaking):

| Przyklad | Obecny ns1 | Obecny ns2 | Nowy ns3 |
|---|---|---|---|
| Q1 "What's your favorite restaurant..." | gr (0.90) `ns.A2.comparatives.irregular_better` | wr (0.90) `ns.A2.writing.comparative_response` | sp (0.40) `ns.A2.speaking.comparative_response` |
| Q2 "Describe worst experience" | gr (0.90) `ns.A2.superlatives.irregular_worst` | wr (0.90) `ns.A2.writing.past_tense_narrative` | sp (0.40) `ns.A2.speaking.past_tense_narrative` |
| Q3 "If you could open restaurant" | gr (0.90) `ns.B1.second_conditional` | wr (0.90) `ns.B1.writing.conditional_response` | sp (0.40) `ns.B1.speaking.conditional_response` |
| Q4 "How do you react" | sp (0.40) `ns.A2.speaking.describing_reaction` | wr (0.90) `ns.A2.writing.habitual_action_description` | -- juz ma sp |
| Q5 "Most expensive meal" | gr (0.90) `ns.A2.superlatives` | wr (0.90) `ns.A2.writing.superlative_narrative` | sp (0.40) `ns.A2.speaking.superlative_narrative` |
| Q6 "Home or dining out" | sp (0.40) `ns.A2.speaking.comparison` | wr (0.90) `ns.A2.writing.comparative_response` | -- juz ma sp |
| Q7 "What advice" | gr (0.90) `ns.B1.modal_verbs.giving_advice` | wr (0.90) `ns.B1.writing.advice_structure` | sp (0.40) `ns.B1.speaking.giving_advice` |
| Q8 "How has your taste changed" | gr (0.90) `ns.B1.present_perfect` | wr (0.90) `ns.B1.writing.present_perfect_narrative` | sp (0.40) `ns.B1.speaking.present_perfect_narrative` |

**Zmiana**: Q4 i Q6 juz maja sp - dodac sp do Q1,Q2,Q3,Q5,Q7,Q8

### discussion (Discussion Questions)
Juz kompletne - kazde pytanie ma sp + wr. **BEZ ZMIAN**.

### listening-comprehension (Listening Comprehension)
Kazde pytanie ma 2 ns (li + wr). Dodac trzeci (speaking):

| Przyklad | Obecny ns1 | Obecny ns2 | Nowy ns3 |
|---|---|---|---|
| Q1 "Main topic" | li (0.95) `ns.B1.listening.main_idea_identification` | wr (0.90) `ns.B1.writing.summary_response` | sp (0.40) `ns.B1.speaking.summary_response` |
| Q2 "Who are speakers" | li (0.95) `ns.B1.listening.speaker_identification` | wr (0.88) `ns.B1.writing.descriptive_response` | sp (0.40) `ns.B1.speaking.descriptive_response` |
| Q3-Q10 | li (0.95) | wr (0.88-0.90) | sp (0.40) analogiczny do wr |

### answer-questions-audio (Answer Questions Audio)
Kazde pytanie ma 2 ns. Niektore juz maja sp. Dodac sp gdzie brakuje:

| Przyklad | Obecny ns1 | Obecny ns2 | Nowy ns3 |
|---|---|---|---|
| Q1 "Main situation" | li (0.95) | wr (0.90) | sp (0.40) `ns.B1.speaking.summary_response` |
| Q2 "Emotions" | li (0.95) | wr (0.88) | sp (0.40) `ns.B1.speaking.emotion_description` |
| Q3 "Specific words" | li (0.95) | wr (0.88) | sp (0.40) `ns.B1.speaking.detail_response` |
| Q4 "If you were" | sp (0.35) juz ma | wr (0.90) | -- juz ma sp |
| Q5 "Compare" | sp (0.35) juz ma | wr (0.90) | -- juz ma sp |
| Q6 "Cultural insights" | sp (0.35) juz ma | wr (0.88) | -- juz ma sp |
| Q7 "What happens after" | sp (0.35) juz ma | wr (0.90) | -- juz ma sp |
| Q8 "Advice" | gr (0.90) | wr (0.90) | sp (0.40) `ns.B1.speaking.giving_advice` |
| Q9 "Most important info" | li (0.95) | wr (0.88) | sp (0.40) `ns.B1.speaking.priority_identification` |
| Q10 "Relationship" | li (0.95) | wr (0.88) | sp (0.40) `ns.B1.speaking.relationship_description` |

### describe-picture (Describe Picture)
Juz kompletne - kazdy prompt ma sp + wr. **BEZ ZMIAN**.

### answer-questions-picture (Answer Questions Picture)
Kazde pytanie ma 2 ns. Niektore juz maja sp:

| Przyklad | Obecny ns1 | Obecny ns2 | Nowy ns3 |
|---|---|---|---|
| Q1 "Describe atmosphere" | sp (0.40) juz | wr (0.90) | -- juz ma sp |
| Q2 "What types of food" | vo (0.90) | wr (0.90) | sp (0.40) `ns.A2.speaking.food_identification` |
| Q3 "How many people" | sp (0.40) juz | wr (0.90) | -- juz ma sp |
| Q4 "Would you like" | sp (0.40) juz | wr (0.90) | -- juz ma sp |
| Q5 "Compare" | sp (0.40) juz | wr (0.90) | -- juz ma sp |
| Q6 "Service style" | sp (0.35) juz | wr (0.90) | -- juz ma sp |
| Q7 "What would you order" | sp (0.40) juz | wr (0.90) | -- juz ma sp |
| Q8 "What time" | sp (0.35) juz | wr (0.90) | -- juz ma sp |
| Q9 "Restaurants in country" | sp (0.35) juz | wr (0.90) | -- juz ma sp |
| Q10 "If you were manager" | gr (0.90) | wr (0.90) | sp (0.40) `ns.B2.speaking.conditional_response` |

### Zmiana w core-instructions.ts

W promptcie generowania cwiczen dodac instrukcje:
```text
For OPEN-ENDED exercise types (reading, dialogue, discussion, answer-questions, 
listening-comprehension, answer-questions-audio, describe-picture, answer-questions-picture), 
EVERY question/prompt MUST have exactly 3 nano_skills:
1. Primary skill (rd/li/vc/gr depending on exercise type)
2. Writing skill (wr) - always present
3. Speaking skill (sp) - with confidence 0.35-0.45 (indirect assessment via written text, 
   increases to 0.85-0.95 when student records audio)
```

---

## Problem 5.2: AI eval oceniajacy odpowiedni ns

### Logika w `useInteractiveHomework.tsx` i `useInteractiveSharedWorksheet.tsx`

Po otrzymaniu wynikow z `verify-open-answers` (ktory teraz zwraca `writing_score` i `speaking_score`):

```text
Scenariusz A (tylko tekst):
  - mastery dla ns z "wr" w nazwie = writing_score
  - mastery dla ns z "sp" w nazwie = POMIN (nie oceniaj, zostaw domyslny confidence)
  - mastery dla ns glownego (rd/li/vc/gr) = quality_score

Scenariusz B (tylko nagranie):
  - mastery dla ns z "sp" = speaking_score
  - mastery dla ns z "wr" = writing_score (oparta na transkrypcji)
  - mastery dla ns glownego = quality_score

Scenariusz C (oba):
  - mastery dla ns z "sp" = speaking_score
  - mastery dla ns z "wr" = writing_score
  - mastery dla ns glownego = quality_score
```

Zmiana w `masteryCalculator.ts` - funkcja `buildItemEvaluations`:
- Sprawdzic czy wynik AI ma `writing_score`/`speaking_score`
- Mapowac te oceny na odpowiednie nano_skill w tablicy

---

## Problem 6: Admin impersonacja ("Duch")

### Architektura

Supabase NIE pozwala na bezposrednie generowanie tokenu JWT dla innego uzytkownika przez SDK. Ale pozwala na `auth.admin.generateLink()` lub uzycie `supabase_admin.auth.admin.getUserById()`.

Bezpieczniejsza metoda: **Magic Link impersonacji**.

### Implementacja krok po kroku

**1. Tabela `user_roles` - juz istnieje** z typem `app_role` ('admin', 'moderator', 'user', 'teacher')

**2. Dodac role 'admin'** dla Twojego konta:
```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('4ee84131-4ac8-4931-86ee-e116234e7e1f', 'admin');
```

**3. Nowa edge function `admin-impersonate/index.ts`**:

```text
Wejscie: { target_teacher_id: uuid }
Walidacja:
  1. Sprawdz ze caller ma role 'admin' w user_roles
  2. Pobierz email target_teacher_id z profiles
  3. Uzyj supabaseAdmin.auth.admin.generateLink({ 
       type: 'magiclink', 
       email: targetEmail,
       options: { redirectTo: `${origin}/dashboard` }
     })
  4. Zwroc { impersonation_url: link.properties.action_link }
  
Zabezpieczenia:
  - TYLKO admin moze wywolac
  - Logowanie do tabeli admin_activity_log (kto, kiedy, czyje konto)
  - Magic link wygasa po 5 minutach
```

**4. Nowa tabela `admin_activity_log`**:
```sql
CREATE TABLE admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_teacher_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view logs" ON admin_activity_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

**5. Strona `/admin` (AdminDashboardPage.tsx)**:

```text
- Sprawdzenie roli admin na uzycie has_role()
- Lista nauczycieli z profiles: imie, email, subscription, total_worksheets, ostatni login
- Statystyki: ile worksheetow, ile studentow, ile homework
- Przycisk "Login as..." przy kazdym nauczycielu
- Po kliknieciu: wywoluje admin-impersonate, otwiera zwrocony URL w nowej karcie
```

**6. Zabezpieczenie przed przypadkowymi zmianami**:

Problem: Po zalogowaniu magic linkiem jestes w pelni zalogowany jako ten nauczyciel.

Rozwiazanie: **Read-only banner**
- W `App.tsx` lub globalnym layout, sprawdzaj `localStorage.getItem('admin_impersonation')`
- Edge function ustawia ten flag przez redirectTo z parametrem `?admin_view=true`
- Jesli flag jest aktywny: pokazuj CZERWONY banner "ADMIN VIEW - [Teacher Name]" na gorze
- Banner ma przycisk "Exit" ktory wylogowuje i wraca do /admin
- UWAGA: to NIE blokuje zmian - jest to tylko wizualne ostrzezenie

**Alternatywa bezpieczniejsza**: Zamiast magic link, uzyc osobnej sesji przegladarki (incognito) do podgladu. Admin dashboard generuje link, admin otwiera go w incognito -> nie koliduje z wlasna sesja.

### Pliki do stworzenia/zmiany

| Plik | Typ | Opis |
|---|---|---|
| `supabase/functions/admin-impersonate/index.ts` | NOWY | Edge function generujaca magic link |
| `src/pages/AdminDashboardPage.tsx` | NOWY | Strona admina z lista nauczycieli |
| `src/App.tsx` | ZMIANA | Dodanie route /admin |
| SQL migration | NOWY | Tabela admin_activity_log + INSERT admin role |
| `src/components/AdminImpersonationBanner.tsx` | NOWY | Czerwony banner ostrzegawczy |

---

## Kolejnosc implementacji

### Faza 1 (natychmiastowa - krytyczne bugi):
1. Problem 1: Naprawa webhook + backfill tokenow (SQL migration)
2. Problem 2: Duplikat check w webhook
3. Problem 3.1: Fix Discussion i inne onNanoSkillChange w ExerciseSection
4. Problem 3.2: Badge labels gr/vo w NanoSkillBadge

### Faza 2 (nastepna iteracja):
5. Problem 4: HomeworkSpeakingRecorder + transkrypcja + verify-open-answers rozszerzenie
6. Problem 5.1: Aktualizacja template'ow nano skills (dodanie sp do 6 typow cwiczen)
7. Problem 5.2: Mapowanie writing_score/speaking_score na nano_skill mastery

### Faza 3:
8. Problem 6: Admin impersonacja + dashboard

## Pliki do zmiany - pelne podsumowanie

| Plik | Faza | Zmiana |
|---|---|---|
| `supabase/functions/stripe-webhook/index.ts` | 1 | Renewal detection + add_tokens + duplikat check |
| SQL migration (backfill) | 1 | Dodanie zalegych tokenow + admin role |
| `src/components/worksheet/NanoSkillBadge.tsx` | 1 | Dodac 'gr' i 'vo' do getBadgeLabel |
| `src/components/worksheet/ExerciseSection.tsx` | 1 | Fix Discussion + inne onNanoSkillChange z updateNanoSkillValue |
| Nowy: `src/components/homework/HomeworkSpeakingRecorder.tsx` | 2 | Komponent nagrywania |
| `src/hooks/useInteractiveHomework.tsx` | 2 | Obsluga audio + transkrypcja przed AI eval |
| `src/hooks/useInteractiveSharedWorksheet.tsx` | 2 | Analogicznie |
| `supabase/functions/verify-open-answers/index.ts` | 2 | Rozszerzony prompt + writing_score/speaking_score |
| `src/utils/masteryCalculator.ts` | 2 | Mapowanie score'ow na nano_skill |
| `supabase/functions/generateWorksheet/prompts/individual-exercises.ts` | 2 | Dodanie sp nano_skill do 6 typow |
| `supabase/functions/generateWorksheet/prompts/core-instructions.ts` | 2 | Instrukcja 3 nano_skills |
| 8 komponentow cwiczen (Reading, Dialogue, AQ, Discussion, LC, AQ-Audio, Describe, AQ-Picture) | 2 | Dodanie HomeworkSpeakingRecorder |
| Nowy: `supabase/functions/admin-impersonate/index.ts` | 3 | Edge function impersonacji |
| Nowy: `src/pages/AdminDashboardPage.tsx` | 3 | Strona admina |
| Nowy: `src/components/AdminImpersonationBanner.tsx` | 3 | Banner ostrzegawczy |
| `src/App.tsx` | 3 | Route /admin |
| SQL migration | 3 | admin_activity_log + admin role |
| Dokumentacja (6 plikow) | Kazda faza | Aktualizacja |

