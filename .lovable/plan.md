

# Plan wdrozenia - 5 problemow DSLM

---

## Problem 1: Badge "ns" zamiast skrotu kategorii

### Przyczyna

Funkcja `getBadgeLabel()` w `NanoSkillBadge.tsx` (linia 46-55) sprawdza TYLKO nazwy kategorii (`grammar`, `vocabulary`, `reading` itp.), ale NIE rozpoznaje nazw topicow gramatycznych jak `present_simple`, `comparatives`, `superlatives`, `past_simple` itd.

Przyklad: `ns.B1.present_simple.inference_from_evidence` - regex `\bgrammar\b` NIE matchuje bo slowo "grammar" nie wystepuje w nazwie. W rezultacie trafia do fallbacku `return "ns"`.

Tymczasem w bazie danych istnieje funkcja SQL `extract_skill_category()`, ktora MA pelna liste topicow gramatycznych. Frontend musi uzyc tej samej logiki.

### Rozwiazanie

Przepisac `getBadgeLabel()` w `NanoSkillBadge.tsx` dodajac pelna liste topicow gramatycznych (identycznie jak w SQL `extract_skill_category`):

```text
const GRAMMAR_TOPICS = /\b(past_simple|past_continuous|past_perfect|present_simple|present_continuous|present_perfect|present_perfect_continuous|future_simple|future_going_to|future_continuous|first_conditional|second_conditional|third_conditional|mixed_conditionals|passive_voice|reported_speech|relative_clauses|modal_verbs|gerund_infinitive|phrasal_verbs|comparatives|superlatives|articles|prepositions|word_order|negative_prefixes|word_formation|sentence_transformation|error_correction)\b/;

const VOCABULARY_TOPICS = /\b(vocabulary|collocations|idioms|synonyms|antonyms)\b/;

const getBadgeLabel = (name: string): string => {
  if (/\bwriting\b/.test(name)) return "wr";
  if (/\bspeaking\b/.test(name)) return "sp";
  if (/\blistening\b/.test(name)) return "li";
  if (/\breading\b/.test(name)) return "rd";
  if (/\bvisual_comprehension\b/.test(name)) return "vc";
  if (/\bgrammar\b/.test(name) || GRAMMAR_TOPICS.test(name)) return "gr";
  if (/\bvocabulary\b/.test(name) || VOCABULARY_TOPICS.test(name)) return "vo";
  if (/\bparaphrasing\b/.test(name)) return "wr";
  if (/\bdialogue\b/.test(name)) return "sp";
  if (/\bfunctional\b/.test(name)) return "sp";
  if (/\bcomprehension\b/.test(name)) return "rd";
  return "ns";
};
```

### Plik do zmiany
- `src/components/worksheet/NanoSkillBadge.tsx` - linie 46-55

---

## Problem 2: Discussion nie ma opcji nagrywania

### Przyczyna

W `HomeworkExerciseRenderer.tsx` (linie 216-250), blok `discussion` jest renderowany INLINE jako proste textarea zamiast dedykowanego komponentu. Nie przekazuje propsow `audioAnswers` i `onAudioAnswerChange`, wiec `HomeworkSpeakingRecorder` sie nie wyswietla.

Inne typy cwiczen (reading, answer-questions, dialogue) maja dedykowane komponenty (np. `ExerciseReading`, `ExerciseDialogue`), do ktorych te propsy zostaly dodane. Discussion zostal pominiety bo jest renderowany bezposrednio w rendererze.

### Rozwiazanie

Dodac `HomeworkSpeakingRecorder` do bloku discussion w `HomeworkExerciseRenderer.tsx`, zaraz po `AutoResizeTextarea` i `AiEvaluationBadge`:

```text
// Po linii 244 (po AiEvaluationBadge), dodac:
{onAudioAnswerChange && (
  <HomeworkSpeakingRecorder
    existingAudioUrl={audioAnswers?.[qIndex]}
    onAudioSaved={(url) => onAudioAnswerChange(qIndex, url)}
    disabled={disabled}
  />
)}
```

### Plik do zmiany
- `src/components/homework/HomeworkExerciseRenderer.tsx` - blok discussion (~linia 238-245)

---

## Problem 3: UX nagrywania - za duzy, brzydki komponent

### Przyczyna

Obecny `HomeworkSpeakingRecorder` (linie 191-284) uzywa:
- Dashed border z padding i tlem (`p-3 border border-dashed rounded-lg bg-muted/20`)
- Osobnych wierszy na waveform, timer, i przyciski
- Duzych przerw (space-y-2)
- Wyswietlania pod textarea (zawsze blokowe)

