-- Add media_metadata column to worksheets table
ALTER TABLE public.worksheets
ADD COLUMN IF NOT EXISTS media_metadata JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.worksheets.media_metadata IS 'Stores media information: selected images, regeneration timestamps, etc.';