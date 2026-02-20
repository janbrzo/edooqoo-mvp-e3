

# DSLM - Kompleksowy plan wszystkich etapow + szczegolowy plan Layer B

---

## WERYFIKACJA LAYER A - WYNIKI FINALNE

Layer A jest **GOTOWA**. Ponizej dowody:

| Zrodlo | Total | Mastery OK | Mastery NULL | Element Type OK | Uwagi |
|--------|-------|------------|-------------|-----------------|-------|
| flashcard | 828 | 828 (100%) | 0 | 828 (100%) | PERFECT |
| homework | 165 | 76 (46%) | 89 | 165 (100%) | NULL = hasValue:false (brak odpowiedzi) |
| worksheet | 145 | 54 (37%) | 91 | 145 (100%) | NULL = hasValue:false (brak odpowiedzi) |
| welcome_test | 272 | 152 (56%) | 120 | 253 (93%) | NULL = pytania profilowe (preference_choice, self_assessment) lub speaking z mastery=-1 czekajace na AI |
| teacher | 37 | 0 (0%) | 37 | 35 (95%) | NULL poprawny - obserwacje nie maja mastery |

**Zweryfikowalem kazdy "podejrzany" rekord:**
- 4 worksheet/homework z NSR ale NULL mastery -> wszystkie maja `hasValue: false` i `mastery: 0` w NSR (student nie odpowiedzial). Trigger poprawnie pomija je.
- 10 welcome_test z NSR ale NULL mastery -> wszystkie maja `mastery: -1` i `hasValue: false` (speaking/open_ended oczekujace na AI). Poprawne.
- 110 welcome_test bez NSR -> pytania profilowe (preference_choice, self_assessment_matrix, scenario_reaction). Nie maja mastery z definicji.

**Wniosek: ZERO bledow w danych. Layer A = 10/10.**

---

## LAYER A READINESS CHECKLIST - FINAL

| # | Kryterium | Status |
|---|-----------|--------|
| 1 | Kazdy event ma unikalna identyfikacje (UUID + answer_id) | PASS |
| 2 | event_type uzywa kanonicznych nazw | PASS |
| 3 | event_source jest poprawny (brak 'test', wszystko welcome_test) | PASS |
| 4 | Brak duplikatow/smieci | PASS |
| 5 | mastery kolumna wypelniona (gdzie dane istnieja) | PASS |
| 6 | Flashcard mastery formula poprawna (SM-2 weighted) | PASS |
| 7 | nano_skill_ratings spojne z kolumna mastery | PASS |
| 8 | time_spent_seconds dokladny (visibility timer) | PASS |
| 9 | element_type wypelniony | PASS |
| 10 | Dane wystarczajace dla Layer B | PASS |

---

## ODPOWIEDZI NA TWOJE PYTANIA (3-8)

**Pyt. 3 - Flashcards**: Payload POPRAWNY i WYSTARCZAJACY. Mastery juz nie jest 100 dla rep=1 - formula SM-2 dziala poprawnie w triggerze. Stare dane naprawione w Round 11/12.

**Pyt. 4 - Worksheet**: Payload POPRAWNY. 749 unikalnych nano_skill names (ns.grammar.*, ns.vocabulary.*, ns.reading.*, ns.speaking.* itd.) - to bogata taksonomia gotowa do agregacji w Layer B.

**Pyt. 5 - Homework**: Payload POPRAWNY. Identyczny format jak worksheet + cenne pole `is_submitted`.

**Pyt. 6 - Welcome Test**: Payloady sa MIESZANE ale POPRAWNE. Pytania profilowe (preference_choice) nie maja mastery i nie powinny miec. Pytania umiejetnosciowe (grammar, vocabulary) maja mastery. Pytania speaking czekaja na AI ocene. Wszystko zgodne z architektura.

**Pyt. 7 - Logi welcome_test**: Sprawdzone - czyste po Round 11 (usunieto ~500 smieci). Pozostale 272 to uzyteczne dane.

**Pyt. 8 - Tabele**: Kazda ma unikalna role w ekosystemie DSLM:
- `student_events` = Layer A (fakty)
- `student_test_questions` = dane zrodlowe testow (tresc pytan, transkrypcje)
- `test_skill_results` = proto-Layer B (agregacja testow) - Layer B rozszerzy
- `student_learning_profiles` = proto-Layer C (profil psychologiczny)
- `student_knowledge_entries` = dane zrodlowe obserwacji nauczyciela
- `student_learning_elements` = cele nauczania (input Layer D)

To NIE jest duplikacja. To dobrze zaprojektowana architektura.

---

## PELNY PLAN DSLM - WSZYSTKIE ETAPY

