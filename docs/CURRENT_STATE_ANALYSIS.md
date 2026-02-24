
# Current State Analysis - MVP+ (After Exercise Management Implementation)

## Przegląd Aplikacji

**Nazwa:** English Worksheet Generator  
**Cel:** Tworzenie edytowalnych worksheetów dla nauczycieli angielskiego uczących dorosłych 1 na 1  
**Status:** MVP+ - Dodane zaawansowane zarządzanie zadaniami (Exercise Management)  
**Ostatnia naprawa (2026-02-24) - Welcome Test Learning Path Score:**
- ✅ **5 nowych pytań behawioralnych**: Q3b (usage_context), Q5b (deadline_response), Q13b (persistence_level), Q17b (career_english_importance), Q41b (learning_timeline)
- ✅ **Algorytm Learning Path Score**: 15 ważonych sygnałów (5 nowych + 10 istniejących), 5 reguł nadrzędnych, wynik 0-100 → 4 ścieżki (comfort/guided/accelerated/target)
- ✅ **LearningPathResult type**: Nowy interfejs z component_scores i overrides_applied
- ✅ **Zapis w raw_answers.learning_path**: Deterministyczne obliczanie w process-welcome-test edge function

**Poprzednia naprawa (2026-02-23) - DSLM Fixes + Speaking UX + Cleanup:**
- ✅ **NanoSkillBadge labels**: getBadgeLabel() rozpoznaje 30+ tematów gramatycznych (present_simple, comparatives, superlatives itp.) - wyświetla `gr`/`vo` zamiast `ns`
- ✅ **Discussion speaking**: Dodano HomeworkSpeakingRecorder do zadań Discussion w homework/shared worksheet
- ✅ **Minimalistyczny recorder**: UI przebudowany na inline flex - brak ramek, brak animacji waveform, jednoliniowe kontrolki
- ✅ **Dynamiczny confidence**: Nowa funkcja adjustConfidenceByAnswerType() - speaking 0.90 z audio / 0.30 z tekstu, writing 0.90 z tekstu / 0.70 z audio
- ✅ **Czyszczenie anonimowych kont**: Usunięto signInAnonymously z hooków, Edge Function cleanup-anonymous-users do usuwania ~1469 pustych kont
- ✅ **Admin impersonacja**: Panel admina `/admin`, Magic Link przez `admin-impersonate`, logi w `admin_activity_log`

**Poprzednia naprawa (2026-02-21) - DSLM Layer B v5 Phase 2:**
- ✅ **Flashcard nano_skill**: Trigger generuje `ns.[CEFR].vocabulary.definition_[word]` zamiast `flashcard:UUID`. CEFR z poziomu studenta
- ✅ **back_type modifier**: Translation = 0.85x mastery (łatwiejsze), Definition = 1.0x (pełne mastery)
- ✅ **Backfill flashcard metrics**: Wszystkie `flashcard:UUID` zmigowane do nowego formatu z mergowaniem duplikatów
- ✅ **Period filter fix**: Filtr okresu widoczny ZAWSZE, nawet gdy brak danych - komunikat kontekstowy
- ✅ **CEFR level filter**: Przyciski A1-C2 do filtrowania umiejętności po poziomie CEFR
- ✅ **Student switcher**: Klikalna ikona studenta z popoverem i listą studentów do szybkiej nawigacji
- ✅ **visual_comprehension**: Dodana do CATEGORY_ORDER i CATEGORY_LABELS

**Poprzednia naprawa (2026-02-21) - DSLM Layer B v5:**
- ✅ **Dual nano_skill**: Zadania otwarte mają 2 nano_skills (primary + writing). Speaking confidence obniżony (0.35-0.45) bo ocena pośrednia
- ✅ **CEFR w nano_skill**: Nowy format `ns.[CEFR].[topic].[skill_name]` z pełnymi nazwami (past_simple zamiast ps)
- ✅ **visual_comprehension**: Nowa kategoria dla zadań z obrazkami (zamiast reading)
- ✅ **extract_micro_skill()**: Obsługuje 3 formaty (CEFR, stare skróty, legacy) z backward compatibility
- ✅ **extract_skill_category()**: 8 kategorii + visual_comprehension
- ✅ **NanoSkillBadge**: Wyświetla dual badges z etykietami kategorii (rd, wr, sp, li, vc)
- ✅ **masteryCalculator**: buildItemEvaluations iteruje po WSZYSTKICH nano_skills per item

