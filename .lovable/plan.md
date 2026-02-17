

# Welcome Test v2 - Round 5 Poprawek

## Podsumowanie

Zidentyfikowałem 7 problemow. Oto szczegolowa analiza kazdego z nich.

---

## PROBLEM 1: Nagrywanie mowy - auto-zapis, odtwarzanie, transkrypcja

### 1.1 Auto-zapis przy kliknieciu Next NADAL NIE DZIALA

**Przyczyna glowna:** Problem jest fundamentalny i nie do naprawienia samym "przesunieciem efektow". Oto dlaczego:

Kiedy uzytkownik klika "Next", React wywoluje `goToNext()` -> `flushPendingAnswer()` (dotyczy TYLKO pol tekstowych) -> `setState(prev => ...)` (zmienia `currentQuestionIndex`). To powoduje re-render i komponent `QuestionInputInner` dostaje nowe `question` z nowym `question.id`. Wtedy `SpeakingRecorder` dostaje nowy `questionId`.

W `SpeakingRecorder.tsx` (linia 54-97), efekt `useEffect([questionId])` widzi zmiane `questionId`. Na linii 64 sprawdza `if (currentBlob && currentStatus === 'recorded')`. Problem: `currentBlob = blobRef.current` jest przechwytywany na poczatku efektu (linia 56), ale `MediaRecorder.onstop` jest asynchroniczny. Jesli nagrywanie zostalo zatrzymane ale `onstop` jeszcze nie zdazyl ustawic `blobRef.current`, to `currentBlob` jest `null`.

ALE to nie jest jedyny problem. Jesli student juz nagral (status `recorded`, blob istnieje), to `blobRef.current` POWINIEN byc ustawiony. Problem lezy gdzie indziej:

Sprawdzilem dokladnie: na linii 92 `blobRef.current = null` - reset jest robiony W TYM SAMYM efekcie, PO uploadzie. Ale upload jest asynchroniczny (`.then()`), wiec `blobRef.current = null` wykonuje sie NATYCHMIAST, kasujac blob ZANIM `.then()` zdazy go uzyc. Upload jest fire-and-forget ale blob jest juz skasowany zanim fetch sie zakonczy.

WAIT - to nie tak. Na linii 65 `const blob = currentBlob` - blob jest juz skopiowany do zmiennej lokalnej. Upload na linii 72 uzywa `FormData` ktory juz ma dane. Wiec `blobRef.current = null` na linii 92 nie powinno byc problemem.

**PRAWDZIWY problem:** Przyjrzyjmy sie uwaznie. Na linii 56: `const currentBlob = blobRef.current`. Na linii 57: `const currentStatus = statusRef.current`. Na linii 64: `if (currentBlob && currentStatus === 'recorded')`.

Kiedy student nagra (status zmieni sie na `recorded`, blob jest ustawiony), a potem kliknie Next, `questionId` sie zmienia. Efekt sie odpala. `currentBlob` i `currentStatus` sa poprawne. Upload powinien sie wykonac.

Ale jest jeszcze drugi efekt na linii 101-104:
```typescript
useEffect(() => {
    setStatus(answer ? 'done' : 'idle');
    setAudioUrl(answer || null);
}, [answer, questionId]);
```

Ten efekt reaguje na zmiane `questionId` I na zmiane `answer`. Kiedy `questionId` sie zmienia, `answer` tez sie zmienia (bo nowe pytanie nie ma odpowiedzi, wiec `answer = undefined`). Ten efekt ustawia `setStatus('idle')`. To powoduje re-render i `statusRef.current = 'idle'`.

Ale WAIT - efekty React wykonuja sie w kolejnosci deklaracji. Efekt na linii 54 (auto-save) jest przed efektem na linii 101 (reset status). Wiec `statusRef.current` powinien byc jeszcze `recorded` gdy efekt auto-save sie wykonuje.

Hmm, ale `statusRef` jest aktualizowany przez efekt na linii 49: `useEffect(() => { statusRef.current = status; }, [status])`. Ten efekt tez reaguje na zmiane `status`. Ale `status` zmienia sie dopiero po `setStatus('idle')` z efektu na linii 101, ktory jeszcze sie nie wykonal.

**Wlasciwy debugging:** Musimy sprawdzic czy problem lezy w tym, ze `onAnswer` jest wywolywany ale odpowiedz NIE jest commitowana do bazy. Bo `onAnswer` wywoluje `saveAnswer` w hooku `useWelcomeTest`, a `saveAnswer` NIE dodaje `speaking_record` do `TEXT_INPUT_TYPES`, wiec `saveAnswer` natychmiast wywoluje `commitAnswer`. Wiec upload + commit powinny dzialac.