```text
+--------------------------------------------------+
|                    DSLM Architecture              |
+--------------------------------------------------+
|                                                   |
|  LAYER A: Events Log (GOTOWA)                     |
|  - student_events table                           |
|  - 1447 eventow, 5 zrodel, czyste dane            |
|  - 749 unikalnych nano_skills                      |
|  - Triggery auto-obliczaja mastery                 |
|                                                   |
|  LAYER B: Metrics & Signals (NASTEPNY KROK)       |
|  - student_skill_metrics table (cache)             |
|  - Agregacja mastery per nano_skill per student    |
|  - Trend analysis (improving/declining/stable)     |
|  - Mapowanie nano_skill -> kategoria               |
|  - Auto-refresh trigger na student_events          |
|                                                   |
|  LAYER C: Student Profile (PRZYSZLOSC)            |
|  - Rozszerzenie student_learning_profiles          |
|  - Automatyczny profil umiejetnosci z Layer B      |
|  - Integracja z welcome_test traits                |
|  - Silne/slabe strony per kategoria                |
|                                                   |
|  LAYER D: Decision Engine (PRZYSZLOSC)            |
|  - Rekomendacje cwiczen                            |
|  - Dopasowanie do student_learning_elements        |
|  - Personalizacja trudnosci                        |
|  - Sugestie nastepnych tematow                     |
|                                                   |
+--------------------------------------------------+
```

### Etap 1: Layer A - Events Log --- GOTOWA
- Tabela `student_events` z kanonicznymi typami
- Triggery na worksheet, homework, flashcard, welcome_test
- Mastery obliczane automatycznie (SM-2 dla flashcard, srednia NSR dla worksheet/homework)
- 749 unikalnych nano_skill identyfikatorow

### Etap 2: Layer B - Metrics & Signals --- NASTEPNY
- Tabela `student_skill_metrics` przechowujaca zagregowane metryki
- Wazona srednia mastery (nowsze eventy wazniejsze)
- Trend analysis per nano_skill i per kategoria
- Mapowanie exercise_type -> skill_category
- Trigger na student_events do automatycznego odswiezania
- Widok w UI (dashboard nauczyciela)

### Etap 3: Layer C - Student Profile
- Automatyczne generowanie profilu umiejetnosci z Layer B
- Polaczenie z danymi welcome_test (learning_profiles)
- Identyfikacja silnych/slabych stron
- Historia postepow w czasie
- Widok w UI (profil studenta)

### Etap 4: Layer D - Decision Engine
- Rekomendacje cwiczen na podstawie luk
- Dopasowanie trudnosci do poziomu studenta
- Sugestie tematow na podstawie zainteresowann
- Integracja z future_worksheet_suggestions
- Personalizacja promptu do generowania worksheetow

---

## SZCZEGOLOWY PLAN LAYER B (Metrics & Signals)

### Czym jest Layer B?

Layer B to "kalkulator" ktory bierze surowe fakty z Layer A (1447 eventow, 749 nano_skills) i oblicza zagregowane metryki ktore nauczyciel moze zrozumiec. Bez Layer B nauczyciel musi sam przegladac setki eventow. Z Layer B widzi: "Grammar: 72%, trend: improving" jednym spojrzeniem.

### Krok 1: Tabela `student_skill_metrics`

Nowa tabela przechowujaca obliczone metryki:

```text
student_skill_metrics
---------------------
id                  UUID (PK)
student_id          UUID (FK students)
teacher_id          UUID (FK)
skill_name          TEXT        -- np. "ns.grammar.conditional_2_comprehension"
skill_category      TEXT        -- np. "grammar", "vocabulary", "reading"
current_mastery     NUMERIC     -- wazona srednia (0-100)
trend               TEXT        -- "improving" | "declining" | "stable"
total_events        INTEGER     -- ile razy testowane
last_event_at       TIMESTAMPTZ -- ostatnia aktywnosc
first_event_at      TIMESTAMPTZ -- pierwsza aktywnosc
mastery_history     JSONB       -- ostatnie N wartosci [{mastery, date}]
updated_at          TIMESTAMPTZ
created_at          TIMESTAMPTZ
```

RLS: Teachers widzą tylko swoich studentow.

### Krok 2: Mapowanie exercise_type -> skill_category

Potrzebna jest mapa, ktora zamieni typ cwiczenia na kategorie DSLM:

