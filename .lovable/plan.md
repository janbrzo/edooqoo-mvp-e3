
# DSLM - Naprawa Flashcards, Homework nano_skills + UI fixes

---

## ANALIZA 6 PROBLEMOW

### Problem 1: Homework nano_skills - czy korzystamy z tego samego kodu?

**Wynik analizy**: TAK, homework juz korzysta z tego samego kodu co worksheety. Hook `useInteractiveHomework.tsx` importuje `buildItemEvaluations` z `masteryCalculator.ts` (linia 11). Dane w bazie to potwierdzaja - homework eventy maja juz nano_skill_ratings z formatem `ns.vocab.*`.

**Ale jest problem**: Homework korzysta z nano_skills ktore AI wygenerowalo W MOMENCIE TWORZENIA WORKSHEETU. Jesli worksheet byl wygenerowany PRZED naszymi zmianami v5, to nano_skills w nim beda w STARYM formacie (np. `ns.vocab.idiom_definition_blind_date` zamiast `ns.A2.vocabulary.definition_blind_date`).

**Wniosek**: Nie trzeba zmieniac kodu homework - on juz uzywa `buildItemEvaluations`. Nowe worksheety beda generowac nano_skills w nowym formacie v5, wiec homework z tych worksheetow tez bedzie mial nowy format. Stare worksheety pozostana ze starym formatem - backward compatibility w SQL to obsluguje.

---

### Problem 2.1 + 2.2: Flashcards - ujednolicenie eventow + poziomy CEFR

**Stan obecny**: Trigger `log_flashcard_review_event()` wstawia eventy z:
- `skill_ids`: NULL (puste!)
- Dane w `student_skill_metrics` maja format `flashcard:UUID_karty` (np. `flashcard:c93fddc7-...`)

**Co trzeba zrobic**: Zmienic trigger SQL zeby generowal `skill_ids` w formacie `ns.[CEFR].vocabulary.definition_[word]`. Trigger ma dostep do `front_text` (angielskie slowo) i `back_text` (tlumaczenie/definicja). Ale trigger NIE WIE jaki jest poziom CEFR slowa.

**Rozwiazanie**: AI nie moze byc wywolywane w triggerze SQL (zbyt wolne). Wiec CEFR level bedzie ustalany deterministycznie:

1. **Dla nowych flashcards**: Przy tworzeniu karty (import z vocabulary sheet lub manual add), system ustala CEFR na podstawie poziomu studenta z tabeli `students.english_level`. To jest dobre przyblizenie - jesli student jest na A2, to slowa ktore sie uczy sa na poziomie A2-B1.

2. **Trigger `log_flashcard_review_event()`**: Pobierze `english_level` studenta i uzyje go jako CEFR prefix. Zmieni `skill_ids` z NULL na `ARRAY['ns.[CEFR].vocabulary.definition_[sanitized_word]']`.

3. **back_type rozroznienie**: Trigger sprawdzi `back_type` z `flashcard_sets`:
   - `translation` (native language) -> confidence nizsza (0.75) bo latwiejsze
   - `definition` (English) -> confidence wyzsza (0.90)
   
   Ale confidence nie jest przechowywana w `student_events` bezposrednio - jest w nano_skill w prompcie. Dla flashcards, roznice translation vs definition beda wplywac na mastery (translation=latwiejsze, wiec ten sam wynik SM-2 daje nieco nizsza wartosc mastery).

**Konkretne zmiany w triggerze**:

```text
Obecny skill_name w metrics: flashcard:c93fddc7-da38-45f0-bfb8-4c8260ef78f3
Nowy skill_name:             ns.A2.vocabulary.definition_advice
```

Sanityzacja slowa: lowercase, spacje -> underscore, usuwanie znakow specjalnych. Przyklady:
- "mother-in-law" -> `ns.B1.vocabulary.definition_mother_in_law`
- "career-wise" -> `ns.B1.vocabulary.definition_career_wise`
- "August" -> `ns.A1.vocabulary.definition_august`

---

### Problem 3: Period filter znika gdy brak danych

**Przyczyna**: W `SkillsOverviewPanel.tsx` linia 166-178, warunek `if (skills.length === 0)` zwraca "No skill data yet" BEZ period filtera. Gdy uzytkownik wybierze krotki okres (np. 7d) i nie ma eventow w tym okresie, `skills` jest pusty i caly panel znika lacznie z filterem.

**Rozwiazanie**: Przeniesc period filter PRZED warunek `skills.length === 0`, zeby zawsze byl widoczny. Komunikat "No skill data" powinien pojawiac sie PONIZEJ filtra.

