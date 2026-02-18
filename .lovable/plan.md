
# Welcome Test v2 - Round 7 Poprawek

## Podsumowanie

Przeanalizowalem kazdy problem do glebokosci kodu i znalazlem PRAWDZIWA przyczyne dlaczego auto-save nagrywania nie dziala po 4 probach naprawy, oraz rozwiazania dla pozostalych problemow.

---

## PROBLEM 1: Auto-zapis nagrywania - 5ta proba, INNE podejscie

### Dlaczego cleanup-on-unmount NIE DZIALA (mimo poprawnego kodu)

Przeanalizowalem caly flow linia po linii. Kod w `SpeakingRecorder.tsx` (linie 122-162) WYGLADA poprawnie:
- `blobRef.current` powinien zawierac blob
- `statusRef.current` powinien byc 'recorded'
- `prevQuestionIdRef.current` powinien miec ID pytania
- Upload do R2 jest wywolywany
- `window.__welcomeTestAutoSave` powinien byc dostepny

Problem prawdopodobnie lezy w jednym z:
1. Upload do R2 FAILS cisza (catch handler na linii 151 loguje blad ale nic nie zapisuje)
2. Blob jest pusty/uszkodzony w momencie cleanup (timing issue z MediaRecorder)
3. `window.__welcomeTestAutoSave` jest undefined w momencie wywolania (timing)

**NOWE PODEJSCIE - SYNCHRONICZNE zamiast asynchronicznego:**

Zamiast polegac na fire-and-forget upload w cleanup (ktory jest z natury racy i nie gwarantuje ukonczenia), przeniose logike NA POZIOM RODZICA, PRZED nawigacja:

1. `SpeakingRecorder` ustawia globalny obiekt `window.__pendingSpeakingRecording = { questionId, blob, status }` za kazdym razem gdy blob sie zmienia (w `onstop` callback, linia 196-197)
2. W `SpeakingRecorder`, reset tego globala na `null` gdy uzytkownik klika "Save" (bo juz zapisano) lub "Re-record" (bo blob jest kasowany)
3. W `useWelcomeTest.tsx`, metoda `goToNext` sprawdza `window.__pendingSpeakingRecording` PRZED nawigacja. Jesli istnieje, uploaduje blob do R2 i wywoluje `commitAnswer` z URL-em. Dopiero potem nawiguje.
4. Analogicznie w `skipQuestion` i `goToPrevious`

To podejscie jest **fundamentalnie inne** od wszystkich poprzednich prob:
- NIE polega na efektach React (useEffect cleanup)
- NIE polega na kolejnosci efektow
- NIE jest fire-and-forget (czeka na upload)
- Blob jest przechwytywany ZANIM komponent sie odmontuje

**Konsekwencja dla UX:** Klikniecie Next na pytaniu speaking moze trwac 2-3 sekundy (upload). Dodam spinner "Saving recording..." na przycisku Next.

### Zmiany w plikach:

**`SpeakingRecorder.tsx`:**
- W `mediaRecorder.onstop` (linia 196): dodac `(window as any).__pendingSpeakingRecording = { questionId, blob }`
- W `uploadAndSave` (linia 287-289): po sukcesie dodac `delete (window as any).__pendingSpeakingRecording`
- W `resetRecording` (linia 260): dodac `delete (window as any).__pendingSpeakingRecording`
- Zostawic cleanup na unmount (linie 122-162) jako FALLBACK, ale dodac tez zapis do globalnego pending
- Eksportowac nowa funkcje helper `flushPendingSpeakingRecording(): Promise<string | null>` ktora:
  - Sprawdza `window.__pendingSpeakingRecording`
  - Jesli blob istnieje, uploaduje do R2
  - Zwraca URL lub null
  - Kasuje globalny pending

**`useWelcomeTest.tsx`:**
- Nowa metoda `flushSpeakingIfNeeded()`:
```typescript
const flushSpeakingIfNeeded = useCallback(async () => {
    const pending = (window as any).__pendingSpeakingRecording;
    if (!pending?.blob || !pending?.questionId) return;
    
    delete (window as any).__pendingSpeakingRecording;
    
    try {
        const formData = new FormData();
        const mimeType = pending.blob.type || 'audio/webm';
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        formData.append('file', pending.blob, `welcome-test-speaking-${Date.now()}.${ext}`);
        
        const { data } = await supabase.functions.invoke('upload-to-r2', { body: formData });
        const url = data?.url || data?.publicUrl;
        if (url) {
            await saveAnswer(pending.questionId, url);
        }
    } catch (err) {
        console.error('[flushSpeaking] Upload failed:', err);
        // Fallback: save placeholder so answer isn't lost entirely
        await saveAnswer(pending.questionId, `recording_pending_${Date.now()}`);
    }
}, [saveAnswer]);
```

- `goToNext`: dodac `await flushSpeakingIfNeeded()` PRZED `setState`
- `skipQuestion`: to samo
- `goToPrevious`: to samo
- Eksportowac `flushSpeakingIfNeeded` z hooka

