

# Plan: Flashcards DSLM — ujednolicenie eventów, CEFR levels, trudność definition vs translation

## Stan obecny

### Co mamy teraz
1. **Trigger `log_flashcard_review_event()`** wstawia event do `student_events` ale **BEZ `skill_ids`** i **BEZ `element_type`** — te pola są NULL
2. Backfill migration (`20260221`) retroaktywnie wypełnił `skill_ids` formując `ns.{CEFR}.vocabulary.definition_{word}` na podstawie `students.english_level` — czyli poziomu studenta, a nie słowa
3. Tabela `flashcard_cards` nie ma kolumny `cefr_level` — poziom nie jest nigdzie przechowywany per-card
4. `back_type` (translation vs definition) jest na poziomie `flashcard_sets`, nie jest uwzględniany w mastery ani skill_ids
5. `translate-flashcard` Edge Function nie zwraca CEFR poziomu

---

## 3 problemy i rozwiązania

### Problem 1: Ujednolicenie skill_ids w eventach flashcard

**Cel:** Każdy `flashcard_review` event ma mieć `skill_ids = ['ns.B1.vocabulary.definition_cuisine']` i `element_type = 'vocabulary'` — ustawiane automatycznie przez trigger.

**Rozwiązanie:** Zmienić trigger `log_flashcard_review_event()` żeby:
1. Pobierał `cefr_level` z nowej kolumny `flashcard_cards.cefr_level`
2. Generował skill_id w formacie `ns.{CEFR}.vocabulary.definition_{normalized_front_text}`
3. Ustawiał `element_type = 'vocabulary'` i `skill_ids = ARRAY[skill_id]`

### Problem 2: Trudność definition vs translation

**Cel:** Mastery powinno być trudniejsze dla `definition` mode (EN→EN definition) niż `translation` (EN→native).

**Rozwiązanie:** W triggerze dodać mnożnik trudności. Jeśli `back_type = 'definition'` → mastery jest obniżone o 10% (np. zamiast 70 → 63). Logika:
- `translation` mode: mastery bez zmian (łatwiejsze, bo native language)
- `definition` mode: mastery * 0.9 (trudniejsze, bo EN→EN)

Dodatkowo zapisywać `back_type` i `direction` w `event_payload` żeby Layer B miał pełen kontekst.

### Problem 3: CEFR levels per flashcard card

**Cel:** Każda karta ma przypisany poziom CEFR na podstawie trudności słowa, nie poziomu studenta.

**Rozwiązanie dwuetapowe:**

**Etap A — Kolumna + AI classification:**
1. Dodać kolumnę `cefr_level TEXT DEFAULT NULL` do `flashcard_cards`
2. Rozszerzyć `translate-flashcard` Edge Function o zwracanie CEFR poziomu razem z tłumaczeniem/definicją
3. Przy tworzeniu/importie karty, zapisywać CEFR z odpowiedzi AI

**Etap B — Backfill istniejących kart:**
1. Migracja SQL przypisuje `cefr_level` do istniejących kart na podstawie prostej heurystyki (student level jako fallback)
2. Opcjonalnie: przyszły batch job przez AI dla dokładniejszej klasyfikacji

---

## Szczegółowa implementacja

### Zmiana 1: Nowa kolumna `cefr_level` w `flashcard_cards`

**Migracja SQL:**
```sql
ALTER TABLE public.flashcard_cards 
ADD COLUMN cefr_level TEXT DEFAULT NULL;

COMMENT ON COLUMN public.flashcard_cards.cefr_level IS 
  'CEFR level (A1-C2) of the word/phrase, assigned by AI during creation';
```

**Backfill istniejących kart** — na podstawie poziomu studenta (tymczasowy fallback):
```sql
UPDATE flashcard_cards fc
SET cefr_level = CASE
  WHEN s.english_level ILIKE '%A1%' OR s.english_level ILIKE '%Beginner%' THEN 'A1'
  WHEN s.english_level ILIKE '%A2%' OR s.english_level ILIKE '%Elementary%' 
       OR s.english_level ILIKE '%Pre-Intermediate%' THEN 'A2'
  WHEN s.english_level ILIKE '%B1%' OR s.english_level ILIKE '%Intermediate%' THEN 'B1'
  WHEN s.english_level ILIKE '%B2%' OR s.english_level ILIKE '%Upper%' THEN 'B2'
  WHEN s.english_level ILIKE '%C1%' OR s.english_level ILIKE '%Advanced%' THEN 'C1'
  WHEN s.english_level ILIKE '%C2%' OR s.english_level ILIKE '%Proficiency%' THEN 'C2'
  ELSE 'A2'
END
FROM flashcard_sets fs
JOIN students s ON fs.student_id = s.id
WHERE fc.set_id = fs.id
  AND fc.cefr_level IS NULL;
```

### Zmiana 2: Rozszerzenie `translate-flashcard` Edge Function

**Plik:** `supabase/functions/translate-flashcard/index.ts`

Dodać do requestu do OpenAI drugie pytanie o CEFR level. Zamiast osobnego API call, rozszerzyć system prompt:

