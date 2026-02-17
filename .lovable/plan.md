

# Welcome Test v2 - Round 4 Poprawek

## Podsumowanie

Zidentyfikowałem 7 problemów z jasnym źródłem i bezpiecznymi poprawkami. Żadna zmiana nie wpływa na istniejącą logikę aplikacji.

---

## PROBLEM 1: Nagrywanie mowy - auto-zapis, odtwarzanie, transkrypcja

### 1.1 Auto-zapis przy kliknięciu Next NIE DZIAŁA

**Przyczyna:** Logika auto-zapisu w `SpeakingRecorder.tsx` (linie 53-84) opiera się na zmianie `questionId` przez `useEffect`. Problem polega na tym, że `useEffect` na linii 87-94 resetuje `blobRef.current = null` ZANIM efekt auto-zapisu na linii 53 zdąży użyć blob-a. Oba efekty reagują na zmianę `questionId`, ale efekt resetujący (linia 87) wykonuje się po efekcie auto-zapisu (linia 53) -- albo oba widzą nowy `questionId` jednocześnie, a reset kasuje blob zanim auto-save go użyje.

Ale główny problem jest INNY: `goToNext` w `useWelcomeTest.tsx` (linia 402) wywołuje `flushPendingAnswer()` który dotyczy TYLKO pól tekstowych (`TEXT_INPUT_TYPES`). Dla nagrań `speaking_record` -- `saveAnswer` NIGDY nie jest wywoływany automatycznie przez nawigację, a `SpeakingRecorder` wywołuje `onAnswer` tylko po kliknięciu "Save" lub po auto-save z `useEffect`.

**PRAWDZIWY problem:** Kolejność efektów. Efekt resetujący kasuje `blobRef.current = null` w tym samym renderze co efekt auto-zapisu.

**Rozwiązanie:** Zmienić podejście -- zamiast polegać na `useEffect` z `questionId`, obsłużyć auto-save PRZED nawigacją. Dodać do `SpeakingRecorder` ref, który rodzic może wywołać imperatywnie (`useImperativeHandle`), ALBO prościej: przenieść logikę auto-save do `goToNext` w hooku `useWelcomeTest`, sprawdzając czy aktualne pytanie jest typu `speaking_record` i czy blob istnieje.

Najprościej: w `SpeakingRecorder.tsx` naprawić kolejność efektów -- przenieść auto-save PRZED reset. Użyć `useRef` dla blob z poprzedniego pytania i zapis wykonać PRZED resetem.

**Konkretna zmiana:** W `SpeakingRecorder.tsx`:
- W efekcie auto-zapisu (linia 53): użyć `prevQuestionIdRef` do wykrycia zmiany ZANIM reset wykasuje blob
- Przenieść reset blob-a do WEWNĄTRZ efektu auto-zapisu, po wykonaniu uploadu
- Usunąć `blobRef.current = null` z efektu resetującego (linia 90)

### 1.2A Odtwarzanie nagrania w wynikach nauczyciela

**Przyczyna:** Nagranie nie jest uploadowane do R2 bo auto-save nie działa (problem 1.1). Odpowiedź zapisuje się jako tekst `recording_1771264061054_7s` (fallback), nie jako URL. Dlatego `isAudioAnswer` zwraca `false` a `isFailedRecording` zwraca `true`.

**Rozwiązanie:** Po naprawienia auto-save (1.1), nagrania będą poprawnie uploadowane do R2 i URL będzie rozpoznawany. Istniejący kod w `TestDetailsView.tsx` (linie 430-433, 544-567) już obsługuje odtwarzanie audio z URL R2 -- wystarczy naprawić zapis.

### 1.2B Transkrypcja w wynikach

**Status:** Transkrypcja już działa w UI -- przycisk "Transcribe" jest na linii 551-559. Po kliknięciu wywołuje `transcribe-audio` edge function (Whisper API). Problem jest taki sam jak 1.2A -- nie ma czego transkrybować bo nagranie nie jest uploadowane.

### 1.3 Transkrypcja w AI Analysis

**Status:** JUŻ ZAIMPLEMENTOWANE. `process-welcome-test/index.ts` linie 401-440 już transkrybują odpowiedzi speaking (`wt_q16s`, `wt_q36s`, `wt_q41s`) przed analizą AI. Problem: jeśli nagrania nie są uploadowane (1.1), nie ma czego transkrybować.

**Wniosek:** Naprawienie problemu 1.1 rozwiąże automatycznie 1.2A, 1.2B i 1.3.

---

## PROBLEM 2: student_events - poprawność logów

