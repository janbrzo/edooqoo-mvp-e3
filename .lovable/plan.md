
# Welcome Test v2 - Round 6 Poprawek

## Podsumowanie

Zidentyfikowalem 4 glowne problemy. Najwazniejszy to **Problem 1** - znalazlem PRAWDZIWA przyczyne dlaczego auto-save nagrywania nie dziala (3 poprzednie proby naprawy chybialy).

---

## PROBLEM 1: Auto-zapis nagrywania - PRAWDZIWA PRZYCZYNA

### Dlaczego 3 poprzednie proby nie zadzialy

Wszystkie poprzednie poprawki zakladaly, ze `SpeakingRecorder` dostaje nowy `questionId` i efekt `useEffect([questionId])` odpala auto-save. To NIE jest prawidlowe zalozenie.

**PRAWDZIWA PRZYCZYNA:** Kiedy student przechodzi z pytania `speaking_record` (np. Q20) do INNEGO typu pytania (np. Q21 `multiple_choice`), komponent `QuestionInputInner` renderuje INNY komponent (RadioGroup zamiast SpeakingRecorder). React **ODMONTOWUJE** SpeakingRecorder. Efekt `useEffect([questionId])` NIGDY sie nie odpala, bo komponent juz nie istnieje. Cleanup effect (linia 118-128) tez NIE zapisuje nagrania.

Zapis dziala TYLKO gdy student przechodzi z jednego pytania `speaking_record` do INNEGO pytania `speaking_record` - wtedy komponent sie re-renderuje z nowym `questionId`. Ale w Welcome Test pytania speaking sa rozdzielone wieloma pytaniami innego typu, wiec SpeakingRecorder zawsze sie odmontowuje.

### Rozwiazanie

Przeniesc logike auto-save NA POZIOM RODZICA. W `WelcomeTestPage.tsx` (lub w `useWelcomeTest.tsx`), PRZED nawigacja (w `goToNext` i `skipQuestion`) sprawdzic:
1. Czy aktualne pytanie jest typu `speaking_record`
2. Czy istnieje nagranie w stanie `recorded` ale nie zapisane

Problem: rodzic nie ma dostepu do `blobRef` w SpeakingRecorder.

**Rozwiazanie z `useImperativeHandle`:**
1. SpeakingRecorder eksponuje metode `flushRecording()` przez `forwardRef` + `useImperativeHandle`
2. `flushRecording()` uploaduje blob do R2 i zwraca URL (lub null jesli brak nagrania)
3. W `goToNext` (w `useWelcomeTest.tsx`), dodac callback `onBeforeNavigate` ktory jest wywolywany PRZED zmiana pytania
4. W `WelcomeTestPage.tsx`, callback `onBeforeNavigate` wywoluje `speakingRecorderRef.current?.flushRecording()` i czeka na wynik

Prostsze rozwiazanie (bez ref):
1. Dodac do SpeakingRecorder efekt `useEffect` na **unmount** (cleanup w `[]`), ktory uploaduje blob
2. Problem: cleanup w `[]` nie ma dostepu do aktualnych stanow (stale closure). Ale uzywa refow (`blobRef`, `prevQuestionIdRef`) ktore sa zawsze aktualne.

**NAJPROSTSZE DZIALAJACE ROZWIAZANIE:**
W cleanup efekcie `useEffect([], return cleanup)` na linii 118-128, dodac auto-save logike:

```typescript
useEffect(() => {
    return () => {
      // Auto-save on unmount (when navigating away from speaking question)
      const blob = blobRef.current;
      const currentStatus = statusRef.current;
      const prevId = prevQuestionIdRef.current;
      
      if (blob && (currentStatus === 'recorded' || currentStatus === 'recording')) {
        // Stop recording if still in progress
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        
        const mimeType = blob.type || 'audio/webm';
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const fileName = `welcome-test-speaking-${Date.now()}.${ext}`;
        const formData = new FormData();
        formData.append('file', blob, fileName);
        
        // Fire-and-forget upload, use global handler to bypass stale closures
        supabase.functions.invoke('upload-to-r2', { body: formData })
          .then(({ data }) => {
            const url = data?.url || data?.publicUrl;
            if (url && prevId) {
              (window as any).__welcomeTestAutoSave?.(prevId, url);
            }
          })
          .catch(() => {});
      }
      
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
}, []);
```