### Rozwiazanie

Przepisac layout `HomeworkSpeakingRecorder.tsx` na minimalistyczny, inline:

**Stan idle**: Jeden wiersz z ikona mikrofonu i tekstem "Record" - to wszystko:
```text
[🎤 Record]
```

**Stan recording**: Jeden wiersz z timerem i stop (w tej samej linii):
```text
[● 0:12] [■ Stop]
```

**Stan recorded**: Play, Re-record, Save - w jednej linii:
```text
[▶ Play] [↺ Re-record] [💾 Save]
```

**Stan done**: Minimalne potwierdzenie:
```text
[✓ Saved] [▶] [↺ Re-record]
```

Kluczowe zmiany CSS:
1. Usunac `space-y-2 p-3 border border-dashed rounded-lg bg-muted/20` - zastapic `flex items-center gap-1.5 flex-wrap`
2. Usunac waveform animation (linie 198-211) - niepotrzebna
3. Usunac osobny wiersz na timer - wstawic timer inline w przycisk Stop
4. Wszystko w jednej linii

**Pozycjonowanie w cwiczeniach**:
- W cwiczeniach 1-kolumnowych (answer-questions, discussion, dialogue): recorder obok textarea (po lewej stronie pola tekstowego lub nad nim w jednym wierszu z labelka)
- W cwiczeniach 2-kolumnowych (reading): recorder pod textarea (bo nie ma miejsca obok)

Zmiany w komponentach cwiczen:
- `ExerciseAnswerQuestions.tsx` - owinac textarea + recorder we `flex items-start gap-2`
- `ExerciseReading.tsx` - recorder zostaje pod (bo 2 kolumny)
- `ExerciseDialogue.tsx` - recorder inline obok
- `HomeworkExerciseRenderer.tsx` (discussion) - recorder inline obok
- Pozostale (ListeningComprehension, AnswerQuestionsAudio, Paraphrasing, Describe) - analogicznie

### Pelny nowy kod HomeworkSpeakingRecorder:

```text
return (
  <div className="flex items-center gap-1.5 flex-wrap py-0.5">
    {(status === 'idle' || status === 'error') && (
      <Button onClick={startRecording} variant="ghost" size="sm" 
        disabled={disabled} className="gap-1 h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
        <Mic className="h-3 w-3 text-red-400" />
        Record
      </Button>
    )}

    {status === 'recording' && (
      <>
        <span className="flex items-center gap-1 text-xs text-red-500">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          {formatTime(seconds)}
        </span>
        <Button onClick={stopRecording} variant="ghost" size="sm" className="gap-1 h-7 px-2 text-xs">
          <Square className="h-2.5 w-2.5" />
          Stop
        </Button>
      </>
    )}

    {status === 'recorded' && (
      <>
        <Button onClick={isPlaying ? pauseAudio : playAudio} variant="ghost" size="sm" className="h-7 px-2 text-xs">
          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </Button>
        <Button onClick={resetRecording} variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <RotateCcw className="h-3 w-3" />
        </Button>
        <Button onClick={uploadAndSave} variant="ghost" size="sm" className="gap-1 h-7 px-2 text-xs text-green-600">
          <Upload className="h-3 w-3" />
          Save
        </Button>
      </>
    )}

    {status === 'uploading' && (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving...
      </span>
    )}

    {status === 'done' && (
      <>
        <span className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="h-3 w-3" />
          Saved
        </span>
        {audioUrl && (
          <Button onClick={isPlaying ? pauseAudio : playAudio} variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
        )}
        <Button onClick={resetRecording} variant="ghost" size="sm" disabled={disabled} className="h-6 px-1 text-xs">
          <RotateCcw className="h-3 w-3" />
        </Button>
      </>
    )}

    {status === 'error' && errorMsg && (
      <span className="text-xs text-destructive flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        {errorMsg}
      </span>
    )}
  </div>
);
```

### Pliki do zmiany
- `src/components/homework/HomeworkSpeakingRecorder.tsx` - kompletne przepisanie UI
- `src/components/worksheet/ExerciseAnswerQuestions.tsx` - layout inline
- `src/components/worksheet/ExerciseDialogue.tsx` - layout inline  
- `src/components/homework/HomeworkExerciseRenderer.tsx` - discussion layout inline
- `src/components/worksheet/ExerciseReading.tsx` - zostaje pod (2 kolumny)
- `src/components/worksheet/ExerciseListeningComprehension.tsx` - layout inline
- `src/components/worksheet/ExerciseAnswerQuestionsAudio.tsx` - layout inline
- `src/components/worksheet/ExerciseParaphrasing.tsx` - layout inline
- `src/components/worksheet/ExerciseDescribe.tsx` - layout inline

