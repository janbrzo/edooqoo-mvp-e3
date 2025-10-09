-- Add selected_image column to worksheets table for ONE-PHASE picture mode
-- This stores the image selected by the teacher before worksheet generation

ALTER TABLE public.worksheets
ADD COLUMN selected_image JSONB DEFAULT NULL;

COMMENT ON COLUMN public.worksheets.selected_image IS 'Stores selected Unsplash image data (id, url, thumbnail, description, photographer, photographerUrl) for picture-based worksheets';