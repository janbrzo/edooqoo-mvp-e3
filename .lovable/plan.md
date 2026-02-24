

# Plan wdrozenia - skorygowany (Problem 5: Welcome Test)

**UWAGA: Pozostale problemy (1-4) pozostaja BEZ ZMIAN wzgledem poprzedniego planu. Ten dokument opisuje TYLKO skorygowany Problem 5.**

---

## Problem 5: Welcome Test - algorytm Learning Path Score z 15 pytaniami

### Zasada projektowa

Student NIE jest pytany wprost o preferencje sciezki nauki. Zamiast tego stosujemy pytania scenariuszowe/behawioralne (5 nowych) PLUS wyciagamy ukryty sygnal z 10 istniejacych pytan. Lacznie 15 zrodel danych zasila algorytm - to daje statystycznie solidna baze decyzyjna.

---

### CZESC A: 5 nowych pytan behawioralnych (bez zmian wzgledem poprzedniego planu)

Pytania Q3b, Q5b, Q13b, Q17b, Q41b - dokladna specyfikacja jest identyczna jak w poprzednim planie. Wplezione w sekcje about_you, experience, scenarios, goals.

---

### CZESC B: 10 istniejacych pytan jako dodatkowe zrodla sygnalu

Nie zmieniamy ZADNEGO istniejacego pytania. Tylko ODCZYTUJEMY ich odpowiedzi w algorytmie.

#### Mapowanie istniejacych pytan na zmienne algorytmu:

**1. Q3 - motivation_type (juz ma detected_trait)**
```text
Sygnal: instrumental = cel zawodowy/egzaminacyjny = wyzszy drive
Wartosc:
  instrumental = 70
  integrative = 30
  mixed = 50
Waga w algorytmie: 0.06
```

**2. Q4 - ambiguity_tolerance (juz ma detected_trait)**
```text
Sygnal: wysoka tolerancja = zniesie trudniejsza sciezke, nieznajosc nie paralizuje
Wartosc:
  high = 75
  medium = 45
  low = 15
Waga w algorytmie: 0.06
```

**3. Q5 - weekly_study_time (juz ma detected_trait)**
```text
Sygnal: wiecej czasu = wiecej mozliwosci na przyspieszona sciezke
Wartosc:
  none = 10 (brak czasu = comfort path obowiazkowy)
  15_30_min = 25
  1_hour = 45
  2_3_hours = 70
  3_plus_hours = 90
Waga w algorytmie: 0.07
```

**4. Q7 - anxiety_level (juz ma detected_trait)**
```text
Sygnal: wysoki lek = potrzebuje bezpiecznej, przewidywalnej sciezki
Wartosc (ODWROTNA - wysoki lek = niski score):
  low = 70
  medium = 40
  high = 10
Waga w algorytmie: 0.06
```

**5. Q9 - learning_duration (NIE ma detected_trait - trzeba odczytac z odpowiedzi)**
```text
Sygnal: dluga nauka bez efektu = fosylizacja bledow, potrzeba systematycznej sciezki.
Krotka nauka = swiezy umysl, latwiej przyspieszyc.
Odczyt: index odpowiedzi (0-4)
Wartosc:
  0 (< 1 rok) = 70 (swiezy, mozna przyspieszyc)
  1 (1-3 lata) = 60
  2 (3-5 lat) = 45
  3 (5-10 lat) = 30 (prawdopodobna fosylizacja)
  4 (10+ lat) = 15 (prawie pewna fosylizacja, trzeba systematycznie)
Waga w algorytmie: 0.04
```

**6. Q10 - learning_sources (multi-select, NIE ma detected_trait)**
```text
Sygnal: self-study/work = autonomia = wyzszy grit.
Tylko school = pasywny = potrzebuje prowadzenia.
Odczyt: tablica wybranych indeksow
Logika: jezeli zawiera "Self-study" (index 4) LUB "Through work" (index 6) = autonomy_score = 70
         jezeli zawiera "Living/working abroad" (index 5) = 80
         jezeli TYLKO "School" (index 0) = 20
         inaczej = 40
Waga w algorytmie: 0.04
```

