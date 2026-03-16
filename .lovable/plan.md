# Plan: Phase 7 — SEO Keyword Gap Closure

## Analiza luk

Mamy obecnie ~100 URL w sitemap, ale analiza zapytań nauczycieli angielskiego ujawnia **4 duże luki tematyczne**, które konkurencja pokrywa a my nie:

### LUKA 1: Brakujące tematy gramatyczne (7 stron)

Nauczyciele masowo szukają "modal verbs worksheets", "future tenses worksheets", "phrasal verbs exercises" — a my mamy tylko 8 tematów gramatycznych. Brakuje najpopularniejszych:


| #   | Plik                                               | Docelowe zapytanie                     |
| --- | -------------------------------------------------- | -------------------------------------- |
| 1   | `public/modal-verbs-worksheets-esl.html`           | "modal verbs worksheets ESL"           |
| 2   | `public/future-tenses-worksheets-english.html`     | "future tenses worksheets English"     |
| 3   | `public/relative-clauses-worksheets.html`          | "relative clauses worksheets ESL"      |
| 4   | `public/gerunds-infinitives-worksheets.html`       | "gerunds and infinitives exercises"    |
| 5   | `public/comparatives-superlatives-worksheets.html` | "comparatives superlatives worksheets" |
| 6   | `public/phrasal-verbs-worksheets-esl.html`         | "phrasal verbs worksheets ESL"         |
| 7   | `public/question-tags-worksheets.html`             | "question tags exercises English"      |


### LUKA 2: Strony umiejętności językowych (4 strony)

Nauczyciele szukają materiałów wg umiejętności ("speaking activities ESL", "writing worksheets"). Mamy strony wg ćwiczeń i gramatyki, ale NIE wg skills:


| #   | Plik                                                | Docelowe zapytanie                      |
| --- | --------------------------------------------------- | --------------------------------------- |
| 8   | `public/speaking-activities-esl-worksheets.html`    | "speaking activities ESL worksheets"    |
| 9   | `public/writing-worksheets-esl.html`                | "writing exercises ESL worksheets"      |
| 10  | `public/reading-activities-english-worksheets.html` | "reading activities English worksheets" |
| 11  | `public/listening-activities-esl-worksheets.html`   | "listening activities ESL worksheets"   |


### LUKA 3: Więcej porównań z konkurencją (4 strony)

Mamy 4 porównania, ale brakuje porównań z narzędziami, które nauczyciele też używają:


| #   | Plik                                 | Docelowe zapytanie                  |
| --- | ------------------------------------ | ----------------------------------- |
| 12  | `public/edooqoo-vs-quizlet.html`     | "worksheet generator vs Quizlet"    |
| 13  | `public/edooqoo-vs-kahoot.html`      | "ESL tools vs Kahoot"               |
| 14  | `public/edooqoo-vs-wordwall.html`    | "Wordwall alternative for teachers" |
| 15  | `public/edooqoo-vs-busyteacher.html` | "BusyTeacher alternative AI"        |


### LUKA 4: "How to teach X" blog cluster (40 artykułów)

Bardzo popularne zapytania informacyjne — budują autorytet tematyczny i przyciągają organic traffic:


| #   | Plik                                                        | Docelowe zapytanie                   |
| --- | ----------------------------------------------------------- | ------------------------------------ |
| 16  | `public/blog/how-to-teach-english-grammar-effectively.html` | "how to teach English grammar"       |
| 17  | `public/blog/how-to-teach-speaking-esl.html`                | "how to teach speaking ESL"          |
| 18  | `public/blog/how-to-teach-writing-esl-students.html`        | "how to teach writing ESL"           |
| 19  | `public/blog/how-to-teach-english-pronunciation.html`       | "how to teach English pronunciation" |
| 20  | `public/blog/how-to-plan-english-lessons-effectively.html`  | "how to plan English lessons"        |
| 21  | `public/blog/classroom-management-esl-tips.html`            | "classroom management ESL tips"      |


---

## Struktura każdej strony

