-- 1. Remove expiration from get_worksheet_by_share_token
CREATE OR REPLACE FUNCTION public.get_worksheet_by_share_token(p_share_token text)
 RETURNS TABLE(id uuid, title text, ai_response text, html_content text, created_at timestamptz, teacher_email text, selected_image jsonb, selected_audio jsonb, audio_url text)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT w.id, w.title, w.ai_response, w.html_content, w.created_at, w.teacher_email, w.selected_image, w.selected_audio, w.audio_url
  FROM worksheets w
  WHERE w.share_token = p_share_token AND w.deleted_at IS NULL;
END;
$function$;

-- 2. Remove expiration from get_homework_by_share_token
CREATE OR REPLACE FUNCTION public.get_homework_by_share_token(p_share_token text)
 RETURNS TABLE(id uuid, title text, created_at timestamptz, deadline timestamptz, selected_exercises jsonb, selected_image jsonb, selected_audio jsonb, audio_url text, student_name text, student_english_level text, teacher_first_name text, teacher_last_name text, teacher_email text, source_worksheet_title text)
 LANGUAGE plpgsql SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.homework_assignments ha
  SET view_count = COALESCE(ha.view_count, 0) + 1,
      viewed_at = COALESCE(ha.viewed_at, NOW())
  WHERE ha.share_token = p_share_token;

  RETURN QUERY
  SELECT ha.id, ha.title, ha.created_at, ha.deadline, ha.selected_exercises,
    w.selected_image, w.selected_audio, w.audio_url,
    s.name as student_name, s.english_level as student_english_level,
    p.first_name as teacher_first_name, p.last_name as teacher_last_name, p.email as teacher_email,
    w.title as source_worksheet_title
  FROM homework_assignments ha
  LEFT JOIN students s ON ha.student_id = s.id
  LEFT JOIN profiles p ON ha.teacher_id = p.id
  LEFT JOIN worksheets w ON ha.source_worksheet_id = w.id
  WHERE ha.share_token = p_share_token;
END;
$function$;

-- 3. Remove expiration from get_flashcard_set_by_share_token
CREATE OR REPLACE FUNCTION public.get_flashcard_set_by_share_token(p_share_token text)
 RETURNS TABLE(id uuid, title text, description text, is_bidirectional boolean, student_name text, student_native_language text, teacher_first_name text, teacher_last_name text, teacher_email text, cards_count bigint, created_at timestamptz)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT fs.id, fs.title, fs.description, fs.is_bidirectional,
    s.name as student_name, COALESCE(s.native_language, 'Spanish') as student_native_language,
    p.first_name as teacher_first_name, p.last_name as teacher_last_name, p.email as teacher_email,
    (SELECT COUNT(*) FROM public.flashcard_cards fc WHERE fc.set_id = fs.id AND fc.deleted_at IS NULL) as cards_count,
    fs.created_at
  FROM public.flashcard_sets fs
  JOIN public.students s ON fs.student_id = s.id
  JOIN public.profiles p ON fs.teacher_id = p.id
  WHERE fs.share_token = p_share_token AND fs.deleted_at IS NULL;
END;
$function$;

-- 4. Update generate_worksheet_share_token to set null expiration
CREATE OR REPLACE FUNCTION public.generate_worksheet_share_token(p_worksheet_id uuid, p_teacher_id uuid, p_expires_hours integer DEFAULT null)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $function$
DECLARE new_token TEXT;
BEGIN
  new_token := encode(extensions.gen_random_bytes(32), 'hex');
  UPDATE public.worksheets 
  SET share_token = new_token, share_expires_at = null
  WHERE id = p_worksheet_id AND teacher_id = p_teacher_id AND deleted_at IS NULL;
  IF FOUND THEN RETURN new_token; ELSE RETURN NULL; END IF;
END;
$function$;

-- 5. Update flashcard_sets RLS - remove expiration check
DROP POLICY IF EXISTS "Public can view sets by share_token" ON public.flashcard_sets;
CREATE POLICY "Public can view sets by share_token" ON public.flashcard_sets
  FOR SELECT USING (share_token IS NOT NULL AND deleted_at IS NULL);

-- 6. Nullify all existing share_expires_at
UPDATE public.worksheets SET share_expires_at = NULL WHERE share_expires_at IS NOT NULL;
UPDATE public.homework_assignments SET share_expires_at = NULL WHERE share_expires_at IS NOT NULL;
UPDATE public.flashcard_sets SET share_expires_at = NULL WHERE share_expires_at IS NOT NULL;