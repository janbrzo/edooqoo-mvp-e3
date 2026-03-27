CREATE OR REPLACE FUNCTION public.verify_homework_student_email(
    p_homework_id UUID,
    p_email TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_student_email TEXT;
    v_student_id UUID;
BEGIN
    SELECT 
        ha.student_id,
        s.student_email
    INTO v_student_id, v_student_email
    FROM public.homework_assignments ha
    LEFT JOIN public.students s ON ha.student_id = s.id
    WHERE ha.id = p_homework_id;
    
    IF v_student_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN (v_student_email IS NOT NULL AND lower(v_student_email) = lower(p_email));
END;
$$;