**Poprzednia naprawa (2026-02-20) - DSLM Layer B Implementation:**
- ✅ **student_skill_metrics tabela**: Zagregowane metryki per nano_skill per student z ważoną średnią mastery (exp decay)
- ✅ **Auto-refresh trigger**: Metryki odświeżają się automatycznie po każdym nowym evencie w student_events
- ✅ **extract_skill_category()**: Mapuje 20+ prefiksów ns.* na 7 kategorii
- ✅ **SkillsOverviewPanel**: Nowa zakładka "Skills" w StudentPage z radar chart
- ✅ **Backfill**: 859 metryk obliczonych z istniejących danych

**Poprzednia naprawa (2026-02-20) - DSLM Layer A Finalization Round 12:**
- ✅ **Layer A GOTOWA**: Wszystkie źródła mają kompletne mastery i element_type

**Poprzednia naprawa (2026-02-19) - DSLM Layer A Cleanup Round 11:**
- ✅ **Czyszczenie danych**: Usunięto ~500 śmieciowych eventów welcome_test (NULL answer_id) i 20 legacy event_source='test'
- ✅ **Flashcard backfill**: Naprawiono 55 starych eventów z zawyżonym mastery=100 (repetition=1 → teraz 50)
- ✅ **Auto-obliczanie mastery w triggerach**: Triggery worksheet/homework automatycznie liczą mastery ze średniej nano_skill_ratings gdy NEW.mastery IS NULL
- ✅ **Backfill mastery**: Zaktualizowano ~194 istniejących eventów worksheet/homework z NULL mastery

**Poprzednia naprawa (2026-02-19) - Welcome Test v2 Round 10:**
- ✅ **Fix cache transkrypcji**: process-welcome-test pobiera ŚWIEŻE question_data z bazy przed zapisem ai_score (nie nadpisuje transcription)
- ✅ **Zaostrzony prompt AI**: Szczegółowe kryteria oceny z analizą word count, czasu, relevance. Krótkie/off-topic speaking = max 20-30pkt
- ✅ **Kontekst czasowy dla AI**: Word count i time_spent_seconds przekazywane do AI dla oceny fluency

**Poprzednia naprawa (2026-02-19) - Welcome Test v2 Round 9:**
- ✅ **Automatyczna transkrypcja**: process-welcome-test zapisuje transkrypcje do question_data.transcription — nauczyciel widzi je automatycznie
- ✅ **Usunięto przycisk Transcribe**: TestDetailsView ładuje transkrypcje z question_data, bez ręcznego klikania
- ✅ **AI scoring per-question (0-100)**: Każda odpowiedź otwarta/mówiona oceniana indywidualnie; is_correct ustawiany na score ≥ 40
- ✅ **Speaking score**: Nowa kolumna speaking_score w student_learning_profiles, obliczana z AI scores
- ✅ **Writing score AI**: writing_score obliczany z AI per-question scores zamiast binarnego is_correct
- ✅ **Communication → Speaking**: Zamieniono w Skill Scores UI
- ✅ **Event payload mastery fix**: nano_skill_ratings mastery w event_payload aktualizowany z wartością AI (nie -1)
- ✅ **Trigger fix**: log_test_answer_event pomija welcome testy (zapobiega duplikatom event_source='test')
- ✅ **Czyszczenie duplikatów**: Usunięto eventy event_source='test' dla welcome testów
- ✅ **Timer precision**: visibilitychange listener pauzuje timer przy nieaktywnej karcie
- ✅ **Przeliczenie wyników**: calculate_test_results wywoływany po AI scoring

