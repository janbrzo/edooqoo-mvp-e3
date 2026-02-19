
# DSLM Layer A - Kompleksowy audyt i plan dalszych krokow

## Podsumowanie stanu

Przeanalizowalem baze danych, triggery SQL, kod frontendu i logike biznesowa. Warstwa A (Events Log) jest zbudowana, ale ma **5 powaznych problemow** ktore trzeba naprawic ZANIM przejdziemy do Layer B.

---

## KRYTYCZNE PROBLEMY W LAYER A

### PROBLEM A: student_events.mastery column NIE jest wypelniana (229 eventow)

To jest NAJWAZNIEJSZY problem. Kolumna `mastery` w tabeli `student_events` sluzy jako "gotowy sygnal" dla Layer B - powinna zawierac zagregowane mastery calego cwiczenia. ALE:

- **Worksheet**: 125 eventow, tylko 22 ma mastery w kolumnie (103 NULL). Payload ma dane w `nano_skill_ratings` (35 eventow), ale nikt nie kopiuje sredniej do kolumny.
- **Homework**: 104 eventy, tylko 13 ma mastery (91 NULL). Payload ma dane (73 eventow).

**Przyczyna**: Triggery SQL dla worksheet/homework NIE obliczaja mastery z `nano_skill_ratings`. Frontend ustawia mastery w payloadzie per-pytanie, ale kolumna `mastery` pozostaje NULL.

**Rozwiazanie**: 
1. Dodac trigger/logike ktora oblicza srednia z `nano_skill_ratings[*].mastery` (pomijajac -1) i zapisuje do kolumny `mastery`
2. Backfill istniejacych eventow

---

### PROBLEM B: Flashcard mastery=100 z repetition=1 (55 starych eventow)

Dane z bazy pokazuja 55 eventow flashcard z `mastery=100` i `repetition=1`. Wazowana formula (50 za repetition=1) zostala wdrozona w migracji z 2026-02-16. Te 55 eventow powstalo PRZED ta migracja (styczen-luty 2026) i maja zawyzone mastery.

**Obecna formula jest POPRAWNA:**
- repetition=0 (fail) -> mastery=0
- repetition=1 (1st correct) -> mastery=50
- repetition=2 -> mastery=70
- repetition>=3, interval>=6 -> mastery=90
- repetition>=4, interval>=21 -> mastery=100

**Twoja obserwacja jest sluszna** - `mastery: 100` z `repetition: 1, total_reviews: 1` to BUG z historycznych danych.

**Rozwiazanie**: Backfill - przelicz mastery dla starych eventow wedlug nowej formuly.

---

### PROBLEM C: Welcome Test - masowe duplikaty i smieci (1108 eventow)

To jest POWAZAN sytuacja:

1. **Stary trigger `log_test_answer_event`** generowal eventy z NULL `answer_id` i ubogim payloadem (tylko `question_id`, `question_type`, `difficulty_level`). Np. student 48cf5ef2 ma 360 takich smieciowych eventow.

2. **Duplikaty z retakow**: Student fddff19e ma 5 testow i 274 eventy. Kazdy retake generuje nowy komplet 49 eventow z frontendu + trigger dodaje kolejne 49. Mamy 98 eventow dla jednego testu (49 z triggera + 49 z frontendu).

3. **Stare eventy z event_source='test'**: 20 eventow z `placement` testow (nie welcome). Te testy byly wczoraj usuniete z UI ale eventy zostaly.

**Stan obecny:** Z 1108 welcome_test eventow:
- ~500+ to smieci z triggerow (NULL answer_id, ubogi payload)
- ~100+ to duplikaty z retakow
- Tylko ~200-300 to uzyteczne eventy z bogatym payloadem

**Rozwiazanie:**
1. Usunac eventy z NULL `answer_id` (stary format triggera)
2. Usunac 20 eventow `event_source='test'`  
3. Dla retakow: zostawic TYLKO najnowszy test per student (opcjonalnie)

---