Identyczna jak istniejące strony (np. `present-simple-worksheets.html`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Keyword] — Edooqoo</title>
  <meta name="description" content="[160 chars]">
  <meta name="keywords" content="[5-8 keywords]">
  <link rel="canonical" href="https://edooqoo.com/[filename]">
  <script type="application/ld+json">{LearningResource/BlogPosting}</script>
  <style>/* identyczny styl */</style>
</head>
<body>
  <nav><a href="https://edooqoo.com">← Edooqoo Home</a></nav>
  <h1>[H1]</h1>
  <!-- 1500-2000 słów, H2/H3, tabele, FAQ details/summary, CTA -->
  <h2>Related Resources</h2>
  <!-- 6-8 cross-linków -->
  <a class="cta" href="https://edooqoo.com/signup">Try Edooqoo Free →</a>
</body>
</html>
```

- Landing pages (1-15): schemat `LearningResource`
- Blog (16-21): schemat `BlogPosting` z `datePublished: 2026-03-16`

---

## Aktualizacje istniejących plików

### GlobalFooter — rozszerzenie kolumny "Grammar"

Dodanie 3 nowych linków do kolumny Grammar (zachowując 6 istniejących + dodając pod spodem):

- Modal Verbs → `/modal-verbs-worksheets-esl.html`
- Future Tenses → `/future-tenses-worksheets-english.html`  
- Phrasal Verbs → `/phrasal-verbs-worksheets-esl.html`

Razem kolumna Grammar będzie miała 9 linków (6 obecnych + 3 nowe).

### Sitemap — dodanie 21 nowych URL

- 15 landing pages z `priority` 0.7-0.8
- 40 blog z `priority` 0.7
- `lastmod` = `2026-03-16`
- Łączna liczba entries: ~121

### llms.txt — nowe sekcje

- Dodanie sekcji "Skills-Based Worksheets" z 4 linkami
- Rozszerzenie "Grammar Topic Worksheets" o 7 nowych
- Rozszerzenie "Comparisons" o 4 nowe
- Dodanie "How to Teach (Blog)" z 40 linkami

### openapi.yaml — 21 nowych paths

Każda nowa strona dostaje wpis w `paths:` z `operationId`, `summary`, `description`.

### resources.html — cross-linking

- Rozszerzenie sekcji "Grammar Worksheets" o 7 nowych linków
- Nowa sekcja "Skills-Based Worksheets" z 4 linkami
- Rozszerzenie sekcji "Compare" o 4 nowe porównania

### blog.html — cross-linking

- Nowa sekcja "How to Teach" z 6 kartami artykułów

### Blog.tsx (React) — dodanie 6 nowych wpisów

Do tablicy `blogPosts` dodać 6 nowych obiektów w kategorii "How to Teach".

### .lovable/plan.md — aktualizacja dokumentacji

---

## Kolejność implementacji (1 krok)

**Krok 1** (pliki 1-15 + infrastruktura):

1. Stworzenie 7 stron gramatycznych
2. Stworzenie 4 stron skills
3. Stworzenie 4 stron porównań
4. Aktualizacja GlobalFooter (3 nowe linki w Grammar)

  
5. Stworzenie 40 artykułów blog "How to Teach"  
6. Aktualizacja sitemap.xml (+21 entries)  
7. Aktualizacja llms.txt  
8. Aktualizacja openapi.yaml (+21 paths)  
9. Aktualizacja resources.html (cross-linking)  
10. Aktualizacja blog.html (cross-linking)  
11. Aktualizacja Blog.tsx (+6 wpisów)  
12. Aktualizacja .lovable/plan.md

---

## Podsumowanie zmian


| Element               | Przed (Phase 6) | Po (Phase 7) |
| --------------------- | --------------- | ------------ |
| Statyczne HTML        | 56              | 71           |
| Blog articles         | 21              | 60           |
| Sitemap entries       | ~100            | ~121         |
| Tematy gramatyczne    | 8               | 15           |
| Porównania            | 4               | 8            |
| Footer Grammar linków | 6               | 9            |
| Pokryte klastry       | 9               | 13           |


**Ryzyko:** ZEROWE — wyłącznie nowe statyczne pliki HTML + kosmetyczne rozszerzenia footera i meta. Żadna logika aplikacji się nie zmienia.