**Poprzednia naprawa (2026-02-17) - Welcome Test v2 Round 4:**
- ✅ **SpeakingRecorder race condition**: Scalono efekty auto-save i reset w jeden useEffect — blob nie jest kasowany przed uploadem
- ✅ **Skip question biały ekran**: Dodano zależności do skipQuestion callback (flushPendingAnswer, goToNext)
- ✅ **Teacher preview version guard**: setTestVersion nie zapisuje wersji dla nauczyciela (localStorage/DB)
- ✅ **Share link URL**: ShareTestModal generuje prawidłowy /welcome-test/ URL dla welcome testów
- ✅ **Quick Version results**: TestDetailsView filtruje pytania spoza WELCOME_TEST_SHORT_QUESTION_IDS
- ✅ **Tłumaczenie domyślnie OFF**: Usunięto auto-set translationLang — aktywacja tylko po kliknięciu przycisku
- ✅ **AI Analysis test_version**: process-welcome-test otrzymuje i uwzględnia test_version w promcie AI

**Poprzednia naprawa (2026-02-16) - DSLM Layer A Audit:**
- ✅ **Event naming**: Znormalizowano wszystkie event_type/event_source do kanonicznych nazw
- ✅ **Flashcard mastery**: Zmieniono z binarnego 0/100 na weighted scale (0→50→70→90→100)
- ✅ **Mastery column**: Trigger flashcard teraz zapisuje `student_events.mastery`
- ✅ **Welcome test cleanup**: Usunięto bloat z 146 do 14 eventów section_progress
- ✅ **TypeScript types**: Przepisano events.ts z kanonicznymi typami
- ✅ **EventLogPanel**: Dodano welcome_test do ikon i kolorów

**Poprzednia naprawa (2026-02-16) - Welcome Test v2 Round 3:**
- ✅ **SpeakingRecorder auto-save**: Auto-upload nagrania do R2 przy nawigacji do następnego pytania (questionId prop)
- ✅ **Odtwarzanie audio nauczyciel**: Rozpoznawanie R2 URL w TestDetailsView, audio player dla speaking answers
- ✅ **Transkrypcja Whisper**: Przepisana edge function transcribe-audio na OpenAI Whisper API
- ✅ **TTS audio fix**: Chunked base64 conversion (8KB) w generate-welcome-test-audio
- ✅ **Q21 re-generated**: Nowe audio TTS-1 z dokładnym dialogiem kawiarni
- ✅ **AI Analysis + speaking**: process-welcome-test transkrybuje odpowiedzi mówione przed analizą AI
- ✅ **Event dedup**: sectionKey zmieniony na sectionId (jeden event per sekcja)
- ✅ **Re-take zachowuje wyniki**: Usunięto soft-delete starego testu
- ✅ **Przycisk Translate**: Auto-dobieranie języka z profilu studenta
- ✅ **Pełne tłumaczenia**: Wszystkie 10 języków z pełnym pokryciem pytań
- ✅ **Blur modal**: Więcej pytań w tle (4), wyższa opacity (0.50)
- ✅ **Auth redirect**: StudentPage przekierowuje niezalogowanych na login z return URL

**Poprzednia naprawa (2026-02-15) - Welcome Test v2 Round 2:**
- ✅ **SpeakingRecorder**: Detekcja mimeType (webm/mp4/fallback), fix stale closure via statusRef, większy przycisk mobile
- ✅ **Event logging**: Debounced commitAnswer — eventy tylko na blur/nawigację, nie na każdy keystroke
- ✅ **Score calculation**: Osobne wyświetlanie skill questions vs profiling questions
- ✅ **Cross-device resume**: Pozycja na podstawie pierwszego nieodpowiedzianego pytania z DB
- ✅ **Server-side traits**: process-welcome-test rekonstruuje cechy z odpowiedzi DB (nie z frontendu)
- ✅ **Teacher email**: Klikalne "View Results" w mailu po ukończeniu testu
- ✅ **Teacher access**: Blokada odpowiadania przez nauczyciela na linku studenta
- ✅ **Teacher notes**: Notatki per-question w TestDetailsView (question_data.teacher_note)
- ✅ **Re-take**: Przycisk tworzący nowy test, archiwizujący stary
- ✅ **Auto-translation**: native_language z profilu studenta auto-wybiera język tłumaczenia
- ✅ **10 języków tłumaczeń**: PL, ES, DE, FR, PT, IT, TR, RU, CS, UK
- ✅ **Mobile progress**: Compact progress bar zamiast 49 kropek na mobile
- ✅ **Tab navigation**: StudentPage syncs activeTab z URL searchParams
- ✅ **Edge functions**: generate-welcome-test-audio (TTS→R2), transcribe-audio (STT)

