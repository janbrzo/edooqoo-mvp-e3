

# Plan wdrozenia - 3 problemy DSLM

---

## Problem 1: Brak badge nano_skill w Reading

**Przyczyna**: Przeanalizowalem `ExerciseSection.tsx` linie 810-832. Kod POPRAWNIE renderuje `ExerciseReading` z `onNanoSkillChange`. Ale warunek widocznosci w `ExerciseReading.tsx` linia 53:

```
const showNanoSkill = viewMode === 'teacher' && !isSharedWorksheet && nanoSkill;
```

Problem lezy w tym ze `nanoSkill = safeGetNanoSkill(question)` zwraca `null` gdy pytanie (question) nie ma pola `nano_skill`. W Reading, AI generuje `nano_skill` na poziomie PYTANIA (`question.nano_skill`). Jesli AI w nowym formacie v5 nie wstawil `nano_skill` do kazdego pytania - badge bedzie ukryty.

Ale jest jeszcze jeden problem: linia 823 - `isSharedWorksheet={viewMode === 'live-session'}`. W trybie Live Session `isSharedWorksheet` jest `true`, co powoduje ze warunek `!isSharedWorksheet` jest `false` i badge sie NIE pokazuje!

**Rozwiazanie**: Zmienic warunek `showNanoSkill` w `ExerciseReading.tsx` z:
```
const showNanoSkill = viewMode === 'teacher' && !isSharedWorksheet && nanoSkill;
```
na:
```
const showNanoSkill = (viewMode === 'teacher') && nanoSkill;
```

Usuwamy `!isSharedWorksheet` bo w Live Session tez chcemy widziec badge (Live Session ustawia `viewMode` na `'teacher'` w ExerciseSection linia 651, ale jednoczesnie ustawia `isSharedWorksheet=true` co blokuje badge).

Ten sam fix trzeba zastosowac we WSZYSTKICH komponentach cwiczen ktore maja taki warunek. Dotyczy to: ExerciseReading, ExerciseDialogue, ExerciseMatching, ExerciseFillInBlanks, ExerciseMultipleChoice, ExerciseOddOneOut, ExerciseAnswerQuestions, ExerciseGapText, ExerciseMatchingHalves, ExerciseCompleteWord, ExerciseCategorize, ExerciseParaphrasing, ExerciseSentenceTransformation, ExerciseNegativePrefixes, ExerciseWordOrder, ExerciseSynonymsAntonyms, ExerciseListeningComprehension, ExerciseMultipleChoiceAudio, ExerciseTrueFalseAudio, ExerciseFillInBlanksAudio, ExerciseAnswerQuestionsAudio, ExerciseDescribe, ExerciseWritingTask.

---

## Problem 2: Edytowanie tylko jednego nano_skill zamiast obu

**Przyczyna**: W `NanoSkillBadge.tsx` linie 148-202 jest JEDEN przycisk edycji (olowek) dla calego komponentu. `handleEditStart` (linia 132) kopiuje zawsze `nanoSkill` (pierwszy/glowny skill). Nie ma mozliwosci edytowania drugiego skilla.

**Rozwiazanie**: Zamiast jednego przycisku edycji na koncu, dodac przycisk edycji PER SKILL. Kazdy `SingleBadge` powinien miec swoj wlasny przycisk edycji. Zmiana w `NanoSkillBadge.tsx`:

1. Przeniesc logike edycji do `SingleBadge` lub iterowac przez `skillsToShow` i renderowac przycisk edycji po kazdym badge
2. Callback `onEdit` zmieni sie na `onEditSkill(index, newSkill)` gdzie `index` to pozycja w tablicy `allNanoSkills`
3. W komponentach cwiczen (np. `ExerciseReading.tsx` linia 825-830), `onNanoSkillChange` musi obsluzyc aktualizacje konkretnego skilla w tablicy `nano_skill`

