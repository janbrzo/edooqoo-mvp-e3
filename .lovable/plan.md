

# DSLM Layer A - Audyt weryfikacyjny i plan finalizacji

## Stan po Round 11

Dane sa w **znacznie lepszym stanie** niz przed Round 11. Wiekszosci krytycznych problemow juz nie ma. Zostal jeden istotny problem do naprawy (flashcard backfill) i Layer A bedzie gotowa.

---

## WYNIKI AUDYTU PER ZRODLO

### 1. Flashcards (828 eventow)

**Trigger**: Poprawny. Formula SM-2 dziala (rep=1 -> 50, rep=2 -> 70, itd.)
**Payload**: Bogaty - card_front/back, SM-2 parametry, time_spent. Ocena 9/10.
**Problem**: 407 eventow sprzed 28 stycznia ma NULL mastery. Payload zawiera dane SM-2 wiec mozna obliczyc retroaktywnie.
**element_type**: 387 nowych ma "vocabulary", 441 starych ma NULL.

**Wniosek**: Backfill mastery + element_type i bedzie 10/10.

### 2. Shared Worksheet (145 eventow)

**Trigger**: Poprawny. Auto-oblicza mastery z nano_skill_ratings od ~4 lutego.
**Payload**: Zamkniete 0/100, otwarte 5-90 z AI. Ocena 8/10.
**Problem**: 91 starych eventow (sprzed lutego) ma NULL mastery I nsr_count=0. To sa eventy gdzie student otworzyl cwiczenie ale NIE odpowiedzial - mastery NIE DA SIE obliczyc. To prawidlowy NULL.
**element_type**: Nowe eventy przechowuja exercise_type (np. "reading", "dialogue"). Stare maja NULL.

**Wniosek**: Stare NULL mastery to poprawne dane (brak odpowiedzi). Backfill element_type dla starych eventow i ok.

### 3. Homework (165 eventow)

**Trigger**: Poprawny. Identyczna logika jak worksheet.
**Payload**: Jak worksheet + pole `is_submitted` (odroznia draft od finalnej). Ocena 8/10.
**Problem**: Taki sam jak worksheet - stare eventy bez nano_skill_ratings.

**Wniosek**: Identyczny jak worksheet.

### 4. Welcome Test (272 eventy)

**Stan**: Po Round 11 czyszczeniu zostalo 272 eventow (bylo 1108). Wszystkie maja answer_id.
**Mastery**: 46 z mastery (speaking/writing ocenione przez AI), 226 NULL (zamkniete pytania - mastery jest w nano_skill_ratings).
**Problem**: Zamkniete pytania welcome_test (multiple_choice, fill_blank) maja mastery w `nano_skill_ratings` ale NIE w kolumnie `mastery`. To samo co worksheet/homework ale tu to LATWE do naprawy bo nsr_count > 0.

**Wniosek**: Backfill mastery z nano_skill_ratings dla welcome_test zamknietych pytan.

### 5. Teacher (37 eventow)

**Stan**: mark_done_evaluation (29), knowledge_entry_added (6), teacher_observation (2).
**Mastery**: Wszystkie NULL - to poprawne (obserwacje nauczyciela nie maja numerycznego mastery).
**element_type**: Rozne - exercise_type nazwy, kategorie knowledge, NULL.

**Wniosek**: OK - te eventy nie wymagaja mastery.

---

## ANALIZA TABEL W KONTEKSCIE DSLM

Tabel jest duzo ale kazda ma unikalna role:

| Tabela | Rola w DSLM | Status |
|--------|-------------|--------|
| student_events | Layer A - jedyne zrodlo prawdy | Wymaga backfillu |
| student_test_questions | Dane zrodlowe testow (nie DSLM) | OK |
| test_skill_results | Proto-Layer B (agregacja testow) | Layer B zastapi |
| student_learning_profiles | Proto-Layer C (profil psychologiczny) | Layer C rozszerzy |
| student_knowledge_entries | Dane zrodlowe obserwacji | OK |
| student_learning_elements | Input Layer D (cele nauczania) | Przyszlosc |

To NIE jest duplikacja. student_events loguje FAKTY, inne tabele przechowuja KONTEKST.

---

## ELEMENT_TYPE - SWIADOMA DECYZJA

element_type w triggerach worksheet/homework przechowuje `exercise_type` (np. "reading", "dialogue", "fill-in-blanks") a NIE kategorie DSLM (grammar, vocabulary, speaking). To jest POPRAWNE i zgodne z planem:

- Layer A zapisuje FAKTY (jaki typ cwiczenia)
- Layer B MAPUJE fakty na kategorie (reading -> reading, fill-in-blanks -> grammar, dialogue -> speaking)

Mapowanie w Layer A byloby bledem bo jeden exercise_type moze testowac wiele umiejetnosci.

---

## PLAN NAPRAWCZY - OSTATNI KROK PRZED LAYER B

### Krok 1: SQL Migracja - Backfill flashcard mastery (407 eventow)