**Dla mode `translation`:**
```
You are a professional translator and English level assessor. 
1. Translate the given English text to ${target_language}. 
2. Assess the CEFR level (A1, A2, B1, B2, C1, or C2) of the English word/phrase.

Respond in JSON format: {"translation": "...", "cefr_level": "B1"}

CEFR guidelines: A1=basic daily words (house, eat, big), A2=common everyday (improve, restaurant), 
B1=workplace/opinion (experience, complaint), B2=abstract/formal (responsibility, hypothesis), 
C1=academic/nuanced (mitigate, inherent), C2=rare/literary (obfuscate, ephemeral).
Consider: frequency, abstractness, morphological complexity, collocational range.
```

**Dla mode `definition`:**
```
You are an English language teacher and level assessor.
1. Provide a clear, concise definition (under 20 words, simple English for ESL).
2. Assess the CEFR level (A1, A2, B1, B2, C1, or C2) of the word/phrase.

Respond in JSON format: {"translation": "...", "cefr_level": "B1"}
```

**Zmiana parsowania odpowiedzi:**
```typescript
// Parse response - try JSON first, fallback to plain text
let translation = '';
let cefr_level = 'A2'; // default fallback
const content = data.choices[0]?.message?.content?.trim() || '';

try {
  const parsed = JSON.parse(content);
  translation = parsed.translation || '';
  cefr_level = parsed.cefr_level || 'A2';
} catch {
  // Fallback: old format, plain text response
  translation = content;
  cefr_level = 'A2';
}

return new Response(
  JSON.stringify({ translation, cefr_level }),
  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
);
```

**Ważne:** `response_format: { type: "json_object" }` dodać do requestu OpenAI żeby wymusić JSON.

### Zmiana 3: Zapisywanie CEFR przy tworzeniu kart

**Pliki do zmiany:**
- `src/hooks/useFlashcardTranslation.tsx` — po invoke, odczytać `data.cefr_level`
- `src/hooks/useFlashcardDefinition.tsx` — jw.
- `src/components/flashcards/ImportFromVocabularyModal.tsx` — jw.
- `src/components/flashcards/QuickAddWordToFlashcardsModal.tsx` — jw.
- `src/components/flashcards/QuickImportToFlashcardsModal.tsx` — jw.

We wszystkich tych miejscach: zwrócić `cefr_level` z hooka, a `addCard` w `useFlashcardCards.tsx` przyjmie opcjonalne `cefr_level` i zapisze do bazy.

**Zmiana w `useFlashcardCards.tsx` linia 55-60:**
```typescript
const { error } = await supabase
  .from('flashcard_cards')
  .insert({
    ...data,
    card_position: data.card_position ?? (maxPosition + 1),
    // cefr_level is part of data if provided
  });
```

**Zmiana w `src/types/flashcards.ts`:**
```typescript
export interface FlashcardCard {
  // ... existing fields
  cefr_level: string | null;  // ← NOWE
}

export interface CreateFlashcardCard {
  // ... existing fields
  cefr_level?: string;  // ← NOWE
}
```

### Zmiana 4: Nowy trigger `log_flashcard_review_event()`

**Migracja SQL — pełna nowa wersja triggera:**
```sql
CREATE OR REPLACE FUNCTION public.log_flashcard_review_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_teacher_id UUID;
  v_card_front TEXT;
  v_card_back TEXT;
  v_cefr_level TEXT;
  v_back_type TEXT;
  v_mastery_value INTEGER;
  v_skill_id TEXT;
  v_difficulty_multiplier NUMERIC;
BEGIN
  -- Get student/teacher from set
  SELECT fs.student_id, fs.teacher_id, fs.back_type 
  INTO v_student_id, v_teacher_id, v_back_type
  FROM public.flashcard_sets fs
  WHERE fs.id = NEW.set_id;

  -- Get card content and CEFR level
  SELECT fc.front_text, fc.back_text, COALESCE(fc.cefr_level, 'A2')
  INTO v_card_front, v_card_back, v_cefr_level
  FROM public.flashcard_cards fc
  WHERE fc.id = NEW.card_id;

  IF v_student_id IS NOT NULL AND v_teacher_id IS NOT NULL THEN
    -- Build canonical skill_id
    v_skill_id := 'ns.' || v_cefr_level || '.vocabulary.definition_' ||
      trim(both '_' from regexp_replace(
        regexp_replace(
          regexp_replace(lower(COALESCE(v_card_front, 'unknown')), '[\s\-]+', '_', 'g'),
          '[^a-z0-9_]', '', 'g'),
        '_+', '_', 'g'
      ));

    -- Difficulty multiplier based on back_type
    -- definition mode = harder (EN→EN), translation = easier (EN→native)
    v_difficulty_multiplier := CASE 
      WHEN COALESCE(v_back_type, 'translation') = 'definition' THEN 0.9
      ELSE 1.0
    END;

    -- Weighted mastery formula based on SM-2 parameters
    v_mastery_value := ROUND((CASE 
      WHEN NEW.last_quality_rating < 2 THEN 0
      WHEN NEW.repetition >= 4 AND NEW.interval_days >= 21 THEN 100
      WHEN NEW.repetition >= 3 AND NEW.interval_days >= 6 THEN 90
      WHEN NEW.repetition = 2 THEN 70
      WHEN NEW.repetition = 1 THEN 50
      ELSE 60
    END) * v_difficulty_multiplier);
    
    INSERT INTO public.student_events (
      student_id, teacher_id, event_type, event_source, source_id,
      event_payload, skill_ids, element_type, mastery
    ) VALUES (
      v_student_id, v_teacher_id,
      'flashcard_review', 'flashcard', NEW.set_id,
      jsonb_build_object(
        'card_id', NEW.card_id,
        'set_id', NEW.set_id,
        'direction', NEW.direction,
        'back_type', COALESCE(v_back_type, 'translation'),
        'cefr_level', v_cefr_level,
        'card_front', v_card_front,
        'card_back', v_card_back,
        'mastery', v_mastery_value,
        'easiness_factor', NEW.easiness_factor,
        'repetition', NEW.repetition,
        'interval_days', NEW.interval_days,
        'total_reviews', NEW.total_reviews,
        'time_spent_seconds', ROUND(COALESCE(NEW.last_response_time_ms, 0) / 1000.0, 1)
      ),
      ARRAY[v_skill_id],        -- ← NOWE: skill_ids
      'vocabulary',              -- ← NOWE: element_type
      v_mastery_value
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log flashcard review event: %', SQLERRM;
    RETURN NEW;
END;
$$;
```

