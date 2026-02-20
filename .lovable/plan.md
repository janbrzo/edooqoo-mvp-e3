
# DSLM - Plan po wdrożeniu Layer B

---

## STATUS WARSTW

| Layer | Status | Opis |
|-------|--------|------|
| Layer A: Events Log | ✅ GOTOWA | 1447+ eventów, 749 nano_skills, triggery auto-mastery |
| Layer B: Metrics & Signals | ✅ GOTOWA | 855 metryki, 7 kategorii, radar chart, auto-refresh trigger |
| Layer C: Student Profile | 🔜 NASTĘPNY | Automatyczny profil z Layer B + welcome_test traits |
| Layer D: Decision Engine | 📋 PLANOWANY | Rekomendacje ćwiczeń, personalizacja trudności |

---

## LAYER B - CO ZBUDOWALIŚMY

1. **Tabela `student_skill_metrics`** - cache zagregowanych metryk per nano_skill per student
2. **Funkcja `compute_skill_metric()`** - ważona średnia mastery (exp decay, half-life ~23 dni) + trend
3. **Funkcja `extract_skill_category()`** - mapuje 20+ prefiksów ns.* na 7 kategorii
4. **Trigger `trg_refresh_skill_metrics`** - auto-odświeża po INSERT do student_events
5. **View `student_category_metrics`** - agregacja per kategoria
6. **Funkcja `backfill_skill_metrics()`** - jednorazowy backfill (859 skills obliczonych)
7. **Frontend: SkillsOverviewPanel** - radar chart + category breakdown + nano_skill list
8. **Nowa zakładka "Skills"** w StudentPage (9 zakładek total)

---

## NASTĘPNY ETAP: LAYER C (Student Profile)

### Cel
Automatycznie generować profil umiejętności studenta z Layer B, połączony z danymi welcome_test.

### Planowane elementy
- Rozszerzenie `student_learning_profiles` o pola z Layer B
- Automatyczny update profilu przy zmianie metryk
- Identyfikacja silnych/słabych stron per kategoria
- Historia postępów w czasie (wykresy)
- Widok w UI (profil studenta z timeline)

---

## ETAP 4: LAYER D (Decision Engine) - PRZYSZŁOŚĆ

- Rekomendacje ćwiczeń na podstawie luk
- Dopasowanie trudności do poziomu studenta
- Sugestie tematów na podstawie zainteresowań
- Integracja z future_worksheet_suggestions
- Personalizacja promptu do generowania worksheetów
