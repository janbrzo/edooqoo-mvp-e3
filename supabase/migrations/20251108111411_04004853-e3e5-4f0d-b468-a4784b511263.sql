-- Remove base64 backup columns from worksheets table
-- These columns are no longer needed as we're using URLs for media storage

ALTER TABLE public.worksheets 
DROP COLUMN IF EXISTS base64_backup,
DROP COLUMN IF EXISTS audio_base64_backup;