**Poprzednia naprawa (2026-02-14) - Welcome Test v2 Bug Fixes:**
- ✅ **DB Migration**: Rozszerzono CHECK constraint na `question_type` (7 nowych typów), `homework_id` nullable, `welcome_test_completed` notification type
- ✅ **Email sender**: "Worksheet Generator" → "EDOOQOO"
- ✅ **ListeningPlayer**: Usunięto duplikat transkrypcji, zmieniono tekst przycisku, auto-show gdy brak audio
- ✅ **SpeakingRecorder**: Auto-zapis nagrania przy nawigacji (fire-and-forget upload)
- ✅ **Q26/Q27**: Usunięto podpowiedzi odpowiedzi z opisów
- ✅ **Email modal**: Prawdziwe rozmyte tło zamiast szarych prostokątów
- ✅ **Globe/Translation**: Widoczny przycisk z etykietą "Translate"
- ✅ **Notifications**: Osobne queries zamiast JOIN (nullable homework_id), tytuł "Notifications"
- ✅ **Welcome Test placeholder**: Karta preview z sekcjami/pytaniami w zakładce Tests (przed utworzeniem testu)
- ✅ **0/49 refresh fix**: Persisted `answered_count` w DB + Math.max()
- ✅ **Pause on refresh**: Automatyczna pauza przy powrocie do testu z odpowiedziami
- ✅ **Events dedup**: Per-section zamiast per-question, event_source='welcome_test'

**Ostatnia naprawa (2026-02-12):**
- ✅ **P1 - Ujednolicenie UI Homework/Shared Worksheet**: Białe tło na obu, max-w-6xl na homework, label "SHARED WORKSHEET" (fioletowy) i "HOMEWORK" (pomarańczowy), przycisk Start na homework (jak Study na shared), oficjalne nazwy ćwiczeń w homework (getOfficialExerciseName)
- ✅ **P2 - Teacher's Tip pod poleceniem**: Przeniesiony z dołu ćwiczenia tuż pod instrukcjami (ExerciseContent) w ExerciseSection.tsx
- ✅ **P3 - MC-picture shuffle fix**: Homework przekazuje `source_worksheet_id` zamiast `homework.id` do komponentów → identyczny seed shuffle co worksheet
- ✅ **P4 - Fill in Blanks Audio Live Session**: Dodano prop `liveSessionAnswer` i wyświetlanie `[Student: ...]` w niebieskim kolorze
- ✅ **P5 - AI Eval badge margin**: Zmniejszono `space-y-2` → `space-y-1`, dodano `m-0` na paragrafie feedbacku
- ✅ **P6 - Error Correction homework feedback**: Dodano `showCorrectAnswers` z kolorystyką zielona/czerwona po submit
- ✅ **P6b - Listening/Paraphrasing element order**: AI badge przeniesiony POD suggested answer + student answer

**Naprawa (2026-02-11 v2):**

**Naprawa (2026-02-11 v1):**
- ✅ **P1 - NAPRAWIONO Live Session AI Eval visibility**: Dodano polling co 15s w `useLiveSessionAnswers` → nauczyciel widzi AI feedback dla WSZYSTKICH typów open-ended (describe-picture, answer-questions, listening-comprehension, dialogue, paraphrasing)
- ✅ **P2 - NAPRAWIONO puste nano_skill_ratings**: Przeniesiono `gap-text`, `word-order`, `error-correction` do CLOSED_EXERCISE_TYPES w `masteryCalculator.ts`. Dodano handlery calculateItemMastery. Naprawiono matching (porównanie z `definition`)
- ✅ **P3 - WZMOCNIONO AI eval prompt**: Server-side non-answer detection w `verify-open-answers` wymusza score 0.0 dla "nie wiem" niezależnie od AI. Bardziej wymagający scoring
- ✅ **P4 - NAPRAWIONO media hints True/False**: Nowy prop `exerciseVariant` w ExerciseTrueFalseAudio - audio/picture/plain. Poprawne komunikaty dla każdego wariantu
- ✅ **P5 - NAPRAWIONO progress counting**: Dodano `sentence_halves`, `expressions`, `prompts` do exerciseQuestionCounts. Cap na 100% w obu hookach
- ✅ **P6 - ZACHOWANO opisy AI w tytułach**: Format `Exercise N: Official Type: AI Description` w 3 miejscach (edge function streaming/non-streaming + exerciseProcessor). SharedWorksheet też przetwarza tytuły

