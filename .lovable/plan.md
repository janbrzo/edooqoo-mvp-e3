

# Plan naprawy: 6 problemow

## PROBLEM 1: Teacher AI Evaluation Feedback (Kciuki + Modal)

### Opis
Nauczyciel widzi badge AI Evaluation w Live Session. Chcemy dodac dwa male przyciski kciukow (thumbs up/down) obok badge'a. Po kliknieciu:
1. Natychmiast zapisac do nowej tabeli `teacher_ai_eval_feedback` (kciuk up/down + kontekst)
2. Pokazac modal z opcjonalnym polem tekstowym + przyciskami "Send" i "Skip"
3. Jesli nauczyciel wpisze tekst i kliknie Send - UPDATE tego samego logu (nie nowy wiersz)
4. Jesli kliknie Skip - modal sie zamyka, log z samym kciukiem zostaje

### Zmiany techniczne

**Nowa tabela SQL** (`teacher_ai_eval_feedback`):
```sql
CREATE TABLE teacher_ai_eval_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES auth.users(id),
  worksheet_id UUID NOT NULL,
  exercise_index INTEGER NOT NULL,
  question_index INTEGER NOT NULL,
  exercise_type TEXT NOT NULL,
  quality_score NUMERIC, -- AI score (0-1)
  thumbs_up BOOLEAN NOT NULL, -- true = thumbs up, false = thumbs down
  feedback_text TEXT, -- opcjonalny komentarz nauczyciela
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE teacher_ai_eval_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage own feedback" ON teacher_ai_eval_feedback
  FOR ALL USING (auth.uid() = teacher_id);
```

**Nowy komponent** `src/components/homework/AiEvalFeedbackButtons.tsx`:
- Dwa male przyciski kciukow (ThumbsUp, ThumbsDown z lucide-react)
- Renderowany TYLKO w Live Session (prop `isLiveSession`)
- Po kliknieciu: INSERT do tabeli, otworz modal

**Nowy komponent** `src/components/homework/AiEvalFeedbackModal.tsx`:
- Dialog z textarea + "Send" + "Skip"
- Send = UPDATE wiersza w tabeli (dodaje feedback_text)
- Skip = zamknij modal

**Zmiany w `AiEvaluationBadge.tsx`**:
- Dodac opcjonalne propsy: `worksheetId`, `exerciseIndex`, `questionIndex`, `exerciseType`, `isLiveSession`, `teacherId`
- Renderowac `AiEvalFeedbackButtons` obok badge'a gdy `isLiveSession === true`

**Zmiany w `ExerciseSection.tsx`**:
- Przekazac dodatkowe propsy do `AiEvaluationBadge` w Live Session (worksheetId, exerciseIndex, exerciseType, teacherId)

**Pliki do zmiany/utworzenia**:
- NOWY: `src/components/homework/AiEvalFeedbackButtons.tsx`
- NOWY: `src/components/homework/AiEvalFeedbackModal.tsx`
- ZMIANA: `src/components/homework/AiEvaluationBadge.tsx`
- ZMIANA: `src/components/worksheet/ExerciseSection.tsx` (przekazanie propsow)
- ZMIANA: Wszystkie 7 komponentow open-ended (przekazanie propsow do AiEvaluationBadge)
- SQL: Nowa tabela + RLS

---

## PROBLEM 2: Puste nano_skill_ratings dla error-correction

### Przyczyna
W `masteryCalculator.ts` linia 266:
```typescript
const correctAnswer = sentence.correct || sentence.corrected || sentence.correct_sentence;
```
Ale w rzeczywistych danych z AI, pole nazywa sie `sentence.correction` (widoczne w `ExerciseSectionUtils.tsx` linia 241: `sentence.answer || sentence.correction`).

Brak pola `correction` w sprawdzeniu powoduje ze `correctAnswer` jest undefined, `isCorrect` pozostaje `null`, i `calculateItemMastery` zwraca `null` (hasValue: false). W efekcie `buildItemEvaluations` pomija te elementy.

### Rozwiazanie
W `masteryCalculator.ts` linia 266, dodac `sentence.correction`:
```typescript
const correctAnswer = sentence.correct || sentence.corrected || sentence.correct_sentence || sentence.correction;
```

**Plik**: `src/utils/masteryCalculator.ts`

---

## PROBLEM 3: Mastery zawsze 0 dla antonyms i matching

### Przyczyna - Antonyms/Synonyms
Student wybiera litere (A, B, C) z dropdownu. `masteryCalculator.ts` linia 247-253 probuje porownac litere z pozycja `item.definition` w tablicy:
```typescript
const allDefinitions = exerciseData.items.map((i: any) => i.definition);
const correctIndex = allDefinitions.indexOf(item.definition);
const correctLetter = String.fromCharCode(65 + correctIndex);
```

