# Plan Szczegółowy Rozszerzenia Ćwiczeń - Edooqoo E3

## FAZA 1: PODSTAWOWE NOWE ĆWICZENIA ✅ UKOŃCZONA

### Implementowane typy ćwiczeń:

#### 1. **odd-one-out** - Wybór niepasującego słowa
```typescript
interface OddOneOutExercise {
  type: "odd-one-out";
  questions: Array<{
    instruction: string;
    options: string[5]; // Dokładnie 5 opcji
    correct_answer: "A" | "B" | "C" | "D" | "E";
  }>;
}
```
- **Struktura**: 8 pytań, każde po 5 opcji (A-E)
- **Czas**: 4-5 minut zależnie od długości lekcji
- **Walidacja**: Sprawdza obecność 8 pytań i po 5 opcji każde

#### 2. **synonyms-antonyms** - Dopasowywanie synonimów/antonimów
```typescript
interface SynonymsAntonymsExercise {
  type: "synonyms-antonyms";
  subtype: "synonyms" | "antonyms";
  items: Array<{
    word: string;
    match: string;
  }>;
}
```
- **Struktura**: 8 par słów do dopasowania
- **Czas**: 5-6 minut
- **UI**: Dwie kolumny z słowami i odpowiednikami

#### 3. **sentence-transformation** - Przekształcanie zdań
```typescript
interface SentenceTransformationExercise {
  type: "sentence-transformation";
  sentences: Array<{
    instruction: string; // np. "Rewrite in passive voice"
    original: string;
    transformed: string;
  }>;
}
```
- **Struktura**: 8 zdań do przekształcenia
- **Czas**: 6-8 minut
- **Przykład**: "They built this house in 2005" → "This house was built in 2005"

#### 4. **word-order** - Układanie słów w kolejności
```typescript
interface WordOrderExercise {
  type: "word-order";
  sentences: Array<{
    scrambled_words: string; // "yesterday / went / cinema / to / we / the"
    correct_order: string;   // "We went to the cinema yesterday"
  }>;
}
```
- **Struktura**: 8 zdań do ułożenia
- **Czas**: 4-5 minut
- **UI**: Słowa w kolorowych "pudełkach"

#### 5. **gap-text** - Cloze test
```typescript
interface GapTextExercise {
  type: "gap-text";
  sentences: Array<{
    text: string;    // "If he _____ (study) harder, he would pass"
    answer: string;  // "studied"
  }>;
  word_bank?: string[]; // Opcjonalny bank słów
}
```
- **Struktura**: 8 zdań z lukami
- **Czas**: 4-5 minut
- **Funkcjonalność**: Bank słów (jeśli podany) jest przetasowany dla uczniów

#### 6. **negative-prefixes** - Przedrostki przeczące
```typescript
interface NegativePrefixesExercise {
  type: "negative-prefixes";
  words: Array<{
    base_word: string; // "happy"
    prefix: string;    // "un"
    hint?: string;     // Opcjonalna podpowiedź
  }>;
}
```
- **Struktura**: 8 słów do uzupełnienia przedrostkami
- **Czas**: 3-4 minuty
- **UI**: Referencje przedrostków dla nauczycieli

### Zmiany w architekturze:

#### 1. **Nowe komponenty React** ✅
- `ExerciseOddOneOut.tsx` - Renderowanie pytań wielokrotnego wyboru
- `ExerciseSynonymsAntonyms.tsx` - Dopasowywanie par słów
- `ExerciseSentenceTransformation.tsx` - Przekształcanie zdań
- `ExerciseWordOrder.tsx` - Układanie słów z wizualnymi elementami
- `ExerciseGapText.tsx` - Uzupełnianie luk z bankiem słów
- `ExerciseNegativePrefixes.tsx` - Przedrostki z referencjami

#### 2. **Rozszerzony timeCalculator.ts** ✅
```typescript
const timeMap = {
  '45min': {
    withGrammar: {
      'odd-one-out': 4,
      'synonyms-antonyms': 5,
      'sentence-transformation': 6,
      'word-order': 4,
      'gap-text': 4,
      'negative-prefixes': 3
    }
  }
}
```

#### 3. **Nowe walidatory** ✅
- `validateOddOneOutExercise()` - 8 pytań, 5 opcji każde
- `validateSynonymsAntonymsExercise()` - 8 par słów
- `validateSentenceTransformationExercise()` - 8 zdań z instrukcjami
- `validateWordOrderExercise()` - 8 zdań z formatowaniem
- `validateGapTextExercise()` - 8 zdań z lukami (_____), opcjonalny bank słów
- `validateNegativePrefixesExercise()` - 8 słów z przedrostkami