**Analiza bazy danych:**
- `welcome_test_completed` / `welcome_test` -- 3 wpisy -- POPRAWNE
- `welcome_test_section_progress` / `welcome_test` -- 21 wpisów -- POPRAWNE (po cleanup z Round 3)
- `test_answer_submitted` / `test` -- 714 wpisów -- To są inne testy (Intelligent Tests), NIE Welcome Test

**Werdykt:** Wszystko jest POPRAWNE. Event naming jest spójne z kanonicznymi typami ustalonymi w audycie DSLM Layer A. `test_answer_submitted` / `test` to zdarzenia z modułu Intelligent Tests (inne niż Welcome Test), co jest prawidłowe.

**Nie wymaga żadnych zmian.**

---

## PROBLEM 3: Tłumaczenie domyślnie WŁĄCZONE

### 3.1 Auto-ustawienie języka

**Przyczyna:** W `WelcomeTestPage.tsx` linie 140-182, `useEffect` automatycznie ustawia `translationLang` z profilu studenta. To powoduje, że tłumaczenie jest WŁĄCZONE od razu po załadowaniu.

**Rozwiązanie:** Usunąć ten `useEffect` który auto-ustawia `translationLang`. Tłumaczenie ma być domyślnie wyłączone (`translationLang = null`). Przycisk "Translate" (linia 548-598) powinien pozostać -- po kliknięciu automatycznie dobiera język z profilu i WŁĄCZA tłumaczenie.

### 3.2 Kompletność tłumaczeń

**Sprawdzenie:** Plik `welcomeTestTranslations.ts` deklaruje "All languages have FULL coverage matching Polish". Muszę to zweryfikować.

**Rozwiązanie:** Sprawdzić każdy język i uzupełnić brakujące wpisy jeśli jakiekolwiek brakują.

---

## PROBLEM 4: SKIP na ostatnim pytaniu sekcji = biały ekran

**Przyczyna:** W `useWelcomeTest.tsx` linia 396-399:
```typescript
const skipQuestion = useCallback(() => {
    flushPendingAnswer();
    goToNext();
}, []);  // <-- PUSTA TABLICA ZALEŻNOŚCI!
```

`skipQuestion` używa `goToNext` ale NIE MA go w tablicy zależności `useCallback`. To znaczy, że `skipQuestion` zawsze używa STAREJ wersji `goToNext` z pierwszego renderingu. Ta stara wersja `goToNext` operuje na starych `sections` (pusta tablica), więc `section` jest `undefined` i zwraca `prev` bez zmian -- efektywnie nic nie robi.

ALE jest gorzej: `goToNext` (linia 402) też wywołuje `flushPendingAnswer` które też ma brak zależności. Gdy `skipQuestion` wywołuje starą `goToNext`, a ta z kolei stara `flushPendingAnswer` -- nawigacja nie następuje.

Na ostatnim pytaniu sekcji, `goToNext` powinno przejść do następnej sekcji (linia 409-410). Ale ponieważ `skipQuestion` trzyma stałą referencję do `goToNext` z pierwszego renderu, `sections` jest pustą tablicą i `section` jest `undefined`, więc nawigacja się psuje.

**Rozwiązanie:** Dodać prawidłowe zależności:
```typescript
const skipQuestion = useCallback(() => {
    flushPendingAnswer();
    goToNext();
}, [flushPendingAnswer, goToNext]);
```

---

## PROBLEM 5: Teacher Preview zapisuje wersję testu

**Przyczyna:** W `useWelcomeTest.tsx` linia 248-261, `setTestVersion` zapisuje wersję do:
1. `localStorage` (linia 250): `localStorage.setItem('wt_version_${shareToken}', version)`
2. Bazy danych (linia 253-258): `student_tests.generation_params.test_version`

Nauczyciel w trybie Preview klika VersionSelector, co wywołuje `setTestVersion`, które zapisuje wersję. Gdy student wchodzi później, ta wersja jest odczytywana (linia 137-139) i VersionSelector jest pomijany.

**Rozwiązanie:** W `setTestVersion`, dodać sprawdzenie `isTeacherMode`. Jeśli nauczyciel jest w trybie preview, NIE zapisywać do bazy danych ani localStorage -- tylko ustawić stan lokalnie:

```typescript
const setTestVersion = useCallback((version: 'short' | 'full') => {
    if (!state.isTeacherMode) {
      // Only persist for students, not teacher preview
      if (shareToken) {
        localStorage.setItem(`wt_version_${shareToken}`, version);
      }
      if (state.testId) {
        supabase.from('student_tests')
          .update({ generation_params: { test_version: version } })
          .eq('id', state.testId)
          .then(() => {});
      }
    }
    setState(prev => ({ ...prev, testVersion: version, ... }));
}, [...]);
```

---

## PROBLEM 6: Quick Version w wynikach i AI Analysis

### 6.1 Puste pytania w wynikach Quick Version

