-- Add selected_audio JSONB column to worksheets table for storing complete audio object
ALTER TABLE public.worksheets 
ADD COLUMN IF NOT EXISTS selected_audio JSONB;

-- Add comment to describe the column
COMMENT ON COLUMN public.worksheets.selected_audio IS 'Complete audio object including URL, transcript, duration, voice, and metadata';