#### 4. **Nowe ikony FontAwesome** ✅
```typescript
const iconMap = {
  'odd-one-out': 'fa-search',
  'synonyms-antonyms': 'fa-exchange-alt',
  'sentence-transformation': 'fa-random',
  'word-order': 'fa-sort',
  'gap-text': 'fa-text-width',
  'negative-prefixes': 'fa-minus-circle'
}
```

#### 5. **Rozszerzony exerciseProcessor.ts** ✅
- Obsługa nowych typów ćwiczeń
- Specjalne przetwarzanie dla każdego typu
- Walidacja struktury danych
- Przetasowywanie elementów gdzie potrzebne

### Testy kompatybilności:
1. **✅ Obecne 8 typów ćwiczeń** - Działają bez zmian
2. **✅ Generowanie worksheet** - Edge Function rozpoznaje nowe typy
3. **✅ Renderowanie UI** - Wszystkie komponenty się wyświetlają
4. **✅ Tryb edycji** - Nauczyciele mogą edytować zawartość
5. **✅ Przełączanie widoków** - Student/Teacher poprawnie działają

---

## FAZA 2: INTELIGENTNY WYBÓR ĆWICZEŃ (PLANOWANA)

### Cel:
Umożliwienie AI automatycznego doboru najlepszych typów ćwiczeń na podstawie parametrów lekcji.

### Planowane funkcjonalności:

#### 1. **Rozszerzenie formularza**
```typescript
interface FormData {
  // ... existing fields
  selectedExerciseTypes?: string[]; // Opcjonalny wybór przez nauczyciela
  autoSelectExercises?: boolean;    // AI ma dobierać automatycznie
}
```

#### 2. **System AI do wyboru ćwiczeń**
- **Input**: poziom angielskiego, czas lekcji, temat, cel
- **Process**: Zapytanie do GPT-4 o optymalne typy ćwiczeń
- **Output**: Lista 6-8 typów ćwiczeń dopasowanych do potrzeb

#### 3. **Modularny system promptów**
```
/prompts/
  ├── base-prompt.txt          // Główny prompt systemowy
  ├── exercise-selection.txt   // Prompt do wyboru ćwiczeń
  └── exercises/
      ├── reading.txt
      ├── odd-one-out.txt
      ├── synonyms-antonyms.txt
      └── ...
```

#### 4. **Logika łączenia promptów**
```typescript
function buildPrompt(selectedTypes: string[], formData: FormData): string {
  const basePrompt = loadPrompt('base-prompt.txt');
  const exercisePrompts = selectedTypes.map(type => 
    loadPrompt(`exercises/${type}.txt`)
  );
  return [basePrompt, ...exercisePrompts].join('\n\n');
}
```

### Architektura:

#### **Edge Function workflow**:
1. **Input validation** - Sprawdz parametry
2. **Exercise selection** (jeśli autoSelectExercises=true):
   - Wywołanie GPT dla wyboru typów
   - Walidacja wybranych typów
   - Fallback do domyślnych jeśli błąd
3. **Prompt building** - Złożenie promptu z modułów
4. **Worksheet generation** - Standardowy proces generowania
5. **Response** - Zwrócenie worksheet z metadanymi

#### **Frontend changes**:
- **Checkbox w formularzu**: "Let AI choose optimal exercises"
- **Zaawansowane opcje**: Lista checkboxów dla ręcznego wyboru
- **Wyświetlanie informacji**: Które ćwiczenia zostały wybrane i dlaczego

### Ryzyka i mitygacja:
- **Ryzyko**: AI wybiera niewłaściwe ćwiczenia
- **Mitygacja**: Stały fallback do sprawdzonych zestawów
- **Ryzyko**: Zwiększone zużycie tokenów
- **Mitygacja**: Cache wyników dla podobnych parametrów

---

## FAZA 3: ZŁOŻONE ĆWICZENIA (PLANOWANA)

### Nowe typy ćwiczeń:

#### 1. **categorize** - Kategoryzowanie słów
```typescript
interface CategorizeExercise {
  type: "categorize";
  words: string[20];          // 20 słów do kategoryzacji
  categories: string[4];      // 4 kategorie
  answers: {[word: string]: string}; // Mapowanie słowo->kategoria
}
```
- **UI**: Drag & drop interface
- **Interaktywność**: Pierwsza prawdziwie interaktywna funkcja

#### 2. **paraphrasing** - Parafrazowanie
```typescript
interface ParaphrasingExercise {
  type: "paraphrasing";
  sentences: Array<{
    original: string;
    keyword: string;    // Słowo/fraza do użycia
    paraphrased: string;
  }>;
}
```

#### 3. **complete-word** - Uzupełnianie liter
```typescript
interface CompleteWordExercise {
  type: "complete-word";
  words: Array<{
    partial: string;    // "P_LL"
    definition: string; // "a type of medication..."
    complete: string;   // "PILL"
  }>;
}
```

