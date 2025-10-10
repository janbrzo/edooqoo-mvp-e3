-- Add selected_image column to worksheets table for storing picture data
-- This column will store full Unsplash image object as JSONB
ALTER TABLE public.worksheets 
ADD COLUMN IF NOT EXISTS selected_image JSONB DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.worksheets.selected_image IS 'Stores Unsplash image data (url, description, photographer, id) for picture-based exercises';