---

### Problem 4: Klikalna ikona studenta z lista studentow

**Stan obecny**: Na stronie `/student/:id` (linia 206-208) jest ikona `<User>` obok imienia studenta, ale nie jest klikalna.

**Rozwiazanie**: Zamienic ikone `<User>` na klikalny `Popover` z lista studentow (posortowana jak w dashboard - `updated_at DESC`). Po kliknieciu na studenta -> `navigate('/student/' + studentId)`.

---

### Problem 5: Filtrowanie po CEFR level w SkillsOverviewPanel

**Rozwiazanie**: Dodac przycisk CEFR filter obok istniejacego period filtra:

```text
CEFR: [All] [A1] [A2] [B1] [B2] [C1] [C2]
```

Filtrowanie dziala na poziomie nano_skill names - wystarczy sprawdzic czy `skill_name` zawiera `.A2.` itp. To jest czysto frontendowe filtrowanie na danych juz pobranych z `useSkillMetrics`.

---

### Problem 6: Backfill istniejacych nano_skills

**Stan obecny**: W bazie mamy ~855 nano_skills w starym formacie + 127 flashcard nano_skills w formacie `flashcard:UUID`.

**Rozwiazanie**: SQL migracja z backfillem:

1. **Flashcard metrics**: Zamiana `flashcard:UUID` na `ns.[CEFR].vocabulary.definition_[word]` - wymaga joina z `flashcard_cards` zeby pobrac `front_text`, i z `students` zeby pobrac `english_level`.

2. **Stare nano_skills**: NIE ruszamy - backward compatibility w `extract_micro_skill()` i `extract_skill_category()` juz obsluguje stare formaty. Nowe worksheety beda generowac nowy format.

---

## PLAN IMPLEMENTACJI

### Krok 1: SQL - Nowy trigger flashcard_review + backfill

Nowa wersja `log_flashcard_review_event()` ktora:
- Pobiera `english_level` z `students` 
- Pobiera `back_type` z `flashcard_sets`
- Sanityzuje `front_text` do formatu nano_skill
- Wstawia `skill_ids = ARRAY['ns.[CEFR].vocabulary.definition_[word]']`
- Mastery modyfikowane o wspolczynnik trudnosci (translation: x0.85, definition: x1.0)

Backfill istniejacych flashcard metrics:
- UPDATE `student_skill_metrics` SET `skill_name` = nowy format WHERE `skill_name` LIKE `flashcard:%`
- Wymaga joina z `flashcard_cards` i `students`

### Krok 2: Frontend - Period filter fix (SkillsOverviewPanel.tsx)

Przeniesc period filter i CEFR filter PRZED warunek `skills.length === 0`.

### Krok 3: Frontend - CEFR filter (SkillsOverviewPanel.tsx)

Dodac state `cefrFilter` i przyciski A1-C2. Filtrowac `nanoSkills` i `microSkills` po wybranym CEFR.

### Krok 4: Frontend - Klikalna ikona studenta (StudentPage.tsx)

Zamienic `<User>` ikone na `Popover` z lista studentow posortowana `updated_at DESC`.

### Krok 5: Dokumentacja

Aktualizacja 6 plikow dokumentacji.

---

## SZCZEGOLY TECHNICZNE

### Pliki do zmiany:

| Plik | Zmiana |
|------|--------|
| SQL migracja | Nowy `log_flashcard_review_event()` z nano_skill naming, backfill flashcard metrics |
| `SkillsOverviewPanel.tsx` | Period filter zawsze widoczny, CEFR filter, micro skill labels update |
| `StudentPage.tsx` | Klikalna ikona studenta z Popover lista |
| `useSkillMetrics.tsx` | Opcjonalnie: CEFR filtrowanie na poziomie query |
| 6 plikow dokumentacji | Aktualizacja |

### Czego NIE zmieniamy:
- `useInteractiveHomework.tsx` - juz uzywa `buildItemEvaluations` (problem 1 = brak problemu)
- `useFlashcardLearning.tsx` - nie ruszamy logiki SM-2
- `FlashcardDisplay.tsx` - UI flashcards bez zmian
- `masteryCalculator.ts` - juz obsluguje dual nano_skills
- `core-instructions.ts` / `individual-exercises.ts` - juz zaktualizowane w v5

### Kolejnosc:
1. SQL: Nowy trigger + backfill
2. Frontend: Period filter fix + CEFR filter + Student switcher
3. Dokumentacja