### PROBLEM D: nano_skill_ratings.mastery = -1 w welcome_test payloadach

Starsze testy (3 z 4 retakow studenta fddff19e) maja `nsr_mastery = -1` mimo ze `col_mastery` ma wartosc (np. 50, 55, 70). Round 10 naprawil to dla najnowszego testu, ale starsze dane sa niespojne.

---

### PROBLEM E: Brak mastery w kolumnie dla worksheet/homework eventow

Dane: 103 worksheet eventow i 91 homework eventow maja `mastery = NULL` w kolumnie, mimo ze payload zawiera `nano_skill_ratings` z wartosciami (80, 90, 100 itd.). 

**Przyczyna**: Kod frontendu (`useInteractiveSharedWorksheet.tsx`, `useInteractiveHomework.tsx`) NIE oblicza sredniej mastery z nano_skill_ratings i NIE zapisuje jej do kolumny `mastery` w `student_events`. Uzywa `addEvent()` bez ustawienia mastery.

---

## ANALIZA PAYLOADOW (Twoje pytania 3-6)

### 3. Flashcards - payload POPRAWNY

```json
{
  "set_id": "...", "card_id": "...",
  "mastery": 100, "card_back": "Randka w ciemno",
  "direction": 1, "card_front": "Blind date",
  "repetition": 1, "interval_days": 1,
  "total_reviews": 1, "easiness_factor": 2.5,
  "time_spent_seconds": 2.4
}
```

**Ocena: 9/10** - Payload jest bogaty i zawiera wszystko co potrzebne:
- SM-2 parametry (repetition, interval, EF) - pozwalaja odtworzyc krzywa zapominania
- Tresc fiszki (card_front/back) - kontekst bez dolaaczania do flashcard_cards
- Czas odpowiedzi - miara pewnosci/wahania
- Kierunek (1=front->back, 2=reverse)

**Jedyny problem**: mastery=100 z repetition=1 to bug historyczny (formula jest juz poprawna w triggerze).

### 4. Shared Worksheet - payload POPRAWNY

**Zamkniete cwiczenia**: Mastery 0/100 per pytanie z nano_skill_ratings - idealny sygnal binarny.
**Otwarte cwiczenia**: Mastery 5/30/70 z AI ewaluacja - granulowany sygnal.

**Ocena: 8/10** - Brakuje TYLKO:
- Kolumna `mastery` w `student_events` nie jest wypelniana (srednia z nano_skill_ratings)
- `element_type` jest NULL - powinien byc ustawiony (vocabulary/grammar/etc)

### 5. Homework - payload POPRAWNY

```json
{
  "answer_id": "...", "is_submitted": true,
  "exercise_type": "reading", "exercise_index": 5,
  "nano_skill_ratings": [...],
  "time_spent_seconds": 117.5
}
```

**Ocena: 8/10** - Tak samo jak worksheet, brakuje tylko:
- Kolumna `mastery` = srednia z nano_skill_ratings
- Pole `is_submitted: true` jest cenne (odroznia draft od finalnej odpowiedzi)

### 6. Welcome Test - payloady MIESZANE

**Stary format (z triggera - DO USUNIECIA):**
```json
{"question_id": "...", "question_type": "multiple_choice", "difficulty_level": 3, "time_spent_seconds": 1}
```
Bezuzyteczny - brak answer_id, brak nano_skill_ratings, brak detected_traits.

**Nowy format (z frontendu - POPRAWNY):**
```json
{"answer_id": "wt_q45", "detected_traits": {"final_message": "go"}, "exercise_type": "open_reflection", ...}
```
**Ocena: 7/10** - OK ale:
- Duplikaty z retakow zasmiecaja dane
- Niektore `nano_skill_ratings` nadal maja `mastery: -1`

---

## ANALIZA TABEL (Pytanie 8)

### A. student_events - CENTRALNA TABELA DSLM
**Rola**: Jedyne zrodlo prawdy (Layer A). Immutable event log.
**Status**: Struktura dobra, dane wymagaja czyszczenia.