Konkretna zmiana w `NanoSkillBadge.tsx`:
- Prop `onEdit` zmieni sie na `onEdit?: (newSkill: NanoSkill, skillIndex: number) => void`
- Kazdy skill w `skillsToShow.map()` dostaje swoj przycisk Pencil obok badge
- Po kliknieciu, otwiera sie popover edycji DLA TEGO KONKRETNEGO skilla

Zmiana w callerach (ExerciseReading itp.):
- `onNanoSkillChange` callback w ExerciseSection musi obsluzyc tablice: zamiast `nano_skill: newSkill` ustawiac `nano_skill: updatedArray`

---

## Problem 3: Add Exercise generuje dodatkowy caly worksheet

**Przyczyna**: `AddExerciseModal.tsx` linia 121 wywoluje `supabase.functions.invoke('generateWorksheet')`. Backend `generateWorksheet/index.ts` NIE obsluguje parametru `singleExercise: true` - ignoruje go kompletnie. Przechodzi normalny flow: generuje 8 cwiczen (bo `lessonTime: '15 min'` mapuje sie na 8 w linii 289-301 bo `formData.lessonTime === '15 min'` nie pasuje do `'45min'`), zapisuje NOWY worksheet do bazy (linia 547-571), i zwraca go.

Wiec AddExerciseModal:
1. Dostaje odpowiedz z 8 cwiczeniami (zamiast 1)
2. Bierze pierwsze cwiczenie i dodaje do biezacego worksheetu (linia 140)
3. ALE backend juz ZAPISAL nowy worksheet z 8 cwiczeniami do bazy - stad duplikat

**Rozwiazanie**: NIE UZYWAC edge function `generateWorksheet` do generowania pojedynczego cwiczenia. Zamiast tego uzyc trybu **batch generation** (ktory juz istnieje w edge function linie 199-286 i NIE zapisuje do bazy - zwraca tylko cwiczenia).

Zmiana w `AddExerciseModal.tsx`:
- W `handleGenerate`, zamiast:
```js
body: { prompt, formData: {...}, userId, singleExercise: true }
```
- Uzyc:
```js
body: {
  prompt,
  formData: {
    ...worksheetFormData,
    targetExerciseTypes: [selectedType],
    exerciseCountPerType: 1,
  },
  userId,
  isBatchGeneration: true,
}
```

To uzyje istniejacego batch mode (linia 199) ktory:
- Generuje TYLKO wybrane typy cwiczen
- NIE zapisuje do bazy (linia 271-281 - zwraca JSON bez INSERT)
- Zwraca tablice `exercises`

Reszta logiki w AddExerciseModal (dodanie do `editableWorksheet` i UPDATE do bazy) zostaje bez zmian - juz dziala poprawnie.

---

## Kolejnosc implementacji

1. **Problem 3** - Najwazniejszy (bug tworzacy duplikaty). Zmiana w 1 pliku: `AddExerciseModal.tsx`
2. **Problem 1** - Usunac `!isSharedWorksheet` z warunku `showNanoSkill` w ~23 plikach cwiczen
3. **Problem 2** - Zmiana w `NanoSkillBadge.tsx` + aktualizacja callerow w ExerciseSection.tsx

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `AddExerciseModal.tsx` | Uzyc `isBatchGeneration: true` z `targetExerciseTypes` zamiast normalnego flow |
| `NanoSkillBadge.tsx` | Przycisk edycji per skill zamiast jednego globalnego |
| `ExerciseSection.tsx` | Aktualizacja `onNanoSkillChange` do obslugi tablicy nano_skill per index |
| 23 pliki cwiczen | Usunac `!isSharedWorksheet` z warunku `showNanoSkill` |
| Dokumentacja (6 plikow) | Aktualizacja |

## Czego NIE zmieniamy

- `generateWorksheet/index.ts` - batch mode juz istnieje i dziala poprawnie
- `WorksheetDisplay.tsx` - props do AddExerciseModal sa poprawne
- `WorksheetToolbar.tsx` - przycisk Add Exercise juz dziala
- Logika zapisu do bazy w AddExerciseModal - juz poprawna (UPDATE worksheets.ai_response)

