
# Plan: Flashcards DSLM — IMPLEMENTED ✅

## Co zostało wdrożone

### 1. CEFR Level per Card ✅
- Kolumna `flashcard_cards.cefr_level` (TEXT) — AI przypisuje A1-C2
- Backfill istniejących kart na podstawie `students.english_level`
- `translate-flashcard` Edge Function zwraca `{ translation, cefr_level }` (JSON mode)

### 2. Ujednolicone skill_ids w eventach ✅
- Trigger `log_flashcard_review_event()` generuje `skill_ids = ['ns.{CEFR}.vocabulary.definition_{word}']`
- `element_type = 'vocabulary'` ustawiany automatycznie
- Backfill starych eventów

### 3. Trudność definition vs translation ✅
- `definition` mode (EN→EN): mastery * 0.9 (trudniejsze)
- `translation` mode (EN→native): mastery * 1.0 (łatwiejsze)
- `back_type` i `direction` w `event_payload`

### 4. Frontend ✅
- `useFlashcardTranslation` i `useFlashcardDefinition` zwracają `cefrLevel`
- Wszystkie modale (`AddFlashcardModal`, `QuickAddWord`, `QuickImport`, `ImportFromVocabulary`) przekazują `cefr_level`
- `normalizeVocabularySheet` zachowuje `cefr_level`