**7. Q14 - error_attitude (juz ma detected_trait)**
```text
Sygnal: comfortable z bledami = nie boi sie trudniejszej sciezki
Wartosc:
  comfortable = 75
  cautious = 40
  avoidant = 10
Waga w algorytmie: 0.05
```

**8. Q15 - reading_strategy (NIE ma detected_trait)**
```text
Sygnal: "guess from context" = wysoka tolerancja niepewnosci = lepiej zniesie niestandardowa sciezke
Odczyt: index odpowiedzi (0-4)
Wartosc:
  0 (read carefully, look up) = 50 (systematyczny ale wytrwaly)
  1 (ask to clarify) = 55 (aktywny, nie unika)
  2 (guess from context) = 75 (wysoka tolerancja)
  3 (struggle, translate) = 25 (potrzebuje wsparcia)
  4 (use ChatGPT) = 35 (unika, ale pragmatyczny)
Waga w algorytmie: 0.04
```

**9. Q42 - feedback_preference (juz ma detected_trait)**
```text
Sygnal: "self-correct" = wysoka autonomia, "immediate" = chce szybko poprawiac = drive
Wartosc:
  immediate = 65 (wysoki drive do poprawy)
  delayed_discussion = 45
  major_only = 35 (nie zalezy mu na perfekcji)
  written_review = 50
  self_correct = 70 (wysoka autonomia)
Waga w algorytmie: 0.04
```

**10. Q44 - confidence_matrix (self_assessment_matrix, NIE ma detected_trait)**
```text
Sygnal: srednia pewnosc siebie we wszystkich 6 obszarach. Wysoka pewnosc = mozna stawiac wieksze wyzwania.
Odczyt: srednia arytmetyczna z 6 wartosci (1-5), przeskalowana na 0-100
Logika: avg = srednia(speaking_strangers, writing_emails, movies, news, presentations, small_talk)
        confidence_score = (avg - 1) * 25   // 1->0, 2->25, 3->50, 4->75, 5->100
Waga w algorytmie: 0.04
```

---

### CZESC C: Pelny algorytm Learning Path Score

**Zmienne wejsciowe z 5 nowych pytan (laczna waga: 0.50):**

```text
// Z Q5b - deadline_response (waga 0.10)
deadline_score:
  intense_preparation = 80
  pragmatic_coping = 60
  avoidance = 20
  confident = 50

// Z Q41b - learning_timeline (waga 0.15)
timeline_score:
  urgent_specific = 95
  ongoing_important = 60
  long_term_steady = 25
  hobby_growth = 10

// Z Q13b - persistence_level (waga 0.10)
persistence_score:
  high = 80
  medium = 50
  low = 20

// Z Q17b - career_english_importance (waga 0.10)
importance_score:
  critical = 90
  high = 70
  moderate = 40
  not_career = 15

// Z Q3b - usage_context (waga 0.05)
context_score:
  work_formal = 70 (formalny kontekst = wyzsze wymagania = wyzszy drive)
  professional_field = 80 (ESP = silna specjalizacja)
  travel = 40
  social = 35
  online_informal = 30
  content_consumption = 25
  // Jezeli multi-select: wez najwyzsza wartosc
```

**Zmienne wejsciowe z 10 istniejacych pytan (laczna waga: 0.50):**

```text
// Q3  - motivation_type         waga 0.06
// Q4  - ambiguity_tolerance     waga 0.06
// Q5  - weekly_study_time       waga 0.07
// Q7  - anxiety_level           waga 0.06
// Q9  - learning_duration       waga 0.04
// Q10 - learning_autonomy       waga 0.04
// Q14 - error_attitude          waga 0.05
// Q15 - reading_strategy        waga 0.04
// Q42 - feedback_preference     waga 0.04
// Q44 - confidence_overall      waga 0.04
```