---

## Problem 4: Confidence nano_skill dla speaking - rozne wartosci

### Obecny stan

Confidence dla speaking nano_skill jest STATYCZNY (0.35-0.45) ustawiany przy generowaniu worksheetu. Nie zmienia sie w zaleznosci od tego jak student odpowiada.

### Rozwiazanie

Logika confidence powinna byc dynamiczna w `masteryCalculator.ts` - w funkcji `buildItemEvaluations` (ktora oblicza mastery dla kazdego nano_skill):

**Scenariusze confidence dla nano_skill z `.speaking.`/`.sp.`:**

| Scenariusz | Odpowiedz | Confidence speaking | Confidence writing | Uzasadnienie |
|---|---|---|---|---|
| A: Tylko tekst | Napisana | 0.30 (niska, posrednia ocena) | 0.90 (wysoka, bezposrednia) | Tekst nie mowi nic o umiejetnosciach mowienia |
| B: Tylko nagranie | Nagrana | 0.90 (wysoka, bezposrednia) | 0.70 (srednia, z transkrypcji) | Transkrypcja daje posredni wglad w pisanie |
| C: Oba | Napisana + nagrana | 0.90 (wysoka) | 0.90 (wysoka) | Oba bezposrednio ocenione |
| D: Brak odpowiedzi | Pusta | Pomin | Pomin | Nic do oceny |

### Implementacja w `masteryCalculator.ts`:

W funkcji `buildItemEvaluations`, po otrzymaniu wyniku AI eval, modyfikowac confidence przed zapisem do `student_events`:

```text
// W buildItemEvaluations, po mapowaniu AI eval results:
for (const nanoSkill of itemNanoSkills) {
  const hasAudioAnswer = audioAnswers?.[questionIndex] != null;
  const hasTextAnswer = textAnswers?.[questionIndex] != null && textAnswers[questionIndex].trim() !== '';
  
  if (nanoSkill.name.includes('.speaking.') || nanoSkill.name.includes('.sp.')) {
    if (hasAudioAnswer) {
      nanoSkill.confidence = 0.90; // Bezposrednia ocena mowienia
    } else if (hasTextAnswer) {
      nanoSkill.confidence = 0.30; // Tylko posrednia ocena (z tekstu)
    }
  }
  
  if (nanoSkill.name.includes('.writing.') || nanoSkill.name.includes('.wr.')) {
    if (hasTextAnswer) {
      nanoSkill.confidence = 0.90; // Bezposrednia ocena pisania
    } else if (hasAudioAnswer) {
      nanoSkill.confidence = 0.70; // Posrednia ocena (z transkrypcji)
    }
  }
}
```

Ta logika musi byc zastosowana w:
- `src/hooks/useInteractiveHomework.tsx` - przy budowaniu eventow do `student_events`
- `src/hooks/useInteractiveSharedWorksheet.tsx` - analogicznie

### Pliki do zmiany
- `src/utils/masteryCalculator.ts` - nowa funkcja `adjustConfidenceByAnswerType()`
- `src/hooks/useInteractiveHomework.tsx` - wywolanie adjustConfidence
- `src/hooks/useInteractiveSharedWorksheet.tsx` - analogicznie

---

## Problem 5: Puste anonimowe konta w bazie

### Analiza

W bazie jest **1469 anonimowych kont** (is_anonymous=true, email=null), utworzonych od 2025-04-22 do 2025-12-21. 

Dobre wiesci: po poprawkach `useAnonymousAuth` (ktory teraz NIE tworzy automatycznie kont) **nowe konta anonimowe przestaly sie tworzyc** - ostatnie jest z 2025-12-21.

Zrodlo problemu: stara wersja `useAnonymousAuth` automatycznie wywolywala `signInAnonymously()` przy kazdej wizycie. Teraz hook `useAnonymousAuth` jest uzywany w 2 miejscach:
- `WorksheetForm/index.tsx` - pobiera `userId` do trackingu
- `useWorksheetRating.ts` - pobiera `userId` do feedbacku

Oba juz NIE wywoluja `signInAnonymously()` - tylko sprawdzaja istniejaca sesje.

### Rozwiazanie

**A. Usunac stare anonimowe konta z bazy:**

SQL migration:

