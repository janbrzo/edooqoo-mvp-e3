

# Welcome Test v2 - Round 8: Prawdziwa przyczyna znaleziona

## PROBLEM 1: Nagrywanie NIE DZIALA - PRAWDZIWA PRZYCZYNA (6ta proba)

### Diagnoza

Przeanalizowalem dane w bazie. **ZERO nagrań zostało kiedykolwiek uploadowanych do R2.** Wszystkie 20 rekordów speaking_record mają albo `NULL` albo placeholder typu `recording_1771436392071_12s`. Żaden nie ma URL R2.

Sprawdziłem kod `upload-to-r2/index.ts` linia 94:
```
const { base64Image, base64Data, filename, contentType } = await req.json();
```

A `SpeakingRecorder.tsx` linia 283 wysyła:
```
supabase.functions.invoke('upload-to-r2', { body: formData })
```

**FormData (blob binarny) != JSON.** `req.json()` rzuca błąd parsowania na FormData. Edge function zwraca 500. `uploadAndSave` łapie błąd w catch (linia 298) i zapisuje PLACEHOLDER `recording_XXXX_Xs`. Dlatego nawet przycisk "Save" nigdy nie działał!

### Rozwiązanie

Zmienić SpeakingRecorder aby konwertował blob na base64 i wysyłał jako JSON (format obsługiwany przez upload-to-r2):

```typescript
// Convert blob to base64
const reader = new FileReader();
const base64Promise = new Promise<string>((resolve) => {
  reader.onloadend = () => resolve(reader.result as string);
  reader.readAsDataURL(blob);
});
const base64Full = await base64Promise;
const base64Data = base64Full.split(',')[1]; // Remove data:audio/webm;base64, prefix

const mimeType = blob.type || 'audio/webm';
const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
const fileName = `welcome-test-speaking-${Date.now()}.${ext}`;

const { data, error } = await supabase.functions.invoke('upload-to-r2', {
  body: JSON.stringify({
    base64Data,
    filename: fileName,
    contentType: mimeType,
  }),
});
```

Ta zmiana dotyczy:
1. `uploadAndSave()` (przycisk Save) - linie 272-304
2. Auto-save w cleanup unmount - linie 122-162 
3. Auto-save w `useEffect([questionId])` - linie 53-110
4. `flushSpeakingIfNeeded()` w `useWelcomeTest.tsx` - linie 371-396

Wyodrębnię konwersję blob->base64 do funkcji pomocniczej `uploadBlobToR2(blob: Blob)` aby nie duplikować kodu.

### Konsekwencje (1.2, 1.3)
Po naprawieniu uploadu:
- URL R2 trafi do `student_test_questions.student_answer`
- `TestDetailsView.tsx` (linie 457-460) automatycznie pokaże odtwarzacz audio (rozpoznaje URL z `pub-` lub `r2.dev`)
- Przycisk "Transcribe" (linie 513-526) zadziała bo wywoła `transcribe-audio` z prawdziwym URL
- `process-welcome-test` (linie 386-413) automatycznie transkrybuje speaking answers i uwzględni w AI Analysis

---

## PROBLEM 2 (dawny 3): student_events.event_source = 'test' 

### Stan bazy
- 58 eventów welcome test z `event_source = 'test'` (zweryfikowane: 58 to welcome, 20 to placement)
- Kod `useWelcomeTest.tsx` linia 314 już używa `'welcome_test'` - nowe eventy są OK
- Stare eventy powstały z cache przeglądarki ze starym kodem

### Rozwiązanie
Migracja SQL:
```sql
UPDATE student_events SET event_source = 'welcome_test'
WHERE event_type = 'test_answer_submitted' 
AND event_source = 'test'
AND source_id IN (SELECT id FROM student_tests WHERE test_type = 'welcome');
```

---

## PROBLEM 3 (dawny 4): student_events.event_payload - brakujące dane

### A. preference_choice z generycznym `answer_value`

Pytania jak `wt_q9` (How long learning), `wt_q10` (Where learned), `wt_q11` (Exam experience) mają w payloadzie:
```json
{"detected_traits": {"answer_value": "More than 10 years"}}
```

To jest mało użyteczne dla DSLM. Potrzebujemy semantycznych kluczy. Rozwiązanie: dodać `detected_trait` do definicji tych pytań w `welcomeTestQuestions.ts`, albo w `commitAnswer` mapować `question.id` na semantyczny klucz.

Prostsze rozwiązanie: w `commitAnswer`, zamiast generycznego `answer_value`, użyć ID pytania jako klucza. Np. dla `wt_q9`:
```json
{"detected_traits": {"learning_duration": "More than 10 years"}}
```

Dodam mapę `QUESTION_TRAIT_FALLBACK`:
```typescript
const QUESTION_TRAIT_FALLBACK: Record<string, string> = {
  'wt_q2': 'main_frustrations',
  'wt_q6': 'preferred_activities',
  'wt_q9': 'learning_duration',
  'wt_q10': 'learning_background',
  'wt_q11': 'exam_experience',
  'wt_q12': 'learning_goal',
  'wt_q13': 'desired_topics',
  'wt_q15': 'reading_strategy',
  'wt_q41': 'learning_priorities',
  'wt_q43': 'interest_topics',
  'wt_q45': 'final_message',
};
```

### B. self_assessment_matrix (wt_q44) bez detected_traits

