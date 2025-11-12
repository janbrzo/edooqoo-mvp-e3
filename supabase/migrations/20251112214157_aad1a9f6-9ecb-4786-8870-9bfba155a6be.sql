-- Drop existing function
DROP FUNCTION IF EXISTS public.get_worksheet_by_share_token(text);

-- Recreate with media fields
CREATE OR REPLACE FUNCTION public.get_worksheet_by_share_token(p_share_token text)
RETURNS TABLE(
  id uuid, 
  title text, 
  ai_response text, 
  html_content text, 
  created_at timestamp with time zone, 
  teacher_email text,
  selected_image jsonb,
  selected_audio jsonb,
  audio_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.title,
    w.ai_response,
    w.html_content,
    w.created_at,
    w.teacher_email,
    w.selected_image,
    w.selected_audio,
    w.audio_url
  FROM worksheets w
  WHERE w.share_token = p_share_token
    AND w.deleted_at IS NULL
    AND (w.share_expires_at IS NULL OR w.share_expires_at > NOW());
END;
$function$;