### Zmiana 5: Backfill starych eventów (skill_ids + element_type)

```sql
-- Update existing flashcard_review events that are missing element_type
UPDATE student_events
SET element_type = 'vocabulary'
WHERE event_type = 'flashcard_review' 
  AND element_type IS NULL;

-- Backfill skill_ids for events that have card_front but no skill_ids
-- (using newly assigned cefr_level from flashcard_cards)
UPDATE student_events se
SET skill_ids = ARRAY[
  'ns.' || COALESCE(fc.cefr_level, 'A2') || '.vocabulary.definition_' ||
    trim(both '_' from regexp_replace(
      regexp_replace(
        regexp_replace(lower(COALESCE((se.event_payload->>'card_front')::text, 'unknown')), 
          '[\s\-]+', '_', 'g'),
        '[^a-z0-9_]', '', 'g'),
      '_+', '_', 'g'
    ))
]
FROM flashcard_cards fc
WHERE se.event_type = 'flashcard_review'
  AND (se.event_payload->>'card_id')::uuid = fc.id
  AND (se.skill_ids IS NULL OR se.skill_ids = '{}');
```

---

## Zmieniane pliki

| Plik | Zmiana |
|------|--------|
| Migracja SQL | `cefr_level` kolumna + backfill + nowy trigger + backfill eventów |
| `supabase/functions/translate-flashcard/index.ts` | CEFR level w odpowiedzi AI, JSON format |
| `src/types/flashcards.ts` | `cefr_level` w `FlashcardCard` i `CreateFlashcardCard` |
| `src/hooks/useFlashcardTranslation.tsx` | Odczyt `cefr_level` z odpowiedzi |
| `src/hooks/useFlashcardDefinition.tsx` | Odczyt `cefr_level` z odpowiedzi |
| `src/components/flashcards/ImportFromVocabularyModal.tsx` | Przekazanie `cefr_level` |
| `src/components/flashcards/QuickAddWordToFlashcardsModal.tsx` | Przekazanie `cefr_level` |
| `src/components/flashcards/QuickImportToFlashcardsModal.tsx` | Przekazanie `cefr_level` |
| `src/integrations/supabase/types.ts` | Regeneracja typów (automatyczna) |
| `docs/TECHNICAL_DOCUMENTATION.md` | Dokumentacja |
| `docs/CURRENT_STATE_ANALYSIS.md` | Status |

## Co NIE zmienia się

- SM-2 algorytm w `useFlashcardLearning.tsx` — bez zmian
- `FlashcardLearningCard.tsx` — UI karty bez zmian
- `student_skill_metrics` — trigger `refresh_skill_metrics` automatycznie użyje nowych `skill_ids`
- `extract_skill_category()` — format `ns.{CEFR}.vocabulary.*` jest już obsługiwany
- `extract_micro_skill()` — `vocabulary` prefix jest obsługiwany

## Potencjalne ryzyka

1. **OpenAI JSON format** — `response_format: { type: "json_object" }` wymaga żeby w system prompt było słowo "JSON". Jest — w naszym nowym prompcie.
2. **Backward compat** — jeśli `translate-flashcard` zostanie wywołane przez stary kod który nie czyta `cefr_level`, nic się nie psuje — po prostu ignoruje dodatkowe pole.
3. **Backfill CEFR accuracy** — tymczasowy backfill na podstawie poziomu studenta nie jest idealny (student B1 może mieć słowo A1 i C1), ale jest lepszy niż NULL. Przyszły batch AI job to naprawi.

