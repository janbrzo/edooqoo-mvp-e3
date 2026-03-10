

# Fix: "Failed to generate share link" na flashcardach

## Problem
Funkcja `generate_flashcard_share_token` w Supabase probuje ustawic kolumne `share_expires_at` w tabeli `flashcard_sets`, ale **ta kolumna nie istnieje**. Stad blad 400 przy kazdym kliknieciu "Share" na secie flashcardow.

Blad z bazy:
```
column "share_expires_at" of relation "flashcard_sets" does not exist
```

## Rozwiazanie

Jedna migracja SQL -- dodac brakujaca kolumne:

```sql
ALTER TABLE public.flashcard_sets
ADD COLUMN share_expires_at timestamptz;
```

To wszystko. Funkcja `generate_flashcard_share_token` juz istnieje i jest poprawna -- potrzebuje tylko tej kolumny. Kod frontendowy tez jest poprawny. Po dodaniu kolumny share zacznie dzialac.

## Co NIE wymaga zmian
- Kod frontendu (useFlashcardSets, FlashcardSetCard, ShareFlashcardSetModal) -- wszystko OK
- Funkcja SQL `generate_flashcard_share_token` -- poprawna
- Zadne edge functions