**Wzor obliczania:**

```text
learning_path_score = (
  // 5 nowych pytan (50%)
  deadline_score     * 0.10 +
  timeline_score     * 0.15 +
  persistence_score  * 0.10 +
  importance_score   * 0.10 +
  context_score      * 0.05 +

  // 10 istniejacych pytan (50%)
  motivation_score        * 0.06 +
  ambiguity_score         * 0.06 +
  study_time_score        * 0.07 +
  anxiety_score           * 0.06 +
  learning_duration_score * 0.04 +
  autonomy_score          * 0.04 +
  error_attitude_score    * 0.05 +
  reading_strategy_score  * 0.04 +
  feedback_score          * 0.04 +
  confidence_score        * 0.04
)

// Clamp do 0-100
learning_path_score = Math.max(0, Math.min(100, learning_path_score))
```

**Suma wag: 0.10 + 0.15 + 0.10 + 0.10 + 0.05 + 0.06 + 0.06 + 0.07 + 0.06 + 0.04 + 0.04 + 0.05 + 0.04 + 0.04 + 0.04 = 1.00**

**Reguly nadrzedne (overrides):**

```text
// Regula 1: Pilny deadline + krytyczny cel = ZAWSZE target path
if (timeline === 'urgent_specific' && importance === 'critical') {
  learning_path_score = Math.max(learning_path_score, 85);
}

// Regula 2: Leniwy + hobby = ZAWSZE comfort path
if (persistence === 'low' && timeline === 'hobby_growth') {
  learning_path_score = Math.min(learning_path_score, 25);
}

// Regula 3: Pilny deadline + leniwy = deadline podnosi motywacje
if (timeline === 'urgent_specific' && persistence === 'low') {
  learning_path_score = Math.max(learning_path_score, 70);
}

// Regula 4: Bardzo wysoki lek + brak czasu = bezwzgledny comfort
if (anxiety === 'high' && study_time === 'none') {
  learning_path_score = Math.min(learning_path_score, 20);
}

// Regula 5: Dluga nauka (10+ lat) + niski grit = fosylizacja, potrzeba resetu
if (learning_duration_index === 4 && persistence === 'low') {
  learning_path_score = Math.min(learning_path_score, 30);
}
```

**Interpretacja wyniku:**

```text
  0-25:  "Comfort Path"     - Natural Order, wolne tempo, duzo powtorzen, kolejnosc wg badan
 26-50:  "Guided Path"      - fundament tradycyjny, tematy dopasowane do kontekstu, umiarkowane tempo
 51-75:  "Accelerated Path" - mozna przeskakiwac mniej istotne struktury, goal-relevant grammar, szybsze tempo
 76-100: "Target Path"      - reverse engineering od celu, nauka chunkami, pomijanie nieistotnych struktur
```

---

### CZESC D: Odpornosc algorytmu (Robustness)

**Co jesli student nie odpowie na wszystkie pytania?**

Kazda zmienna ma fallback = 50 (neutralna wartosc). Jesli brakuje odpowiedzi na dane pytanie, uzywamy 50.

**Co jesli student odpowie aspiracyjnie na nowe pytania?**

Dlatego 50% wagi pochodzi z ISTNIEJACYCH pytan, ktore nie sa bezposrednio o sciezce nauki. Student nie wie, ze jego odpowiedz na "How do you react when you don't understand?" (Q4) wplywa na dobor sciezki. To sa pytania o naturalnych reakcjach, nie o preferencjach.

Dodatkowo 3 z 5 nowych pytan sa scenariuszowe (Q5b, Q13b, Q17b) - pytaja "co ROBISZ" a nie "co CHCESZ". Tylko Q41b jest bardziej deklaratywna, ale pytanie jest sformulowane jako opis sytuacji ("Which is closest to yours?") a nie jako preferencja.

**Walidacja krzyzowa:**

