-- Add prompt column to homework_assignments table
-- This will store the AI prompt used when generating additional exercises for homework

ALTER TABLE public.homework_assignments 
ADD COLUMN IF NOT EXISTS prompt text;

COMMENT ON COLUMN public.homework_assignments.prompt IS 'The AI prompt used to generate additional exercises for this homework assignment';