
# Plan naprawy: 4 problemy

## PROBLEM 1: Brak AI Evaluation w Live Session dla wiekszosci typow open-ended

### Przyczyna (POTWIERDZONA w kodzie)

We WSZYSTKICH komponentach open-ended (ExerciseReading, ExerciseDialogue, ExerciseDescribe, ExerciseAnswerQuestions, ExerciseAnswerQuestionsAudio, ExerciseListeningComprehension, ExerciseParaphrasing) badge `AiEvaluationBadge` jest umieszczony WEWNATRZ bloku `{isInteractive && (...)}`.

W trybie Live Session nauczyciel widzi worksheet przez `WorksheetContent`, ktory NIE przekazuje `isInteractive` do `ExerciseSection` (defaults to `false`). Skutek: caly blok z inputem studenta i badge'em AI jest ukryty.

Wyjatki:
- **Discussion** - badge jest na liniach 1035-1038 w `ExerciseSection.tsx`, POZA blokiem `{isInteractive}` - dlatego DZIALA
- **Reading** - badge jest WEWNATRZ `{isInteractive}` w `ExerciseReading.tsx` - user twierdzi ze dziala, ale wg kodu nie powinno (mozliwe ze user widzi starsze dane lub myli z Discussion)

### Rozwiazanie

W KAZDYM z 7 komponentow open-ended dodac OSOBNY rendering badge'a AI POZA blokiem `{isInteractive}`, widoczny w trybie teacher/live-session:

```typescript
{/* AI Evaluation badge for teacher/live-session view (outside interactive block) */}
{!isInteractive && aiEvaluations?.[qIndex] && isSharedWorksheet && (
  <AiEvaluationBadge evaluation={aiEvaluations[qIndex]} showFeedback={true} />
)}
```

Ten dodatkowy badge pojawi sie:
- W Live Session (isSharedWorksheet=true z ExerciseSection, isInteractive=false)
- NIE pojawi sie na zwyklym worksheecie nauczyciela (isSharedWorksheet=false)
- NIE zduplikuje sie na shared worksheet studenta (isInteractive=true, wiec ten warunek jest false, a istniejacy badge w bloku isInteractive dalej dziala)

Pliki do zmiany (7):
1. `ExerciseReading.tsx` - po bloku `{(viewMode === 'teacher' || showCorrectAnswers)...}` (~linia 123)
2. `ExerciseDialogue.tsx` - po bloku `{liveAnswer && !isInteractive...}` (~linia 161)
3. `ExerciseDescribe.tsx` - po bloku interaktywnym (~linia 118)
4. `ExerciseAnswerQuestions.tsx` - po bloku `{isInteractive}` (~linia 206)
5. `ExerciseAnswerQuestionsAudio.tsx` - analogicznie
6. `ExerciseListeningComprehension.tsx` - analogicznie
7. `ExerciseParaphrasing.tsx` - analogicznie

---

## PROBLEM 2: Puste nano_skill_ratings dla zamknietych cwiczen

### Przyczyna (POTWIERDZONA w kodzie)

W `useInteractiveSharedWorksheet.tsx` linia 186:
```typescript
const hasRealAiEval = itemEvaluations?.some(e => e.hasValue !== false && e.mastery > 0);
```

Warunek `e.mastery > 0` ODFILTROWUJE poprawnie obliczone BLEDNE odpowiedzi (mastery=0, hasValue=true). Jesli student odpowiedzial ZLE na wszystkie pytania w cwiczeniu, kazdy element ma mastery=0 i `e.mastery > 0` jest false dla wszystkich. W efekcie `hasRealAiEval = false` i wysylane jest `null` zamiast ocen.

Dodatkowo, `calculateItemMastery` moze zwracac `null` (zamiast 0 lub 100) dla niektorych typow cwiczen gdy struktura danych z AI nie pasuje do oczekiwanych pol (np. matching items bez pola `correct_match`/`match`/`definition` w oczekiwanym formacie, albo antonyms items bez odpowiednich pol).

### Rozwiazanie

**Etap A**: Zmienic warunek w `useInteractiveSharedWorksheet.tsx`:
```typescript
// BYLO (odfiltrowuje mastery=0 blednie):
const hasRealAiEval = itemEvaluations?.some(e => e.hasValue !== false && e.mastery > 0);

// BEDZIE (sprawdza TYLKO hasValue):
const hasRealAiEval = itemEvaluations?.some(e => e.hasValue !== false);
```