Obecny payload:
```json
{"detected_traits": {"confidence_matrix": "{...}"}}
```
To jest OK - macierz jest zapisana jako JSON string.

### C. open_ended/speaking - mastery = -1 po AI Analysis

`process-welcome-test/index.ts` linie 489-510 już aktualizują mastery. Ale update może nie działać jeśli `answers[qId]` jest placeholderem (nie URL). Po naprawieniu uploadu (Problem 1) to powinno zadziałać automatycznie.

Dodatkowo: AI analysis daje jedną wartość `writing_quality` (basic/intermediate/advanced) dla WSZYSTKICH pytań otwartych/speaking. To jest zbyt uproszczone. Lepiej: dodać do AI promptu instrukcję oceny każdego pytania osobno.

Zmiana promptu AI w `process-welcome-test`:
```
For each open answer, rate quality on 0-100 scale:
{"per_question_scores": {"wt_q16": 45, "wt_q36": 70, ...}, "writing_quality": "intermediate", ...}
```

Potem zamiast jednego `masteryValue` dla wszystkich, użyć `per_question_scores[qId]`:
```typescript
for (const qId of allOpenSpeakingIds) {
  const score = parsed.per_question_scores?.[qId];
  if (score !== undefined) {
    await supabase.from('student_events')
      .update({ mastery: score })
      .eq('source_id', test_id)
      .filter('event_payload->>answer_id', 'eq', qId);
  }
}
```

---

## PROBLEM 4 (dawny 5): Usunięcie Create AI-Powered Test

### Co usuwamy:
1. **`CreateTestModal.tsx`** - cały plik
2. **`StudentTestsTab.tsx`** - przycisk "Create Test" i import CreateTestModal  
3. **`generate-test/index.ts`** - edge function (usunięcie pliku + usunięcie deploymentu)
4. **`supabase/config.toml`** - usunąć `[functions.generate-test]`
5. **`studentTests.ts`** - z `TEST_TYPES` usunąć `placement`, `progress_check`, `skill_verification`, `goal_check` (zostawić tylko `welcome`)

### Co ZOSTAWIAMY:
- **`StudentTestsTab.tsx`** - widok listy testów (Welcome Test placeholder, karty testów)
- **`TestDetailsView.tsx`** - widok szczegółów testu/wyników
- **`useStudentTests.tsx`** - hook (zarówno `useStudentTests` jak i `useStudentTestSession`)
- **`ShareTestModal.tsx`** - udostępnianie Welcome Test
- Tabele `student_tests`, `student_test_questions`, `test_skill_results` - potrzebne dla Welcome Test
- **`process-welcome-test/index.ts`** - analiza AI
- **`WelcomeTestPage.tsx`** - strona testu
- **`useWelcomeTest.tsx`** - hook Welcome Test

### Zmiany w StudentTestsTab:
- Usunąć przycisk "Create Test" z headera
- Usunąć import `CreateTestModal`
- Usunąć state `createModalOpen`
- Usunąć `<CreateTestModal />` z JSX
- Zmienić pusty stan "No tests yet" - usunąć przycisk "Create First Test"
- Usunąć lub zmienić sekcję "Intelligent Testing Features" (zostawić tylko info o Welcome Test)
- Zamienić przycisk "Create Test" w pustym stanie na tekst informacyjny

### Zmiany w TestCard:
- Usunąć switch na typy testów inne niż welcome (placement, progress_check, etc.)
- Zostawić obsługę welcome test i fallback

---

## Podsumowanie zmian w plikach

| Plik | Zmiana | Problem |
|------|--------|---------|
| `SpeakingRecorder.tsx` | Naprawić upload: blob -> base64 -> JSON zamiast FormData | 1 |
| `useWelcomeTest.tsx` | Naprawić `flushSpeakingIfNeeded`: blob -> base64, dodać semantyczne klucze traitów | 1, 3 |
| `process-welcome-test/index.ts` | Zmienić prompt AI na per-question scoring, użyć indywidualnych mastery | 3 |
| `StudentTestsTab.tsx` | Usunąć "Create Test", CreateTestModal import, info o AI tests | 4 |
| `CreateTestModal.tsx` | USUNĄĆ plik | 4 |
| `generate-test/index.ts` | USUNĄĆ edge function | 4 |
| `supabase/config.toml` | Usunąć `[functions.generate-test]` | 4 |
| `studentTests.ts` | Usunąć typy testów inne niż welcome | 4 |
| SQL migracja | Naprawić event_source 'test' -> 'welcome_test' | 2 |
| 6 plików dokumentacji | Zaktualizować o Round 8 | wszystkie |

### Czego NIE zmieniamy:
- `upload-to-r2/index.ts` - działa poprawnie, problem był po stronie klienta (FormData vs JSON)
- `WelcomeTestPage.tsx` - bez zmian (poza ewentualnym import fix)
- Routing w App.tsx
- Logika homework, flashcards, worksheet

### Kolejność implementacji:
1. `SpeakingRecorder.tsx` - naprawić upload blob->base64 (KRYTYCZNE)
2. `useWelcomeTest.tsx` - naprawić flushSpeaking + semantyczne klucze traitów
3. SQL migracja - event_source fix
4. `process-welcome-test/index.ts` - per-question mastery scoring
5. Usunąć CreateTestModal + generate-test + config.toml cleanup
6. `StudentTestsTab.tsx` + `studentTests.ts` - uprościć
7. Dokumentacja

