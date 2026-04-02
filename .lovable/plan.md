# Plan: 6 napraw Flashcards + DSLM confidence

## Problem 1: Sprawdzenie confidence speaking/writing

**Status:** Kod w `masteryCalculator.ts` (linie 399-427, `adjustConfidenceByAnswerType`) jest **poprawnie zaimplementowany** — logika confidence jest zgodna z tabelą scenariuszy. Wywoływany jest w `buildItemEvaluations` (linia 475).

**ALE** — confidence jest zapisywany w `ItemEvaluation` tylko jako pole w `NanoSkillData`, a potem **NIE jest przekazywany dalej** do `item_evaluations` w bazie. `ItemEvaluation` nie ma pola `confidence`. To znaczy, że confidence jest obliczany ale **gubiący się** — nie trafia do `homework_student_answers.item_evaluations` ani do `student_events.event_payload.nano_skill_ratings`.

**Naprawa:**

1. Dodać `confidence?: number` do interfejsu `ItemEvaluation` w `masteryCalculator.ts`
2. W `buildItemEvaluations`, przy `push` do `itemEvaluations`, dodać `confidence: nanoSkill.confidence`
3. Zweryfikować że SQL trigger `log_homework_answer_to_events()` przepisuje confidence z `item_evaluations` do `nano_skill_ratings` w `event_payload`

**Pliki:** `src/utils/masteryCalculator.ts`

---

## Problem 2: Trudność flashcards — direction + back_type

**Obecny stan:** Trigger `log_flashcard_review_event()` używa mnożnika opartego TYLKO na `back_type`:

- `definition` → 0.9
- `translation` → 1.0

**Nowy model trudności (3 scenariusze):**

- A) Direction 1 (student widzi English Term, odgaduje tłum/definicję) → **najłatwiejsze** → mnożnik **0.70**
- B) Direction 2 + translation (student widzi Native Translation, musi podać English Term) → **normalne** → mnożnik **1.0**  
- C) Direction 2 + definition (student widzi English Definition, musi podać English Term) → **trudniejsze** → mnożnik **1.1**

**Naprawa w triggerze SQL:**

```sql
v_difficulty_multiplier := CASE 
  WHEN NEW.direction = 1 THEN 0.7  -- Widzi EN term, łatwe
  WHEN NEW.direction = 2 AND COALESCE(v_back_type, 'translation') = 'definition' THEN 1.1  -- Widzi EN def, trudne
  ELSE 1.0  -- Widzi native translation, normalne
END;
```

Dodatkowo `LEAST(v_mastery_value, 100)` żeby mnożnik 1.1 nie przekroczył 100.

**Pliki:** Migracja SQL (CREATE OR REPLACE FUNCTION)

---

## Problem 3: CEFR level nie zapisuje się dla nowych kart

**Root cause:** Edge Function `translate-flashcard` zwraca `cefr_level` poprawnie. Hook `useFlashcardTranslation` i `useFlashcardDefinition` odczytują `cefrLevel`. `AddFlashcardModal` przekazuje `cefr_level: currentCefrLevel || undefined` do `onAdd`. 

Ale `useFlashcardCards.tsx` linia insert — sprawdźmy czy `cefr_level` jest w insert:

Sprawdziłem — `addCard` robi `supabase.from('flashcard_cards').insert({ ...data })` więc jeśli `data` zawiera `cefr_level`, powinno trafić do bazy. Problem może być w tym, że `translate-flashcard` nie jest deployowane z najnowszym kodem (JSON format), albo `useFlashcardTranslation` nie jest wywoływane (bo `studentNativeLanguage` jest pusty lub `enabled` jest false).

Potencjalne przyczyny:

1. Edge function `translate-flashcard` nie została zdeployowana po zmianach
2. `useFlashcardTranslation` ma `enabled: backType === 'translation' && !isEditMode && !!studentNativeLanguage` — jeśli `studentNativeLanguage` jest pusty, hook jest wyłączony i `cefrLevel` jest null

**Naprawa:**

1. Zdeployować `translate-flashcard` Edge Function
2. Wyświetlić CEFR level na kartach w `FlashcardSetEditor` i `FlashcardDisplay`
3. W `AddFlashcardModal` — pokazać badge z CEFR level obok preview

**Pliki:**

- Deploy `translate-flashcard`
- `src/components/flashcards/FlashcardSetEditor.tsx` — badge CEFR na kartach
- `src/components/flashcards/FlashcardDisplay.tsx` — badge CEFR w trakcie nauki
- `src/components/flashcards/AddFlashcardModal.tsx` — badge CEFR w preview

---

## Problem 4: Browse — dwa przyciski "Back to Dashboard" i "Back to Flashcards"

**Obecny stan:** `FlashcardsLearning.tsx` linia 159: jeden przycisk "Back to Dashboard" który wywołuje `handleQuit` (wraca do `/my-flashcards/{email}` lub `returnTo`).

**Naprawa:** W trybie browse, zamienić na dwa przyciski:

- "Back to Flashcards" — wraca do `returnTo` (np. `/my/{token}/flashcards`)
- "Back to Dashboard" — wraca do `/my/{token}` (dashboard studenta)