**Przyczyna:** `TestDetailsView.tsx` linia 405 renderuje WSZYSTKIE `questions` (49), niezależnie od tego którą wersję student wybrał. Nie ma informacji o wybranej wersji.

**Rozwiązanie:** 
- Odczytać `test_version` z `student_tests.generation_params`
- Jeśli `test_version === 'short'`, filtrować pytania w widoku -- ukryć te które nie są w `WELCOME_TEST_SHORT_QUESTION_IDS` (oznaczyć na szaro jako "Not included in Quick Version")

### 6.2 AI Analysis dla Quick Version

**Przyczyna:** `process-welcome-test/index.ts` linia 44-51 oblicza wyniki ze WSZYSTKICH pytań z `is_correct`, nie filtrując po wersji. Jeśli student wybrał Quick Version, wiele pytań nie ma odpowiedzi -- ale one i tak nie mają `is_correct` (jest null), więc linia 46 `q.is_correct !== null` je pomija. 

**Wniosek:** Obliczenia procentowe JUŻ DZIAŁAJĄ POPRAWNIE bo filtrują po `is_correct !== null`. Pytania bez odpowiedzi mają `is_correct = null` i są pomijane.

Ale warto dodać `test_version` do eventu i AI promptu żeby AI wiedziało o kontekście.

---

## PROBLEM 7: Zły link w ShareTestModal

**Przyczyna:** `ShareTestModal.tsx` linia 41-43 generuje link:
```typescript
const shareUrl = shareToken 
    ? `${window.location.origin}/test/${shareToken}`
    : '';
```

Zawsze używa `/test/` zamiast `/welcome-test/`. Ale Welcome Test ma route `/welcome-test/:token`, nie `/test/:token`.

Natomiast `TestDetailsView.tsx` linia 108-111 już rozróżnia:
```typescript
const isWelcome = test?.test_type === 'welcome';
const url = isWelcome 
    ? `${window.location.origin}/welcome-test/${token}`
    : `${window.location.origin}/test/${token}`;
```

**Rozwiązanie:** Dodać prop `testType` do `ShareTestModal` i użyć go do generowania prawidłowego URL:
```typescript
const shareUrl = shareToken 
    ? `${window.location.origin}/${testType === 'welcome' ? 'welcome-test' : 'test'}/${shareToken}`
    : '';
```

Ścieżka `/test/:token` (linia 67 w App.tsx) prowadzi do `StudentTestPage` -- to jest poprawna strona dla ZWYKŁYCH testów (Intelligent Tests). Nie powinniśmy jej usuwać, bo inne testy jej używają. Ale link z Welcome Test musi kierować na `/welcome-test/`.

---

## Podsumowanie zmian w plikach

| Plik | Zmiana | Problem |
|------|--------|---------|
| `SpeakingRecorder.tsx` | Naprawić kolejność efektów auto-save i reset | 1.1 |
| `useWelcomeTest.tsx` | Dodać zależności do `skipQuestion`, nie zapisywać wersji w teacher mode | 4, 5 |
| `WelcomeTestPage.tsx` | Usunąć auto-ustawienie `translationLang` z useEffect | 3.1 |
| `ShareTestModal.tsx` | Dodać prop `testType`, użyć `/welcome-test/` dla welcome testów | 7 |
| `TestDetailsView.tsx` | Przekazać `testType` do ShareTestModal, oznaczyć pominięte pytania w Quick Version | 6.1, 7 |
| `process-welcome-test/index.ts` | Dodać `test_version` do kontekstu AI (opcjonalnie) | 6.2 |
| `welcomeTestTranslations.ts` | Sprawdzić i uzupełnić brakujące tłumaczenia | 3.2 |
| 6 plików dokumentacji | Zaktualizować o Round 4 | wszystkie |

### Czego NIE zmieniamy (bezpieczne):
- Routing w `App.tsx` -- `/test/:token` zostaje dla zwykłych testów
- Edge functions (poza opcjonalnym dodaniem `test_version` do promptu AI)
- Logika homework, flashcards, worksheet -- niezmieniona
- Baza danych -- brak migracji

### Kolejność implementacji:
1. `SpeakingRecorder.tsx` -- naprawa auto-save (rozwiązuje 1.1, 1.2A, 1.2B, 1.3)
2. `useWelcomeTest.tsx` -- skipQuestion zależności + teacher version guard (4, 5)
3. `ShareTestModal.tsx` + `TestDetailsView.tsx` -- poprawny link + Quick Version UI (6.1, 7)
4. `WelcomeTestPage.tsx` -- wyłączenie auto-tłumaczenia (3.1)
5. `welcomeTestTranslations.ts` -- weryfikacja kompletności (3.2)
6. Dokumentacja