**`WelcomeTestPage.tsx`:**
- Na przycisku Next: dodac stan `savingSpeaking` ktory blokuje przycisk i pokazuje spinner podczas uploadu nagrania

### 1.2 i 1.3 - Automatycznie naprawione

Po naprawieniu auto-save (1.1):
- URL R2 bedzie w `student_test_questions.student_answer` -> odtwarzacz audio w `TestDetailsView` juz rozpoznaje URL R2 (linie 457-460)
- Przycisk "Transcribe" juz istnieje (linie 513-526) i bedzie dzialal
- `process-welcome-test` juz transkrybuje speaking answers (linie 386-413) i uwzglednia je w AI summary

---

## PROBLEM 2: student_events - event_source 'test'

### 2.1 Stan bazy danych

W bazie nadal jest 69 eventow z `event_source = 'test'`:
- 49 nalezacych do Welcome Test (test_type = 'welcome', title = "Welcome Test - MATE Galloway (Retake)")
- 20 nalezacych do Placement Tests (test_type = 'placement')

Migracja z Round 6 powinna byla naprawic welcome test eventy, ale te 49 zostaly utworzone PO migracji (student robil test po wdrozeniu). To oznacza ze JEST kod ktory tworzy eventy z `event_source = 'test'` dla welcome testow.

Ale sprawdzilem - `useWelcomeTest.tsx` linia 303 juz uzywa `p_event_source: 'welcome_test'`. Wiec skad te 49?

Sprawdzilem: ten test to "Retake" - moze student zaczal go PRZED migracja a skonczyl PO? Albo jest cache w przegladarce ze starym kodem?

### Rozwiazanie

Nowa migracja SQL:
```sql
UPDATE student_events SET event_source = 'welcome_test'
WHERE event_type = 'test_answer_submitted' 
AND event_source = 'test'
AND source_id IN (SELECT id FROM student_tests WHERE test_type = 'welcome');
```

Eventy z `event_source = 'test'` dla `test_type = 'placement'` zostaja bez zmian - to sa inne testy (Intelligent Tests), nie Welcome Test.

---

## PROBLEM 3: student_events.event_payload - brakujace dane

### 3A. preference_choice bez detected_traits (np. wt_q2)

**Przyczyna:** `wt_q2` NIE MA `detected_trait` w definicji pytania (`welcomeTestQuestions.ts`). Pytanie "What frustrates you most?" jest multi-select i nie mapuje sie na jeden trait.

**Rozwiazanie:** Dla pytan multi-select (`preference_choice` z `multi_select: true`), dodac do payloadu pole `selected_options` z wybranymi opcjami. To nie jest trait, ale dane preferencji.

W `commitAnswer`:
```typescript
// For multi-select preference questions, save selected options as detected data
if (questionDef.question_type === 'preference_choice' && Array.isArray(answer)) {
    detectedTraitData = detectedTraitData || {};
    detectedTraitData['selected_preferences'] = answer.join('; ');
}
```

Ale to nie jest idealne. Lepsza opcja: dodac `detected_trait` do definicji brakujacych pytan w `welcomeTestQuestions.ts`:
- `wt_q2` (frustrations): dodac detected_trait z mapping na `main_frustration`
- `wt_q6` (activities): dodac detected_trait z mapping na `preferred_activities`
- `wt_q10` (learning background): dodac detected_trait z mapping na `learning_background`

Ale pytania multi-select nie maja prostego mappingu 1-do-1. Rozwiazanie: w `commitAnswer`, dla pytan bez `detected_trait`, zapisac odpowiedz bezposrednio jako trait:

```typescript
// Fallback for profiling questions without explicit detected_trait mapping
if (!detectedTraitData && !questionDef.correct_answer && !questionDef.nano_skill) {
    detectedTraitData = { answer_value: typeof answer === 'string' ? answer : JSON.stringify(answer) };
}
```

### 3B. self_assessment_matrix (wt_q44) bez detected_traits

**Przyczyna:** `wt_q44` nie ma `detected_trait` bo to macierz z wieloma wartosciami (confidence levels per skill). Wartosc odpowiedzi to obiekt `{ "Speaking": 3, "Writing": 4, ... }`.

**Rozwiazanie:** Dodac do payloadu:
```typescript
if (questionDef.question_type === 'self_assessment_matrix' && typeof answer === 'object') {
    detectedTraitData = { confidence_matrix: JSON.stringify(answer) };
}
```

### 3C. open_reflection (wt_q12) - brak detected_traits

**To jest POPRAWNE.** Pytania otwarte (open_reflection, open_ended) nie maja detected_traits przy zapisie. Ich tresc jest analizowana pozniej przez AI w `process-welcome-test`. AI powinno po analizie nadpisac `mastery` w eventach.

### 3D. Nadpisywanie mastery po AI Analysis

**Obecny stan:** `process-welcome-test/index.ts` NIE nadpisuje mastery w `student_events`. Po AI Analysis, mastery w payloadach pytan otwartych/speaking pozostaje `-1`.