**ALE** - jest problem z kolejnoscia! `onAnswerRef.current(url)` na linii 76 wywoluje `saveAnswer` ASYNCHRONICZNIE (w `.then()`). To znaczy ze `saveAnswer` jest wywolywany PO tym jak `goToNext` juz zmienil `questionId`. Wtedy `saveAnswer` dostaje stary `questionId` (z closure `onAnswer`) ale `state.answers` juz zawiera nowe pytanie jako aktualne.

Sprawdzmy: `onAnswer` w `QuestionInputInner` to `(url) => onAnswer(url)` co jest `(val) => saveAnswer(currentQuestion.id, val)`. ALE `currentQuestion` jest z closure renderowania. Po kliknieciu Next i re-renderze, `currentQuestion` sie zmienia. Ale `onAnswerRef.current` trzyma referencje do POPRZEDNIEJ wersji `onAnswer` ktora ma POPRZEDNI `currentQuestion.id`.

Wait, `onAnswerRef` jest aktualizowany na linii 50: `useEffect(() => { onAnswerRef.current = onAnswer; }, [onAnswer])`. Ten efekt ustawia `onAnswerRef` na NOWA wersje `onAnswer` (z nowym pytaniem). Ale upload moze sie zakonczyc ZANIM ten efekt sie wykona (efekty sa batched).

**To jest race condition!** Upload jest fire-and-forget. Jesli upload zakonczy sie szybko (ale zazwyczaj trwa pare sekund), `onAnswerRef.current` moze juz wskazywac na nowe pytanie.

**ROZWIAZANIE (proste i pewne):** Zamiast polegac na efektach i refach, uzyc podejscia imperatywnego. Dodac do `SpeakingRecorder` `forwardRef` z `useImperativeHandle` ktory eksponuje metode `getRecordingBlob()`. Rodzic (WelcomeTestPage) wywoluje to PRZED nawigacja.

**PROSTSZE ROZWIAZANIE:** W `SpeakingRecorder`, w efekcie auto-save (linia 62-84), ZAMIAST uzywac `onAnswerRef.current(url)`, wywolac BEZPOSREDNIO `supabase.from('student_test_questions').update(...)` z prawidlowym `prevId` (ktore mamy z `prevQuestionIdRef`). To omija caly problem z `onAnswer` i closures.

Ale to wymaga znania `testId` i `questionIndex` w SpeakingRecorder, co komplikuje komponent.

**NAJLEPSZE ROZWIAZANIE:** Przechwycic `questionId` PO STRONIE RODZICA. W `WelcomeTestPage`, w `goToNext`:

1. Dodac callback `onBeforeNavigate` do `useWelcomeTest` ktory jest wywolywany PRZED zmiana pytania
2. W tym callbacku, jesli aktualne pytanie jest `speaking_record`, pobrac blob z SpeakingRecorder (via ref) i uploadowac

Ale to wymaga ref na SpeakingRecorder.

**NAJPROSTSZE DZIALAJACE ROZWIAZANIE:**

W `SpeakingRecorder.tsx`, problem jest taki: `onAnswerRef.current` moze wskazywac na zly callback. Rozwiazanie: zamiast uzywac `onAnswerRef`, zamknac `questionId` POPRZEDNIEGO pytania (mamy go w `prevId`) i wywolac `commitAnswer` bezposrednio przez prop. Dodac prop `onAutoSave: (questionId: string, audioUrl: string) => void` ktory przyjmuje KONKRETNY questionId. Wtedy w efekcie auto-save:

```typescript
if (currentBlob && currentStatus === 'recorded') {
    const blob = currentBlob;
    // upload...
    .then(({ data }) => {
        const url = data?.url || data?.publicUrl;
        if (url && props.onAutoSave) {
            props.onAutoSave(prevId, url);  // prevId = ID POPRZEDNIEGO pytania
        }
    });
}
```

W `WelcomeTestPage`, rodzic przekazuje:
```typescript
onAutoSave={(questionId, audioUrl) => saveAnswer(questionId, audioUrl)}
```

To jest czyste, bezpieczne i nie zmienia istniejacego API (prop `onAnswer` dalej dziala dla recznego "Save").

### 1.2A, 1.2B, 1.3 - Odtwarzanie, Transkrypcja, AI Analysis

