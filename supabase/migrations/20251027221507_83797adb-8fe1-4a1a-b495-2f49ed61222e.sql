-- Add base64_backup column to worksheets table
ALTER TABLE public.worksheets 
ADD COLUMN IF NOT EXISTS base64_backup TEXT NULL;

COMMENT ON COLUMN public.worksheets.base64_backup IS 'Base64 backup of AI-generated image for emergency fallback - stored separately to keep selected_image JSONB small and readable';