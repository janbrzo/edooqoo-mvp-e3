

# Plan: 6 poprawek landing page

## 1. Usuń "Trusted by 200+ English Teachers" badge
**Plik:** `HeroHeadline.tsx` — usunąć linie 19-23 (pill badge div). Również usunąć "Join 200+ teachers..." z `FinalCTA.tsx` linia 21, zamienić na coś prawdziwego typu "Ready to save hours every week?"

## 2. Dodaj info o funkcjach dostępnych po zalogowaniu
**Plik:** `HeroHeadline.tsx` — pod subheadline (po CTA button), dodać kompaktowy blok:
```
Create a free account to unlock:
📝 Homework & AI Grading · 🧠 Smart Flashcards · 📅 Lesson Calendar
📊 Student Knowledge Tracking · 🎯 Welcome Placement Test · 🔗 Interactive Sharing
```
Stylizacja: mały, elegancki blok z ikonami, nie dominujący, ale widoczny.

## 3. Przenieś generator wyżej — widoczny na pierwszym ekranie
**Plik:** `Index.tsx` — zmienić strukturę landing page:
- Skrócić Hero (mniej padding: `pt-20 pb-16` → `pt-16 pb-6`)
- Przenieść `<FormView>` bezpośrednio pod Hero, z minimalnym paddingiem
- Usunąć nadmiarowy padding z `FormView.tsx` landing variant

**Plik:** `HeroHeadline.tsx` — zmniejszyć `pb-16` → `pb-4`, usunąć `mb-12` z CTA area lub zmniejszyć do `mb-4`

**Plik:** `FormView.tsx` — zmniejszyć `pt-8 pb-12` → `pt-2 pb-8`, usunąć/zmniejszyć header "Try it right now" (bo Hero już mówi co robimy)

## 4. Popraw copy EcosystemSection
**Plik:** `EcosystemSection.tsx` — zmienić:
- Headline: "More than a worksheet generator" → "Your complete teaching toolkit"
- Subtitle: zmienić na coś konkretniejszego, np. "Everything you need to run professional 1-on-1 lessons — built into one platform."

## 5. Anonimizuj testimoniale
**Plik:** `TestimonialsRow.tsx` — zamienić pełne imiona na inicjały/imiona bez nazwisk:
- "Sarah Jenkins" → "Sarah J." 
- "Michael Chen" → "Michael C."
- "Elena Rodriguez" → "Elena R."
- Usunąć avatary (random avatary z pravatar to czerwona flaga)
- Zamienić na kolorowe inicjały (div z literą)
- Usunąć social media ikony (LinkedIn/Twitter/Globe) — sugerują że można zweryfikować

Alternatywnie: zmienić sekcję na format "What teachers say" z cytatami bez identyfikowalnych danych, albo usunąć całkowicie i zastąpić sekcją "Use cases" z przykładami użycia.

## 6. Napraw zduplikowaną stopkę
**Plik:** `Index.tsx` — usunąć `<GlobalFooter />` z linii 231. Footer jest już renderowany globalnie w `App.tsx` linia 110.

---

## Pliki do edycji:
| Plik | Zmiana |
|------|--------|
| `HeroHeadline.tsx` | Usunąć badge, dodać "unlock features" blok, zmniejszyć padding |
| `Index.tsx` | Usunąć `<GlobalFooter />` (linia 231) |
| `FormView.tsx` | Zmniejszyć padding, skrócić/usunąć header |
| `EcosystemSection.tsx` | Nowy copy |
| `TestimonialsRow.tsx` | Anonimizacja: inicjały, usunąć avatary i social ikony |
| `FinalCTA.tsx` | Usunąć "200+ teachers" z headline |

**Zero zmian w logice:** WorksheetForm, generowanie, tokeny, pricing — nietknięte.

