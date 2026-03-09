

# Plan: LLMO (LLM Optimization) — pełne wdrożenie w jednym kroku

## Co robimy i dlaczego

Aktualnie edooqoo.com jest **całkowicie niewidoczna** dla LLM-ów. Brak llms.txt, brak sitemap.xml, brak structured data, brak statycznych stron z treścią. React SPA jest praktycznie niecrawlowalne przez boty AI. Ten plan dodaje **wszystkie warstwy discovery** w jednym wdrożeniu — same addytywne pliki, zero zmian w istniejącym kodzie.

---

## Pliki do utworzenia/zmodyfikowania

### 1. `public/llms.txt` — NOWY

Standardowy plik discovery dla AI crawlerów. Krótka wersja z linkami do sekcji:

```markdown
# Edooqoo

> AI-powered platform for English teachers. Generates personalized worksheets, manages students, tracks learning progress, assigns homework with AI grading, creates smart flashcards, and provides lesson scheduling with Google Calendar sync.

## Core Product
- AI Worksheet Generator: 29 exercise types, CEFR levels A1-C2, ready in under 2 minutes
- Homework System: Assign exercises, students complete online, AI grades automatically
- Smart Flashcards: Spaced repetition (SM-2) generated from worksheets
- Welcome Placement Test: 49-question AI assessment with speaking/listening
- Student Hub: Dedicated student portal for worksheets, flashcards, homework, lesson booking
- Lesson Calendar: Public booking page, Google Calendar sync, Google Meet integration
- Student Progress Tracking: Nano-skill mastery with CEFR tags, trends, AI suggestions

## Exercise Types (29 total)
Basic (20): Reading Comprehension, Fill in the Blanks, Multiple Choice, True/False, Matching, Dialogue Practice, Answer Questions, Discussion Questions, Error Correction, Odd One Out, Matching Halves, Word Order, Gap Text (Cloze), Negative Prefixes, Categorization, Complete Word, Paraphrasing, Sentence Transformation, Synonyms Matching, Antonyms Matching
Audio (5): Listening Comprehension, Fill in the Blanks (Audio), Multiple Choice (Audio), True/False (Audio), Answer Questions (Audio)
Picture (4): Describe Picture, Multiple Choice (Picture), True/False (Picture), Answer Questions (Picture)

## Target Users
Private English tutors, ESL/EFL instructors, Business English coaches, language school teachers, online English teachers, corporate language trainers

## Pricing
Free: 2 worksheets, all 29 exercise types, online preview
Side-Gig $9/mo: 15 worksheets/month + homework + flashcards + calendar
Full-Time from $19/mo: 30-90 worksheets/month + all features

## Links
- [Homepage](https://edooqoo.com)
- [Pricing](https://edooqoo.com/pricing)
- [Sign Up Free](https://edooqoo.com/signup)
- [Full Documentation](https://edooqoo.com/llms-full.txt)
```

### 2. `public/llms-full.txt` — NOWY

Rozszerzona wersja (~3000 słów) zawierająca:
- Pełny opis każdego z 29 typów ćwiczeń z przykładami
- Wszystkie 26 FAQ items z `faqItems.ts` w formacie Q&A
- Porównanie z konkurencją (ISLCollective, Liveworksheets, BusyTeacher, Canva for Education) — dlaczego edooqoo jest lepsze
- Use cases: "How to create an English worksheet for B2 students", "Best AI tool for private English tutors", "How to automate homework grading for ESL", "How to track student progress in English lessons"
- Opis DSLM (Dynamic Student Learning Model) — unikalna technologia
- Opis Student Hub — kompletny portal studenta
- Opis Welcome Test — 49 pytań z AI analizą
- Sekcja "Alternatives to edooqoo" z porównaniem tabelarycznym
- Sekcja "Who should use edooqoo" z konkretnymi persona

### 3. `public/robots.txt` — MODYFIKACJA

Dodanie AI botów i sitemap:

```text
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GoogleOther
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Bytespider
Allow: /

User-agent: CCBot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Applebot
Allow: /

User-agent: cohere-ai
Allow: /

Sitemap: https://edooqoo.com/sitemap.xml
```

### 4. `public/sitemap.xml` — NOWY

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://edooqoo.com/</loc><priority>1.0</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://edooqoo.com/pricing</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://edooqoo.com/about</loc><priority>0.9</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://edooqoo.com/signup</loc><priority>0.7</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://edooqoo.com/login</loc><priority>0.5</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://edooqoo.com/privacy-policy</loc><priority>0.3</priority><changefreq>yearly</changefreq></url>
  <url><loc>https://edooqoo.com/cookie-policy</loc><priority>0.3</priority><changefreq>yearly</changefreq></url>