Problem: `correctIndex = allDefinitions.indexOf(item.definition)` daje pozycje w ORYGINALNEJ (nieprzetasowanej) tablicy. Ale UI tasuje definicje z seedem `syn-${itemsKey}`. Wiec "poprawna litera" obliczona przez calculator NIE odpowiada literze w UI.

### Przyczyna - Matching
Identyczny problem. Student wybiera litere oparta o przetasowana kolejnosc definicji (seed: `${worksheetId}-${itemsKey}`), ale `masteryCalculator.ts` linia 133-138 porownuje tekst odpowiedzi studenta (litere "A") z tekstem `item.definition` - co nigdy nie bedzie rowne.

### Przyczyna - Matching Halves
Algorytm shuffle w `masteryCalculator.ts` uzywa seeda `${worksheetId}-halves-${halvesKey}`, ale `exerciseData.worksheetId` moze byc undefined. W tym przypadku seed = `default-halves-...` co rozni sie od seeda uzytego w UI.

### Rozwiazanie

Dla **antonyms/synonyms** i **matching**: Musimy uzyc IDENTYCZNEGO algorytmu shuffle z identycznym seedem co UI.

W `masteryCalculator.ts`:

**Antonyms/Synonyms** - dodac shuffle z seedem `syn-${itemsKey}`:
```typescript
if ((exerciseType === 'synonyms-antonyms' || exerciseType === 'synonyms' || exerciseType === 'antonyms') && exerciseData?.items?.[itemIndex]) {
  const item = exerciseData.items[itemIndex];
  if (typeof studentAnswer === 'string' && studentAnswer.length === 1 && studentAnswer.match(/[A-Z]/i)) {
    // Reproduce same shuffle as ExerciseSynonymsAntonyms.tsx
    const itemsKey = exerciseData.items.map((i: any) => i.term).join('|');
    const seed = `syn-${itemsKey}`;
    const shuffled = shuffleArrayWithSeed(exerciseData.items, seed);
    const correctShuffledIdx = shuffled.findIndex((i: any) => i.term === item.term);
    if (correctShuffledIdx !== -1) {
      const correctLetter = String.fromCharCode(65 + correctShuffledIdx);
      isCorrect = studentAnswer.toUpperCase() === correctLetter;
    }
  }
}
```

**Matching** - dodac shuffle z seedem `${worksheetId}-${itemsKey}` lub fallback `${itemsKey}`:
```typescript
if (exerciseType === 'matching' && exerciseData?.items?.[itemIndex]) {
  const item = exerciseData.items[itemIndex];
  if (typeof studentAnswer === 'string' && studentAnswer.length === 1 && studentAnswer.match(/[A-Z]/i)) {
    const itemsKey = exerciseData.items.map((i: any) => i.term).join('|');
    const seed = exerciseData.worksheetId ? `${exerciseData.worksheetId}-${itemsKey}` : itemsKey;
    const shuffled = shuffleArrayWithSeed(exerciseData.items, seed);
    const correctShuffledIdx = shuffled.findIndex((i: any) => i.term === item.term);
    if (correctShuffledIdx !== -1) {
      const correctLetter = String.fromCharCode(65 + correctShuffledIdx);
      isCorrect = studentAnswer.toUpperCase() === correctLetter;
    }
  } else {
    // Fallback: direct text comparison
    const correctMatch = item.correct_match || item.match || item.definition;
    if (correctMatch) {
      isCorrect = String(studentAnswer).toLowerCase().trim() === String(correctMatch).toLowerCase().trim();
    }
  }
}
```

Trzeba tez dodac `shuffleArrayWithSeed` jako helper do `masteryCalculator.ts` (identyczny algorytm jak w UI).

**Matching Halves** - upewnic sie ze `worksheetId` jest przekazywany do `exerciseData`. Sprawdzic czy `useInteractiveSharedWorksheet` dodaje `worksheetId` do danych cwiczenia.

**Plik**: `src/utils/masteryCalculator.ts`

---

## PROBLEM 4: Fill in the Blanks - brak odpowiedzi studenta w Live Session

### Przyczyna
W `ExerciseFillInBlanks.tsx` layout jest:
```
flex flex-row items-start gap-2
  ├── flex-grow: sentence text + input
  └── correct answer + live answer
```

Sekcja z odpowiedzia nauczyciela (linia 155) jest w osobnej kolumnie po prawej. Odpowiedz studenta (linia 170-173) wyswietla sie jako `[{liveAnswer}]` BEZ prefiksu "Student:".

Mozliwe przyczyny:
1. `liveAnswer` jest pusty/undefined (dane nie docieraja)
2. Layout ukrywa odpowiedz (za malo miejsca w waskej kolumnie)

Po analizie kodu: dane powinny docierac (ten sam mechanizm co dla matching, word-order, itp.). Problem jest prawdopodobnie w LAYOUCIE - fill-in-blanks uzywa `flex-row` zamiast `flex-col`, wiec odpowiedz studenta jest wtloczna w waski prawy panel.

### Rozwiazanie
Zmienic layout w `ExerciseFillInBlanks.tsx` aby odpowiedz studenta byla wyswietlana PONIZEJ zdania (jak w innych komponentach), nie obok:

```tsx
{/* Live Session: show student answer in blue - BELOW sentence */}
{liveAnswer && !isInteractive && (
  <span className="text-blue-600 font-medium text-sm">
    [Student: {liveAnswer}]
  </span>
)}
```

Przeniesc live answer display z wewnetrznego `flex items-center gap-2` do poziomu wyzsszego, po sekcji z poprawna odpowiedzia.

**Plik**: `src/components/worksheet/ExerciseFillInBlanks.tsx`

---

## PROBLEM 5: AI Evaluation feedback box za wysoki

### Opis
Okienko z feedbackiem AI (np. "Great job completing the sentence!...") zabiera za duzo miejsca. Trzeba zmniejszyc wysokosc o 50%.

### Rozwiazanie
W `AiEvaluationBadge.tsx` linia 86-89, zmienic padding i font:
```tsx
{showFeedback && feedback && (
  <div className="flex items-start gap-1.5 p-1.5 bg-muted/50 rounded-lg text-xs">
    <AlertCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
    <p className="text-muted-foreground leading-tight">{feedback}</p>
  </div>
)}
```

Zmiany:
- `gap-2` → `gap-1.5`
- `p-3` → `p-1.5` (polowa paddingu)
- `text-sm` → `text-xs`
- Dodano `leading-tight` dla mniejszego line-height
- `h-4 w-4` → `h-3 w-3` (mniejsza ikona)

**Plik**: `src/components/homework/AiEvaluationBadge.tsx`

---

## PROBLEM 6: Kolejnosc elementow w Listening Comprehension i Paraphrasing w Live Session

### Przyczyna
W `ExerciseListeningComprehension.tsx` (linie 105-108) badge AI jest renderowany PRZED sekcja z suggested answer i student answer (linie 109-130).

Kolejnosc w kodzie:
1. Pytanie
2. AI Evaluation badge (linia 106) -- ZLE, za wczesnie
3. Suggested answer + Student answer

### Rozwiazanie
Przeniesc badge AI PONIZEJ sekcji z suggested answer i student answer.

**ExerciseListeningComprehension.tsx**:
```
JEST:
  pytanie → AI badge → suggested + student
POWINNO BYC:
  pytanie → suggested + student → AI badge
```

**ExerciseParaphrasing.tsx** (linie 146-148):
```
JEST:
  pytanie → AI badge → suggested + student  
POWINNO BYC:
  pytanie → suggested + student → AI badge
```

**Pliki**: 
- `src/components/worksheet/ExerciseListeningComprehension.tsx`
- `src/components/worksheet/ExerciseParaphrasing.tsx`

---

## PODSUMOWANIE ZMIAN

| # | Plik | Zmiana | Problem |
|---|------|--------|---------|
| 1 | SQL migration | Nowa tabela `teacher_ai_eval_feedback` | 1 |
| 2 | `AiEvalFeedbackButtons.tsx` (NOWY) | Kciuki up/down | 1 |
| 3 | `AiEvalFeedbackModal.tsx` (NOWY) | Modal z feedback tekstowym | 1 |
| 4 | `AiEvaluationBadge.tsx` | Dodac kciuki + zmniejszyc feedback box | 1, 5 |
| 5 | `ExerciseSection.tsx` | Przekazac propsy do AiEvaluationBadge | 1 |
| 6 | 7 komponentow open-ended | Przekazac propsy do AiEvaluationBadge | 1 |
| 7 | `masteryCalculator.ts` | Fix error-correction (dodac `correction`) | 2 |
| 8 | `masteryCalculator.ts` | Fix antonyms/synonyms shuffle | 3 |
| 9 | `masteryCalculator.ts` | Fix matching shuffle | 3 |
| 10 | `ExerciseFillInBlanks.tsx` | Fix live answer display layout | 4 |
| 11 | `ExerciseListeningComprehension.tsx` | Przeniesc AI badge po suggested answer | 6 |
| 12 | `ExerciseParaphrasing.tsx` | Przeniesc AI badge po suggested answer | 6 |
| 13 | Dokumentacja | Aktualizacja | Wszystkie |

### Bezpieczenstwo zmian

- Problem 1: Nowa tabela z RLS - zero wplywu na istniejacy kod. Kciuki renderowane TYLKO w Live Session.
- Problem 2: Dodanie jednego pola do sprawdzenia (`correction`) - czysto addytywne.
- Problem 3: Identyczny algorytm shuffle co UI - jesli UI dziala poprawnie, mastery tez bedzie poprawne. Fallback na direct text comparison zachowany.
- Problem 4: Zmiana layoutu tylko w ExerciseFillInBlanks - nie wplywa na inne komponenty.
- Problem 5: Zmiana CSS tylko - zmniejszenie padding/font.
- Problem 6: Zmiana kolejnosci renderowania w 2 komponentach - nie zmienia logiki, tylko display order.