```sql
UPDATE student_events
SET mastery = CASE 
  WHEN (event_payload->>'repetition')::int = 0 THEN 0
  WHEN (event_payload->>'repetition')::int >= 4 
    AND (event_payload->>'interval_days')::int >= 21 THEN 100
  WHEN (event_payload->>'repetition')::int >= 3 
    AND (event_payload->>'interval_days')::int >= 6 THEN 90
  WHEN (event_payload->>'repetition')::int = 2 THEN 70
  WHEN (event_payload->>'repetition')::int = 1 THEN 50
  ELSE 60
END
WHERE event_source = 'flashcard' AND mastery IS NULL;
```

Dodatkowo zsynchronizowac payload.mastery:

```sql
UPDATE student_events
SET event_payload = jsonb_set(
  event_payload, '{mastery}', to_jsonb(mastery::int)
)
WHERE event_source = 'flashcard' 
AND mastery IS NOT NULL 
AND event_payload->>'mastery' IS NULL;
```

### Krok 2: Backfill flashcard element_type (441 eventow)

```sql
UPDATE student_events
SET element_type = 'vocabulary'
WHERE event_source = 'flashcard' AND element_type IS NULL;
```

### Krok 3: Backfill welcome_test mastery z nano_skill_ratings (do ~180 eventow)

```sql
UPDATE student_events
SET mastery = (
  SELECT ROUND(AVG((elem->>'mastery')::numeric))
  FROM jsonb_array_elements(event_payload->'nano_skill_ratings') elem
  WHERE (elem->>'mastery')::numeric >= 0 
    AND (elem->>'hasValue')::boolean = true
)
WHERE event_source = 'welcome_test' 
AND mastery IS NULL
AND jsonb_array_length(COALESCE(event_payload->'nano_skill_ratings', '[]'::jsonb)) > 0;
```

### Krok 4: Backfill worksheet/homework element_type (175 eventow)

```sql
UPDATE student_events
SET element_type = event_payload->>'exercise_type'
WHERE event_source IN ('worksheet', 'homework')
AND element_type IS NULL
AND event_payload->>'exercise_type' IS NOT NULL;
```

### Czego NIE robimy:
- NIE zmieniamy triggerow - dzialaja poprawnie
- NIE zmieniamy frontendu - kod jest ok
- NIE ruszamy worksheet/homework eventow z nsr_count=0 - to poprawne NULL (brak odpowiedzi)
- NIE mapujemy exercise_type na kategorie - to zadanie Layer B

---

## LAYER A READINESS CHECKLIST (zaktualizowany po Round 11)

| # | Kryterium | Status | Uwagi |
|---|-----------|--------|-------|
| 1 | Kazdy event ma unikalna identyfikacje | PASS | UUID id, answer_id w payload |
| 2 | event_type uzywa kanonicznych nazw | PASS | Znormalizowane w Round 8 |
| 3 | event_source jest poprawny | PASS | Wyczyszczone w Round 11 |
| 4 | Brak duplikatow/smieci | PASS | Wyczyszczone w Round 11 |
| 5 | mastery kolumna wypelniona | DO NAPRAWY | 407 flashcard + ~180 welcome_test |
| 6 | Flashcard mastery formula poprawna | PASS | Trigger OK, stare backfillowane w R11 |
| 7 | nano_skill_ratings spojne | PASS | Round 10 naprawil welcome_test |
| 8 | time_spent_seconds dokladny | PASS | visibilitychange w Round 9 |
| 9 | element_type wypelniony | DO NAPRAWY | 441 flashcard + 175 worksheet/homework |
| 10 | Dane wystarczajace dla Layer B | PASS | Payloady bogate, triggery poprawne |

---

## PODSUMOWANIE

| Plik | Zmiana |
|------|--------|
| SQL migracja | Backfill: flashcard mastery (407), flashcard element_type (441), welcome_test mastery (~180), worksheet/homework element_type (175) |
| .lovable/plan.md | Zaktualizowany checklist |
| docs/TECHNICAL_DOCUMENTATION.md | Status Layer A |
| docs/CURRENT_STATE_ANALYSIS.md | Zaktualizowany |

### Czego NIE zmieniamy:
- Triggery SQL - dzialaja poprawnie
- Frontend - kod jest ok
- process-welcome-test - Round 10 naprawil
- Inne tabele (test_skill_results, learning_profiles itd.)

### Jak przetestowac:
1. Zrob nowy shared worksheet, udostepnij studentowi, odpowiedz na 2-3 cwiczenia -> sprawdz student_events czy mastery i element_type sie wypelniaja
2. Zrob flashcard review -> sprawdz student_events
3. Sprawdz w bazie: `SELECT event_source, count(*) - count(mastery) as null_mastery FROM student_events GROUP BY event_source` - powinno byc 0 (lub bliskie 0 dla worksheet/homework gdzie student nie odpowiedzial)

### Nastepny etap po tym: LAYER B
Po zatwierdzeniu backfillu - mozemy budowac Layer B (student_skill_metrics, agregacja, trendy).