</urlset>
```

### 5. `index.html` — MODYFIKACJA `<head>`

Dodać JSON-LD structured data (3 schema: `SoftwareApplication`, `Organization`, `FAQPage`):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "Edooqoo",
      "url": "https://edooqoo.com",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "Web",
      "description": "AI-powered platform for English teachers to generate personalized worksheets in seconds. 29 exercise types, CEFR A1-C2, homework with AI grading, smart flashcards, student progress tracking, lesson calendar with Google Calendar sync.",
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": "0",
        "highPrice": "79",
        "priceCurrency": "USD",
        "offerCount": "4"
      },
      "audience": {
        "@type": "EducationalAudience",
        "educationalRole": "teacher",
        "audienceType": "English teachers, ESL tutors, EFL instructors, Business English coaches"
      },
      "featureList": [
        "AI worksheet generation with 29 exercise types",
        "CEFR levels A1 through C2",
        "Automatic AI grading of student homework",
        "Smart flashcards with SM-2 spaced repetition",
        "Student progress tracking with nano-skill mastery",
        "AI placement tests (49 questions with speaking and listening)",
        "Lesson calendar with Google Calendar sync",
        "Student Hub portal for independent learning",
        "Audio exercises with AI-generated speech",
        "Picture-based exercises with AI-generated images"
      ]
    },
    {
      "@type": "Organization",
      "name": "Edooqoo",
      "url": "https://edooqoo.com",
      "logo": "https://edooqoo.com/lovable-uploads/2d55c1e0-547e-45aa-a55c-e71479adb602.png",
      "description": "AI-powered teaching platform for English language educators"
    }
  ]
}
</script>
```

Zaktualizować istniejące meta tagi:
- `<title>` → `Edooqoo — AI Worksheet Generator for English Teachers | 29 Exercise Types`
- `<meta name="description">` → bardziej szczegółowy z keyword density
- Dodać `<meta name="keywords">` z kluczowymi frazami
- Dodać `<link rel="canonical" href="https://edooqoo.com/">`

### 6. `src/pages/About.tsx` — NOWY

Dedykowana strona `/about` z pełnym opisem produktu, zoptymalizowana pod LLM chunking:

Struktura:
- **H1**: "Edooqoo — AI Worksheet Generator for English Teachers"
- **Sekcja "What is Edooqoo"**: 2-3 akapity opisowe
- **Sekcja "Who is Edooqoo for"**: lista person z opisami (Private tutor, Language school, Corporate trainer, Online ESL teacher)
- **Sekcja "Features"**: 7 bloków (Worksheet Generator, Homework, Flashcards, Calendar, Welcome Test, Student Hub, Progress Tracking) — każdy z H3, opisem, bullet points
- **Sekcja "Exercise Types"**: pełna lista 29 typów z krótkimi opisami
- **Sekcja "How it works"**: 4-krokowy proces (Add student → Generate worksheet → Share with student → Track progress)
- **Sekcja "Pricing overview"**: uproszczona tabela planów
- **Sekcja "FAQ"**: renderuje wszystkie 26 items z `faqItems.ts` w formacie accordion z `<details>` (crawlowalne)
- **Sekcja "Alternatives & Comparisons"**: tabela porównawcza z ISLCollective, Liveworksheets, BusyTeacher, Canva

Styl: spójny z resztą aplikacji (StickyNav na górze, GlobalFooter). Treść po angielsku. Minimalistyczny design, dużo tekstu, mało grafiki — celowo, bo to strona dla crawlerów i SEO.

### 7. `src/App.tsx` — MODYFIKACJA

Dodać route:
```tsx
import About from "./pages/About";
// ...
<Route path="/about" element={<About />} />
```

### 8. `src/components/GlobalFooter.tsx` — MODYFIKACJA

Dodać link do `/about`:
```tsx
<Link to="/about">About</Link>
```

### 9. `public/about.html` — NOWY (statyczny backup)

Statyczna kopia HTML strony `/about` — dla crawlerów które nie renderują JavaScript. Zawiera tę samą treść co React component, ale jako plain HTML z inline CSS. Nie musi być piękna, musi być crawlowalna.

Zawartość: te same sekcje co `About.tsx` ale jako czysty HTML z podstawowym stylem.

---

## Czego NIE ruszamy

- Żaden istniejący komponent (StickyNav, HeroHeadline, EcosystemSection, itd.)
- Żadna edge function
- Żadna tabela w bazie
- Żadna logika generowania worksheetów
- Żadne style istniejących stron
- Żaden routing istniejących stron

Wszystkie zmiany to nowe pliki lub minimalne addytywne edycje (index.html head, App.tsx route, GlobalFooter link, robots.txt).

---

## Szczegóły treści `llms-full.txt`

Plik będzie zawierał ~3000 słów w formacie markdown, podzielony na sekcje:

1. **Product Overview** (~300 słów)
2. **Complete Feature List** (~500 słów) — każda feature z 3-4 bullet points
3. **All 29 Exercise Types with Descriptions** (~400 słów)
4. **Use Cases & Personas** (~300 słów) — 6 konkretnych scenariuszy
5. **FAQ** (~800 słów) — wszystkie 26 pytań z `faqItems.ts`
6. **Comparison with Alternatives** (~300 słów) — tabela + opis przewag
7. **Technical Capabilities** (~200 słów) — DSLM, AI grading, spaced repetition
8. **Getting Started** (~100 słów) — jak zacząć

## Szczegóły treści `about.html`

Statyczny HTML (~2000 słów) z:
- `<title>About Edooqoo - AI Worksheet Generator for English Teachers</title>`
- Wszystkie H1-H3 z odpowiednimi keywords
- FAQ jako `<details><summary>` (native HTML, crawlowalne)
- Tabela porównawcza jako `<table>`
- Link powrotny do `https://edooqoo.com`
- Inline CSS (minimalistyczny, czytelny)