To zachowa evaluations dla zamknietych cwiczen nawet gdy wszystkie odpowiedzi sa bledne.

**Etap B**: Poprawic `calculateItemMastery` w `masteryCalculator.ts` dla matching - dodac obsluge letter-based answers:
```typescript
// Matching - letter-based (A, B, C...) with shuffled definitions
if (exerciseType === 'matching' && exerciseData?.items?.[itemIndex]) {
  const item = exerciseData.items[itemIndex];
  // For letter-based answers, can't verify without shuffle seed
  // Return null (can't determine) - will still log with hasValue=false
  if (typeof studentAnswer === 'string' && studentAnswer.length === 1 && studentAnswer.match(/[A-Z]/i)) {
    // Letter answer - need shuffle context we don't have here
    // Try direct text comparison as fallback
    const correctMatch = item.correct_match || item.match || item.definition;
    if (correctMatch) {
      isCorrect = String(studentAnswer).toLowerCase().trim() === String(correctMatch).toLowerCase().trim();
    }
  } else {
    const correctMatch = item.correct_match || item.match || item.definition;
    if (correctMatch) {
      isCorrect = String(studentAnswer).toLowerCase().trim() === String(correctMatch).toLowerCase().trim();
    }
  }
}
```

Uwaga: Matching z literami (A, B, C) wymaga kontekstu shuffle seed ktorego nie ma w `calculateItemMastery`. Dlatego `isCorrect` pozostanie `null` → `hasValue: false`. ALE po poprawce etapu A, caly `itemEvaluations` array BEDZIE wysylany do bazy (bo inne elementy w nim moga miec `hasValue: true`). Trigger SQL i tak loguje caly payload.

Faktycznie glowna naprawa to Etap A - zmiana warunku. To sprawi ze evaluations trafia do bazy i do student_events.

---

## PROBLEM 3: Picture hint dla ExerciseDescribe, ExerciseAnswerQuestions, ExerciseMultipleChoice

### Rozwiazanie

Dodac hint "Look at the picture" w trzech komponentach, warunkowany na typ cwiczenia:

1. **ExerciseDescribe.tsx** - juz ma hint na liniach 51-54 (ale tylko gdy `!image_url`). Trzeba dodac prop `exerciseVariant` i wyswietlic hint odpowiednio.
2. **ExerciseAnswerQuestions.tsx** - nie ma hinta. Dodac na poczatku komponentu, przed pytaniami.
3. **ExerciseMultipleChoice.tsx** - nie ma hinta. Dodac analogicznie.

Kazdy komponent potrzebuje nowego opcjonalnego propa `exerciseVariant?: 'audio' | 'picture' | 'plain'` (domyslnie `'plain'`).

W `ExerciseSection.tsx` przekazac `exerciseVariant` do tych komponentow:
```typescript
exerciseVariant={exercise.type.includes('-picture') ? 'picture' : exercise.type.includes('-audio') ? 'audio' : 'plain'}
```

Hint dla picture:
```tsx
{exerciseVariant === 'picture' && (
  <div className="text-center text-sm text-muted-foreground py-2 bg-amber-50 border border-amber-200 rounded-lg mb-4">
    🖼️ Look at the picture in the Lesson Media section above before answering
  </div>
)}
```

Pliki do zmiany:
- `ExerciseDescribe.tsx` - dodac prop i hint
- `ExerciseAnswerQuestions.tsx` - dodac prop i hint
- `ExerciseMultipleChoice.tsx` - dodac prop i hint
- `ExerciseSection.tsx` - przekazac exerciseVariant do tych 3 komponentow

---

## PROBLEM 4: Wyswietlanie "Waiting for AI evaluation..." badge zamiast ukrywania

### Rozwiazanie

Zmienic `AiEvaluationBadge.tsx` aby obslugiwac stan "pending":
- Dodac nowy eksport `AiEvaluationPendingBadge` LUB dodac prop `isPending` do istniejacego komponentu