**Naprawa (2026-02-10):**
- ✅ **NAPRAWIONO mastery=50 overwrite**: `masteryCalculator.ts` - open-ended bez AI eval teraz `mastery: -1, hasValue: false` zamiast `mastery: 50, hasValue: true` → nie nadpisuje prawdziwych AI evaluations w bazie
- ✅ **NAPRAWIONO auto-save overwrite**: `useInteractiveSharedWorksheet` wysyła `null` dla `p_item_evaluations` gdy brak prawdziwych AI eval → SQL COALESCE zachowuje istniejące dane
- ✅ **NAPRAWIONO AI badge w Live Session**: `convertLiveEvalsToAiEvals` filtruje `hasValue: false` → badge nie pojawia się z fałszywym 50%
- ✅ **DODANO AiEvaluationBadge do Discussion**: Zarówno w ExerciseSection (Live Session) jak i SharedWorksheetContent (Shared Worksheet)
- ✅ **DODANO loading modal Create Homework**: Spinner "Analyzing student progress..." podczas AI eval przed otwarciem modalu homework

**Naprawa (2026-02-09 v2):**
- ✅ **NAPRAWIONO event_payload spójność**: SQL triggery `log_worksheet_answer_to_events` i `log_homework_answer_to_events` teraz stripują `feedback` z `nano_skill_ratings` (`elem - 'feedback'`) → identyczna struktura w homework i worksheet
- ✅ **NAPRAWIONO re-render loop**: `useLiveSessionAnswers` nie wywołuje `processPendingAiEvals` w pętli - tylko RAZ na mount z `hasProcessedRef`
- ✅ **DODANO liveItemEvaluations w Live Session**: Nauczyciel widzi AI feedback badges w trybie Live Session (pipeline: WorksheetDisplay → WorksheetContent → ExerciseSection → exercise components)
- ✅ **DODANO aiEvaluations do ExerciseSentenceTransformation**: Ostatni open-ended komponent bez tego propa
- ✅ **DODANO polling 30s**: `useInteractiveSharedWorksheet` odpytuje bazę co 30s o nowe `item_evaluations` → student widzi feedback bez odświeżania
- ✅ **DODANO Realtime refetch**: `useLiveSessionAnswers` po UPDATE Realtime pobiera pełne dane z `item_evaluations`

**Poprzednia naprawa (2026-02):**
- ✅ **NAPRAWIONO prompt AI**: `verify-open-answers` karze za non-answers ("I don't know") → quality_score 0.0-0.1
- ✅ **DODANO feedback AI na Shared Worksheet**: `item_evaluations` ładowane z bazy, badge AI wyświetlany pod pytaniami
- ✅ **NAPRAWIONO config.toml**: `process-pending-ai-evaluations` → `verify_jwt = false`
- ✅ **Scenariusze AI Evaluation**: `student_learning_activity`, `10min_AI_evaluation`, `create_hw_AI_evaluation`, `submit_hw_AI_evaluation`, `mark_done_evaluation`

