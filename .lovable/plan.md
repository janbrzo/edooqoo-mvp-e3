

# Plan naprawy: 6 problemow (SKORYGOWANY Problem 6)

## PROBLEM 6 (SKORYGOWANY): Nazwy typow cwiczen - blad jest juz na zwyklym worksheet

### Analiza glowna

Blad NIE jest w shared worksheet. Blad jest wczesniej - w generowaniu. Tytuly cwiczen sa nadpisywane w TRZECH miejscach, a KAZDE z nich GUBI opis od AI:

1. **Edge function `generateWorksheet/index.ts` linia 494** - streaming path
2. **Edge function `generateWorksheet/index.ts` linia 679** - non-streaming path
3. **Frontend `exerciseProcessor.ts` linia 64** - po otrzymaniu danych

Wszystkie trzy robia dokladnie to samo:
```
exercise.title = `Exercise ${N}: ${officialName}`;
```

AI generuje tytul np. `"Booking a Tour - Role Play"` ale ten kod go calkowicie nadpisuje na `"Exercise 3: Dialogue Practice"`. Opis AI jest TRACONY bezpowrotnie.

Potem shared worksheet po prostu kopiuje te dane 1:1 z `ai_response` - nie zmienia tytulow. Wiec blad jest u zrodla.

### Rozwiazanie

Zachowac opis AI jako dopisek po oficjalnej nazwie typu. We WSZYSTKICH trzech miejscach zmienic logike:

```typescript
// BYLO (gubi opis AI):
exercise.title = `Exercise ${N}: ${officialName}`;

// BEDZIE (zachowuje opis AI):
const aiTitle = exercise.title || '';
// Wyczysc poprzedni prefix "Exercise N:" jesli istnieje
const cleanAiTitle = aiTitle.replace(/^Exercise\s+\d+:\s*/i, '').trim();
// Usun oficjalna nazwe typu jesli AI ja juz umiescil
const aiDesc = cleanAiTitle
  .replace(new RegExp(`^${officialName}\\s*[-:]?\\s*`, 'i'), '')
  .trim();
exercise.title = aiDesc 
  ? `Exercise ${N}: ${officialName}: ${aiDesc}` 
  : `Exercise ${N}: ${officialName}`;
```

Przyklad: AI generuje `"Booking a Tour - Role Play"` -> wynik: `"Exercise 3: Dialogue Practice: Booking a Tour - Role Play"`

### Pliki do zmiany

| # | Plik | Lokalizacja |
|---|------|------------|
| 1 | `supabase/functions/generateWorksheet/index.ts` | Linia 491-495 (streaming) |
| 2 | `supabase/functions/generateWorksheet/index.ts` | Linia 676-680 (non-streaming) |
| 3 | `src/utils/exerciseProcessor.ts` | Linia 62-64 |

Nie trzeba zmieniac `SharedWorksheetContent.tsx` bo shared worksheet kopiuje tytuly 1:1 z `ai_response` - po naprawie zrodla bedzie automatycznie poprawne.

### Bezpieczenstwo

- Logika jest addytywna - jesli AI nie generuje opisu, tytul bedzie identyczny jak teraz
- Prompt do generowania worksheeta NIE jest zmieniany (swiety prompt)
- Shared worksheet nie wymaga osobnych zmian

---

## PROBLEMY 1-5: Bez zmian od poprzedniego planu

Podtrzymuje wszystkie rozwiazania z poprzedniego planu:

| # | Plik | Zmiana | Problem |
|---|------|--------|---------|
| 1 | `src/utils/masteryCalculator.ts` | Poprawic klasyfikacje typow (gap-text, word-order do CLOSED, dodac error-correction). Normalizacja typow audio/picture | 2 |
| 2 | `src/hooks/useLiveSessionAnswers.tsx` | Polling co 15s dla item_evaluations | 1 |
| 3 | `supabase/functions/verify-open-answers/index.ts` | Wzmocnic prompt + server-side non-answer detection (quality_score <= 0.1 dla "nie wiem") | 3 |
| 4 | `src/components/worksheet/ExerciseTrueFalseAudio.tsx` | Prop exerciseVariant, zroznicowac komunikat audio/picture/brak | 4 |
| 5 | `src/components/worksheet/ExerciseSection.tsx` | Przekazac exerciseVariant do TrueFalseAudio | 4 |
| 6 | `src/components/shared/SharedWorksheetContent.tsx` | Komunikat picture dla true-false-picture | 4 |
| 7 | `src/pages/SharedWorksheet.tsx` | Dodac sentence_halves, expressions, prompts do exerciseQuestionCounts | 5.1 |
| 8 | `src/hooks/useInteractiveSharedWorksheet.tsx` | Cap answeredTasks i percentageComplete na 100% | 5.2 |
| 9 | `src/hooks/useInteractiveHomework.tsx` | Ten sam cap na 100% | 5.2 |
| 10 | `supabase/functions/generateWorksheet/index.ts` | Zachowac opis AI w tytulach (2 miejsca) | 6 |
| 11 | `src/utils/exerciseProcessor.ts` | Zachowac opis AI w tytulach (1 miejsce) + eksport getOfficialExerciseName | 6 |
| 12 | Dokumentacja | Aktualizacja | Wszystkie |