### B. student_test_questions - TABELA ZRODLOWA
**Rola**: Szczegoly pytan testowych (tresc, poprawna odpowiedz, transkrypcja, ai_score).
**Relacja z DSLM**: NIE jest czescia DSLM. To tabela zrodlowa z ktorej student_events czerpie dane. Nie jest duplikacja - student_events ma zagregowany sygnal, student_test_questions ma surowe dane.

### C. test_skill_results - TABELA PODSUMOWUJACA
**Rola**: Zagregowane wyniki testu per skill (grammar 22%, vocabulary 50%).
**Relacja z DSLM**: To jest proto-Layer B. Podsumowuje wyniki testu per kategoria. W przyszlosci Layer B zastapi te tabele wlasna agregacja.

### D. student_learning_profiles - PROFIL UCZNIA
**Rola**: Wynik AI Analysis welcome testu (motywacja, leki, preferencje, estimated_level).
**Relacja z DSLM**: To jest proto-Layer C. Profil psychologiczny i dydaktyczny. Uzyteczny jako punkt wyjscia.

### E. student_knowledge_entries - NOTATKI NAUCZYCIELA
**Rola**: Reczne obserwacje nauczyciela o uczniu.
**Relacja z DSLM**: Input do Layer A (event `knowledge_entry_added`). Tabela jest zrodlem, event jest logiem.

### F. student_learning_elements - CELE NAUCZANIA
**Rola**: Co nauczyciel chce, zeby uczen opanowal (np. "present simple" -> grammar -> rating 4/5).
**Relacja z DSLM**: Przyszle Layer D (Decision Engine). Definicja celow do ktorych DSLM dopasowuje sciezke.

**Wniosek**: Tyle tabel NIE jest problemem. Kazda ma inna role:
- `student_events` = logi (Layer A)
- `student_test_questions` = dane zrodlowe testu
- `test_skill_results` = agregacja testu (proto Layer B)
- `student_learning_profiles` = profil (proto Layer C)
- `student_knowledge_entries` = dane zrodlowe obserwacji
- `student_learning_elements` = cele (Layer D input)

---

## LAYER A READINESS CHECKLIST

| # | Kryterium | Status | Problem |
|---|-----------|--------|---------|
| 1 | Kazdy event ma unikalna identyfikacje | PASS | UUID id, answer_id w payload |
| 2 | event_type uzywa kanonicznych nazw | PASS | Znormalizowane w Round 8 |
| 3 | event_source jest poprawny | FAIL | 20 eventow z 'test' zamiast 'welcome_test' |
| 4 | Brak duplikatow | FAIL | ~500 smieciowych eventow z triggera, duplikaty retakow |
| 5 | mastery kolumna wypelniona | FAIL | 194+ eventow z NULL mastery mimo danych w payload |
| 6 | Flashcard mastery formula poprawna | PARTIAL | Trigger OK, 55 starych eventow z zawyzona wartoscia |
| 7 | nano_skill_ratings.mastery spoja z kolumna | FAIL | Starsze welcome_test maja -1 w payload ale wartosc w kolumnie |
| 8 | time_spent_seconds dokladny | PASS | visibilitychange dodany w Round 9 |
| 9 | element_type wypelniony | PARTIAL | Worksheet/homework maja NULL |
| 10 | Dane wystarczajace dla Layer B | PARTIAL | Payloady bogate, ale kolumna mastery niespelna |

---

## PLAN NAPRAWCZY - CO TRZEBA ZROBIC PRZED LAYER B

### Krok 1: SQL Migracja - Czyszczenie danych

