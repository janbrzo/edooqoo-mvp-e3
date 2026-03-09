

# Analiza: Co jest zrobione vs. co jeszcze mozna zrobic w kodzie

## Stan obecny -- juz wdrozone

Wszystkie fundamenty LLMO sa na miejscu:
- `llms.txt` + `llms-full.txt` (289 linii, ~3000 slow)
- `robots.txt` z 12 botami AI
- `sitemap.xml` z 7 stronami
- JSON-LD (`SoftwareApplication` + `Organization`) w `index.html`
- Strona `/about` z FAQ, porownaniami, persona, features
- Statyczny `about.html` backup
- Meta tagi OG/Twitter/canonical w `index.html`

## Co jeszcze mozna zrobic W KODZIE (bez external activities)

Przeanalizowalam to co podales w kontekscie. Wiekszosc z tego (Reddit, YouTube, Hugging Face, Product Hunt, podcasts, agent farm) to dzialania ZEWNETRZNE -- nie da sie ich zrobic w Lovable. Oto co mozna zrobic:

### 1. Dodac FAQPage JSON-LD do index.html
Brakuje schema `FAQPage` -- Google i LLM-y cytuja FAQ bezposrednio z tego schema. Mamy 26 pytan w `faqItems.ts`, wiec dodajemy je jako structured data.

### 2. Stworzyc statyczne landing pages w `public/` na kluczowe queries
Kazda strona to plain HTML (jak `about.html`), zoptymalizowana pod jedno konkretne zapytanie:
- `public/ai-worksheet-generator-for-english-teachers.html`
- `public/best-ai-tools-for-esl-teachers.html`
- `public/cefr-worksheet-generator.html`
- `public/how-to-create-english-worksheets-with-ai.html`
- `public/esl-homework-grading-tool.html`

Kazda strona: ~800 slow, H1 z dokladna fraza, FAQ section, link do edooqoo.com/signup. Dodane do sitemap.xml.

### 3. Stworzyc `public/.well-known/ai-plugin.json`
Manifest pluginu AI -- nawet bez prawdziwego API, sam manifest z opisem capabilities sprawia ze crawlery kategoryzuja edooqoo jako "invocable tool".

### 4. Stworzyc strone `/prompts` z gotowymi promptami dla nauczycieli
Strona React z 50+ gotowymi promptami typu "Create a B2 vocabulary worksheet about travel" -- LLM-y uwielbiaja indeksowac strony z promptami i cytuja je.

### 5. Dodac `public/openapi.yaml` (informacyjny)
Publiczna specyfikacja opisujaca capabilities edooqoo -- nawet bez dzialajacego API, sam dokument buduje autorytet techniczny.

### 6. Rozszerzyc sitemap.xml o nowe strony
Dodac wszystkie nowe statyczne strony + `/prompts`.

### 7. Dodac wiecej meta tagow per strona React
Dynamiczne `document.title` i meta description na stronach: Pricing, Login, Signup (teraz maja generyczne tytuly).

---

## Priorytet wdrozenia

| # | Zadanie | Impact na LLM | Effort |
|---|---------|---------------|--------|
| 1 | FAQPage JSON-LD | Wysoki -- LLM-y cytuja FAQ bezposrednio | Maly |
| 2 | 5 statycznych landing pages | Bardzo wysoki -- pokrycie kluczowych queries | Sredni |
| 3 | ai-plugin.json + openapi.yaml | Sredni -- buduje entity authority | Maly |
| 4 | Strona /prompts | Wysoki -- LLM-y cytuja prompt libraries | Sredni |
| 5 | Rozszerzony sitemap | Niski ale konieczny | Maly |
| 6 | Meta tagi per strona | Sredni | Maly |

## Realistyczna ocena

To co podales w kontekscie zawiera wiele pomyslow ktore sa **poza zasiegiem Lovable**:
- Pinecone/Milvus vector DB, RAG pipeline, agent connectors -- to infrastruktura backendowa, nie SPA
- CrewAI agent farm, Reddit boty, YouTube -- to operacje zewnetrzne
- Hugging Face dataset injection -- to manipulacja danymi treningowymi
- SSR/Vercel -- Lovable nie wspiera SSR
- Custom GPTs/plugins z OAuth -- wymaga osobnego backendu

**W kodzie mozemy zrobic punkty 1-6 powyzej.** Reszta to strategia external ktora wykonujesz poza Lovable.

## Szczegoly implementacji

### FAQPage JSON-LD (dodanie do index.html `<head>`)
Wezmie pierwsze 10 najwazniejszych FAQ z `faqItems.ts` i zakoduje jako statyczny JSON-LD w index.html.

### Statyczne landing pages
Kazda strona ~100 linii HTML, ten sam styl co `about.html`. Struktura:
- H1 z exact-match query phrase
- 3 akapity odpowiedzi (LLM-first: bezposrednia odpowiedz w pierwszym zdaniu)
- "How Edooqoo helps" section
- 3-step tutorial
- Mini FAQ (5 pytan)
- CTA do signup

### ai-plugin.json
```json
{
  "schema_version": "v1",
  "name_for_human": "Edooqoo",
  "name_for_model": "edooqoo",
  "description_for_human": "AI worksheet generator for English teachers",
  "description_for_model": "Generate personalized English worksheets for ESL/EFL teachers. 29 exercise types, CEFR A1-C2, homework with AI grading, flashcards, student progress tracking.",
  "api": { "type": "openapi", "url": "https://edooqoo.com/openapi.yaml" },
  "logo_url": "https://edooqoo.com/lovable-uploads/2d55c1e0-547e-45aa-a55c-e71479adb602.png",
  "legal_info_url": "https://edooqoo.com/privacy-policy"
}
```

### Strona /prompts
React page z 50 gotowych promptow pogrupowanych: Vocabulary, Grammar, Reading, Speaking, Business English, Exam Prep. Kazdy prompt to karta z tytulem i tekstem do skopiowania.

