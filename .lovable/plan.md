
Cel: usunąć root-cause, przez który event `response_type: "audio"` ma `nano_skill_ratings: []`, bez naruszenia działających ścieżek written/homework.

1) Co faktycznie jest zepsute (potwierdzone logami i kodem)
- `process-pending-ai-evaluations` woła `transcribe-audio` z nagłówkiem `Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY`.
- `transcribe-audio` akceptuje wyłącznie JWT użytkownika (`supabase.auth.getUser()`), więc zwraca 401 `Invalid authentication token`.
- W logach masz dokładnie to: `Transcription HTTP error for q1: {"error":"Invalid authentication token"}`.
- Dodatkowo `process-pending-ai-evaluations` buduje `answersToVerify` tylko z `pending.answers` (tekst), więc pytania audio-only nie trafiają do AI-eval nawet jeśli audio istnieje.
- Efekt końcowy: AI zwraca ewaluację tylko dla `question_index: 0` (written), trigger SQL nie ma czego wpisać do części audio i zapisuje `nano_skill_ratings: []`.

2) Plan zmian (minimalne ryzyko, pełna kompatybilność)

A. Poprawa autoryzacji transkrypcji dla wywołań serwer-serwer
Plik: `supabase/functions/transcribe-audio/index.ts`
- Dodać 2-ścieżkową autoryzację:
  1) jak dziś: poprawny JWT użytkownika (frontend invoke),
  2) nowa ścieżka internal: jeśli Bearer token == `SUPABASE_SERVICE_ROLE_KEY`, traktuj jako trusted internal call i pomiń `getUser()`.
- Zachować obecną walidację `audio_url`, obsługę CORS i błędów.
- Nie zmieniać formatu response (dalej `{ success, transcription }`), żeby nic nie psuć w istniejącym froncie.

B. Naprawa budowy payloadu do AI-eval dla mixed/audio-only
Plik: `supabase/functions/process-pending-ai-evaluations/index.ts`
- Zamiast iterować tylko po `Object.entries(answers)`, budować zbiór pytań:
  - `union(question_indexes from answers + audioAnswers)`.
- Dla każdego `question_index`:
  - `writtenAnswer = answers[qIdx]` (jeśli jest),
  - `transcription = transcriptionMap[qIdx]` (jeśli jest),
  - `effectiveStudentAnswer = writtenAnswer || transcription`.
- Do `answersToVerify` dodawać rekord także dla audio-only (gdy brak tekstu, ale jest transkrypcja).
- Utrzymać przekazywanie:
  - `audio_transcription`,
  - `audio_word_count`.
- Logika mapowania mastery zostaje, ale będzie miała dane dla pytań audio:
  - `speaking_score` dla audio,
  - `writing_score` dla tekstu,
  - `quality_score` fallback.

C. Guard przed „cichym sukcesem” bez audio oceny
Plik: `supabase/functions/process-pending-ai-evaluations/index.ts`
- Dodać walidację przed wywołaniem `verify-open-answers`:
  - jeśli istnieją `audio_answers`, ale żadne audio pytanie nie trafiło do `answersToVerify`, traktować to jako błąd przetwarzania (status `failed` z czytelnym `error_message`), zamiast `completed`.
- To zapobiega ponownemu pojawianiu się fałszywego „przetworzone” bez audio mastery.

D. (Opcjonalne, ale zalecane) Uszczelnienie non-answer logic dla audio-only
Plik: `supabase/functions/verify-open-answers/index.ts`
- Obecnie server-side non-answer sprawdza tylko `student_answer`.
- Dodać fallback: jeśli `student_answer` puste, ale jest `audio_transcription`, użyć transkrypcji do heurystyki non-answer.
- Dzięki temu audio-only nie dostanie sztucznego 0.0 przez pusty tekst.

