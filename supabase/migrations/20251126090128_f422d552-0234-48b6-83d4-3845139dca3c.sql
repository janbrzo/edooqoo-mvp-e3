-- Problem 6: Add back_type column to flashcard_sets for Translation vs Definition
ALTER TABLE public.flashcard_sets
ADD COLUMN back_type TEXT DEFAULT 'translation' CHECK (back_type IN ('translation', 'definition'));