**Poprzednia naprawa (2026-02):**
- ✅ **NAPRAWIONO P5 MC Audio Shuffle**: Dodano `worksheetId` do ExerciseMultipleChoiceAudio w SharedWorksheetContent - ta sama kolejność A,B,C,D w obu widokach
- ✅ **NAPRAWIONO P3 NanoSkill Tooltip**: Zamieniono TooltipPrimitive na standardowy shadcn/ui Tooltip - pokazuje się natychmiast przy badge i znika od razu
- ✅ **NAPRAWIONO P4 AI Evaluation Per-Question**: Każde pytanie otwarte wysyłane osobno do AI, evaluation wyświetlane per-question z etykietami "Question X:"
- ✅ **NAPRAWIONO P1/P2 Mastery Calculation**: Nowa funkcja `calculateClosedExerciseMastery()` oblicza 0-100% dla 14 zamkniętych typów ćwiczeń automatycznie
- ✅ **NAPRAWIONO Logowanie Eventów SQL**: Triggery worksheet/homework używają DELETE+INSERT zamiast ON CONFLICT
- ✅ **NAPRAWIONO Multiple Choice Audio Live Session**: Porównanie odpowiedzi teraz używa `option.text` zamiast `oIndex`
- ✅ **DODANO Animowane etykiety Pin**: Przyciski "Pin audio player" i "Pin image" mają teraz eleganckie animowane etykiety (5 sekund)
- ✅ **NAPRAWIONO Mark Done Modal**: Slider nie resetuje się już do 70%, dodano przycisk Skip, poprawiono zapisywanie do `student_events`
- ✅ **DODANO Undo Mark Done**: Kliknięcie "Done" na oznaczonym zadaniu otwiera modal potwierdzenia z opcją usunięcia oceny z bazy
- ✅ **NAPRAWIONO Tytuł Worksheet**: WorksheetHeader wyświetla teraz rzeczywisty tytuł worksheet zamiast "Your Generated Worksheet"
- ✅ **NAPRAWIONO Pozycję Rename**: Ikona ołówka jest teraz obok tytułu w zakładce worksheets na stronie studenta
- ✅ **DODANO Rename na Dashboard**: Ikona ołówka i dialog rename dodane do Recent Worksheets na `/dashboard`
- ✅ **DODANO Live Session Notes**: Dwa nowe panele w trybie Live Session:
  - `LiveSessionQuickNotes`: Szybkie notatki z kategoriami (Personal, To Practice, Notes, Next Lesson Ideas)
  - `DraftTeacherNotes`: Lokalne notatki nauczyciela zapisywane w localStorage
- ✅ **DODANO Moduł Intelligent Tests**: Nowa 7. zakładka "Tests" na stronie studenta - AI generuje testy na podstawie danych ucznia
  - Tabele: `student_tests`, `student_test_questions`, `test_skill_results`
  - Edge function: `generate-test` używa GPT-4o-mini do generowania pytań
  - Typy testów: Placement, Progress Check, Skill Verification, Goal Achievement
  - Integracja z Progress (aktualizacja ratingów), Knowledge Base (słabości), Flashcards (słownictwo)
- ✅ **NAPRAWIONO Biała strona Flashcards (v2)**: Warunek `editingSetId` sprawdzany jest teraz dopiero PO załadowaniu danych
- ✅ **NAPRAWIONO Generate New Worksheet Button**: Przycisk na wygenerowanym worksheet działa poprawnie
- ✅ **NAPRAWIONO Live Session Flow**: Odpowiedzi studentów poprawnie przekazywane z niebieskim podświetleniem inline

## Wygląd i Interface

