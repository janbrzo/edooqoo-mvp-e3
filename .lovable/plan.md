

# Plan: Phase 8 — SEO Infrastructure Sync + "How to Teach" Blog Cluster

## Co się stało — analiza luk

Po Phase 7 Step 1 zostało **15 nowych stron HTML** (gramatyka, skills, porównania), ale **infrastruktura SEO nie została zsynchronizowana**. Oznacza to:

- **Sitemap** ma 100 entries, ale brakuje 15 stron z Phase 7 (modal verbs, future tenses, speaking activities, vs-quizlet itd.)
- **llms.txt** nie ma sekcji Skills-Based, nowych porównań ani "How to Teach"
- **openapi.yaml** nie ma 15 nowych paths z Phase 7
- **6 artykułów "How to Teach"** z Phase 7 nigdy nie zostało stworzonych (pliki nie istnieją w `public/blog/`)
- **GlobalFooter** nie ma 3 nowych linków Grammar (Modal Verbs, Future Tenses, Phrasal Verbs)
- **Blog.tsx** nie ma nowych wpisów
- **resources.html** i **blog.html** nie mają cross-linków do nowych stron

---

## Plan wdrożenia (1 krok)

### A. Stworzenie 6 artykułów "How to Teach" (nowe pliki)

| # | Plik | H1 | Słowa kluczowe |
|---|------|----|----------------|
| 1 | `public/blog/how-to-teach-english-grammar-effectively.html` | "How to Teach English Grammar Effectively" | how to teach grammar, grammar teaching strategies, ESL grammar |
| 2 | `public/blog/how-to-teach-speaking-esl.html` | "How to Teach Speaking in ESL Classes" | teach speaking ESL, speaking activities, oral fluency |
| 3 | `public/blog/how-to-teach-writing-esl-students.html` | "How to Teach Writing to ESL Students" | teach writing ESL, writing exercises, essay worksheets |
| 4 | `public/blog/how-to-teach-english-pronunciation.html` | "How to Teach English Pronunciation" | pronunciation teaching, phonics ESL, minimal pairs |
| 5 | `public/blog/how-to-plan-english-lessons-effectively.html` | "How to Plan English Lessons Effectively" | lesson planning ESL, lesson plan template, PPP model |
| 6 | `public/blog/classroom-management-esl-tips.html` | "Classroom Management Tips for ESL Teachers" | classroom management ESL, behavior management, engagement |

Każdy: 1500+ słów, `BlogPosting` JSON-LD, `datePublished: 2026-03-17`, FAQ z `<details>/<summary>`, cross-linki do 6-8 powiązanych stron, CTA do generatora. Identyczny styl CSS jak istniejące artykuły blogowe.

### B. Aktualizacja GlobalFooter.tsx

Dodanie 3 linków na koniec kolumny "Grammar" (przed "All Grammar"):
```
<li><a href="/modal-verbs-worksheets-esl.html">Modal Verbs</a></li>
<li><a href="/future-tenses-worksheets-english.html">Future Tenses</a></li>
<li><a href="/phrasal-verbs-worksheets-esl.html">Phrasal Verbs</a></li>
```

Dodanie 4 linków do kolumny "Compare":
```
<li><a href="/edooqoo-vs-quizlet.html">vs Quizlet</a></li>
<li><a href="/edooqoo-vs-kahoot.html">vs Kahoot</a></li>
<li><a href="/edooqoo-vs-wordwall.html">vs Wordwall</a></li>
<li><a href="/edooqoo-vs-busyteacher.html">vs BusyTeacher</a></li>
```

### C. Aktualizacja sitemap.xml (+21 entries → ~121 total)

Dodanie po linii 100 (przed `</urlset>`):

**15 stron Phase 7 landing:**
- `modal-verbs-worksheets-esl.html` (priority 0.8)
- `future-tenses-worksheets-english.html` (0.8)
- `relative-clauses-worksheets.html` (0.8)
- `gerunds-infinitives-worksheets.html` (0.8)
- `comparatives-superlatives-worksheets.html` (0.8)
- `phrasal-verbs-worksheets-esl.html` (0.8)
- `question-tags-worksheets.html` (0.8)
- `speaking-activities-esl-worksheets.html` (0.8)
- `writing-worksheets-esl.html` (0.8)
- `reading-activities-english-worksheets.html` (0.8)
- `listening-activities-esl-worksheets.html` (0.8)
- `edooqoo-vs-quizlet.html` (0.8)
- `edooqoo-vs-kahoot.html` (0.8)
- `edooqoo-vs-wordwall.html` (0.8)
- `edooqoo-vs-busyteacher.html` (0.8)

**6 blogów "How to Teach":**
- `blog/how-to-teach-english-grammar-effectively.html` (0.7)
- `blog/how-to-teach-speaking-esl.html` (0.7)
- `blog/how-to-teach-writing-esl-students.html` (0.7)
- `blog/how-to-teach-english-pronunciation.html` (0.7)
- `blog/how-to-plan-english-lessons-effectively.html` (0.7)
- `blog/classroom-management-esl-tips.html` (0.7)

Wszystkie z `lastmod=2026-03-17`.

### D. Aktualizacja llms.txt