Prostsze rozwiazanie: zmienic logike filtrowania w `convertItemEvalsToAiEvals` i `convertLiveEvalsToAiEvals`. Zamiast pomijac elementy z `hasValue === false`, tworzyc specjalny obiekt "pending":

```typescript
// W konwerterach - ZAMIAST return (pomijanie):
if (item.hasValue === false) {
  result[item.question_index] = {
    is_acceptable: false,
    quality_score: -1, // Special sentinel value for "pending"
    feedback: '',
    question_index: item.question_index
  };
  return;
}
```

W `AiEvaluationBadge.tsx` dodac obsluge `quality_score === -1`:
```tsx
// Na poczatku renderowania:
if (quality_score < 0) {
  return (
    <div className="mt-3">
      <Badge className="bg-gray-400 hover:bg-gray-500 text-white">
        <Clock className="h-3 w-3 mr-1 animate-pulse" />
        Waiting for AI evaluation...
      </Badge>
    </div>
  );
}
```

Pliki do zmiany:
- `AiEvaluationBadge.tsx` - dodac pending state
- `SharedWorksheetContent.tsx` - zmienic `convertItemEvalsToAiEvals` aby nie pomijac pending
- `ExerciseSection.tsx` - zmienic `convertLiveEvalsToAiEvals` aby nie pomijac pending

---

## PODSUMOWANIE ZMIAN

| # | Plik | Zmiana | Problem |
|---|------|--------|---------|
| 1 | `src/hooks/useInteractiveSharedWorksheet.tsx` | Zmienic `e.mastery > 0` na sprawdzanie `e.hasValue !== false` | 2 |
| 2 | `src/components/worksheet/ExerciseReading.tsx` | Dodac badge AI POZA blokiem isInteractive | 1 |
| 3 | `src/components/worksheet/ExerciseDialogue.tsx` | Dodac badge AI POZA blokiem isInteractive | 1 |
| 4 | `src/components/worksheet/ExerciseDescribe.tsx` | Dodac badge AI POZA blokiem isInteractive + picture hint | 1, 3 |
| 5 | `src/components/worksheet/ExerciseAnswerQuestions.tsx` | Dodac badge AI POZA blokiem isInteractive + picture hint | 1, 3 |
| 6 | `src/components/worksheet/ExerciseAnswerQuestionsAudio.tsx` | Dodac badge AI POZA blokiem isInteractive | 1 |
| 7 | `src/components/worksheet/ExerciseListeningComprehension.tsx` | Dodac badge AI POZA blokiem isInteractive | 1 |
| 8 | `src/components/worksheet/ExerciseParaphrasing.tsx` | Dodac badge AI POZA blokiem isInteractive | 1 |
| 9 | `src/components/worksheet/ExerciseMultipleChoice.tsx` | Dodac picture hint | 3 |
| 10 | `src/components/worksheet/ExerciseSection.tsx` | Przekazac exerciseVariant do 3 komponentow | 3 |
| 11 | `src/components/homework/AiEvaluationBadge.tsx` | Dodac pending state (quality_score < 0) | 4 |
| 12 | `src/components/shared/SharedWorksheetContent.tsx` | Zmienic konwerter - nie pomijac pending | 4 |
| 13 | `src/components/worksheet/ExerciseSection.tsx` | Zmienic konwerter - nie pomijac pending | 4 |
| 14 | Dokumentacja | Aktualizacja | Wszystkie |

### Bezpieczenstwo zmian

- Zmiana 1 (hasRealAiEval): zmiana `e.mastery > 0` na `e.hasValue !== false` - nadal chroni przed nadpisaniem AI eval (open-ended z `hasValue: false` nie przechodzi). Zamkniete cwiczenia z mastery=0 i `hasValue: true` teraz poprawnie przechodza.
- Zmiana 2-8 (badge poza isInteractive): nowy warunek `!isInteractive && isSharedWorksheet` - aktywuje sie TYLKO w Live Session. Zero wplywu na inne tryby.
- Zmiana 9-10 (picture hint): nowy opcjonalny prop z domyslna wartoscia `'plain'` - backward compatible.
- Zmiana 11-13 (pending badge): sentinel `quality_score: -1` nie koliduje z normalnymi wartosciami (0.0-1.0). Pending badge pojawia sie TYLKO gdy student ma odpowiedz ale brak AI eval.