To uzywa:
- `blobRef.current` - ref, zawsze aktualny
- `statusRef.current` - ref, zawsze aktualny 
- `prevQuestionIdRef.current` - ref z ID aktualnego pytania (ustawiany na poczatku efektu questionId)
- `window.__welcomeTestAutoSave` - globalny handler, zawsze aktualny

To rozwiazanie jest **bullet-proof** bo dziala przy KAZDYM odmontowaniu komponentu - niezaleznie od przyczyny (zmiana pytania, zmiana sekcji, zamkniecie strony).

### 1.2A, 1.2B, 1.3 - Automatycznie naprawione

Po naprawieniu auto-save, nagrania beda uploadowane do R2. Istniejacy kod w `TestDetailsView.tsx` (linie 457-460) juz rozpoznaje URL R2 i pokazuje odtwarzacz. Przycisk "Transcribe" juz dziala (linia 513-526). AI Analysis juz transkrybuje speaking answers.

---

## PROBLEM 2: student_events - element_type i event_source

### 2.1 Brakujacy element_type

**Obecny stan bazy:** 336 eventow z `element_type = null`. To sa pytania profilowe (self_assessment, preference_choice, scenario_reaction) ktore nie maja zdefiniowanego `element_type` w definicji pytania (`welcomeTestQuestions.ts`).

**Rozwiazanie:** W `commitAnswer` (linia 339), zmiana logiki:
```typescript
p_element_type: questionDef.element_type || questionDef.question_type || null,
```

Dzieki temu pytania profilowe beda mialy `element_type` ustawiony na swoj `question_type` (np. `self_assessment`, `preference_choice`, `scenario_reaction`). Pytania umiejetnosciowe zachowaja swoje `element_type` (grammar, vocabulary, speaking, etc.).

### 2.2 Stare eventy z event_source = 'test'

**Obecny stan:** 729 eventow z `event_source = 'test'` nalezacych do Welcome Testow. To sa stare eventy sprzed poprawki z Round 5.

**Rozwiazanie:** Migracja SQL:
```sql
UPDATE student_events SET event_source = 'welcome_test'
WHERE event_type = 'test_answer_submitted' 
AND event_source = 'test'
AND source_id IN (SELECT id FROM student_tests WHERE test_type = 'welcome');
```

### 2.3 Payload - brakujace dane

**Obecny stan nowych eventow (po Round 5):**
```json
{
  "answer_id": "wt_q44",
  "exercise_type": "self_assessment_matrix",
  "exercise_index": 47,
  "nano_skill_ratings": [],
  "time_spent_seconds": 9
}
```

Pytania profilowe maja pusty `nano_skill_ratings` bo nie maja `nano_skill` zdefiniowanego - to jest POPRAWNE bo pytania profilowe NIE mierza umiejetnosci jezykowych. One zbieraja cechy osobowosci/preferencje.

Natomiast payload powinien zawierac wiecej danych kontekstowych:
- `is_correct` - czy odpowiedz jest poprawna (dla pytan umiejetnosciowych)
- `detected_traits` - wykryte cechy (dla pytan profilowych)

**Rozwiazanie:** W `commitAnswer`, wzbogacic payload:
```typescript
p_event_payload: {
    answer_id: questionId,
    exercise_type: questionDef.question_type,
    exercise_index: questionIndex,
    is_correct: isCorrect,
    nano_skill_ratings: nanoSkillRatings,
    detected_traits: questionDef.detected_trait ? {
        [questionDef.detected_trait.trait_name]: detectedTraitValue
    } : undefined,
    time_spent_seconds: timeSpent,
}
```

### 2.3 Usuwanie duplikatow

**Obecny problem:** DELETE w commitAnswer (linia 324-331) filtruje po `element_type`, co powoduje ze:
- Pytania z `element_type = null` NIE sa usuwane (bo szuka `element_type = null` a nie IS NULL)
- Rrozne pytania z tym samym `element_type` (np. 2 pytania grammar) nadpisuja sie nawzajem

**Rozwiazanie:** Zmienic DELETE aby filtrowac po `event_payload->>'answer_id'` zamiast `element_type`:
```typescript
await supabase
    .from('student_events')
    .delete()
    .eq('student_id', state.studentId)
    .eq('source_id', state.testId)
    .eq('event_type', 'test_answer_submitted')
    .filter('event_payload->>answer_id', 'eq', questionId);
```