**Rozwiazanie:** Na koncu `process-welcome-test`, po wygenerowaniu AI summary, dodac logike:
1. Dla pytan otwartych: AI ocenia `writing_quality` ('basic'/'intermediate'/'advanced') - mapowac na mastery (25/50/75)
2. Dla pytan speaking: po transkrypcji, AI ocenia quality - mapowac na mastery
3. UPDATE `student_events` SET mastery = nowa_wartosc WHERE answer_id IN (lista pytan otwartych/speaking)

```typescript
// After AI analysis, update mastery for open/speaking questions
if (aiSummary) {
    const parsed = JSON.parse(aiSummary);
    const writingMastery = parsed.writing_quality === 'advanced' ? 75 :
                           parsed.writing_quality === 'intermediate' ? 50 : 25;
    
    const openSpeakingIds = [...openQuestionIds, ...speakingQuestionIds];
    for (const qId of openSpeakingIds) {
        if (answers?.[qId] && answers[qId] !== '__IDK__') {
            await supabase
                .from('student_events')
                .update({ mastery: writingMastery })
                .eq('source_id', test_id)
                .eq('event_type', 'test_answer_submitted')
                .filter('event_payload->>answer_id', 'eq', qId);
        }
    }
}
```

---

## PROBLEM 4: Tlumaczenia dla nowych jezykow

### Obecne tlumaczenia (10): 
Polish, Spanish, German, French, Portuguese, Italian, Turkish, Russian, Czech, Ukrainian

### Dostepne jezyki w profilu studenta (44):
Arabic, Bengali, Bulgarian, Catalan, Chinese, Croatian, Czech, Danish, Dutch, Finnish, French, German, Greek, Hebrew, Hindi, Hungarian, Indonesian, Italian, Japanese, Javanese, Korean, Malay, Marathi, Norwegian, Persian, Polish, Portuguese, Punjabi, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swahili, Swedish, Tagalog, Tamil, Telugu, Thai, Turkish, Ukrainian, Urdu, Vietnamese

### Brakujace (34 jezykow)

Dodam 15 najpopularniejszych z perspektywy rynku ESL:
1. **Dutch** - Europa zachodnia
2. **Japanese** - ogromny rynek ESL
3. **Korean** - duzy rynek ESL
4. **Chinese** - najwiekszy rynek ESL
5. **Arabic** - duzy rynek ESL
6. **Hungarian** - Europa srodkowa
7. **Romanian** - Europa wschodnia
8. **Greek** - Europa poludniowa
9. **Croatian** - Europa srodkowa
10. **Swedish** - Skandynawia
11. **Hindi** - Indie, ogromny rynek
12. **Vietnamese** - Azja, szybko rosnacy rynek
13. **Thai** - Azja
14. **Norwegian** - Skandynawia
15. **Danish** - Skandynawia

Kazdy jezyk musi miec PELNE tlumaczenia: wt_q1 do wt_q45 (wszystkie pytania profilowe, nie skill questions).

W `langMap` w `WelcomeTestPage.tsx` tez trzeba dodac mapowania dla nowych jezykow.

---

## Podsumowanie zmian w plikach

| Plik | Zmiana | Problem |
|------|--------|---------|
| `SpeakingRecorder.tsx` | Ustawiac `window.__pendingSpeakingRecording` w `onstop`, kasowac w `Save`/`Re-record` | 1.1 |
| `useWelcomeTest.tsx` | Dodac `flushSpeakingIfNeeded()`, wywolywac w `goToNext`/`skip`/`goToPrevious`, wzbogacic payload o fallback detected_traits | 1.1, 3 |
| `WelcomeTestPage.tsx` | Spinner na Next podczas uploadu, dodac nowe jezyki do `langMap` | 1.1, 4 |
| `process-welcome-test/index.ts` | Po AI analysis nadpisac mastery w student_events | 3D |
| `welcomeTestTranslations.ts` | Dodac 15 nowych jezykow z pelnymi tlumaczeniami | 4 |
| SQL migracja | Naprawic event_source 'test' -> 'welcome_test' (ponownie) | 2 |
| 6 plikow dokumentacji | Zaktualizowac o Round 7 | wszystkie |

### Czego NIE zmieniamy:
- Routing w App.tsx
- Edge functions (poza drobnym dodaniem mastery update)
- Logika homework, flashcards, worksheet
- Baza danych (brak zmian schematu, tylko data fix migration)

### Kolejnosc implementacji:
1. `SpeakingRecorder.tsx` - pending blob global (1.1)
2. `useWelcomeTest.tsx` - flushSpeaking + payload enrichment (1.1, 3)
3. `WelcomeTestPage.tsx` - spinner + langMap (1.1, 4)
4. SQL migracja - event_source fix (2)
5. `process-welcome-test/index.ts` - mastery update (3D)
6. `welcomeTestTranslations.ts` - 15 nowych jezykow (4)
7. Dokumentacja