Logika: jeśli `returnTo` zawiera `/flashcards`, to `returnTo` → "Back to Flashcards", a dashboard = `returnTo` bez `/flashcards`. Jeśli nie ma `returnTo`, oba wracają do starego fallbacku.

**Plik:** `src/pages/FlashcardsLearning.tsx`

---

## Problem 5: Share All Flashcard Sets — zły link

**Obecny stan:** `ShareAllFlashcardSetsModal` generuje link `/my-flashcards/${email}` (linia 35) — ta strona nie istnieje.

**Naprawa:** Potrzebujemy `teacherToken` (= `public_calendar_token` z `calendar_settings`) żeby wygenerować `/my/${teacherToken}/flashcards`.

Muszę przekazać `teacherToken` do `ShareAllFlashcardSetsModal`. Ścieżka:

- `StudentPage.tsx` → ma `teacherId` → musi pobrać `public_calendar_token` z `calendar_settings`
- `FlashcardSetsSection` → przyjmie nowy prop `teacherCalendarToken`
- `ShareAllFlashcardSetsModal` → przyjmie `teacherCalendarToken` zamiast `studentEmail` do budowy URL

**Zmiana w `ShareAllFlashcardSetsModal`:**

```typescript
const portalUrl = teacherCalendarToken && studentEmail
  ? `${window.location.origin}/my/${teacherCalendarToken}/flashcards`
  : '';
```

**Pliki:**

- `src/components/flashcards/ShareAllFlashcardSetsModal.tsx` — nowy prop `teacherCalendarToken`, nowy URL
- `src/components/flashcards/FlashcardSetsSection.tsx` — nowy prop, przekazanie do modalu
- `src/pages/StudentPage.tsx` — pobranie `public_calendar_token` i przekazanie

---

## Problem 6: Share Flashcard Set — zły link i Quit

**Obecny stan:** `ShareFlashcardSetModal` generuje link `/flashcards/${shareToken}` bez parametrów `email` i `returnTo`. Po Study → Quit, `handleQuit` wraca do `/my-flashcards/${email}` (nie istnieje).

**Naprawa:** 

1. `ShareFlashcardSetModal` musi przyjąć `teacherCalendarToken` i generować URL z query params:

```
/flashcards/${shareToken}?email=${email}&returnTo=/my/${teacherCalendarToken}/flashcards
```

2. W `FlashcardsLearning.tsx` `handleQuit` — zmienić fallback (gdy brak `returnTo`) z `/my-flashcards/${email}` na sprawdzenie czy jest `teacherToken` w query/set data, i użycie student hub URL.

**Pliki:**

- `src/components/flashcards/ShareFlashcardSetModal.tsx` — nowy prop, nowy URL format
- `src/components/flashcards/FlashcardSetCard.tsx` — przekazanie `teacherCalendarToken`
- `src/components/flashcards/FlashcardSetEditor.tsx` — przekazanie `teacherCalendarToken`
- `src/components/flashcards/FlashcardSetsSection.tsx` — przekazanie dalej
- `src/pages/StudentPage.tsx` — pobranie tokena

---

## Podsumowanie zmian


| Plik                                                       | Zmiana                                                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/utils/masteryCalculator.ts`                           | Dodać `confidence` do `ItemEvaluation`, propagować w `buildItemEvaluations`            |
| Migracja SQL                                               | Nowa wersja `log_flashcard_review_event()` z 3-scenariuszowym mnożnikiem (0.7/1.0/1.1) |
| Deploy Edge Function                                       | `translate-flashcard`                                                                  |
| `src/components/flashcards/FlashcardSetEditor.tsx`         | Badge CEFR na kartach + prop `teacherCalendarToken`                                    |
| `src/components/flashcards/FlashcardDisplay.tsx`           | Badge CEFR w nauce                                                                     |
| `src/components/flashcards/AddFlashcardModal.tsx`          | Badge CEFR w preview                                                                   |
| `src/pages/FlashcardsLearning.tsx`                         | Dwa przyciski Back (Flashcards + Dashboard)                                            |
| `src/components/flashcards/ShareAllFlashcardSetsModal.tsx` | Prop `teacherCalendarToken`, URL `/my/{token}/flashcards`                              |
| `src/components/flashcards/ShareFlashcardSetModal.tsx`     | Prop `teacherCalendarToken`, URL z email+returnTo                                      |
| `src/components/flashcards/FlashcardSetCard.tsx`           | Prop `teacherCalendarToken` → Share modal                                              |
| `src/components/flashcards/FlashcardSetsSection.tsx`       | Prop `teacherCalendarToken` → karty + modale                                           |
| `src/pages/StudentPage.tsx`                                | Pobranie `public_calendar_token` z `calendar_settings`                                 |
| `docs/TECHNICAL_DOCUMENTATION.md`                          | Aktualizacja                                                                           |
| `docs/CURRENT_STATE_ANALYSIS.md`                           | Aktualizacja                                                                           |


## Co NIE zmienia się

- SM-2 algorytm — bez zmian
- SQL trigger `log_homework_answer_to_events` — bez zmian (confidence jest w payload, trigger po prostu je kopiuje)
- Edge Functions inne niż `translate-flashcard` — bez zmian
- `useFlashcardLearning.tsx` — bez zmian
- Routing w `App.tsx` — bez zmian