### Główna Strona Formularza
- **Design:** Nowoczesny, minimalistyczny interfejs z gradientowymi kolorami (różowy → fioletowy → niebieski)
- **Layout:** Responsywny design dostosowany do desktopów, tabletów i telefonów
- **Kolorystyka:** Główny kolor to worksheet-purple (#8B5FBF), z jasnymi tłami i delikatną kolorystyką

### Elementy Formularza
1. **Nagłówek:** "Create A Worksheet" z podtytułem "Tailored to your students. In seconds."
2. **Selektory czasu:** 45 min / 60 min (przyciski toggle)
3. **Poziomy CEFR:** A1/A2, B1/B2, C1/C2 z opisami
4. **Pola formularza:**
   - Lesson topic: General theme or real‑life scenario (wymagane)
   - Lesson focus: What should your student achieve by the end of the lesson? (wymagane)
   - Additional Information: Extra context & personal or situational details (wymagane)
   - Grammar focus (optional)
5. **Kafelki podpowiedzi:** 2 zestawy sugestii pod każdym polem
6. **Hint:** Wskazówka o konieczności podania szczegółów
7. **Przyciski:** Refresh Suggestions, Generate Custom Worksheet

## Funkcjonalność

### System Placeholderów
- **5 zestawów przykładów:** Rozmowa kwalifikacyjna, Podróż z dzieckiem, Integracja w pracy, Spotkanie z nauczycielem, Reklamacja zamówienia
- **Losowy wybór:** Przy każdym załadowaniu strony losowo wybierany jest jeden zestaw dla wszystkich pól

### System Sugestii (Kafelki)
- **30 różnych zestawów:** Od rozmowy kwalifikacyjnej po wywiady dla gazety szkolnej
- **Logika wyświetlania:** 
  - Pierwsza wizyta: 1 zestaw pasujący do placeholdera + 1 losowy
  - Po "Refresh": 2 losowe zestawy
- **Interaktywność:** Kliknięcie kafelka wstawia tekst do pola

### Generowanie Worksheetów
- **Modal z paskiem postępu:** Animowany pasek z 13 krokami generowania
- **Timer rzeczywisty:** Pokazuje faktyczny czas generowania (do 1:30 min)
- **Integracja z AI:** Wykorzystuje Supabase Edge Functions z OpenAI

### Wyświetlanie Worksheetów
- **Struktura:** Nagłówek z parametrami → Sekcje ćwiczeń → Sekcja nauczyciela
- **Typy ćwiczeń:**
  - Reading Comprehension (czytanie ze zrozumieniem)
  - Vocabulary (słownictwo)
  - Grammar (gramatyka - fill-in-blanks)
  - Multiple Choice (pytania wielokrotnego wyboru)
  - Dialogue/Role-play (dialogi)
  - Matching (dopasowywanie)
- **Edytowalność:** Wszystkie teksty można edytować in-place

### ✨ NOWE: Zaawansowane Zarządzanie Zadaniami
- **Zmiana kolejności:** Przyciski ↑/↓ w nagłówku każdego zadania do przesuwania w górę/dół
- **Soft Delete:** Przycisk kosza do bezpiecznego usuwania zadań z możliwością przywrócenia
- **Sekcja usuniętych:** Rozwijana sekcja "Deleted Exercises" na dole strony
- **Natychmiastowe zapisy:** Wszystkie zmiany są automatycznie zapisywane w bazie danych
- **Inteligentne przyciski:** Strzałki wyłączane dla pierwszego/ostatniego elementu
- **Visual feedback:** Toast notyfikacje o pomyślnych operacjach
- **Przywracanie:** Każde usunięte zadanie można przywrócić jednym kliknięciem
- **Widoczność w trybie edycji:** Wszystkie funkcje zarządzania dostępne tylko podczas edytowania

### System Płatności
- **Darmowy podgląd:** Pełne przeglądanie worksheetów
- **Płatne pobieranie:** $1 USD za nielimitowane pobieranie w sesji
- **Integracja Stripe:** Bezpieczne płatności przez Stripe Checkout
- **Formaty eksportu:** HTML dla studentów i nauczycieli

## Architektura Techniczna

### Frontend
- **Framework:** React 18 z TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS z Shadcn/UI komponentami
- **State Management:** React hooks (useState, useEffect)
- **Routing:** React Router DOM

### Backend & Serwisy
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth (anonimowe sesje)
- **API:** Supabase Edge Functions (Deno)
- **AI Integration:** OpenAI GPT dla generowania treści
- **Payments:** Stripe Checkout
- **Hosting:** Lovable platform

### Kluczowe Hooki
- `useAnonymousAuth`: Zarządzanie anonimowymi sesjami użytkowników
- `useWorksheetState`: Stan worksheetów i ich zarządzanie
- `useWorksheetGeneration`: Logika generowania worksheetów
- `useExerciseRegeneration`: Regenerowanie pojedynczych zadań
- `useIsMobile`: Detekcja urządzeń mobilnych

### Struktura Danych
```typescript
interface FormData {
  lessonTime: "45 min" | "60 min";
  lessonTopic: string;
  lessonGoal: string;
  teachingPreferences: string; // Grammar focus
  additionalInformation: string;
  englishLevel: "A1/A2" | "B1/B2" | "C1/C2";
}

interface Exercise {
  type: string;
  title: string;
  icon: string;
  time: number;
  instructions: string;
  // Soft delete support
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}
```

## Bezpieczeństwo

### Rate Limiting
- **Ograniczenia API:** Maksymalnie 3 requesty na 5 minut z tego samego IP
- **Ochrona przed spamem:** Integracja z systemem trackingu zdarzeń

### Walidacja Danych
- **Input sanitization:** Wszystkie dane wejściowe są walidowane
- **SQL Injection protection:** Supabase RLS (Row Level Security)
- **XSS protection:** React automatyczne escapowanie

## Performance

### Optymalizacje
- **Lazy loading:** Komponenty ładowane na żądanie
- **Memoization:** React.memo dla komponentów
- **Bundle splitting:** Vite automatyczne dzielenie kodu
- **Caching:** Supabase automatyczne cachowanie

### Metryki
- **Czas generowania:** 30-90 sekund (w zależności od złożoności)
- **Rozmiar bundle:** Zoptymalizowany przez Vite
- **Responsywność:** < 100ms dla interakcji UI

## Integracje Zewnętrzne

### OpenAI
- **Model:** GPT-4 dla generowania treści worksheetów
- **Prompt Engineering:** Zaawansowane prompty dla edukacyjnych treści
- **Token Management:** Optymalizacja kosztów API

### Stripe
- **Checkout Sessions:** Jednorazowe płatności $1 USD
- **Webhook Handling:** Weryfikacja płatności przez Edge Functions
- **Security:** PCI DSS compliance przez Stripe

### Supabase
- **Real-time:** Monitoring sesji użytkowników
- **Storage:** Przechowywanie metadanych worksheetów
- **Analytics:** Tracking generacji i feedbacku

## Monitoring i Analytics

### Event Tracking
- **User Journey:** Tracking kroków użytkownika
- **Generation Metrics:** Czas i sukces generowania
- **Error Logging:** Automatyczne raportowanie błędów

### Feedback System
- **Rating:** 1-5 gwiazdek dla worksheetów
- **Comments:** Opcjonalne komentarze użytkowników
- **Database Storage:** Wszystkie feedback w Supabase

## Ograniczenia MVP

### Funkcjonalne
- **Brak kont użytkowników:** Tylko sesje anonimowe
- **Brak historii:** Worksheety nie są zapisywane długoterminowo
- **Jeden format eksportu:** Tylko HTML (brak PDF/DOCX)
- **Brak współdzielenia:** Nie można udostępniać worksheetów

### Techniczne
- **Brak offline mode:** Wymaga połączenia internetowego
- **Brak PWA:** Nie działa jako aplikacja mobilna
- **Ograniczone AI prompts:** Jeden zestaw promptów

## Możliwości Rozwoju

### Krótkoterminowe (1-3 miesiące)
1. **System kont użytkowników** z historią worksheetów
2. **Więcej formatów eksportu** (PDF, DOCX)
3. **Galeria szablonów** z gotowymi worksheetami
4. **Zaawansowane filtry** i wyszukiwanie

### Średnioterminowe (3-6 miesięcy)
1. **Classroom Management** - zarządzanie grupami studentów
2. **Collaborative Worksheets** - praca zespołowa
3. **Progress Tracking** - śledzenie postępów
4. **Mobile App** - natywne aplikacje

### Długoterminowe (6+ miesięcy)
1. **AI Tutor** - interaktywne nauczanie
2. **Video Integration** - worksheety z materiałami wideo
3. **Marketplace** - sprzedaż worksheetów przez nauczycieli
4. **White-label Solutions** - wersje dla szkół

## Kluczowe Metryki Biznesowe

### Obecnie Śledzone
- **Conversion Rate:** Ilość generacji → płatności
- **User Engagement:** Czas spędzony w aplikacji
- **Quality Score:** Średnie oceny worksheetów
- **Technical Performance:** Czas odpowiedzi API

### Planowane do Dodania
- **Retention Rate:** Powracający użytkownicy
- **Monthly Active Users:** Aktywni użytkownicy miesięczni
- **Revenue per User:** Przychód na użytkownika
- **Teacher Satisfaction:** NPS score

## Wnioski

MVP aplikacji stanowi solidną podstawę do rozwoju platformy dla nauczycieli angielskiego. Kluczowe elementy jak AI-generowanie treści, system płatności i responsywny design działają poprawnie. Aplikacja jest gotowa do testów z prawdziwymi użytkownikami i iteracyjnego rozwoju opartego na ich feedbacku.

Następne kroki powinny skupić się na:
1. Zbieraniu feedbacku od nauczycieli
2. Optymalizacji conversion rate
3. Dodaniu podstawowych funkcji użytkowników (konta, historia)
4. Rozszerzeniu formatów eksportu

Stan techniczny aplikacji pozwala na szybkie iteracje i dodawanie nowych funkcji bez konieczności refaktoringu architektury.