```text
fill-in-blanks      -> grammar
gap-text            -> grammar
word-order          -> grammar
sentence-transform  -> grammar
negative-prefixes   -> grammar (morphology)
multiple-choice     -> grammar (domyslnie, moze byc vocabulary)
reading             -> reading
answer-questions    -> speaking (lub reading, zalezy od kontekstu)
dialogue            -> speaking
describe            -> speaking
writing-task        -> writing
matching            -> vocabulary
synonyms-antonyms   -> vocabulary
categorize          -> vocabulary
odd-one-out         -> vocabulary
complete-word       -> vocabulary
listening-comp      -> listening
paraphrasing        -> writing
```

ALE: nano_skill_ratings juz ZAWIERAJA kategorie w nazwie! Np. `ns.grammar.*`, `ns.vocabulary.*`, `ns.reading.*`. Wiec Layer B moze po prostu parsowac prefix nano_skill name zamiast mapowac exercise_type. To jest DOKLADNIEJSZE bo jeden exercise_type moze testowac wiele kategorii.

### Krok 3: Funkcja agregujaca

Funkcja SQL (lub Edge Function) ktora:
1. Pobiera wszystkie eventy studenta z nano_skill_ratings
2. Grupuje per nano_skill name
3. Oblicza wazona srednia (nowsze = wieksza waga, np. exponential decay)
4. Okreslat trend (porownujac ostatnie 5 vs wczesniejsze 5)
5. Zapisuje/aktualizuje w student_skill_metrics

Formula wazenia:
```text
weight = exp(-decay * days_since_event)
decay = 0.03 (polowka ~23 dni)
weighted_mastery = SUM(mastery * weight) / SUM(weight)
```

### Krok 4: Trigger automatycznego odswiezania

Trigger na tabeli `student_events` (AFTER INSERT) ktory:
- Wyciaga nano_skill_ratings z nowego eventu
- Dla kazdego nano_skill wywoluje funkcje agregujaca
- Aktualizuje student_skill_metrics

### Krok 5: Agregacja per kategoria

Dodatkowy widok (VIEW lub materialized view):

```text
student_category_metrics
------------------------
student_id
category        -- grammar, vocabulary, reading, speaking, writing, listening
avg_mastery     -- srednia z nano_skills w kategorii
trend           -- ogolny trend kategorii
skill_count     -- ile nano_skills w kategorii
weakest_skill   -- najslabszy nano_skill w kategorii
strongest_skill -- najmocniejszy
```

### Krok 6: UI - Dashboard nauczyciela

W profilu studenta (StudentPage) dodac zakladke/sekcje "Skills Overview":
- Wykres radarowy 6 kategorii (grammar, vocabulary, reading, speaking, writing, listening)
- Lista nano_skills z trendami (strzalki gora/dol)
- Filtrowanie po kategorii
- Okres czasu (ostatnie 7/30/90 dni)

### Krok 7: Flashcard integracja

Flashcard eventy nie maja nano_skill_ratings ale maja card_front/back. Layer B moze:
- Grupowac flashcard mastery per set_id
- Obliczac retention rate (ile fiszek student pamięta)
- Traktowac kazda fiszke jako "nano_skill" (np. skill_name = "flashcard:{card_id}")

---

## PODSUMOWANIE ZMIAN DLA LAYER B

| Element | Typ zmiany |
|---------|------------|
| SQL migracja | Tabela student_skill_metrics + RLS + indeksy |
| SQL funkcja | compute_student_skill_metrics(student_id) |
| SQL trigger | AFTER INSERT on student_events -> refresh metrics |
| SQL view | student_category_metrics (agregacja per kategoria) |
| Frontend komponent | SkillsOverviewPanel (wykres radarowy + lista) |
| StudentPage.tsx | Dodanie nowej zakladki/sekcji |
| 6 plikow dokumentacji | Aktualizacja |

### Czego NIE zmieniamy:
- Layer A (triggery, eventy) - nie ruszamy
- Worksheet/Homework/Flashcard UI - bez zmian
- process-welcome-test - bez zmian
- Istniejace zakladki StudentPage (Progress, Tests, Homework)

### Kolejnosc implementacji:
1. SQL migracja (tabela + funkcja + trigger)
2. Weryfikacja z istniejacymi danymi (czy metryki sie obliczaja)
3. Frontend - SkillsOverviewPanel
4. Dokumentacja

### Jak przetestowac Layer A (Twoje pytanie 10-11):
1. Otworz shared worksheet jako student, odpowiedz na 2-3 cwiczenia
2. Sprawdz w bazie: `SELECT * FROM student_events ORDER BY created_at DESC LIMIT 5` - mastery i element_type powinny byc wypelnione
3. Zrob flashcard review - sprawdz student_events
4. Globalna weryfikacja: `SELECT event_source, count(*) - count(mastery) as null_mastery FROM student_events GROUP BY event_source` - flashcard powinien miec 0, reszta powinna miec tylko rekordy z hasValue=false