```sql
-- Krok 1: Usunac powiazane profile (jesli istnieja)
DELETE FROM public.profiles 
WHERE id IN (SELECT id FROM auth.users WHERE is_anonymous = true AND email IS NULL);

-- Krok 2: Usunac konta anonimowe z auth.users
-- UWAGA: To wymaga service_role - wykonac przez Edge Function
```

Poniewaz nie mozna bezposrednio usuwac z `auth.users` przez migracje SQL, potrzebujemy Edge Function:

**Nowa Edge Function `cleanup-anonymous-users/index.ts`**:

```text
Logika:
1. Sprawdz ze caller ma role 'admin'
2. Pobierz liste uzytkownikow z is_anonymous=true AND email IS NULL
3. Dla kazdego: supabaseAdmin.auth.admin.deleteUser(userId)
4. Usun powiazane profile (jesli zostaly)
5. Zwroc { deleted_count: N }
```

**B. Wylaczenie anonimowej autentykacji w Supabase:**

W panelu Supabase: Authentication -> Providers -> Anonymous Sign-In -> WYLACZ

To uniemozliwi tworzenie nowych anonimowych kont nawet jesli ktos by wywolal `signInAnonymously()`.

**C. Sprzatanie kodu:**

Hook `useAnonymousAuth.tsx` - usunac funkcje `signInAnonymously` calkowicie, zostawic tylko sprawdzanie sesji. Mozna tez rozwazyc wyeliminowanie calego hooka i zastapienie go prostym `useAuthFlow`.

Hook `useAuthFlow.tsx` - usunac `signInAnonymously` z returnowanych wartosci.

### Pliki do zmiany
- Nowa Edge Function: `supabase/functions/cleanup-anonymous-users/index.ts`
- `src/hooks/useAnonymousAuth.tsx` - usunac signInAnonymously
- `src/hooks/useAuthFlow.tsx` - usunac signInAnonymously
- `supabase/config.toml` - dodac config dla nowej edge function
- Supabase Dashboard: wylaczenie Anonymous Sign-In

---

## Kolejnosc implementacji

1. **Problem 1** (NanoSkillBadge labels) - szybki fix, 1 plik
2. **Problem 2** (Discussion speaking) - 1 linia w 1 pliku
3. **Problem 3** (UX recorder) - przepisanie komponentu + drobne zmiany w 8 plikach
4. **Problem 4** (Confidence dynamiczny) - logika w 3 plikach
5. **Problem 5** (Anonimowe konta) - Edge Function + cleanup + kod

## Pelne podsumowanie plikow do zmiany

| Plik | Problem | Zmiana |
|---|---|---|
| `src/components/worksheet/NanoSkillBadge.tsx` | 1 | Rozszerzyc getBadgeLabel o topiki gramatyczne i vocabulary |
| `src/components/homework/HomeworkExerciseRenderer.tsx` | 2, 3 | Dodac recorder do discussion + layout inline |
| `src/components/homework/HomeworkSpeakingRecorder.tsx` | 3 | Przepisanie UI na minimalistyczny inline |
| `src/components/worksheet/ExerciseAnswerQuestions.tsx` | 3 | Layout recorder inline obok textarea |
| `src/components/worksheet/ExerciseDialogue.tsx` | 3 | Layout recorder inline |
| `src/components/worksheet/ExerciseReading.tsx` | 3 | Zostaje pod (2 kolumny) |
| `src/components/worksheet/ExerciseListeningComprehension.tsx` | 3 | Layout recorder inline |
| `src/components/worksheet/ExerciseAnswerQuestionsAudio.tsx` | 3 | Layout recorder inline |
| `src/components/worksheet/ExerciseParaphrasing.tsx` | 3 | Layout recorder inline |
| `src/components/worksheet/ExerciseDescribe.tsx` | 3 | Layout recorder inline |
| `src/utils/masteryCalculator.ts` | 4 | Nowa funkcja adjustConfidenceByAnswerType |
| `src/hooks/useInteractiveHomework.tsx` | 4 | Wywolanie adjustConfidence |
| `src/hooks/useInteractiveSharedWorksheet.tsx` | 4 | Analogicznie |
| Nowy: `supabase/functions/cleanup-anonymous-users/index.ts` | 5 | Edge Function czyszczaca |
| `src/hooks/useAnonymousAuth.tsx` | 5 | Usunac signInAnonymously |
| `src/hooks/useAuthFlow.tsx` | 5 | Usunac signInAnonymously |
| `supabase/config.toml` | 5 | Config nowej edge function |
| Dokumentacja (6 plikow) | Wszystkie | Aktualizacja |

