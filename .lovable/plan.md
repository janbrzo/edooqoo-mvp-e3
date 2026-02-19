# Welcome Test - Round 10: Naprawa transkrypcji i ocen AI

## Znalezione problemy i rozwiazania

---

## PROBLEM 1: Transkrypcja nie wyswietla sie pod nagraniem

### Przyczyna (ZNALEZIONA)

W `process-welcome-test/index.ts` transkrypcja JEST zapisywana do bazy (linia 429), ALE pozniej kod aktualizujacy `ai_score` (linia 545-552) NADPISUJE `question_data` danymi z CACHE (tablica `questions` pobrana na poczatku). Cache nie zawiera transkrypcji, wiec `{ ...existingData, ai_score: score }` traci pole `transcription`.

Dowod: w bazie `question_data = {"ai_score": 65}` - brak `transcription`.

### Rozwiazanie

W sekcji aktualizujacej `ai_score` (linia 534-553), zamiast uzywac `matchQ.question_data` z cache, pobrac AKTUALNE dane z bazy:

```typescript
if (matchQ) {
  // Fetch FRESH data from DB (transcription may have been saved above)
  const { data: freshQ } = await supabase
    .from('student_test_questions')
    .select('question_data')
    .eq('id', matchQ.id)
    .single();
  const existingData = (freshQ?.question_data || {}) as Record<string, unknown>;
  await supabase
    .from('student_test_questions')
    .update({
      is_correct: score >= 40,
      question_data: { ...existingData, ai_score: score },
    })
    .eq('id', matchQ.id);
}
```

Frontend (`TestDetailsView.tsx` linia 455) juz poprawnie laduje `question_data.transcription` - ten kod jest OK i nie wymaga zmian.

---

## PROBLEM 2: Ocena AI zbyt pobłażliwa (Speaking 70%, 100%)

### Przyczyna

Prompt AI (linia 470-474) jest ogolny - "rate the quality on a 0-100 scale" bez konkretnych kryteriow. AI domyslnie daje wysokie oceny za krotkie odpowiedzi typu "Hello, my name is John, how are you?" (65-75 punktow).

### Rozwiazanie

Zaostrzenie promptu AI. Dodac konkretne kryteria oceny:

```
For EACH open/speaking answer, rate quality on 0-100 scale using STRICT criteria:
- Speaking: Evaluate fluency (words per second - count words in transcription vs recording length), pronunciation accuracy, grammatical correctness, vocabulary range, and RELEVANCE to the prompt. A 1-sentence greeting for a 30-second prompt = max 20-30 points. Off-topic or minimal responses = 0-15 points. Only responses with sustained, relevant speech (15+ seconds of content) can score above 50.
- Writing: Evaluate grammar accuracy, vocabulary range, register appropriateness, coherence, and RELEVANCE to the prompt. A 2-3 word answer to a question requiring a paragraph = max 15-25 points. Only responses with complete, relevant sentences can score above 50.
- Score 0: No answer, gibberish, or completely off-topic
- Score 1-25: Minimal attempt, very short, major errors
- Score 26-50: Basic attempt, partially relevant, notable errors
- Score 51-75: Good attempt, mostly relevant, some errors
- Score 76-100: Strong response, fully relevant, few errors
BE STRICT. Do not inflate scores for minimal effort.
```

Dodatkowo: przekazac czas nagrania do AI aby mogl ocenic fluency (ile sekund nagranie vs ile slow). Mozna to wziac z `time_spent_seconds` w `student_test_questions`.

---



---

## Podsumowanie zmian w plikach


| Plik                            | Zmiana                                                                                                                         | Problem |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| `process-welcome-test/index.ts` | Pobierac SWIEZE `question_data` z bazy zamiast cache przed zapisem `ai_score`. Zaostrzenie promptu AI z konkretnymi kryteriami | 1, 2    |
| &nbsp;                          | &nbsp;                                                                                                                         | &nbsp;  |


### Czego NIE zmieniamy:

- `TestDetailsView.tsx` - kod wyswietlania transkrypcji jest poprawny (linia 455)
- `WelcomeTestResults.tsx` - Speaking juz wyswietla sie poprawnie
- `SpeakingRecorder.tsx` - upload dziala
- `useWelcomeTest.tsx` - visibilitychange juz dodany
- Routing, homework, flashcards, worksheet

### Kolejnosc:

1. `process-welcome-test/index.ts` - fix cache + strict prompt
2. &nbsp;
3. Deploy process-welcome-test
4. Aktualizacja dokumentacji