Dodanie po sekcji "Grammar Topic Worksheets" (po linii 35):
```
- [Modal Verbs Worksheets](https://edooqoo.com/modal-verbs-worksheets-esl.html)
- [Future Tenses Worksheets](https://edooqoo.com/future-tenses-worksheets-english.html)
- [Relative Clauses Worksheets](https://edooqoo.com/relative-clauses-worksheets.html)
- [Gerunds & Infinitives Worksheets](https://edooqoo.com/gerunds-infinitives-worksheets.html)
- [Comparatives & Superlatives](https://edooqoo.com/comparatives-superlatives-worksheets.html)
- [Phrasal Verbs Worksheets](https://edooqoo.com/phrasal-verbs-worksheets-esl.html)
- [Question Tags Worksheets](https://edooqoo.com/question-tags-worksheets.html)
```

Nowa sekcja "Skills-Based Worksheets" (po Audience-Specific):
```
## Skills-Based Worksheets
- [Speaking Activities ESL](https://edooqoo.com/speaking-activities-esl-worksheets.html)
- [Writing Worksheets ESL](https://edooqoo.com/writing-worksheets-esl.html)
- [Reading Activities English](https://edooqoo.com/reading-activities-english-worksheets.html)
- [Listening Activities ESL](https://edooqoo.com/listening-activities-esl-worksheets.html)
```

Rozszerzenie sekcji "Comparisons" o 4 nowe:
```
- [Edooqoo vs Quizlet](https://edooqoo.com/edooqoo-vs-quizlet.html)
- [Edooqoo vs Kahoot](https://edooqoo.com/edooqoo-vs-kahoot.html)
- [Edooqoo vs Wordwall](https://edooqoo.com/edooqoo-vs-wordwall.html)
- [Edooqoo vs BusyTeacher](https://edooqoo.com/edooqoo-vs-busyteacher.html)
```

Nowa sekcja "How to Teach (Blog)":
```
## How to Teach (Blog)
- [How to Teach English Grammar Effectively](https://edooqoo.com/blog/how-to-teach-english-grammar-effectively.html)
- [How to Teach Speaking ESL](https://edooqoo.com/blog/how-to-teach-speaking-esl.html)
- [How to Teach Writing ESL](https://edooqoo.com/blog/how-to-teach-writing-esl-students.html)
- [How to Teach English Pronunciation](https://edooqoo.com/blog/how-to-teach-english-pronunciation.html)
- [How to Plan English Lessons](https://edooqoo.com/blog/how-to-plan-english-lessons-effectively.html)
- [Classroom Management ESL Tips](https://edooqoo.com/blog/classroom-management-esl-tips.html)
```

### E. Aktualizacja openapi.yaml (+21 paths)

Dodanie 21 nowych paths w formacie identycznym jak istniejące, np.:
```yaml
/modal-verbs-worksheets-esl.html:
  get:
    operationId: getModalVerbsWorksheets
    summary: Modal Verbs Worksheets for ESL
    description: Exercises and activities for teaching modal verbs
```

### F. Aktualizacja Blog.tsx (+6 wpisów)

Dodanie 6 nowych obiektów do tablicy `blogPosts` w kategorii "How to Teach":
```typescript
{ title: "How to Teach English Grammar Effectively", description: "Proven grammar teaching strategies with inductive and deductive approaches.", href: "/blog/how-to-teach-english-grammar-effectively.html", category: "How to Teach", date: "March 17, 2026" },
// ... (5 więcej)
```

### G. Aktualizacja resources.html (cross-linking)

- Rozszerzenie sekcji "Grammar Worksheets" o 7 nowych kart
- Nowa sekcja "Language Skills" z 4 kartami (Speaking, Writing, Reading, Listening)
- Rozszerzenie sekcji "Compare" o 4 nowe karty

### H. Aktualizacja blog.html (cross-linking)

- Nowa sekcja "How to Teach" z 6 kartami artykułów

---

## Podsumowanie pliku zmian

| Plik | Akcja |
|------|-------|
| `public/blog/how-to-teach-english-grammar-effectively.html` | NOWY |
| `public/blog/how-to-teach-speaking-esl.html` | NOWY |
| `public/blog/how-to-teach-writing-esl-students.html` | NOWY |
| `public/blog/how-to-teach-english-pronunciation.html` | NOWY |
| `public/blog/how-to-plan-english-lessons-effectively.html` | NOWY |
| `public/blog/classroom-management-esl-tips.html` | NOWY |
| `src/components/GlobalFooter.tsx` | EDYCJA — +7 linków |
| `public/sitemap.xml` | EDYCJA — +21 entries |
| `public/llms.txt` | EDYCJA — +4 sekcje |
| `public/openapi.yaml` | EDYCJA — +21 paths |
| `src/pages/Blog.tsx` | EDYCJA — +6 wpisów |
| `public/resources.html` | EDYCJA — cross-linking |
| `public/blog.html` | EDYCJA — cross-linking |

**Łącznie: 13 plików** (6 nowych + 7 edytowanych)

| Element | Przed | Po |
|---------|-------|----|
| Sitemap entries | 100 | 121 |
| Blog articles | 21 | 27 |
| Footer Grammar linków | 6 | 9 |
| Footer Compare linków | 4 | 8 |
| Tematy gramatyczne w llms.txt | 8 | 15 |
| Pokryte klastry | 9 | 13 |

**Ryzyko:** ZEROWE — statyczne pliki HTML + kosmetyczne zmiany w footerze i meta.

