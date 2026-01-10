-- PROBLEM 8: Add content to knowledge_entry_added event_payload
-- Update the trigger function to include content in the event_payload

CREATE OR REPLACE FUNCTION public.log_knowledge_entry_event()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.student_events (
    student_id, 
    teacher_id, 
    event_type, 
    event_source, 
    source_id, 
    event_payload,
    element_type
  ) VALUES (
    NEW.student_id,
    NEW.teacher_id,
    'knowledge_entry_added',
    'teacher',
    NEW.id,
    jsonb_build_object(
      'category', NEW.category,
      'tags', COALESCE(NEW.tags, '{}'),
      'entry_source', NEW.entry_source,
      'content', NEW.content
    ),
    NEW.category
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to log knowledge entry event: %', SQLERRM;
    RETURN NEW;
END;
$$;