Wszystkie te problemy sa konsekwencja 1.1. Po naprawieniu auto-save:
- Nagranie bedzie uploadowane do R2 -> URL bedzie w `student_answer` -> `isAudioAnswer` zwroci `true` -> odtwarzacz bedzie widoczny
- Przycisk "Transcribe" juz jest zaimplementowany (linia 506-519)
- AI Analysis (linia 401-440) juz transkrybuje speaking answers

---

## PROBLEM 2: student_events - zmiana event types

**Twoja prosba:** Usunac `welcome_test_section_progress` i `welcome_test_completed` z logowania, zostawic TYLKO `test_answer_submitted` z `event_source = 'welcome_test'`.

**Obecny stan bazy:**
- `welcome_test_section_progress` / `welcome_test` -- 30 wpisow
- `welcome_test_completed` / `welcome_test` -- 4 wpisy
- `test_answer_submitted` / `test` -- 740 wpisow (inne testy, NIE welcome test)

**Problem:** Obecnie Welcome Test NIE loguje `test_answer_submitted` wcale. Loguje tylko sekcje i completed. Trzeba:
1. Usunac logowanie `welcome_test_section_progress` z `commitAnswer` (linia 314-355)
2. Usunac logowanie `welcome_test_completed` z `completeTest` (linia 454-495)
3. DODAC logowanie `test_answer_submitted` z `event_source = 'welcome_test'` w `commitAnswer`

### 2.1 event_type = test_answer_submitted
### 2.2 event_source = welcome_test (nie test)
### 2.3 event_payload z nano_skill_ratings

**Obecny payload welcome test:**
```json
{"is_correct": null, "question_id": "...", "question_type": "open_ended", "question_index": 15, "difficulty_level": 3, "time_spent_seconds": 19}
```

**Wymagany payload (wzorowany na worksheet):**
```json
{
    "answer_id": "question-uuid",
    "exercise_type": "multiple_choice",
    "exercise_index": 15,
    "nano_skill_ratings": [
        {"name": "ns.grammar.present_simple_third_person", "reason": "Tests correct use of third person -s in present simple", "mastery": 100, "hasValue": true, "question_index": 0}
    ],
    "time_spent_seconds": 19
}
```

**Skad wziąc nano_skill_ratings?** Kazde pytanie w `welcomeTestQuestions.ts` ma pole `nano_skill` (np. `'ns.grammar.past_simple_regular'`). Dla pytan zamknietych (`is_correct !== null`): mastery = `is_correct ? 100 : 0`. Dla pytan otwartych: mastery = -1 (pending AI), a po AI analysis `process-welcome-test` -> nadpisanie mastery.

**Zmiana w `useWelcomeTest.tsx`:** W `commitAnswer`, zamiast logowac `welcome_test_section_progress`, logowac `test_answer_submitted` z prawidlowym payloadem:

```typescript
await supabase.rpc('add_student_event', {
    p_event_type: 'test_answer_submitted',
    p_event_source: 'welcome_test',
    p_source_id: state.testId,
    p_element_type: questionDef.element_type || null,
    p_event_payload: {
        answer_id: questionDef.id, // question uuid from student_test_questions
        exercise_type: questionDef.question_type,
        exercise_index: questionIndex,
        nano_skill_ratings: questionDef.nano_skill ? [{
            name: questionDef.nano_skill,
            reason: questionDef.scoring_logic || questionDef.description || '',
            mastery: isCorrect === true ? 100 : isCorrect === false ? 0 : -1,
            hasValue: isCorrect !== null,
            question_index: 0,
        }] : [],
        time_spent_seconds: timeSpent,
    },
});
```

**Zmiana w `process-welcome-test/index.ts`:** Po AI analysis, nadpisac mastery w `student_events` dla pytan otwartych. Ale to jest skomplikowane - latwiej nadpisac caly event z nowym mastery.

**Usuniecie starych danych:** Migracja SQL do wyczyszczenia starych `welcome_test_section_progress` i `welcome_test_completed`.

**Zmiana w `events.ts`:** Usunac `welcome_test_section_progress` i `welcome_test_completed` z typow. Zostawic `test_answer_submitted`. Zmienic `EventSource` zeby `welcome_test` bylo uzywane z `test_answer_submitted`.

---

## PROBLEM 3: Przycisk Complete - brak informacji dlaczego zablokowany

**Obecna logika (linia 517):**
```typescript
const canComplete = answeredCount >= totalQuestions * 0.5;
```

Przycisk Complete jest wlaczony gdy student odpowiedzial na co najmniej 50% pytan. Ale student NIE WIE o tym wymagerniu.

**Rozwiazanie:** Dodac komunikat pod przyciskiem Complete gdy jest zablokowany:

```tsx
{isLastQuestion && !canComplete && !teacherPreviewMode && (
    <p className="text-xs text-amber-600 text-center mt-1">
        Answer at least {Math.ceil(totalQuestions * 0.5)} questions to complete 
        ({answeredCount}/{Math.ceil(totalQuestions * 0.5)} answered)
    </p>
)}
```

---

## PROBLEM 4: Quick Version w wynikach

### 4.1 Puste pytania widoczne

**Obecny stan:** `TestDetailsView.tsx` linia 414-417 juz filtruje pytania Quick Version:
```typescript
if (isExcludedFromQuickVersion) return null;
```

To juz dziala - pytania Quick Version sa ukrywane. Ale linia 281 pokazuje `answeredQuestions.length/questions.length` (np. "21/49"), co jest bledne.

**Rozwiazanie:** Dla Quick Version, zmieniac `questions.length` na `WELCOME_TEST_SHORT_QUESTION_IDS.length` i `answeredQuestions` filtrowac po `WELCOME_TEST_SHORT_QUESTION_IDS`:

```typescript
const visibleQuestions = isQuickVersion 
    ? questions.filter((q, i) => {
        const qDef = ALL_WELCOME_TEST_QUESTIONS[i];
        return qDef && WELCOME_TEST_SHORT_QUESTION_IDS.includes(qDef.id);
    })
    : questions;
const answeredVisible = visibleQuestions.filter(q => q.student_answer !== null);
```

### 4.2 AI Analysis dla Quick Version

**Obecny stan:** `process-welcome-test/index.ts` linia 46: `if (q.element_type && q.is_correct !== null)` -- juz filtruje tylko odpowiedzone pytania. Pytania bez odpowiedzi maja `is_correct = null`, wiec sa pomijane. To juz dziala poprawnie.

Ale prompt AI (linia 480) juz zawiera `test_version`. Mozna dodac wiecej kontekstu: ile pytan widzial student.

**Rozwiazanie:** Dodac do promptu AI informacje o wersji i liczbie pytan:
```
- Test version: Quick Version (29 questions out of 49)
- Student saw only selected questions covering key skills
```

---

## PROBLEM 5: Link w ShareTestModal - email wysyla zly link

### 5.1 Email wysyla /test/ zamiast /welcome-test/

**Przyczyna:** `ShareTestModal.tsx` (linia 77) wywoluje `send-test-email` BEZ parametru `testType`:
```typescript
body: { shareToken, recipientEmail, testTitle, teacherName }
```

Edge function `send-test-email` na linii 31 sprawdza `testType` ale go NIE DOSTAJE (bo nie jest w body). Domyslnie `isWelcomeTest = false`, wiec generuje link `/test/`.

**Rozwiazanie:** Dodac `testType` do wywolania w `ShareTestModal.tsx`:
```typescript
body: { shareToken, recipientEmail, testTitle, teacherName, testType }
```

`testType` juz jest dostepny jako prop (linia 32) - po prostu nie jest przekazywany do edge function.

### 5.2 Link /test/{token} dla welcome test powinien nie dzialac

**Obecny stan:** `/test/:token` prowadzi do `StudentTestPage.tsx` ktory uzywa `useStudentTestSession`. Ten hook laduje dowolny test po share_token - wlacznie z welcome test. To powoduje ze welcome test otwiera sie w zlym UI (standardowym interfejsie testow).

**Rozwiazanie:** W `StudentTestPage.tsx`, po zaladowaniu testu, sprawdzic `test.test_type`. Jesli `test_type === 'welcome'`, przekierowac na `/welcome-test/${token}`:

```typescript
useEffect(() => {
    if (test?.test_type === 'welcome' && token) {
        navigate(`/welcome-test/${token}`, { replace: true });
    }
}, [test?.test_type, token]);
```

To jest bezpieczniejsze niz blokowanie - student ktory uzyje starego linku zostanie automatycznie przekierowany.

---

## PROBLEM 6: Modal email nie weryfikuje adresu

**Przyczyna:** `handleVerifyEmail` (linia 192-204) akceptuje DOWOLNY email. Nie sprawdza czy to email studenta przypisanego do testu.

**Rozwiazanie:** Dodac weryfikacje. Potrzebujemy email studenta. Mamy `studentId` z hooka `useWelcomeTest`. Pobrac email studenta i porownac:

```typescript
const handleVerifyEmail = async () => {
    if (!emailInput.trim()) { toast.error("Please enter your email"); return; }
    const email = emailInput.trim().toLowerCase();
    
    // Verify against student's email in DB
    if (studentId) {
        const { data } = await supabase.from('students').select('student_email').eq('id', studentId).single();
        if (data?.student_email && data.student_email.toLowerCase() !== email) {
            toast.error("This email doesn't match the student assigned to this test.");
            return;
        }
    }
    // ... rest of save logic
};
```