---

## PROBLEM 3: Brak informacji dlaczego przycisk Complete jest zablokowany

**Juz naprawione w Round 5** - komunikat jest na liniach 744-748. Sprawdzam czy dziala poprawnie - tak, wyswietla "Answer at least X of Y questions (Z answered)".

**Nie wymaga zmian.**

---

## PROBLEM 4: Usuniecie Quick Version - jeden test

**Zmiana koncepcyjna:** Usuwamy VersionSelector. Nie ma wyboru dlugosci. Zawsze pelna wersja (49 pytan).

### Zmiany w kodzie:

**1. `useWelcomeTest.tsx`:**
- Usunac state `testVersion` i wszystko co z nim zwiazane
- `sections` = zawsze `WELCOME_TEST_SECTIONS_WITH_QUESTIONS` (bez filtrowania)
- Usunac `setTestVersion` callback
- Usunac zapis/odczyt `test_version` z localStorage i bazy danych
- Usunac filtrowanie `WELCOME_TEST_SHORT_QUESTION_IDS`

**2. `WelcomeTestPage.tsx`:**
- Usunac stage `version` - przejsc od razu do `instructions` (lub `test` jesli juz widziano instrukcje)
- Usunac import `VersionSelector`
- Usunac `setTestVersion` z destrukturyzacji hooka
- W `getStage()`: usunac warunek `if (!testVersion) return "version"` - zastapic instrukcjami

**3. `VersionSelector.tsx`:**
- Usunac plik (lub zostawic ale nie importowac)

**4. `InstructionScreen.tsx`:**
- Usunac prop `version` - zawsze pelna wersja
- Zaktualizowac tekst (49 pytan, ~30 min)

**5. `TestDetailsView.tsx`:**
- Usunac logike `isQuickVersion` i `WELCOME_TEST_SHORT_QUESTION_IDS`
- Pokazywac zawsze wszystkie 49 pytan
- Usunac komunikat "Quick Version — X questions not included"

**6. `process-welcome-test/index.ts`:**
- Usunac `test_version` z body
- Usunac informacje o wersji z promptu AI

**7. `events.ts`:** Usunac referencje do Quick Version

**8. `welcomeTestQuestions.ts`:**
- Usunac export `WELCOME_TEST_SHORT_QUESTION_IDS` i `WELCOME_TEST_SHORT_QUESTIONS_COUNT`

---

## Podsumowanie zmian

| Plik | Zmiana | Problem |
|------|--------|---------|
| `SpeakingRecorder.tsx` | Dodac auto-save w cleanup unmount | 1.1 |
| `useWelcomeTest.tsx` | Usunac testVersion, naprawic element_type, wzbogacic payload, naprawic DELETE | 2, 4 |
| `WelcomeTestPage.tsx` | Usunac stage 'version', przejsc od razu do instructions | 4 |
| `InstructionScreen.tsx` | Usunac prop version, zaktualizowac tekst | 4 |
| `VersionSelector.tsx` | Usunac lub nie importowac | 4 |
| `TestDetailsView.tsx` | Usunac logike Quick Version | 4 |
| `process-welcome-test/index.ts` | Usunac test_version | 4 |
| `welcomeTestQuestions.ts` | Usunac SHORT_QUESTION_IDS eksporty | 4 |
| `events.ts` | Usunac referencje Quick Version | 4 |
| SQL migracja | Naprawic event_source test->welcome_test | 2.2 |
| Dokumentacja (6 plikow) | Zaktualizowac | wszystkie |

### Czego NIE zmieniamy:
- Routing w App.tsx - bez zmian
- Edge functions (poza usunieciem test_version)
- Logika homework, flashcards, worksheet - niezmieniona
- Istniejace dane w student_test_questions - niezmienione

### Kolejnosc implementacji:
1. `SpeakingRecorder.tsx` - unmount auto-save (1.1)
2. SQL migracja - naprawic stare event_source (2.2)
3. `useWelcomeTest.tsx` - usunac Quick Version + naprawic eventy (2, 4)
4. `WelcomeTestPage.tsx` + `InstructionScreen.tsx` - usunac version selection (4)
5. `TestDetailsView.tsx` + `welcomeTestQuestions.ts` - usunac Quick Version UI (4)
6. `process-welcome-test/index.ts` - usunac test_version (4)
7. Dokumentacja
