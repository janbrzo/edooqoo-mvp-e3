# ✅ ZREALIZOWANO - Naprawa logowania eventów

## Co zostało zrobione:

### 1. SQL Migration - usunięcie podwójnego logowania
- Usunięto stare triggery: `trigger_log_worksheet_answer_event`, `homework_answer_event_trigger`
- Usunięto stare funkcje: `log_worksheet_answer_event()`, `log_homework_answer_event()` 
- Pozostały tylko nowe triggery: `trg_worksheet_answer_to_events`, `trg_homework_answer_to_events`

### 2. Oczyszczony event_payload
Usunięto zbędne pola `answers` i `mastery` - dane są teraz tylko w `nano_skill_ratings`:
```json
{
  "answer_id": "uuid",
  "exercise_index": 6,
  "exercise_type": "true-false-picture",
  "nano_skill_ratings": [...],
  "time_spent_seconds": 8
}
```

### 3. Frontend - dodano question_index
W `src/utils/masteryCalculator.ts`:
- Interfejs `ItemEvaluation` ma nowe pole `question_index: number`
- Funkcja `buildItemEvaluations()` dodaje `question_index: idx` do każdego elementu

### Rezultat:
- Jeden event per zapis odpowiedzi (nie dwa)
- Czysty payload bez duplikacji
- Każdy nano_skill_rating ma swój `question_index` dla precyzyjnego mapowania

