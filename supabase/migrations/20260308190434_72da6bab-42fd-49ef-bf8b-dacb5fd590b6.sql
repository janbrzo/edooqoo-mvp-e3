-- Drop share_expires_at columns (now always NULL, no longer used)
ALTER TABLE public.worksheets DROP COLUMN IF EXISTS share_expires_at;
ALTER TABLE public.homework_assignments DROP COLUMN IF EXISTS share_expires_at;
ALTER TABLE public.flashcard_sets DROP COLUMN IF EXISTS share_expires_at;