3) Dlaczego to nie popsuje aplikacji
- Nie zmieniamy schematu tabel ani kontraktów RPC.
- Nie ruszamy triggerów DSLM (już poprawnie rozdzielają written/audio po `question_index`).
- Nie zmieniamy frontowych interfejsów i payloadów (tylko rozszerzamy kompletność danych wejściowych w async pipeline).
- Zachowujemy działanie obecnych ścieżek:
  - submit homework (manualny),
  - shared worksheet 10-min timer,
  - create_homework batch eval.

4) Plan wdrożenia krok po kroku (zero decyzji podczas implementacji)
1. Edycja `transcribe-audio`:
   - dodać internal auth branch (`service role`),
   - zostawić user JWT branch bez zmian.
2. Edycja `process-pending-ai-evaluations`:
   - refactor budowy `answersToVerify` na union written+audio,
   - audio-only -> pełnoprawny wpis do AI-eval,
   - dodać guard na brak ocenionych pytań audio mimo obecnego audio.
3. (Jeśli wdrażamy punkt D) edycja `verify-open-answers`:
   - non-answer fallback do transkrypcji.
4. Logi diagnostyczne (bez zmiany API):
   - wypisać `audio_count`, `transcribed_count`, `answers_to_verify_count`, `audio_questions_sent_to_ai`.
5. Smoke testy manualne E2E.

5) Plan testów akceptacyjnych (must-pass)
Scenariusz 1: Mixed written+audio (dokładnie Twój przypadek)
- Q1 text, Q2 audio, trigger przez Homework na Live Session Worksheet.
- Oczekiwane:
  - log `Transcribed q1` (lub odpowiedni index),
  - `verify-open-answers` dostaje rekord dla pytania audio z `audio_transcription`,
  - `item_evaluations` zawiera wpis dla pytania audio,
  - `student_events` dla `response_type: "audio"` ma niepuste `nano_skill_ratings` i poprawny `question_index`.

Scenariusz 2: Audio-only question
- Brak tekstu, tylko nagranie.
- Oczekiwane:
  - pytanie trafia do AI-eval,
  - `audio` event ma mastery i skill rating, nie `[]`.

Scenariusz 3: Brak transkrypcji (symulowany błąd)
- Oczekiwane:
  - rekord nie kończy jako fałszywe `completed` bez audio oceny,
  - ma status `failed` z czytelnym powodem.

Scenariusz 4: Written-only regression
- Oczekiwane:
  - brak zmian funkcjonalnych względem obecnego działania.

6) Jednorazowa naprawa danych historycznych (już zapisanych z `nano_skill_ratings: []`)
- Po wdrożeniu kodu uruchomić ponowną ewaluację dla dotkniętych odpowiedzi:
  - requeue pending dla ćwiczeń z `audio_answers != {}` i audio eventem z pustymi ratings,
  - przetworzyć `process-pending-ai-evaluations`.
- To nie wymaga zmian schematu; to operacja naprawcza na danych.

7) Dokumentacja do aktualizacji po implementacji
- `docs/TECHNICAL_DOCUMENTATION.md`: opis nowego internal auth flow transkrypcji + audio-only path.
- `docs/CURRENT_STATE_ANALYSIS.md`: root cause + status fix.
- `docs/USER_GUIDE_SHORT.md` i `docs/USER_GUIDE_DETAILED.md`: jak działa ocena speaking w tle.
- `docs/BUSINESS_ANALYSIS.md`: wpływ na jakość DSLM i wiarygodność mastery.
- `docs/DEVELOPMENT_ROADMAP.md`: zamknięcie incydentu audio-eval.
- `README.md`: krótka notka o async speaking evaluation pipeline.

8) Kryterium zakończenia
Naprawa jest uznana za zamkniętą dopiero gdy w realnym przebiegu (Shared Worksheet + trigger Homework) event `response_type: "audio"` zawiera poprawne `nano_skill_ratings` dla indeksu pytania audio (nie written) i nie pojawia się już `Invalid authentication token` dla transkrypcji.