#### 4. **matching-halves** - Połówki zdań
```typescript
interface MatchingHalvesExercise {
  type: "matching-halves";
  halves: Array<{
    first: string;  // "If I had more time..."
    second: string; // "I would travel the world."
  }>;
}
```

### Wymagania techniczne:
- **React DnD**: Biblioteka drag & drop
- **State management**: Zaawansowane zarządzanie stanem
- **Animacje**: Płynne przejścia i feedback
- **Walidacja**: Złożone reguły walidacji

---

## FAZA 4: MEDIA-ENHANCED (PLANOWANA)

### Integracje zewnętrzne:

#### 1. **Unsplash API** - Obrazy
```typescript
interface PictureDescriptionExercise {
  type: "picture-description";
  image_url: string;
  questions: Array<{
    type: "description" | "question";
    prompt: string;
    sample_answer?: string;
  }>;
}
```

#### 2. **TTS Services** - Audio
```typescript
interface ListeningExercise {
  type: "listening-comprehension";
  audio_text: string;    // Tekst do syntezy
  audio_url?: string;    // Wygenerowane audio
  questions: QuestionType[];
}
```

#### 3. **Upload system** - Własne media
- **Obrazy**: Upload i hosting obrazów
- **Audio**: Upload plików audio
- **Moderacja**: Automatyczne sprawdzanie treści

### Architektura mediów:
```
media/
├── images/
│   ├── generated/     // Z Unsplash API
│   └── uploaded/      // Przesłane przez użytkowników
├── audio/
│   ├── tts/          // Wygenerowane przez TTS
│   └── uploaded/     // Przesłane pliki
└── videos/           // Przyszłość
```

---

## METRYKI I MONITORING

### KPI dla każdej fazy:

#### Faza 1 ✅:
- **Adoption rate**: % worksheetów używających nowych ćwiczeń
- **Error rate**: Błędy w generowaniu/renderowaniu
- **User satisfaction**: Oceny worksheetów

#### Faza 2:
- **AI accuracy**: % prawidłowych wyborów ćwiczeń przez AI
- **Usage**: % użytkowników korzystających z auto-select
- **Token efficiency**: Koszt tokenów vs wartość

#### Faza 3:
- **Interactivity**: Engagement z interaktywnymi elementami
- **Completion rate**: % ukończonych interaktywnych ćwiczeń
- **Performance**: Szybkość ładowania złożonych UI

#### Faza 4:
- **Media usage**: % worksheetów z mediami
- **API costs**: Koszty zewnętrznych integracji
- **Quality**: Jakość generowanych/przesłanych mediów

### Monitoring techniczny:
- **Performance**: Czasy ładowania, zużycie pamięci
- **Errors**: Błędy w Edge Functions, React components
- **Usage**: Najpopularniejsze typy ćwiczeń
- **Costs**: Tokeny OpenAI, API zewnętrzne

---

## DEPLOYMENT I ROLLBACK

### Deployment strategy:
1. **Feature flags**: Stopniowe włączanie funkcji
2. **A/B testing**: Porównanie ze starą wersją
3. **Blue-green deployment**: Zero-downtime updates
4. **Monitoring**: Intensywny monitoring przez pierwsze tygodnie

### Rollback plan:
```typescript
// Feature flags w konfiguracji
const FEATURE_FLAGS = {
  PHASE_1_EXERCISES: true,  // ✅ Włączone
  PHASE_2_AI_SELECTION: false, // Wyłączone do implementacji
  PHASE_3_INTERACTIVE: false,
  PHASE_4_MEDIA: false
};
```

### Testing framework:
- **Unit tests**: Każdy nowy komponent
- **Integration tests**: Pełny flow generowania
- **E2E tests**: Cypress dla krytycznych ścieżek
- **Performance tests**: Load testing Edge Functions

---

## PODSUMOWANIE FAZY 1

**STATUS**: ✅ **UKOŃCZONA POMYŚLNIE**

### Co zostało zaimplementowane:
1. **6 nowych komponentów React** - Wszystkie renderują się poprawnie
2. **Rozszerzenie systemu walidacji** - Sprawdza nowe struktury danych
3. **Aktualizacja kalkulatora czasu** - Przypisuje odpowiednie czasy
4. **Nowe ikony i processor** - Pełna integracja z istniejącym systemem
5. **Zachowanie kompatybilności** - Stare ćwiczenia działają bez zmian

### Następny krok:
**FAZA 2** - Implementacja inteligentnego wyboru ćwiczeń przez AI

Aplikacja jest gotowa do przejścia do kolejnej fazy rozwoju. Wszystkie zmiany zostały przetestowane i są kompatybilne z obecną architekturą.