```sql
-- 1a. Usunac smieci z triggera (NULL answer_id)
DELETE FROM student_events
WHERE event_source = 'welcome_test'
AND event_payload->>'answer_id' IS NULL;

-- 1b. Usunac 20 eventow z event_source='test' (placement tests)
DELETE FROM student_events WHERE event_source = 'test';

-- 1c. Backfill flashcard mastery (55 starych eventow)
UPDATE student_events
SET mastery = CASE
  WHEN (event_payload->>'repetition')::int >= 4 
    AND (event_payload->>'interval_days')::int >= 21 THEN 100
  WHEN (event_payload->>'repetition')::int >= 3 
    AND (event_payload->>'interval_days')::int >= 6 THEN 90
  WHEN (event_payload->>'repetition')::int = 2 THEN 70
  WHEN (event_payload->>'repetition')::int = 1 THEN 50
  WHEN (event_payload->>'repetition')::int = 0 THEN 0
  ELSE 60
END
WHERE event_source = 'flashcard' 
AND mastery = 100
AND (event_payload->>'repetition')::int < 4;

-- Tez zaktualizuj payload.mastery
UPDATE student_events
SET event_payload = jsonb_set(event_payload, '{mastery}', to_jsonb(mastery))
WHERE event_source = 'flashcard'
AND mastery IS NOT NULL
AND (event_payload->>'mastery')::int != mastery;
```

### Krok 2: Backfill mastery kolumny z nano_skill_ratings

```sql
-- Dla worksheet i homework: oblicz srednia mastery z nano_skill_ratings
UPDATE student_events
SET mastery = (
  SELECT ROUND(AVG(val))
  FROM jsonb_array_elements(event_payload->'nano_skill_ratings') elem,
    LATERAL (SELECT (elem->>'mastery')::numeric AS val) sub
  WHERE val >= 0 AND (elem->>'hasValue')::boolean = true
)
WHERE event_type = 'student_learning_activity'
AND mastery IS NULL
AND jsonb_array_length(COALESCE(event_payload->'nano_skill_ratings', '[]'::jsonb)) > 0;
```

### Krok 3: Naprawic frontend - automatyczne mastery w addEvent

W `useInteractiveSharedWorksheet.tsx` i `useInteractiveHomework.tsx` (tam gdzie wola `addEvent`): po obliczeniu `nano_skill_ratings`, wyliczyc srednia i przekazac jako `mastery` parametr do `addEvent`.

Bedzie to wymagalo zmiany sygnatury `addEvent` w `useStudentEvents.tsx` aby akceptowal opcjonalny parametr `mastery`.

### Krok 4: Ustawic element_type dla worksheet/homework eventow

Frontend powinien ustawiac `element_type` na podstawie `exercise_type` przy tworzeniu eventu (np. `fill-in-blanks` -> `grammar`, `reading` -> `reading`).

---

## NASTEPNY ETAP: LAYER B (Metryki i Sygnaly)

Po naprawieniu Layer A, nastepny etap to **Layer B - Obliczanie metryk**:

1. **Agregacja mastery per nano_skill per student** - srednia wazona z ostatnich N eventow
2. **Trend analysis** - czy mastery rosnie/spada w czasie?
3. **Skill breakdown** - automatyczne grupowanie nano_skills w kategorie (grammar, vocabulary, etc.)
4. **Tabela `student_skill_metrics`** - cache obliczonych metryk (odswiezany przy nowym evencie)

Ale to jest temat na nastepny prompt po naprawie Layer A.

---

## PODSUMOWANIE ZMIAN

| Plik | Zmiana | 
|------|--------|
| SQL migracja | Czyszczenie smieciowych eventow, backfill mastery, backfill flashcard |
| `useStudentEvents.tsx` | Dodac parametr mastery do addEvent |
| `useInteractiveSharedWorksheet.tsx` | Obliczac i przekazywac mastery do addEvent |
| `useInteractiveHomework.tsx` | Obliczac i przekazywac mastery do addEvent |
| Mapowanie exercise_type -> element_type | Ustawiac element_type przy tworzeniu eventow |
| 6 plikow dokumentacji | Zaktualizowac |

### Czego NIE zmieniamy:
- Triggery flashcard i welcome_test - dzialaja poprawnie
- process-welcome-test - Round 10 juz naprawil
- SpeakingRecorder, WelcomeTestPage - bez zmian
- Homework, Worksheet rendering - bez zmian
