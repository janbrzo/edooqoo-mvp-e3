
-- Update cleanup function to also handle base64_backup field
CREATE OR REPLACE FUNCTION public.cleanup_worksheet_base64()
RETURNS TABLE (
  worksheets_cleaned INTEGER,
  table_size_before TEXT,
  table_size_after TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cleaned_count INTEGER;
  size_before TEXT;
  size_after TEXT;
BEGIN
  -- Get size before cleanup
  SELECT pg_size_pretty(pg_total_relation_size('worksheets')) INTO size_before;
  
  -- Cleanup selected_image: remove base64 from all relevant fields
  UPDATE public.worksheets
  SET selected_image = 
    CASE
      WHEN selected_image->>'url' LIKE 'data:%' THEN
        jsonb_set(selected_image, '{url}', 'null'::jsonb)
      ELSE selected_image
    END
  WHERE deleted_at IS NULL
    AND selected_image->>'url' LIKE 'data:%';
  
  UPDATE public.worksheets
  SET selected_image = 
    jsonb_set(selected_image, '{thumbnail}', 'null'::jsonb)
  WHERE deleted_at IS NULL
    AND selected_image->>'thumbnail' LIKE 'data:%';
  
  UPDATE public.worksheets
  SET selected_image = 
    jsonb_set(selected_image, '{ai_generated_url}', 'null'::jsonb)
  WHERE deleted_at IS NULL
    AND selected_image->>'ai_generated_url' LIKE 'data:%';
  
  -- NEW: Cleanup base64_backup field
  UPDATE public.worksheets
  SET selected_image = 
    jsonb_set(selected_image, '{base64_backup}', 'null'::jsonb)
  WHERE deleted_at IS NULL
    AND selected_image ? 'base64_backup'
    AND selected_image->>'base64_backup' LIKE 'data:%';
  
  -- Cleanup selected_audio: remove base64 from all relevant fields
  UPDATE public.worksheets
  SET selected_audio = 
    CASE
      WHEN selected_audio->>'url' LIKE 'data:%' THEN
        jsonb_set(selected_audio, '{url}', 'null'::jsonb)
      ELSE selected_audio
    END
  WHERE deleted_at IS NULL
    AND selected_audio->>'url' LIKE 'data:%';
  
  UPDATE public.worksheets
  SET selected_audio = 
    jsonb_set(selected_audio, '{ai_generated_audio_url}', 'null'::jsonb)
  WHERE deleted_at IS NULL
    AND selected_audio->>'ai_generated_audio_url' LIKE 'data:%';
  
  -- NEW: Cleanup base64_backup field in audio
  UPDATE public.worksheets
  SET selected_audio = 
    jsonb_set(selected_audio, '{base64_backup}', 'null'::jsonb)
  WHERE deleted_at IS NULL
    AND selected_audio ? 'base64_backup'
    AND selected_audio->>'base64_backup' LIKE 'data:%';
  
  -- Count affected worksheets
  SELECT COUNT(*)::INTEGER INTO cleaned_count
  FROM public.worksheets
  WHERE deleted_at IS NULL;
  
  -- Get size after cleanup
  SELECT pg_size_pretty(pg_total_relation_size('worksheets')) INTO size_after;
  
  -- Return statistics
  RETURN QUERY SELECT cleaned_count, size_before, size_after;
END;
$$;

COMMENT ON FUNCTION public.cleanup_worksheet_base64() IS 
'Removes base64 data URLs from selected_image and selected_audio in worksheets table. 
Handles fields: url, thumbnail, ai_generated_url, base64_backup.
Keeps all other metadata (descriptions, photographer info, R2 URLs, etc.).
Returns statistics about cleaned worksheets and table size reduction.';
