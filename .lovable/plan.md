
# Plan: Flashcards DSLM — IMPLEMENTED ✅

## Co zostało wdrożone

### 1. CEFR Level per Card ✅
- Kolumna `flashcard_cards.cefr_level` (TEXT) — AI przypisuje A1-C2
- Backfill istniejących kart na podstawie `students.english_level`
- `translate-flashcard` Edge Function zwraca `{ translation, cefr_level }` (JSON mode)
- Badge CEFR widoczny w: `AddFlashcardModal` (preview), `FlashcardSetEditor` (karty), `FlashcardDisplay` (nauka)
- Typ `LearningCard` rozszerzony o `cefr_level`

### 2. Ujednolicone skill_ids w eventach ✅
- Trigger `log_flashcard_review_event()` generuje `skill_ids = ['ns.{CEFR}.vocabulary.definition_{word}']`
- `element_type = 'vocabulary'` ustawiany automatycznie
- Backfill starych eventów

### 3. Trudność — 3-scenariuszowy mnożnik ✅
- Direction 1 (widzi EN term): mnożnik 0.70 (najłatwiejsze)
- Direction 2 + translation (widzi native): mnożnik 1.0 (normalne)
- Direction 2 + definition (widzi EN def): mnożnik 1.1 (najtrudniejsze, cap 100)
- `difficulty_multiplier` zapisywany w `event_payload`

### 4. Confidence propagation ✅
- `ItemEvaluation` rozszerzony o pole `confidence?: number`
- `buildItemEvaluations()` propaguje `nanoSkill.confidence` do `item_evaluations`
- Confidence trafia do `student_events.event_payload.nano_skill_ratings`

### 5. Share links naprawione ✅
- `ShareAllFlashcardSetsModal` → URL `/my/{teacherCalendarToken}/flashcards`
- `ShareFlashcardSetModal` → URL z `email` + `returnTo` query params
- `teacherCalendarToken` pobierany z `calendar_settings.public_calendar_token`
- Prop chain: StudentPage → FlashcardSetsSection → FlashcardSetCard/FlashcardSetEditor → ShareModals

### 6. Browse — dwa przyciski Back ✅
- "Back to Flashcards" → wraca do `returnTo` (np. `/my/{token}/flashcards`)
- "Back to Dashboard" → wraca do `/my/{token}` (bez `/flashcards`)
- Quit fallback zmieniony z `/my-flashcards/{email}` na `/`