**Opacity/blur:** Zmienic linia 322 `opacity-70` na `opacity-50`, i overlay na linii 361 z `bg-background/50` na `bg-background/30 backdrop-blur-md`.

---

## PROBLEM 7: Brakujace tlumaczenia dla nowych jezykow

**Obecne tlumaczenia (10 jezykow):** Polish, Spanish, German, French, Portuguese, Italian, Turkish, Russian, Czech, Ukrainian

**Dostepne jezyki w profilu studenta (50):** Arabic, Bengali, Bulgarian, Catalan, Chinese, Croatian, Czech, Danish, Dutch, Finnish, French, German, Greek, Hebrew, Hindi, Hungarian, Indonesian, Italian, Japanese, Javanese, Korean, Malay, Marathi, Norwegian, Persian, Polish, Portuguese, Punjabi, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swahili, Swedish, Tagalog, Tamil, Telugu, Thai, Turkish, Ukrainian, Urdu, Vietnamese

**Brakujace tlumaczenia (40 jezykow):** Wszystkie poza 10 obecnymi.

**Realistyczne podejscie:** Dodac 10 nastepnych najpopularniejszych jezykow w kontekscie nauki angielskiego w Europie i na swiecie:
- **Dutch** (holenderski) - duzo uczniow ESL
- **Japanese** (japonski) - ogromny rynek ESL
- **Korean** (koreanski) - duzy rynek ESL
- **Chinese** (chinski) - najwiekszy rynek ESL
- **Arabic** (arabski) - duzy rynek ESL
- **Hungarian** (wegierski) - Europa srodkowa
- **Romanian** (rumunski) - Europa wschodnia
- **Greek** (grecki) - Europa poludniowa
- **Croatian** (chorwacki) - Europa srodkowa
- **Swedish** (szwedzki) - Skandynawia

**Rozwiazanie:** Dodac pelne tłumaczenia dla tych 10 jezykow (te same klucze co Polish).

---

## Podsumowanie zmian w plikach

| Plik | Zmiana | Problem |
|------|--------|---------|
| `SpeakingRecorder.tsx` | Dodac prop `onAutoSave(questionId, url)`, uzyc go w efekcie auto-save | 1.1 |
| `WelcomeTestPage.tsx` | Przekazac `onAutoSave` do SpeakingRecorder, poprawic blur modalu, dodac info o Complete | 1.1, 3, 6 |
| `useWelcomeTest.tsx` | Zamienic logowanie sekcji na `test_answer_submitted`/`welcome_test`, usunac `completed` event, poprawic payload | 2 |
| `ShareTestModal.tsx` | Dodac `testType` do body wywolania `send-test-email` | 5.1 |
| `TestDetailsView.tsx` | Naprawic liczniki Answered i Skill Score dla Quick Version | 4.1 |
| `StudentTestPage.tsx` | Dodac redirect gdy `test_type === 'welcome'` | 5.2 |
| `process-welcome-test/index.ts` | Dodac kontekst wersji do promptu AI | 4.2 |
| `events.ts` | Usunac `welcome_test_section_progress` i `welcome_test_completed` z typow | 2 |
| `welcomeTestTranslations.ts` | Dodac 10 nowych jezykow | 7 |
| SQL migracja | Usunac stare eventy `welcome_test_section_progress` i `welcome_test_completed` | 2 |
| 6 plikow dokumentacji | Zaktualizowac o Round 5 | wszystkie |

### Czego NIE zmieniamy (bezpieczne):
- Routing w `App.tsx` -- bez zmian
- Logika homework, flashcards, worksheet -- niezmieniona
- Edge functions (poza drobnym dodaniem kontekstu do promptu AI)

### Kolejnosc implementacji:
1. `SpeakingRecorder.tsx` + `WelcomeTestPage.tsx` -- auto-save fix (1.1)
2. `useWelcomeTest.tsx` + `events.ts` + SQL migracja -- event normalizacja (2)
3. `WelcomeTestPage.tsx` -- Complete button info + blur fix (3, 6)
4. `TestDetailsView.tsx` -- Quick Version liczniki (4.1)
5. `ShareTestModal.tsx` + `StudentTestPage.tsx` -- link fixes (5)
6. `process-welcome-test/index.ts` -- AI kontekst (4.2)
7. `welcomeTestTranslations.ts` -- nowe jezyki (7)
8. Dokumentacja