Algorytm mozna walidowac porownujac deklarowany poziom pewnosci siebie (Q44) z rzeczywistymi wynikami gramatyki/vocab (Q20-Q35). Jesli student deklaruje wysoka pewnosc ale ma niskie wyniki = overestimates = confidence_score powinna byc obnizona. To jest juz realizowane przez istniejacy mechanizm `level_confidence` w process-welcome-test.

---

### CZESC E: Implementacja techniczna

**Plik 1: `src/data/welcomeTestQuestions.ts`**
- Dodac 5 nowych pytan w odpowiednich sekcjach (identycznie jak w poprzednim planie)
- Rozmieszczenie:
  - Q3b po Q3 (about_you)
  - Q5b po Q5 (about_you)
  - Q13b po Q13 (experience)
  - Q17b po Q17 (scenarios)
  - Q41b po Q41 (goals)

**Plik 2: `src/types/welcomeTest.ts`**
- Dodac komentarz dokumentujacy learning_path_score w raw_answers
- Dodac typ LearningPathResult:
```text
export interface LearningPathResult {
  score: number;                    // 0-100
  path: 'comfort' | 'guided' | 'accelerated' | 'target';
  component_scores: {
    deadline_response: number;
    learning_timeline: number;
    persistence_level: number;
    career_importance: number;
    usage_context: number;
    motivation_type: number;
    ambiguity_tolerance: number;
    weekly_study_time: number;
    anxiety_level: number;
    learning_duration: number;
    learning_autonomy: number;
    error_attitude: number;
    reading_strategy: number;
    feedback_preference: number;
    confidence_overall: number;
  };
  overrides_applied: string[];      // np. ['urgent_critical_override']
}
```

**Plik 3: `supabase/functions/process-welcome-test/index.ts`**
- Dodac nowa funkcje `calculateLearningPathScore(detectedTraits, rawAnswers)`:
  1. Wyciagnac detected_traits z 5 nowych pytan (Q3b, Q5b, Q13b, Q17b, Q41b)
  2. Wyciagnac detected_traits z 5 istniejacych pytan z trait (Q3, Q4, Q7, Q14, Q42)
  3. Wyciagnac odpowiedzi z 5 istniejacych pytan BEZ trait (Q5, Q9, Q10, Q15, Q44) - odczytac indeks odpowiedzi z raw_answers
  4. Obliczyc kazda zmienna wedlug mapowania powyzej
  5. Obliczyc weighted sum
  6. Zastosowac reguly nadrzedne
  7. Clamp do 0-100
  8. Zwrocic LearningPathResult

- Wywolac ta funkcje PO zakonczeniu analizy AI (scoring pytan otwartych)
- Zapisac wynik w `raw_answers.learning_path` jako JSON

**WAZNE:** Prompt do AI (process-welcome-test) NIE jest zmieniany. Obliczanie Learning Path Score jest CZYSTO DETERMINISTYCZNE - nie wymaga AI. To prosta matematyka na detected_traits i indeksach odpowiedzi.

---

### CZESC F: Co NIE wchodzi w zakres tego wdrozenia

1. **Layer D (dobor sciezki nauki)** - algorytm oblicza score ale jeszcze NIE wplywa na generowanie worksheetow. To bedzie osobne zadanie.
2. **UI wyswietlania wyniku** - score bedzie widoczny w WelcomeTestResults ale bez wizualnej sciezki. To bedzie osobne zadanie.
3. **Dynamiczna modyfikacja sciezki** - score jest obliczany raz, przy zakonczeniu testu. Nie zmienia sie w czasie. Przyszla wersja moze go aktualizowac.

---

### Pliki do zmiany (Problem 5)

| Plik | Zmiana |
|---|---|
| `src/data/welcomeTestQuestions.ts` | 5 nowych pytan behawioralnych wplecionych w sekcje |
| `src/types/welcomeTest.ts` | Nowy typ LearningPathResult + komentarz |
| `supabase/functions/process-welcome-test/index.ts` | Nowa funkcja calculateLearningPathScore() + zapis w raw_answers |

